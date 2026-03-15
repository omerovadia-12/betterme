# BetterMe — Quit Smoking Companion App

## Overview
A mobile-first PWA (Progressive Web App) designed to help the user quit smoking. Built for iPhone, installable to home screen. Helps manage urges in real-time and tracks progress.

## User Context
- Quitting tomorrow (2026-03-15)
- ~12–15 cigarettes/day
- Cost: 42 ₪ per pack, 20 cigs/pack
- Savings displayed in Shekels (₪) by default
- English language

## Tech Stack
- **UI**: Framework7 v8 (CDN, no build tools) — iOS-native look and feel
- **Styling**: Framework7 + custom CSS variables (css/app.css)
- **Icons**: Framework7 Icons v5
- **Data**: localStorage now → Supabase upgrade path in js/db.js
- **Audio**: Browser speechSynthesis (TTS) now → ElevenLabs mp3 files when generated
- **PWA**: manifest.json + sw.js service worker

## Architecture

```
betterme/
├── index.html          # App shell, all tab HTML, tool sheets, onboarding
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline + caching)
├── css/
│   └── app.css         # Custom styles on top of Framework7
├── js/
│   ├── config.js       # Supabase URL/key, ElevenLabs flag
│   ├── db.js           # Data layer (localStorage / Supabase)
│   ├── app.js          # F7 init + onboarding logic
│   ├── home.js         # Home tab
│   ├── tools.js        # All tools (breathing, PMR, timer, pushups, water)
│   ├── crisis.js       # Crisis tab
│   ├── plan.js         # My Plan tab (reasons, cards, if-then)
│   └── tracker.js      # Tracker tab + calendar
├── audio/              # ElevenLabs mp3 files (generated separately)
│   ├── breathing.mp3
│   └── pmr-short.mp3
│   └── pmr-long.mp3
├── icons/              # PWA icons (192x192, 512x512 PNG needed)
└── generate-audio.py   # Script to generate ElevenLabs audio
```

## App Sections (Bottom Nav — 5 tabs)
1. **Home** — streak, money saved, health milestone, quick crisis button
2. **Tools** — all 9 techniques as tappable cards
3. **Crisis** — full-screen 7-min timer + quick tools + support call
4. **My Plan** — CBT setup: reasons, coping cards, if-then plans, future self
5. **Tracker** — weekly calendar, streak, money saved, daily reminder

## Color Palette
```
--primary:     #2E7D5E  (forest green)
--crisis:      #D62839  (crisis red)
--bg:          #F5F5F0  (warm off-white)
--card:        #FFFFFF
--text:        #1C1C1E
--text-muted:  #6B6B6B
--success:     #34C759
--amber:       #F4A261
```

## Data Schema (localStorage keys prefixed `bm_`)
- `bm_profile`: `{ quitDate, cigsPerDay, costPerPack, packSize, currency, supportName, supportPhone, nopeCommitted }`
- `bm_reasons`: `[{ id, text }]`
- `bm_ifthen`: `[{ id, trigger, action }]`
- `bm_cards`: `[{ id, trigger, thought, response, action }]`
- `bm_future`: `[{ id, domain, smokingPath, quitPath }]`
- `bm_logs`: `{ 'YYYY-MM-DD': { smokeFree: boolean, note: string, loggedAt: string } }`
- `bm_onboarded`: `true`

## Supabase Upgrade Path
When user provides Supabase credentials:
1. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `js/config.js`
2. `db.js` detects these and uses Supabase instead of localStorage
3. Add Supabase CDN to index.html
4. All data migrates automatically on first Supabase-enabled launch

## ElevenLabs Audio
- When `CONFIG.USE_ELEVENLABS_AUDIO = true`, tools.js uses mp3 from `/audio/`
- Run `python generate-audio.py` with your ElevenLabs API key to generate files
- Voice: "Rachel" (calm, warm) or "Bella" — configure in generate-audio.py
- Until audio is generated, app uses browser speechSynthesis as fallback

## PWA / iPhone Home Screen
- Add to home screen via Safari → Share → "Add to Home Screen"
- Notifications work on iOS 16.4+ after adding to home screen
- Daily reminder at user-configured time prompts to log the day

## How to Run Locally
```bash
cd /Users/omerovadia/betterme
python3 -m http.server 8080
# Open Safari → http://localhost:8080
```

## Deployment
- Drag & drop folder to Vercel (vercel.com) or Netlify — free tier is sufficient
- Must be served over HTTPS for PWA/notifications to work on iPhone
