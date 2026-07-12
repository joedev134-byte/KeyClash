/**
 * Daily Challenge — same passage for everyone on a given UTC day + language.
 * Tracks streaks + badges per racer name (no accounts).
 */
const fs = require("fs");
const path = require("path");
const {
  PASSAGES,
  normalizeLanguage,
  normalizeTypingText,
  LANG_LABELS,
} = require("./passages");

const DATA_DIR = path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "daily.json");
const MAX_PER_DAY = 100;

const BADGE_META = {
  first_clear: { id: "first_clear", label: "First Clear", icon: "🏁" },
  wpm_50: { id: "wpm_50", label: "50 WPM Club", icon: "⚡" },
  wpm_100: { id: "wpm_100", label: "100 WPM Club", icon: "🔥" },
  wpm_150: { id: "wpm_150", label: "150 WPM Elite", icon: "👑" },
  streak_3: { id: "streak_3", label: "3-Day Streak", icon: "📅" },
  streak_7: { id: "streak_7", label: "7-Day Streak", icon: "💎" },
  perfect: { id: "perfect", label: "Perfect Accuracy", icon: "🎯" },
};

function dayKey(ts) {
  return new Date(ts || Date.now()).toISOString().slice(0, 10);
}

function prevDayKey(day) {
  const d = new Date(day + "T12:00:00.000Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify({ days: {}, profiles: {} }, null, 2));
  }
}

function readStore() {
  try {
    ensureStore();
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (!data.days) data.days = {};
    if (!data.profiles) data.profiles = {};
    return data;
  } catch {
    return { days: {}, profiles: {} };
  }
}

function writeStore(data) {
  try {
    ensureStore();
    const keys = Object.keys(data.days || {}).sort();
    while (keys.length > 14) {
      delete data.days[keys.shift()];
    }
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch {
    /* ignore */
  }
}

function sanitizeName(name) {
  return String(name || "")
    .trim()
    .slice(0, 16)
    .replace(/[<>]/g, "") || "Racer";
}

function profileKey(name) {
  return sanitizeName(name).toLowerCase();
}

function getDailyPassage(language) {
  const lang = normalizeLanguage(language);
  const day = dayKey();
  const pool =
    (PASSAGES[lang] && PASSAGES[lang].normal) ||
    (PASSAGES.en && PASSAGES.en.normal) ||
    [];
  if (!pool.length) {
    return {
      day,
      language: lang,
      languageLabel: LANG_LABELS[lang] || lang,
      passage: "Type this daily challenge passage.",
      length: 34,
    };
  }
  const idx = hashSeed(day + ":" + lang) % pool.length;
  const passage = normalizeTypingText(pool[idx]);
  return {
    day,
    language: lang,
    languageLabel: LANG_LABELS[lang] || lang,
    passage,
    length: passage.length,
    difficulty: "normal",
    mode: "daily",
  };
}

function boardKey(day, language) {
  return day + "_" + normalizeLanguage(language);
}

function getProfile(name) {
  const data = readStore();
  const key = profileKey(name);
  const p = data.profiles[key];
  if (!p) {
    return {
      name: sanitizeName(name),
      streak: 0,
      bestStreak: 0,
      bestWpm: 0,
      totalDaily: 0,
      badges: [],
      lastDay: null,
    };
  }
  return {
    name: p.name || sanitizeName(name),
    streak: p.streak || 0,
    bestStreak: p.bestStreak || 0,
    bestWpm: p.bestWpm || 0,
    totalDaily: p.totalDaily || 0,
    badges: Array.isArray(p.badges) ? p.badges : [],
    lastDay: p.lastDay || null,
  };
}

function awardBadges(profile, entry, isFirstEver) {
  const earned = new Set(profile.badges || []);
  const newly = [];
  function grant(id) {
    if (!earned.has(id) && BADGE_META[id]) {
      earned.add(id);
      newly.push(BADGE_META[id]);
    }
  }
  if (isFirstEver || profile.totalDaily === 1) grant("first_clear");
  if (entry.wpm >= 50) grant("wpm_50");
  if (entry.wpm >= 100) grant("wpm_100");
  if (entry.wpm >= 150) grant("wpm_150");
  if (profile.streak >= 3) grant("streak_3");
  if (profile.streak >= 7) grant("streak_7");
  if (entry.accuracy >= 100) grant("perfect");
  profile.badges = [...earned];
  return newly;
}

function updateStreak(profile, day) {
  if (profile.lastDay === day) {
    // same day re-submit — keep streak
    return profile.streak || 0;
  }
  if (profile.lastDay && profile.lastDay === prevDayKey(day)) {
    profile.streak = (profile.streak || 0) + 1;
  } else {
    profile.streak = 1;
  }
  profile.bestStreak = Math.max(profile.bestStreak || 0, profile.streak);
  profile.lastDay = day;
  return profile.streak;
}

function getBoard(language, limit) {
  const lang = normalizeLanguage(language);
  const day = dayKey();
  const data = readStore();
  const key = boardKey(day, lang);
  const entries = (data.days[key] && data.days[key].entries) || [];
  const n = Math.min(50, Math.max(1, Number(limit) || 15));
  const enriched = entries.slice(0, n).map((e) => {
    const prof = data.profiles[profileKey(e.name)] || {};
    return {
      ...e,
      streak: prof.streak || 0,
      badges: Array.isArray(prof.badges) ? prof.badges.slice(0, 4) : [],
    };
  });
  return {
    day,
    language: lang,
    languageLabel: LANG_LABELS[lang] || lang,
    entries: enriched,
    updatedAt: Date.now(),
  };
}

/**
 * One best score per name per day+language (keeps highest WPM).
 * Updates streak + badges on first submit of the day (or improved score).
 */
function submitDaily(payload) {
  const challenge = getDailyPassage(payload.language);
  const wpm = Math.round(Number(payload.wpm) || 0);
  let accuracy = Math.round(Number(payload.accuracy));
  if (!Number.isFinite(accuracy) || accuracy < 0) accuracy = 100;
  if (wpm < 5 || wpm > 220) {
    return { ok: false, error: "WPM out of range (5–220)" };
  }
  if (accuracy < 1 || accuracy > 100) {
    return { ok: false, error: "Accuracy out of range" };
  }

  const entry = {
    id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: sanitizeName(payload.name),
    wpm,
    accuracy,
    language: challenge.language,
    day: challenge.day,
    at: Date.now(),
  };

  const data = readStore();
  const key = boardKey(challenge.day, challenge.language);
  if (!data.days[key]) data.days[key] = { entries: [] };
  const list = data.days[key].entries;
  const nameKey = entry.name.toLowerCase();
  const existingIdx = list.findIndex((e) => e.name.toLowerCase() === nameKey);

  const pKey = profileKey(entry.name);
  const isNewProfile = !data.profiles[pKey];
  const profile = data.profiles[pKey] || {
    name: entry.name,
    streak: 0,
    bestStreak: 0,
    bestWpm: 0,
    totalDaily: 0,
    badges: [],
    lastDay: null,
  };

  let improved = true;
  let firstSubmitToday = true;

  if (existingIdx >= 0) {
    firstSubmitToday = false;
    if (entry.wpm > list[existingIdx].wpm) {
      list[existingIdx] = entry;
    } else {
      improved = false;
    }
  } else {
    list.push(entry);
  }

  // Streak only advances on first clear of a new day
  if (firstSubmitToday || profile.lastDay !== challenge.day) {
    if (profile.lastDay !== challenge.day) {
      updateStreak(profile, challenge.day);
      profile.totalDaily = (profile.totalDaily || 0) + 1;
    }
  }

  if (entry.wpm > (profile.bestWpm || 0)) profile.bestWpm = entry.wpm;
  profile.name = entry.name;

  const newBadges = awardBadges(profile, entry, isNewProfile || profile.totalDaily === 1);
  data.profiles[pKey] = profile;

  list.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy || a.at - b.at);
  data.days[key].entries = list.slice(0, MAX_PER_DAY);
  writeStore(data);

  return {
    ok: true,
    entry,
    improved,
    streak: profile.streak || 0,
    bestStreak: profile.bestStreak || 0,
    bestWpm: profile.bestWpm || 0,
    badges: profile.badges || [],
    newBadges,
    badgeMeta: BADGE_META,
    board: getBoard(challenge.language, 15),
  };
}

function listBadges() {
  return Object.values(BADGE_META);
}

module.exports = {
  getDailyPassage,
  getBoard,
  submitDaily,
  getProfile,
  listBadges,
  dayKey,
  BADGE_META,
};
