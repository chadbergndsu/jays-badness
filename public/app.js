/* MLB Daily Badness Index — multi-team + Firebase shared ratings */

const FACES = ["😌", "😐", "😕", "😟", "😣", "😫", "😩", "🤯", "💀", "☠️"];

let state = {
  view: "hub", // "hub" | "team"
  teamId: null,
  focus: null,
  day: null,
  moodLabels: null,
  comparisons: [],
  filter: "all",
  hubFilter: "all",
  charts: { history: null, dist: null, volume: null },
  allRatings: [],
  unsub: null,
  eventsWired: false,
};

function $(id) {
  return document.getElementById(id);
}

function voterKey() {
  const key = "jays-badness-voter";
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID
      ? crypto.randomUUID()
      : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, v);
  }
  return v;
}

function formatDay(iso) {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function shortDay(iso) {
  try {
    const d = new Date(iso + "T12:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function scoreColor(score) {
  if (score >= 8) return "#e31937";
  if (score >= 6) return "#d97706";
  if (score >= 4) return state.focus?.color || "#134a8e";
  return "#0f766e";
}

function hexToRgb(hex) {
  const h = (hex || "#134A8E").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function applyTeamTheme(focus) {
  const root = document.documentElement;
  const primary = focus.color || "#134A8E";
  const accent = focus.accent || "#E31937";
  const { r, g, b } = hexToRgb(primary);
  root.style.setProperty("--navy", shadeHex(primary, -35));
  root.style.setProperty("--navy-2", primary);
  root.style.setProperty("--navy-3", shadeHex(primary, 20));
  root.style.setProperty("--red", accent);
  root.style.setProperty("--red-soft", shadeHex(accent, 25));
  root.style.setProperty("--team-primary", primary);
  root.style.setProperty("--team-accent", accent);
  root.style.setProperty(
    "--team-glow",
    `rgba(${r}, ${g}, ${b}, 0.28)`
  );
}

function shadeHex(hex, amount) {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (v) => Math.max(0, Math.min(255, v + amount));
  const to = (v) => clamp(v).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function parseRoute() {
  const params = new URLSearchParams(window.location.search);
  let team = (params.get("team") || "").toLowerCase().trim();
  if (!team && window.location.hash) {
    const h = window.location.hash.replace(/^#\/?/, "").toLowerCase();
    if (TEAMS_BY_ID[h]) team = h;
  }
  if (team && TEAMS_BY_ID[team]) {
    return { view: "team", teamId: team };
  }
  return { view: "hub", teamId: null };
}

function setMeter(score) {
  const circ = 2 * Math.PI * 52;
  const pct = Math.min(10, Math.max(0, score)) / 10;
  const fg = $("ringFg");
  if (!fg) return;
  fg.style.strokeDasharray = String(circ);
  fg.style.strokeDashoffset = String(circ * (1 - pct));
  fg.style.stroke = scoreColor(score);
  $("meterScore").textContent = score.toFixed(1);
  $("officialScore").textContent = score.toFixed(1);
}

function updateSliderUI() {
  const slider = $("ratingSlider");
  if (!slider) return;
  const val = Number(slider.value);
  const labels = state.moodLabels || moodLabelsFor(state.focus || BLUE_JAYS);
  $("liveRatingLabel").textContent = `${val} · ${labels[val] || ""}`;
  $("ratingFaces").innerHTML = FACES.map((f, i) => {
    const on = i + 1 === val ? "1" : "0.35";
    return `<span style="opacity:${on};transform:scale(${i + 1 === val ? 1.25 : 1});display:inline-block">${f}</span>`;
  }).join("");
}

function setFirebaseBanner(msg, kind) {
  const el = $("firebaseStatus");
  if (!el) return;
  el.hidden = !msg;
  el.textContent = msg || "";
  el.className = "firebase-status" + (kind ? ` ${kind}` : "");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ---------- Hub ---------- */

function renderHub() {
  $("hubView").hidden = false;
  $("teamView").hidden = true;
  document.body.classList.remove("team-mode");
  document.body.classList.add("hub-mode");
  document.title = "MLB Daily Badness Index";
  applyTeamTheme({ color: "#134A8E", accent: "#E31937" });

  $("hubDate").textContent = formatDay(todayIso());

  const f = state.hubFilter;
  const list = ALL_TEAMS.filter((t) => {
    if (f === "all") return true;
    if (f === "AL" || f === "NL") return t.league === f;
    return t.division === f;
  });

  // Group by league/division for nicer layout
  const groups = [
    { key: "AL East", match: (t) => t.league === "AL" && t.division === "East" },
    { key: "AL Central", match: (t) => t.league === "AL" && t.division === "Central" },
    { key: "AL West", match: (t) => t.league === "AL" && t.division === "West" },
    { key: "NL East", match: (t) => t.league === "NL" && t.division === "East" },
    { key: "NL Central", match: (t) => t.league === "NL" && t.division === "Central" },
    { key: "NL West", match: (t) => t.league === "NL" && t.division === "West" },
  ];

  const picker = $("teamPicker");
  picker.innerHTML = groups
    .map((g) => {
      const teams = list.filter(g.match);
      if (!teams.length) return "";
      return `
        <section class="hub-division">
          <h3>${escapeHtml(g.key)}</h3>
          <div class="hub-grid">
            ${teams
              .map(
                (t) => `
              <button type="button" class="team-tile" data-team="${escapeHtml(t.id)}" style="--tile-color:${escapeHtml(t.color)};--tile-accent:${escapeHtml(t.accent)}">
                <span class="tile-emoji" aria-hidden="true">${t.emoji}</span>
                <span class="tile-abbr">${escapeHtml(t.abbr)}</span>
                <span class="tile-name">${escapeHtml(t.short)}</span>
                <span class="tile-city">${escapeHtml(t.city)}</span>
              </button>`
              )
              .join("")}
          </div>
        </section>`;
    })
    .join("");

  picker.querySelectorAll(".team-tile").forEach((btn) => {
    btn.addEventListener("click", () => navigateToTeam(btn.dataset.team));
  });
}

/* ---------- Team page ---------- */

function fillTeamSelect() {
  const sel = $("teamSelect");
  if (!sel || sel.options.length) return;
  const byDiv = [
    ["AL East", (t) => t.league === "AL" && t.division === "East"],
    ["AL Central", (t) => t.league === "AL" && t.division === "Central"],
    ["AL West", (t) => t.league === "AL" && t.division === "West"],
    ["NL East", (t) => t.league === "NL" && t.division === "East"],
    ["NL Central", (t) => t.league === "NL" && t.division === "Central"],
    ["NL West", (t) => t.league === "NL" && t.division === "West"],
  ];
  for (const [label, match] of byDiv) {
    const og = document.createElement("optgroup");
    og.label = label;
    ALL_TEAMS.filter(match).forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.abbr} — ${t.name}`;
      og.appendChild(opt);
    });
    sel.appendChild(og);
  }
}

function renderCommunity(community) {
  if (!community) return;
  $("votesToday").textContent = String(community.count ?? 0);
  $("communityAvg").textContent =
    community.average != null ? Number(community.average).toFixed(2) : "—";
  renderFeed(community.recent || []);
}

function renderFeed(recent) {
  const el = $("feedList");
  if (!el) return;
  if (!recent.length) {
    el.innerHTML =
      '<div class="feed-empty">No ratings yet today. Be the first to suffer out loud.</div>';
    return;
  }
  const labels = state.moodLabels || {};
  el.innerHTML = recent
    .map((r) => {
      const high = r.rating >= 8 ? " high" : "";
      const note = r.note
        ? `<p class="feed-note">${escapeHtml(r.note)}</p>`
        : `<p class="feed-note">${escapeHtml(labels[r.rating] || "")}</p>`;
      const t = r.created_at
        ? new Date(r.created_at).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })
        : "";
      return `
        <article class="feed-item">
          <div class="feed-score${high}">${r.rating}</div>
          <div>
            <p class="feed-name">${escapeHtml(r.nickname || "Anonymous")}</p>
            ${note}
          </div>
          <div class="feed-time">${escapeHtml(t)}</div>
        </article>`;
    })
    .join("");
}

function renderComparisons() {
  const grid = $("compareGrid");
  if (!grid) return;
  const f = state.filter;
  const focus = state.focus;
  const list = state.comparisons.filter((c) => {
    const t = c.team;
    if (f === "all") return true;
    if (f === "AL" || f === "NL") return t.league === f;
    return t.division === f;
  });

  const focusAbbr = focus?.abbr || "???";
  const focusScoreKey = (c) => c.focus_badness ?? c.jays_badness;

  grid.innerHTML = list
    .map((c) => {
      const t = c.team;
      const fb = focusScoreKey(c);
      const jPct = Math.min(100, (fb / 10) * 100);
      const tPct = Math.min(100, (c.their_badness / 10) * 100);
      return `
        <article class="card compare-card" style="--team-color:${t.color}">
          <div class="compare-top">
            <div>
              <h4 class="team-name">${escapeHtml(t.short)}</h4>
              <p class="team-meta">${escapeHtml(t.abbr)} · ${escapeHtml(
        t.league
      )} ${escapeHtml(t.division)}</p>
            </div>
            <span class="gap-badge">+${c.gap} gap</span>
          </div>
          <span class="verdict">${escapeHtml(c.verdict)}</span>
          <div class="bars">
            <div class="bar-row">
              <span>${escapeHtml(focusAbbr)}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${jPct}%"></div></div>
              <span class="bar-val">${fb}</span>
            </div>
            <div class="bar-row">
              <span>${escapeHtml(t.abbr)}</span>
              <div class="bar-track"><div class="bar-fill them" style="width:${tPct}%"></div></div>
              <span class="bar-val">${c.their_badness}</span>
            </div>
          </div>
          <p class="blurb">${escapeHtml(c.blurb)}</p>
        </article>`;
    })
    .join("");

  requestAnimationFrame(() => {
    grid.querySelectorAll(".bar-fill").forEach((el) => {
      const w = el.style.width;
      el.style.width = "0";
      requestAnimationFrame(() => {
        el.style.width = w;
      });
    });
  });
}

function chartDefaults() {
  if (typeof Chart === "undefined") return;
  Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
  Chart.defaults.color = "#6b778c";
}

function destroyChart(key) {
  if (state.charts[key]) {
    state.charts[key].destroy();
    state.charts[key] = null;
  }
}

function destroyAllCharts() {
  destroyChart("history");
  destroyChart("dist");
  destroyChart("volume");
}

function themeColors() {
  const primary = state.focus?.color || "#134a8e";
  const accent = state.focus?.accent || "#e31937";
  return { primary, accent };
}

function renderHistoryChart(hist) {
  destroyChart("history");
  if (typeof Chart === "undefined" || !$("historyChart")) return;
  const { primary, accent } = themeColors();
  const labels = hist.map((h) => shortDay(h.day));
  const avgs = hist.map((h) => h.average);
  state.charts.history = new Chart($("historyChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Avg badness",
          data: avgs,
          borderColor: accent,
          backgroundColor: accent + "1f",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: primary,
          borderWidth: 2.5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 1,
          max: 10,
          grid: { color: "rgba(19,74,142,0.08)" },
          title: { display: true, text: "Badness (1–10)" },
        },
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkipPadding: 8 },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel(ctx) {
              const row = hist[ctx.dataIndex];
              return row ? `${row.count} votes` : "";
            },
          },
        },
      },
    },
  });
}

function renderDistChart(distribution) {
  destroyChart("dist");
  if (typeof Chart === "undefined" || !$("distChart")) return;
  const labels = Object.keys(distribution);
  const values = labels.map((k) => distribution[k]);
  const colors = labels.map((k) => scoreColor(Number(k)));
  state.charts.dist = new Chart($("distChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Votes",
          data: values,
          backgroundColor: colors.map((c) => c + "cc"),
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: "rgba(19,74,142,0.08)" },
        },
        x: {
          title: { display: true, text: "Rating" },
          grid: { display: false },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

function renderVolumeChart(hist) {
  destroyChart("volume");
  if (typeof Chart === "undefined" || !$("volumeChart")) return;
  const { primary } = themeColors();
  state.charts.volume = new Chart($("volumeChart"), {
    type: "bar",
    data: {
      labels: hist.map((h) => shortDay(h.day)),
      datasets: [
        {
          label: "Votes",
          data: hist.map((h) => h.count),
          backgroundColor: primary + "bf",
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          grid: { color: "rgba(19,74,142,0.08)" },
        },
        x: {
          grid: { display: false },
          ticks: { maxRotation: 0, autoSkipPadding: 8 },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

function renderAllTime(allTime) {
  $("atTotal").textContent = allTime.total_ratings ?? 0;
  $("atAvg").textContent =
    allTime.overall_average != null
      ? Number(allTime.overall_average).toFixed(2)
      : "—";
  if (allTime.worst_day) {
    $("atWorst").textContent = `${shortDay(allTime.worst_day.day)} · ${
      allTime.worst_day.average
    }`;
  } else {
    $("atWorst").textContent = "—";
  }
  if (allTime.best_day) {
    $("atBest").textContent = `${shortDay(allTime.best_day.day)} · ${
      allTime.best_day.average
    }`;
  } else {
    $("atBest").textContent = "—";
  }
}

function applyRatingsData(all) {
  state.allRatings = all || [];
  if (!state.day || state.view !== "team") return;
  chartDefaults();
  const hist = computeHistory(state.allRatings, 90);
  const today = computeDayStats(state.allRatings, state.day);
  renderHistoryChart(hist);
  renderVolumeChart(hist);
  renderDistChart(today.distribution || {});
  renderAllTime(computeAllTime(state.allRatings));
  renderCommunity(today);

  const mine = state.allRatings.find(
    (r) => r.day === state.day && r.voter_key === voterKey()
  );
  if (mine) {
    $("ratingSlider").value = String(mine.rating);
    if (mine.nickname) $("nickname").value = mine.nickname;
    if (mine.note) $("note").value = mine.note;
    updateSliderUI();
  }
}

async function loadTeamPage(teamId) {
  const focus = getFocusTeam(teamId);
  state.teamId = focus.id;
  state.focus = focus;
  state.filter = "all";
  document.querySelectorAll("#teamView .chip[data-filter]").forEach((c) => {
    c.classList.toggle("active", c.dataset.filter === "all");
  });

  $("hubView").hidden = true;
  $("teamView").hidden = false;
  document.body.classList.add("team-mode");
  document.body.classList.remove("hub-mode");
  applyTeamTheme(focus);

  document.title = `${focus.short} Daily Badness Index`;
  $("brandMark").textContent = focus.emoji;
  $("brandKicker").textContent = focus.name;
  $("heroTeamName").textContent = focus.short;
  $("heroLead").innerHTML = `Every day we stack <strong>${escapeHtml(
    focus.city
  )}</strong> against all <strong>29 other MLB teams</strong> and let the internet rate the emotional damage. Feelings only — no sabermetrics required.`;
  $("compareTitle").textContent = `${focus.short} vs every other MLB team`;
  $("compareSub").textContent = `Fresh comparisons every day. Sorted by how much worse ${focus.city} looks.`;
  $("footerTeamNote").textContent = `Not affiliated with MLB or the ${focus.name}. Pure vibes, deterministic daily roasts, and feeling ratings.`;
  $("nickname").placeholder = `Sad in ${focus.city}`;

  fillTeamSelect();
  $("teamSelect").value = focus.id;

  const data = await dailyPayload(todayIso(), focus.id);
  state.day = data.date;
  state.moodLabels = data.mood_labels;
  state.comparisons = data.comparisons || [];

  $("headerDate").textContent = formatDay(data.date);
  $("headline").textContent = data.headline;
  $("moodLabel").textContent = data.mood_label;
  setMeter(data.official_badness);

  const s = data.summary || {};
  $("meterSummary").innerHTML = `
    <li><strong>${s.teams_compared ?? 29}</strong> teams compared today</li>
    <li>Avg gap vs field: <strong>+${s.avg_gap ?? "—"}</strong></li>
    <li>Worst gap: <strong>${escapeHtml(
      s.worst_matchup?.team || "—"
    )}</strong> (+${s.worst_matchup?.gap ?? "—"})</li>
    <li>Closest: <strong>${escapeHtml(
      s.closest_matchup?.team || "—"
    )}</strong> (+${s.closest_matchup?.gap ?? "—"})</li>
  `;

  const saved = localStorage.getItem(`badness-rating-${focus.id}-${data.date}`);
  if (saved) {
    $("ratingSlider").value = saved;
  } else {
    $("ratingSlider").value = String(Math.round(data.official_badness));
  }
  const nick = localStorage.getItem("jays-nickname");
  if (nick) $("nickname").value = nick;

  updateSliderUI();
  renderComparisons();
  startLiveFeed();
}

async function submitRating() {
  const status = $("formStatus");
  const btn = $("submitRating");
  const rating = Number($("ratingSlider").value);
  const nickname = $("nickname").value.trim();
  const note = $("note").value.trim();

  if (!firebaseReady) {
    status.textContent =
      firebaseError ||
      "Firebase not connected. Paste your config into firebase-config.js";
    status.className = "form-status err";
    return;
  }

  btn.disabled = true;
  status.textContent = "Saving to the cloud…";
  status.className = "form-status";

  try {
    await upsertRating({
      teamId: state.teamId,
      day: state.day,
      rating,
      nickname,
      note,
      voterKey: voterKey(),
    });

    localStorage.setItem(
      `badness-rating-${state.teamId}-${state.day}`,
      String(rating)
    );
    if (nickname) localStorage.setItem("jays-nickname", nickname);

    status.textContent = `Saved: ${rating}/10 — everyone on this team page can see this now.`;
    status.className = "form-status ok";
  } catch (err) {
    console.error(err);
    status.textContent = err.message || "Could not save. Check Firestore rules.";
    status.className = "form-status err";
  } finally {
    btn.disabled = false;
  }
}

function startLiveFeed() {
  if (state.unsub) {
    state.unsub();
    state.unsub = null;
  }
  if (!firebaseReady || state.view !== "team") {
    applyRatingsData([]);
    return;
  }
  state.unsub = subscribeRatings(
    state.teamId,
    (all) => {
      setFirebaseBanner("Live · ratings syncing via Firebase", "ok");
      applyRatingsData(all);
    },
    (err) => {
      setFirebaseBanner(
        `Firebase error: ${err.message || err}. Check Firestore is enabled and rules allow read/write.`,
        "err"
      );
    }
  );
}

function navigateToTeam(teamId) {
  if (!TEAMS_BY_ID[teamId]) return;
  const url = new URL(window.location.href);
  url.searchParams.set("team", teamId);
  url.hash = "";
  history.pushState({ team: teamId }, "", url.pathname + "?" + url.searchParams.toString());
  route();
}

function navigateToHub() {
  const url = new URL(window.location.href);
  url.searchParams.delete("team");
  url.hash = "";
  history.pushState({}, "", url.pathname + (url.search || ""));
  route();
}

async function route() {
  const r = parseRoute();
  state.view = r.view;
  destroyAllCharts();

  if (r.view === "hub") {
    if (state.unsub) {
      state.unsub();
      state.unsub = null;
    }
    state.teamId = null;
    state.focus = null;
    renderHub();
    return;
  }

  try {
    await loadTeamPage(r.teamId);
  } catch (err) {
    console.error(err);
    if ($("headline")) $("headline").textContent = "Could not load the badness index.";
  }
}

function wireEvents() {
  if (state.eventsWired) return;
  state.eventsWired = true;

  $("ratingSlider")?.addEventListener("input", updateSliderUI);
  $("submitRating")?.addEventListener("click", submitRating);

  document.querySelectorAll("#teamView .chip[data-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      document
        .querySelectorAll("#teamView .chip[data-filter]")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.filter = chip.dataset.filter;
      renderComparisons();
    });
  });

  document.querySelectorAll("[data-hub-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      document
        .querySelectorAll("[data-hub-filter]")
        .forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.hubFilter = chip.dataset.hubFilter;
      if (state.view === "hub") renderHub();
    });
  });

  $("teamSelect")?.addEventListener("change", (e) => {
    navigateToTeam(e.target.value);
  });

  window.addEventListener("popstate", () => route());
}

async function boot() {
  wireEvents();
  initFirebase();

  if (!FIREBASE_CONFIGURED) {
    setFirebaseBanner(
      "Setup needed: paste your Firebase web config into firebase-config.js (see README).",
      "err"
    );
  } else if (!firebaseReady) {
    setFirebaseBanner(firebaseError || "Firebase failed to start.", "err");
  } else {
    setFirebaseBanner("Connecting to Firebase…", "");
  }

  await route();
}

boot();
