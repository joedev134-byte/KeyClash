/**
 * Lightweight bad-word censor for chat (EN + common TL slang).
 * Replaces matches with asterisks of the same length.
 */

const BAD_WORDS = [
  // English
  "fuck",
  "fucker",
  "fucking",
  "shit",
  "shitty",
  "bitch",
  "asshole",
  "bastard",
  "dick",
  "cock",
  "pussy",
  "cunt",
  "slut",
  "whore",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "motherfucker",
  "bullshit",
  "dumbass",
  "jackass",
  // Tagalog / common slang (partial)
  "putangina",
  "putang ina",
  "puta",
  "punyeta",
  "gago",
  "gaga",
  "tangina",
  "tang ina",
  "ulol",
  "tarantado",
  "leche",
  "lintik",
  "hayop ka",
  "pakyu",
  "pakyo",
  "bobo",
  "tanga",
  "inutil",
  "pokpok",
  "kantot",
  "jakol",
  "bayag",
  "puke",
  "titi",
  "burat",
  "kupal",
];

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stars(len) {
  return "*".repeat(Math.max(1, len));
}

/**
 * Censor bad words in free text. Multi-word phrases first (longer first).
 */
function censorText(input) {
  let text = String(input || "");
  if (!text) return text;

  const sorted = BAD_WORDS.slice().sort((a, b) => b.length - a.length);

  for (const word of sorted) {
    if (word.includes(" ")) {
      const re = new RegExp(escapeRegex(word), "gi");
      text = text.replace(re, (m) => stars(m.length));
    } else {
      // Word boundary-ish: start/end or non-letter sides
      const re = new RegExp(`(?<![a-zA-Z])${escapeRegex(word)}(?![a-zA-Z])`, "gi");
      text = text.replace(re, (m) => stars(m.length));
    }
  }

  return text;
}

module.exports = {
  censorText,
  BAD_WORDS,
};
