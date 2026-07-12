const crypto = require("crypto");
const fs = require("fs");
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const {
  pickRaceText,
  normalizeDifficulty,
  normalizeLanguage,
  normalizeMode,
  normalizeParagraphs,
  normalizeCategory,
  listDifficulties,
  listLanguages,
  listModes,
  listCategories,
  LANG_LABELS,
  CATEGORIES,
  MODES,
  MIN_PARAGRAPHS,
  MAX_PARAGRAPHS,
} = require("./passages");
const leaderboard = require("./leaderboard");
const analytics = require("./analytics");
const daily = require("./daily");
const { censorText } = require("./censor");

/** Competitive WPM ceiling (multiplayer / 1v1). */
const MAX_RACE_WPM = 220;
/** Max characters accepted per second of elapsed time (~264 WPM theoretical). */
const MAX_CHARS_PER_SEC = 22;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  pingTimeout: 25000,
  pingInterval: 8000,
  // Helpful behind Render / reverse proxies
  allowEIO3: true,
  transports: ["websocket", "polling"],
});

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 10;
const QUICK_MATCH_MAX = 2;
const COUNTDOWN_MS = 3000;
const RACE_TIMEOUT_MS = 120000;
const TIMED_MS = 60000;
const RECONNECT_GRACE_MS = 60000;
const QUICK_MATCH_AUTOSTART_MS = 2200;
/** After this wait, queue may match across languages (low-traffic soft match). */
const MATCH_SOFT_LANG_MS = 15000;

/** Online 1v1 queue: socketId → { socket, name, language, difficulty, mode, paragraphs, category, joinedAt } */
const matchQueue = new Map();
/** Friend duel invites while searching: code → { hostSocketId, entry, createdAt } */
const duelInvites = new Map();

app.use(express.json({ limit: "32kb" }));

function requestOrigin(req) {
  // Prefer HTTPS in production (Render / reverse proxies)
  let proto = (req.get("x-forwarded-proto") || req.protocol || "https")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (proto !== "http" && proto !== "https") proto = "https";
  // Force https for non-local hosts so social crawlers accept og:image
  const host = (req.get("x-forwarded-host") || req.get("host") || "localhost")
    .split(",")[0]
    .trim();
  const isLocal = /^localhost\b|^127\.0\.0\.1\b/i.test(host);
  if (!isLocal) proto = "https";
  return proto + "://" + host;
}

/** Inject absolute OG image URLs so Discord/FB/Messenger previews work (PNG required). */
app.get(["/", "/index.html"], (req, res) => {
  try {
    const indexPath = path.join(__dirname, "public", "index.html");
    let html = fs.readFileSync(indexPath, "utf8");
    const origin = requestOrigin(req);
    // Cache-bust query helps scrapers pick up image updates
    const ogImage = origin + "/og-image.png?v=2";
    html = html
      .replace(/__OG_URL__/g, origin + "/")
      .replace(/__OG_IMAGE__/g, ogImage);
    res.set("Cache-Control", "public, max-age=300");
    res.type("html").send(html);
  } catch (e) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  }
});

// Explicit OG image route with long cache + correct content-type
app.get("/og-image.png", (req, res) => {
  const file = path.join(__dirname, "public", "og-image.png");
  res.set({
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=86400",
  });
  res.sendFile(file);
});

app.use(express.static(path.join(__dirname, "public")));

/** Lightweight ping for external uptime monitors (UptimeRobot, cron-job.org). */
app.get("/api/ping", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ ok: true, t: Date.now() });
});

app.get("/api/health", (_req, res) => {
  try {
    analytics.trackHealthPing();
  } catch (_) {}
  const online =
    (io.engine && io.engine.clientsCount) ||
    (io.sockets && io.sockets.sockets && io.sockets.sockets.size) ||
    0;
  res.json({
    ok: true,
    service: "keyclash",
    rooms: rooms.size,
    queue: matchQueue.size,
    online: online,
    duels: duelInvites.size,
    uptimeSec: Math.floor(process.uptime()),
  });
});

/** Privacy-friendly aggregate stats (1v1 counts, languages — no personal data). */
app.get("/api/stats", (_req, res) => {
  res.set("Cache-Control", "no-store");
  const base = analytics.getPublicStats();
  const online =
    (io.engine && io.engine.clientsCount) ||
    (io.sockets && io.sockets.sockets && io.sockets.sockets.size) ||
    0;
  res.json({
    ...base,
    live: {
      online,
      queue: matchQueue.size,
      rooms: rooms.size,
      duels: duelInvites.size,
    },
  });
});

app.get("/api/daily/profile", (req, res) => {
  res.set("Cache-Control", "no-store");
  const name = req.query.name || "Racer";
  res.json({
    ok: true,
    profile: daily.getProfile(name),
    badges: daily.listBadges(),
  });
});

app.get("/api/daily", (req, res) => {
  res.set("Cache-Control", "no-store");
  const challenge = daily.getDailyPassage(req.query.language);
  const board = daily.getBoard(req.query.language, req.query.limit);
  res.json({ ...challenge, board: board.entries, boardMeta: board });
});

app.get("/api/daily/board", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(daily.getBoard(req.query.language, req.query.limit));
});

app.post("/api/daily", (req, res) => {
  const result = daily.submitDaily(req.body || {});
  if (!result.ok) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

app.get("/api/difficulties", (_req, res) => {
  res.json({ difficulties: listDifficulties() });
});

app.get("/api/languages", (_req, res) => {
  res.json({ languages: listLanguages() });
});

app.get("/api/modes", (_req, res) => {
  res.json({ modes: listModes() });
});

app.get("/api/categories", (_req, res) => {
  res.json({ categories: listCategories() });
});

app.get("/api/practice", (req, res) => {
  const difficulty = normalizeDifficulty(req.query.difficulty);
  const language = normalizeLanguage(req.query.language);
  const mode = normalizeMode(req.query.mode || "classic");
  const paragraphs = normalizeParagraphs(req.query.paragraphs);
  const category = normalizeCategory(req.query.category);
  const passage = pickRaceText(mode, difficulty, language, paragraphs, category);
  res.json({
    difficulty,
    language,
    languageLabel: LANG_LABELS[language] || language,
    mode,
    category,
    categoryLabel: (CATEGORIES[category] && CATEGORIES[category].label) || category,
    paragraphs,
    passage,
    length: passage.length,
    durationMs: mode === "timed" ? TIMED_MS : null,
  });
});

app.get("/api/leaderboard", (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  const top = leaderboard.getTop(req.query.limit, {
    mode: req.query.mode || undefined,
    language: req.query.language || undefined,
    difficulty: req.query.difficulty || undefined,
  });
  res.json({ entries: top, updatedAt: Date.now() });
});

app.post("/api/leaderboard", (req, res) => {
  const result = leaderboard.submitScore(req.body || {});
  if (!result.ok) {
    res.status(400).json(result);
    return;
  }
  // Notify all connected clients so home leaderboard re-renders live
  io.emit("leaderboard:update", {
    entry: result.entry,
    top: leaderboard.getTop(15),
  });
  res.json(result);
});

const COLORS = [
  "#00f5d4",
  "#f72585",
  "#7b2cbf",
  "#ffd60a",
  "#4cc9f0",
  "#ff6b35",
  "#06d6a0",
  "#ef476f",
  "#9b5de5",
  "#fee440",
];

/** @type {Map<string, object>} */
const rooms = new Map();

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  if (rooms.has(code)) return generateCode();
  return code;
}

function makeToken() {
  return crypto.randomBytes(16).toString("hex");
}

function usedColors(room) {
  return new Set([...room.players.values()].map((p) => p.color));
}

function nextColor(room) {
  const used = usedColors(room);
  return COLORS.find((c) => !used.has(c)) || COLORS[room.players.size % COLORS.length];
}

function publicPlayer(p) {
  return {
    id: p.id,
    name: p.name,
    color: p.color,
    ready: p.ready,
    rematchWanted: !!p.rematchWanted,
    isHost: p.isHost,
    progress: p.progress,
    wpm: p.wpm,
    accuracy: p.accuracy,
    correct: p.correct,
    errors: p.errors,
    finished: p.finished,
    finishTime: p.finishTime,
    place: p.place,
    connected: !p.disconnected,
    eliminated: !!p.eliminated,
    seriesWins: p.seriesWins || 0,
    team: p.team || null,
  };
}

function computeTeamStats(room) {
  const teams = { A: null, B: null };
  for (const key of ["A", "B"]) {
    const members = [...room.players.values()].filter(
      (p) => p.team === key && !p.disconnected
    );
    if (!members.length) {
      teams[key] = {
        id: key,
        members: 0,
        progress: 0,
        wpm: 0,
        accuracy: 100,
        finishedCount: 0,
        place: null,
      };
      continue;
    }
    const progress = Math.round(
      members.reduce((s, p) => s + (p.progress || 0), 0) / members.length
    );
    const wpm = Math.round(members.reduce((s, p) => s + (p.wpm || 0), 0) / members.length);
    const accuracy = Math.round(
      members.reduce((s, p) => s + (p.accuracy != null ? p.accuracy : 100), 0) / members.length
    );
    const finishedCount = members.filter((p) => p.finished || p.eliminated).length;
    teams[key] = {
      id: key,
      members: members.length,
      progress,
      wpm,
      accuracy,
      finishedCount,
      place: null,
    };
  }

  // Rank teams: higher progress, then WPM, then accuracy
  const order = ["A", "B"].sort((a, b) => {
    const ta = teams[a];
    const tb = teams[b];
    return tb.progress - ta.progress || tb.wpm - ta.wpm || tb.accuracy - ta.accuracy;
  });
  order.forEach((id, i) => {
    teams[id].place = i + 1;
  });
  return teams;
}

function assignTeam(room) {
  const a = [...room.players.values()].filter((p) => p.team === "A").length;
  const b = [...room.players.values()].filter((p) => p.team === "B").length;
  return a <= b ? "A" : "B";
}

function roomSnapshot(room) {
  const teams = room.mode === "team" ? computeTeamStats(room) : null;
  return {
    code: room.code,
    status: room.status,
    hostId: room.hostId,
    difficulty: room.difficulty,
    language: room.language,
    languageLabel: LANG_LABELS[room.language] || room.language,
    paragraphs: room.paragraphs,
    category: room.category || "all",
    categoryLabel:
      (CATEGORIES[room.category || "all"] && CATEGORIES[room.category || "all"].label) ||
      "All Facts",
    minParagraphs: MIN_PARAGRAPHS,
    maxParagraphs: MAX_PARAGRAPHS,
    mode: room.mode,
    modeLabel: (MODES[room.mode] && MODES[room.mode].label) || room.mode,
    modeMeta: MODES[room.mode] || MODES.classic,
    passage: room.status === "lobby" ? null : room.passage,
    passageLength: room.passage ? room.passage.length : 0,
    raceStart: room.raceStart,
    raceDurationMs: room.raceDurationMs,
    round: room.round,
    seriesRace: room.seriesRace || 0,
    seriesComplete: !!room.seriesComplete,
    seriesChampionId: room.seriesChampionId || null,
    teams,
    players: [...room.players.values()].map(publicPlayer),
    maxPlayers: room.maxPlayers || MAX_PLAYERS,
    quickMatch: !!room.quickMatch,
    reconnectGraceMs: RECONNECT_GRACE_MS,
  };
}

function normalizeQuickMatchMode(mode) {
  const m = normalizeMode(mode);
  // Ghost/team need special setups — 1v1 random uses race modes only
  if (m === "ghost" || m === "team") return "classic";
  return m;
}

function clearDuelInvitesForSocket(socketId) {
  for (const [code, inv] of duelInvites) {
    if (inv.hostSocketId === socketId) duelInvites.delete(code);
  }
}

function leaveMatchQueue(socketId) {
  clearDuelInvitesForSocket(socketId);
  if (matchQueue.has(socketId)) {
    matchQueue.delete(socketId);
    return true;
  }
  return false;
}

function generateDuelCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  if (duelInvites.has(code) || rooms.has(code)) return generateDuelCode();
  return code;
}

function findQueueMatch(entry) {
  const now = Date.now();
  const entryWait = now - (entry.joinedAt || now);
  let best = null;
  let bestScore = -1;
  for (const [id, other] of matchQueue) {
    if (id === entry.socketId) continue;
    if (!other.socket || !other.socket.connected) {
      matchQueue.delete(id);
      continue;
    }
    const otherWait = now - (other.joinedAt || now);
    const softLang =
      entryWait >= MATCH_SOFT_LANG_MS && otherWait >= MATCH_SOFT_LANG_MS;
    if (other.language !== entry.language && !softLang) continue;

    let score = other.language === entry.language ? 20 : 5;
    if (other.difficulty === entry.difficulty) score += 5;
    if (other.mode === entry.mode) score += 3;
    if (other.category === entry.category) score += 1;
    // Prefer longer-waiting opponents
    score += Math.min(10, Math.floor(otherWait / 5000));
    if (score > bestScore) {
      bestScore = score;
      best = other;
    }
  }
  return best;
}

function createQuickMatchRoom(entryA, entryB) {
  const code = generateCode();
  // Prefer shared language; if soft-matched across langs, use first player's
  const language =
    entryA.language === entryB.language ? entryA.language : entryA.language;
  const difficulty =
    entryA.difficulty === entryB.difficulty ? entryA.difficulty : "normal";
  const mode = entryA.mode === entryB.mode ? entryA.mode : "classic";
  const paragraphs = Math.max(entryA.paragraphs || 1, entryB.paragraphs || 1);
  const category =
    entryA.category === entryB.category ? entryA.category : "all";

  const playerA = createPlayer(entryA.socketId, entryA.name, COLORS[0], true, null);
  const playerB = createPlayer(entryB.socketId, entryB.name, COLORS[1], false, null);
  // Both ready — race auto-starts shortly
  playerA.ready = true;
  playerB.ready = true;
  playerA.rematchWanted = false;
  playerB.rematchWanted = false;

  const room = {
    code,
    players: new Map([
      [entryA.socketId, playerA],
      [entryB.socketId, playerB],
    ]),
    status: "lobby",
    hostId: entryA.socketId,
    difficulty,
    language,
    mode,
    paragraphs: normalizeParagraphs(paragraphs),
    category: normalizeCategory(category),
    passage: "",
    raceStart: null,
    raceDurationMs: RACE_TIMEOUT_MS,
    countdownTimer: null,
    raceTimer: null,
    round: 1,
    seriesRace: 0,
    seriesComplete: false,
    seriesChampionId: null,
    maxPlayers: QUICK_MATCH_MAX,
    quickMatch: true,
  };

  rooms.set(code, room);

  const sockA = entryA.socket;
  const sockB = entryB.socket;

  sockA.join(code);
  sockB.join(code);
  sockA.data.roomCode = code;
  sockB.data.roomCode = code;

  const snap = roomSnapshot(room);
  const payloadA = {
    ok: true,
    room: snap,
    session: sessionPayload(room, playerA),
    opponent: {
      ...publicPlayer(playerB),
      badgeWpm: entryB.lastWpm || null,
    },
  };
  const payloadB = {
    ok: true,
    room: snap,
    session: sessionPayload(room, playerB),
    opponent: {
      ...publicPlayer(playerA),
      badgeWpm: entryA.lastWpm || null,
    },
  };

  sockA.emit("match:found", payloadA);
  sockB.emit("match:found", payloadB);

  emitRoom(room);

  try {
    analytics.trackMatch1v1({ language, mode, difficulty });
  } catch (_) {}

  // Auto-start 1v1 after a short “found!” moment
  setTimeout(() => {
    if (!rooms.has(code)) return;
    const r = rooms.get(code);
    if (!r || !r.quickMatch) return;
    if (r.status !== "lobby") return;
    if (activePlayers(r).length < 2) return;
    startCountdown(r);
  }, QUICK_MATCH_AUTOSTART_MS);

  return room;
}

function tryPairFromQueue(entry) {
  const other = findQueueMatch(entry);
  if (!other) return null;
  matchQueue.delete(entry.socketId);
  matchQueue.delete(other.socketId);
  return createQuickMatchRoom(entry, other);
}

/** Periodic re-pair so soft language match kicks in after wait thresholds. */
setInterval(() => {
  const waiting = [...matchQueue.values()];
  for (const entry of waiting) {
    if (!matchQueue.has(entry.socketId)) continue;
    const paired = tryPairFromQueue(entry);
    if (paired) {
      // paired players removed from queue inside tryPairFromQueue
    }
  }
}, 3000);

function emitRoom(room) {
  io.to(room.code).emit("room:update", roomSnapshot(room));
}

function clearRoomTimers(room) {
  if (room.countdownTimer) {
    clearTimeout(room.countdownTimer);
    room.countdownTimer = null;
  }
  if (room.raceTimer) {
    clearTimeout(room.raceTimer);
    room.raceTimer = null;
  }
}

function clearPlayerGrace(player) {
  if (player.graceTimer) {
    clearTimeout(player.graceTimer);
    player.graceTimer = null;
  }
}

function resetRaceStats(player) {
  player.progress = 0;
  player.wpm = 0;
  player.accuracy = 100;
  player.correct = 0;
  player.errors = 0;
  player.finished = false;
  player.finishTime = null;
  player.place = null;
  player.eliminated = false;
}

function createPlayer(socketId, name, color, isHost, team) {
  return {
    id: socketId,
    token: makeToken(),
    name: sanitizeName(name),
    color,
    ready: false,
    isHost: !!isHost,
    team: team || null,
    progress: 0,
    wpm: 0,
    accuracy: 100,
    correct: 0,
    errors: 0,
    finished: false,
    finishTime: null,
    place: null,
    eliminated: false,
    seriesWins: 0,
    rematchWanted: false,
    disconnected: false,
    graceTimer: null,
  };
}

function rankFinishers(room) {
  const players = [...room.players.values()];

  if (room.mode === "team") {
    // Individual places still by progress/wpm; team places in computeTeamStats
    players
      .slice()
      .sort(
        (a, b) =>
          b.progress - a.progress ||
          b.wpm - a.wpm ||
          b.accuracy - a.accuracy ||
          a.errors - b.errors
      )
      .forEach((p, i) => {
        p.place = i + 1;
      });
    return;
  }

  if (room.mode === "timed") {
    players
      .slice()
      .sort(
        (a, b) =>
          b.correct - a.correct ||
          b.wpm - a.wpm ||
          b.accuracy - a.accuracy ||
          a.errors - b.errors
      )
      .forEach((p, i) => {
        p.place = i + 1;
        p.finished = true;
      });
    return;
  }

  if (room.mode === "sudden_death") {
    const survivors = players
      .filter((p) => p.finished && !p.eliminated)
      .sort((a, b) => (a.finishTime || 0) - (b.finishTime || 0));
    const dead = players
      .filter((p) => p.eliminated)
      .sort((a, b) => b.correct - a.correct || (a.finishTime || 0) - (b.finishTime || 0));
    const rest = players
      .filter((p) => !p.finished && !p.eliminated)
      .sort((a, b) => b.progress - a.progress || b.wpm - a.wpm);

    let place = 1;
    survivors.forEach((p) => {
      p.place = place++;
    });
    dead.forEach((p) => {
      p.place = place++;
    });
    rest.forEach((p) => {
      p.place = place++;
    });
    return;
  }

  const finishers = players
    .filter((p) => p.finished && p.finishTime != null && !p.eliminated)
    .sort((a, b) => a.finishTime - b.finishTime);
  finishers.forEach((p, i) => {
    p.place = i + 1;
  });
  const unfinished = players
    .filter((p) => !p.finished || p.eliminated)
    .sort((a, b) => b.progress - a.progress || b.wpm - a.wpm);
  unfinished.forEach((p, i) => {
    p.place = finishers.length + i + 1;
  });
}

function activePlayers(room) {
  return [...room.players.values()].filter((p) => !p.disconnected);
}

function maybeEndRace(room) {
  if (room.status !== "racing") return;
  const racers = activePlayers(room);
  if (racers.length === 0) {
    endRace(room);
    return;
  }

  if (room.mode === "timed") {
    // Ends only on timer
    return;
  }

  if (room.mode === "sudden_death") {
    const alive = racers.filter((p) => !p.eliminated && !p.finished);
    const completed = racers.filter((p) => p.finished && !p.eliminated);
    // End if someone finished clean, or only 0-1 alive left and rest eliminated/finished
    if (completed.length > 0) {
      // Mark remaining alive as finished? keep racing until all done or only one left
      // End when all are finished/eliminated OR one clean finish and others eliminated
      if (racers.every((p) => p.finished || p.eliminated)) {
        endRace(room);
        return;
      }
      // If one completed and everyone else eliminated, end
      if (completed.length >= 1 && racers.every((p) => p.finished || p.eliminated || p.id === completed[0].id)) {
        if (racers.filter((p) => !p.eliminated && !p.finished).length === 0) endRace(room);
      }
    }
    if (racers.every((p) => p.finished || p.eliminated)) endRace(room);
    // Last racer standing (all others eliminated)
    const stillIn = racers.filter((p) => !p.eliminated);
    if (stillIn.length <= 1 && racers.length > 1 && racers.some((p) => p.eliminated)) {
      stillIn.forEach((p) => {
        if (!p.finished) {
          p.finished = true;
          p.finishTime = Date.now() - (room.raceStart || Date.now());
          p.progress = Math.max(p.progress, 1);
        }
      });
      endRace(room);
    }
    return;
  }

  // classic / best_of_3
  if (racers.every((p) => p.finished)) endRace(room);
}

function applySeriesResults(room) {
  if (room.mode !== "best_of_3") return;
  room.seriesRace = (room.seriesRace || 0) + 1;
  const winner = [...room.players.values()].find((p) => p.place === 1);
  if (winner) winner.seriesWins = (winner.seriesWins || 0) + 1;

  const champ = [...room.players.values()].find((p) => (p.seriesWins || 0) >= 2);
  if (champ) {
    room.seriesComplete = true;
    room.seriesChampionId = champ.id;
  } else if (room.seriesRace >= 3) {
    room.seriesComplete = true;
    const top = [...room.players.values()].sort(
      (a, b) => (b.seriesWins || 0) - (a.seriesWins || 0) || (a.place || 99) - (b.place || 99)
    )[0];
    room.seriesChampionId = top ? top.id : null;
  } else {
    room.seriesComplete = false;
    room.seriesChampionId = null;
  }
}

function endRace(room) {
  if (room.status === "results") return;
  clearRoomTimers(room);
  room.status = "results";

  // Timed: finalize everyone with current stats
  if (room.mode === "timed") {
    const elapsed = Math.max(1, Date.now() - (room.raceStart || Date.now()));
    [...room.players.values()].forEach((p) => {
      p.finished = true;
      if (p.finishTime == null) p.finishTime = elapsed;
    });
  }

  rankFinishers(room);
  applySeriesResults(room);

  [...room.players.values()].forEach((p) => {
    p.ready = false;
    p.rematchWanted = false;
  });

  // Auto-submit top finisher to server leaderboard (best effort)
  const first = [...room.players.values()].find((p) => p.place === 1);
  if (first && first.wpm >= 5) {
    try {
      const result = leaderboard.submitScore({
        name: first.name,
        wpm: first.wpm,
        accuracy: first.accuracy,
        mode: room.mode,
        language: room.language,
        difficulty: room.difficulty,
        source: "multi",
      });
      if (result.ok) {
        io.emit("leaderboard:update", {
          entry: result.entry,
          top: leaderboard.getTop(15),
        });
      }
    } catch {
      /* ignore */
    }
  }

  io.to(room.code).emit("race:end", roomSnapshot(room));
  emitRoom(room);
}

function raceDurationForMode(mode) {
  if (mode === "timed") return TIMED_MS;
  return RACE_TIMEOUT_MS;
}

function startCountdown(room) {
  if (activePlayers(room).length < 1) return;
  clearRoomTimers(room);

  room.passage = pickRaceText(
    room.mode,
    room.difficulty,
    room.language,
    room.paragraphs,
    room.category
  );
  room.raceDurationMs = raceDurationForMode(room.mode);
  room.status = "countdown";
  room.raceStart = null;
  room.countdownEndsAt = Date.now() + COUNTDOWN_MS;
  [...room.players.values()].forEach(resetRaceStats);

  const countdownPayload = {
    duration: COUNTDOWN_MS,
    endsAt: room.countdownEndsAt,
    serverNow: Date.now(),
    passage: room.passage,
    difficulty: room.difficulty,
    language: room.language,
    mode: room.mode,
    raceDurationMs: room.raceDurationMs,
    snapshot: roomSnapshot(room),
  };
  io.to(room.code).emit("race:countdown", {
    ...countdownPayload,
    round: room.round,
  });
  emitRoom(room);

  room.countdownTimer = setTimeout(() => {
    room.status = "racing";
    room.raceStart = Date.now();
    room.countdownEndsAt = null;
    io.to(room.code).emit("race:start", {
      raceStart: room.raceStart,
      serverNow: Date.now(),
      passage: room.passage,
      difficulty: room.difficulty,
      language: room.language,
      mode: room.mode,
      raceDurationMs: room.raceDurationMs,
      snapshot: roomSnapshot(room),
    });
    emitRoom(room);
    room.raceTimer = setTimeout(() => endRace(room), room.raceDurationMs);
  }, COUNTDOWN_MS);
}

function sanitizeName(name) {
  const cleaned = String(name || "")
    .trim()
    .slice(0, 16)
    .replace(/[<>]/g, "");
  const censored = censorText(cleaned);
  return censored || "Racer";
}

function validateRoomCode(code) {
  const roomCode = String(code || "")
    .trim()
    .toUpperCase();
  if (!roomCode) {
    return { ok: false, error: "Enter a room code.", code: "CODE_REQUIRED" };
  }
  if (!/^[A-Z0-9]{4,6}$/.test(roomCode)) {
    return {
      ok: false,
      error: "Invalid room code. Use the 5-character code from your host.",
      code: "CODE_INVALID",
    };
  }
  return { ok: true, roomCode };
}

function removePlayerFromRoom(room, playerId, reason) {
  const player = room.players.get(playerId);
  if (!player) return;
  clearPlayerGrace(player);
  room.players.delete(playerId);

  if (room.players.size === 0) {
    clearRoomTimers(room);
    rooms.delete(room.code);
    return;
  }

  if (room.hostId === playerId) {
    const nextHost = activePlayers(room)[0] || room.players.values().next().value;
    if (nextHost) {
      room.hostId = nextHost.id;
      [...room.players.values()].forEach((p) => {
        p.isHost = p.id === nextHost.id;
      });
    }
  }

  io.to(room.code).emit("player:left", {
    id: playerId,
    hostId: room.hostId,
    reason: reason || "left",
    name: player.name,
  });
  emitRoom(room);
  if (room.status === "racing") maybeEndRace(room);
}

function scheduleDisconnect(room, player) {
  clearPlayerGrace(player);
  player.disconnected = true;
  player.ready = false;

  // 1v1 mid-race disconnect = forfeit (fairness)
  if (
    room.quickMatch &&
    room.status === "racing" &&
    !player.finished &&
    !player.eliminated
  ) {
    const elapsedMs = Math.max(1, Date.now() - (room.raceStart || Date.now()));
    player.eliminated = true;
    player.finished = true;
    player.finishTime = elapsedMs;
    player.progress = player.progress || 0;
    rankFinishers(room);
    io.to(room.code).emit("player:forfeit", {
      id: player.id,
      name: player.name,
      reason: "disconnect",
    });
    io.to(room.code).emit("player:eliminated", {
      id: player.id,
      name: player.name,
      correct: player.correct || 0,
      progress: player.progress || 0,
      forfeit: true,
    });
    emitRoom(room);
    maybeEndRace(room);
    // Still remove after short grace so reconnect can't rejoin mid-forfeit race
    player.graceTimer = setTimeout(() => {
      if (!rooms.has(room.code)) return;
      const still = room.players.get(player.id);
      if (!still || !still.disconnected) return;
      removePlayerFromRoom(room, player.id, "forfeit");
    }, 8000);
    return;
  }

  player.graceTimer = setTimeout(() => {
    if (!rooms.has(room.code)) return;
    const still = room.players.get(player.id);
    if (!still || !still.disconnected) return;
    removePlayerFromRoom(room, player.id, "timeout");
  }, RECONNECT_GRACE_MS);
}

function sessionPayload(room, player) {
  return {
    roomCode: room.code,
    token: player.token,
    playerId: player.id,
    name: player.name,
  };
}

function assertHostLobby(room, socket, cb) {
  if (!room) {
    if (typeof cb === "function") {
      cb({ ok: false, error: "You are not in a room.", code: "NOT_IN_ROOM" });
    }
    return false;
  }
  if (socket.id !== room.hostId) {
    if (typeof cb === "function") {
      cb({ ok: false, error: "Only the host can change this setting.", code: "NOT_HOST" });
    }
    return false;
  }
  if (room.status !== "lobby" && room.status !== "results") {
    if (typeof cb === "function") {
      cb({ ok: false, error: "Can only change between races.", code: "BUSY" });
    }
    return false;
  }
  return true;
}

io.on("connection", (socket) => {
  socket.data.roomCode = null;

  socket.on("room:create", ({ name, difficulty, language, mode, paragraphs, category }, cb) => {
    try {
      const code = generateCode();
      const modeNorm = normalizeMode(mode);
      const player = createPlayer(
        socket.id,
        name,
        COLORS[0],
        true,
        modeNorm === "team" ? "A" : null
      );
      leaveMatchQueue(socket.id);

      const room = {
        code,
        players: new Map([[socket.id, player]]),
        status: "lobby",
        hostId: socket.id,
        difficulty: normalizeDifficulty(difficulty),
        language: normalizeLanguage(language),
        mode: modeNorm,
        paragraphs: normalizeParagraphs(paragraphs),
        category: normalizeCategory(category),
        passage: "",
        raceStart: null,
        raceDurationMs: RACE_TIMEOUT_MS,
        countdownTimer: null,
        raceTimer: null,
        round: 1,
        seriesRace: 0,
        seriesComplete: false,
        seriesChampionId: null,
        maxPlayers: MAX_PLAYERS,
        quickMatch: false,
      };

      rooms.set(code, room);
      socket.join(code);
      socket.data.roomCode = code;

      if (typeof cb === "function") {
        cb({
          ok: true,
          room: roomSnapshot(room),
          session: sessionPayload(room, player),
        });
      }
      emitRoom(room);
    } catch {
      if (typeof cb === "function") {
        cb({
          ok: false,
          error: "Could not create room. Try again in a moment.",
          code: "CREATE_FAILED",
        });
      }
    }
  });

  /** Online 1v1 — find a random real opponent (not a ghost). */
  socket.on("match:find", (payload, cb) => {
    try {
      leaveMatchQueue(socket.id);

      // Leave any current room first
      if (socket.data.roomCode) {
        const existing = rooms.get(socket.data.roomCode);
        if (existing) removePlayerFromRoom(existing, socket.id, "left");
        socket.leave(socket.data.roomCode);
        socket.data.roomCode = null;
      }

      const lastWpm = Math.min(
        400,
        Math.max(0, Math.round(Number(payload && payload.lastWpm) || 0))
      );
      const entry = {
        socketId: socket.id,
        socket,
        name: sanitizeName(payload && payload.name),
        language: normalizeLanguage(payload && payload.language),
        difficulty: normalizeDifficulty(payload && payload.difficulty),
        mode: normalizeQuickMatchMode(payload && payload.mode),
        paragraphs: normalizeParagraphs(payload && payload.paragraphs),
        category: normalizeCategory(payload && payload.category),
        lastWpm: lastWpm || null,
        joinedAt: Date.now(),
      };

      const paired = tryPairFromQueue(entry);
      if (paired) {
        if (typeof cb === "function") {
          cb({
            ok: true,
            status: "matched",
            room: roomSnapshot(paired),
            queueSize: matchQueue.size,
          });
        }
        return;
      }

      matchQueue.set(socket.id, entry);
      if (typeof cb === "function") {
        cb({
          ok: true,
          status: "searching",
          message: "Searching for a 1v1 opponent…",
          language: entry.language,
          difficulty: entry.difficulty,
          mode: entry.mode,
          queueSize: matchQueue.size,
          softLangAfterMs: MATCH_SOFT_LANG_MS,
        });
      }
      socket.emit("match:searching", {
        language: entry.language,
        difficulty: entry.difficulty,
        mode: entry.mode,
        queueSize: matchQueue.size,
        softLangAfterMs: MATCH_SOFT_LANG_MS,
      });
    } catch {
      if (typeof cb === "function") {
        cb({
          ok: false,
          error: "Could not start matchmaking. Try again.",
          code: "MATCH_FAILED",
        });
      }
    }
  });

  socket.on("match:cancel", (_payload, cb) => {
    const wasQueued = matchQueue.has(socket.id);
    const left = leaveMatchQueue(socket.id);
    if (wasQueued && left) {
      try {
        analytics.trackQueueAbandon();
      } catch (_) {}
    }
    if (typeof cb === "function") {
      cb({
        ok: true,
        cancelled: left,
        queueSize: matchQueue.size,
      });
    }
    if (left) {
      socket.emit("match:cancelled", { queueSize: matchQueue.size });
    }
  });

  /**
   * Create a friend duel invite while searching (or start searching + invite).
   * Friend opens /?duel=CODE and joins for guaranteed 1v1.
   */
  socket.on("match:invite-create", (payload, cb) => {
    try {
      let entry = matchQueue.get(socket.id);
      if (!entry) {
        // Ensure host is in queue with current prefs
        const lastWpm = Math.min(
          400,
          Math.max(0, Math.round(Number(payload && payload.lastWpm) || 0))
        );
        if (socket.data.roomCode) {
          const existing = rooms.get(socket.data.roomCode);
          if (existing) removePlayerFromRoom(existing, socket.id, "left");
          socket.leave(socket.data.roomCode);
          socket.data.roomCode = null;
        }
        entry = {
          socketId: socket.id,
          socket,
          name: sanitizeName(payload && payload.name),
          language: normalizeLanguage(payload && payload.language),
          difficulty: normalizeDifficulty(payload && payload.difficulty),
          mode: normalizeQuickMatchMode(payload && payload.mode),
          paragraphs: normalizeParagraphs(payload && payload.paragraphs),
          category: normalizeCategory(payload && payload.category),
          lastWpm: lastWpm || null,
          joinedAt: Date.now(),
        };
        matchQueue.set(socket.id, entry);
      }

      clearDuelInvitesForSocket(socket.id);
      const code = generateDuelCode();
      duelInvites.set(code, {
        hostSocketId: socket.id,
        entry,
        createdAt: Date.now(),
      });
      // Expire invite after 10 minutes
      setTimeout(() => {
        const inv = duelInvites.get(code);
        if (inv && inv.hostSocketId === socket.id) duelInvites.delete(code);
      }, 10 * 60 * 1000);

      if (typeof cb === "function") {
        cb({
          ok: true,
          inviteCode: code,
          expiresInMs: 10 * 60 * 1000,
          queueSize: matchQueue.size,
        });
      }
      socket.emit("match:invite-ready", { inviteCode: code });
    } catch {
      if (typeof cb === "function") {
        cb({ ok: false, error: "Could not create invite.", code: "INVITE_FAILED" });
      }
    }
  });

  /** Friend joins a duel invite → immediate 1v1 room with host. */
  socket.on("match:invite-join", (payload, cb) => {
    try {
      const code = String((payload && payload.code) || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6);
      if (!code) {
        if (typeof cb === "function") {
          cb({ ok: false, error: "Missing duel code.", code: "CODE_REQUIRED" });
        }
        return;
      }
      const inv = duelInvites.get(code);
      if (!inv) {
        if (typeof cb === "function") {
          cb({
            ok: false,
            error: "Invite expired or not found. Ask your friend for a new link.",
            code: "INVITE_GONE",
          });
        }
        return;
      }
      if (inv.hostSocketId === socket.id) {
        if (typeof cb === "function") {
          cb({ ok: false, error: "You cannot join your own invite.", code: "SELF" });
        }
        return;
      }
      const hostEntry = matchQueue.get(inv.hostSocketId) || inv.entry;
      if (!hostEntry || !hostEntry.socket || !hostEntry.socket.connected) {
        duelInvites.delete(code);
        leaveMatchQueue(inv.hostSocketId);
        if (typeof cb === "function") {
          cb({
            ok: false,
            error: "Host went offline. Ask them to search again.",
            code: "HOST_OFFLINE",
          });
        }
        return;
      }

      leaveMatchQueue(socket.id);
      if (socket.data.roomCode) {
        const existing = rooms.get(socket.data.roomCode);
        if (existing) removePlayerFromRoom(existing, socket.id, "left");
        socket.leave(socket.data.roomCode);
        socket.data.roomCode = null;
      }

      const guestEntry = {
        socketId: socket.id,
        socket,
        name: sanitizeName(payload && payload.name),
        language: hostEntry.language,
        difficulty: hostEntry.difficulty,
        mode: hostEntry.mode,
        paragraphs: hostEntry.paragraphs,
        category: hostEntry.category,
        lastWpm: Math.min(400, Math.max(0, Math.round(Number(payload && payload.lastWpm) || 0))) || null,
        joinedAt: Date.now(),
      };

      duelInvites.delete(code);
      matchQueue.delete(inv.hostSocketId);
      matchQueue.delete(socket.id);

      const room = createQuickMatchRoom(hostEntry, guestEntry);
      if (typeof cb === "function") {
        cb({
          ok: true,
          status: "matched",
          room: roomSnapshot(room),
        });
      }
    } catch {
      if (typeof cb === "function") {
        cb({ ok: false, error: "Could not join duel.", code: "JOIN_FAILED" });
      }
    }
  });

  /** 1v1 rematch — both players must request; then auto-starts next race. */
  socket.on("match:rematch", (_payload, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.quickMatch) {
      if (typeof cb === "function") {
        cb({
          ok: false,
          error: "Rematch is only for 1v1 matches.",
          code: "NOT_1V1",
        });
      }
      return;
    }
    if (room.status !== "results") {
      if (typeof cb === "function") {
        cb({
          ok: false,
          error: "Wait for the race to finish.",
          code: "BUSY",
        });
      }
      return;
    }
    const player = room.players.get(socket.id);
    if (!player || player.disconnected) {
      if (typeof cb === "function") {
        cb({ ok: false, error: "Not in this match.", code: "NOT_IN_ROOM" });
      }
      return;
    }
    const alive = activePlayers(room);
    if (alive.length < 2) {
      if (typeof cb === "function") {
        cb({
          ok: false,
          error: "Opponent left. Find a new opponent instead.",
          code: "OPPONENT_LEFT",
        });
      }
      return;
    }

    player.rematchWanted = true;
    const votes = alive.filter((p) => p.rematchWanted).length;
    const needed = alive.length;
    io.to(room.code).emit("match:rematch-status", {
      votes,
      needed,
      by: { id: player.id, name: player.name },
      readyIds: alive.filter((p) => p.rematchWanted).map((p) => p.id),
    });
    emitRoom(room);

    if (votes >= needed) {
      alive.forEach((p) => {
        p.rematchWanted = false;
        p.ready = true;
      });
      room.round = Math.max(1, (room.round || 1) + 1);
      room.status = "lobby";
      try {
        analytics.trackRematch1v1({
          language: room.language,
          mode: room.mode,
          difficulty: room.difficulty,
        });
      } catch (_) {}
      startCountdown(room);
      if (typeof cb === "function") {
        cb({ ok: true, status: "starting", votes, needed });
      }
      return;
    }

    if (typeof cb === "function") {
      cb({
        ok: true,
        status: "waiting",
        votes,
        needed,
        message: "Waiting for opponent to rematch…",
      });
    }
  });

  socket.on("room:join", ({ code, name }, cb) => {
    try {
      leaveMatchQueue(socket.id);

      const checked = validateRoomCode(code);
      if (!checked.ok) {
        if (typeof cb === "function") cb(checked);
        return;
      }

      const room = rooms.get(checked.roomCode);
      if (!room) {
        if (typeof cb === "function") {
          cb({
            ok: false,
            error: "Room not found. Check the code or ask the host for a new one.",
            code: "ROOM_NOT_FOUND",
          });
        }
        return;
      }

      const cap = room.maxPlayers || MAX_PLAYERS;
      if (activePlayers(room).length >= cap || room.players.size >= cap) {
        if (typeof cb === "function") {
          cb({
            ok: false,
            error: room.quickMatch
              ? "This 1v1 match is full."
              : `Room is full (max ${cap} players). Try another room.`,
            code: "ROOM_FULL",
          });
        }
        return;
      }

      if (room.status === "racing" || room.status === "countdown") {
        if (typeof cb === "function") {
          cb({
            ok: false,
            error: "Race already in progress. Wait for the next lobby, then join.",
            code: "RACE_IN_PROGRESS",
          });
        }
        return;
      }

      const player = createPlayer(
        socket.id,
        name,
        nextColor(room),
        false,
        room.mode === "team" ? assignTeam(room) : null
      );
      room.players.set(socket.id, player);
      socket.join(checked.roomCode);
      socket.data.roomCode = checked.roomCode;

      if (typeof cb === "function") {
        cb({
          ok: true,
          room: roomSnapshot(room),
          session: sessionPayload(room, player),
        });
      }
      io.to(checked.roomCode).emit("player:joined", { player: publicPlayer(player) });
      emitRoom(room);
    } catch {
      if (typeof cb === "function") {
        cb({
          ok: false,
          error: "Could not join room. Check your connection and try again.",
          code: "JOIN_FAILED",
        });
      }
    }
  });

  socket.on("room:reconnect", ({ code, token, name }, cb) => {
    try {
      const checked = validateRoomCode(code);
      if (!checked.ok) {
        if (typeof cb === "function") cb(checked);
        return;
      }
      if (!token || typeof token !== "string") {
        if (typeof cb === "function") {
          cb({
            ok: false,
            error: "Missing session. Join the room again with the code.",
            code: "SESSION_MISSING",
          });
        }
        return;
      }

      const room = rooms.get(checked.roomCode);
      if (!room) {
        if (typeof cb === "function") {
          cb({
            ok: false,
            error: "That room expired or was closed. Create or join a new one.",
            code: "ROOM_NOT_FOUND",
          });
        }
        return;
      }

      let oldId = null;
      let player = null;
      for (const [id, p] of room.players) {
        if (p.token === token) {
          oldId = id;
          player = p;
          break;
        }
      }

      if (!player) {
        if (typeof cb === "function") {
          cb({
            ok: false,
            error: "Session no longer valid in this room. Join again.",
            code: "SESSION_EXPIRED",
          });
        }
        return;
      }

      if (player.id === socket.id && !player.disconnected) {
        socket.join(room.code);
        socket.data.roomCode = room.code;
        if (typeof cb === "function") {
          cb({
            ok: true,
            room: roomSnapshot(room),
            session: sessionPayload(room, player),
            reconnected: true,
          });
        }
        return;
      }

      clearPlayerGrace(player);
      room.players.delete(oldId);
      player.id = socket.id;
      player.disconnected = false;
      if (name) player.name = sanitizeName(name);
      if (room.hostId === oldId) room.hostId = socket.id;
      player.isHost = room.hostId === socket.id;
      room.players.set(socket.id, player);

      socket.join(room.code);
      socket.data.roomCode = room.code;

      if (typeof cb === "function") {
        cb({
          ok: true,
          room: roomSnapshot(room),
          session: sessionPayload(room, player),
          reconnected: true,
        });
      }
      io.to(room.code).emit("player:reconnected", {
        player: publicPlayer(player),
        oldId,
      });
      emitRoom(room);
    } catch {
      if (typeof cb === "function") {
        cb({
          ok: false,
          error: "Reconnect failed. Try joining with the room code.",
          code: "RECONNECT_FAILED",
        });
      }
    }
  });

  socket.on("room:set-difficulty", ({ difficulty }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!assertHostLobby(room, socket, cb)) return;
    room.difficulty = normalizeDifficulty(difficulty);
    emitRoom(room);
    if (typeof cb === "function") cb({ ok: true, difficulty: room.difficulty });
  });

  socket.on("room:set-language", ({ language }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!assertHostLobby(room, socket, cb)) return;
    room.language = normalizeLanguage(language);
    emitRoom(room);
    if (typeof cb === "function") {
      cb({
        ok: true,
        language: room.language,
        languageLabel: LANG_LABELS[room.language],
      });
    }
  });

  socket.on("room:set-category", ({ category }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!assertHostLobby(room, socket, cb)) return;
    room.category = normalizeCategory(category);
    emitRoom(room);
    if (typeof cb === "function") {
      cb({
        ok: true,
        category: room.category,
        categoryLabel: CATEGORIES[room.category].label,
      });
    }
  });

  socket.on("room:set-mode", ({ mode }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!assertHostLobby(room, socket, cb)) return;
    room.mode = normalizeMode(mode);
    // Reset round + series for every mode change so Round is correct in all modes
    room.round = 1;
    room.seriesRace = 0;
    room.seriesComplete = false;
    room.seriesChampionId = null;
    [...room.players.values()].forEach((p) => {
      p.seriesWins = 0;
      p.team = null;
    });
    // Rebalance teams if switching to team mode
    if (room.mode === "team") {
      const list = [...room.players.values()];
      list.forEach((p, i) => {
        p.team = i % 2 === 0 ? "A" : "B";
      });
    }
    emitRoom(room);
    if (typeof cb === "function") {
      cb({
        ok: true,
        mode: room.mode,
        modeLabel: MODES[room.mode].label,
        round: room.round,
      });
    }
  });

  socket.on("player:set-team", ({ team }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) {
      if (typeof cb === "function") {
        cb({ ok: false, error: "Not in a room.", code: "NOT_IN_ROOM" });
      }
      return;
    }
    if (room.mode !== "team") {
      if (typeof cb === "function") {
        cb({ ok: false, error: "Team mode is not active.", code: "NOT_TEAM" });
      }
      return;
    }
    if (room.status !== "lobby" && room.status !== "results") {
      if (typeof cb === "function") {
        cb({ ok: false, error: "Can only switch teams between races.", code: "BUSY" });
      }
      return;
    }
    const t = String(team || "").toUpperCase();
    if (t !== "A" && t !== "B") {
      if (typeof cb === "function") {
        cb({ ok: false, error: "Pick team A or B.", code: "BAD_TEAM" });
      }
      return;
    }
    const player = room.players.get(socket.id);
    if (!player) return;
    player.team = t;
    emitRoom(room);
    if (typeof cb === "function") cb({ ok: true, team: t });
  });

  socket.on("room:set-paragraphs", ({ paragraphs }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!assertHostLobby(room, socket, cb)) return;
    room.paragraphs = normalizeParagraphs(paragraphs);
    emitRoom(room);
    if (typeof cb === "function") {
      cb({ ok: true, paragraphs: room.paragraphs });
    }
  });

  socket.on("player:ready", ({ ready }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player || player.disconnected) return;
    if (room.status !== "lobby" && room.status !== "results") return;
    player.ready = Boolean(ready);
    emitRoom(room);
  });

  socket.on("race:request-start", (_payload, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) {
      if (typeof cb === "function") {
        cb({ ok: false, error: "You are not in a room.", code: "NOT_IN_ROOM" });
      }
      return;
    }
    if (socket.id !== room.hostId) {
      if (typeof cb === "function") {
        cb({ ok: false, error: "Only the host can start the race.", code: "NOT_HOST" });
      }
      return;
    }
    if (room.status !== "lobby" && room.status !== "results") {
      if (typeof cb === "function") {
        cb({
          ok: false,
          error: "A race is already starting or in progress.",
          code: "BUSY",
        });
      }
      return;
    }
    if (activePlayers(room).length < 1) {
      if (typeof cb === "function") {
        cb({
          ok: false,
          error: "Need at least one connected player to start.",
          code: "NO_PLAYERS",
        });
      }
      return;
    }
    if (room.mode === "team") {
      const a = activePlayers(room).filter((p) => p.team === "A").length;
      const b = activePlayers(room).filter((p) => p.team === "B").length;
      if (a < 1 || b < 1) {
        if (typeof cb === "function") {
          cb({
            ok: false,
            error: "Team mode needs at least 1 player on Team A and Team B.",
            code: "TEAM_UNBALANCED",
          });
        }
        return;
      }
    }

    // Round counter works for ALL modes (Classic, Timed, SD, Ghost, Team, Words, Bo3)
    if (room.status === "results") {
      if (room.mode === "best_of_3" && room.seriesComplete) {
        // New Bo3 series starts at round 1
        room.round = 1;
        room.seriesRace = 0;
        room.seriesComplete = false;
        room.seriesChampionId = null;
        [...room.players.values()].forEach((p) => {
          p.seriesWins = 0;
        });
      } else {
        room.round = Math.max(1, (room.round || 1) + 1);
      }
      room.status = "lobby";
    } else if (room.status === "lobby") {
      // Ensure valid round even on first start
      room.round = Math.max(1, room.round || 1);
    }
    startCountdown(room);
    if (typeof cb === "function") cb({ ok: true, round: room.round, mode: room.mode });
  });

  socket.on("race:progress", (payload) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "racing") return;
    const player = room.players.get(socket.id);
    if (!player || player.finished || player.disconnected || player.eliminated) return;
    if (!room.passage) return;

    let correct = Math.max(0, Math.min(Number(payload.correct) || 0, room.passage.length));
    let errors = Math.max(0, Math.min(Number(payload.errors) || 0, 9999));
    // Never allow progress to go backwards
    if (correct < (player.correct || 0)) correct = player.correct || 0;

    const now = Date.now();
    const elapsedMs = Math.max(1, now - (room.raceStart || now));
    // Rate-limit character jumps (blocks paste/bots bursting)
    const prevAt = player.lastProgressAt || room.raceStart || now;
    const dtSec = Math.max(0.05, (now - prevAt) / 1000);
    const delta = correct - (player.correct || 0);
    const maxDelta = Math.ceil(dtSec * MAX_CHARS_PER_SEC + 4);
    if (delta > maxDelta) {
      correct = (player.correct || 0) + maxDelta;
      correct = Math.min(correct, room.passage.length);
    }
    player.lastProgressAt = now;

    const minutes = elapsedMs / 60000;
    let wpm = Math.min(MAX_RACE_WPM, Math.round(correct / 5 / minutes));
    // Extra sanity: implied WPM from instantaneous burst
    if (delta > 0 && dtSec > 0) {
      const burstWpm = Math.round(delta / 5 / (dtSec / 60));
      if (burstWpm > MAX_RACE_WPM + 40) {
        correct = player.correct || 0;
        wpm = Math.min(MAX_RACE_WPM, player.wpm || 0);
      }
    }
    const total = correct + errors;
    let accuracy = total === 0 ? 100 : Math.round((correct / total) * 100);
    let progress = Math.round((correct / room.passage.length) * 100);

    // Sudden death: first error eliminates
    if (room.mode === "sudden_death" && errors > 0) {
      player.errors = errors;
      player.correct = correct;
      player.wpm = wpm;
      player.accuracy = accuracy;
      player.progress = progress;
      player.eliminated = true;
      player.finished = true;
      player.finishTime = elapsedMs;

      io.to(room.code).emit("player:eliminated", {
        id: player.id,
        name: player.name,
        correct,
        progress,
      });

      rankFinishers(room);
      io.to(room.code).emit("race:progress", {
        id: player.id,
        progress: player.progress,
        wpm: player.wpm,
        accuracy: player.accuracy,
        correct: player.correct,
        errors: player.errors,
        finished: true,
        eliminated: true,
        place: player.place,
      });
      emitRoom(room);
      maybeEndRace(room);
      return;
    }

    player.correct = correct;
    player.errors = errors;
    player.wpm = wpm;
    player.accuracy = accuracy;
    player.progress = progress;

    // Lightweight realtime update (no full room snapshot — faster on Render)
    io.to(room.code).emit("race:progress", {
      id: player.id,
      name: player.name,
      color: player.color,
      progress: player.progress,
      wpm: player.wpm,
      accuracy: player.accuracy,
      correct: player.correct,
      errors: player.errors,
      finished: player.finished,
      eliminated: player.eliminated,
      place: player.place,
      team: player.team || null,
    });

    // Complete passage (classic / bo3 / sudden clean finish / timed early complete)
    if (correct >= room.passage.length) {
      player.finished = true;
      player.progress = 100;
      player.finishTime = elapsedMs;
      rankFinishers(room);
      io.to(room.code).emit("player:finished", {
        id: player.id,
        name: player.name,
        place: player.place,
        wpm: player.wpm,
        accuracy: player.accuracy,
        finishTime: player.finishTime,
      });
      // Full snapshot only when someone finishes
      emitRoom(room);
      maybeEndRace(room);
    }
  });

  socket.on("chat:message", ({ text }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player || player.disconnected) return;
    const raw = String(text || "")
      .trim()
      .slice(0, 120);
    if (!raw) return;
    // Asterisk filter for bad words (EN + common TL)
    const clean = censorText(raw);
    io.to(room.code).emit("chat:message", {
      id: player.id,
      name: player.name,
      color: player.color,
      text: clean,
      at: Date.now(),
    });
  });

  socket.on("room:leave", (cb) => {
    leaveMatchQueue(socket.id);
    const code = socket.data.roomCode;
    if (!code) {
      if (typeof cb === "function") cb({ ok: true });
      return;
    }
    const room = rooms.get(code);
    if (room) removePlayerFromRoom(room, socket.id, "left");
    socket.leave(code);
    socket.data.roomCode = null;
    if (typeof cb === "function") cb({ ok: true });
  });

  socket.on("disconnect", () => {
    leaveMatchQueue(socket.id);
    const code = socket.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;

    scheduleDisconnect(room, player);
    io.to(code).emit("player:disconnected", {
      id: player.id,
      name: player.name,
      graceMs: RECONNECT_GRACE_MS,
    });
    emitRoom(room);
    if (room.status === "racing") maybeEndRace(room);
  });
});

server.listen(PORT, () => {
  console.log(`\n  ⚡ KeyClash running at http://localhost:${PORT}\n`);

  // Self keep-alive on Render free tier (sleeps after ~15m idle).
  // RENDER_EXTERNAL_URL is set by Render; override with KEEP_ALIVE_URL if needed.
  // Best reliability: external UptimeRobot → /api/ping every 5m (see DEPLOY.md).
  const external =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.KEEP_ALIVE_URL ||
    "";
  if (external) {
    const base = external.replace(/\/$/, "");
    const urls = [base + "/api/ping", base + "/api/health"];
    // Default 5m — tighter against free-tier sleep (~15m)
    const mins = Math.max(3, Number(process.env.KEEP_ALIVE_MINUTES) || 5);
    const ping = () => {
      urls.forEach((url) => {
        fetch(url).catch(() => {});
      });
    };
    setTimeout(ping, 20 * 1000);
    setInterval(ping, mins * 60 * 1000);
    console.log(`  ⏰ Keep-alive every ${mins}m → ${urls.join(" + ")}\n`);
  } else {
    console.log(
      "  ⏰ Keep-alive off (set RENDER_EXTERNAL_URL or KEEP_ALIVE_URL). Use UptimeRobot on /api/ping.\n"
    );
  }

  // Clean expired duel invites every minute
  setInterval(() => {
    const now = Date.now();
    for (const [code, inv] of duelInvites) {
      if (now - (inv.createdAt || 0) > 10 * 60 * 1000) duelInvites.delete(code);
    }
  }, 60 * 1000);
});
