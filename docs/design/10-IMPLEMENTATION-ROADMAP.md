# 10 — Implementation Roadmap

**Deadline:** Sun Nov 15, 2026, 11:59 p.m. local time. Scope = SCOPE.md "In scope". Done = SCOPE.md "What done looks like".

## 1. Stack

| Choice | Decision | Why |
|---|---|---|
| App | React + TypeScript + Vite | Known by the team and our AI tools. Static deploy. |
| Styling | CSS Modules + `tokens.css` | One token source. **No Tailwind.** |
| Charts | Recharts (`type="monotone"`) wrapped in `TrendChart` | Fast. The wrapper enforces doc 08. |
| Icons | lucide-react | Outline set |
| Fonts | IBM Plex Sans + IBM Plex Mono (Google Fonts) | Doc 04 §C |
| Data | Build script `scripts/prepare-mmash.mjs` → `public/data/mmash/*.json` (RR→RMSSD windows, sleep TST) | Offline, fast, no runtime API |
| State | React context + localStorage | Local-first |
| Host | GitHub Pages or Netlify | Public link, no login (E8) |

## 2. Build order (MVP)

S = under 2 h · M = 2–5 h.

| # | Item | Size | Depends on |
|---|---|---|---|
| 1 | Scaffold, tokens, fonts, Toolbar, Card, Button, StatusChip | S | — |
| 2 | Data contract (doc 05 §5) + MMASH prep script (RMSSD per SCOPE/RESEARCH processing notes) + sample BP/sugar/temp | M | 1 |
| 3 | Status engine: SCOPE/MINIGAME rules → `IndicatorStatus` with cause + rule | M | 2 |
| 4 | **Home** (S1) incl. top-issue selection | M | 3 |
| 5 | Daily check-in sheet (S2) | S | 1 |
| 6 | Indicator detail + TrendChart (S3) | M | 3 |
| 7 | **Signal Lock flow** (S5) + PVT metrics + baseline (NASA preset) | M | 1 |
| 8 | Result + CountermeasureCard (S6) + escalation flag | S | 7 |
| 9 | Entry sheets: BP+sugar, Temperature (S4) | S | 1 |
| 10 | Settings & About: credits (MMASH ODbL, Dev 2024, HRP), disclaimer, AI-use statement, demo controls | S | — |
| 11 | Secondary BodyFigure (SVG) | S | 4 |
| 12 | Deploy + demo video (≤30 s) | M | All above |

**Stretch** (after done): Orbit Breath, offered from the countermeasure card.

**Team split:**
- **Lead dev:** 2, 3, 4.
- **Frontend:** 1, 5, 6, 9.
- **Minigame owner (Aileen):** 7, 8.
- **Content:** cited ranges U1–U3, card wording, 10.
- **Design/demo:** 11, 12, mockups.

## 3. Demo path (30 s, matches SCOPE "done")

| Time | Shows |
|---|---|
| 0–4 s | Home: **Watch**, "HRV 22% below your baseline", one action. Recorded MMASH label visible. |
| 4–9 s | Daily check-in done in 3 taps |
| 9–22 s | Start the alertness check, a few taps, cut to the result: Watch + countermeasure card. "Scored against the NASA ISS pre-flight reference." |
| 22–27 s | Tap HRV, see the 7-day trend with the baseline band |
| 27–30 s | Closing line on crew time: about 1 min a day |

English subtitles. AI-illustration and data labels visible.
