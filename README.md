# Hellenic Systems Trainer

A practice simulator for learning the factory software at 2SFG Scunthorpe, built in the same spirit as the Bizerba Labeller Line Trainer. It runs entirely in the browser: no install, no server, no real factory systems touched.

Three apps share one practice data set (saved in the browser, resettable):

| App | What it is | Basis |
|---|---|---|
| **Scale terminal** | Hellenic OCM terminal (Requiem v9): weighing, CMD0 / CMD1 / SETUP menus, Edit Codes, hotshots, record selectors, printers → P43 config | 45 site photos |
| **FOPS 8** | Factory Scheduler (Windows client): orders, lines, transactions, refresh, insert/change | 1 photo, rest assumed |
| **FOPSx Web** | Label formats, label designer, products, terminals, traceability | No photos, designed from brochure and domain knowledge, tagged *assumed* |

Every screen carries notes tagged **From photo** or **Assumed**, plus task lists.

## How the apps link
- Weigh a box on the scale → it shows in FOPS 8 (Done / Weight Done) after **Refresh**.
- FOPSx edits → **Send** → terminal copy of products/formats.
- Scale CMD1 → Download Label Formats → printer copy → printed label changes.
- Scale CMD0 → Send a Message → FOPS 8 Info › Messages.

## Practice security codes
Set your own **practice** CMD1 / CMD0 / SETUP codes in the card beside the terminal. "Help me enter it" types the code key by key. A wrong code shows no message and opens the menu with only the buttons enabled in Edit Codes › CMD0/1 Key Enables, as on the real terminal. **Never type real site codes here.**

## Run it
- Open `index.html` in a browser, or use GitHub Pages (Settings → Pages → Deploy from branch → `main` / root).
- Phone: open the Pages link, then "Add to home screen".

## Repo layout
- `index.html` – the built single-file app (generated)
- `src/` – source parts: `p1-head.html` (CSS + layout), `p2-hx.js` (shared data), `p3-scale.js`, `p4-fops8.js`, `p5-fopsx.js`
- `tools/build.js` – `node tools/build.js` rebuilds `index.html` from `src/`
- `tools/test-run.js` – Playwright walk-through
- `tools/photo-checklist.html` – phone checklist for photographing screens (saved in browser, exports PDF)
- `Handoff/` – current state, confirmed facts, assumptions, photos wanted
- `assets/` – icon, screenshots

## Editing
Change files in `src/`, then run `node tools/build.js` and commit both `src/` and `index.html`.
