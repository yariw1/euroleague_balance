// EuroLeague Balance — compares 2026-27 results with the same games in 2025-26.
// This season's games are read from season-2026-27.json (same format as the old backup export).

const SEASON_FILE = "season-2026-27.json";
const SHORT = { "Hapoel Tel Aviv": "Hapoel", "Maccabi Tel Aviv": "Maccabi" };
const CLS = { "Hapoel Tel Aviv": "hapoel", "Maccabi Tel Aviv": "maccabi" };

const key = (team, opp, loc) => `${team}|${opp}|${loc}`;
// Opponents that were renamed in the app (old name -> current name).
const RENAMED = { "ASVEL": "Villeurbanne" };

let games = {}; // key "team|opponent|H" -> {team, opponent, location, result, score, date}
let seasonInfo = { state: "loading" }; // "loading" | "ok" (+ exported, count, skipped) | "error" (+ message)

// Display name: a replaced team shows both names, e.g. "Monaco/Besiktas".
const oppName = opp => (OPPONENT_ALIAS[opp] ? `${OPPONENT_ALIAS[opp]}/${opp}` : opp);

// ---------- season data ----------
function opponentsFor(team) {
  // This season's opponents: last season's list with aliases swapped in (Monaco -> Besiktas).
  const reverse = Object.fromEntries(Object.entries(OPPONENT_ALIAS).map(([now, then]) => [then, now]));
  const names = [...new Set(LAST_SEASON.filter(g => g.team === team).map(g => reverse[g.opponent] || g.opponent))];
  return names.sort((a, b) => oppName(a).localeCompare(oppName(b)));
}
function lastSeason(team, opp, loc) {
  const then = OPPONENT_ALIAS[opp] || opp;
  return LAST_SEASON.find(g => g.team === team && g.opponent === then && g.location === loc) || null;
}
function effect(prev, now) {
  if (!prev || !now || prev.result === now.result) return 0;
  return now.result === "W" ? 1 : -1;
}
function summary(team) {
  let bal = 0, played = 0, better = 0, worse = 0, same = 0;
  for (const g of Object.values(games)) {
    if (g.team !== team) continue;
    played++;
    const e = effect(lastSeason(g.team, g.opponent, g.location), g);
    bal += e;
    if (e > 0) better++; else if (e < 0) worse++; else same++;
  }
  return { bal, played, better, worse, same };
}

// Reads this season's results file. Entries that don't match a known game are skipped.
async function loadSeason() {
  try {
    const res = await fetch(SEASON_FILE, { cache: "no-store" });
    if (!res.ok) throw new Error(`${SEASON_FILE} not found (${res.status})`);
    const data = await res.json();
    if (!data || !Array.isArray(data.games)) throw new Error(`${SEASON_FILE} has no "games" list`);
    const out = {};
    let skipped = 0;
    for (const g of data.games) {
      if (g && RENAMED[g.opponent]) g.opponent = RENAMED[g.opponent];
      const ok = g && TEAMS.includes(g.team) && opponentsFor(g.team).includes(g.opponent)
        && (g.location === "H" || g.location === "A") && (g.result === "W" || g.result === "L");
      if (ok) out[key(g.team, g.opponent, g.location)] = g; else skipped++;
    }
    games = out;
    seasonInfo = { state: "ok", exported: data.exported || "", count: Object.keys(out).length, skipped };
  } catch (err) {
    // Browsers don't let a page opened straight from disk (file://) read other files.
    const message = location.protocol === "file:"
      ? "the app was opened as a file. Open it from its web address (GitHub Pages) or a local server instead."
      : err && err.message ? err.message : String(err);
    seasonInfo = { state: "error", message };
  }
}

// ---------- helpers ----------
const $ = id => document.getElementById(id);
const signed = n => (n > 0 ? "+" + n : String(n));
const tone = n => (n > 0 ? "pos" : n < 0 ? "neg" : "zero");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Dates: last season uses "4 December 2025", this season "2026-10-16" (read as a local date).
const toTime = d => (!d ? NaN : new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? d + "T00:00" : d).getTime());
const shortDate = d => { const t = toTime(d); return isNaN(t) ? (d || "") : new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }); };

function makeSeg(el, options, value, onChange) {
  el.innerHTML = "";
  for (const o of options) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = o.label;
    b.dataset.value = o.value;
    if (o.cls) b.classList.add(o.cls);
    b.addEventListener("click", () => { setSeg(el, o.value); onChange(o.value); });
    el.appendChild(b);
  }
  setSeg(el, value);
}
function setSeg(el, value) {
  for (const b of el.children) b.classList.toggle("on", b.dataset.value === value);
}
function fillOpponents(select, team, keep) {
  const opps = opponentsFor(team);
  select.innerHTML = opps.map(o => `<option value="${esc(o)}">${esc(oppName(o))}</option>`).join("");
  if (keep && opps.includes(keep)) select.value = keep;
}
const TEAM_OPTS = TEAMS.map(t => ({ label: SHORT[t], value: t, cls: CLS[t] }));
const LOC_OPTS = [{ label: "Home", value: "H" }, { label: "Away", value: "A" }];

// ---------- tabs ----------
let currentView = "balance";
function show(view) {
  currentView = view;
  for (const s of document.querySelectorAll(".view")) s.hidden = s.id !== "view-" + view;
  for (const b of document.querySelectorAll(".tabs button")) b.classList.toggle("active", b.dataset.view === view);
  if (view === "balance") renderBalance();
  if (view === "table") renderTable();
  if (view === "lookup") renderLookup();
}
for (const b of document.querySelectorAll(".tabs button")) {
  b.addEventListener("click", () => { show(b.dataset.view); window.scrollTo(0, 0); });
}

// ---------- balance ----------
function renderBalance() {
  $("balance-cards").innerHTML = TEAMS.map(t => {
    const s = summary(t);
    return `<div class="card team-card ${CLS[t]}">
      <div class="name">${esc(t)}</div>
      <div class="num ${tone(s.bal)}">${signed(s.bal)}</div>
      <div class="stats">
        <div><b>${s.played}</b><span>of 38 played</span></div>
        <div><b class="pos">${s.better}</b><span>better</span></div>
        <div><b class="neg">${s.worse}</b><span>worse</span></div>
        <div><b>${s.same}</b><span>same</span></div>
      </div>
    </div>`;
  }).join("");
  renderSeasonStatus();
}
function renderSeasonStatus() {
  const el = $("season-status");
  el.className = "muted small";
  if (seasonInfo.state === "loading") { el.textContent = "Loading this season's results…"; return; }
  if (seasonInfo.state === "error") { el.className = "msg neg"; el.textContent = "Couldn't read this season's results: " + seasonInfo.message; return; }
  const when = seasonInfo.exported ? ` · file updated ${shortDate(String(seasonInfo.exported).slice(0, 10))}` : "";
  const skip = seasonInfo.skipped ? ` · ${seasonInfo.skipped} unrecognised entr${seasonInfo.skipped > 1 ? "ies" : "y"} ignored` : "";
  el.textContent = `${seasonInfo.count} games this season${when}${skip}`;
}

// ---------- lookup ----------
const lk = { team: TEAMS[0], loc: "H" };
function initLookup() {
  makeSeg($("lk-team"), TEAM_OPTS, lk.team, v => { lk.team = v; fillOpponents($("lk-opp"), v, $("lk-opp").value); renderLookup(); });
  fillOpponents($("lk-opp"), lk.team);
  makeSeg($("lk-loc"), LOC_OPTS, lk.loc, v => { lk.loc = v; renderLookup(); });
  $("lk-opp").addEventListener("change", renderLookup);
}
function renderLookup() {
  const opp = $("lk-opp").value;
  const prev = lastSeason(lk.team, opp, lk.loc);
  const now = games[key(lk.team, opp, lk.loc)];
  const box = (season, g, details) => `<div class="box"><div class="season">${season}</div>
    <div class="res">${g ? `<span class="chip ${g.result}">${g.result}</span>` : `<span class="dash">—</span>`}</div>
    <div class="det">${g ? esc(details.filter(Boolean).join(" · ")) : "Not played yet"}</div></div>`;
  // Last season's scores are kept in the data but not shown.
  let html = box("2025-26", prev, prev ? [shortDate(prev.date), "Rd " + prev.round] : [])
           + box("2026-27", now, now ? [now.score, shortDate(now.date)] : []);
  if (prev && now) { const e = effect(prev, now); html += `<div class="eff ${tone(e)}">Effect: ${signed(e)}</div>`; }
  $("lk-result").innerHTML = html;
}

// ---------- table ----------
let tbTeam = TEAMS[0];
let tbSort = "opp";
const SORT_OPTS = [{ label: "Opponent", value: "opp" }, { label: "Date 25-26", value: "date" }, { label: "Date 26-27", value: "date-now" }];
function renderTable() {
  makeSeg($("tb-team"), TEAM_OPTS, tbTeam, v => { tbTeam = v; renderTable(); });
  makeSeg($("tb-sort"), SORT_OPTS, tbSort, v => { tbSort = v; renderTable(); });
  const slots = [];
  for (const opp of opponentsFor(tbTeam)) {
    for (const loc of ["H", "A"]) slots.push({ opp, loc, prev: lastSeason(tbTeam, opp, loc), now: games[key(tbTeam, opp, loc)] });
  }
  // Actual game date (some games were postponed, so round order isn't always date order).
  const prevWhen = s => (s.prev ? toTime(s.prev.date) || 0 : Infinity);
  const byPrev = (a, b) => prevWhen(a) - prevWhen(b) || (a.prev?.round || 0) - (b.prev?.round || 0);
  const nowWhen = s => (s.now ? toTime(s.now.date) : NaN);
  if (tbSort === "date") slots.sort(byPrev);
  if (tbSort === "date-now") {
    // This season's games by their date first, then the rest by last season's date.
    slots.sort((a, b) => {
      const ta = nowWhen(a), tb = nowWhen(b);
      if (!isNaN(ta) && !isNaN(tb)) return ta - tb || byPrev(a, b);
      if (!isNaN(ta)) return -1;
      if (!isNaN(tb)) return 1;
      return byPrev(a, b);
    });
  }
  let rows = "", total = 0;
  for (const { opp, loc, prev, now } of slots) {
    const e = now ? effect(prev, now) : null;
    if (e) total += e;
    const chip = g => g ? `<span class="chip ${g.result}">${g.result}</span>` : `<span class="dash">·</span>`;
    let subText = "";
    if (tbSort === "date" && prev) subText = `${shortDate(prev.date)} · Rd ${prev.round}`;
    if (tbSort === "date-now") {
      if (now && now.date) subText = [shortDate(now.date), now.score].filter(Boolean).join(" · ");
      else if (prev) subText = shortDate(prev.date);
    }
    const sub = subText ? `<div class="sub-date">${esc(subText)}</div>` : "";
    rows += `<tr>
      <td>${esc(oppName(opp))}${sub}</td><td>${loc}</td><td>${chip(prev)}</td><td>${chip(now)}</td>
      <td class="${e === null ? "dash" : tone(e)}">${e === null ? "" : signed(e)}</td></tr>`;
  }
  $("tb-body").innerHTML = rows;
  const s = summary(tbTeam);
  $("tb-foot").innerHTML = `<tr><td colspan="3">Balance (${s.played} played)</td><td></td><td class="${tone(total)}">${signed(total)}</td></tr>`;
}

// ---------- start ----------
initLookup();
show("balance");
loadSeason().then(() => show(currentView));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
