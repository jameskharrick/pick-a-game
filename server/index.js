require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3001;
const STEAM_API_KEY = process.env.STEAM_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const STEAM_BASE = 'https://api.steampowered.com';
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Supabase (optional — rating routes degrade gracefully without it) ─────────

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

// ─── Core middleware ───────────────────────────────────────────────────────────

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// express-session is only used transiently during the Steam OpenID dance.
// Actual user sessions live in the JWT cookie, not here.
app.use(
  session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: IS_PROD, maxAge: 3_600_000 }, // 1 h — just for OpenID handshake
  })
);
app.use(passport.initialize());
app.use(passport.session());

// ─── Passport / Steam OpenID ──────────────────────────────────────────────────

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (process.env.STEAM_RETURN_URL) {
  passport.use(
    new SteamStrategy(
      {
        returnURL: process.env.STEAM_RETURN_URL,
        realm: process.env.STEAM_REALM || process.env.STEAM_RETURN_URL.replace('/auth/steam/return', ''),
        apiKey: STEAM_API_KEY,
      },
      (_identifier, profile, done) => {
        done(null, {
          steamId: profile.id,
          displayName: profile.displayName,
          avatarUrl:
            profile.photos?.[2]?.value ||
            profile.photos?.[1]?.value ||
            profile.photos?.[0]?.value ||
            null,
        });
      }
    )
  );
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const token = req.cookies?.gnp_session;
  if (!token) return res.status(401).json({ error: 'Not authenticated. Please sign in.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.clearCookie('gnp_session');
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

// ─── Friends list cache ───────────────────────────────────────────────────────

const friendsCache = new Map(); // steamId → { ids: string[], fetchedAt: number }
const FRIENDS_TTL_MS = 5 * 60 * 1000;

async function getCachedFriendList(steamId) {
  const cached = friendsCache.get(steamId);
  if (cached && Date.now() - cached.fetchedAt < FRIENDS_TTL_MS) return cached.ids;

  try {
    const r = await axios.get(`${STEAM_BASE}/ISteamUser/GetFriendList/v1/`, {
      params: { key: STEAM_API_KEY, steamid: steamId, relationship: 'friend' },
      timeout: 5000,
    });
    const ids = r.data.friendslist?.friends?.map((f) => f.steamid) || [];
    friendsCache.set(steamId, { ids, fetchedAt: Date.now() });
    return ids;
  } catch {
    // Private friends list or API error → fail closed (no access)
    friendsCache.set(steamId, { ids: [], fetchedAt: Date.now() });
    return [];
  }
}

async function canRateFor(req, res, next) {
  const { steamId } = req.body;
  if (!steamId) return next(); // let the route's own validation catch missing fields
  const me = req.user.steamId;
  if (String(steamId) === String(me)) return next(); // always allowed for own rating
  const friends = await getCachedFriendList(me);
  if (friends.includes(String(steamId))) return next();
  return res.status(403).json({
    error: 'You can only submit ratings for yourself or your Steam friends.',
  });
}

// ─── Auth routes ──────────────────────────────────────────────────────────────

// Redirect browser to Steam login page
app.get('/auth/steam', (req, res, next) => {
  if (!process.env.STEAM_RETURN_URL) {
    return res.status(503).json({ error: 'Auth not configured. Set STEAM_RETURN_URL in .env' });
  }
  passport.authenticate('steam')(req, res, next);
});

// Steam redirects here after login
app.get(
  '/auth/steam/return',
  (req, res, next) => {
    if (!process.env.STEAM_RETURN_URL) return res.redirect(`${CLIENT_URL}?auth=error`);
    passport.authenticate('steam', { failureRedirect: `${CLIENT_URL}?auth=failed` })(req, res, next);
  },
  (req, res) => {
    const token = jwt.sign(req.user, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('gnp_session', token, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(CLIENT_URL);
  }
);

// Return current authenticated user (lightweight — just reads the cookie)
app.get('/auth/me', (req, res) => {
  const token = req.cookies?.gnp_session;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { steamId, displayName, avatarUrl } = jwt.verify(token, JWT_SECRET);
    return res.json({ steamId, displayName, avatarUrl });
  } catch {
    res.clearCookie('gnp_session');
    return res.status(401).json({ error: 'Session expired' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('gnp_session', { httpOnly: true, secure: IS_PROD, sameSite: 'lax' });
  req.session?.destroy?.();
  res.json({ ok: true });
});

// ─── Friends API ──────────────────────────────────────────────────────────────

// Returns the Steam friend IDs of the authenticated user (used by the client
// to determine which RatingWidgets are editable)
app.get('/api/friends', requireAuth, async (req, res) => {
  try {
    const friendIds = await getCachedFriendList(req.user.steamId);
    return res.json({ friendIds });
  } catch {
    return res.status(500).json({ error: 'Could not fetch friends list.' });
  }
});

// ─── Steam API routes ─────────────────────────────────────────────────────────

function parseInput(input) {
  input = input.trim();
  const profilesMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (profilesMatch) return { type: 'steamid', value: profilesMatch[1] };
  const idMatch = input.match(/steamcommunity\.com\/id\/([^/]+)/);
  if (idMatch) return { type: 'vanity', value: idMatch[1] };
  if (/^\d{17}$/.test(input)) return { type: 'steamid', value: input };
  return { type: 'vanity', value: input };
}

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
      if (data && data.game_count === 0) return res.json([]);
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

// ─── Ratings routes ───────────────────────────────────────────────────────────

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

  const map = {};
  for (const row of data) {
    const key = String(row.app_id);
    if (!map[key]) map[key] = [];
    map[key].push({
      steamId: row.steam_id,
      gameName: row.game_name,
      rating: row.rating,
      ratedAt: row.updated_at,
    });
  }
  return res.json(map);
});

// requireAuth + canRateFor protect both write routes
app.post('/api/ratings', requireAuth, canRateFor, async (req, res) => {
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

app.delete('/api/ratings', requireAuth, canRateFor, async (req, res) => {
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

// ─── Categories route ─────────────────────────────────────────────────────────

const MULTIPLAYER_CATEGORY_IDS = new Set([1, 9, 27, 36, 37, 38, 47]);

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

// ─── Static files (production) ────────────────────────────────────────────────

const DIST = path.join(__dirname, '../client/dist');
app.use(express.static(DIST));
app.get('*', (_req, res) => res.sendFile(path.join(DIST, 'index.html')));

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Game Night Picker API running on http://localhost:${PORT}`);
  if (!process.env.STEAM_RETURN_URL) {
    console.warn('⚠  STEAM_RETURN_URL not set — auth routes will return 503');
  }
  if (!supabase) {
    console.warn('⚠  Supabase not configured — rating routes will return 503');
  }
});
