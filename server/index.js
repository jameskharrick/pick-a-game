require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Supabase is optional — rating routes return 503 if not configured
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
    : null;

function requireSupabase(res) {
  if (!supabase) {
    res.status(503).json({
      error: 'Rating system not configured. Add SUPABASE_URL and SUPABASE_SERVICE_KEY to .env',
    });
    return false;
  }
  return true;
}

app.use(cors());
app.use(express.json());

const STEAM_BASE = 'https://api.steampowered.com';

// Parse a raw input into either a vanity URL slug or a 64-bit Steam ID string.
function parseInput(input) {
  input = input.trim();
  const profilesMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profilesMatch) return { type: 'steamid', value: profilesMatch[1] };
  const idMatch = input.match(/steamcommunity\.com\/id\/([^/]+)/);
  if (idMatch) return { type: 'vanity', value: idMatch[1] };
  if (/^\d{17}$/.test(input)) return { type: 'steamid', value: input };
  // Treat any remaining string as a vanity name
  return { type: 'vanity', value: input };
}

// GET /api/resolve-player?input=<steamid_or_url>
app.get('/api/resolve-player', async (req, res) => {
  const { input } = req.query;
  if (!input) return res.status(400).json({ error: 'input is required' });

  try {
    const parsed = parseInput(input);
    let steamId = parsed.value;

    if (parsed.type === 'vanity') {
      const vanityRes = await axios.get(`${STEAM_BASE}/ISteamUser/ResolveVanityURL/v1/`, {
        params: { key: STEAM_API_KEY, vanityurl: parsed.value },
      });
      const vanityData = vanityRes.data.response;
      if (vanityData.success !== 1) {
        return res.status(404).json({ error: 'Could not resolve Steam vanity URL. Check the username or URL.' });
      }
      steamId = vanityData.steamid;
    }

    const summaryRes = await axios.get(`${STEAM_BASE}/ISteamUser/GetPlayerSummaries/v2/`, {
      params: { key: STEAM_API_KEY, steamids: steamId },
    });
    const players = summaryRes.data.response.players;
    if (!players || players.length === 0) {
      return res.status(404).json({ error: 'Steam profile not found.' });
    }

    const player = players[0];
    return res.json({
      steamId: player.steamid,
      displayName: player.personaname,
      avatarUrl: player.avatarfull || player.avatarmedium || player.avatar,
    });
  } catch (err) {
    console.error('resolve-player error:', err.message);
    return res.status(500).json({ error: 'Steam API error. Please try again.' });
  }
});

// GET /api/games?steamId=<id>
app.get('/api/games', async (req, res) => {
  const { steamId } = req.query;
  if (!steamId) return res.status(400).json({ error: 'steamId is required' });

  try {
    const gamesRes = await axios.get(`${STEAM_BASE}/IPlayerService/GetOwnedGames/v1/`, {
      params: {
        key: STEAM_API_KEY,
        steamid: steamId,
        include_appinfo: 1,
        include_played_free_games: 1,
      },
    });

    const data = gamesRes.data.response;
    if (!data || !data.games) {
      // Private profile or no games
      if (data && data.game_count === 0) {
        return res.json([]);
      }
      return res.status(403).json({ error: 'Profile is private or has no games visible.' });
    }

    const games = data.games.map((g) => ({
      appId: g.appid,
      name: g.name,
      iconUrl: g.img_icon_url
        ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
        : null,
      playtimeForever: g.playtime_forever || 0,
    }));

    return res.json(games);
  } catch (err) {
    console.error('games error:', err.message);
    if (err.response?.status === 403) {
      return res.status(403).json({ error: 'Profile is private or games are hidden.' });
    }
    return res.status(500).json({ error: 'Steam API error. Please try again.' });
  }
});

// GET /api/ratings?steamIds=123,456
// Returns all ratings submitted by these players: { [appId]: [{ steamId, rating }] }
app.get('/api/ratings', async (req, res) => {
  if (!requireSupabase(res)) return;
  const { steamIds } = req.query;
  if (!steamIds) return res.status(400).json({ error: 'steamIds is required' });

  const ids = steamIds.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 50);
  if (ids.length === 0) return res.json({});

  const { data, error } = await supabase
    .from('ratings')
    .select('steam_id, app_id, game_name, rating, updated_at')
    .in('steam_id', ids);

  if (error) {
    console.error('ratings fetch error:', error.message);
    return res.status(500).json({ error: 'Could not fetch ratings.' });
  }

  // Group by appId
  const map = {};
  for (const row of data) {
    const key = String(row.app_id);
    if (!map[key]) map[key] = [];
    map[key].push({ steamId: row.steam_id, gameName: row.game_name, rating: row.rating, ratedAt: row.updated_at });
  }
  return res.json(map);
});

// POST /api/ratings
// Body: { steamId, appId, gameName, rating }  — upserts one rating
app.post('/api/ratings', async (req, res) => {
  if (!requireSupabase(res)) return;
  const { steamId, appId, gameName, rating } = req.body;

  if (!steamId || !appId || !rating) {
    return res.status(400).json({ error: 'steamId, appId, and rating are required' });
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 10) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 10' });
  }

  const { error } = await supabase.from('ratings').upsert(
    {
      steam_id: String(steamId),
      app_id: Number(appId),
      game_name: gameName || null,
      rating: Math.round(rating),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'steam_id,app_id' }
  );

  if (error) {
    console.error('rating upsert error:', error.message);
    return res.status(500).json({ error: 'Could not save rating.' });
  }
  return res.json({ ok: true });
});

// DELETE /api/ratings
// Body: { steamId, appId } — removes one player's rating for a game
app.delete('/api/ratings', async (req, res) => {
  if (!requireSupabase(res)) return;
  const { steamId, appId } = req.body;

  if (!steamId || !appId) {
    return res.status(400).json({ error: 'steamId and appId are required' });
  }

  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('steam_id', String(steamId))
    .eq('app_id', Number(appId));

  if (error) {
    console.error('rating delete error:', error.message);
    return res.status(500).json({ error: 'Could not remove rating.' });
  }
  return res.json({ ok: true });
});

// Category IDs that indicate a game has online/local multiplayer or co-op
const MULTIPLAYER_CATEGORY_IDS = new Set([
  1,  // Multi-player
  9,  // Co-op
  27, // Cross-Platform Multiplayer
  36, // Online Co-op
  37, // Local Co-op
  38, // LAN Co-op
  47, // Online PvP
]);

// GET /api/categories?appIds=570,440,730
// Fetches Steam store categories for up to 50 appIds at once.
// Returns { [appId]: { multiplayer: boolean | null } }
// null means the store API returned no data (region-locked, unlisted, etc.)
app.get('/api/categories', async (req, res) => {
  const { appIds } = req.query;
  if (!appIds) return res.status(400).json({ error: 'appIds is required' });

  const ids = appIds
    .split(',')
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0)
    .slice(0, 50);

  if (ids.length === 0) return res.json({});

  const results = {};

  // Fetch 5 at a time to avoid hammering the store API
  for (let i = 0; i < ids.length; i += 5) {
    const chunk = ids.slice(i, i + 5);
    await Promise.all(
      chunk.map(async (appId) => {
        try {
          const r = await axios.get('https://store.steampowered.com/api/appdetails', {
            params: { appids: appId, filters: 'categories' },
            timeout: 6000,
          });
          const appData = r.data?.[appId];
          if (appData?.success && Array.isArray(appData.data?.categories)) {
            const catIds = appData.data.categories.map((c) => c.id);
            results[appId] = { multiplayer: catIds.some((id) => MULTIPLAYER_CATEGORY_IDS.has(id)) };
          } else {
            results[appId] = { multiplayer: null };
          }
        } catch {
          results[appId] = { multiplayer: null };
        }
      })
    );
  }

  return res.json(results);
});

app.listen(PORT, () => {
  console.log(`Game Night Picker API running on http://localhost:${PORT}`);
});
