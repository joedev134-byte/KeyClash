/**
 * Free in-process security helpers for KeyClash.
 * No paid services, no extra npm deps — rate limits, origin checks, name rules.
 */

/** @type {Map<string, { count: number, resetAt: number }>} */
const buckets = new Map();

const CLEANUP_EVERY_MS = 60 * 1000;
let lastCleanup = Date.now();

function maybeCleanup(now) {
  if (now - lastCleanup < CLEANUP_EVERY_MS) return;
  lastCleanup = now;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}

/**
 * Sliding fixed-window rate limit.
 * @returns {{ ok: true } | { ok: false, retryAfterMs: number }}
 */
function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  maybeCleanup(now);
  const k = String(key);
  let b = buckets.get(k);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(k, b);
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, retryAfterMs: Math.max(0, b.resetAt - now) };
  }
  return { ok: true };
}

function clientIp(reqOrSocket) {
  try {
    if (reqOrSocket && reqOrSocket.headers) {
      const xf = reqOrSocket.headers["x-forwarded-for"];
      if (xf) return String(xf).split(",")[0].trim().slice(0, 64);
      return (reqOrSocket.ip || reqOrSocket.socket?.remoteAddress || "unknown").slice(0, 64);
    }
    // socket.io
    const h = reqOrSocket?.handshake?.headers || {};
    const xf = h["x-forwarded-for"];
    if (xf) return String(xf).split(",")[0].trim().slice(0, 64);
    return (reqOrSocket?.handshake?.address || "unknown").slice(0, 64);
  } catch (_) {
    return "unknown";
  }
}

/** Express middleware factory */
function httpRateLimit(opts) {
  const limit = opts.limit || 60;
  const windowMs = opts.windowMs || 60 * 1000;
  const prefix = opts.prefix || "http";
  return function (req, res, next) {
    const ip = clientIp(req);
    const key = `${prefix}:${ip}:${req.method}:${req.path}`;
    const r = rateLimit(key, limit, windowMs);
    if (!r.ok) {
      res.set("Retry-After", String(Math.ceil(r.retryAfterMs / 1000) || 1));
      res.status(429).json({
        ok: false,
        error: "Too many requests. Slow down and try again.",
        code: "RATE_LIMIT",
      });
      return;
    }
    next();
  };
}

function securityHeaders(_req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  // Avoid breaking Socket.IO / inline-free app; still block obvious XSS vectors
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https:",
      "connect-src 'self' wss: ws: https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join("; ")
  );
  // HSTS only useful on HTTPS (Render provides HTTPS)
  res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
  next();
}

/**
 * Allow same-site + Render + optional ALLOWED_ORIGINS.
 * Unknown origins still can play via same-tab navigation; socket CORS uses this.
 */
function isAllowedOrigin(origin) {
  if (!origin) return true; // same-origin / non-browser
  try {
    const u = new URL(origin);
    const host = u.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") return true;
    if (host.endsWith(".onrender.com")) return true;
    if (process.env.RENDER_EXTERNAL_URL) {
      try {
        const allowed = new URL(process.env.RENDER_EXTERNAL_URL).hostname.toLowerCase();
        if (host === allowed) return true;
      } catch (_) {}
    }
    if (process.env.ALLOWED_ORIGINS) {
      const list = process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean);
      if (list.includes(origin) || list.includes(u.origin)) return true;
    }
    // Public multiplayer game: allow https pages (rate limits stop abuse)
    if (u.protocol === "https:") return true;
    return false;
  } catch (_) {
    return false;
  }
}

/** Names: no HTML, no control chars, limited charset feel, length 1–16 */
function sanitizePlayerName(name, censorText) {
  let s = String(name || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>`"\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 16);
  // Block pure punctuation / empty
  if (!s || !/[A-Za-z0-9\u00C0-\u024F]/.test(s)) {
    s = "Racer" + Math.floor(1000 + Math.random() * 9000);
  }
  // Collapse spammy repeated chars (aaaaaaa → aaa)
  s = s.replace(/(.)\1{4,}/g, "$1$1$1");
  if (typeof censorText === "function") {
    s = censorText(s) || s;
  }
  // If fully censored to asterisks, regenerate
  if (/^\*+$/.test(s)) {
    s = "Racer" + Math.floor(1000 + Math.random() * 9000);
  }
  return s.slice(0, 16);
}

function sanitizeChat(text, censorText) {
  let s = String(text || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 120);
  if (!s) return "";
  if (typeof censorText === "function") s = censorText(s);
  return s.slice(0, 120);
}

/** Soft caps to protect free-tier memory */
const LIMITS = {
  MAX_ROOMS: 150,
  MAX_QUEUE: 80,
  MAX_DUELS: 80,
  // HTTP
  API_GENERAL: { limit: 120, windowMs: 60 * 1000 },
  API_SCORE: { limit: 12, windowMs: 60 * 1000 },
  API_DAILY: { limit: 8, windowMs: 60 * 1000 },
  // Sockets per IP
  ROOM_CREATE: { limit: 8, windowMs: 60 * 1000 },
  ROOM_JOIN: { limit: 20, windowMs: 60 * 1000 },
  CHAT: { limit: 20, windowMs: 60 * 1000 },
  MATCH: { limit: 15, windowMs: 60 * 1000 },
  PROGRESS: { limit: 40, windowMs: 1000 }, // per second bursts
  SOCKET_EVENTS: { limit: 80, windowMs: 10 * 1000 },
};

module.exports = {
  rateLimit,
  clientIp,
  httpRateLimit,
  securityHeaders,
  isAllowedOrigin,
  sanitizePlayerName,
  sanitizeChat,
  LIMITS,
};
