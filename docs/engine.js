/* Deterministic daily Blue Jays badness engine (browser). */

const BLUE_JAYS = {
  id: "tor",
  name: "Toronto Blue Jays",
  short: "Blue Jays",
  abbr: "TOR",
  city: "Toronto",
  league: "AL",
  division: "East",
  color: "#134A8E",
};

const OTHER_TEAMS = [
  { id: "bal", name: "Baltimore Orioles", short: "Orioles", abbr: "BAL", city: "Baltimore", league: "AL", division: "East", color: "#DF4601" },
  { id: "bos", name: "Boston Red Sox", short: "Red Sox", abbr: "BOS", city: "Boston", league: "AL", division: "East", color: "#BD3039" },
  { id: "nyy", name: "New York Yankees", short: "Yankees", abbr: "NYY", city: "New York", league: "AL", division: "East", color: "#0C2340" },
  { id: "tb", name: "Tampa Bay Rays", short: "Rays", abbr: "TB", city: "Tampa Bay", league: "AL", division: "East", color: "#092C5C" },
  { id: "cws", name: "Chicago White Sox", short: "White Sox", abbr: "CWS", city: "Chicago", league: "AL", division: "Central", color: "#27251F" },
  { id: "cle", name: "Cleveland Guardians", short: "Guardians", abbr: "CLE", city: "Cleveland", league: "AL", division: "Central", color: "#00385D" },
  { id: "det", name: "Detroit Tigers", short: "Tigers", abbr: "DET", city: "Detroit", league: "AL", division: "Central", color: "#0C2340" },
  { id: "kc", name: "Kansas City Royals", short: "Royals", abbr: "KC", city: "Kansas City", league: "AL", division: "Central", color: "#004687" },
  { id: "min", name: "Minnesota Twins", short: "Twins", abbr: "MIN", city: "Minnesota", league: "AL", division: "Central", color: "#002B5C" },
  { id: "hou", name: "Houston Astros", short: "Astros", abbr: "HOU", city: "Houston", league: "AL", division: "West", color: "#002D62" },
  { id: "laa", name: "Los Angeles Angels", short: "Angels", abbr: "LAA", city: "Los Angeles", league: "AL", division: "West", color: "#BA0021" },
  { id: "ath", name: "Athletics", short: "Athletics", abbr: "ATH", city: "Sacramento", league: "AL", division: "West", color: "#003831" },
  { id: "sea", name: "Seattle Mariners", short: "Mariners", abbr: "SEA", city: "Seattle", league: "AL", division: "West", color: "#0C2C56" },
  { id: "tex", name: "Texas Rangers", short: "Rangers", abbr: "TEX", city: "Texas", league: "AL", division: "West", color: "#003278" },
  { id: "atl", name: "Atlanta Braves", short: "Braves", abbr: "ATL", city: "Atlanta", league: "NL", division: "East", color: "#CE1141" },
  { id: "mia", name: "Miami Marlins", short: "Marlins", abbr: "MIA", city: "Miami", league: "NL", division: "East", color: "#00A3E0" },
  { id: "nym", name: "New York Mets", short: "Mets", abbr: "NYM", city: "New York", league: "NL", division: "East", color: "#002D72" },
  { id: "phi", name: "Philadelphia Phillies", short: "Phillies", abbr: "PHI", city: "Philadelphia", league: "NL", division: "East", color: "#E81828" },
  { id: "wsh", name: "Washington Nationals", short: "Nationals", abbr: "WSH", city: "Washington", league: "NL", division: "East", color: "#AB0003" },
  { id: "chc", name: "Chicago Cubs", short: "Cubs", abbr: "CHC", city: "Chicago", league: "NL", division: "Central", color: "#0E3386" },
  { id: "cin", name: "Cincinnati Reds", short: "Reds", abbr: "CIN", city: "Cincinnati", league: "NL", division: "Central", color: "#C6011F" },
  { id: "mil", name: "Milwaukee Brewers", short: "Brewers", abbr: "MIL", city: "Milwaukee", league: "NL", division: "Central", color: "#12284B" },
  { id: "pit", name: "Pittsburgh Pirates", short: "Pirates", abbr: "PIT", city: "Pittsburgh", league: "NL", division: "Central", color: "#27251F" },
  { id: "stl", name: "St. Louis Cardinals", short: "Cardinals", abbr: "STL", city: "St. Louis", league: "NL", division: "Central", color: "#C41E3A" },
  { id: "az", name: "Arizona Diamondbacks", short: "D-backs", abbr: "AZ", city: "Arizona", league: "NL", division: "West", color: "#A71930" },
  { id: "col", name: "Colorado Rockies", short: "Rockies", abbr: "COL", city: "Colorado", league: "NL", division: "West", color: "#33006F" },
  { id: "lad", name: "Los Angeles Dodgers", short: "Dodgers", abbr: "LAD", city: "Los Angeles", league: "NL", division: "West", color: "#005A9C" },
  { id: "sd", name: "San Diego Padres", short: "Padres", abbr: "SD", city: "San Diego", league: "NL", division: "West", color: "#2F241D" },
  { id: "sf", name: "San Francisco Giants", short: "Giants", abbr: "SF", city: "San Francisco", league: "NL", division: "West", color: "#FD5A1E" },
];

const COMPARE_TEMPLATES = [
  "The {team} at least look like they know what an outfield is. The Blue Jays today? Absolute chaos in navy and red.",
  "Somehow the Blue Jays are making the {team} look like a dynasty. Sit with that.",
  "Fans of the {team} get bad nights. Blue Jays fans get existential philosophy papers.",
  "If the {team} are having a rough stretch, the Blue Jays are having a rough decade — compressed into one afternoon.",
  "The {team} can still say 'wait till next year' with a straight face. Blue Jays fans are negotiating with next decade.",
  "Compared to Toronto right now, the {team} feel like a well-run Fortune 500 company.",
  "Even a {team} fan would look at the Jays today and whisper: 'yikes, buddy.'",
  "The {team} lose games. The Blue Jays invent new ways to lose games and file patents.",
  "Blue Jays baseball today makes a quiet night in {city} feel like a World Series parade.",
  "Relative to the {team}, Toronto's vibes are sitting somewhere between 'haunted stadium' and 'group project with no leader.'",
  "The {team} have bad innings. The Blue Jays have bad innings that become folklore.",
  "If baseball is theater, the {team} are drama. The Blue Jays are experimental absurdist performance art.",
  "At least {team} fans can point to a plan. Blue Jays fans are pointing at a weather map of despair.",
  "The {team} might be mid. The Blue Jays today are mid-but-somehow-worse, which is a special skill.",
  "Watching the Jays next to the {team} is like comparing a flat tire to a car that never had wheels.",
];

const MOOD_LABELS = {
  1: "Actually fine?",
  2: "Mildly annoyed",
  3: "Classic Jays",
  4: "Sighing in Rogers Centre",
  5: "Moderately cooked",
  6: "Pretty bad, honestly",
  7: "Spiritually unwell",
  8: "This is a crisis",
  9: "Call the hotline",
  10: "Existential collapse",
};

const HEADLINES = [
  "Blue Jays Badness Index: still undefeated at being defeated",
  "Today's official finding: the Jays remain scientifically bad",
  "Breaking: every other MLB team is having a better vibes day",
  "Rogers Centre weather report: 100% chance of pain",
  "Daily confirmation: yes, it's still that kind of Blue Jays day",
  "Scientists measure Jays misery. Results: yes.",
  "The Badness Index has entered the chat — and it's wearing a jay hat",
  "Another day, another 29 teams looking relatively competent",
];

const NICKNAMES = [
  "Sad in Scarborough",
  "Rogers Row F",
  "Carlos the Pessimist",
  "Vladdy Tears",
  "Batter's Box Blues",
  "North of Despair",
  "7th Inning Stretch",
  "Foul Pole Phil",
  "Cito's Ghost",
  "Dome Dweller",
  "Ace of Spades?",
  "Trade Deadline Ted",
  "Walk-Off Waiter",
  "Bullpen Prayers",
  "Maple Leaf Adjacent",
];

/** Mulberry32 seeded PRNG */
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function hashSeed(str) {
  const data = new TextEncoder().encode(str);
  const buf = await crypto.subtle.digest("SHA-256", data);
  const view = new DataView(buf);
  return view.getUint32(0);
}

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso, delta) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekday(iso) {
  return new Date(iso + "T12:00:00").getDay(); // 0 Sun
}

function verdict(gap) {
  if (gap >= 5) return "Catastrophically worse";
  if (gap >= 3.5) return "Meaningfully worse";
  if (gap >= 2) return "Clearly worse";
  if (gap >= 1) return "Slightly worse";
  return "Basically tied (still bad)";
}

async function rngFor(day, salt = "") {
  const seed = await hashSeed(`${day}:${salt}`);
  const rand = mulberry32(seed);
  return {
    random: rand,
    uniform(min, max) {
      return min + rand() * (max - min);
    },
    choice(arr) {
      return arr[Math.floor(rand() * arr.length)];
    },
    int(min, max) {
      return Math.floor(min + rand() * (max - min + 1));
    },
  };
}

async function dailyBadnessScore(day) {
  const rng = await rngFor(day, "badness");
  // JS getDay: 0=Sun … match Python Mon=0-ish with map on ISO weekday
  const jsDay = weekday(day); // 0 Sun
  // Python weekday: Mon=0 … Sun=6
  const pyWeekday = (jsDay + 6) % 7;
  const bump = { 0: 0.5, 1: 0.25, 2: 0.1, 3: 0.0, 4: -0.15, 5: -0.1, 6: 0.15 }[pyWeekday] || 0;
  const base = rng.uniform(5.8, 9.2) + bump;
  return Math.round(Math.min(9.8, Math.max(5.5, base)) * 10) / 10;
}

async function buildComparisons(day) {
  const jaysScore = await dailyBadnessScore(day);
  const comparisons = [];
  for (const team of OTHER_TEAMS) {
    const tRng = await rngFor(day, team.id);
    const other = Math.round(tRng.uniform(1.5, Math.max(2.0, jaysScore - 0.8)) * 10) / 10;
    const gap = Math.round((jaysScore - other) * 10) / 10;
    const template = tRng.choice(COMPARE_TEMPLATES);
    const blurb = template
      .replaceAll("{team}", team.short)
      .replaceAll("{city}", team.city);
    comparisons.push({
      team,
      jays_badness: jaysScore,
      their_badness: other,
      gap,
      blurb,
      verdict: verdict(gap),
    });
  }
  comparisons.sort((a, b) => b.gap - a.gap);
  return comparisons;
}

async function dailyPayload(day = todayIso()) {
  const score = await dailyBadnessScore(day);
  const rng = await rngFor(day, "headline");
  const headline = rng.choice(HEADLINES);
  const comparisons = await buildComparisons(day);
  const avgGap =
    Math.round(
      (comparisons.reduce((s, c) => s + c.gap, 0) / comparisons.length) * 100
    ) / 100;
  const worst = comparisons[0];
  const closest = comparisons[comparisons.length - 1];
  return {
    date: day,
    headline,
    official_badness: score,
    mood_label: MOOD_LABELS[Math.round(score)] || "Bad",
    blue_jays: BLUE_JAYS,
    comparisons,
    summary: {
      teams_compared: comparisons.length,
      avg_gap: avgGap,
      worst_matchup: { team: worst.team.short, gap: worst.gap },
      closest_matchup: { team: closest.team.short, gap: closest.gap },
    },
    mood_labels: MOOD_LABELS,
  };
}

/* ---- local rating store (free, no server) ---- */

const STORE_KEY = "jays-badness-ratings-v1";

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function ensureSeeded(store) {
  if (store._seeded) return store;
  const today = todayIso();
  // Deterministic-ish seed so charts aren't empty on first visit
  for (let offset = 30; offset >= 1; offset--) {
    const day = addDays(today, -offset);
    const n = 8 + ((offset * 7) % 18);
    const ratings = [];
    for (let i = 0; i < n; i++) {
      // Cluster around a fake official score from day string
      let h = 0;
      for (let c = 0; c < day.length; c++) h = (h * 31 + day.charCodeAt(c)) >>> 0;
      const base = 5.5 + (h % 40) / 10;
      const rating = Math.max(1, Math.min(10, Math.round(base + ((i * 3) % 5) - 2)));
      ratings.push({
        rating,
        nickname: NICKNAMES[(h + i) % NICKNAMES.length],
        note: i % 5 === 0 ? "This is fine." : "",
        created_at: new Date(day + "T18:00:00Z").toISOString(),
        seed: true,
      });
    }
    store[day] = ratings;
  }
  store._seeded = true;
  saveStore(store);
  return store;
}

function upsertLocalRating({ day, rating, nickname, note, voterKey }) {
  const store = ensureSeeded(loadStore());
  const list = store[day] || [];
  const idx = list.findIndex((r) => r.voter_key === voterKey);
  const row = {
    rating,
    nickname: nickname || "Anonymous",
    note: note || "",
    voter_key: voterKey,
    created_at: new Date().toISOString(),
    seed: false,
  };
  if (idx >= 0) list[idx] = row;
  else list.push(row);
  store[day] = list;
  saveStore(store);
  return row;
}

function dayStats(day) {
  const store = ensureSeeded(loadStore());
  const list = store[day] || [];
  const ratings = list.map((r) => r.rating);
  const distribution = {};
  for (let i = 1; i <= 10; i++) distribution[String(i)] = 0;
  for (const r of ratings) distribution[String(r)] += 1;
  const avg =
    ratings.length === 0
      ? null
      : Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) /
        100;
  const recent = [...list]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 25)
    .map(({ nickname, rating, note, created_at }) => ({
      nickname,
      rating,
      note,
      created_at,
    }));
  return { date: day, count: ratings.length, average: avg, distribution, recent };
}

function history(days = 90) {
  const store = ensureSeeded(loadStore());
  const keys = Object.keys(store)
    .filter((k) => k !== "_seeded" && /^\d{4}-\d{2}-\d{2}$/.test(k))
    .sort();
  const slice = keys.slice(-days);
  return slice.map((day) => {
    const list = store[day] || [];
    const ratings = list.map((r) => r.rating);
    const average =
      ratings.length === 0
        ? null
        : Math.round(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100
          ) / 100;
    return {
      day,
      count: ratings.length,
      average,
      min_rating: ratings.length ? Math.min(...ratings) : null,
      max_rating: ratings.length ? Math.max(...ratings) : null,
    };
  });
}

function allTimeStats() {
  const store = ensureSeeded(loadStore());
  let total = 0;
  let sum = 0;
  let worst = null;
  let best = null;
  for (const [day, list] of Object.entries(store)) {
    if (day === "_seeded" || !Array.isArray(list) || !list.length) continue;
    const ratings = list.map((r) => r.rating);
    total += ratings.length;
    sum += ratings.reduce((a, b) => a + b, 0);
    const average =
      Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) /
      100;
    const row = { day, average, count: ratings.length };
    if (!worst || average > worst.average) worst = row;
    if (!best || average < best.average) best = row;
  }
  return {
    total_ratings: total,
    overall_average: total ? Math.round((sum / total) * 100) / 100 : null,
    worst_day: worst,
    best_day: best,
  };
}
