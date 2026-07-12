const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "leaderboard.json");
const MAX_ENTRIES = 200;
const TOP_DEFAULT = 25;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify({ entries: [] }, null, 2));
  }
}

function readAll() {
  try {
    ensureStore();
    const raw = fs.readFileSync(FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.entries) ? data.entries : [];
  } catch {
    return [];
  }
}

function writeAll(entries) {
  ensureStore();
  fs.writeFileSync(FILE, JSON.stringify({ entries }, null, 2));
}

function sanitizeName(name) {
  return String(name || "")
    .trim()
    .slice(0, 16)
    .replace(/[<>]/g, "") || "Racer";
}

/**
 * @returns {{ ok: boolean, entry?: object, error?: string }}
 */
function submitScore(payload) {
  const wpm = Math.round(Number(payload.wpm) || 0);
  let accuracy = Math.round(Number(payload.accuracy));
  if (!Number.isFinite(accuracy) || accuracy < 0) accuracy = 100;
  if (accuracy === 0 && wpm > 0) accuracy = 1;
  // Human-plausible ceiling (elite ~200; soft cap for fairness)
  if (wpm < 5 || wpm > 220) {
    return { ok: false, error: "WPM out of range (5–220)" };
  }
  if (accuracy < 1 || accuracy > 100) {
    return { ok: false, error: "Accuracy out of range" };
  }

  const entry = {
    id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: sanitizeName(payload.name),
    wpm,
    accuracy,
    mode: String(payload.mode || "classic").slice(0, 24),
    language: String(payload.language || "en").slice(0, 8),
    difficulty: String(payload.difficulty || "normal").slice(0, 12),
    source: payload.source === "practice" ? "practice" : "multi",
    at: Date.now(),
  };

  const entries = readAll();
  entries.push(entry);
  entries.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy || b.at - a.at);
  writeAll(entries.slice(0, MAX_ENTRIES));
  return { ok: true, entry };
}

function bestPerName(entries) {
  const map = new Map();
  for (const e of entries) {
    const k = String(e.name || "").toLowerCase();
    const prev = map.get(k);
    if (
      !prev ||
      e.wpm > prev.wpm ||
      (e.wpm === prev.wpm && (e.accuracy || 0) > (prev.accuracy || 0))
    ) {
      map.set(k, e);
    }
  }
  return [...map.values()];
}

/**
 * @param {number|string} limit
 * @param {{ mode?: string, language?: string, difficulty?: string, period?: string }} filters
 * period: "all" | "week" (rolling last 7 days)
 */
function getTop(limit, filters = {}) {
  const n = Math.min(100, Math.max(1, Number(limit) || TOP_DEFAULT));
  let entries = readAll();
  if (filters.mode) entries = entries.filter((e) => e.mode === filters.mode);
  if (filters.language) entries = entries.filter((e) => e.language === filters.language);
  if (filters.difficulty) entries = entries.filter((e) => e.difficulty === filters.difficulty);

  const period = String(filters.period || "all").toLowerCase();
  if (period === "week" || period === "weekly" || period === "7d") {
    const since = Date.now() - WEEK_MS;
    entries = entries.filter((e) => (e.at || 0) >= since);
    // Fresh competition: one best score per racer this week
    entries = bestPerName(entries);
  }

  entries.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy || (b.at || 0) - (a.at || 0));
  return entries.slice(0, n);
}

function weekWindow() {
  const end = Date.now();
  const start = end - WEEK_MS;
  return { start, end, label: "Last 7 days" };
}

module.exports = {
  submitScore,
  getTop,
  weekWindow,
  WEEK_MS,
};
