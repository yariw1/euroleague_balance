// EuroLeague Balance — compares 2026-27 results with the same games in 2025-26.
// This season's games are read from season-2026-27.json (same format as the old backup export).

const SEASON_FILE = "season-2026-27.json";
const CLS = { "Hapoel Tel Aviv": "hapoel", "Maccabi Tel Aviv": "maccabi" };

// ---------- language ----------
// The data keeps the English names as keys; Hebrew names are only for display.
const HE_NAMES = {
  "Hapoel Tel Aviv": "הפועל תל אביב", "Maccabi Tel Aviv": "מכבי תל אביב",
  "Real Madrid": "ריאל מדריד", "Barcelona": "ברצלונה", "Anadolu Efes": "אנאדולו אפס",
  "Paris": "פאריס", "Valencia": "ולנסיה", "Olympiacos": "אולימפיאקוס", "Monaco": "מונאקו",
  "Panathinaikos": "פנאתינייקוס", "Partizan": "פרטיזן", "Crvena Zvezda": "הכוכב האדום",
  "Dubai": "דובאי", "Fenerbahçe": "פנרבחצ'ה", "Baskonia": "באסקוניה", "Milan": "מילאנו",
  "Virtus Bologna": "וירטוס בולוניה", "Žalgiris": "ז'לגיריס", "Villeurbanne": "וילרבאן",
  "Bayern Munich": "באיירן מינכן", "Besiktas": "בשיקטאש",
};
const TEXT = {
  he: {
    dir: "rtl", locale: "he-IL", switchTo: "EN", switchLabel: "Switch to English",
    title: "מאזן יורוליג", sub: "2026-27 מול 2025-26",
    intro: 'התוצאות של כל קבוצה ביורוליג 2026-27 בהשוואה לאותם משחקים ב־2025-26:<br><b class="neg"><bdi dir="ltr">+1</bdi></b> על תוצאה טובה יותר, <b class="neg"><bdi dir="ltr">−1</bdi></b> על תוצאה גרועה יותר.<br>בשיקטאש החליפה את מונאקו, ולכן המשחקים מולה מושווים למשחקים מול מונאקו בעונה שעברה.',
    lookupTitle: "חיפוש משחק", team: "קבוצה", opponent: "יריבה", location: "מיקום", homeAway: "בית/<br>חוץ",
    tabBalance: "מאזן", tabTable: "טבלה", tabLookup: "חיפוש",
    short: { "Hapoel Tel Aviv": "הפועל", "Maccabi Tel Aviv": "מכבי" },
    name: n => HE_NAMES[n] || n,
    res: { W: "ניצחון", L: "הפסד" }, loc: { H: "בית", A: "חוץ" },
    toTable: "לטבלה ‹", played: "משחקים מתוך 38", better: "שיפור", worse: "נסיגה", same: "ללא שינוי",
    loading: "טוען את תוצאות העונה…", loadError: "לא ניתן לקרוא את תוצאות העונה: ",
    openedAsFile: "האפליקציה נפתחה כקובץ. יש לפתוח אותה מכתובת האתר (GitHub Pages) או משרת מקומי.",
    notFound: (f, st) => `הקובץ ${f} לא נמצא (${st})`, noGames: f => `בקובץ ${f} אין רשימת "games"`,
    updated: d => ` · הקובץ עודכן ב־${d}`,
    skipped: n => ` · ${n > 1 ? `${n} רשומות לא מזוהות` : "רשומה לא מזוהה אחת"} לא נכללו`,
    count: n => `${n} משחקים העונה`,
    notPlayed: "עוד לא שוחק", round: r => "מחזור " + r, effect: "השפעה: ",
    sortNow: "תאריך 26-27", sortPrev: "תאריך 25-26", sortOpp: "יריבה",
    total: n => `מאזן (${n} שוחקו)`,
  },
  en: {
    dir: "ltr", locale: "en-GB", switchTo: "עב", switchLabel: "עברית",
    title: "EuroLeague Balance", sub: "2026-27 vs 2025-26",
    intro: "Each team's 2026-27 EuroLeague results compared with the same games in 2025-26:<br><b class=\"neg\">+1</b> for a better result, <b class=\"neg\">−1</b> for a worse one.<br>Besiktas replaced Monaco, so its games are compared with last season's Monaco games.",
    lookupTitle: "Look up a game", team: "Team", opponent: "Opponent", location: "Location", homeAway: "Home/<br>Away",
    tabBalance: "Balance", tabTable: "Table", tabLookup: "Look up",
    short: { "Hapoel Tel Aviv": "Hapoel", "Maccabi Tel Aviv": "Maccabi" },
    name: n => n,
    res: { W: "Win", L: "Loss" }, loc: { H: "Home", A: "Away" },
    toTable: "Table ›", played: "of 38 played", better: "better", worse: "worse", same: "same",
    loading: "Loading this season's results…", loadError: "Couldn't read this season's results: ",
    openedAsFile: "the app was opened as a file. Open it from its web address (GitHub Pages) or a local server instead.",
    notFound: (f, st) => `${f} not found (${st})`, noGames: f => `${f} has no "games" list`,
    updated: d => ` · file updated ${d}`,
    skipped: n => ` · ${n} unrecognised entr${n > 1 ? "ies" : "y"} ignored`,
    count: n => `${n} games this season`,
    notPlayed: "Not played yet", round: r => "Rd " + r, effect: "Effect: ",
    sortNow: "Date 26-27", sortPrev: "Date 25-26", sortOpp: "Opponent",
    total: n => `Balance (${n} played)`,
  },
};
const LANG_KEY = "elb-lang";
let lang = "he";
try { if (TEXT[localStorage.getItem(LANG_KEY)]) lang = localStorage.getItem(LANG_KEY); } catch (e) {}
const T = () => TEXT[lang];

// W/L in a green/red chip (same letters in both languages).
const resChip = g => `<span class="chip ${g.result}" title="${T().res[g.result]}" aria-label="${T().res[g.result]}">${g.result}</span>`;

const key = (team, opp, loc) => `${team}|${opp}|${loc}`;
// Opponents that were renamed in the app (old name -> current name).
const RENAMED = { "ASVEL": "Villeurbanne" };

let games = {}; // key "team|opponent|H" -> {team, opponent, location, result, score, date}
let seasonInfo = { state: "loading" }; // "loading" | "ok" (+ exported, count, skipped) | "error" (+ message)

// Display name: a replaced team shows both names, e.g. "Monaco/Besiktas".
const oppName = opp => (OPPONENT_ALIAS[opp] ? `${T().name(OPPONENT_ALIAS[opp])}/${T().name(opp)}` : T().name(opp));

// ---------- season data ----------
function opponentsFor(team) {
  // This season's opponents: last season's list with aliases swapped in (Monaco -> Besiktas).
  const reverse = Object.fromEntries(Object.entries(OPPONENT_ALIAS).map(([now, then]) => [then, now]));
  const names = [...new Set(LAST_SEASON.filter(g => g.team === team).map(g => reverse[g.opponent] || g.opponent))];
  return names.sort((a, b) => oppName(a).localeCompare(oppName(b), lang));
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
    if (!res.ok) throw { notFound: res.status };
    const data = await res.json();
    if (!data || !Array.isArray(data.games)) throw { noGames: true };
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
    seasonInfo = { state: "error", err, file: location.protocol === "file:" };
  }
}

// ---------- helpers ----------
const $ = id => document.getElementById(id);
// Wrapped in left-to-right isolate marks so "+1" doesn't show as "1+" in the right-to-left page.
const signed = n => "⁦" + (n > 0 ? "+" + n : String(n)) + "⁩";
const tone = n => (n > 0 ? "pos" : n < 0 ? "neg" : "zero");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Dates: last season uses "4 December 2025", this season "2026-10-16" (read as a local date).
const toTime = d => (!d ? NaN : new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? d + "T00:00" : d).getTime());
const shortDate = d => { const t = toTime(d); return isNaN(t) ? (d || "") : new Date(t).toLocaleDateString(T().locale, { day: "numeric", month: "short", year: "2-digit" }); };

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
const teamOpts = () => TEAMS.map(t => ({ label: T().short[t], value: t, cls: CLS[t] }));
const locOpts = () => [{ label: T().loc.H, value: "H" }, { label: T().loc.A, value: "A" }];

// ---------- tabs ----------
let currentView = "balance";
// The phone's Back button: other screens add one history entry, so Back returns to Balance
// first and only leaves the app from there. Pass fromHistory to show a screen without touching history.
function show(view, fromHistory) {
  if (!fromHistory) {
    const onOther = history.state && history.state.view;
    if (view === "balance" && onOther) { history.back(); return; } // popstate shows Balance
    if (view !== "balance") onOther ? history.replaceState({ view }, "") : history.pushState({ view }, "");
  }
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
    return `<div class="card team-card ${CLS[t]}" data-team="${esc(t)}" role="button" tabindex="0">
      <div class="name">${esc(T().name(t))} <span class="go">${T().toTable}</span></div>
      <div class="num ${tone(s.bal)}">${signed(s.bal)}</div>
      <div class="stats">
        <div><b>${s.played}</b><span>${T().played}</span></div>
        <div><b class="pos">${s.better}</b><span>${T().better}</span></div>
        <div><b class="neg">${s.worse}</b><span>${T().worse}</span></div>
        <div><b>${s.same}</b><span>${T().same}</span></div>
      </div>
    </div>`;
  }).join("");
  renderSeasonStatus();
}
// Tapping a team's card opens the Table for that team.
function openTeamTable(e) {
  const card = e.target.closest(".team-card");
  if (!card || (e.type === "keydown" && e.key !== "Enter" && e.key !== " ")) return;
  e.preventDefault();
  tbTeam = card.dataset.team;
  show("table");
  window.scrollTo(0, 0);
}
$("balance-cards").addEventListener("click", openTeamTable);
$("balance-cards").addEventListener("keydown", openTeamTable);
function renderSeasonStatus() {
  const el = $("season-status");
  el.className = "muted small";
  const t = T();
  if (seasonInfo.state === "loading") { el.textContent = t.loading; return; }
  if (seasonInfo.state === "error") {
    const { err, file } = seasonInfo;
    const why = file ? t.openedAsFile
      : err && err.notFound ? t.notFound(SEASON_FILE, err.notFound)
      : err && err.noGames ? t.noGames(SEASON_FILE)
      : err && err.message ? err.message : String(err);
    el.className = "msg neg"; el.textContent = t.loadError + why; return;
  }
  const when = seasonInfo.exported ? t.updated(shortDate(String(seasonInfo.exported).slice(0, 10))) : "";
  const skip = seasonInfo.skipped ? t.skipped(seasonInfo.skipped) : "";
  el.textContent = t.count(seasonInfo.count) + when + skip;
}

// ---------- lookup ----------
const lk = { team: TEAMS[0], loc: "H" };
// Builds the lookup controls; called again when the language changes.
function setupLookup() {
  makeSeg($("lk-team"), teamOpts(), lk.team, v => { lk.team = v; fillOpponents($("lk-opp"), v, $("lk-opp").value); renderLookup(); });
  fillOpponents($("lk-opp"), lk.team, $("lk-opp").value);
  makeSeg($("lk-loc"), locOpts(), lk.loc, v => { lk.loc = v; renderLookup(); });
}
$("lk-opp").addEventListener("change", renderLookup);
function renderLookup() {
  const opp = $("lk-opp").value;
  const prev = lastSeason(lk.team, opp, lk.loc);
  const now = games[key(lk.team, opp, lk.loc)];
  const box = (season, g, details) => `<div class="box"><div class="season">${season}</div>
    <div class="res">${g ? resChip(g) : `<span class="dash">—</span>`}</div>
    <div class="det">${g ? esc(details.filter(Boolean).join(" · ")) : T().notPlayed}</div></div>`;
  // Last season's scores are kept in the data but not shown.
  let html = box("2025-26", prev, prev ? [shortDate(prev.date), T().round(prev.round)] : [])
           + box("2026-27", now, now ? [now.score, shortDate(now.date)] : []);
  if (prev && now) { const e = effect(prev, now); html += `<div class="eff ${tone(e)}">${T().effect}${signed(e)}</div>`; }
  $("lk-result").innerHTML = html;
}

// ---------- table ----------
let tbTeam = TEAMS[0];
let tbSort = "date-now";
const sortOpts = () => [{ label: T().sortNow, value: "date-now" }, { label: T().sortPrev, value: "date" }, { label: T().sortOpp, value: "opp" }];
function renderTable() {
  makeSeg($("tb-team"), teamOpts(), tbTeam, v => { tbTeam = v; renderTable(); });
  makeSeg($("tb-sort"), sortOpts(), tbSort, v => { tbSort = v; renderTable(); });
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
    const chip = g => g ? resChip(g) : `<span class="dash">·</span>`;
    let subText = "";
    if (tbSort === "date" && prev) subText = `${shortDate(prev.date)} · ${T().round(prev.round)}`;
    if (tbSort === "date-now") {
      if (now && now.date) subText = [shortDate(now.date), now.score].filter(Boolean).join(" · ");
      else if (prev) subText = shortDate(prev.date);
    }
    const sub = subText ? `<div class="sub-date">${esc(subText)}</div>` : "";
    rows += `<tr>
      <td>${esc(oppName(opp))}${sub}</td><td>${T().loc[loc]}</td><td>${chip(prev)}</td><td>${chip(now)}</td>
      <td class="${e === null ? "dash" : tone(e)}">${e === null ? "" : signed(e)}</td></tr>`;
  }
  $("tb-body").innerHTML = rows;
  const s = summary(tbTeam);
  $("tb-foot").innerHTML = `<tr><td colspan="3">${T().total(s.played)}</td><td></td><td class="${tone(total)}">${signed(total)}</td></tr>`;
}

// ---------- language switch ----------
// Fixed page text has data-i18n (plain text) or data-i18n-html (contains tags) with a TEXT key.
function applyLang() {
  const t = T();
  document.documentElement.lang = lang;
  document.documentElement.dir = t.dir;
  document.title = t.title;
  for (const el of document.querySelectorAll("[data-i18n]")) el.textContent = t[el.dataset.i18n];
  for (const el of document.querySelectorAll("[data-i18n-html]")) el.innerHTML = t[el.dataset.i18nHtml];
  $("lang-btn").textContent = t.switchTo;
  $("lang-btn").setAttribute("aria-label", t.switchLabel);
  setupLookup();
}
$("lang-btn").addEventListener("click", () => {
  lang = lang === "he" ? "en" : "he";
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  applyLang();
  show(currentView, true);
});

// ---------- start ----------
applyLang();
if (history.state && history.state.view) history.replaceState(null, ""); // reopened on another screen's entry
window.addEventListener("popstate", () => { show("balance", true); window.scrollTo(0, 0); });
show("balance", true);
loadSeason().then(() => show(currentView, true));

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
