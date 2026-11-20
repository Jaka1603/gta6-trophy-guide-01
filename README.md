# LEONIDA LEDGER — GTA VI Trophy Guide & Tracker

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Jaka1603/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Jaka1603/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

**LEONIDA LEDGER** is a static, offline trophy guide and tracker for the official
Grand Theft Auto VI PlayStation 5 trophy list: all **55 trophies** (1 Platinum,
2 Gold, 6 Silver, 46 Bronze; 28 hidden), each with a guide written in our own
words and **every guide step cited to a numbered source**.

Open `app/index.html` in a browser — no build step, no network, no accounts.
Progress is saved in the browser (localStorage) and can be exported/imported
as JSON.

## What it does

- **Tracker** — stage-grouped checklist (S1–S7) with earned checkboxes, grade
  counters (Platinum/Gold/Silver/Bronze), a "next up in roadmap order" box,
  search, and filter chips with live counts (story, missable, watch,
  unconfirmed, collectibles, activities, side chains, crime, mystery, money,
  completion, unearned only).
- **Cited guides** — selecting a trophy shows the official description, an
  IN SHORT summary, the numbered guide steps (each ending in a citation marker
  like [1] that jumps to the source card), and a working counter for the 14
  countable trophies (stunts, meditations, animals studied, dollars, …).
- **Honest uncertainty** — a live AUDIT strip counts what the data actually
  contains: 55/55 guides cite a source, 140/140 steps cited, 1 possibly
  missable, 7 watch, 2 unconfirmed, 2 sources-disagree. *Positive Mental
  Attitude* is flagged as the only possibly-missable trophy (its first
  meditation is a one-time Chapter 1 balcony moment); trophies with no
  verified method (*Challenging Tank*, *The Truth Is Out There*) are labelled
  UNCONFIRMED instead of being given invented steps; where sources disagree
  (18 vs 15 meditations; 200 vs 200–250 platinum hours) both versions are
  shown and the disagreement is named.
- **Roadmap** — seven stages from Chapter 1 to the 100% cleanup, with a
  platinum goal rail. Time ranges are printed with their sources (story
  ≈60–80 hours [2]; platinum estimates 200–250 hours [2] [5]).
- **Sources & matrix** — nine numbered sources, read 20 Nov 2026, plus a
  55×9 matrix showing which sources stand behind which trophy.
- **Spoiler setting** — the 28 hidden trophies can be masked until earned,
  with per-trophy reveal.

## Run it

```
node serve.ts --port 8000     # then open http://localhost:8000/
```

or open `app/index.html` directly. `node main.ts` copies `app/` and
`screenshots/` to the output directory and writes `dossier.json` (the kit's
harness entry point; honours `MAKEFUN_OUTPUT_DIR`).

## Screenshots

| File | Shows |
| --- | --- |
| `screenshots/1-cover.jpg` | Tracker: audit strip, stage checklist, cited guide for *Positive Mental Attitude*, source cards |
| `screenshots/2-roadmap.jpg` | Roadmap S1–S7 with the platinum goal rail |
| `screenshots/3-missables.jpg` | The missables board: 1 possibly missable, 7 watch, 2 unconfirmed |
| `screenshots/4-sources.jpg` | The nine sources and the source matrix |

All four are rendered from this app in a fixed demo state
(`?demo=1`, 11/55 earned) so they are reproducible.

## Data & sources

Trophy names, descriptions and grades are the official PlayStation list,
carried in `app/data/trophies.json`. Guide text in `app/data/guides.json` is
original writing for this entry. The nine sources — the official list as
mirrored by Exophase and PSNProfiles, PowerPyx, Planet GTA 6, eGamers,
SixShore, GTA Vice City Hub, CryptoGames, Push Square, and GTABase/TechWiser
as reported by eGamers — were read on 20 Nov 2026 and are cited, never copied.
GTA VI is unreleased, so some trophy methods rest on pre-release reporting;
the app says so wherever that is the case.

An unofficial fan guide. No Rockstar Games artwork, logos or assets are used;
the Vice City neon look is original CSS.
