/* Blue Jays Daily Badness Index — client */

const MOOD_DEFAULT = {
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

const FACES = ["😌", "😐", "😕", "😟", "😣", "😫", "😩", "🤯", "💀", "☠️"];

let state = {
  day: null,
  moodLabels: MOOD_DEFAULT,
  comparisons: [],
  filter: "all",
  charts: { history: null, dist: null, volume: null },
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
  if (score >= 4) return "#134a8e";
  return "#0f766e";
}

function setMeter(score) {
  const circ = 2 * Math.PI * 52;
  const pct = Math.min(10, Math.max(0, score)) / 10;
  const fg = $("ringFg");
  fg.style.strokeDasharray = String(circ);
  fg.style.strokeDashoffset = String(circ * (1 - pct));
  fg.style.stroke = scoreColor(score);
  $("meterScore").textContent = score.toFixed(1);
  $("officialScore").textContent = score.toFixed(1);
}

function updateSliderUI() {
  const val = Number($("ratingSlider").value);
  const labels = state.moodLabels || MOOD_DEFAULT;
  $("liveRatingLabel").textContent = `${val} · ${labels[val] || ""}`;
  $("ratingFaces").innerHTML = FACES.map((f, i) => {
    const on = i + 1 === val ? "1" : "0.35";
    return `<span style="opacity:${on};transform:scale(${i + 1 === val ? 1.25 : 1});display:inline-block">${f}</span>`;
  }).join("");
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
  if (!recent.length) {
    el.innerHTML =
      '<div class="feed-empty">No ratings yet today. Be the first to suffer out loud.</div>';
    return;
  }
  el.innerHTML = recent
    .map((r) => {
      const high = r.rating >= 8 ? " high" : "";
      const note = r.note
        ? `<p class="feed-note">${escapeHtml(r.note)}</p>`
        : `<p class="feed-note">${escapeHtml(
            (state.moodLabels || MOOD_DEFAULT)[r.rating] || ""
          )}</p>`;
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

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderComparisons() {
  const grid = $("compareGrid");
  const f = state.filter;
  const list = state.comparisons.filter((c) => {
    const t = c.team;
    if (f === "all") return true;
    if (f === "AL" || f === "NL") return t.league === f;
    return t.division === f;
  });

  grid.innerHTML = list
    .map((c) => {
      const t = c.team;
      const jPct = Math.min(100, (c.jays_badness / 10) * 100);
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
              <span>Jays</span>
              <div class="bar-track"><div class="bar-fill" style="width:${jPct}%"></div></div>
              <span class="bar-val">${c.jays_badness}</span>
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

  // Animate bars after paint
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
  Chart.defaults.font.family = "'IBM Plex Sans', system-ui, sans-serif";
  Chart.defaults.color = "#6b778c";
}

function destroyChart(key) {
  if (state.charts[key]) {
    state.charts[key].destroy();
    state.charts[key] = null;
  }
}

function renderHistoryChart(history) {
  destroyChart("history");
  const labels = history.map((h) => shortDay(h.day));
  const avgs = history.map((h) => h.average);
  const ctx = $("historyChart");
  state.charts.history = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Community avg",
          data: avgs,
          borderColor: "#e31937",
          backgroundColor: "rgba(227, 25, 55, 0.12)",
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: "#134a8e",
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
              const row = history[ctx.dataIndex];
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

function renderVolumeChart(history) {
  destroyChart("volume");
  state.charts.volume = new Chart($("volumeChart"), {
    type: "bar",
    data: {
      labels: history.map((h) => shortDay(h.day)),
      datasets: [
        {
          label: "Votes",
          data: history.map((h) => h.count),
          backgroundColor: "rgba(19, 74, 142, 0.75)",
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

async function loadToday() {
  const res = await fetch("/api/today");
  if (!res.ok) throw new Error("Failed to load today");
  const data = await res.json();
  state.day = data.date;
  state.moodLabels = data.mood_labels || MOOD_DEFAULT;
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

  // Prefill slider from local vote or official score
  const saved = localStorage.getItem(`jays-rating-${data.date}`);
  if (saved) {
    $("ratingSlider").value = saved;
  } else {
    $("ratingSlider").value = String(Math.round(data.official_badness));
  }
  const nick = localStorage.getItem("jays-nickname");
  if (nick) $("nickname").value = nick;

  updateSliderUI();
  renderCommunity(data.community);
  renderComparisons();
}

async function loadStats() {
  const res = await fetch("/api/stats");
  if (!res.ok) throw new Error("Failed to load stats");
  const data = await res.json();
  chartDefaults();
  const history = data.history || [];
  renderHistoryChart(history);
  renderVolumeChart(history);
  renderDistChart(data.today?.distribution || {});
  renderAllTime(data.all_time || {});
  if (data.today) renderCommunity(data.today);
}

async function submitRating() {
  const status = $("formStatus");
  const btn = $("submitRating");
  const rating = Number($("ratingSlider").value);
  const nickname = $("nickname").value.trim();
  const note = $("note").value.trim();

  btn.disabled = true;
  status.textContent = "Sending your feelings…";
  status.className = "form-status";

  try {
    const res = await fetch("/api/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: state.day,
        rating,
        nickname,
        note,
        voter_key: voterKey(),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to submit");

    localStorage.setItem(`jays-rating-${state.day}`, String(rating));
    if (nickname) localStorage.setItem("jays-nickname", nickname);

    status.textContent = `Logged: ${rating}/10. The charts thank you for your sacrifice.`;
    status.className = "form-status ok";
    renderCommunity(data.community);
    await loadStats();
  } catch (err) {
    status.textContent = err.message || "Something broke. Classic.";
    status.className = "form-status err";
  } finally {
    btn.disabled = false;
  }
}

function wireEvents() {
  $("ratingSlider").addEventListener("input", updateSliderUI);
  $("submitRating").addEventListener("click", submitRating);
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      state.filter = chip.dataset.filter;
      renderComparisons();
    });
  });
}

async function boot() {
  wireEvents();
  updateSliderUI();
  try {
    await loadToday();
    await loadStats();
  } catch (err) {
    console.error(err);
    $("headline").textContent =
      "Could not load the badness index. Is the server running?";
  }
}

boot();
