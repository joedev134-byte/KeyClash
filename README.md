# KeyClash

Neon multiplayer typing race for up to **10 players**.

## Quick start

```bash
npm install
npm start
```

Open **http://localhost:3000**

## Features

- **Multiplayer rooms** (max 10) with host controls, ready, chat, reconnect
- **Languages:** English, Tagalog, Spanish, Indonesian, Japanese (romaji), Portuguese, French, German (not mixed)
- **Difficulty:** Easy / Normal / Hard
- **Game modes**
  - **Classic** — finish the passage first
  - **Best of 3** — first to 2 race wins
  - **Timed 60s** — type as far as you can
  - **Sudden Death** — one mistake and you’re out
- **Practice Solo** (same language/mode/difficulty)
- **Find 1v1 Opponent** — online random matchmaking (real player, not ghost)
  - Empty-queue fallback (Practice / Create Room / Share invite)
  - **Rematch** same opponent or **Find new**
- **Leaderboard** — server + this-device personal best
- **Daily Challenge** — same passage per day + global board, **streaks & badges**
- **Live stats strip** — 1v1s today · top language · online / queue
- **Invite while searching** — duel link (`/?duel=CODE`) for guaranteed friend 1v1
- **Stats** — `GET /api/stats` + `GET /api/ping` for uptime monitors
- **Fairness** — paste block, 1v1 disconnect forfeit, WPM caps
- **Deploy-ready** — see [DEPLOY.md](./DEPLOY.md) (UptimeRobot tips)

## Deploy (shareable link)

Step-by-step: **[DEPLOY.md](./DEPLOY.md)**

Quick path:
1. Push repo to GitHub  
2. Railway or Render → deploy Node app (`npm start`)  
3. Generate public domain  
4. Share `https://your-app...` + room code  

Configs: `Procfile`, `render.yaml`, `railway.toml`, `Dockerfile`

## After each race

Every player sees **Your result**:
- Place, WPM, peak/avg WPM, accuracy, errors, time  
- Live **graph**: WPM (pink) + progress (cyan) over the race  
- Plus full standings list

## API

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check |
| `GET /api/practice?difficulty=&language=&mode=` | Practice passage |
| `GET /api/leaderboard` | Top scores |
| `POST /api/leaderboard` | Submit score |
| `GET /api/modes` | Mode list |

## Stack

Node.js · Express · Socket.IO · Vanilla HTML/CSS/JS
