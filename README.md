# Game Night Picker 🎮

Find games your whole friend group can play together using Steam libraries. Add Steam profiles, filter by who owns what, and let the slot machine pick tonight's game.

## Features

- Add players by Steam ID or profile URL (e.g. `https://steamcommunity.com/id/username`)
- Automatic library fetching via Steam API
- Custom / non-Steam players with manually added games
- Filter games by: All must own / Most own / At least 2 / Anyone owns
- Search by game name
- Full-screen slot machine picker animation
- Dark gaming aesthetic, fully responsive
- All player data persisted in localStorage

---

## Setup

### 1. Get a Steam API Key

1. Go to [https://steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey)
2. Log in with your Steam account
3. Enter any domain name (e.g. `localhost` for local dev)
4. Copy your API key

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and paste your key:

```
STEAM_API_KEY=your_actual_key_here
```

> **Important:** Never commit `.env` — it's in `.gitignore`.

### 2b. Set Up Steam Auth

The app requires a Steam login. The sign-in flow uses Steam OpenID 2.0 — users click "Sign in through Steam", authenticate on Steam's servers, and are redirected back with a verified Steam ID stored in a JWT cookie.

Add these to your `.env`:

```
# A long random secret — generate one with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=a-long-random-string-change-me

# Local dev values:
STEAM_RETURN_URL=http://localhost:3001/auth/steam/return
STEAM_REALM=http://localhost:3001
CLIENT_URL=http://localhost:5173
```

**How the local dev flow works:**
- Steam redirects back to `localhost:3001` (the Express server on port 3001)
- Express sets an httpOnly JWT cookie on `localhost`, then redirects to `localhost:5173` (Vite)
- Subsequent API calls from Vite include the cookie automatically via the Vite proxy

**For Vercel production**, all three variables should point to your deployed domain:
```
STEAM_RETURN_URL=https://your-app.vercel.app/auth/steam/return
STEAM_REALM=https://your-app.vercel.app
CLIENT_URL=https://your-app.vercel.app
```

Also add `JWT_SECRET` in the Vercel dashboard under **Settings → Environment Variables**.

> **Note:** Steam profiles must be public for friend-list permissions to work. If a player's profile is private, the app fails closed and only allows rating their own games.

### 2c. Set Up Supabase (optional — for the rating system)

Ratings are stored in Supabase. Without it, everything else works fine — rating routes return a 503 that the frontend silently ignores.

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql) to create the `ratings` table
3. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **`service_role` secret key** → `SUPABASE_SERVICE_KEY` (⚠️ keep this server-side only)
4. Add both to your `.env`:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

For Vercel deployment, add these same two variables in the Vercel dashboard under **Settings → Environment Variables**.

### 3. Install Dependencies

```bash
# From the project root
npm install
npm install --prefix client
npm install --prefix server
```

Or use the convenience script:

```bash
npm run install:all
```

### 4. Run Locally

```bash
npm run dev
```

This starts both the Vite dev server (port 5173) and Express API (port 3001) concurrently. The Vite server proxies `/api/*` requests to Express automatically.

Open [http://localhost:5173](http://localhost:5173).

---

## Deploy to Vercel

### Prerequisites
- [Vercel CLI](https://vercel.com/cli): `npm i -g vercel`
- Or deploy via the Vercel dashboard at [vercel.com](https://vercel.com)

### Steps

1. **Push your repo to GitHub** (make sure `.env` is gitignored)

2. **Add environment variables in Vercel:**
   - Dashboard → Your Project → Settings → Environment Variables
   - Add `STEAM_API_KEY`, `JWT_SECRET`, `STEAM_RETURN_URL`, `STEAM_REALM`, `CLIENT_URL`
   - Optionally add `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` for ratings

3. **Deploy:**
   ```bash
   vercel --prod
   ```
   Or connect your GitHub repo in the Vercel dashboard for automatic deploys.

The `vercel.json` routes `/api/*` to the Express server and all other paths to the Vite-built frontend.

---

## Project Structure

```
game-night-picker/
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # usePlayers, useToast, useGameFilter
│   │   ├── utils/        # api.js (fetch wrapper), storage.js (localStorage)
│   │   └── App.jsx
│   └── package.json
├── server/
│   ├── index.js          # Express API routes
│   └── package.json
├── .env                  # Local secrets (gitignored)
├── .env.example
├── vercel.json
└── package.json          # Root scripts + concurrently
```

## Notes

- Steam profiles must be **public** for library fetching to work. Private profiles show a warning on the player card.
- Free-to-play games are included in library fetches.
- localStorage keys are all prefixed with `gnp_` to avoid collisions.
