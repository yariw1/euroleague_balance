# EuroLeague Balance

A small personal phone app that compares this season's EuroLeague results (2026-27) of **Hapoel Tel Aviv** and **Maccabi Tel Aviv** with the same games last season (2025-26).

It's a web app (PWA). You install it from Chrome on Android and it works like a regular app, including offline.

## How the balance works

Each team plays 38 regular-season games: every opponent once at home and once away. Each game in this season's results file is compared with last season's game against the same opponent at the same location:

| Last season | This season | Balance |
|---|---|---|
| Win | Win | 0 |
| Loss | Loss | 0 |
| Loss | Win | **+1** |
| Win | Loss | **−1** |

The team balance is the sum over all games played so far this season.

**Villeurbanne** is the team also known as ASVEL.

**Monaco/Besiktas:** Besiktas replaced Monaco in the league, so this season's Besiktas games are compared with last season's Monaco games. The app shows that opponent as "Monaco/Besiktas".

Only regular-season games are tracked. Play-in and playoff games aren't included.

## Screens

- **Balance**: each team's current balance and how many games were better, worse or the same. Tap a team's card to open its Table. Below the cards it shows how many games were read from the results file and when the file was last updated.
- **Table**: all 38 games for a team, sorted by this season's date (the default; games not played yet come after, in last season's order), by last season's date, or by opponent.
- **Look up**: pick any game to see both seasons side by side.

## This season's results

The app reads this season's results from `season-2026-27.json`. It's the same format the old "Export backup" button made, so an old backup file can be used as is (rename it to `season-2026-27.json`). Add games to it as the season goes on and upload it to GitHub; partial results are fine.

```json
{
  "app": "euroleague-balance",
  "version": 1,
  "exported": "2026-10-18T00:00:00.000Z",
  "games": [
    { "team": "Hapoel Tel Aviv", "opponent": "Barcelona", "location": "H", "result": "W", "score": "88-80", "date": "2026-10-01" }
  ]
}
```

- `team`: `Hapoel Tel Aviv` or `Maccabi Tel Aviv`.
- `opponent`: the name as in `data-2025-26.js` (use `Besiktas`, not Monaco; `ASVEL` is also accepted for Villeurbanne).
- `location`: `H` or `A`. `result`: `W` or `L`, from the team's point of view.
- `score` (team-opponent) and `date` (`YYYY-MM-DD`) are optional. `exported` is shown as "file updated" on the Balance screen, so change it when you update the file. Other fields (such as `saved` from old backups) are ignored.
- Entries the app doesn't recognise (unknown team or opponent, bad location or result) are skipped, and the Balance screen says how many.

The app downloads the file each time it opens. Without internet it uses the last copy it downloaded. The results file is public on GitHub, like the rest of the app.

## Installing on Android

1. Open the app's GitHub Pages address in **Chrome**.
2. Tap **⋮** → **Install app** (or **Add to Home screen**).
3. Open it from the new home-screen icon.

## Files

| File | Purpose |
|---|---|
| `index.html` | The app's screens |
| `app.js` | App logic: reading this season's file, balance calculation |
| `style.css` | Look and layout (light and dark mode) |
| `data-2025-26.js` | Last season's 76 results and the Monaco → Besiktas mapping |
| `season-2026-27.json` | This season's results (you update this file) |
| `manifest.webmanifest` | App name, icon and colors for installing |
| `sw.js` | Keeps a copy of the app on the phone so it opens offline |
| `icons/` | App icons |

## Updating the app

After changing any file, change the version in `sw.js` (for example `elb-v18` → `elb-v19`) and upload the changed files to GitHub. Phones then pick up the new version the next time the app is opened with internet (sometimes it takes a second open). You don't need to change the version when you only update `season-2026-27.json`; the app always fetches the latest one.

## Data source

Last season's results (including scores, which are stored but not shown in the app) come from Wikipedia's "2025–26 EuroLeague regular season" page. Home and away are taken from the official EuroLeague game links. The results were checked against the final standings (Hapoel 23-15, Maccabi 18-20) and reviewed by hand.
