/**
 * Fact-only typing passages by language + difficulty.
 * ASCII-friendly punctuation so keyboard keys match.
 */

const PASSAGES = {
  en: {
    easy: [
      "The Earth is the third planet from the Sun.",
      "Water freezes at zero degrees Celsius.",
      "A day on Earth lasts about twenty-four hours.",
      "The Moon is Earth's only natural satellite.",
      "Honey does not spoil if it is stored well.",
      "Octopuses have three hearts and blue blood.",
      "Bananas are berries, but strawberries are not.",
      "The Pacific Ocean is the largest ocean on Earth.",
      "Light from the Sun takes about eight minutes to reach us.",
      "Adult humans have thirty-two teeth, including wisdom teeth.",
      "The Amazon River carries more water than any other river.",
      "Sharks existed before trees first appeared on land.",
      "A group of flamingos is called a flamboyance.",
      "Mount Everest is the highest mountain above sea level.",
      "The human body is about sixty percent water.",
      "Antarctica is the coldest continent on Earth.",
    ],
    normal: [
      "Venus is the hottest planet in our solar system even though Mercury is closer to the Sun, because a thick atmosphere traps heat.",
      "Your brain uses about twenty percent of your body's energy even though it is only a small part of your total body weight.",
      "There are more trees on Earth than stars in the Milky Way galaxy, based on current scientific estimates of both numbers.",
      "The Great Barrier Reef is the largest living structure on Earth and can be seen from space under good conditions.",
      "Sound travels faster through water than through air because water molecules are packed more closely together.",
      "A year on Mars is about six hundred eighty-seven Earth days long because Mars orbits farther from the Sun.",
      "Lightning is hotter than the surface of the Sun for a brief moment when it flashes through the atmosphere.",
      "The Sahara is the largest hot desert in the world, covering large parts of North Africa across many countries.",
      "Bees can see ultraviolet light, which helps them find patterns on flowers that human eyes cannot see.",
      "The speed of light in a vacuum is about three hundred thousand kilometers per second.",
      "Blue whales are the largest animals known to have ever lived on Earth, bigger than most dinosaurs.",
      "Earth's magnetic field helps protect the planet from charged particles coming from the solar wind.",
      "Diamond is one of the hardest natural materials and is made of carbon atoms arranged in a strong crystal lattice.",
      "The Nile River was long listed as the world's longest river, though some modern measurements debate the ranking with the Amazon.",
      "Koalas sleep for many hours each day because their diet of eucalyptus leaves is low in energy.",
      "The International Space Station orbits Earth about every ninety minutes at a speed of roughly twenty-eight thousand kilometers per hour.",
    ],
    hard: [
      "Jupiter has more than ninety known moons, and its largest moon, Ganymede, is bigger than the planet Mercury.",
      "Photosynthesis converts carbon dioxide and water into sugars and oxygen using energy from sunlight, powering most food chains on Earth.",
      "The Mariana Trench in the Pacific Ocean is the deepest known part of the ocean, reaching depths of nearly eleven kilometers.",
      "DNA is a double helix molecule that stores genetic instructions; humans share a large percentage of genes with many other living species.",
      "Saturn's rings are made mostly of ice particles mixed with rock and dust, ranging from tiny grains to large chunks.",
      "Plate tectonics explains how Earth's crust moves in large plates, causing earthquakes, volcanoes, and the slow drift of continents.",
      "A black hole is a region of spacetime where gravity is so strong that nothing, not even light, can escape from beyond its event horizon.",
      "The human heart beats about one hundred thousand times per day on average, pumping blood through roughly one hundred thousand kilometers of vessels.",
      "Neutron stars are extremely dense remnants of massive stars; a teaspoon of their material would weigh billions of tons on Earth.",
      "The greenhouse effect is a natural process, but extra carbon dioxide and methane from human activity strengthen warming of the climate.",
      "Coral reefs support roughly twenty-five percent of marine species even though they cover less than one percent of the ocean floor.",
      "The first powered, controlled airplane flight by the Wright brothers took place in 1903 at Kitty Hawk, North Carolina.",
    ],
  },
  tl: {
    easy: [
      "Ang Daigdig ang ikatlong planeta mula sa Araw.",
      "Nagyeyelo ang tubig sa zero degrees Celsius.",
      "May dalawampu't apat na oras ang isang araw sa Daigdig.",
      "Ang Buwan ang tanging natural na satellite ng Daigdig.",
      "Hindi madaling masira ang pulot-pukyutan kung maayos ang pagtatago.",
      "May tatlong puso at asul na dugo ang pugita.",
      "Ang Pasipiko ang pinakamalaking karagatan sa Daigdig.",
      "Humigit-kumulang walong minuto bago makarating sa atin ang liwanag ng Araw.",
      "May tatlumpu't dalawang ngipin ang karaniwang adultong tao.",
      "Ang Bundok Everest ang pinakamataas na bundok sa ibabaw ng dagat.",
      "Halos animnapung porsyento ng katawan ng tao ay tubig.",
      "Ang Antarctica ang pinakamalamig na kontinente sa Daigdig.",
      "Ang Pilipinas ay isang kapuluan sa Timog-Silangang Asya.",
      "May mahigit pitong libong isla ang Pilipinas.",
      "Ang Mayon ay kilala sa halos perpektong hugis-konong bulkan.",
      "Ang palay ang pangunahing pagkain sa maraming bahagi ng Asya.",
    ],
    normal: [
      "Ang Venus ang pinakamainit na planeta sa solar system kahit mas malapit ang Mercury sa Araw, dahil sa makapal nitong atmosphere na humahawak ng init.",
      "Gumagamit ang utak ng tao ng humigit-kumulang dalawampung porsyento ng enerhiya ng katawan kahit maliit lang ang bahagi nito sa bigat.",
      "Mas mabilis maglakbay ang tunog sa tubig kaysa sa hangin dahil mas magkakalapit ang mga molekula ng tubig.",
      "Humigit-kumulang anim na raan walumpu't pitong araw ng Daigdig ang isang taon sa Mars dahil mas malayo ito sa Araw.",
      "Mas mainit pansamantala ang kidlat kaysa sa ibabaw ng Araw sa sandaling dumaan ito sa atmospera.",
      "Ang Sahara ang pinakamalaking mainit na disyerto sa mundo at sumasakop sa malaking bahagi ng Hilagang Aprika.",
      "Nakakakita ang bubuyog ng ultraviolet light na tumutulong sa kanila na makita ang pattern sa bulaklak na hindi nakikita ng mata ng tao.",
      "Ang bilis ng liwanag sa vacuum ay humigit-kumulang tatlong daang libong kilometro bawat segundo.",
      "Ang blue whale ang pinakamalaking hayop na naitala sa kasaysayan ng Daigdig.",
      "Tinutulungan ng magnetic field ng Daigdig na protektahan tayo mula sa charged particles mula sa araw.",
      "Ang diamante ay gawa sa carbon at kabilang sa pinakamatitigas na natural na materyales.",
      "Ang Great Barrier Reef ang pinakamalaking living structure sa Daigdig at makikita minsan mula sa kalawakan.",
      "Ang Taal Volcano ay isa sa mga pinakaaktibong bulkan sa Pilipinas at matatagpuan sa Batangas.",
      "Ang wikang Filipino ay batay sa Tagalog at isa sa mga opisyal na wika ng Pilipinas kasama ang Ingles.",
      "Ang Tubbataha Reef sa Palawan ay isang UNESCO World Heritage Site na mayaman sa marine life.",
      "Ang International Space Station ay umiikot sa Daigdig nang humigit-kumulang bawat siyamnapung minuto.",
    ],
    hard: [
      "May mahigit siyamnapung kilalang buwan ang Jupiter, at mas malaki pa ang pinakamalaki nitong buwan na Ganymede kaysa sa planetang Mercury.",
      "Sa photosynthesis, ginagamit ng halaman ang sikat ng araw upang gawing asukal at oxygen ang carbon dioxide at tubig.",
      "Ang Mariana Trench sa Pasipiko ang pinakamalalim na bahagi ng karagatan, na umaabot ng halos labing-isang kilometro.",
      "Ang DNA ay double helix molecule na nag-iimbak ng genetic instructions para sa paglaki at paggana ng mga organismo.",
      "Halos yelo, bato, at alikabok ang bumubuo sa mga singsing ng Saturn, mula sa maliliit na butil hanggang sa malalaking piraso.",
      "Ipinapaliwanag ng plate tectonics kung paano gumagalaw ang crust ng Daigdig, na nagdudulot ng lindol, bulkan, at pag-anod ng mga kontinente.",
      "Ang black hole ay rehiyon sa spacetime kung saan napakalakas ng gravity kaya wala, maging liwanag man, ang makakatakas lampas sa event horizon.",
      "Tumitibok ang puso ng tao nang humigit-kumulang isang daang libong beses bawat araw at nagpapadaloy ng dugo sa napakahabang network ng ugat.",
      "Lubhang siksik ang neutron star; ang isang kutsarita ng materyal nito ay magpapabigat ng bilyun-bilyong tonelada kung dadalhin sa Daigdig.",
      "Likas ang greenhouse effect, ngunit pinalalakas ito ng dagdag na carbon dioxide at methane mula sa gawain ng tao, na nag-aambag sa climate change.",
      "Sinusuportahan ng coral reefs ang humigit-kumulang dalawampu't limang porsyento ng marine species kahit maliit lang ang bahagi nila sa sahig ng karagatan.",
      "Naganap noong 1903 ang unang controlled powered airplane flight nina Wright brothers sa Kitty Hawk, North Carolina.",
    ],
  },
};

const LANGUAGES = ["en", "tl"];
const DIFFICULTIES = ["easy", "normal", "hard"];

const LANG_LABELS = {
  en: "English",
  tl: "Tagalog",
};

/** Fact topic packs (separate from difficulty tiers). */
const CATEGORIES = {
  all: { id: "all", label: "All Facts", short: "All" },
  science: { id: "science", label: "Science", short: "Sci" },
  space: { id: "space", label: "Space", short: "Space" },
  animals: { id: "animals", label: "Animals", short: "Animals" },
  ph: { id: "ph", label: "Philippines", short: "PH" },
};

const CATEGORY_IDS = Object.keys(CATEGORIES);

/**
 * Category-specific facts by language + difficulty.
 * "all" uses the main PASSAGES pool.
 */
const CATEGORY_PASSAGES = {
  en: {
    science: {
      easy: [
        "Water freezes at zero degrees Celsius.",
        "Honey does not spoil if it is stored well.",
        "The human body is about sixty percent water.",
        "Adult humans have thirty-two teeth, including wisdom teeth.",
        "Diamond is made of carbon atoms in a strong crystal lattice.",
      ],
      normal: [
        "Your brain uses about twenty percent of your body's energy even though it is only a small part of your total body weight.",
        "Sound travels faster through water than through air because water molecules are packed more closely together.",
        "Lightning is hotter than the surface of the Sun for a brief moment when it flashes through the atmosphere.",
        "Bees can see ultraviolet light, which helps them find patterns on flowers that human eyes cannot see.",
        "DNA stores genetic instructions; humans share a large percentage of genes with many other living species.",
      ],
      hard: [
        "Photosynthesis converts carbon dioxide and water into sugars and oxygen using energy from sunlight, powering most food chains on Earth.",
        "Plate tectonics explains how Earth's crust moves in large plates, causing earthquakes, volcanoes, and the slow drift of continents.",
        "The greenhouse effect is a natural process, but extra carbon dioxide and methane from human activity strengthen warming of the climate.",
        "The human heart beats about one hundred thousand times per day on average, pumping blood through roughly one hundred thousand kilometers of vessels.",
      ],
    },
    space: {
      easy: [
        "The Earth is the third planet from the Sun.",
        "The Moon is Earth's only natural satellite.",
        "Light from the Sun takes about eight minutes to reach us.",
        "A day on Earth lasts about twenty-four hours.",
      ],
      normal: [
        "Venus is the hottest planet in our solar system even though Mercury is closer to the Sun, because a thick atmosphere traps heat.",
        "A year on Mars is about six hundred eighty-seven Earth days long because Mars orbits farther from the Sun.",
        "The speed of light in a vacuum is about three hundred thousand kilometers per second.",
        "The International Space Station orbits Earth about every ninety minutes at a speed of roughly twenty-eight thousand kilometers per hour.",
        "Earth's magnetic field helps protect the planet from charged particles coming from the solar wind.",
      ],
      hard: [
        "Jupiter has more than ninety known moons, and its largest moon, Ganymede, is bigger than the planet Mercury.",
        "Saturn's rings are made mostly of ice particles mixed with rock and dust, ranging from tiny grains to large chunks.",
        "A black hole is a region of spacetime where gravity is so strong that nothing, not even light, can escape from beyond its event horizon.",
        "Neutron stars are extremely dense remnants of massive stars; a teaspoon of their material would weigh billions of tons on Earth.",
      ],
    },
    animals: {
      easy: [
        "Octopuses have three hearts and blue blood.",
        "A group of flamingos is called a flamboyance.",
        "Sharks existed before trees first appeared on land.",
        "Bananas are berries, but strawberries are not.",
      ],
      normal: [
        "Blue whales are the largest animals known to have ever lived on Earth, bigger than most dinosaurs.",
        "Koalas sleep for many hours each day because their diet of eucalyptus leaves is low in energy.",
        "The Great Barrier Reef is the largest living structure on Earth and can be seen from space under good conditions.",
        "There are more trees on Earth than stars in the Milky Way galaxy, based on current scientific estimates of both numbers.",
      ],
      hard: [
        "Coral reefs support roughly twenty-five percent of marine species even though they cover less than one percent of the ocean floor.",
        "The Mariana Trench in the Pacific Ocean is the deepest known part of the ocean, reaching depths of nearly eleven kilometers.",
        "The Amazon River carries more water than any other river on Earth and supports enormous biodiversity.",
      ],
    },
    ph: {
      easy: [
        "The Philippines is an archipelago in Southeast Asia.",
        "The Philippines has more than seven thousand islands.",
        "Mayon Volcano is known for its nearly perfect cone shape.",
        "Rice is a staple food in many parts of the Philippines.",
      ],
      normal: [
        "Taal Volcano is one of the most active volcanoes in the Philippines and is located in Batangas.",
        "Tubbataha Reef in Palawan is a UNESCO World Heritage Site rich in marine life.",
        "Filipino is based on Tagalog and is one of the official languages of the Philippines along with English.",
        "The Philippines sits on the Pacific Ring of Fire, which explains its many volcanoes and earthquakes.",
      ],
      hard: [
        "The Philippine Deep is one of the deepest oceanic trenches in the world and is found east of the archipelago.",
        "Manila was a major trading hub for centuries, connecting Asian and European commerce through galleon trade routes.",
        "The Philippines has some of the highest marine biodiversity on Earth, especially in the Coral Triangle region.",
      ],
    },
  },
  tl: {
    science: {
      easy: [
        "Nagyeyelo ang tubig sa zero degrees Celsius.",
        "Halos animnapung porsyento ng katawan ng tao ay tubig.",
        "May tatlumpu't dalawang ngipin ang karaniwang adultong tao.",
        "Hindi madaling masira ang pulot-pukyutan kung maayos ang pagtatago.",
      ],
      normal: [
        "Gumagamit ang utak ng tao ng humigit-kumulang dalawampung porsyento ng enerhiya ng katawan kahit maliit lang ang bahagi nito sa bigat.",
        "Mas mabilis maglakbay ang tunog sa tubig kaysa sa hangin dahil mas magkakalapit ang mga molekula ng tubig.",
        "Mas mainit pansamantala ang kidlat kaysa sa ibabaw ng Araw sa sandaling dumaan ito sa atmospera.",
        "Ang diamante ay gawa sa carbon at kabilang sa pinakamatitigas na natural na materyales.",
      ],
      hard: [
        "Sa photosynthesis, ginagamit ng halaman ang sikat ng araw upang gawing asukal at oxygen ang carbon dioxide at tubig.",
        "Ipinapaliwanag ng plate tectonics kung paano gumagalaw ang crust ng Daigdig, na nagdudulot ng lindol, bulkan, at pag-anod ng mga kontinente.",
        "Likas ang greenhouse effect, ngunit pinalalakas ito ng dagdag na carbon dioxide at methane mula sa gawain ng tao.",
        "Ang DNA ay double helix molecule na nag-iimbak ng genetic instructions para sa paglaki at paggana ng mga organismo.",
      ],
    },
    space: {
      easy: [
        "Ang Daigdig ang ikatlong planeta mula sa Araw.",
        "Ang Buwan ang tanging natural na satellite ng Daigdig.",
        "Humigit-kumulang walong minuto bago makarating sa atin ang liwanag ng Araw.",
        "May dalawampu't apat na oras ang isang araw sa Daigdig.",
      ],
      normal: [
        "Ang Venus ang pinakamainit na planeta sa solar system kahit mas malapit ang Mercury sa Araw, dahil sa makapal nitong atmosphere.",
        "Humigit-kumulang anim na raan walumpu't pitong araw ng Daigdig ang isang taon sa Mars.",
        "Ang bilis ng liwanag sa vacuum ay humigit-kumulang tatlong daang libong kilometro bawat segundo.",
        "Ang International Space Station ay umiikot sa Daigdig nang humigit-kumulang bawat siyamnapung minuto.",
      ],
      hard: [
        "May mahigit siyamnapung kilalang buwan ang Jupiter, at mas malaki pa ang pinakamalaki nitong buwan na Ganymede kaysa sa planetang Mercury.",
        "Halos yelo, bato, at alikabok ang bumubuo sa mga singsing ng Saturn.",
        "Ang black hole ay rehiyon sa spacetime kung saan napakalakas ng gravity kaya wala, maging liwanag man, ang makakatakas.",
        "Lubhang siksik ang neutron star; ang isang kutsarita ng materyal nito ay magpapabigat ng bilyun-bilyong tonelada sa Daigdig.",
      ],
    },
    animals: {
      easy: [
        "May tatlong puso at asul na dugo ang pugita.",
        "Ang blue whale ang pinakamalaking hayop na naitala sa kasaysayan ng Daigdig.",
      ],
      normal: [
        "Nakakakita ang bubuyog ng ultraviolet light na tumutulong sa kanila na makita ang pattern sa bulaklak.",
        "Ang Great Barrier Reef ang pinakamalaking living structure sa Daigdig at makikita minsan mula sa kalawakan.",
        "Tinutulungan ng magnetic field ng Daigdig na protektahan tayo mula sa charged particles mula sa araw.",
      ],
      hard: [
        "Sinusuportahan ng coral reefs ang humigit-kumulang dalawampu't limang porsyento ng marine species kahit maliit lang ang bahagi nila sa karagatan.",
        "Ang Mariana Trench sa Pasipiko ang pinakamalalim na bahagi ng karagatan, na umaabot ng halos labing-isang kilometro.",
      ],
    },
    ph: {
      easy: [
        "Ang Pilipinas ay isang kapuluan sa Timog-Silangang Asya.",
        "May mahigit pitong libong isla ang Pilipinas.",
        "Ang Mayon ay kilala sa halos perpektong hugis-konong bulkan.",
        "Ang palay ang pangunahing pagkain sa maraming bahagi ng Pilipinas.",
      ],
      normal: [
        "Ang Taal Volcano ay isa sa mga pinakaaktibong bulkan sa Pilipinas at matatagpuan sa Batangas.",
        "Ang Tubbataha Reef sa Palawan ay isang UNESCO World Heritage Site na mayaman sa marine life.",
        "Ang wikang Filipino ay batay sa Tagalog at isa sa mga opisyal na wika ng Pilipinas kasama ang Ingles.",
        "Nasa Pacific Ring of Fire ang Pilipinas, kaya marami itong bulkan at lindol.",
      ],
      hard: [
        "Ang Philippine Deep ay kabilang sa pinakamalalim na trench sa mundo at matatagpuan sa silangan ng kapuluan.",
        "Ang Pilipinas ay bahagi ng Coral Triangle, isa sa mga sentro ng pinakamataas na marine biodiversity sa daigdig.",
        "Sa loob ng maraming siglo, naging mahalagang sentro ng kalakalan ang Maynila sa galleon trade sa pagitan ng Asya at Europa.",
      ],
    },
  },
};

const MODES = {
  classic: {
    id: "classic",
    label: "Classic",
    short: "Race",
    description: "Finish the passage first. Clean and fast.",
  },
  best_of_3: {
    id: "best_of_3",
    label: "Best of 3",
    short: "Bo3",
    description: "First to 2 race wins takes the series.",
  },
  timed: {
    id: "timed",
    label: "Timed 60s",
    short: "60s",
    description: "Type as far as you can in 60 seconds.",
  },
  sudden_death: {
    id: "sudden_death",
    label: "Sudden Death",
    short: "SD",
    description: "One mistake and you are out.",
  },
  ghost: {
    id: "ghost",
    label: "Ghost Race",
    short: "Ghost",
    description: "Race a ghost at your last WPM pace.",
  },
  team: {
    id: "team",
    label: "Team 2v2",
    short: "2v2",
    description: "Two teams. Win by average progress and WPM.",
  },
  words: {
    id: "words",
    label: "Word Mode",
    short: "Words",
    description: "Type random words instead of fact paragraphs.",
  },
};

/** Word banks for Word Mode (ASCII only). */
const WORDS = {
  en: {
    easy: [
      "cat", "dog", "sun", "moon", "tree", "fish", "bird", "book", "rain", "star",
      "water", "earth", "light", "plant", "ocean", "cloud", "river", "stone", "green", "blue",
      "apple", "house", "music", "happy", "quick", "world", "space", "metal", "paper", "glass",
      "bread", "sugar", "honey", "tiger", "horse", "sheep", "mouse", "lemon", "grape", "peach",
    ],
    normal: [
      "planet", "galaxy", "oxygen", "carbon", "energy", "nature", "animal", "forest", "island", "valley",
      "science", "gravity", "magnet", "crystal", "volcano", "weather", "climate", "thunder", "comet", "orbit",
      "protein", "vitamin", "bacteria", "fossil", "mineral", "glacier", "desert", "jungle", "meadow", "canyon",
      "satellite", "atmosphere", "molecule", "element", "nucleus", "electron", "photon", "spectrum", "habitat", "species",
    ],
    hard: [
      "photosynthesis", "constellation", "hemisphere", "equator", "longitude", "latitude", "tectonic", "sediment",
      "metamorphosis", "biodiversity", "ecosystem", "chromosome", "mitochondria", "evaporation", "condensation",
      "fluorescence", "infrared", "ultraviolet", "acceleration", "momentum", "velocity", "trajectory", "parallax",
      "hypothesis", "experiment", "observation", "microscopic", "macroscopic", "circumference", "perpendicular",
    ],
  },
  tl: {
    easy: [
      "aso", "pusa", "araw", "buwan", "ulan", "hangin", "tubig", "lupa", "bato", "dagat",
      "ilog", "bundok", "puno", "dahon", "bulaklak", "ibon", "isda", "ulap", "bituin", "gabi",
      "umaga", "bahay", "bata", "aalis", "kain", "inom", "tulog", "lakad", "takbo", "tawa",
      "saging", "mangga", "kanin", "tinapay", "gatas", "asukal", "asin", "luto", "init", "lamig",
    ],
    normal: [
      "planeta", "kalawakan", "likas", "hayop", "halaman", "kagubatan", "pulo", "lambak", "bulkan", "lindol",
      "kidlat", "kulog", "bagyo", "klima", "hangganan", "kapuluan", "bansa", "lungsod", "baryo", "daan",
      "agham", "enerhiya", "grabidad", "oxygen", "carbon", "mineral", "kristal", "fossil", "habitat", "uri",
      "satellite", "atmospera", "molekula", "elemento", "nucleus", "electron", "liwanag", "tunog", "init", "presyon",
    ],
    hard: [
      "potosintesis", "konstelasyon", "hemisphere", "ekwador", "longhitud", "latitud", "tektoniko", "sediment",
      "metamorphosis", "biodiversity", "ekosistema", "chromosome", "mitochondria", "ebaporasyon", "kondensasyon",
      "fluorescence", "infrared", "ultraviolet", "akselerasyon", "momentum", "belosidad", "trajectory", "hypothesis",
      "eksperimento", "obserbasyon", "mikroskopiko", "makroskopiko", "sirkumperensiya", "perpendikular", "gravitasyon",
    ],
  },
};

function normalizeLanguage(value) {
  const l = String(value || "en").toLowerCase();
  if (l === "fil" || l === "tagalog" || l === "filipino") return "tl";
  if (l === "english") return "en";
  return LANGUAGES.includes(l) ? l : "en";
}

function normalizeDifficulty(value) {
  const d = String(value || "normal").toLowerCase();
  return DIFFICULTIES.includes(d) ? d : "normal";
}

function normalizeMode(value) {
  const m = String(value || "classic").toLowerCase().replace(/\s+/g, "_");
  if (m === "bo3" || m === "bestof3") return "best_of_3";
  if (m === "60" || m === "timed60" || m === "time") return "timed";
  if (m === "sd" || m === "sudden" || m === "death") return "sudden_death";
  if (m === "ghost_race" || m === "handicap") return "ghost";
  if (m === "2v2" || m === "teams" || m === "team_mode") return "team";
  if (m === "word" || m === "word_mode" || m === "random_words") return "words";
  return MODES[m] ? m : "classic";
}

function normalizeTypingText(text) {
  return String(text || "")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212\uFE58\uFE63\uFF0D]/g, "-")
    .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/\u200B/g, "");
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const MIN_PARAGRAPHS = 1;
const MAX_PARAGRAPHS = 5;

function normalizeParagraphs(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(MAX_PARAGRAPHS, Math.max(MIN_PARAGRAPHS, n));
}

function normalizeCategory(value) {
  const c = String(value || "all").toLowerCase();
  if (c === "sci" || c === "general") return "science";
  if (c === "phil" || c === "philippines" || c === "pinoy") return "ph";
  if (c === "animal") return "animals";
  return CATEGORY_IDS.includes(c) ? c : "all";
}

function getPassagePool(difficulty, language, category) {
  const d = normalizeDifficulty(difficulty);
  const lang = normalizeLanguage(language);
  const cat = normalizeCategory(category);
  if (cat === "all") {
    return PASSAGES[lang][d];
  }
  const pack = CATEGORY_PASSAGES[lang] && CATEGORY_PASSAGES[lang][cat];
  if (pack && pack[d] && pack[d].length) return pack[d];
  // fallback: any difficulty in that category, then all facts
  if (pack) {
    const merged = [...(pack.easy || []), ...(pack.normal || []), ...(pack.hard || [])];
    if (merged.length) return merged;
  }
  return PASSAGES[lang][d];
}

function pickPassage(difficulty, language, category) {
  return pickPassages(difficulty, language, 1, category);
}

/**
 * Pick N random paragraphs (unique when pool allows) and join for one race text.
 */
function pickPassages(difficulty, language, paragraphCount, category) {
  const count = normalizeParagraphs(paragraphCount);
  const pool = getPassagePool(difficulty, language, category);
  const parts = [];
  const used = new Set();

  for (let i = 0; i < count; i++) {
    if (used.size >= pool.length) {
      parts.push(randomFrom(pool));
      continue;
    }
    let idx = Math.floor(Math.random() * pool.length);
    let guard = 0;
    while (used.has(idx) && guard < 40) {
      idx = Math.floor(Math.random() * pool.length);
      guard++;
    }
    used.add(idx);
    parts.push(pool[idx]);
  }

  return normalizeTypingText(parts.join(" "));
}

/**
 * Timed mode: use selected paragraph count, but ensure enough text for 60s.
 * Minimum ~480 chars by adding extra paragraphs if needed.
 */
function pickTimedPassage(difficulty, language, paragraphCount, category) {
  const count = normalizeParagraphs(paragraphCount);
  let text = pickPassages(difficulty, language, count, category);
  const pool = getPassagePool(difficulty, language, category);
  const parts = [text];
  while (parts.join(" ").length < 480) {
    parts.push(randomFrom(pool));
  }
  return normalizeTypingText(parts.join(" "));
}

/**
 * Word mode: random words. Paragraphs 1–5 maps to ~25–125 words.
 */
function pickWords(difficulty, language, paragraphCount) {
  const d = normalizeDifficulty(difficulty);
  const lang = normalizeLanguage(language);
  const packs = normalizeParagraphs(paragraphCount);
  const wordCount = packs * 25;
  const pool = WORDS[lang][d];
  const out = [];
  for (let i = 0; i < wordCount; i++) {
    out.push(randomFrom(pool));
  }
  return normalizeTypingText(out.join(" "));
}

/** Unified race text picker for all modes. */
function pickRaceText(mode, difficulty, language, paragraphCount, category) {
  const m = normalizeMode(mode);
  if (m === "words") return pickWords(difficulty, language, paragraphCount);
  if (m === "timed") return pickTimedPassage(difficulty, language, paragraphCount, category);
  return pickPassages(difficulty, language, paragraphCount, category);
}

function listCategories() {
  return CATEGORY_IDS.map((id) => ({
    id,
    label: CATEGORIES[id].label,
    short: CATEGORIES[id].short,
  }));
}

function listDifficulties() {
  return DIFFICULTIES.map((id) => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
  }));
}

function listLanguages() {
  return LANGUAGES.map((id) => ({
    id,
    label: LANG_LABELS[id] || id,
  }));
}

function listModes() {
  return Object.values(MODES);
}

module.exports = {
  PASSAGES,
  CATEGORY_PASSAGES,
  WORDS,
  LANGUAGES,
  DIFFICULTIES,
  LANG_LABELS,
  CATEGORIES,
  CATEGORY_IDS,
  MODES,
  MIN_PARAGRAPHS,
  MAX_PARAGRAPHS,
  normalizeLanguage,
  normalizeDifficulty,
  normalizeMode,
  normalizeParagraphs,
  normalizeCategory,
  normalizeTypingText,
  pickPassage,
  pickPassages,
  pickTimedPassage,
  pickWords,
  pickRaceText,
  listDifficulties,
  listLanguages,
  listModes,
  listCategories,
};
