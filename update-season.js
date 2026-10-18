// Updates season-2026-27.json from the official EuroLeague API.
// Run with Node 18 or newer:  node update-season.js
// Only played regular-season games of Hapoel and Maccabi Tel Aviv are written.

const fs = require("fs");
const path = require("path");

const SEASON_CODE = "E2026"; // 2026-27 (the code uses the year the season starts)
const API = `https://api-live.euroleague.net/v2/competitions/E/seasons/${SEASON_CODE}/games`;
const FILE = path.join(__dirname, "season-2026-27.json");

// EuroLeague club codes -> names used in the app (data-2025-26.js).
const CLUBS = {
  HTA: "Hapoel Tel Aviv", TEL: "Maccabi Tel Aviv",
  MAD: "Real Madrid", BAR: "Barcelona", IST: "Anadolu Efes", PRS: "Paris", PAM: "Valencia",
  OLY: "Olympiacos", PAN: "Panathinaikos", PAR: "Partizan", RED: "Crvena Zvezda", DUB: "Dubai",
  ULK: "Fenerbahçe", BAS: "Baskonia", MIL: "Milan", VIR: "Virtus Bologna", ZAL: "Žalgiris",
  ASV: "Villeurbanne", MUN: "Bayern Munich", BES: "Besiktas", MCO: "Monaco",
};
const OUR_TEAMS = ["HTA", "TEL"];

async function main() {
  const res = await fetch(API);
  if (!res.ok) throw new Error(`EuroLeague API answered ${res.status}`);
  const { data } = await res.json();
  if (!Array.isArray(data)) throw new Error("Unexpected answer from the EuroLeague API (no data list)");

  const games = [];
  const unknown = new Set();
  for (const g of data) {
    if (!g.played || g.phaseType?.code !== "RS") continue;
    const home = g.local.club.code, away = g.road.club.code;
    for (const [us, them, location] of [[home, away, "H"], [away, home, "A"]]) {
      if (!OUR_TEAMS.includes(us)) continue;
      if (!CLUBS[them]) { unknown.add(`${them} (${(location === "H" ? g.road : g.local).club.name})`); continue; }
      const ours = location === "H" ? g.local.score : g.road.score;
      const theirs = location === "H" ? g.road.score : g.local.score;
      games.push({
        team: CLUBS[us],
        opponent: CLUBS[them],
        location,
        result: ours > theirs ? "W" : "L",
        score: `${ours}-${theirs}`,
        date: g.localDate.slice(0, 10), // date where the game was played
      });
    }
  }
  games.sort((a, b) => a.date.localeCompare(b.date) || a.team.localeCompare(b.team));

  for (const t of OUR_TEAMS) console.log(`${CLUBS[t]}: ${games.filter(g => g.team === CLUBS[t]).length} games`);

  // Leave the file alone when nothing changed, so "file updated" keeps the date of the last new result.
  let old = null;
  try { old = JSON.parse(fs.readFileSync(FILE, "utf8")).games; } catch (e) {}
  if (JSON.stringify(old) === JSON.stringify(games)) {
    console.log("No new results; file not changed");
  } else {
    const out = { app: "euroleague-balance", version: 1, exported: new Date().toISOString(), games };
    fs.writeFileSync(FILE, JSON.stringify(out, null, 2) + "\n");
    console.log(`Wrote ${path.basename(FILE)}`);
  }
  if (unknown.size) console.warn(`Skipped games against unknown clubs (add them to CLUBS): ${[...unknown].join(", ")}`);
}

main().catch(err => { console.error("Update failed:", err.message); process.exit(1); });
