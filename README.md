# Ceymer Studios — site rebuild

"The studio with a pulse." Paper-warm, sticker-tactile, ADIN on every page.
One dark page: Hum City (on purpose).

## What's in here

```
index.html                  ← new landing page
assets/ceymer.css           ← the whole design system
assets/adin.js              ← ADIN companion: character, animations, chat
apps/adin/index.html        ← full 10-section case study (incl. iOS + ship log)
apps/scapeboard/index.html  ← case study (3 screenshot slots to fill)
apps/your-leader/index.html ← case study (3 screenshot slots to fill)
apps/hum-city/index.html    ← the dark one; credits John Vogel throughout
img/                        ← 19 extracted ADIN case-study figures + 5 iOS screenshots
server/                     ← Cloud Run chat backend (ceymer-chat)
```

## Deploying the site (Firebase Hosting)

Copy everything except `server/` into your Hosting `public/` folder,
preserving paths (`assets/`, `img/`, `apps/…`). Then:

```bash
firebase deploy --only hosting --project ceymer-studios-site
```

All asset references are root-relative (`/assets/…`, `/img/…`), matching your
existing convention.

## Deploying the chat backend (Cloud Run)

Same pattern as adin-server:

```bash
cd server
gcloud run deploy ceymer-chat \
  --source . \
  --region us-east1 \
  --project ceymer-studios-site \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

(Create the `GEMINI_API_KEY` secret in Secret Manager for that project first,
or reuse the adin-app project if you'd rather keep one key.)

**The chat now calls `/api/chat` on your own domain**, proxied to Cloud Run
by a Firebase Hosting rewrite — no CORS and no hostname to go stale.
Full step-by-step in `WIRING-THE-BRAIN.md`.

**Until the backend is live, the chat still works** — free-text questions get
a friendly "my smart-brain is napping" fallback into the scripted answers.
Nothing breaks.

## Screenshot slots to fill

Two case pages have dashed placeholder slots — drop files into `/img/` with
these names and the pages pick them up (or tell Claude/Gemini to swap the
`<div class="slot">` for a `<div class="frame"><img …>`):

- Scapeboard: `scape-estimate.png`, `scape-invoice.png`, `scape-plant.png`
- Your Leader: `yl-reps.png`, `yl-detail.png`, `yl-ai.png`

## ADIN companion — how it behaves

- Bobs idly, blinks, pupils follow the cursor (desktop only)
- Greets once per browser session
- Comments on sections as you scroll (any element with a `data-adin="…"` attribute)
- Click → chat panel: scripted quick-reply chips + free-text AI
- Triple-click him for a spin
- `prefers-reduced-motion` disables all decorative movement
- To add commentary anywhere: `<section data-adin="What ADIN says here">`
- To make ADIN speak from your own scripts: `window.adinSay('text')`

## Editing the scripted answers

They live at the top of `assets/adin.js` in the `SCRIPT` object — plain text,
edit freely. The AI's knowledge lives in `server/index.js` in `SYSTEM_PROMPT`.
