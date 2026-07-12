/**
 * KeyClash multiplayer + practice client
 */
(function () {
  const SESSION_KEY = "keyclash_session";
  const DIFF_KEY = "keyclash_difficulty";
  const LANG_KEY = "keyclash_language";
  const MODE_KEY = "keyclash_mode";
  const PARA_KEY = "keyclash_paragraphs";
  const LOCAL_LB_KEY = "keyclash_local_scores";

  const LANG_LABELS = { en: "English", tl: "Tagalog" };
  const MODE_META = {
    classic: {
      label: "Classic",
      hint: "Finish the passage first. Clean and fast.",
    },
    best_of_3: {
      label: "Best of 3",
      hint: "First to 2 race wins takes the series.",
    },
    timed: {
      label: "Timed 60s",
      hint: "Type as far as you can in 60 seconds.",
    },
    sudden_death: {
      label: "Sudden Death",
      hint: "One mistake and you are out.",
    },
    ghost: {
      label: "Ghost Race",
      hint: "Race a ghost running at your last WPM. Beat your ghost!",
    },
    team: {
      label: "Team 2v2",
      hint: "Two teams. Win by average progress & WPM. Pick A or B.",
    },
    words: {
      label: "Word Mode",
      hint: "Type random words (paragraphs = word packs × 25).",
    },
  };

  const GHOST_KEY = "keyclash_ghost_wpm";

  function normalizeTypingText(text) {
    return String(text || "")
      .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-")
      .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
      .replace(/\u2026/g, "...")
      .replace(/\u00A0/g, " ")
      .replace(/\u200B/g, "");
  }

  function normalizeChar(ch) {
    if (!ch) return ch;
    return normalizeTypingText(ch);
  }

  function clampParagraphs(n) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return 1;
    return Math.min(5, Math.max(1, v));
  }

  const socket = io({
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 12,
    reconnectionDelay: 800,
  });

  const els = {
    home: document.getElementById("screen-home"),
    game: document.getElementById("screen-game"),
    practice: document.getElementById("screen-practice"),
    name: document.getElementById("input-name"),
    code: document.getElementById("input-code"),
    btnCreate: document.getElementById("btn-create"),
    btnJoin: document.getElementById("btn-join"),
    btnPractice: document.getElementById("btn-practice"),
    homeError: document.getElementById("home-error"),
    homeDifficulty: document.getElementById("home-difficulty"),
    homeLanguage: document.getElementById("home-language"),
    homeMode: document.getElementById("home-mode"),
    homeParagraphs: document.getElementById("home-paragraphs"),
    modeHint: document.getElementById("mode-hint"),
    roomLanguage: document.getElementById("room-language"),
    roomMode: document.getElementById("room-mode"),
    roomParagraphs: document.getElementById("room-paragraphs"),
    langLabel: document.getElementById("lang-label"),
    modeLabel: document.getElementById("mode-label"),
    paraLabel: document.getElementById("para-label"),
    practiceParaLabel: document.getElementById("practice-para-label"),
    practiceGhostPanel: document.getElementById("practice-ghost-panel"),
    practiceGhostWpm: document.getElementById("practice-ghost-wpm"),
    practiceGhostPct: document.getElementById("practice-ghost-pct"),
    practiceGhostFill: document.getElementById("practice-ghost-fill"),
    practiceGhostRacer: document.getElementById("practice-ghost-racer"),
    practiceGhostWpmSide: document.getElementById("practice-ghost-wpm-side"),
    practiceYouFill: document.getElementById("practice-you-fill"),
    practiceYouRacer: document.getElementById("practice-you-racer"),
    practiceYouWpmSide: document.getElementById("practice-you-wpm-side"),
    practiceInputHint: document.getElementById("practice-input-hint"),
    gameGhostBanner: document.getElementById("game-ghost-banner"),
    gameGhostWpmLabel: document.getElementById("game-ghost-wpm-label"),
    gameYouVsGhost: document.getElementById("game-you-vs-ghost"),
    gameGhostVsYou: document.getElementById("game-ghost-vs-you"),
    seriesChip: document.getElementById("series-chip"),
    seriesScore: document.getElementById("series-score"),
    teamScoreChip: document.getElementById("team-score-chip"),
    teamAScore: document.getElementById("team-a-score"),
    teamBScore: document.getElementById("team-b-score"),
    teamPick: document.getElementById("team-pick"),
    playerTeam: document.getElementById("player-team"),
    raceTimer: document.getElementById("race-timer"),
    raceTimerVal: document.getElementById("race-timer-val"),
    practiceLangLabel: document.getElementById("practice-lang-label"),
    practiceModeLabel: document.getElementById("practice-mode-label"),
    practiceTimer: document.getElementById("practice-timer"),
    practiceTimerVal: document.getElementById("practice-timer-val"),
    reconnectBanner: document.getElementById("reconnect-banner"),
    reconnectDetail: document.getElementById("reconnect-detail"),
    btnReconnect: document.getElementById("btn-reconnect"),
    btnDismissReconnect: document.getElementById("btn-dismiss-reconnect"),
    roomCode: document.getElementById("room-code"),
    roundNum: document.getElementById("round-num"),
    diffLabel: document.getElementById("diff-label"),
    statusPill: document.getElementById("status-pill"),
    playerCount: document.getElementById("player-count"),
    playerList: document.getElementById("player-list"),
    btnReady: document.getElementById("btn-ready"),
    btnStart: document.getElementById("btn-start"),
    btnLeave: document.getElementById("btn-leave"),
    btnCopy: document.getElementById("btn-copy"),
    btnShare: document.getElementById("btn-share"),
    btnCopyGameUrl: document.getElementById("btn-copy-game-url"),
    shareHelpText: document.getElementById("share-help-text"),
    roomDifficulty: document.getElementById("room-difficulty"),
    hostHint: document.getElementById("host-hint"),
    trackBoard: document.getElementById("track-board"),
    passage: document.getElementById("passage"),
    typeInput: document.getElementById("type-input"),
    inputHint: document.getElementById("input-hint"),
    statWpm: document.getElementById("stat-wpm"),
    statAcc: document.getElementById("stat-acc"),
    statProg: document.getElementById("stat-prog"),
    statErr: document.getElementById("stat-err"),
    countdownOverlay: document.getElementById("countdown-overlay"),
    countdownNum: document.getElementById("countdown-num"),
    resultsOverlay: document.getElementById("results-overlay"),
    resultsList: document.getElementById("results-list"),
    resultsHint: document.getElementById("results-hint"),
    resultsTitle: document.getElementById("results-title"),
    personalStats: document.getElementById("personal-stats"),
    raceChart: document.getElementById("race-chart"),
    yourResultBlock: document.getElementById("your-result-block"),
    practicePersonalStats: document.getElementById("practice-personal-stats"),
    practiceChart: document.getElementById("practice-chart"),
    btnRematch: document.getElementById("btn-rematch"),
    chatLog: document.getElementById("chat-log"),
    chatForm: document.getElementById("chat-form"),
    chatInput: document.getElementById("chat-input"),
    chatPanel: document.getElementById("chat-panel"),
    btnToggleChat: document.getElementById("btn-toggle-chat"),
    toastRoot: document.getElementById("toast-root"),
    leaderboardList: document.getElementById("leaderboard-list"),
    lbPersonal: document.getElementById("lb-personal"),
    btnRefreshLb: document.getElementById("btn-refresh-lb"),
    practiceDiffLabel: document.getElementById("practice-diff-label"),
    practiceStatus: document.getElementById("practice-status"),
    practicePassage: document.getElementById("practice-passage"),
    practiceInput: document.getElementById("practice-input"),
    practiceCountdown: document.getElementById("practice-countdown"),
    practiceCountdownNum: document.getElementById("practice-countdown-num"),
    practiceResults: document.getElementById("practice-results"),
    practiceScore: document.getElementById("practice-score"),
    btnPracticeExit: document.getElementById("btn-practice-exit"),
    btnPracticeAgain: document.getElementById("btn-practice-again"),
    btnPracticeHome: document.getElementById("btn-practice-home"),
    pStatWpm: document.getElementById("p-stat-wpm"),
    pStatAcc: document.getElementById("p-stat-acc"),
    pStatProg: document.getElementById("p-stat-prog"),
    pStatErr: document.getElementById("p-stat-err"),
  };

  const state = {
    room: null,
    myId: null,
    ready: false,
    difficulty: localStorage.getItem(DIFF_KEY) || "normal",
    language: localStorage.getItem(LANG_KEY) || "en",
    mode: localStorage.getItem(MODE_KEY) || "classic",
    paragraphs: clampParagraphs(localStorage.getItem(PARA_KEY) || 1),
    passage: "",
    caret: 0,
    errors: 0,
    typedWrong: false,
    racing: false,
    raceStart: null,
    raceDurationMs: 120000,
    progressTimer: null,
    uiTimer: null,
    ghostTimer: null,
    ghostWpm: 0,
    ghostProgress: 0,
    ghostCaret: 0,
    lastKeyBurst: 0,
    history: [],
    historyTimer: null,
    confettiShown: false,
    resultsShownForRound: null,
    modeScreen: "home",
    practice: {
      passage: "",
      caret: 0,
      errors: 0,
      typedWrong: false,
      racing: false,
      start: null,
      durationMs: null,
      timerId: null,
    },
    autoReconnecting: false,
  };

  if (!MODE_META[state.mode]) state.mode = "classic";
  if (state.language !== "en" && state.language !== "tl") state.language = "en";
  state.paragraphs = clampParagraphs(state.paragraphs);

  const savedName = localStorage.getItem("keyclash_name");
  if (savedName) els.name.value = savedName;
  setSegActive(els.homeDifficulty, state.difficulty);
  setLangSegActive(els.homeLanguage, state.language);
  setModeSegActive(els.homeMode, state.mode);
  setParaSegActive(els.homeParagraphs, state.paragraphs);
  updateModeHint();

  function toast(msg, isError) {
    const el = document.createElement("div");
    el.className = "toast" + (isError ? " error" : "");
    el.textContent = msg;
    els.toastRoot.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  function showHomeError(msg) {
    if (!msg) {
      els.homeError.hidden = true;
      els.homeError.textContent = "";
      return;
    }
    els.homeError.hidden = false;
    els.homeError.textContent = msg;
  }

  function showScreen(which) {
    state.modeScreen = which;
    els.home.classList.toggle("active", which === "home");
    els.game.classList.toggle("active", which === "game");
    els.practice.classList.toggle("active", which === "practice");
    if (which === "home") {
      updateReconnectBanner();
      loadLeaderboard();
      startLeaderboardHomePoll();
    } else {
      stopLeaderboardHomePoll();
    }
  }

  function getName() {
    const n = (els.name.value || "").trim() || "Racer";
    localStorage.setItem("keyclash_name", n);
    return n;
  }

  function capitalize(s) {
    return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
  }

  function modeLabel(id) {
    return (MODE_META[id] && MODE_META[id].label) || capitalize(id);
  }

  function langLabel(code) {
    return LANG_LABELS[code] || capitalize(code || "en");
  }

  function updateModeHint() {
    if (els.modeHint) {
      els.modeHint.textContent =
        (MODE_META[state.mode] && MODE_META[state.mode].hint) || "";
    }
  }

  function setSegActive(root, diff) {
    if (!root) return;
    root.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.diff === diff);
    });
  }

  function setLangSegActive(root, lang) {
    if (!root) return;
    root.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.lang === lang);
    });
  }

  function setModeSegActive(root, mode) {
    if (!root) return;
    root.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
  }

  function setParaSegActive(root, count) {
    if (!root) return;
    const n = String(clampParagraphs(count));
    root.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.paragraphs === n);
    });
  }

  function wireSeg(root, dataKey, onPick) {
    if (!root) return;
    root.addEventListener("click", (e) => {
      const btn = e.target.closest(".seg-btn");
      if (!btn) return;
      const value = btn.dataset[dataKey];
      if (value == null) return;
      onPick(value);
    });
  }

  wireSeg(els.homeDifficulty, "diff", (diff) => {
    state.difficulty = diff;
    localStorage.setItem(DIFF_KEY, diff);
    setSegActive(els.homeDifficulty, diff);
  });

  wireSeg(els.homeLanguage, "lang", (lang) => {
    state.language = lang;
    localStorage.setItem(LANG_KEY, lang);
    setLangSegActive(els.homeLanguage, lang);
  });

  wireSeg(els.homeMode, "mode", (mode) => {
    state.mode = mode;
    localStorage.setItem(MODE_KEY, mode);
    setModeSegActive(els.homeMode, mode);
    updateModeHint();
  });

  wireSeg(els.homeParagraphs, "paragraphs", (n) => {
    state.paragraphs = clampParagraphs(n);
    localStorage.setItem(PARA_KEY, String(state.paragraphs));
    setParaSegActive(els.homeParagraphs, state.paragraphs);
  });

  wireSeg(els.roomDifficulty, "diff", (diff) => {
    if (!isHost()) return toast("Only the host can change difficulty", true);
    socket.emit("room:set-difficulty", { difficulty: diff }, (res) => {
      if (!res?.ok) return toast(res?.error || "Could not set difficulty", true);
      state.difficulty = res.difficulty;
      setSegActive(els.roomDifficulty, res.difficulty);
      if (els.diffLabel) els.diffLabel.textContent = capitalize(res.difficulty);
    });
  });

  wireSeg(els.roomLanguage, "lang", (lang) => {
    if (!isHost()) return toast("Only the host can change language", true);
    socket.emit("room:set-language", { language: lang }, (res) => {
      if (!res?.ok) return toast(res?.error || "Could not set language", true);
      state.language = res.language;
      setLangSegActive(els.roomLanguage, res.language);
      if (els.langLabel) els.langLabel.textContent = langLabel(res.language);
    });
  });

  wireSeg(els.roomMode, "mode", (mode) => {
    if (!isHost()) return toast("Only the host can change mode", true);
    socket.emit("room:set-mode", { mode }, (res) => {
      if (!res?.ok) return toast(res?.error || "Could not set mode", true);
      state.mode = res.mode;
      setModeSegActive(els.roomMode, res.mode);
      if (els.modeLabel) els.modeLabel.textContent = modeLabel(res.mode);
      toast("Mode: " + modeLabel(res.mode));
    });
  });

  wireSeg(els.playerTeam, "team", (team) => {
    socket.emit("player:set-team", { team }, (res) => {
      if (!res?.ok) return toast(res?.error || "Could not switch team", true);
      toast("Joined Team " + res.team);
    });
  });

  function loadGhostWpm() {
    try {
      const raw = localStorage.getItem(GHOST_KEY);
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? Math.min(400, n) : 40;
    } catch {
      return 40;
    }
  }

  function saveGhostWpm(wpm) {
    const n = Math.round(Number(wpm) || 0);
    if (n < 5) return;
    localStorage.setItem(GHOST_KEY, String(Math.min(400, n)));
  }

  function clearGhostInterval() {
    if (state.ghostTimer) {
      clearInterval(state.ghostTimer);
      state.ghostTimer = null;
    }
  }

  function stopGhostTimer() {
    clearGhostInterval();
    if (els.practiceGhostPanel) els.practiceGhostPanel.hidden = true;
    if (els.gameGhostBanner) els.gameGhostBanner.hidden = true;
  }

  function ghostCharsAt(elapsedMs, wpm) {
    if (!wpm) return 0;
    // WPM = (chars/5) / minutes  =>  chars = wpm * 5 * minutes
    return Math.floor((elapsedMs / 60000) * wpm * 5);
  }

  function ensureGhostTrack() {
    if (!els.trackBoard) return null;
    let row = els.trackBoard.querySelector('.track.ghost-track[data-id="__ghost__"]');
    if (!row) {
      row = document.createElement("div");
      row.className = "track ghost-track";
      row.dataset.id = "__ghost__";
      row.innerHTML = `
        <div class="track-name" style="color:#9b5de5">👻 Ghost (${state.ghostWpm || 40} WPM)</div>
        <div class="track-lane">
          <div class="track-fill" style="color:#9b5de5;width:0%"></div>
          <div class="track-racer" style="color:#9b5de5;left:0%"></div>
        </div>
        <div class="track-wpm">${state.ghostWpm || 40}</div>
      `;
      // Put ghost at top of tracks
      els.trackBoard.insertBefore(row, els.trackBoard.firstChild);
    }
    return row;
  }

  function updateGhostTrack(progress) {
    state.ghostProgress = progress;
    const row = ensureGhostTrack();
    if (!row) return;
    const fill = row.querySelector(".track-fill");
    const racer = row.querySelector(".track-racer");
    const name = row.querySelector(".track-name");
    const wpmEl = row.querySelector(".track-wpm");
    if (fill) fill.style.width = progress + "%";
    if (racer) {
      racer.style.left = progress + "%";
      racer.classList.toggle("finished", progress >= 100);
    }
    if (name) name.textContent = `👻 Ghost (${state.ghostWpm || 40} WPM)`;
    if (wpmEl) wpmEl.textContent = String(state.ghostWpm || 40);
  }

  /** Paint ghost caret/typed marks on a passage element without destroying your caret. */
  function paintGhostOnPassage(passageEl, ghostCaret, yourCaret, typedWrong) {
    if (!passageEl) return;
    const chars = passageEl.querySelectorAll(".char");
    if (!chars.length) return;
    chars.forEach((el, i) => {
      el.classList.remove("ghost-typed", "ghost-caret");
      if (i < ghostCaret) el.classList.add("ghost-typed");
      if (i === ghostCaret) el.classList.add("ghost-caret");
    });
    // Ensure your current caret class stays on top
    chars.forEach((el, i) => {
      el.classList.toggle("current", i === yourCaret);
      if (i === yourCaret && typedWrong) el.classList.add("incorrect");
    });
  }

  function renderActivePassageWithGhost() {
    const isPractice = state.modeScreen === "practice" || state.practice.racing;
    if (isPractice && state.practice.passage) {
      renderPassageInto(
        els.practicePassage,
        state.practice.passage,
        state.practice.caret,
        state.practice.typedWrong
      );
      if (state.mode === "ghost") {
        paintGhostOnPassage(
          els.practicePassage,
          state.ghostCaret,
          state.practice.caret,
          state.practice.typedWrong
        );
      }
      return;
    }
    if (state.passage) {
      renderPassage();
      if (currentMode() === "ghost") {
        paintGhostOnPassage(els.passage, state.ghostCaret, state.caret, state.typedWrong);
      }
    }
  }

  function updatePracticeGhostUI(youProgress, youWpm) {
    if (!els.practiceGhostPanel) return;
    els.practiceGhostPanel.hidden = false;
    if (els.practiceGhostWpm) els.practiceGhostWpm.textContent = String(state.ghostWpm || 40);
    if (els.practiceGhostWpmSide) els.practiceGhostWpmSide.textContent = String(state.ghostWpm || 40);
    if (els.practiceGhostPct) els.practiceGhostPct.textContent = state.ghostProgress + "%";
    if (els.practiceGhostFill) els.practiceGhostFill.style.width = state.ghostProgress + "%";
    if (els.practiceGhostRacer) els.practiceGhostRacer.style.left = state.ghostProgress + "%";
    if (els.practiceYouFill) els.practiceYouFill.style.width = (youProgress || 0) + "%";
    if (els.practiceYouRacer) els.practiceYouRacer.style.left = (youProgress || 0) + "%";
    if (els.practiceYouWpmSide) els.practiceYouWpmSide.textContent = String(youWpm || 0);
  }

  function updateGameGhostBanner(youProgress) {
    if (!els.gameGhostBanner) return;
    els.gameGhostBanner.hidden = false;
    if (els.gameGhostWpmLabel) els.gameGhostWpmLabel.textContent = String(state.ghostWpm || 40);
    if (els.gameYouVsGhost) els.gameYouVsGhost.textContent = (youProgress || 0) + "%";
    if (els.gameGhostVsYou) els.gameGhostVsYou.textContent = (state.ghostProgress || 0) + "%";
  }

  function startGhostRace() {
    clearGhostInterval();
    const mode =
      state.practice.racing || state.modeScreen === "practice"
        ? state.mode
        : currentMode();
    if (mode !== "ghost") return;

    state.ghostWpm = loadGhostWpm();
    state.ghostProgress = 0;
    state.ghostCaret = 0;

    if (state.modeScreen === "game" || state.racing) {
      ensureGhostTrack();
      updateGhostTrack(0);
      updateGameGhostBanner(0);
    }
    if (state.modeScreen === "practice" || state.practice.racing) {
      updatePracticeGhostUI(0, 0);
      if (els.practiceInputHint) {
        els.practiceInputHint.textContent =
          "👻 Ghost types at " + state.ghostWpm + " WPM — purple caret is the ghost";
      }
    }

    renderActivePassageWithGhost();

    state.ghostTimer = setInterval(() => {
      const practiceActive = state.practice.racing;
      const multiActive = state.racing;
      if (!practiceActive && !multiActive) {
        stopGhostTimer();
        return;
      }

      const start = multiActive ? state.raceStart : state.practice.start;
      const passage = multiActive ? state.passage : state.practice.passage;
      if (!start || !passage || !passage.length) return;

      const elapsed = Date.now() - start;
      const chars = Math.min(passage.length, ghostCharsAt(elapsed, state.ghostWpm));
      state.ghostCaret = chars;
      state.ghostProgress = Math.round((chars / passage.length) * 100);

      if (multiActive) {
        updateGhostTrack(state.ghostProgress);
        const youProg = Math.round((state.caret / passage.length) * 100) || 0;
        updateGameGhostBanner(youProg);
        // Soft re-paint ghost marks (cheap enough at 10fps)
        paintGhostOnPassage(els.passage, state.ghostCaret, state.caret, state.typedWrong);
      }

      if (practiceActive) {
        const youProg = passage.length
          ? Math.round((state.practice.caret / passage.length) * 100)
          : 0;
        const stats = practiceStats();
        updatePracticeGhostUI(youProg, stats.wpm);
        paintGhostOnPassage(
          els.practicePassage,
          state.ghostCaret,
          state.practice.caret,
          state.practice.typedWrong
        );
      }
    }, 80);
  }

  wireSeg(els.roomParagraphs, "paragraphs", (n) => {
    if (!isHost()) return toast("Only the host can change paragraphs", true);
    const paragraphs = clampParagraphs(n);
    socket.emit("room:set-paragraphs", { paragraphs }, (res) => {
      if (!res?.ok) return toast(res?.error || "Could not set paragraphs", true);
      state.paragraphs = res.paragraphs;
      setParaSegActive(els.roomParagraphs, res.paragraphs);
      if (els.paraLabel) els.paraLabel.textContent = String(res.paragraphs);
      toast(res.paragraphs + " paragraph" + (res.paragraphs > 1 ? "s" : ""));
    });
  });

  // ---- Leaderboard ----
  let lbRenderToken = 0;
  let lbHomePoll = null;

  function readLocalScores() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_LB_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveLocalScore(entry) {
    const list = readLocalScores();
    list.unshift(entry);
    list.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy || (b.at || 0) - (a.at || 0));
    localStorage.setItem(LOCAL_LB_KEY, JSON.stringify(list.slice(0, 50)));
  }

  function personalBest() {
    const list = readLocalScores();
    return list[0] || null;
  }

  /** Merge server + local so new scores always appear even if one source lags. */
  function mergeLeaderboardEntries(serverEntries, localEntries) {
    const map = new Map();
    const keyOf = (e) =>
      [e.name, e.wpm, e.accuracy, e.mode, e.language, e.difficulty, e.at || 0].join("|");

    (serverEntries || []).forEach((e) => {
      map.set(e.id || keyOf(e), e);
    });
    (localEntries || []).forEach((e, i) => {
      const k = e.id || "local-" + keyOf(e) + "-" + i;
      if (!map.has(k)) {
        // avoid dupes of same score within 2s window
        const dup = [...map.values()].some(
          (s) =>
            s.name === e.name &&
            s.wpm === e.wpm &&
            s.mode === e.mode &&
            Math.abs((s.at || 0) - (e.at || 0)) < 2000
        );
        if (!dup) map.set(k, { ...e, id: k });
      }
    });

    return [...map.values()]
      .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy || (b.at || 0) - (a.at || 0))
      .slice(0, 15);
  }

  function renderLeaderboardEntries(entries, highlightId) {
    if (!els.leaderboardList) return;
    lbRenderToken += 1;

    if (!entries.length) {
      els.leaderboardList.innerHTML =
        '<li class="lb-empty">No scores yet — race or practice to post one.</li>';
    } else {
      // Force DOM replace so re-render is always visible
      els.leaderboardList.innerHTML = "";
      const frag = document.createDocumentFragment();
      entries.forEach((e, i) => {
        const li = document.createElement("li");
        const isNew =
          highlightId &&
          (e.id === highlightId ||
            (e.at && Date.now() - e.at < 15000 && e.name === getName()));
        if (isNew) li.classList.add("lb-new");
        li.innerHTML = `
          <span class="lb-rank">#${i + 1}</span>
          <div>
            <div class="lb-name">${escapeHtml(e.name)}</div>
            <div class="lb-meta">${modeLabel(e.mode)} · ${langLabel(e.language)} · ${capitalize(e.difficulty)} · ${e.accuracy}%</div>
          </div>
          <span class="lb-wpm">${e.wpm} WPM</span>
        `;
        frag.appendChild(li);
      });
      els.leaderboardList.appendChild(frag);
    }

    const pb = personalBest();
    if (els.lbPersonal) {
      els.lbPersonal.textContent = pb
        ? `Your best (this device): ${pb.wpm} WPM · ${pb.accuracy}% · ${modeLabel(pb.mode)}`
        : "Your best (this device): —";
    }
  }

  async function submitScore(payload) {
    const entry = {
      name: payload.name || getName(),
      wpm: Math.round(Number(payload.wpm) || 0),
      accuracy: Math.round(Number(payload.accuracy) || 100),
      mode: payload.mode || state.mode,
      language: payload.language || state.language,
      difficulty: payload.difficulty || state.difficulty,
      source: payload.source || "multi",
      at: Date.now(),
    };
    if (entry.wpm < 5) return;
    if (entry.accuracy < 1) entry.accuracy = 1;
    if (entry.accuracy > 100) entry.accuracy = 100;

    saveLocalScore(entry);

    // Optimistic UI: re-render immediately from local+server memory
    loadLeaderboard({ highlightAt: entry.at, optimistic: entry });

    try {
      const res = await fetch("/api/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(entry),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.warn("leaderboard post failed", err);
      }
    } catch (e) {
      console.warn("leaderboard post offline", e);
    }

    // Confirm from server (no-cache)
    await loadLeaderboard({ highlightAt: entry.at });
  }

  async function loadLeaderboard(opts) {
    if (!els.leaderboardList) return;
    const options = opts || {};
    let serverEntries = [];

    try {
      const res = await fetch("/api/leaderboard?limit=15&_=" + Date.now(), {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (res.ok) {
        const data = await res.json();
        serverEntries = data.entries || [];
      }
    } catch {
      serverEntries = [];
    }

    let local = readLocalScores();
    if (options.optimistic) {
      local = [options.optimistic, ...local.filter((e) => e.at !== options.optimistic.at)];
    }

    const entries = mergeLeaderboardEntries(serverEntries, local);
    const highlightId =
      options.highlightId ||
      (options.highlightAt
        ? (entries.find((e) => e.at === options.highlightAt) || {}).id
        : null);

    renderLeaderboardEntries(entries, highlightId || options.highlightAt);
  }

  function startLeaderboardHomePoll() {
    stopLeaderboardHomePoll();
    lbHomePoll = setInterval(() => {
      if (state.modeScreen === "home") loadLeaderboard();
    }, 8000);
  }

  function stopLeaderboardHomePoll() {
    if (lbHomePoll) {
      clearInterval(lbHomePoll);
      lbHomePoll = null;
    }
  }

  if (els.btnRefreshLb) {
    els.btnRefreshLb.addEventListener("click", () => {
      loadLeaderboard();
      toast("Leaderboard refreshed");
    });
  }

  socket.on("leaderboard:update", (payload) => {
    if (payload && Array.isArray(payload.top) && payload.top.length) {
      const merged = mergeLeaderboardEntries(payload.top, readLocalScores());
      renderLeaderboardEntries(
        merged,
        payload.entry && payload.entry.id
      );
    } else {
      loadLeaderboard({
        highlightId: payload && payload.entry && payload.entry.id,
      });
    }
  });

  function saveSession(session) {
    if (!session) return;
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        roomCode: session.roomCode,
        token: session.token,
        name: session.name || getName(),
        savedAt: Date.now(),
      })
    );
    updateReconnectBanner();
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    updateReconnectBanner();
  }

  function loadSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  }

  function updateReconnectBanner() {
    const s = loadSession();
    const onHome = state.modeScreen === "home" || els.home.classList.contains("active");
    if (s && s.roomCode && s.token && onHome && !state.room) {
      els.reconnectBanner.hidden = false;
      els.reconnectDetail.textContent = `Room ${s.roomCode} · reconnect within ~60s after refresh`;
    } else {
      els.reconnectBanner.hidden = true;
    }
  }

  function isHost() {
    return state.room && state.room.hostId === state.myId;
  }

  function me() {
    if (!state.room) return null;
    return state.room.players.find((p) => p.id === state.myId) || null;
  }

  function currentMode() {
    return (state.room && state.room.mode) || state.mode;
  }

  function setStatus(status) {
    const map = {
      lobby: ["Lobby", ""],
      countdown: ["Countdown", "countdown"],
      racing: ["Racing", "racing"],
      results: ["Results", "results"],
    };
    const [label, cls] = map[status] || ["Lobby", ""];
    els.statusPill.textContent = label;
    els.statusPill.className = "status-pill" + (cls ? " " + cls : "");
  }

  function stopUiTimer() {
    if (state.uiTimer) {
      clearInterval(state.uiTimer);
      state.uiTimer = null;
    }
    if (els.raceTimer) els.raceTimer.hidden = true;
  }

  function startUiTimer(startMs, durationMs) {
    stopUiTimer();
    if (!durationMs || durationMs > 90000) return; // only show for timed (60s)
    if (!els.raceTimer) return;
    els.raceTimer.hidden = false;
    const tick = () => {
      const left = Math.max(0, durationMs - (Date.now() - startMs));
      const sec = (left / 1000).toFixed(1);
      els.raceTimerVal.textContent = sec;
      els.raceTimer.classList.toggle("urgent", left <= 10000);
      if (left <= 0) stopUiTimer();
    };
    tick();
    state.uiTimer = setInterval(tick, 100);
  }

  function updateHostHint() {
    if (!els.hostHint || !state.room) {
      if (els.hostHint) els.hostHint.hidden = true;
      return;
    }
    const m = currentMode();
    if (isHost() && (state.room.status === "lobby" || state.room.status === "results")) {
      els.hostHint.hidden = false;
      if (state.room.status === "results") {
        if (m === "best_of_3" && state.room.seriesComplete) {
          els.hostHint.textContent = "Series over — Next Round starts a new series";
        } else if (m === "best_of_3") {
          els.hostHint.textContent = `Bo3 race ${(state.room.seriesRace || 0) + 1} next — press Next Round`;
        } else {
          els.hostHint.textContent = "Rematch ready — press Next Round";
        }
      } else {
        els.hostHint.textContent = `${modeLabel(m)} · start when ready`;
      }
    } else if (!isHost() && state.room.status === "results") {
      els.hostHint.hidden = false;
      els.hostHint.textContent = "Waiting for host…";
    } else {
      els.hostHint.hidden = true;
    }
  }

  function updateSeriesChip() {
    if (!els.seriesChip || !state.room) return;
    if (state.room.mode === "best_of_3") {
      els.seriesChip.hidden = false;
      const wins = state.room.players
        .slice()
        .sort((a, b) => (b.seriesWins || 0) - (a.seriesWins || 0))
        .slice(0, 3)
        .map((p) => `${p.name.slice(0, 8)}:${p.seriesWins || 0}`)
        .join(" · ");
      els.seriesScore.textContent = wins || "0";
    } else {
      els.seriesChip.hidden = true;
    }
  }

  function updateTeamChip() {
    if (!els.teamScoreChip || !state.room) return;
    if (state.room.mode !== "team") {
      els.teamScoreChip.hidden = true;
      if (els.teamPick) els.teamPick.hidden = true;
      return;
    }
    els.teamScoreChip.hidden = false;
    const teams = state.room.teams || {};
    if (els.teamAScore) {
      els.teamAScore.textContent = `${teams.A ? teams.A.progress : 0}% · ${teams.A ? teams.A.wpm : 0}w`;
    }
    if (els.teamBScore) {
      els.teamBScore.textContent = `${teams.B ? teams.B.progress : 0}% · ${teams.B ? teams.B.wpm : 0}w`;
    }

    const lobbyLike = state.room.status === "lobby" || state.room.status === "results";
    if (els.teamPick) els.teamPick.hidden = !lobbyLike;
    const self = me();
    if (els.playerTeam && self) {
      els.playerTeam.querySelectorAll(".seg-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.team === self.team);
      });
    }
  }

  function localTeamStats(players) {
    const stats = { A: { progress: 0, wpm: 0, n: 0 }, B: { progress: 0, wpm: 0, n: 0 } };
    players.forEach((p) => {
      if (!p.team || p.connected === false) return;
      if (!stats[p.team]) return;
      stats[p.team].progress += p.progress || 0;
      stats[p.team].wpm += p.wpm || 0;
      stats[p.team].n += 1;
    });
    ["A", "B"].forEach((k) => {
      if (stats[k].n) {
        stats[k].progress = Math.round(stats[k].progress / stats[k].n);
        stats[k].wpm = Math.round(stats[k].wpm / stats[k].n);
      }
    });
    return stats;
  }

  function renderPlayers() {
    if (!state.room) return;
    const players = state.room.players;
    const connected = players.filter((p) => p.connected !== false).length;
    els.playerCount.textContent = `${connected}/${state.room.maxPlayers || 10}`;
    els.playerList.innerHTML = "";

    players.forEach((p) => {
      const li = document.createElement("li");
      const offline = p.connected === false;
      const dead = !!p.eliminated;
      li.className =
        "player-item" +
        (p.id === state.myId ? " me" : "") +
        (offline ? " disconnected" : "") +
        (dead ? " eliminated" : "");

      let placeBadge;
      if (offline) placeBadge = `<span class="badge offline">Away</span>`;
      else if (dead) placeBadge = `<span class="badge dead">Out</span>`;
      else if (p.place != null && (state.room.status === "results" || p.finished))
        placeBadge = `<span class="badge place">#${p.place}</span>`;
      else if (p.ready) placeBadge = `<span class="badge ready">Ready</span>`;
      else placeBadge = `<span class="badge">Waiting</span>`;

      const series =
        state.room.mode === "best_of_3"
          ? `<span class="badge series">W${p.seriesWins || 0}</span>`
          : "";
      const teamBadge =
        state.room.mode === "team" && p.team
          ? `<span class="badge team-${p.team === "A" ? "a" : "b"}">T${p.team}</span>`
          : "";

      li.innerHTML = `
        <span class="player-dot" style="color:${p.color};background:${p.color}"></span>
        <div class="player-meta">
          <div class="player-name" style="color:${p.color}">${escapeHtml(p.name)}${p.id === state.myId ? " (you)" : ""}</div>
          <div class="player-sub">${p.wpm || 0} WPM · ${p.accuracy != null ? p.accuracy : 100}%</div>
        </div>
        <div class="player-badges">
          ${p.isHost || p.id === state.room.hostId ? '<span class="badge host">HOST</span>' : ""}
          ${teamBadge}
          ${series}
          ${placeBadge}
        </div>
      `;
      els.playerList.appendChild(li);
    });

    const host = isHost();
    const busy = state.room.status === "racing" || state.room.status === "countdown";
    els.btnStart.hidden = !host;
    els.btnStart.textContent =
      state.room.status === "results"
        ? state.room.mode === "best_of_3" && state.room.seriesComplete
          ? "New Series"
          : "Next Round"
        : "Start Race";
    els.btnStart.classList.toggle("btn-pulse", host && !busy);
    els.btnReady.classList.toggle("ready-on", state.ready);
    els.btnReady.textContent = state.ready ? "Unready" : "Ready";
    els.btnReady.disabled = busy;
    els.btnStart.disabled = busy;
    if (els.btnRematch) {
      els.btnRematch.hidden = !(host && state.room.status === "results");
      els.btnRematch.textContent = els.btnStart.textContent;
    }

    const canEdit = host && (state.room.status === "lobby" || state.room.status === "results");
    [els.roomDifficulty, els.roomLanguage, els.roomMode, els.roomParagraphs].forEach((root) => {
      if (!root) return;
      root.querySelectorAll(".seg-btn").forEach((b) => {
        b.disabled = !canEdit;
      });
    });
    setSegActive(els.roomDifficulty, state.room.difficulty || state.difficulty);
    setLangSegActive(els.roomLanguage, state.room.language || state.language);
    setModeSegActive(els.roomMode, state.room.mode || state.mode);
    setParaSegActive(els.roomParagraphs, state.room.paragraphs || state.paragraphs);
    if (els.diffLabel) els.diffLabel.textContent = capitalize(state.room.difficulty || "normal");
    if (els.langLabel) els.langLabel.textContent = langLabel(state.room.language || state.language);
    if (els.modeLabel) els.modeLabel.textContent = modeLabel(state.room.mode || state.mode);
    if (els.paraLabel) els.paraLabel.textContent = String(state.room.paragraphs || state.paragraphs || 1);

    updateHostHint();
    updateSeriesChip();
    updateTeamChip();
  }

  function renderTracks() {
    if (!state.room) return;
    els.trackBoard.innerHTML = "";

    // Team aggregate tracks first
    if (state.room.mode === "team") {
      const teams = state.room.teams || localTeamStats(state.room.players);
      ["A", "B"].forEach((key) => {
        const t = teams[key] || { progress: 0, wpm: 0 };
        const color = key === "A" ? "#4cc9f0" : "#f72585";
        const row = document.createElement("div");
        row.className = "track";
        row.dataset.id = "__team_" + key;
        row.innerHTML = `
          <div class="track-name" style="color:${color}">Team ${key}</div>
          <div class="track-lane">
            <div class="track-fill" style="color:${color};width:${t.progress || 0}%"></div>
            <div class="track-racer" style="color:${color};left:${t.progress || 0}%"></div>
          </div>
          <div class="track-wpm">${t.wpm || 0}</div>
        `;
        els.trackBoard.appendChild(row);
      });
    }

    state.room.players.forEach((p) => {
      const row = document.createElement("div");
      row.className = "track";
      row.dataset.id = p.id;
      row.style.opacity = p.connected === false || p.eliminated ? "0.45" : "1";
      const label =
        state.room.mode === "team" && p.team
          ? `[${p.team}] ${p.name}`
          : p.name;
      row.innerHTML = `
        <div class="track-name" style="color:${p.color}">${escapeHtml(label)}</div>
        <div class="track-lane">
          <div class="track-fill" style="color:${p.color};width:${p.progress || 0}%"></div>
          <div class="track-racer${p.finished || p.eliminated ? " finished" : ""}" style="color:${p.color};left:${p.progress || 0}%"></div>
        </div>
        <div class="track-wpm">${p.wpm || 0}</div>
      `;
      els.trackBoard.appendChild(row);
    });

    if (state.room.mode === "ghost" && (state.racing || state.room.status === "racing" || state.room.status === "countdown")) {
      ensureGhostTrack();
      updateGhostTrack(state.ghostProgress || 0);
    }
  }

  function updateTrackPlayer(update) {
    if (!state.room) return;
    const p = state.room.players.find((x) => x.id === update.id);
    if (p) Object.assign(p, update);
    const row = els.trackBoard.querySelector(`.track[data-id="${update.id}"]`);
    if (!row) {
      renderTracks();
      return;
    }
    const fill = row.querySelector(".track-fill");
    const racer = row.querySelector(".track-racer");
    const wpm = row.querySelector(".track-wpm");
    if (fill) fill.style.width = (update.progress || 0) + "%";
    if (racer) {
      racer.style.left = (update.progress || 0) + "%";
      racer.classList.toggle("finished", !!(update.finished || update.eliminated));
    }
    if (wpm) wpm.textContent = update.wpm || 0;
  }

  function renderPassageInto(el, text, caret, typedWrong) {
    if (!text) {
      el.innerHTML = '<span class="char upcoming">Passage appears when the race begins…</span>';
      return;
    }
    let html = "";
    for (let i = 0; i < text.length; i++) {
      let cls = "char ";
      if (i < caret) cls += "correct";
      else if (i === caret) cls += typedWrong ? "incorrect current" : "current";
      else cls += "upcoming";
      const ch = text[i] === " " ? "&nbsp;" : escapeHtml(text[i]);
      html += `<span class="${cls}">${ch}</span>`;
    }
    el.innerHTML = html;
    const cur = el.querySelector(".char.current");
    if (cur) cur.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function renderPassage() {
    renderPassageInto(els.passage, state.passage, state.caret, state.typedWrong);
  }

  function updateLocalStats() {
    const elapsed = state.raceStart ? Math.max(1, Date.now() - state.raceStart) : 1;
    const minutes = elapsed / 60000;
    const correct = state.caret;
    const wpm = Math.min(400, Math.round(correct / 5 / minutes) || 0);
    const total = correct + state.errors;
    const acc = total === 0 ? 100 : Math.round((correct / total) * 100);
    const prog = state.passage ? Math.round((correct / state.passage.length) * 100) : 0;
    els.statWpm.textContent = String(wpm);
    els.statAcc.textContent = acc + "%";
    els.statProg.textContent = prog + "%";
    els.statErr.textContent = String(state.errors);
    return {
      correct,
      errors: state.errors,
      wpm,
      accuracy: acc,
      progress: prog,
      elapsed,
    };
  }

  function clearHistoryTimer() {
    if (state.historyTimer) {
      clearInterval(state.historyTimer);
      state.historyTimer = null;
    }
  }

  function resetHistory() {
    clearHistoryTimer();
    state.history = [];
  }

  function pushHistorySample(sample) {
    const last = state.history[state.history.length - 1];
    // avoid flooding identical points
    if (
      last &&
      last.wpm === sample.wpm &&
      last.progress === sample.progress &&
      last.accuracy === sample.accuracy &&
      sample.t - last.t < 400
    ) {
      return;
    }
    state.history.push(sample);
    if (state.history.length > 400) state.history.shift();
  }

  function startHistorySampler(getSample) {
    resetHistory();
    const first = getSample();
    pushHistorySample(first);
    state.historyTimer = setInterval(() => {
      pushHistorySample(getSample());
    }, 250);
  }

  function stopHistorySampler(finalSample) {
    clearHistoryTimer();
    if (finalSample) pushHistorySample(finalSample);
  }

  function renderPersonalStats(container, summary) {
    if (!container) return;
    const place =
      summary.place != null ? `#${summary.place}` : "—";
    const time =
      summary.durationMs != null
        ? (summary.durationMs / 1000).toFixed(1) + "s"
        : "—";
    container.innerHTML = `
      <div class="pstat"><span class="pstat-label">Place</span><span class="pstat-value gold">${place}</span></div>
      <div class="pstat"><span class="pstat-label">WPM</span><span class="pstat-value accent">${summary.finalWpm}</span></div>
      <div class="pstat"><span class="pstat-label">Peak WPM</span><span class="pstat-value hot">${summary.peakWpm}</span></div>
      <div class="pstat"><span class="pstat-label">Avg WPM</span><span class="pstat-value">${summary.avgWpm}</span></div>
      <div class="pstat"><span class="pstat-label">Accuracy</span><span class="pstat-value">${summary.accuracy}%</span></div>
      <div class="pstat"><span class="pstat-label">Errors</span><span class="pstat-value">${summary.errors}</span></div>
      <div class="pstat"><span class="pstat-label">Time</span><span class="pstat-value">${time}</span></div>
      <div class="pstat"><span class="pstat-label">Progress</span><span class="pstat-value">${summary.progress}%</span></div>
      <div class="pstat"><span class="pstat-label">Chars</span><span class="pstat-value">${summary.correct || 0}</span></div>
    `;
  }

  function drawPersonalChart(canvas, history, title) {
    if (!canvas || !window.KeyClashCharts) return;
    // ensure layout size then draw
    requestAnimationFrame(() => {
      KeyClashCharts.drawRaceCharts(canvas, history, { title: title || "Your race graph" });
    });
  }

  function emitProgress() {
    if (!state.racing) return;
    const stats = updateLocalStats();
    socket.emit("race:progress", { correct: stats.correct, errors: stats.errors });
  }

  function resetStatsDisplay() {
    els.statWpm.textContent = "0";
    els.statAcc.textContent = "100%";
    els.statProg.textContent = "0%";
    els.statErr.textContent = "0";
  }

  function applyRoom(room) {
    state.room = room;
    state.myId = socket.id;
    els.roomCode.textContent = room.code;
    els.roundNum.textContent = String(room.round || 1);
    state.difficulty = room.difficulty || state.difficulty;
    state.language = room.language || state.language;
    state.mode = room.mode || state.mode;
    state.paragraphs = clampParagraphs(room.paragraphs || state.paragraphs);
    if (room.raceDurationMs) state.raceDurationMs = room.raceDurationMs;
    setStatus(room.status);

    if (room.passage && room.status !== "lobby") {
      state.passage = normalizeTypingText(room.passage);
    }

    if (room.status === "lobby") {
      state.racing = false;
      state.passage = "";
      state.caret = 0;
      state.errors = 0;
      state.typedWrong = false;
      state.confettiShown = false;
      state.resultsShownForRound = null;
      state.ghostProgress = 0;
      resetHistory();
      stopUiTimer();
      stopGhostTimer();
      els.countdownOverlay.hidden = true;
      els.resultsOverlay.hidden = true;
      els.typeInput.disabled = true;
      els.typeInput.value = "";
      els.typeInput.placeholder = "Waiting for race to start...";
      els.inputHint.textContent = isHost()
        ? "You are host - pick mode, language, difficulty & start"
        : `${modeLabel(room.mode)} — host starts when ready`;
      renderPassage();
      resetStatsDisplay();
    } else if (room.status === "results") {
      state.racing = false;
      stopUiTimer();
      els.typeInput.disabled = true;
      const roundKey = `${room.code}-${room.round}-${room.seriesRace || 0}`;
      if (state.resultsShownForRound !== roundKey) showResults(room);
    }

    const self = me();
    if (self) state.ready = !!self.ready;

    renderPlayers();
    renderTracks();
    updateReconnectBanner();
  }

  function showResults(room) {
    state.resultsShownForRound = `${room.code}-${room.round}-${room.seriesRace || 0}`;
    els.resultsOverlay.hidden = false;
    stopGhostTimer();
    const sorted = [...room.players].sort((a, b) => (a.place || 99) - (b.place || 99));
    const winner = sorted[0];
    const self = sorted.find((p) => p.id === state.myId);

    if (els.resultsTitle) {
      if (room.mode === "best_of_3" && room.seriesComplete) {
        const champ = room.players.find((p) => p.id === room.seriesChampionId) || winner;
        els.resultsTitle.textContent = `${champ ? champ.name : "Someone"} wins the series!`;
      } else if (room.mode === "timed") {
        els.resultsTitle.textContent = winner ? `${winner.name} — most typed!` : "Time's up";
      } else if (room.mode === "sudden_death") {
        els.resultsTitle.textContent = winner && !winner.eliminated ? `${winner.name} survives!` : "Sudden Death";
      } else if (room.mode === "team" && room.teams) {
        const top = room.teams.A && room.teams.B
          ? room.teams.A.place === 1
            ? "Team A"
            : "Team B"
          : "Team";
        els.resultsTitle.textContent = `${top} wins!`;
      } else if (room.mode === "ghost" && self) {
        const beat = self.wpm > (state.ghostWpm || 0);
        els.resultsTitle.textContent = beat ? "You beat your ghost!" : "Ghost wins this time";
      } else {
        els.resultsTitle.textContent =
          winner && winner.finished ? `${winner.name} wins!` : "Race Complete";
      }
    }

    let listHtml = "";
    if (room.mode === "team" && room.teams) {
      listHtml += ["A", "B"]
        .map((key) => {
          const t = room.teams[key];
          if (!t) return "";
          return `
            <li class="place-${t.place || ""}">
              <span class="place-num">#${t.place || "—"}</span>
              <span class="res-name" style="color:${key === "A" ? "#4cc9f0" : "#f72585"}">Team ${key}</span>
              <span class="res-stats">${t.wpm || 0} avg WPM · ${t.progress || 0}% · ${t.members || 0} players</span>
            </li>`;
        })
        .join("");
    }

    listHtml += sorted
      .map((p) => {
        const place = p.place || "—";
        const time =
          p.finishTime != null ? (p.finishTime / 1000).toFixed(1) + "s" : "DNF";
        const tag = p.eliminated
          ? "OUT"
          : room.mode === "best_of_3"
            ? `W${p.seriesWins || 0}`
            : room.mode === "team" && p.team
              ? `T${p.team}`
              : time;
        return `
          <li class="place-${place}">
            <span class="place-num">#${place}</span>
            <span class="res-name" style="color:${p.color}">${escapeHtml(p.name)}</span>
            <span class="res-stats">${p.wpm || 0} WPM · ${p.accuracy || 0}% · ${tag}</span>
          </li>
        `;
      })
      .join("");

    if (room.mode === "ghost") {
      listHtml =
        `
        <li class="place-2">
          <span class="place-num">👻</span>
          <span class="res-name" style="color:#8b93b8">Your Ghost</span>
          <span class="res-stats">${state.ghostWpm || 40} WPM target</span>
        </li>` + listHtml;
    }

    els.resultsList.innerHTML = listHtml;

    if (self && self.wpm >= 5) {
      saveGhostWpm(self.wpm);
    }

    // Per-user result cards + graph
    if (self) {
      if (els.yourResultBlock) els.yourResultBlock.hidden = false;
      const finalStats = {
        wpm: self.wpm || 0,
        accuracy: self.accuracy != null ? self.accuracy : 100,
        errors: self.errors || 0,
        progress: self.progress != null ? self.progress : self.finished ? 100 : 0,
        place: self.place,
        correct: self.correct || 0,
        elapsed: self.finishTime || (state.history.length > 1
          ? state.history[state.history.length - 1].t - state.history[0].t
          : 0),
      };
      const summary = window.KeyClashCharts
        ? KeyClashCharts.summarizeHistory(state.history, finalStats)
        : {
            ...finalStats,
            finalWpm: finalStats.wpm,
            peakWpm: finalStats.wpm,
            avgWpm: finalStats.wpm,
            durationMs: finalStats.elapsed,
          };
      if (summary.place == null) summary.place = self.place;
      renderPersonalStats(els.personalStats, summary);
      drawPersonalChart(els.raceChart, state.history, "Your race · WPM & progress");
    } else if (els.yourResultBlock) {
      els.yourResultBlock.hidden = true;
    }

    if (isHost()) {
      els.resultsHint.textContent =
        room.mode === "best_of_3" && !room.seriesComplete
          ? "Series continues — Next Round"
          : "Press Next Round to clash again";
      if (els.btnRematch) els.btnRematch.hidden = false;
    } else {
      els.resultsHint.textContent = "Waiting for host to start the next round…";
      if (els.btnRematch) els.btnRematch.hidden = true;
    }

    if (!state.confettiShown) {
      state.confettiShown = true;
      if (self && self.wpm >= 5) {
        submitScore({
          name: self.name,
          wpm: self.wpm,
          accuracy: self.accuracy,
          mode: room.mode,
          language: room.language,
          difficulty: room.difficulty,
          source: "multi",
        });
      }
      if (self && self.place === 1 && !self.eliminated) {
        KeyClashFX.victoryFX(1);
      } else if (self && self.place && self.place <= 3) {
        KeyClashFX.victoryFX(self.place);
      } else {
        KeyClashFX.screenFlash("rgba(123,44,191,0.12)");
        KeyClashFX.launchConfetti({ amount: 40 });
      }
    }
    updateHostHint();
  }

  function runCountdown(duration, numEl, overlayEl, onDone) {
    overlayEl.hidden = false;
    const start = Date.now();
    const labels = ["3", "2", "1", "GO"];
    let last = -1;
    function frame() {
      const t = Date.now() - start;
      const idx = Math.min(3, Math.floor(t / (duration / 4)));
      if (idx !== last) {
        last = idx;
        numEl.textContent = labels[idx];
        numEl.style.animation = "none";
        void numEl.offsetWidth;
        numEl.style.animation = "";
        KeyClashFX.SFX.countdown(labels[idx] === "GO" ? "GO" : Number(labels[idx]));
        if (labels[idx] === "GO") KeyClashFX.screenFlash("rgba(0,245,212,0.15)");
      }
      if (t < duration) requestAnimationFrame(frame);
      else {
        overlayEl.hidden = true;
        if (onDone) onDone();
      }
    }
    frame();
  }

  function beginRace(raceStart, passage, raceDurationMs) {
    state.racing = true;
    state.raceStart = raceStart || Date.now();
    state.raceDurationMs = raceDurationMs || state.raceDurationMs || 120000;
    state.passage = normalizeTypingText(passage || state.passage);
    state.caret = 0;
    state.errors = 0;
    state.typedWrong = false;
    state.ready = false;
    state.confettiShown = false;
    state.resultsShownForRound = null;
    els.resultsOverlay.hidden = true;
    els.countdownOverlay.hidden = true;
    els.typeInput.disabled = false;
    els.typeInput.value = "";
    els.typeInput.placeholder = "Type the passage above…";
    const m = currentMode();
    if (m === "sudden_death") els.inputHint.textContent = "Sudden Death — one error and you're out!";
    else if (m === "timed") els.inputHint.textContent = "60 seconds — type as far as you can!";
    else if (m === "ghost")
      els.inputHint.textContent = `Ghost race — beat ${loadGhostWpm()} WPM ghost!`;
    else if (m === "team") els.inputHint.textContent = "Team mode — push your team's average!";
    else if (m === "words") els.inputHint.textContent = "Word mode — type every word carefully!";
    else els.inputHint.textContent = "Go! Accuracy matters as much as speed";
    setStatus("racing");
    renderPassage();
    resetStatsDisplay();
    els.typeInput.focus();
    if (m === "timed") startUiTimer(state.raceStart, state.raceDurationMs);
    else stopUiTimer();
    if (m === "ghost") startGhostRace();
    else stopGhostTimer();

    startHistorySampler(() => {
      const s = updateLocalStats();
      return {
        t: Date.now(),
        wpm: s.wpm,
        progress: s.progress,
        accuracy: s.accuracy,
        errors: s.errors,
        correct: s.correct,
      };
    });

    if (state.progressTimer) clearInterval(state.progressTimer);
    state.progressTimer = setInterval(emitProgress, 200);
  }

  function endLocalRace() {
    state.racing = false;
    els.typeInput.disabled = true;
    if (state.progressTimer) {
      clearInterval(state.progressTimer);
      state.progressTimer = null;
    }
    const s = updateLocalStats();
    stopHistorySampler({
      t: Date.now(),
      wpm: s.wpm,
      progress: s.progress,
      accuracy: s.accuracy,
      errors: s.errors,
      correct: s.correct,
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function appendChat({ name, color, text }) {
    const div = document.createElement("div");
    div.className = "chat-msg";
    div.innerHTML = `<span class="who" style="color:${color}">${escapeHtml(name)}</span><span class="txt">${escapeHtml(text)}</span>`;
    els.chatLog.appendChild(div);
    els.chatLog.scrollTop = els.chatLog.scrollHeight;
  }

  function afterPassageRender(passageEl, yourCaret, typedWrong) {
    const mode = currentMode() === "ghost" || state.mode === "ghost";
    const inGhost =
      mode &&
      (state.mode === "ghost" || (state.room && state.room.mode === "ghost"));
    if (!inGhost && state.mode !== "ghost" && currentMode() !== "ghost") return;
    if (state.mode === "ghost" || currentMode() === "ghost") {
      paintGhostOnPassage(passageEl, state.ghostCaret, yourCaret, typedWrong);
    }
  }

  function handleTyping(getState, setState, passageEl, inputEl, onStats, onFinish, opts) {
    const st = getState();
    if (!st.racing || !st.passage) return;
    const val = inputEl.value;
    if (!val) {
      setState({ typedWrong: false });
      renderPassageInto(passageEl, st.passage, st.caret, false);
      afterPassageRender(passageEl, st.caret, false);
      return;
    }

    const expected = normalizeChar(st.passage[st.caret]);
    const got = normalizeChar(val[val.length - 1]);
    const mode = (opts && opts.mode) || currentMode();

    if (got === expected) {
      const caret = st.caret + 1;
      setState({ caret, typedWrong: false });
      inputEl.value = "";
      KeyClashFX.SFX.key();
      const now = Date.now();
      if (now - state.lastKeyBurst > 40) {
        state.lastKeyBurst = now;
        const cur = passageEl.querySelector(".char.current") || passageEl;
        KeyClashFX.burstAtElement(cur, me()?.color || "#00f5d4", 8);
      }
      renderPassageInto(passageEl, st.passage, caret, false);
      afterPassageRender(passageEl, caret, false);
      onStats();
      if (caret >= st.passage.length) onFinish({ completed: true });
    } else {
      const errors = st.errors + (st.typedWrong ? 0 : 1);
      setState({ errors, typedWrong: true });
      if (!st.typedWrong) {
        KeyClashFX.SFX.error();
        passageEl.classList.remove("shake");
        void passageEl.offsetWidth;
        passageEl.classList.add("shake");
      }
      inputEl.value = got || "";
      renderPassageInto(passageEl, st.passage, st.caret, true);
      afterPassageRender(passageEl, st.caret, true);
      onStats();
      if (mode === "sudden_death" && errors >= 1) {
        onFinish({ eliminated: true });
      }
    }
  }

  els.typeInput.addEventListener("input", () => {
    handleTyping(
      () => state,
      (patch) => Object.assign(state, patch),
      els.passage,
      els.typeInput,
      () => {
        updateLocalStats();
        emitProgress();
      },
      (info) => {
        endLocalRace();
        emitProgress();
        const stats = updateLocalStats();
        if (stats.wpm >= 5) saveGhostWpm(stats.wpm);
        if (info && info.eliminated) {
          els.inputHint.textContent = "Eliminated — one mistake!";
          toast("Sudden Death — you're out!", true);
        } else if (currentMode() === "ghost") {
          const beat = stats.wpm > (state.ghostWpm || 0);
          els.inputHint.textContent = beat
            ? `Finished! You beat the ${state.ghostWpm} WPM ghost`
            : `Finished — ghost was ${state.ghostWpm} WPM`;
          toast(beat ? "Ghost beaten!" : "Ghost still faster — try again");
          KeyClashFX.burstAtElement(els.passage, beat ? "#ffd60a" : "#8b93b8", 40);
          KeyClashFX.SFX.finish();
        } else {
          els.inputHint.textContent =
            currentMode() === "timed"
              ? "Finished the wall of text! Waiting…"
              : "Finished! Waiting for others…";
          KeyClashFX.burstAtElement(els.passage, "#ffd60a", 40);
          KeyClashFX.SFX.finish();
        }
      }
    );
  });

  els.typeInput.addEventListener("keydown", (e) => {
    if (!state.racing) return;
    if (e.key === "Tab") e.preventDefault();
    if (e.key === "Backspace") state.typedWrong = false;
  });

  // ---- Practice ----
  function practiceStats() {
    const p = state.practice;
    const elapsed = p.start ? Math.max(1, Date.now() - p.start) : 1;
    const minutes = elapsed / 60000;
    const correct = p.caret;
    const wpm = Math.min(400, Math.round(correct / 5 / minutes) || 0);
    const total = correct + p.errors;
    const acc = total === 0 ? 100 : Math.round((correct / total) * 100);
    const prog = p.passage ? Math.round((correct / p.passage.length) * 100) : 0;
    els.pStatWpm.textContent = String(wpm);
    els.pStatAcc.textContent = acc + "%";
    els.pStatProg.textContent = prog + "%";
    els.pStatErr.textContent = String(p.errors);
    return { wpm, acc, prog, elapsed, correct };
  }

  function stopPracticeTimer() {
    if (state.practice.timerId) {
      clearInterval(state.practice.timerId);
      state.practice.timerId = null;
    }
    if (els.practiceTimer) els.practiceTimer.hidden = true;
  }

  async function startPractice() {
    showScreen("practice");
    els.practiceResults.hidden = true;
    els.practiceInput.disabled = true;
    els.practiceInput.value = "";
    els.practiceDiffLabel.textContent = capitalize(state.difficulty);
    if (els.practiceLangLabel) els.practiceLangLabel.textContent = langLabel(state.language);
    if (els.practiceModeLabel) els.practiceModeLabel.textContent = modeLabel(state.mode);
    if (els.practiceParaLabel) els.practiceParaLabel.textContent = String(state.paragraphs);
    els.practiceStatus.textContent = "Loading";
    els.practiceStatus.className = "status-pill countdown";
    stopPracticeTimer();

    try {
      const qs = new URLSearchParams({
        difficulty: state.difficulty,
        language: state.language,
        mode: state.mode,
        paragraphs: String(state.paragraphs),
      });
      const res = await fetch("/api/practice?" + qs.toString());
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      const passage = normalizeTypingText(data.passage);
      state.practice = {
        passage,
        caret: 0,
        errors: 0,
        typedWrong: false,
        racing: false,
        start: null,
        durationMs: data.durationMs || (state.mode === "timed" ? 60000 : null),
        timerId: null,
      };
      renderPassageInto(els.practicePassage, passage, 0, false);
      practiceStats();

      // Show ghost panel during countdown so player sees it early
      if (state.mode === "ghost") {
        state.ghostWpm = loadGhostWpm();
        state.ghostCaret = 0;
        state.ghostProgress = 0;
        if (els.practiceGhostPanel) els.practiceGhostPanel.hidden = false;
        updatePracticeGhostUI(0, 0);
        if (els.practiceInputHint) {
          els.practiceInputHint.textContent =
            "👻 Ghost at " + state.ghostWpm + " WPM — purple mark moves through the text";
        }
        paintGhostOnPassage(els.practicePassage, 0, 0, false);
      } else if (els.practiceGhostPanel) {
        els.practiceGhostPanel.hidden = true;
      }

      runCountdown(3000, els.practiceCountdownNum, els.practiceCountdown, () => {
        state.practice.racing = true;
        state.practice.start = Date.now();
        els.practiceInput.disabled = false;
        els.practiceInput.focus();
        els.practiceStatus.textContent = "Racing";
        els.practiceStatus.className = "status-pill racing";

        startHistorySampler(() => {
          const s = practiceStats();
          return {
            t: Date.now(),
            wpm: s.wpm,
            progress: s.prog,
            accuracy: s.acc,
            errors: state.practice.errors,
            correct: s.correct,
          };
        });

        if (state.practice.durationMs && els.practiceTimer) {
          els.practiceTimer.hidden = false;
          state.practice.timerId = setInterval(() => {
            const left = Math.max(
              0,
              state.practice.durationMs - (Date.now() - state.practice.start)
            );
            els.practiceTimerVal.textContent = (left / 1000).toFixed(1);
            els.practiceTimer.classList.toggle("urgent", left <= 10000);
            if (left <= 0) {
              stopPracticeTimer();
              finishPractice({ timedOut: true });
            }
          }, 100);
        }

        if (state.mode === "ghost") {
          startGhostRace();
        }
      });
    } catch {
      toast("Could not load practice passage", true);
      showScreen("home");
    }
  }

  function finishPractice(info) {
    if (!state.practice.racing && !(info && info.timedOut)) return;
    state.practice.racing = false;
    els.practiceInput.disabled = true;
    stopPracticeTimer();
    stopGhostTimer();
    const stats = practiceStats();
    stopHistorySampler({
      t: Date.now(),
      wpm: stats.wpm,
      progress: stats.prog,
      accuracy: stats.acc,
      errors: state.practice.errors,
      correct: stats.correct,
    });

    els.practiceResults.hidden = false;
    els.practiceStatus.textContent = "Done";
    els.practiceStatus.className = "status-pill results";

    let note =
      info && info.eliminated
        ? "Eliminated (sudden death)"
        : info && info.timedOut
          ? "Time's up"
          : "Completed";
    if (state.mode === "ghost") {
      const beat = stats.wpm > (state.ghostWpm || 0);
      note = beat
        ? `Beat ghost (${state.ghostWpm} WPM)`
        : `Ghost was ${state.ghostWpm} WPM`;
    }
    if (state.mode === "words") note += " · Word mode";

    const summary = window.KeyClashCharts
      ? KeyClashCharts.summarizeHistory(state.history, {
          wpm: stats.wpm,
          accuracy: stats.acc,
          errors: state.practice.errors,
          progress: stats.prog,
          place: info && info.eliminated ? null : 1,
          correct: stats.correct,
          elapsed: stats.elapsed,
        })
      : {
          finalWpm: stats.wpm,
          peakWpm: stats.wpm,
          avgWpm: stats.wpm,
          accuracy: stats.acc,
          errors: state.practice.errors,
          progress: stats.prog,
          place: 1,
          correct: stats.correct,
          durationMs: stats.elapsed,
        };

    if (info && info.eliminated) summary.place = null;
    renderPersonalStats(els.practicePersonalStats, summary);
    drawPersonalChart(
      els.practiceChart,
      state.history,
      note ? `Practice · ${note}` : "Practice graph"
    );

    if (els.practiceScore) {
      els.practiceScore.hidden = true;
    }

    if (stats.wpm >= 5) saveGhostWpm(stats.wpm);
    submitScore({
      wpm: stats.wpm,
      accuracy: stats.acc,
      mode: state.mode,
      language: state.language,
      difficulty: state.difficulty,
      source: "practice",
    });
    if (info && info.eliminated) {
      KeyClashFX.screenFlash("rgba(255,77,109,0.15)");
    } else if (state.mode === "ghost" && stats.wpm > (state.ghostWpm || 0)) {
      KeyClashFX.victoryFX(1);
    } else if (state.mode !== "ghost") {
      KeyClashFX.victoryFX(1);
    } else {
      KeyClashFX.screenFlash("rgba(139,147,184,0.15)");
    }
  }

  els.practiceInput.addEventListener("input", () => {
    handleTyping(
      () => state.practice,
      (patch) => Object.assign(state.practice, patch),
      els.practicePassage,
      els.practiceInput,
      practiceStats,
      (info) => finishPractice(info || { completed: true }),
      { mode: state.mode }
    );
  });

  function enterGame(room, session) {
    if (session) saveSession(session);
    applyRoom(room);
    showScreen("game");
    KeyClashFX.SFX.join();
    showHomeError("");
  }

  els.btnCreate.addEventListener("click", () => {
    showHomeError("");
    els.btnCreate.disabled = true;
    socket.emit(
      "room:create",
      {
        name: getName(),
        difficulty: state.difficulty,
        language: state.language,
        mode: state.mode,
        paragraphs: state.paragraphs,
      },
      (res) => {
        els.btnCreate.disabled = false;
        if (!res?.ok) {
          showHomeError(res?.error || "Could not create room.");
          toast(res?.error || "Create failed", true);
          return;
        }
        enterGame(res.room, res.session);
        toast("Room created — " + modeLabel(res.room.mode));
      }
    );
  });

  els.btnJoin.addEventListener("click", () => {
    showHomeError("");
    const code = (els.code.value || "").trim().toUpperCase();
    if (!code) {
      showHomeError("Enter the 5-character room code from your host.");
      return;
    }
    els.btnJoin.disabled = true;
    socket.emit("room:join", { code, name: getName() }, (res) => {
      els.btnJoin.disabled = false;
      if (!res?.ok) {
        showHomeError(res?.error || "Could not join room.");
        toast(res?.error || "Join failed", true);
        return;
      }
      enterGame(res.room, res.session);
      toast("Joined · " + modeLabel(res.room.mode));
    });
  });

  els.btnPractice.addEventListener("click", () => {
    showHomeError("");
    startPractice();
  });

  function exitPractice() {
    state.practice.racing = false;
    stopPracticeTimer();
    stopGhostTimer();
    showScreen("home");
  }
  els.btnPracticeExit.addEventListener("click", exitPractice);
  els.btnPracticeHome.addEventListener("click", exitPractice);
  els.btnPracticeAgain.addEventListener("click", () => startPractice());

  els.code.addEventListener("keydown", (e) => {
    if (e.key === "Enter") els.btnJoin.click();
  });
  els.name.addEventListener("keydown", (e) => {
    if (e.key === "Enter") els.btnCreate.click();
  });

  els.btnReady.addEventListener("click", () => {
    state.ready = !state.ready;
    socket.emit("player:ready", { ready: state.ready });
    els.btnReady.classList.toggle("ready-on", state.ready);
    els.btnReady.textContent = state.ready ? "Unready" : "Ready";
  });

  function requestStart() {
    socket.emit("race:request-start", {}, (res) => {
      if (res && res.ok === false) toast(res.error || "Could not start", true);
    });
  }
  els.btnStart.addEventListener("click", requestStart);
  if (els.btnRematch) els.btnRematch.addEventListener("click", requestStart);

  els.btnLeave.addEventListener("click", () => {
    socket.emit("room:leave", () => {
      clearSession();
      state.room = null;
      state.racing = false;
      endLocalRace();
      stopUiTimer();
      showScreen("home");
      toast("Left room");
    });
  });

  function getGameUrl() {
    // Public URL of this KeyClash instance (localhost, LAN, or deployed domain)
    return window.location.origin + "/";
  }

  function buildInviteText(code) {
    const url = getGameUrl();
    const room = code || (state.room && state.room.code) || "-----";
    return (
      "Join my KeyClash room!\n" +
      "Link: " +
      url +
      "\nRoom code: " +
      room +
      "\n\nOpen the link → enter your name → Join with the code."
    );
  }

  function isLocalHost() {
    const h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  }

  function updateShareHelp() {
    if (!els.shareHelpText) return;
    const url = getGameUrl();
    if (isLocalHost()) {
      els.shareHelpText.innerHTML =
        "Ngayon: <code>" +
        escapeHtml(url) +
        "</code> — <strong>PC mo lang</strong> (o same Wi‑Fi kung gagamit ng LAN IP).<br>" +
        "Para sa <strong>internet shareable link</strong>: i-deploy sa Railway/Render → yung <code>https://….up.railway.app</code> ang ishe-share + room code. See <strong>DEPLOY.md</strong>.";
    } else {
      els.shareHelpText.innerHTML =
        "Shareable game link mo: <code>" +
        escapeHtml(url) +
        "</code><br>" +
        "Ipadala ito sa friends + <strong>room code</strong> (sa loob ng room, pindutin <em>Share invite</em>).";
    }
  }

  async function copyText(text, okMsg) {
    try {
      await navigator.clipboard.writeText(text);
      toast(okMsg || "Copied");
      return true;
    } catch {
      toast(text);
      return false;
    }
  }

  els.btnCopy.addEventListener("click", async () => {
    if (!state.room) return;
    await copyText(state.room.code, "Room code copied: " + state.room.code);
  });

  if (els.btnShare) {
    els.btnShare.addEventListener("click", async () => {
      if (!state.room) return;
      const text = buildInviteText(state.room.code);
      if (navigator.share) {
        try {
          await navigator.share({
            title: "KeyClash",
            text: text,
            url: getGameUrl(),
          });
          toast("Invite shared");
          return;
        } catch {
          /* fall through to clipboard */
        }
      }
      await copyText(text, "Invite link + code copied — paste sa chat/Discord");
      if (isLocalHost()) {
        toast("Note: localhost link works on your PC only. Deploy for internet play.", true);
      }
    });
  }

  if (els.btnCopyGameUrl) {
    els.btnCopyGameUrl.addEventListener("click", async () => {
      await copyText(getGameUrl(), "Game URL copied: " + getGameUrl());
      if (isLocalHost()) {
        setTimeout(() => {
          toast("Localhost = this PC only. Deploy online for a real share link.", true);
        }, 600);
      }
    });
  }

  updateShareHelp();

  els.chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = els.chatInput.value.trim();
    if (!text) return;
    socket.emit("chat:message", { text });
    els.chatInput.value = "";
  });

  if (els.btnToggleChat) {
    els.btnToggleChat.addEventListener("click", () => {
      els.chatPanel.classList.toggle("collapsed");
      els.btnToggleChat.textContent = els.chatPanel.classList.contains("collapsed")
        ? "Show"
        : "Hide";
    });
  }

  function tryReconnect(manual) {
    const s = loadSession();
    if (!s?.roomCode || !s?.token) {
      if (manual) toast("No session to resume", true);
      return;
    }
    state.autoReconnecting = true;
    socket.emit(
      "room:reconnect",
      { code: s.roomCode, token: s.token, name: s.name || getName() },
      (res) => {
        state.autoReconnecting = false;
        if (!res?.ok) {
          if (manual) {
            showHomeError(res?.error || "Could not reconnect.");
            toast(res?.error || "Reconnect failed", true);
          }
          if (res?.code === "ROOM_NOT_FOUND" || res?.code === "SESSION_EXPIRED") {
            if (manual) clearSession();
          }
          return;
        }
        saveSession(res.session);
        applyRoom(res.room);
        showScreen("game");
        toast(manual ? "Reconnected!" : "Session restored");
        KeyClashFX.SFX.join();

        if (res.room.status === "racing" && res.room.passage) {
          const self = res.room.players.find((p) => p.id === socket.id);
          state.passage = normalizeTypingText(res.room.passage);
          state.caret = self?.correct || 0;
          state.errors = self?.errors || 0;
          state.raceStart = res.room.raceStart || Date.now();
          state.raceDurationMs = res.room.raceDurationMs || 120000;
          if (!self?.finished && !self?.eliminated) {
            state.racing = true;
            els.typeInput.disabled = false;
            els.typeInput.focus();
            setStatus("racing");
            renderPassage();
            if (res.room.mode === "timed") startUiTimer(state.raceStart, state.raceDurationMs);
            if (state.progressTimer) clearInterval(state.progressTimer);
            state.progressTimer = setInterval(emitProgress, 200);
          }
        } else if (res.room.status === "countdown" && res.room.passage) {
          state.passage = normalizeTypingText(res.room.passage);
          renderPassage();
        }
      }
    );
  }

  els.btnReconnect.addEventListener("click", () => tryReconnect(true));
  els.btnDismissReconnect.addEventListener("click", () => {
    clearSession();
    els.reconnectBanner.hidden = true;
  });

  socket.on("connect", () => {
    state.myId = socket.id;
    const s = loadSession();
    if (s?.roomCode && s?.token && !state.room) tryReconnect(false);
  });

  socket.on("room:update", (room) => {
    const wasRacing = state.racing;
    const caret = state.caret;
    const errors = state.errors;
    const passage = state.passage;
    applyRoom(room);
    if (wasRacing && room.status === "racing") {
      state.racing = true;
      state.caret = caret;
      state.errors = errors;
      state.passage = passage || normalizeTypingText(room.passage || "");
      els.typeInput.disabled =
        state.caret >= state.passage.length || state.errors > 0 && room.mode === "sudden_death";
      renderPassage();
      updateLocalStats();
    }
  });

  socket.on("race:countdown", ({ duration, passage, raceDurationMs, snapshot }) => {
    if (snapshot) applyRoom(snapshot);
    state.passage = normalizeTypingText(passage);
    state.caret = 0;
    state.errors = 0;
    state.typedWrong = false;
    state.racing = false;
    if (raceDurationMs) state.raceDurationMs = raceDurationMs;
    setStatus("countdown");
    stopUiTimer();
    els.typeInput.disabled = true;
    els.typeInput.value = "";
    els.inputHint.textContent = "Get ready…";
    els.resultsOverlay.hidden = true;
    renderPassage();
    renderTracks();
    runCountdown(duration || 3200, els.countdownNum, els.countdownOverlay);
  });

  socket.on("race:start", ({ raceStart, passage, raceDurationMs, snapshot }) => {
    if (snapshot) {
      state.room = snapshot;
      renderPlayers();
      renderTracks();
    }
    beginRace(raceStart, passage, raceDurationMs);
  });

  socket.on("race:progress", (update) => {
    updateTrackPlayer(update);
    if (state.room) {
      const p = state.room.players.find((x) => x.id === update.id);
      if (p) Object.assign(p, update);
      if (state.room.mode === "team") {
        state.room.teams = {
          A: { ...(state.room.teams && state.room.teams.A), ...localTeamStats(state.room.players).A, id: "A" },
          B: { ...(state.room.teams && state.room.teams.B), ...localTeamStats(state.room.players).B, id: "B" },
        };
        // refresh team aggregate tracks
        const ts = localTeamStats(state.room.players);
        ["A", "B"].forEach((key) => {
          const row = els.trackBoard.querySelector(`.track[data-id="__team_${key}"]`);
          if (!row) return;
          const t = ts[key];
          const fill = row.querySelector(".track-fill");
          const racer = row.querySelector(".track-racer");
          const wpm = row.querySelector(".track-wpm");
          if (fill) fill.style.width = (t.progress || 0) + "%";
          if (racer) racer.style.left = (t.progress || 0) + "%";
          if (wpm) wpm.textContent = t.wpm || 0;
        });
        updateTeamChip();
      }
    }
    const idx = state.room?.players.findIndex((x) => x.id === update.id) ?? -1;
    // player list may include only players; skip team rows
    const lis = [...els.playerList.children];
    const li = lis[idx];
    if (li) {
      const sub = li.querySelector(".player-sub");
      if (sub)
        sub.textContent = `${update.wpm || 0} WPM · ${update.accuracy != null ? update.accuracy : 100}%`;
    }
  });

  socket.on("player:finished", ({ id, place }) => {
    if (state.room) {
      const p = state.room.players.find((x) => x.id === id);
      if (p) {
        p.finished = true;
        p.place = place;
        p.progress = 100;
      }
    }
    updateTrackPlayer({ id, progress: 100, finished: true, place });
    renderPlayers();
    if (id === state.myId) toast(place === 1 ? "You took 1st place!" : `Finished #${place}`);
  });

  socket.on("player:eliminated", ({ id, name }) => {
    if (state.room) {
      const p = state.room.players.find((x) => x.id === id);
      if (p) {
        p.eliminated = true;
        p.finished = true;
      }
    }
    renderPlayers();
    renderTracks();
    if (id === state.myId) {
      endLocalRace();
      els.inputHint.textContent = "Eliminated!";
    } else {
      toast(`${name || "Player"} eliminated`);
    }
  });

  socket.on("race:end", (room) => {
    endLocalRace();
    stopUiTimer();
    stopGhostTimer();
    applyRoom(room);
    setStatus("results");
    showResults(room);
  });

  socket.on("player:joined", ({ player }) => {
    KeyClashFX.SFX.join();
    toast(`${player.name} joined`);
  });

  socket.on("player:left", ({ name, reason }) => {
    toast(reason === "timeout" ? `${name || "Player"} timed out` : `${name || "A player"} left`);
  });

  socket.on("player:disconnected", ({ name }) => {
    toast(`${name || "Player"} disconnected — can rejoin soon`);
  });

  socket.on("player:reconnected", ({ player }) => {
    toast(`${player.name} reconnected`);
  });

  socket.on("chat:message", (msg) => appendChat(msg));

  socket.on("disconnect", () => {
    if (state.modeScreen === "game") toast("Connection lost — reconnecting…", true);
  });

  socket.on("connect_error", () => {
    showHomeError("Cannot reach server. Is KeyClash running?");
  });

  els.passage.addEventListener("click", () => {
    if (state.racing) els.typeInput.focus();
  });
  els.practicePassage.addEventListener("click", () => {
    if (state.practice.racing) els.practiceInput.focus();
  });

  updateReconnectBanner();
  loadLeaderboard();
})();
