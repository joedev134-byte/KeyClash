/**
 * Privacy-friendly aggregate analytics (no IPs, no cookies, no personal data).
 * Counts only: 1v1 matches, rematches, languages, modes.
 */
const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "analytics.json");

function emptyStore() {
  return {
    startedAt: Date.now(),
    totals: {
      match1v1: 0,
      rematch1v1: 0,
      queueAbandons: 0,
      healthPings: 0,
    },
    languages: {},
    modes: {},
    daily: {},
  };
}

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify(emptyStore(), null, 2));
  }
}

function readStore() {
  try {
    ensureStore();
    const raw = fs.readFileSync(FILE, "utf8");
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return emptyStore();
    data.totals = data.totals || emptyStore().totals;
    data.languages = data.languages || {};
    data.modes = data.modes || {};
    data.daily = data.daily || {};
    return data;
  } catch {
    return emptyStore();
  }
}

function writeStore(data) {
  try {
    ensureStore();
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
  } catch {
    /* ignore write errors on read-only FS */
  }
}

function dayKey(ts) {
  const d = new Date(ts || Date.now());
  return d.toISOString().slice(0, 10);
}

function bump(map, key, n) {
  const k = String(key || "unknown").slice(0, 24);
  map[k] = (map[k] || 0) + (n || 1);
}

function touchDaily(data, field) {
  const day = dayKey();
  if (!data.daily[day]) {
    data.daily[day] = { match1v1: 0, rematch1v1: 0, queueAbandons: 0 };
  }
  data.daily[day][field] = (data.daily[day][field] || 0) + 1;
  // Keep ~60 days of daily buckets
  const keys = Object.keys(data.daily).sort();
  while (keys.length > 60) {
    delete data.daily[keys.shift()];
  }
}

function trackMatch1v1(meta) {
  const data = readStore();
  data.totals.match1v1 = (data.totals.match1v1 || 0) + 1;
  bump(data.languages, meta && meta.language, 1);
  bump(data.modes, meta && meta.mode, 1);
  touchDaily(data, "match1v1");
  writeStore(data);
}

function trackRematch1v1(meta) {
  const data = readStore();
  data.totals.rematch1v1 = (data.totals.rematch1v1 || 0) + 1;
  bump(data.languages, meta && meta.language, 1);
  bump(data.modes, meta && meta.mode, 1);
  touchDaily(data, "rematch1v1");
  writeStore(data);
}

function trackQueueAbandon() {
  const data = readStore();
  data.totals.queueAbandons = (data.totals.queueAbandons || 0) + 1;
  touchDaily(data, "queueAbandons");
  writeStore(data);
}

function trackHealthPing() {
  const data = readStore();
  data.totals.healthPings = (data.totals.healthPings || 0) + 1;
  writeStore(data);
}

/** Public summary — aggregates only, no personal data */
function getPublicStats() {
  const data = readStore();
  const today = dayKey();
  const topLangs = Object.entries(data.languages || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));
  const topModes = Object.entries(data.modes || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id, count]) => ({ id, count }));

  return {
    ok: true,
    privacy: "Aggregate only. No IPs, names, or personal data stored.",
    totals: {
      match1v1: data.totals.match1v1 || 0,
      rematch1v1: data.totals.rematch1v1 || 0,
      queueAbandons: data.totals.queueAbandons || 0,
    },
    today: data.daily[today] || { match1v1: 0, rematch1v1: 0, queueAbandons: 0 },
    languages: topLangs,
    modes: topModes,
    since: data.startedAt || null,
    updatedAt: Date.now(),
  };
}

module.exports = {
  trackMatch1v1,
  trackRematch1v1,
  trackQueueAbandon,
  trackHealthPing,
  getPublicStats,
};
