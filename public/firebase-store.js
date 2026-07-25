/* Shared ratings via Firebase Firestore */

let db = null;
let firebaseReady = false;
let firebaseError = null;

function initFirebase() {
  if (!FIREBASE_CONFIGURED) {
    firebaseError =
      "Firebase not configured yet. Paste your config into firebase-config.js";
    console.warn(firebaseError);
    return false;
  }
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    firebaseReady = true;
    return true;
  } catch (err) {
    firebaseError = err.message || String(err);
    console.error("Firebase init failed:", err);
    return false;
  }
}

function ratingDocId(day, voterKey) {
  // Firestore doc ids cannot contain some chars; sanitize voter key
  const safe = String(voterKey).replace(/[/\\]/g, "_").slice(0, 80);
  return `${day}__${safe}`;
}

async function upsertRating({ day, rating, nickname, note, voterKey }) {
  if (!firebaseReady) throw new Error(firebaseError || "Firebase not ready");
  if (!day || !voterKey) throw new Error("Missing day or voter key");
  const n = Number(rating);
  if (!Number.isInteger(n) || n < 1 || n > 10) {
    throw new Error("Rating must be an integer 1–10");
  }

  const id = ratingDocId(day, voterKey);
  const row = {
    day,
    rating: n,
    nickname: (nickname || "Anonymous").trim().slice(0, 40) || "Anonymous",
    note: (note || "").trim().slice(0, 280),
    voter_key: voterKey,
    created_at: firebase.firestore.FieldValue.serverTimestamp(),
    updated_at: firebase.firestore.FieldValue.serverTimestamp(),
    client_created_at: new Date().toISOString(),
  };

  await db.collection("ratings").doc(id).set(row, { merge: true });
  return {
    ...row,
    created_at: row.client_created_at,
  };
}

function docToRating(doc) {
  const d = doc.data() || {};
  let created = d.client_created_at || null;
  if (!created && d.created_at && typeof d.created_at.toDate === "function") {
    created = d.created_at.toDate().toISOString();
  }
  return {
    id: doc.id,
    day: d.day,
    rating: d.rating,
    nickname: d.nickname || "Anonymous",
    note: d.note || "",
    voter_key: d.voter_key,
    created_at: created,
  };
}

async function fetchAllRatings() {
  if (!firebaseReady) throw new Error(firebaseError || "Firebase not ready");
  const snap = await db.collection("ratings").get();
  return snap.docs.map(docToRating).filter((r) => r.day && r.rating != null);
}

function computeDayStats(all, day) {
  const list = all.filter((r) => r.day === day);
  const ratings = list.map((r) => r.rating);
  const distribution = {};
  for (let i = 1; i <= 10; i++) distribution[String(i)] = 0;
  for (const r of ratings) {
    const k = String(r);
    if (distribution[k] != null) distribution[k] += 1;
  }
  const avg =
    ratings.length === 0
      ? null
      : Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) /
        100;
  const recent = [...list]
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 25)
    .map(({ nickname, rating, note, created_at }) => ({
      nickname,
      rating,
      note,
      created_at,
    }));
  return {
    date: day,
    count: ratings.length,
    average: avg,
    distribution,
    recent,
  };
}

function computeHistory(all, days = 90) {
  const byDay = {};
  for (const r of all) {
    if (!r.day) continue;
    if (!byDay[r.day]) byDay[r.day] = [];
    byDay[r.day].push(r.rating);
  }
  const keys = Object.keys(byDay).sort();
  const slice = keys.slice(-days);
  return slice.map((day) => {
    const ratings = byDay[day];
    const average =
      Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) /
      100;
    return {
      day,
      count: ratings.length,
      average,
      min_rating: Math.min(...ratings),
      max_rating: Math.max(...ratings),
    };
  });
}

function computeAllTime(all) {
  if (!all.length) {
    return {
      total_ratings: 0,
      overall_average: null,
      worst_day: null,
      best_day: null,
    };
  }
  const hist = computeHistory(all, 3650);
  let sum = 0;
  for (const r of all) sum += r.rating;
  let worst = null;
  let best = null;
  for (const h of hist) {
    if (!worst || h.average > worst.average) worst = h;
    if (!best || h.average < best.average) best = h;
  }
  return {
    total_ratings: all.length,
    overall_average: Math.round((sum / all.length) * 100) / 100,
    worst_day: worst
      ? { day: worst.day, average: worst.average, count: worst.count }
      : null,
    best_day: best
      ? { day: best.day, average: best.average, count: best.count }
      : null,
  };
}

/**
 * Live listener — calls onData(allRatings) whenever anything changes.
 * Returns unsubscribe function.
 */
function subscribeRatings(onData, onError) {
  if (!firebaseReady) {
    if (onError) onError(new Error(firebaseError || "Firebase not ready"));
    return () => {};
  }
  return db.collection("ratings").onSnapshot(
    (snap) => {
      const all = snap.docs.map(docToRating).filter((r) => r.day && r.rating != null);
      onData(all);
    },
    (err) => {
      console.error("Firestore listener error:", err);
      if (onError) onError(err);
    }
  );
}
