# Draft Day Combine Tracker

Personal NFL Draft Combine tracker app with live simulated updates.

## Features

- Live update ticker that refreshes every few seconds
- Fastest player by each combine day
- Dedicated 40-yard dash leaderboard
- Draft projection leaderboard based on combine metrics
- Position leaders and draft stock watch sections
- Current board table for all tracked players

## Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm start` - run the production server (serves API + built app)

## Real Data Setup (Sportradar)

- Backend proxy reads from `.env` and serves normalized data at `/api/combine/normalized`.
- Required env vars:
  - `SPORTRADAR_API_KEY`
  - `SPORTRADAR_COMBINE_URL` (your exact combine endpoint from Sportradar docs)
  - `VITE_USE_REAL_DATA=true`
  - `CORS_ORIGIN` (optional, comma-separated allowed domains)
- Run `npm run dev` to launch backend + frontend together.
- If the API is unavailable or endpoint has no combine rows yet, the UI auto-falls back to simulation mode.

## Notes

The app supports real API mode and simulation fallback. For production, keep API keys server-side only.

## Railway Deploy (Single Service)

- Deploy this repo as one Railway service.
- Railway Build Command: `npm install && npm run build`
- Railway Start Command: `npm start`
- Set env vars in Railway:
  - `SPORTRADAR_API_KEY`
  - `SPORTRADAR_COMBINE_URL`
  - `VITE_USE_REAL_DATA=true`
  - `CORS_ORIGIN=https://your-railway-domain.up.railway.app` (optional)
- After deploy, your app and API are served from the same domain:
  - UI: `/`
  - Health: `/api/health`
  - Data: `/api/combine/normalized`
