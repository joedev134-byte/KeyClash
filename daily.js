/**
 * Daily Challenge — same passage for everyone on a given UTC day + language.
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

function dayKey(ts) {
  return new Date(ts || Date.now()).toISOString().slice(0, 10);
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
    fs.writeFileSync(FILE, JSON.stringify({ days: {} }, null, 2));
  }
}

function readStore() {
  try {
    ensureStore();
    const data = JSON.parse(fs.readFileSync(FILE, "utf8"));
    if (!data.days) data.days = {};
    return data;
  } catch {
    return { days: {} };
  }
}

function writeStore(data) {
  try {
    ensureStore();
    // Keep ~14 days
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

/**
 * Deterministic passage for day + language (normal difficulty pool).
 */
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

function getBoard(language, limit) {
  const lang = normalizeLanguage(language);
  const day = dayKey();
  const data = readStore();
  const key = boardKey(day, lang);
  const entries = (data.days[key] && data.days[key].entries) || [];
  const n = Math.min(50, Math.max(1, Number(limit) || 15));
  return {
    day,
    language: lang,
    languageLabel: LANG_LABELS[lang] || lang,
    entries: entries.slice(0, n),
    updatedAt: Date.now(),
  };
}

/**
 * One best score per name per day+language (keeps highest WPM).
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
  if (existingIdx >= 0) {
    if (entry.wpm > list[existingIdx].wpm) {
      list[existingIdx] = entry;
    } else {
      writeStore(data);
      return {
        ok: true,
        entry: list[existingIdx],
        improved: false,
        board: getBoard(challenge.language, 15),
      };
    }
  } else {
    list.push(entry);
  }
  list.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy || a.at - b.at);
  data.days[key].entries = list.slice(0, MAX_PER_DAY);
  writeStore(data);
  return {
    ok: true,
    entry,
    improved: true,
    board: getBoard(challenge.language, 15),
  };
}

module.exports = {
  getDailyPassage,
  getBoard,
  submitDaily,
  dayKey,
};
