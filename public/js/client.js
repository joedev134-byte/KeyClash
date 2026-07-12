/**
 * KeyClash multiplayer + practice client
 */
(function () {
  const SESSION_KEY = "keyclash_session";
  const DIFF_KEY = "keyclash_difficulty";
  const LANG_KEY = "keyclash_language";
  const MODE_KEY = "keyclash_mode";
  const PARA_KEY = "keyclash_paragraphs";
  const CAT_KEY = "keyclash_category";
  const LOCAL_LB_KEY = "keyclash_local_scores";
  const RECENT_ROOMS_KEY = "keyclash_recent_rooms";
  const HOWTO_KEY = "keyclash_howto_collapsed";

  const LANG_LABELS = {
    en: "English",
    tl: "Tagalog",
    es: "Spanish",
    id: "Indonesian",
    ja: "Japanese",
    pt: "Portuguese",
    fr: "French",
    de: "German",
  };
  const LANG_IDS = Object.keys(LANG_LABELS);
  const CAT_LABELS = {
    all: "All Facts",
    science: "Science",
    space: "Space",
    animals: "Animals",
    ph: "Philippines",
  };
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
    upgrade: true,
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
    timeout: 15000,
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
    btnMatch: document.getElementById("btn-match"),
    matchOverlay: document.getElementById("match-overlay"),
    matchTitle: document.getElementById("match-title"),
    matchMsg: document.getElementById("match-msg"),
    matchDetail: document.getElementById("match-detail"),
    matchTimer: document.getElementById("match-timer"),
    matchFallback: document.getElementById("match-fallback"),
    btnMatchCancel: document.getElementById("btn-match-cancel"),
    btnMatchKeep: document.getElementById("btn-match-keep"),
    btnMatchPractice: document.getElementById("btn-match-practice"),
    btnMatchCreate: document.getElementById("btn-match-create"),
    btnMatchShare: document.getElementById("btn-match-share"),
    btnFindNew: document.getElementById("btn-find-new"),
    rematchHint: document.getElementById("rematch-hint"),
    btnDaily: document.getElementById("btn-daily"),
    liveStatusText: document.getElementById("live-status-text"),
    statsStrip: document.getElementById("stats-strip"),
    streakStrip: document.getElementById("streak-strip"),
    streakText: document.getElementById("streak-text"),
    badgeRow: document.getElementById("badge-row"),
    dailyBoardList: document.getElementById("daily-board-list"),
    dailyBoardMeta: document.getElementById("daily-board-meta"),
    btnRefreshDaily: document.getElementById("btn-refresh-daily"),
    btnMatchInvite: document.getElementById("btn-match-invite"),
    matchInviteUrl: document.getElementById("match-invite-url"),
    shareCard: document.getElementById("share-card"),
    shareCardText: document.getElementById("share-card-text"),
    btnShareResult: document.getElementById("btn-share-result"),
    btnCopyResult: document.getElementById("btn-copy-result"),
    practiceShareCard: document.getElementById("practice-share-card"),
    practiceShareText: document.getElementById("practice-share-text"),
    btnPracticeShare: document.getElementById("btn-practice-share"),
    btnPracticeCopyShare: document.getElementById("btn-practice-copy-share"),
    practiceResultsTitle: document.getElementById("practice-results-title"),
    homeError: document.getElementById("home-error"),
    homeDifficulty: document.getElementById("home-difficulty"),
    homeLanguage: document.getElementById("home-language"),
    homeMode: document.getElementById("home-mode"),
    homeParagraphs: document.getElementById("home-paragraphs"),
    homeCategory: document.getElementById("home-category"),
    modeHint: document.getElementById("mode-hint"),
    roomLanguage: document.getElementById("room-language"),
    roomMode: document.getElementById("room-mode"),
    roomParagraphs: document.getElementById("room-paragraphs"),
    roomCategory: document.getElementById("room-category"),
    langLabel: document.getElementById("lang-label"),
    modeLabel: document.getElementById("mode-label"),
    paraLabel: document.getElementById("para-label"),
    catLabel: document.getElementById("cat-label"),
    connectingOverlay: document.getElementById("connecting-overlay"),
    connectingMsg: document.getElementById("connecting-msg"),
    connectingTimer: document.getElementById("connecting-timer"),
    shareModal: document.getElementById("share-modal"),
    shareQr: document.getElementById("share-qr"),
    shareUrlText: document.getElementById("share-url-text"),
    btnShareClose: document.getElementById("btn-share-close"),
    btnShareCopyLink: document.getElementById("btn-share-copy-link"),
    btnShareCopyCode: document.getElementById("btn-share-copy-code"),
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
    btnCloseResults: document.getElementById("btn-close-results"),
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
    btnMute: document.getElementById("btn-mute"),
    btnSettings: document.getElementById("btn-settings"),
    settingsModal: document.getElementById("settings-modal"),
    btnSettingsClose: document.getElementById("btn-settings-close"),
    btnSettingsDone: document.getElementById("btn-settings-done"),
    btnSettingsTest: document.getElementById("btn-settings-test-sound"),
    settingsMute: document.getElementById("settings-mute"),
    settingsVolume: document.getElementById("settings-volume"),
    settingsKeySfx: document.getElementById("settings-key-sfx"),
    settingsLanguage: document.getElementById("settings-language"),
    recentRooms: document.getElementById("recent-rooms"),
    recentRoomsList: document.getElementById("recent-rooms-list"),
    btnClearRecent: document.getElementById("btn-clear-recent"),
    howToPlay: document.getElementById("how-to-play"),
  };

  const state = {
    room: null,
    myId: null,
    ready: false,
    difficulty: localStorage.getItem(DIFF_KEY) || "normal",
    language: localStorage.getItem(LANG_KEY) || "en",
    mode: localStorage.getItem(MODE_KEY) || "classic",
    paragraphs: clampParagraphs(localStorage.getItem(PARA_KEY) || 1),
    category: localStorage.getItem(CAT_KEY) || "all",
    passage: "",
    connectStartedAt: Date.now(),
    connectTimer: null,
    keepAliveTimer: null,
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
    countdownTimer: null,
    pendingRoomCode: null,
    joinInFlight: false,
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
    matchmaking: false,
    matchSearchStartedAt: 0,
    matchTimerId: null,
    matchFallbackShown: false,
    lastMatchWpm: 0,
    dailyChallenge: false,
    lastShareText: "",
    duelInviteCode: null,
    badgeMeta: {},
  };

  if (!MODE_META[state.mode]) state.mode = "classic";
  if (!LANG_IDS.includes(state.language)) state.language = "en";
  if (!CAT_LABELS[state.category]) state.category = "all";
  state.paragraphs = clampParagraphs(state.paragraphs);

  function setCatSegActive(root, cat) {
    if (!root) return;
    root.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.cat === cat);
    });
  }

  function catLabel(id) {
    return CAT_LABELS[id] || "All Facts";
  }

  const savedName = localStorage.getItem("keyclash_name");
  if (savedName) els.name.value = savedName;
  setSegActive(els.homeDifficulty, state.difficulty);
  setLangSegActive(els.homeLanguage, state.language);
  setModeSegActive(els.homeMode, state.mode);
  setParaSegActive(els.homeParagraphs, state.paragraphs);
  setCatSegActive(els.homeCategory, state.category);
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
    // Body flags for layout (race focus, hide home chrome)
    document.body.classList.toggle("on-home", which === "home");
    document.body.classList.toggle("on-game", which === "game");
    document.body.classList.toggle("on-practice", which === "practice");
    if (which !== "game" && which !== "practice") {
      document.body.classList.remove("is-racing", "keyboard-open");
    }
    // Always leave home fully when entering game/practice
    if (which === "game" || which === "practice") {
      try {
        window.scrollTo(0, 0);
      } catch (_) {}
      hideMatchOverlay();
      if (els.connectingOverlay) els.connectingOverlay.hidden = true;
    }
    if (which === "home") {
      updateReconnectBanner();
      renderRecentRooms();
      loadLeaderboard();
      loadDailyBoard();
      loadDailyProfile();
      refreshLiveStatus();
      refreshStatsStrip();
      startLeaderboardHomePoll();
      startLiveStatusPoll();
      document.body.classList.remove("keyboard-open", "is-racing");
    } else {
      stopLeaderboardHomePoll();
      stopLiveStatusPoll();
    }
    // Keep ad on home only — never during lobby/race/practice
    try {
      const ad = document.getElementById("home-ad-slot");
      if (ad) {
        const hiddenByUser = sessionStorage.getItem("keyclash_hide_home_ad") === "1";
        ad.hidden = which !== "home" || hiddenByUser;
      }
    } catch (_) {}
  }

  /* —— Recent rooms (local) —— */
  function readRecentRooms() {
    try {
      const list = JSON.parse(localStorage.getItem(RECENT_ROOMS_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function writeRecentRooms(list) {
    try {
      localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(list.slice(0, 8)));
    } catch (_) {}
  }

  function pushRecentRoom(code, meta) {
    const roomCode = String(code || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);
    if (!roomCode || roomCode.length < 4) return;
    const entry = {
      code: roomCode,
      name: (meta && meta.name) || getName(),
      mode: (meta && meta.mode) || state.mode,
      at: Date.now(),
    };
    const next = [entry, ...readRecentRooms().filter((r) => r && r.code !== roomCode)];
    writeRecentRooms(next);
    renderRecentRooms();
  }

  function clearRecentRooms() {
    writeRecentRooms([]);
    renderRecentRooms();
    toast("Recent rooms cleared");
  }

  function formatRecentAge(ts) {
    const ms = Date.now() - (ts || 0);
    if (ms < 60000) return "just now";
    if (ms < 3600000) return Math.floor(ms / 60000) + "m ago";
    if (ms < 86400000) return Math.floor(ms / 3600000) + "h ago";
    return Math.floor(ms / 86400000) + "d ago";
  }

  function renderRecentRooms() {
    if (!els.recentRooms || !els.recentRoomsList) return;
    const list = readRecentRooms().filter((r) => r && r.code);
    if (!list.length) {
      els.recentRooms.hidden = true;
      els.recentRoomsList.innerHTML = "";
      return;
    }
    els.recentRooms.hidden = false;
    els.recentRoomsList.innerHTML = list
      .map((r, i) => {
        const label = i === 0 ? "Play again" : "Join";
        return `
        <li class="recent-room-item">
          <div class="recent-room-meta">
            <code class="recent-room-code">${escapeHtml(r.code)}</code>
            <span class="recent-room-sub">${escapeHtml(modeLabel(r.mode || "classic"))} · ${formatRecentAge(r.at)}</span>
          </div>
          <button type="button" class="btn btn-secondary btn-sm recent-join-btn" data-code="${escapeHtml(r.code)}">${label}</button>
        </li>`;
      })
      .join("");
  }

  /* —— Mobile keyboard / visual viewport —— */
  function syncVisualViewport() {
    const root = document.documentElement;
    const vv = window.visualViewport;
    if (vv) {
      root.style.setProperty("--vvh", Math.round(vv.height) + "px");
      root.style.setProperty("--vv-offset-top", Math.round(vv.offsetTop) + "px");
      const shrink = window.innerHeight - vv.height;
      const keyboardOpen = shrink > 120 && state.modeScreen !== "home";
      document.body.classList.toggle("keyboard-open", keyboardOpen);
    } else {
      root.style.setProperty("--vvh", window.innerHeight + "px");
      root.style.setProperty("--vv-offset-top", "0px");
    }
  }

  function focusTypeDock(inputEl) {
    if (!inputEl) return;
    // After soft keyboard opens, keep the input visible
    requestAnimationFrame(() => {
      try {
        inputEl.scrollIntoView({ block: "end", inline: "nearest", behavior: "smooth" });
      } catch (_) {
        try {
          inputEl.scrollIntoView(false);
        } catch (__) {}
      }
    });
    setTimeout(syncVisualViewport, 280);
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

  function applyLanguage(lang, opts) {
    const options = opts || {};
    if (!LANG_IDS.includes(lang)) lang = "en";
    state.language = lang;
    localStorage.setItem(LANG_KEY, lang);
    setLangSegActive(els.homeLanguage, lang);
    setLangSegActive(els.settingsLanguage, lang);
    if (options.toast) toast("Language · " + langLabel(lang));
  }

  wireSeg(els.homeLanguage, "lang", (lang) => {
    applyLanguage(lang);
  });

  wireSeg(els.settingsLanguage, "lang", (lang) => {
    applyLanguage(lang, { toast: true });
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

  wireSeg(els.homeCategory, "cat", (cat) => {
    state.category = CAT_LABELS[cat] ? cat : "all";
    localStorage.setItem(CAT_KEY, state.category);
    setCatSegActive(els.homeCategory, state.category);
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

  wireSeg(els.roomCategory, "cat", (cat) => {
    if (!isHost()) return toast("Only the host can change category", true);
    socket.emit("room:set-category", { category: cat }, (res) => {
      if (!res?.ok) return toast(res?.error || "Could not set category", true);
      state.category = res.category;
      setCatSegActive(els.roomCategory, res.category);
      if (els.catLabel) els.catLabel.textContent = catLabel(res.category);
      toast("Facts: " + catLabel(res.category));
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
    // Race focus layout: hide lobby chrome so passage + input stay visible
    const racing = status === "racing" || status === "countdown";
    document.body.classList.toggle("is-racing", racing);
    document.body.classList.toggle("is-results", status === "results");
    if (racing) {
      try {
        window.scrollTo(0, 0);
      } catch (_) {}
      // Ensure type dock / passage not covered
      requestAnimationFrame(() => {
        try {
          if (els.passage) {
            els.passage.scrollTop = 0;
          }
          if (status === "racing" && els.typeInput && !els.typeInput.disabled) {
            els.typeInput.focus({ preventScroll: false });
            focusTypeDock(els.typeInput);
          }
        } catch (_) {}
      });
    }
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
    const cap = state.room.maxPlayers || 10;
    els.playerCount.textContent = state.room.quickMatch
      ? `${connected}/2 · 1v1`
      : `${connected}/${cap}`;
    els.playerList.innerHTML = "";

    players.forEach((p) => {
      const li = document.createElement("li");
      const offline = p.connected === false;
      const dead = !!p.eliminated;
      li.dataset.id = p.id;
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

      // Use solid high-contrast name color fallback so names always show
      const nameColor = p.color || "#e8ecff";
      li.innerHTML = `
        <span class="player-dot" style="color:${nameColor};background:${nameColor}"></span>
        <div class="player-meta">
          <div class="player-name" style="color:${nameColor}">${escapeHtml(p.name || "Racer")}${p.id === state.myId ? " (you)" : ""}</div>
          <div class="player-sub">${p.wpm || 0} WPM · ${p.accuracy != null ? p.accuracy : 100}% · ${p.progress || 0}%</div>
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
    const is1v1 = !!state.room.quickMatch;
    const inResults = state.room.status === "results";
    if (els.btnRematch) {
      if (is1v1 && inResults) {
        // Both players can request rematch in 1v1
        els.btnRematch.hidden = false;
        const meP = me();
        els.btnRematch.textContent = meP && meP.rematchWanted ? "Waiting…" : "Rematch";
        els.btnRematch.disabled = !!(meP && meP.rematchWanted);
        els.btnRematch.classList.add("btn-pulse");
      } else {
        els.btnRematch.hidden = !(host && inResults);
        els.btnRematch.textContent = els.btnStart.textContent;
        els.btnRematch.disabled = busy;
      }
    }
    if (els.btnFindNew) {
      els.btnFindNew.hidden = !(is1v1 && inResults);
    }
    if (els.rematchHint) {
      if (is1v1 && inResults) {
        const votes = (state.room.players || []).filter((p) => p.rematchWanted).length;
        const need = (state.room.players || []).filter((p) => p.connected !== false).length;
        if (votes > 0 && votes < need) {
          els.rematchHint.hidden = false;
          els.rematchHint.textContent =
            votes + "/" + need + " want rematch — waiting for opponent…";
        } else {
          els.rematchHint.hidden = true;
          els.rematchHint.textContent = "";
        }
      } else {
        els.rematchHint.hidden = true;
      }
    }
    if (els.btnCloseResults) {
      // Close is available to everyone when results are open
      els.btnCloseResults.hidden = state.room.status !== "results";
    }

    const canEdit = host && (state.room.status === "lobby" || state.room.status === "results");
    [els.roomDifficulty, els.roomLanguage, els.roomMode, els.roomParagraphs, els.roomCategory].forEach(
      (root) => {
        if (!root) return;
        root.querySelectorAll(".seg-btn").forEach((b) => {
          b.disabled = !canEdit;
        });
      }
    );
    setSegActive(els.roomDifficulty, state.room.difficulty || state.difficulty);
    setLangSegActive(els.roomLanguage, state.room.language || state.language);
    setModeSegActive(els.roomMode, state.room.mode || state.mode);
    setParaSegActive(els.roomParagraphs, state.room.paragraphs || state.paragraphs);
    setCatSegActive(els.roomCategory, state.room.category || state.category || "all");
    if (els.diffLabel) els.diffLabel.textContent = capitalize(state.room.difficulty || "normal");
    if (els.langLabel) els.langLabel.textContent = langLabel(state.room.language || state.language);
    if (els.modeLabel) els.modeLabel.textContent = modeLabel(state.room.mode || state.mode);
    if (els.paraLabel) els.paraLabel.textContent = String(state.room.paragraphs || state.paragraphs || 1);
    if (els.catLabel) els.catLabel.textContent = catLabel(state.room.category || state.category || "all");

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

  function upsertPlayer(player) {
    if (!state.room || !player || !player.id) return;
    if (!Array.isArray(state.room.players)) state.room.players = [];
    const existing = state.room.players.find((x) => x.id === player.id);
    if (existing) Object.assign(existing, player);
    else state.room.players.push(player);
  }

  function updatePlayerListRow(update) {
    if (!els.playerList || !update || !update.id) return;
    const li = els.playerList.querySelector(`.player-item[data-id="${update.id}"]`);
    if (!li) {
      // Unknown row — full re-render
      if (state.room) renderPlayers();
      return;
    }
    const sub = li.querySelector(".player-sub");
    if (sub) {
      sub.textContent = `${update.wpm || 0} WPM · ${update.accuracy != null ? update.accuracy : 100}% · ${update.progress || 0}%`;
    }
    const nameEl = li.querySelector(".player-name");
    if (nameEl && update.name) {
      const you = update.id === state.myId ? " (you)" : "";
      nameEl.textContent = update.name + you;
      if (update.color) nameEl.style.color = update.color;
    }
  }

  function updateTrackPlayer(update) {
    if (!update || !update.id) return;
    if (state.room) {
      const p = state.room.players.find((x) => x.id === update.id);
      if (p) Object.assign(p, update);
    }
    if (!els.trackBoard) return;
    let row = els.trackBoard.querySelector(`.track[data-id="${CSS.escape ? CSS.escape(update.id) : update.id}"]`);
    // CSS.escape may not like some ids — fallback without escape
    if (!row) row = els.trackBoard.querySelector(`[data-id="${update.id}"]`);
    if (!row) {
      if (state.room) renderTracks();
      row = els.trackBoard.querySelector(`[data-id="${update.id}"]`);
      if (!row) return;
    }
    const fill = row.querySelector(".track-fill");
    const racer = row.querySelector(".track-racer");
    const wpm = row.querySelector(".track-wpm");
    const prog = update.progress != null ? update.progress : 0;
    if (fill) {
      fill.style.width = prog + "%";
      if (update.color) fill.style.color = update.color;
    }
    if (racer) {
      racer.style.left = prog + "%";
      racer.classList.toggle("finished", !!(update.finished || update.eliminated));
      if (update.color) racer.style.color = update.color;
    }
    if (wpm) wpm.textContent = String(update.wpm || 0);
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
      // Keep real spaces (with white-space: pre-wrap) so words wrap cleanly
      // instead of &nbsp; which prevented wrapping and caused cut-off.
      const raw = text[i];
      const ch =
        raw === "<"
          ? "&lt;"
          : raw === ">"
            ? "&gt;"
            : raw === "&"
              ? "&amp;"
              : raw === '"'
                ? "&quot;"
                : raw;
      html += `<span class="${cls}">${ch}</span>`;
    }
    el.innerHTML = html;
    const cur = el.querySelector(".char.current");
    if (cur) {
      // Keep caret visible; auto is smoother on mobile while typing
      try {
        cur.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "auto" });
      } catch (_) {
        try {
          cur.scrollIntoView(false);
        } catch (__) {}
      }
    }
  }

  function renderPassage() {
    renderPassageInto(els.passage, state.passage, state.caret, state.typedWrong);
  }

  function updateLocalStats() {
    const elapsed = state.raceStart ? Math.max(1, Date.now() - state.raceStart) : 1;
    const minutes = elapsed / 60000;
    const correct = state.caret;
    const wpm = Math.min(220, Math.round(correct / 5 / minutes) || 0);
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
    // No ack/timeout — fire-and-forget for lowest latency
    socket.emit("race:progress", {
      correct: stats.correct,
      errors: stats.errors,
    });
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
    // Round works for every mode
    const round = Math.max(1, room.round || 1);
    els.roundNum.textContent = String(round);
    if (els.roundNum && els.roundNum.parentElement) {
      const label =
        room.mode === "best_of_3"
          ? `Round ${round}${room.seriesRace ? ` · Series ${room.seriesRace}/3` : ""}`
          : `Round ${round}`;
      els.roundNum.parentElement.title = label;
    }
    state.difficulty = room.difficulty || state.difficulty;
    state.language = room.language || state.language;
    state.mode = room.mode || state.mode;
    state.paragraphs = clampParagraphs(room.paragraphs || state.paragraphs);
    state.category = room.category || state.category || "all";
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
    if (self && self.wpm >= 5) {
      state.lastMatchWpm = self.wpm;
    }

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

    if (els.btnCloseResults) els.btnCloseResults.hidden = false;

    if (room.quickMatch) {
      els.resultsHint.textContent =
        "1v1 done — Rematch (both must agree) or Find new opponent";
      if (els.btnRematch) {
        els.btnRematch.hidden = false;
        els.btnRematch.textContent = "Rematch";
        els.btnRematch.disabled = false;
      }
      if (els.btnFindNew) els.btnFindNew.hidden = false;
    } else if (isHost()) {
      els.resultsHint.textContent =
        room.mode === "best_of_3" && !room.seriesComplete
          ? "Series continues — Next Round, or Close to return to lobby"
          : "Press Next Round to clash again, or Close for lobby";
      if (els.btnRematch) els.btnRematch.hidden = false;
      if (els.btnFindNew) els.btnFindNew.hidden = true;
    } else {
      els.resultsHint.textContent =
        "Waiting for host to start the next round — or Close to view lobby";
      if (els.btnRematch) els.btnRematch.hidden = true;
      if (els.btnFindNew) els.btnFindNew.hidden = true;
    }

    // Post-race share card
    if (self && self.wpm >= 5) {
      updateShareCard(self.wpm, self.accuracy, room.mode, room.language);
    } else {
      updateShareCard(null);
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

  function cancelCountdown() {
    if (state.countdownTimer) {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
    }
  }

  /**
   * Reliable countdown (setInterval — rAF freezes in background tabs / mobile).
   * endsAt = server absolute time for sync across clients.
   */
  function runCountdown(duration, numEl, overlayEl, onDone, endsAt) {
    cancelCountdown();
    if (!numEl || !overlayEl) return;
    overlayEl.hidden = false;
    const labels = ["3", "2", "1", "GO"];
    const total = Math.max(1000, duration || 3000);
    const end = typeof endsAt === "number" ? endsAt : Date.now() + total;
    let last = -1;

    const tick = () => {
      const left = end - Date.now();
      const elapsed = total - left;
      let idx = Math.floor((elapsed / total) * 4);
      if (idx < 0) idx = 0;
      if (idx > 3) idx = 3;

      if (idx !== last) {
        last = idx;
        numEl.textContent = labels[idx];
        numEl.style.animation = "none";
        void numEl.offsetWidth;
        numEl.style.animation = "countPop 0.45s cubic-bezier(0.2, 1.4, 0.3, 1)";
        try {
          KeyClashFX.SFX.countdown(labels[idx] === "GO" ? "GO" : Number(labels[idx]));
        } catch (_) {}
        if (labels[idx] === "GO") {
          try {
            KeyClashFX.screenFlash("rgba(0,245,212,0.15)");
          } catch (_) {}
        }
      }

      if (left <= 0) {
        cancelCountdown();
        numEl.textContent = "GO";
        overlayEl.hidden = true;
        if (typeof onDone === "function") onDone();
      }
    };

    tick();
    state.countdownTimer = setInterval(tick, 50);
  }

  function beginRace(raceStart, passage, raceDurationMs) {
    cancelCountdown();
    // Always ensure game screen is visible (not home under match overlay)
    hideMatchOverlay();
    if (state.modeScreen !== "game") showScreen("game");
    document.body.classList.add("is-racing", "on-game");
    document.body.classList.remove("on-home");

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
    if (els.countdownNum) els.countdownNum.textContent = "GO";
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
    // Focus typing surface after layout paints
    requestAnimationFrame(() => {
      try {
        window.scrollTo(0, 0);
        if (els.passage) els.passage.scrollTop = 0;
        els.typeInput.focus();
        focusTypeDock(els.typeInput);
      } catch (_) {
        try {
          els.typeInput.focus();
        } catch (__) {}
      }
    });
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
    // Faster live sync for other players' tracks
    state.progressTimer = setInterval(emitProgress, 80);
    emitProgress();
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

  /** Client-side mirror of server censor (so local echo is clean too). */
  function censorClient(text) {
    const list = [
      "fuck", "fucker", "fucking", "shit", "shitty", "bitch", "asshole", "bastard",
      "dick", "cock", "pussy", "cunt", "slut", "whore", "nigger", "nigga", "faggot",
      "retard", "motherfucker", "bullshit", "dumbass", "jackass",
      "putangina", "puta", "punyeta", "gago", "gaga", "tangina", "ulol", "tarantado",
      "leche", "lintik", "pakyu", "pakyo", "bobo", "tanga", "inutil", "pokpok",
      "kantot", "jakol", "bayag", "puke", "titi", "burat", "kupal",
    ].sort((a, b) => b.length - a.length);
    let out = String(text || "");
    for (const w of list) {
      const re = new RegExp(`(?<![a-zA-Z])${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![a-zA-Z])`, "gi");
      out = out.replace(re, (m) => "*".repeat(m.length));
    }
    // multi-word
    out = out.replace(/putang\s*ina/gi, (m) => "*".repeat(m.length));
    out = out.replace(/tang\s*ina/gi, (m) => "*".repeat(m.length));
    out = out.replace(/hayop\s*ka/gi, (m) => "*".repeat(m.length));
    return out;
  }

  function appendChat({ name, color, text }) {
    const div = document.createElement("div");
    div.className = "chat-msg";
    const safeText = censorClient(text);
    div.innerHTML = `<span class="who" style="color:${color}">${escapeHtml(name)}</span><span class="txt">${escapeHtml(safeText)}</span>`;
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

  function updateShareCard(wpm, accuracy, mode, language) {
    const text =
      wpm != null && wpm >= 5
        ? `I hit ${wpm} WPM on KeyClash${
            accuracy != null ? " (" + accuracy + "% acc)" : ""
          } — beat me!\n${getGameUrl()}`
        : `Race me on KeyClash — multiplayer typing!\n${getGameUrl()}`;
    state.lastShareText = text;
    if (els.shareCardText) els.shareCardText.textContent = text.replace(/\n/g, " · ");
    if (els.practiceShareText) els.practiceShareText.textContent = text.replace(/\n/g, " · ");
    if (els.shareCard) els.shareCard.hidden = !(wpm != null && wpm >= 5);
    if (els.practiceShareCard) els.practiceShareCard.hidden = !(wpm != null && wpm >= 5);
  }

  async function shareResultText() {
    const text = state.lastShareText || `Race me on KeyClash!\n${getGameUrl()}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "KeyClash",
          text: text,
          url: getGameUrl(),
        });
        toast("Shared!");
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    await copyText(text, "Result copied — paste to share");
  }

  async function loadDailyBoard() {
    if (!els.dailyBoardList) return;
    try {
      const res = await fetch(
        "/api/daily/board?language=" +
          encodeURIComponent(state.language) +
          "&limit=10",
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error("bad");
      const data = await res.json();
      if (els.dailyBoardMeta) {
        els.dailyBoardMeta.textContent =
          (data.day || "Today") +
          " · " +
          langLabel(data.language || state.language) +
          " · best WPM";
      }
      const entries = data.entries || [];
      if (!entries.length) {
        els.dailyBoardList.innerHTML =
          '<li class="lb-empty">No daily scores yet — be the first.</li>';
        return;
      }
      els.dailyBoardList.innerHTML = entries
        .map((e, i) => {
          const streak =
            e.streak > 1 ? " · 🔥" + e.streak + "d" : "";
          const badges = (e.badges || [])
            .slice(0, 2)
            .map((id) => (BADGE_LABELS[id] && BADGE_LABELS[id].icon) || "")
            .join("");
          return (
            `<li><span class="lb-rank">#${i + 1}</span> <strong>${escapeHtml(
              e.name
            )}</strong> <span class="lb-meta">${e.wpm} WPM · ${e.accuracy}%${streak} ${badges}</span></li>`
          );
        })
        .join("");
    } catch {
      /* ignore */
    }
  }

  let liveStatusPoll = null;
  function stopLiveStatusPoll() {
    if (liveStatusPoll) {
      clearInterval(liveStatusPoll);
      liveStatusPoll = null;
    }
  }
  function startLiveStatusPoll() {
    stopLiveStatusPoll();
    liveStatusPoll = setInterval(() => {
      refreshLiveStatus();
      refreshStatsStrip();
    }, 12000);
  }
  async function refreshLiveStatus() {
    if (!els.liveStatusText) return;
    try {
      const res = await fetch("/api/health?_=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("bad");
      const data = await res.json();
      const online = data.online != null ? data.online : 0;
      const queue = data.queue != null ? data.queue : 0;
      const rooms = data.rooms != null ? data.rooms : 0;
      els.liveStatusText.textContent =
        online +
        " online · " +
        queue +
        " in 1v1 queue · " +
        rooms +
        " room" +
        (rooms === 1 ? "" : "s");
    } catch {
      els.liveStatusText.textContent = "Server status unavailable";
    }
  }

  async function refreshStatsStrip() {
    if (!els.statsStrip) return;
    try {
      const res = await fetch("/api/stats?_=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error("bad");
      const data = await res.json();
      const today = (data.today && data.today.match1v1) || 0;
      const topLang =
        data.languages && data.languages[0]
          ? langLabel(data.languages[0].id)
          : "—";
      const online =
        data.live && data.live.online != null ? data.live.online : "—";
      const queue =
        data.live && data.live.queue != null ? data.live.queue : "—";
      els.statsStrip.textContent =
        today +
        " 1v1s today · Top lang: " +
        topLang +
        " · " +
        online +
        " online · " +
        queue +
        " in queue";
    } catch {
      els.statsStrip.textContent = "Activity stats unavailable";
    }
  }

  const BADGE_LABELS = {
    first_clear: { label: "First Clear", icon: "🏁" },
    wpm_50: { label: "50 WPM Club", icon: "⚡" },
    wpm_100: { label: "100 WPM Club", icon: "🔥" },
    wpm_150: { label: "150 WPM Elite", icon: "👑" },
    streak_3: { label: "3-Day Streak", icon: "📅" },
    streak_7: { label: "7-Day Streak", icon: "💎" },
    perfect: { label: "Perfect Accuracy", icon: "🎯" },
  };

  function renderStreakStrip(profile, newBadges) {
    if (!els.streakStrip) return;
    if (!profile || (!profile.totalDaily && !profile.streak)) {
      // still show if we have local progress
    }
    els.streakStrip.hidden = false;
    const streak = profile.streak || 0;
    const best = profile.bestStreak || 0;
    const bestWpm = profile.bestWpm || 0;
    if (els.streakText) {
      els.streakText.textContent =
        "Daily streak: " +
        streak +
        " day" +
        (streak === 1 ? "" : "s") +
        (best > streak ? " · best " + best : "") +
        (bestWpm ? " · best " + bestWpm + " WPM" : "");
    }
    if (els.badgeRow) {
      const badges = profile.badges || [];
      const newIds = new Set(
        (newBadges || []).map((b) => (typeof b === "string" ? b : b.id))
      );
      if (!badges.length) {
        els.badgeRow.innerHTML =
          '<span class="field-hint">Play Daily Challenge to earn badges</span>';
      } else {
        els.badgeRow.innerHTML = badges
          .map((id) => {
            const meta = BADGE_LABELS[id] || { label: id, icon: "🏅" };
            const isNew = newIds.has(id);
            return (
              '<span class="ach-badge' +
              (isNew ? " new" : "") +
              '" title="' +
              escapeHtml(meta.label) +
              '">' +
              meta.icon +
              " " +
              escapeHtml(meta.label) +
              "</span>"
            );
          })
          .join("");
      }
    }
  }

  async function loadDailyProfile() {
    try {
      const res = await fetch(
        "/api/daily/profile?name=" + encodeURIComponent(getName()),
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.profile) renderStreakStrip(data.profile, []);
    } catch {
      /* ignore */
    }
  }

  function duelInviteUrl(code) {
    return getGameUrl().replace(/\/$/, "") + "/?duel=" + encodeURIComponent(code);
  }

  async function createDuelInvite() {
    if (!socket.connected) {
      toast("Not connected yet", true);
      return;
    }
    // Ensure we're searching first
    if (!state.matchmaking) {
      startMatchmaking();
      // slight delay so queue entry exists
      await new Promise((r) => setTimeout(r, 400));
    }
    const modeForMatch =
      state.mode === "ghost" || state.mode === "team" ? "classic" : state.mode;
    socket.timeout(10000).emit(
      "match:invite-create",
      {
        name: getName(),
        language: state.language,
        difficulty: state.difficulty,
        mode: modeForMatch,
        paragraphs: state.paragraphs,
        category: state.category,
        lastWpm: state.lastMatchWpm || undefined,
      },
      async (err, res) => {
        if (err || !res || !res.ok) {
          toast((res && res.error) || "Could not create invite", true);
          return;
        }
        state.duelInviteCode = res.inviteCode;
        state.matchmaking = true;
        if (els.btnMatch) els.btnMatch.disabled = true;
        showMatchOverlay(true);
        const url = duelInviteUrl(res.inviteCode);
        if (els.matchInviteUrl) {
          els.matchInviteUrl.hidden = false;
          els.matchInviteUrl.textContent = url;
        }
        if (els.matchMsg) {
          els.matchMsg.textContent =
            "Invite ready — send the link to a friend for a guaranteed 1v1.";
        }
        await copyText(
          "1v1 me on KeyClash!\n" + url + "\n(Duel code: " + res.inviteCode + ")",
          "Duel invite copied — share with a friend"
        );
      }
    );
  }

  function tryJoinDuelFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const duel = (params.get("duel") || "").trim().toUpperCase();
      if (!duel) return;
      // Clean URL
      try {
        const u = new URL(window.location.href);
        u.searchParams.delete("duel");
        window.history.replaceState({}, "", u.pathname + u.search + u.hash);
      } catch (_) {}

      const join = () => {
        if (!(els.name.value || "").trim()) {
          showHomeError("Enter your name, then you'll join the duel automatically.");
          if (els.name) els.name.focus();
          const once = () => {
            if ((els.name.value || "").trim()) {
              joinDuel(duel);
            }
          };
          els.name.addEventListener("change", once, { once: true });
          return;
        }
        joinDuel(duel);
      };

      if (socket.connected) join();
      else {
        toast("Connecting to join duel " + duel + "…");
        socket.once("connect", join);
      }
    } catch (_) {}
  }

  function joinDuel(code) {
    showHomeError("");
    if (els.matchOverlay) {
      showMatchOverlay(true);
      if (els.matchTitle) els.matchTitle.textContent = "Joining duel…";
      if (els.matchMsg) els.matchMsg.textContent = "Connecting to friend's 1v1 invite…";
    }
    state.matchmaking = true;
    socket.timeout(12000).emit(
      "match:invite-join",
      {
        code: code,
        name: getName(),
        lastWpm: state.lastMatchWpm || undefined,
      },
      (err, res) => {
        if (err || !res || !res.ok) {
          hideMatchOverlay();
          showHomeError((res && res.error) || "Could not join duel.");
          toast((res && res.error) || "Duel join failed", true);
          return;
        }
        // match:found will also fire from createQuickMatchRoom
        if (res.room && (!state.room || state.room.code !== res.room.code)) {
          // wait for match:found with session
        }
        toast("Duel joined — race starting!");
      }
    );
  }

  function blockPaste(inputEl) {
    if (!inputEl) return;
    inputEl.addEventListener("paste", (e) => {
      e.preventDefault();
      toast("Paste blocked — type it out!", true);
    });
    inputEl.addEventListener("drop", (e) => {
      e.preventDefault();
      toast("Drop blocked — type it out!", true);
    });
  }

  async function startPractice(opts) {
    const options = opts || {};
    state.dailyChallenge = !!options.daily;
    showScreen("practice");
    els.practiceResults.hidden = true;
    els.practiceInput.disabled = true;
    els.practiceInput.value = "";
    els.practiceDiffLabel.textContent = state.dailyChallenge
      ? "Daily"
      : capitalize(state.difficulty);
    if (els.practiceLangLabel) els.practiceLangLabel.textContent = langLabel(state.language);
    if (els.practiceModeLabel) {
      els.practiceModeLabel.textContent = state.dailyChallenge
        ? "Daily"
        : modeLabel(state.mode);
    }
    if (els.practiceParaLabel) els.practiceParaLabel.textContent = String(state.paragraphs);
    els.practiceStatus.textContent = "Loading";
    els.practiceStatus.className = "status-pill countdown";
    stopPracticeTimer();

    try {
      let data;
      if (state.dailyChallenge) {
        const res = await fetch(
          "/api/daily?language=" + encodeURIComponent(state.language),
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("bad status");
        data = await res.json();
        data.durationMs = null;
        if (els.practiceInputHint) {
          els.practiceInputHint.textContent =
            "Daily challenge · same passage for everyone today · " +
            (data.day || "");
        }
      } else {
        const qs = new URLSearchParams({
          difficulty: state.difficulty,
          language: state.language,
          mode: state.mode,
          paragraphs: String(state.paragraphs),
          category: state.category || "all",
        });
        const res = await fetch("/api/practice?" + qs.toString());
        if (!res.ok) throw new Error("bad status");
        data = await res.json();
      }
      const passage = normalizeTypingText(data.passage);
      state.practice = {
        passage,
        caret: 0,
        errors: 0,
        typedWrong: false,
        racing: false,
        start: null,
        durationMs: data.durationMs || (!state.dailyChallenge && state.mode === "timed" ? 60000 : null),
        timerId: null,
      };
      renderPassageInto(els.practicePassage, passage, 0, false);
      practiceStats();

      // Show ghost panel during countdown so player sees it early
      if (!state.dailyChallenge && state.mode === "ghost") {
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

    if (stats.wpm >= 5) {
      saveGhostWpm(stats.wpm);
      state.lastMatchWpm = stats.wpm;
    }
    updateShareCard(stats.wpm, stats.acc, state.dailyChallenge ? "daily" : state.mode, state.language);
    if (els.practiceResultsTitle) {
      els.practiceResultsTitle.textContent = state.dailyChallenge
        ? "Daily Challenge Result"
        : "Your Practice Result";
    }

    if (state.dailyChallenge) {
      if (stats.wpm >= 5) {
        fetch("/api/daily", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: getName(),
            wpm: Math.min(220, stats.wpm),
            accuracy: stats.acc,
            language: state.language,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res && res.ok) {
              toast(
                res.improved
                  ? "Daily score posted · " + stats.wpm + " WPM · streak " + (res.streak || 1)
                  : "Daily board unchanged (best kept)"
              );
              if (res.newBadges && res.newBadges.length) {
                const names = res.newBadges
                  .map((b) => (b.icon || "") + " " + (b.label || b.id))
                  .join(", ");
                setTimeout(() => toast("Badge unlocked: " + names), 500);
              }
              renderStreakStrip(
                {
                  streak: res.streak,
                  bestStreak: res.bestStreak,
                  bestWpm: res.bestWpm,
                  totalDaily: 1,
                  badges: res.badges || [],
                },
                res.newBadges || []
              );
              loadDailyBoard();
            }
          })
          .catch(() => {});
      }
    } else {
      submitScore({
        wpm: Math.min(220, stats.wpm),
        accuracy: stats.acc,
        mode: state.mode,
        language: state.language,
        difficulty: state.difficulty,
        source: "practice",
      });
    }
    if (info && info.eliminated) {
      KeyClashFX.screenFlash("rgba(255,77,109,0.15)");
    } else if (!state.dailyChallenge && state.mode === "ghost" && stats.wpm > (state.ghostWpm || 0)) {
      KeyClashFX.victoryFX(1);
    } else if (state.dailyChallenge || state.mode !== "ghost") {
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
    hideMatchOverlay();
    if (session) saveSession(session);
    if (room && room.code) {
      pushRecentRoom(room.code, {
        name: getName(),
        mode: room.mode || state.mode,
      });
    }
    applyRoom(room);
    showScreen("game");
    // If race already running (rejoin / quick-match), force race layout
    if (room && (room.status === "racing" || room.status === "countdown")) {
      document.body.classList.add("is-racing");
    }
    KeyClashFX.SFX.join();
    showHomeError("");
  }

  /* —— Online 1v1 matchmaking —— */
  const MATCH_EMPTY_FALLBACK_SEC = 25;

  function stopMatchTimer() {
    if (state.matchTimerId) {
      clearInterval(state.matchTimerId);
      state.matchTimerId = null;
    }
  }

  function setMatchFallbackVisible(show) {
    state.matchFallbackShown = !!show;
    if (els.matchFallback) els.matchFallback.hidden = !show;
    if (show && els.matchTitle) {
      els.matchTitle.textContent = "Still searching…";
    }
    if (show && els.matchMsg) {
      els.matchMsg.textContent =
        "No opponent yet. After ~15s we also try other languages. Or use a fallback below.";
    }
  }

  function showMatchOverlay(searching) {
    if (!els.matchOverlay) return;
    els.matchOverlay.hidden = false;
    const card = els.matchOverlay.querySelector(".match-card");
    if (card) card.classList.toggle("is-found", !searching);
    setMatchFallbackVisible(false);
    if (searching) {
      if (els.matchTitle) els.matchTitle.textContent = "Finding opponent…";
      if (els.matchMsg) {
        els.matchMsg.textContent =
          "Looking for a real online player for a 1v1 race (not a ghost).";
      }
      const modeForMatch =
        state.mode === "ghost" || state.mode === "team" ? "classic" : state.mode;
      if (els.matchDetail) {
        els.matchDetail.textContent =
          langLabel(state.language) +
          " · " +
          capitalize(state.difficulty) +
          " · " +
          modeLabel(modeForMatch);
      }
      state.matchSearchStartedAt = Date.now();
      stopMatchTimer();
      if (els.matchTimer) els.matchTimer.textContent = "0s · est. wait varies";
      state.matchTimerId = setInterval(() => {
        if (!els.matchTimer) return;
        const s = Math.floor((Date.now() - state.matchSearchStartedAt) / 1000);
        let est = "est. wait varies";
        if (s < 15) est = "prefer same language";
        else if (s < MATCH_EMPTY_FALLBACK_SEC) est = "opening to any language…";
        else est = "low traffic — try a fallback";
        els.matchTimer.textContent = s + "s · " + est;
        if (s >= MATCH_EMPTY_FALLBACK_SEC && !state.matchFallbackShown) {
          setMatchFallbackVisible(true);
        }
      }, 250);
    }
  }

  function hideMatchOverlay() {
    if (els.matchOverlay) {
      els.matchOverlay.hidden = true;
      els.matchOverlay.setAttribute("aria-hidden", "true");
    }
    setMatchFallbackVisible(false);
    stopMatchTimer();
    state.matchmaking = false;
    state.duelInviteCode = null;
    if (els.matchInviteUrl) {
      els.matchInviteUrl.hidden = true;
      els.matchInviteUrl.textContent = "";
    }
    if (els.btnMatch) els.btnMatch.disabled = false;
  }

  function cancelMatchmaking(silent) {
    if (!state.matchmaking && (!els.matchOverlay || els.matchOverlay.hidden)) {
      hideMatchOverlay();
      return;
    }
    socket.emit("match:cancel", {}, () => {});
    hideMatchOverlay();
    if (!silent) toast("Search cancelled");
  }

  function startMatchmaking() {
    showHomeError("");
    if (state.matchmaking) return;
    if (!socket.connected) {
      showHomeError("Not connected yet — wait a moment, then try again.");
      toast("Connecting to server…", true);
      socket.connect();
      return;
    }

    state.matchmaking = true;
    if (els.btnMatch) els.btnMatch.disabled = true;
    showMatchOverlay(true);

    const modeForMatch =
      state.mode === "ghost" || state.mode === "team" ? "classic" : state.mode;

    // Best recent WPM for opponent badge (local ghost / last match)
    let lastWpm = state.lastMatchWpm || 0;
    try {
      const g = Number(localStorage.getItem(GHOST_KEY));
      if (Number.isFinite(g) && g > lastWpm) lastWpm = g;
    } catch (_) {}

    socket.timeout(12000).emit(
      "match:find",
      {
        name: getName(),
        language: state.language,
        difficulty: state.difficulty,
        mode: modeForMatch,
        paragraphs: state.paragraphs,
        category: state.category,
        lastWpm: lastWpm || undefined,
      },
      (err, res) => {
        if (err) {
          hideMatchOverlay();
          showHomeError(
            "Matchmaking timed out. Free server may be waking up — try again."
          );
          toast("Matchmaking timed out", true);
          return;
        }
        if (!res || !res.ok) {
          hideMatchOverlay();
          showHomeError((res && res.error) || "Could not start search.");
          toast((res && res.error) || "Matchmaking failed", true);
          return;
        }
        if (res.status === "matched" && res.room) {
          hideMatchOverlay();
          if (!state.room || state.room.code !== res.room.code) {
            enterGame(res.room, null);
          }
          toast("Opponent found — race starting!");
          return;
        }
        if (els.matchMsg) {
          els.matchMsg.textContent =
            "In queue… same language first; after 15s we try any language.";
        }
      }
    );
  }

  function onMatchFound(payload) {
    if (!payload || !payload.room) return;
    hideMatchOverlay();
    const opp = payload.opponent;
    enterGame(payload.room, payload.session);
    const oppName = (opp && opp.name) || "Opponent";
    const badge =
      opp && opp.badgeWpm
        ? " · ~" + opp.badgeWpm + " WPM"
        : "";
    toast("1v1 vs " + oppName + badge + " — race starts soon!");
    if (els.inputHint) {
      els.inputHint.textContent =
        "1v1 vs " + oppName + badge + " — get ready…";
    }
    if (els.matchTitle) {
      // no-op; overlay already hidden
    }
  }

  function request1v1Rematch() {
    socket.emit("match:rematch", {}, (res) => {
      if (!res || !res.ok) {
        toast((res && res.error) || "Could not rematch", true);
        if (res && res.code === "OPPONENT_LEFT") {
          if (els.btnFindNew) els.btnFindNew.hidden = false;
        }
        return;
      }
      if (res.status === "waiting") {
        toast("Rematch requested — waiting for opponent…");
        if (els.rematchHint) {
          els.rematchHint.hidden = false;
          els.rematchHint.textContent =
            (res.votes || 1) +
            "/" +
            (res.needed || 2) +
            " want rematch — waiting for opponent…";
        }
        if (els.btnRematch) {
          els.btnRematch.textContent = "Waiting…";
          els.btnRematch.disabled = true;
        }
      } else if (res.status === "starting") {
        toast("Rematch! Race starting…");
      }
    });
  }

  function leaveAndFindNewOpponent() {
    socket.emit("room:leave", () => {
      clearSession();
      state.room = null;
      state.racing = false;
      endLocalRace();
      stopUiTimer();
      showScreen("home");
      toast("Finding a new opponent…");
      setTimeout(() => startMatchmaking(), 200);
    });
  }

  els.btnCreate.addEventListener("click", () => {
    showHomeError("");
    cancelMatchmaking(true);
    els.btnCreate.disabled = true;
    socket.emit(
      "room:create",
      {
        name: getName(),
        difficulty: state.difficulty,
        language: state.language,
        mode: state.mode,
        paragraphs: state.paragraphs,
        category: state.category,
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
    cancelMatchmaking(true);
    joinRoom((els.code.value || "").trim().toUpperCase());
  });

  els.btnPractice.addEventListener("click", () => {
    showHomeError("");
    cancelMatchmaking(true);
    state.dailyChallenge = false;
    startPractice({ daily: false });
  });

  if (els.btnDaily) {
    els.btnDaily.addEventListener("click", () => {
      showHomeError("");
      cancelMatchmaking(true);
      startPractice({ daily: true });
    });
  }
  if (els.btnRefreshDaily) {
    els.btnRefreshDaily.addEventListener("click", () => {
      loadDailyBoard();
      toast("Daily board refreshed");
    });
  }
  if (els.btnShareResult) {
    els.btnShareResult.addEventListener("click", () => shareResultText());
  }
  if (els.btnCopyResult) {
    els.btnCopyResult.addEventListener("click", async () => {
      await copyText(
        state.lastShareText || `Race me on KeyClash!\n${getGameUrl()}`,
        "Result copied"
      );
    });
  }
  if (els.btnPracticeShare) {
    els.btnPracticeShare.addEventListener("click", () => shareResultText());
  }
  if (els.btnPracticeCopyShare) {
    els.btnPracticeCopyShare.addEventListener("click", async () => {
      await copyText(
        state.lastShareText || `Race me on KeyClash!\n${getGameUrl()}`,
        "Result copied"
      );
    });
  }

  // Fairness: block paste/drop into typing fields
  blockPaste(els.typeInput);
  blockPaste(els.practiceInput);

  socket.on("player:forfeit", ({ name, reason }) => {
    toast(
      (name || "Opponent") +
        (reason === "disconnect" ? " disconnected — forfeit" : " forfeited")
    );
  });

  if (els.btnMatch) {
    els.btnMatch.addEventListener("click", () => startMatchmaking());
  }
  if (els.btnMatchCancel) {
    els.btnMatchCancel.addEventListener("click", () => cancelMatchmaking(false));
  }
  if (els.btnMatchInvite) {
    els.btnMatchInvite.addEventListener("click", () => createDuelInvite());
  }
  if (els.btnMatchKeep) {
    els.btnMatchKeep.addEventListener("click", () => {
      setMatchFallbackVisible(false);
      state.matchFallbackShown = true; // prevent flicker; re-show after another 25s
      state.matchSearchStartedAt = Date.now();
      if (els.matchTitle) els.matchTitle.textContent = "Still searching…";
      if (els.matchMsg) {
        els.matchMsg.textContent = "Keeping you in queue. Hang tight…";
      }
      toast("Still searching for an opponent");
      // Allow fallback again after another empty wait
      setTimeout(() => {
        if (state.matchmaking) state.matchFallbackShown = false;
      }, MATCH_EMPTY_FALLBACK_SEC * 1000);
    });
  }
  if (els.btnMatchPractice) {
    els.btnMatchPractice.addEventListener("click", () => {
      cancelMatchmaking(true);
      startPractice();
      toast("Practice Solo — no lobby needed");
    });
  }
  if (els.btnMatchCreate) {
    els.btnMatchCreate.addEventListener("click", () => {
      cancelMatchmaking(true);
      if (els.btnCreate) els.btnCreate.click();
    });
  }
  if (els.btnMatchShare) {
    els.btnMatchShare.addEventListener("click", async () => {
      // Stay in queue; copy game URL so friends can open + Find 1v1 or join a room
      const url = getGameUrl();
      await copyText(url, "Game link copied — share so friends can play!");
      if (els.matchMsg) {
        els.matchMsg.textContent =
          "Link copied. Friends can open it and tap Find 1v1 Opponent too.";
      }
    });
  }

  socket.on("match:found", (payload) => {
    onMatchFound(payload);
  });

  socket.on("match:searching", (info) => {
    if (!state.matchmaking) return;
    if (els.matchMsg && !state.matchFallbackShown) {
      els.matchMsg.textContent =
        "Searching… queue " +
        ((info && info.queueSize) || 1) +
        " player(s). Same language first.";
    }
  });

  socket.on("match:cancelled", () => {
    hideMatchOverlay();
  });

  function exitPractice() {
    state.practice.racing = false;
    stopPracticeTimer();
    stopGhostTimer();
    showScreen("home");
  }
  els.btnPracticeExit.addEventListener("click", exitPractice);
  els.btnPracticeHome.addEventListener("click", exitPractice);
  els.btnPracticeAgain.addEventListener("click", () =>
    startPractice({ daily: state.dailyChallenge })
  );

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
    // 1v1 rematch uses dedicated vote flow so both players must agree
    if (state.room && state.room.quickMatch && state.room.status === "results") {
      request1v1Rematch();
      return;
    }
    socket.emit("race:request-start", {}, (res) => {
      if (res && res.ok === false) toast(res.error || "Could not start", true);
    });
  }
  els.btnStart.addEventListener("click", requestStart);
  if (els.btnRematch) els.btnRematch.addEventListener("click", requestStart);
  if (els.btnFindNew) {
    els.btnFindNew.addEventListener("click", () => leaveAndFindNewOpponent());
  }

  socket.on("match:rematch-status", (info) => {
    if (!info || !state.room || !state.room.quickMatch) return;
    if (els.rematchHint) {
      els.rematchHint.hidden = false;
      els.rematchHint.textContent =
        (info.votes || 0) +
        "/" +
        (info.needed || 2) +
        " want rematch" +
        (info.by && info.by.name ? " · " + info.by.name + " ready" : "");
    }
    // Mark local players for UI
    if (state.room.players && Array.isArray(info.readyIds)) {
      state.room.players.forEach((p) => {
        p.rematchWanted = info.readyIds.indexOf(p.id) !== -1;
      });
      renderPlayers();
    }
  });

  if (els.btnCloseResults) {
    els.btnCloseResults.addEventListener("click", () => {
      // Dismiss results panel and return to lobby UI (room stays in results until host starts)
      if (els.resultsOverlay) els.resultsOverlay.hidden = true;
      if (state.room) {
        // Soft lobby view: keep stats, allow chat / ready / host controls
        setStatus(state.room.status === "results" ? "results" : "lobby");
        if (els.statusPill && state.room.status === "results") {
          els.statusPill.textContent = "Lobby";
          els.statusPill.className = "status-pill";
        }
        renderPlayers();
        renderTracks();
        els.inputHint.textContent = isHost()
          ? "Results closed — start Next Round when ready"
          : "Results closed — waiting for host…";
      }
      toast("Results closed");
    });
  }

  els.btnLeave.addEventListener("click", () => {
    const lastCode = state.room && state.room.code;
    if (lastCode) {
      pushRecentRoom(lastCode, {
        name: getName(),
        mode: (state.room && state.room.mode) || state.mode,
      });
    }
    socket.emit("room:leave", () => {
      clearSession();
      state.room = null;
      state.racing = false;
      endLocalRace();
      stopUiTimer();
      showScreen("home");
      toast(lastCode ? "Left room · tap Play again to rejoin " + lastCode : "Left room");
    });
  });

  function getGameUrl() {
    return window.location.origin + "/";
  }

  /** Deep link that opens straight into this room */
  function roomInviteUrl(code) {
    const room = (code || (state.room && state.room.code) || "").toUpperCase();
    if (!room || room === "-----") return getGameUrl();
    return window.location.origin + "/?room=" + encodeURIComponent(room);
  }

  function buildInviteText(code) {
    const room = code || (state.room && state.room.code) || "-----";
    const url = roomInviteUrl(room);
    return (
      "Join my KeyClash room!\n" +
      "Link: " +
      url +
      "\n(Room: " +
      room +
      ")\n\nTap the link — it opens the lobby. Enter your name if asked."
    );
  }

  function getRoomFromUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      const raw = params.get("room") || params.get("code") || "";
      return String(raw).trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    } catch {
      return "";
    }
  }

  function clearRoomQueryFromUrl() {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("room") || url.searchParams.has("code")) {
        url.searchParams.delete("room");
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.pathname + url.search + url.hash);
      }
    } catch (_) {}
  }

  function joinRoom(code, opts) {
    const options = opts || {};
    const roomCode = String(code || "")
      .trim()
      .toUpperCase();
    if (!roomCode) {
      showHomeError("Enter the 5-character room code from your host.");
      return;
    }
    if (state.joinInFlight) return;
    cancelMatchmaking(true);
    state.joinInFlight = true;
    if (els.btnJoin) els.btnJoin.disabled = true;
    if (!options.silent) toast("Joining " + roomCode + "…");

    const attempt = () => {
      if (!socket.connected) {
        socket.connect();
        setTimeout(attempt, 250);
        return;
      }
      socket.timeout(10000).emit(
        "room:join",
        { code: roomCode, name: getName() },
        (err, response) => {
          state.joinInFlight = false;
          if (els.btnJoin) els.btnJoin.disabled = false;

          if (err) {
            showHomeError(
              "Join timed out. Free server may be waking up — wait 30s and try again."
            );
            toast("Join timed out — try again", true);
            return;
          }

          if (!response || !response.ok) {
            showHomeError((response && response.error) || "Could not join room.");
            toast((response && response.error) || "Join failed", true);
            return;
          }
          clearRoomQueryFromUrl();
          enterGame(response.room, response.session);
          toast("Joined lobby · " + response.room.code);
        }
      );
    };
    attempt();
  }

  function tryAutoJoinFromUrl() {
    const room = getRoomFromUrl();
    if (!room) return;
    state.pendingRoomCode = room;
    if (els.code) els.code.value = room;
    // Prefill / prompt name then join
    if (!(els.name.value || "").trim()) {
      showHomeError("Enter your name, then you'll join room " + room + " automatically.");
      if (els.name) els.name.focus();
      // Join when they finish typing name (Enter or after blur with value)
      const onceJoin = () => {
        if ((els.name.value || "").trim() && state.pendingRoomCode) {
          joinRoom(state.pendingRoomCode, { silent: true });
          state.pendingRoomCode = null;
        }
      };
      els.name.addEventListener("change", onceJoin, { once: true });
      return;
    }
    joinRoom(room, { silent: false });
    state.pendingRoomCode = null;
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

  function openShareModal(code) {
    if (!els.shareModal || !state.room) return;
    const inviteUrl = roomInviteUrl(code || state.room.code);
    if (els.shareUrlText) els.shareUrlText.textContent = inviteUrl;
    if (els.shareQr) {
      els.shareQr.src =
        "https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=" +
        encodeURIComponent(inviteUrl);
      els.shareQr.alt = "QR for " + inviteUrl;
    }
    els.shareModal.hidden = false;
  }

  function closeShareModal() {
    if (els.shareModal) els.shareModal.hidden = true;
  }

  if (els.btnShare) {
    els.btnShare.addEventListener("click", async () => {
      if (!state.room) return;
      openShareModal(state.room.code);
      // Also try native share on mobile in background
      const inviteUrl = roomInviteUrl(state.room.code);
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        try {
          await navigator.share({
            title: "KeyClash",
            text: buildInviteText(state.room.code),
            url: inviteUrl,
          });
        } catch (_) {}
      }
    });
  }

  if (els.btnShareClose) els.btnShareClose.addEventListener("click", closeShareModal);
  if (els.shareModal) {
    els.shareModal.addEventListener("click", (e) => {
      if (e.target === els.shareModal) closeShareModal();
    });
  }
  if (els.btnShareCopyLink) {
    els.btnShareCopyLink.addEventListener("click", async () => {
      if (!state.room) return;
      await copyText(roomInviteUrl(state.room.code), "Invite link copied");
    });
  }
  if (els.btnShareCopyCode) {
    els.btnShareCopyCode.addEventListener("click", async () => {
      if (!state.room) return;
      await copyText(state.room.code, "Room code copied");
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
    // Send raw; server censors. Local display uses censored form via room broadcast.
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
        if (res.room && res.room.code) {
          pushRecentRoom(res.room.code, {
            name: s.name || getName(),
            mode: res.room.mode || state.mode,
          });
        }
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

  function showConnecting(show, msg) {
    if (!els.connectingOverlay) return;
    els.connectingOverlay.hidden = !show;
    if (msg && els.connectingMsg) els.connectingMsg.textContent = msg;
    if (show) {
      if (!state.connectTimer) {
        state.connectStartedAt = Date.now();
        state.connectTimer = setInterval(() => {
          const s = Math.floor((Date.now() - state.connectStartedAt) / 1000);
          if (els.connectingTimer) els.connectingTimer.textContent = s + "s";
        }, 250);
      }
    } else if (state.connectTimer) {
      clearInterval(state.connectTimer);
      state.connectTimer = null;
      if (els.connectingTimer) els.connectingTimer.textContent = "0s";
    }
  }

  function startClientKeepAlive() {
    if (state.keepAliveTimer) return;
    // Ping health while tab is open (helps free Render stay warm)
    state.keepAliveTimer = setInterval(() => {
      fetch("/api/health?_=" + Date.now(), { cache: "no-store" }).catch(() => {});
    }, 4 * 60 * 1000);
  }

  // Show overlay until first connection (especially Render cold start)
  if (!socket.connected) {
    showConnecting(
      true,
      "Free host may take 30–60 seconds to wake up. Please wait — do not close this tab."
    );
  }
  startClientKeepAlive();

  socket.on("connect", () => {
    state.myId = socket.id;
    showConnecting(false);
    const s = loadSession();
    if (s?.roomCode && s?.token && !state.room) {
      tryReconnect(false);
    } else if (!state.room) {
      tryAutoJoinFromUrl();
    }
  });

  socket.on("disconnect", () => {
    if (state.modeScreen === "home" || !state.room) {
      showConnecting(
        true,
        "Reconnecting to server… Free host may take up to a minute."
      );
    }
  });

  socket.on("room:update", (room) => {
    const wasRacing = state.racing;
    const wasCountdown = state.room && state.room.status === "countdown";
    const caret = state.caret;
    const errors = state.errors;
    const passage = state.passage;
    const prevStatus = state.room && state.room.status;

    // During live race, only patch players — full applyRoom rebuilds DOM and feels laggy
    if (wasRacing && room.status === "racing") {
      state.room = room;
      state.myId = socket.id;
      // Keep local typing state
      state.racing = true;
      state.caret = caret;
      state.errors = errors;
      state.passage = passage || normalizeTypingText(room.passage || "");
      // Soft-update player list stats without wiping input focus
      room.players.forEach((p) => {
        updatePlayerListRow(p);
        if (p.id !== state.myId) {
          updateTrackPlayer(p);
        } else {
          // still update track for me from local caret
          updateTrackPlayer({
            id: p.id,
            progress: state.passage
              ? Math.round((state.caret / state.passage.length) * 100)
              : p.progress,
            wpm: updateLocalStats().wpm,
            accuracy: updateLocalStats().accuracy,
            finished: p.finished,
          });
        }
      });
      {
        const n = room.players.filter((p) => p.connected !== false).length;
        const cap = room.maxPlayers || 10;
        els.playerCount.textContent = room.quickMatch
          ? `${n}/2 · 1v1`
          : `${n}/${cap}`;
      }
      return;
    }

    applyRoom(room);

    // If we entered countdown via room:update only (missed race:countdown), start UI countdown
    if (room.status === "countdown" && prevStatus !== "countdown" && !wasCountdown) {
      if (room.passage) state.passage = normalizeTypingText(room.passage);
      els.countdownOverlay.hidden = false;
      runCountdown(3000, els.countdownNum, els.countdownOverlay, null, Date.now() + 3000);
    }

    if (wasRacing && room.status === "racing") {
      state.racing = true;
      state.caret = caret;
      state.errors = errors;
      state.passage = passage || normalizeTypingText(room.passage || "");
      els.typeInput.disabled =
        state.caret >= state.passage.length ||
        (state.errors > 0 && room.mode === "sudden_death");
      renderPassage();
      updateLocalStats();
    }
  });

  socket.on("race:countdown", (payload) => {
    const { duration, endsAt, serverNow, passage, raceDurationMs, snapshot, round } =
      payload || {};
    if (snapshot) {
      state.room = snapshot;
      state.myId = socket.id;
      if (round != null) state.room.round = round;
      renderPlayers();
      renderTracks();
      setStatus("countdown");
    }
    if (round != null && els.roundNum) {
      els.roundNum.textContent = String(Math.max(1, round));
    }
    state.passage = normalizeTypingText(passage || (snapshot && snapshot.passage) || "");
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

    // Sync countdown end with server clock (correct for network delay)
    let end = endsAt;
    if (typeof endsAt === "number" && typeof serverNow === "number") {
      const skew = Date.now() - serverNow;
      end = endsAt + skew;
    }
    runCountdown(duration || 3000, els.countdownNum, els.countdownOverlay, null, end);
  });

  socket.on("race:start", ({ raceStart, passage, raceDurationMs, snapshot }) => {
    cancelCountdown();
    els.countdownOverlay.hidden = true;
    if (snapshot) {
      state.room = snapshot;
      state.myId = socket.id;
      renderPlayers();
      renderTracks();
    }
    beginRace(raceStart, passage, raceDurationMs);
  });

  socket.on("race:progress", (update) => {
    if (!update || !update.id) return;
    upsertPlayer(update);
    updateTrackPlayer(update);
    updatePlayerListRow(update);

    if (state.room && state.room.mode === "team") {
      const ts = localTeamStats(state.room.players);
      state.room.teams = {
        A: { id: "A", ...ts.A },
        B: { id: "B", ...ts.B },
      };
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
    if (player) {
      upsertPlayer({ ...player, connected: true });
      renderPlayers();
      renderTracks();
    }
    KeyClashFX.SFX.join();
    toast(`${(player && player.name) || "Player"} joined`);
  });

  socket.on("player:left", ({ id, name, reason }) => {
    if (state.room && id) {
      state.room.players = state.room.players.filter((p) => p.id !== id);
      renderPlayers();
      renderTracks();
    }
    toast(reason === "timeout" ? `${name || "Player"} timed out` : `${name || "A player"} left`);
  });

  socket.on("player:disconnected", ({ id, name }) => {
    if (state.room && id) {
      const p = state.room.players.find((x) => x.id === id);
      if (p) p.connected = false;
      renderPlayers();
    }
    toast(`${name || "Player"} disconnected — can rejoin soon`);
  });

  socket.on("player:reconnected", ({ player }) => {
    if (player) {
      upsertPlayer({ ...player, connected: true });
      renderPlayers();
      renderTracks();
    }
    toast(`${(player && player.name) || "Player"} reconnected`);
  });

  socket.on("chat:message", (msg) => appendChat(msg));

  socket.on("connect_error", () => {
    showConnecting(
      true,
      "Cannot reach server yet. If this is Render free tier, wait 30–60s while it wakes up."
    );
    showHomeError("Connecting… server may be waking up (free host).");
  });

  els.passage.addEventListener("click", () => {
    if (state.racing) els.typeInput.focus();
  });
  els.practicePassage.addEventListener("click", () => {
    if (state.practice.racing) els.practiceInput.focus();
  });

  updateReconnectBanner();
  renderRecentRooms();
  loadLeaderboard();
  syncVisualViewport();

  // Client-side keep-alive while tab is open (helps free Render stay awake)
  const CLIENT_KEEPALIVE_MS = 4 * 60 * 1000;
  setInterval(() => {
    if (document.visibilityState === "hidden") return;
    fetch("/api/ping", { cache: "no-store" }).catch(() => {});
  }, CLIENT_KEEPALIVE_MS);

  refreshLiveStatus();
  refreshStatsStrip();
  loadDailyBoard();
  loadDailyProfile();
  tryJoinDuelFromUrl();

  // Prefill room from share link even before socket connects
  const urlRoom = getRoomFromUrl();
  if (urlRoom && els.code) {
    els.code.value = urlRoom;
    if (els.shareHelpText) {
      // keep help text
    }
  }
  // Auto-join after short delay if already connected, else connect handler will
  if (socket.connected) {
    tryAutoJoinFromUrl();
  } else if (urlRoom) {
    toast("Connecting to room " + urlRoom + "…");
  }

  // ---- Settings modal (language + sound calibration) ----
  function openSettings() {
    if (!els.settingsModal) return;
    if (window.KeyClashFX) KeyClashFX.syncAudioUi();
    setLangSegActive(els.settingsLanguage, state.language);
    els.settingsModal.hidden = false;
    document.body.classList.add("settings-open");
  }

  function closeSettings() {
    if (!els.settingsModal) return;
    els.settingsModal.hidden = true;
    document.body.classList.remove("settings-open");
  }

  if (els.btnSettings) {
    els.btnSettings.addEventListener("click", openSettings);
  }
  if (els.btnSettingsClose) {
    els.btnSettingsClose.addEventListener("click", closeSettings);
  }
  if (els.btnSettingsDone) {
    els.btnSettingsDone.addEventListener("click", closeSettings);
  }
  if (els.settingsModal) {
    els.settingsModal.addEventListener("click", (e) => {
      if (e.target === els.settingsModal) closeSettings();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && els.settingsModal && !els.settingsModal.hidden) {
      closeSettings();
    }
  });

  if (window.KeyClashFX) {
    KeyClashFX.syncAudioUi();

    if (els.settingsMute) {
      els.settingsMute.addEventListener("change", () => {
        KeyClashFX.setMuted(els.settingsMute.checked);
        toast(els.settingsMute.checked ? "Sound muted" : "Sound on");
        if (!els.settingsMute.checked) {
          try {
            KeyClashFX.SFX.test();
          } catch (_) {}
        }
      });
    }

    if (els.settingsVolume) {
      let volToastTimer = null;
      const applyVolume = (preview) => {
        const pct = Number(els.settingsVolume.value);
        // Dragging the slider while muted → unmute so users can calibrate easily
        if (els.settingsMute && els.settingsMute.checked && pct > 0) {
          KeyClashFX.setMuted(false);
        }
        KeyClashFX.setVolumePercent(pct);
        if (!preview) {
          if (volToastTimer) clearTimeout(volToastTimer);
          volToastTimer = setTimeout(() => {
            toast(
              pct <= 0
                ? "Volume 0% (silent)"
                : "Volume " + KeyClashFX.getVolumePercent() + "%"
            );
          }, 280);
        }
      };
      els.settingsVolume.addEventListener("input", () => applyVolume(true));
      els.settingsVolume.addEventListener("change", () => {
        applyVolume(false);
        if (Number(els.settingsVolume.value) > 0 && !KeyClashFX.isMuted()) {
          try {
            KeyClashFX.SFX.click();
          } catch (_) {}
        }
      });
    }

    if (els.settingsKeySfx) {
      els.settingsKeySfx.addEventListener("change", () => {
        KeyClashFX.setKeySfx(els.settingsKeySfx.checked);
        toast(els.settingsKeySfx.checked ? "Key sounds on" : "Key sounds off");
        if (els.settingsKeySfx.checked) {
          try {
            KeyClashFX.SFX.key();
          } catch (_) {}
        }
      });
    }

    if (els.btnSettingsTest) {
      els.btnSettingsTest.addEventListener("click", () => {
        if (KeyClashFX.isMuted()) {
          toast("Unmute or raise volume to hear the test", true);
          return;
        }
        try {
          KeyClashFX.SFX.test();
          toast("Test sound · " + KeyClashFX.getVolumePercent() + "%");
        } catch (_) {
          toast("Could not play sound", true);
        }
      });
    }
  }

  // Legacy mute button (if still in DOM)
  if (els.btnMute && window.KeyClashFX) {
    els.btnMute.addEventListener("click", () => {
      const nowMuted = KeyClashFX.toggleMute();
      toast(nowMuted ? "Sound muted" : "Sound on");
      if (!nowMuted) {
        try {
          KeyClashFX.SFX.click();
        } catch (_) {}
      }
    });
  }

  // Keep settings language in sync on load
  setLangSegActive(els.settingsLanguage, state.language);

  // ---- How to play: remember collapsed state ----
  if (els.howToPlay) {
    try {
      if (localStorage.getItem(HOWTO_KEY) === "1") {
        els.howToPlay.open = false;
      } else {
        els.howToPlay.open = true;
      }
    } catch (_) {
      els.howToPlay.open = true;
    }
    els.howToPlay.addEventListener("toggle", () => {
      try {
        localStorage.setItem(HOWTO_KEY, els.howToPlay.open ? "0" : "1");
      } catch (_) {}
    });
  }

  // ---- Recent rooms: join / clear ----
  if (els.recentRoomsList) {
    els.recentRoomsList.addEventListener("click", (e) => {
      const btn = e.target.closest(".recent-join-btn");
      if (!btn) return;
      const code = (btn.getAttribute("data-code") || "").toUpperCase();
      if (!code) return;
      if (els.code) els.code.value = code;
      showHomeError("");
      joinRoom(code);
    });
  }
  if (els.btnClearRecent) {
    els.btnClearRecent.addEventListener("click", clearRecentRooms);
  }

  // ---- Mobile keyboard: keep type input visible ----
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncVisualViewport);
    window.visualViewport.addEventListener("scroll", syncVisualViewport);
  }
  window.addEventListener("resize", syncVisualViewport);
  window.addEventListener("orientationchange", () => setTimeout(syncVisualViewport, 200));

  if (els.typeInput) {
    els.typeInput.addEventListener("focus", () => focusTypeDock(els.typeInput));
  }
  if (els.practiceInput) {
    els.practiceInput.addEventListener("focus", () => focusTypeDock(els.practiceInput));
  }

  // ---- Home ad slot (non-intrusive; hide-able for this browser session) ----
  const AD_HIDE_KEY = "keyclash_hide_home_ad";
  const homeAd = document.getElementById("home-ad-slot");
  const btnHideAd = document.getElementById("btn-hide-ad");

  if (homeAd) {
    const hiddenByUser = sessionStorage.getItem(AD_HIDE_KEY) === "1";
    homeAd.hidden = hiddenByUser || state.modeScreen !== "home";
  }

  if (btnHideAd) {
    btnHideAd.addEventListener("click", () => {
      sessionStorage.setItem(AD_HIDE_KEY, "1");
      if (homeAd) homeAd.hidden = true;
      toast("Ad hidden for this visit");
    });
  }
})();
