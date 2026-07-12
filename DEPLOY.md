# Deploy KeyClash online (shareable link)

After deploy, friends open your public URL, create/join rooms, and play together.

## What is already configured

| File | Purpose |
|------|---------|
| `package.json` | `npm start` → `node server.js` |
| `Procfile` | `web: node server.js` |
| `railway.toml` | Railway start + healthcheck |
| `render.yaml` | Render Blueprint |
| `Dockerfile` | Optional container deploy |
| `GET /api/health` | Health check for hosts |

Uses `process.env.PORT` automatically (required by Railway/Render).

---

## A) Railway (fastest for most people)

### From GitHub (recommended)

1. Create a free account: [railway.app](https://railway.app)
2. Put this project on **GitHub** (new repo → upload `KeyClash` files)
3. Railway → **New Project** → **Deploy from GitHub repo**
4. Select the repo → deploy
5. **Settings → Networking → Generate Domain**
6. Copy URL, e.g. `https://keyclash-production.up.railway.app`
7. Share that link + room code with friends

### From CLI

```bash
npm i -g @railway/cli
railway login
cd KeyClash
railway init
railway up
railway domain
```

No env vars needed. Railway injects `PORT`.

---

## B) Render

1. Account: [render.com](https://render.com)
2. Push repo to GitHub
3. **New → Web Service** → connect repo
4. Settings:
   - **Runtime:** Node
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/api/health`
5. Create Web Service → wait for live URL (`*.onrender.com`)

Or **New → Blueprint** and select the repo (uses `render.yaml`).

> Free tier may sleep after idle; first load can take ~30–60s.

### Uptime & 1v1 reliability

- **Keep-alive:** the app pings `/api/health` on a timer when `RENDER_EXTERNAL_URL` is set (Render sets this automatically). Default interval **8 minutes**. Override with `KEEP_ALIVE_MINUTES` or `KEEP_ALIVE_URL`.
- Open tabs also ping health every ~8 minutes (while visible) to reduce sleep.
- Free tier still sleeps eventually — **cold start UI** covers that. For reliable always-on 1v1:
  - Upgrade to a **paid Render instance**, and/or
  - Attach a **custom domain**
- Privacy-friendly stats: `GET /api/stats` (1v1 match counts, languages — no personal data).

---

## C) Docker (any VPS / Railway Docker)

```bash
docker build -t keyclash .
docker run -p 3000:3000 keyclash
```

---

## After you have a public URL

1. Open the URL on two devices/browsers  
2. Host: **Create Room** → copy code  
3. Friends: same URL → **Join** with code  
4. Race → each player sees **Your result** + **graph** (WPM + progress over time)

### Share template

```text
KeyClash: https://YOUR-APP-URL
Room code: ABC12
```

---

## Notes

- Rooms are **in-memory** — server restart wipes open rooms  
- Leaderboard file `data/leaderboard.json` may reset on some free hosts with ephemeral disks  
- Use the **HTTPS** URL only (don’t mix http/https)  
- Local still works: `npm start` → http://localhost:3000  

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails | Node 18+; check deploy logs for `npm install` |
| App sleeps (Render free) | First request wakes it; upgrade plan if needed |
| Socket won’t connect | Open the same host URL as the page (no file://) |
| Port error | Don’t hardcode 3000 in production — app already uses `PORT` |
