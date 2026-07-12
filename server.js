const crypto = require("crypto");
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
  listDifficulties,
  listLanguages,
  listModes,
  LANG_LABELS,
  MODES,
  MIN_PARAGRAPHS,
  MAX_PARAGRAPHS,
} = require("./passages");
const leaderboard = require("./leaderboard");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  pingTimeout: 20000,
  pingInterval: 10000,
});

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 10;
const COUNTDOWN_MS = 3200;
const RACE_TIMEOUT_MS = 120000;
const TIMED_MS = 60000;
const RECONNECT_GRACE_MS = 60000;

app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "keyclash", rooms: rooms.size });
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

app.get("/api/practice", (req, res) => {
  const difficulty = normalizeDifficulty(req.query.difficulty);
  const language = normalizeLanguage(req.query.language);
  const mode = normalizeMode(req.query.mode || "classic");
  const paragraphs = normalizeParagraphs(req.query.paragraphs);
  const passage = pickRaceText(mode, difficulty, language, paragraphs);
  res.json({
    difficulty,
    language,
    languageLabel: LANG_LABELS[language] || language,
    mode,
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
    maxPlayers: MAX_PLAYERS,
    reconnectGraceMs: RECONNECT_GRACE_MS,
  };
}

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
    room.paragraphs
  );
  room.raceDurationMs = raceDurationForMode(room.mode);
  room.status = "countdown";
  room.raceStart = null;
  [...room.players.values()].forEach(resetRaceStats);

  io.to(room.code).emit("race:countdown", {
    duration: COUNTDOWN_MS,
    passage: room.passage,
    difficulty: room.difficulty,
    language: room.language,
    mode: room.mode,
    raceDurationMs: room.raceDurationMs,
    snapshot: roomSnapshot(room),
  });
  emitRoom(room);

  room.countdownTimer = setTimeout(() => {
    room.status = "racing";
    room.raceStart = Date.now();
    io.to(room.code).emit("race:start", {
      raceStart: room.raceStart,
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
  return String(name || "")
    .trim()
    .slice(0, 16)
    .replace(/[<>]/g, "") || "Racer";
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

  socket.on("room:create", ({ name, difficulty, language, mode, paragraphs }, cb) => {
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
      const room = {
        code,
        players: new Map([[socket.id, player]]),
        status: "lobby",
        hostId: socket.id,
        difficulty: normalizeDifficulty(difficulty),
        language: normalizeLanguage(language),
        mode: modeNorm,
        paragraphs: normalizeParagraphs(paragraphs),
        passage: "",
        raceStart: null,
        raceDurationMs: RACE_TIMEOUT_MS,
        countdownTimer: null,
        raceTimer: null,
        round: 1,
        seriesRace: 0,
        seriesComplete: false,
        seriesChampionId: null,
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

  socket.on("room:join", ({ code, name }, cb) => {
    try {
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

      if (activePlayers(room).length >= MAX_PLAYERS || room.players.size >= MAX_PLAYERS) {
        if (typeof cb === "function") {
          cb({
            ok: false,
            error: `Room is full (max ${MAX_PLAYERS} players). Try another room.`,
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

  socket.on("room:set-mode", ({ mode }, cb) => {
    const room = rooms.get(socket.data.roomCode);
    if (!assertHostLobby(room, socket, cb)) return;
    room.mode = normalizeMode(mode);
    // Reset series when mode changes
    room.seriesRace = 0;
    room.seriesComplete = false;
    room.seriesChampionId = null;
    [...room.players.values()].forEach((p) => {
      p.seriesWins = 0;
      if (room.mode === "team") {
        p.team = null;
      } else {
        p.team = null;
      }
    });
    // Rebalance teams if switching to team mode
    if (room.mode === "team") {
      [...room.players.values()].forEach((p) => {
        p.team = assignTeam(room);
        // assignTeam counts already-assigned; set after so we need sequential
      });
      // Clean rebalance
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

    if (room.status === "results") {
      room.round += 1;
      // If series complete in Bo3, start fresh series
      if (room.mode === "best_of_3" && room.seriesComplete) {
        room.seriesRace = 0;
        room.seriesComplete = false;
        room.seriesChampionId = null;
        [...room.players.values()].forEach((p) => {
          p.seriesWins = 0;
        });
      }
      room.status = "lobby";
    }
    startCountdown(room);
    if (typeof cb === "function") cb({ ok: true });
  });

  socket.on("race:progress", (payload) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "racing") return;
    const player = room.players.get(socket.id);
    if (!player || player.finished || player.disconnected || player.eliminated) return;
    if (!room.passage) return;

    let correct = Math.max(0, Math.min(Number(payload.correct) || 0, room.passage.length));
    let errors = Math.max(0, Math.min(Number(payload.errors) || 0, 9999));
    const elapsedMs = Math.max(1, Date.now() - (room.raceStart || Date.now()));
    const minutes = elapsedMs / 60000;
    let wpm = Math.min(400, Math.round(correct / 5 / minutes));
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

    io.to(room.code).emit("race:progress", {
      id: player.id,
      progress: player.progress,
      wpm: player.wpm,
      accuracy: player.accuracy,
      correct: player.correct,
      errors: player.errors,
      finished: player.finished,
      eliminated: player.eliminated,
      place: player.place,
    });

    // Complete passage (classic / bo3 / sudden clean finish / timed early complete)
    if (correct >= room.passage.length) {
      player.finished = true;
      player.progress = 100;
      player.finishTime = elapsedMs;
      rankFinishers(room);
      io.to(room.code).emit("player:finished", {
        id: player.id,
        place: player.place,
        wpm: player.wpm,
        accuracy: player.accuracy,
        finishTime: player.finishTime,
      });
      emitRoom(room);
      maybeEndRace(room);
    }
  });

  socket.on("chat:message", ({ text }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player || player.disconnected) return;
    const clean = String(text || "")
      .trim()
      .slice(0, 120);
    if (!clean) return;
    io.to(room.code).emit("chat:message", {
      id: player.id,
      name: player.name,
      color: player.color,
      text: clean,
      at: Date.now(),
    });
  });

  socket.on("room:leave", (cb) => {
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
});
