# BetterMe — Project Progress

## What Is This
A mobile-first PWA (Progressive Web App) to help quit smoking. Designed to be used during cravings for real-time relief. Installable as a home screen shortcut on iPhone. Built for personal use starting **March 15, 2026**.

---

## What's Been Built

### Core App Structure
- **Framework7 v9.0.3** — iOS-native UI framework (tabs, popups, dialogs, sheets)
- **PWA setup** — manifest.json, service worker (sw.js), apple-mobile-web-app meta tags, offline caching
- **5-tab layout**: Home / Tools / Crisis / My Plan / Tracker
- **8-step onboarding** — collects quit date, smoking stats, N.O.P.E. commitment, support person, if-then plan, coping card

### Tabs & Features

#### 🏠 Home
- Days smoke-free counter
- ₪ money saved (calculated from your smoking profile)
- Cigarettes not smoked
- Health milestone card (auto-updates as time passes — 20min, 12hr, 1 day, 2 days...)

#### 🛠️ Tools (for use during cravings)
- **4-7-8 Breathing** — voice-narrated urge surfing script (ElevenLabs TTS)
- **PMR Short** (4 min) — Progressive Muscle Relaxation, voice narrated
- **PMR Long** (15 min) — Full body PMR, voice narrated
- **7-Minute Wave Timer** — animated SVG countdown ("ride the craving wave")
- **Push-ups Counter** — physical distraction with rep counter
- **Sip Water** — 30-second sipping timer

#### 🚨 Crisis Mode
- One-tap entry from Home tab
- 7-minute countdown timer with animated arc
- Quick access to all tools
- Your coping cards displayed
- Random reason from your why-list
- One-tap call to support person

#### 📋 My Plan
- N.O.P.E. banner (Not One Puff Ever commitment)
- Factual reframes card (evidence-based, not affirmations)
- **My Reasons** — add/delete personal reasons for quitting
- **If-Then Plans** — pre-committed behavioral scripts for triggers
- **Coping Cards** — craving thought → rational response → action
- Support person with one-tap call

#### 📊 Tracker
- Streak counter
- Weekly grid (Mon–Sun) with smoke-free/relapse logging
- Monthly calendar
- Money saved with context messages
- Daily reminder time picker
- Tips on days you didn't succeed

### Voice Narration
- **ElevenLabs TTS** — Sarah voice (mature, reassuring)
- Pre-generated mp3 files: `audio/breathing.mp3`, `audio/pmr-short.mp3`, `audio/pmr-long.mp3`
- Browser speechSynthesis fallback if audio files unavailable
- Generated via `generate-audio.py --api-key YOUR_KEY`

### Data Layer
- **localStorage** — primary layer (fast, offline)
- **Supabase** — cloud sync layer (data survives browser clears, works across devices)
- When Supabase credentials are empty, app runs on localStorage only
- All data prefixed `bm_` in localStorage / `bm_data` table in Supabase

### User Profile (set during onboarding)
- Cigarettes per day: 13 (default)
- Cost per pack: ₪42 (default)
- Pack size: 20
- Currency: ₪ (configurable)
- Quit date
- Support person name + phone
- N.O.P.E. commitment flag

---

## File Structure

```
betterme/
├── index.html          # App shell — all HTML, onboarding, modals
├── manifest.json       # PWA manifest
├── sw.js               # Service worker (offline caching)
├── generate-audio.py   # ElevenLabs audio generator
├── css/
│   └── app.css         # All custom styles
├── js/
│   ├── config.js       # API keys (Supabase, ElevenLabs flag)
│   ├── db.js           # Data layer (localStorage + Supabase sync)
│   ├── app.js          # Framework7 init + onboarding logic
│   ├── home.js         # Home tab
│   ├── tools.js        # All tool logic (breathing, PMR, timer, etc.)
│   ├── crisis.js       # Crisis tab
│   ├── plan.js         # My Plan tab
│   └── tracker.js      # Tracker tab
├── audio/
│   ├── breathing.mp3   # Generated — ElevenLabs Sarah voice
│   ├── pmr-short.mp3
│   └── pmr-long.mp3
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## Technical Decisions

| Decision | Choice | Reason |
|---|---|---|
| UI Framework | Framework7 v9.0.3 | iOS-native look and feel |
| CDN | unpkg.com | jsDelivr had 404s on F7 v9 paths |
| TTS | ElevenLabs (Sarah) + speechSynthesis fallback | Pre-generated for performance |
| Storage | localStorage + Supabase | Offline-first, cloud backup |
| Breathing technique | 4-7-8 (inhale 4 / hold 7 / exhale 8) | Evidence-based, superior to 4-5-6 |
| Affirmations | Replaced with N.O.P.E. + if-then + factual reframes | Pop affirmations don't work; evidence says pre-commitment does |
| Language | English | User preference |
| Currency | ₪ Shekels | User is Israeli |

---

## Known Issues / Decisions Made

- **Reasons slide removed from onboarding** — the + button had a CSS clipping bug that prevented clicks (the parent `overflow: hidden` clipped pointer events). Reasons can still be added from the My Plan tab after onboarding.
- **PWA icons** — currently plain green squares. Can be improved later.

---

## Next Steps

### 1. Create Accounts (You do this — 5 min)

| Service | URL | Notes |
|---|---|---|
| GitHub | github.com/signup | Free |
| Vercel | vercel.com → Continue with GitHub | Free, auto-deploys from GitHub |
| Supabase | supabase.com → Continue with GitHub | Free tier, 500MB |

---

### 2. Push to GitHub (Terminal)

```bash
cd /Users/omerovadia/betterme
git remote add origin https://github.com/YOUR_USERNAME/betterme.git
git push -u origin main
```

---

### 3. Deploy to Vercel

1. vercel.com → **Add New → Project**
2. Import your `betterme` GitHub repo
3. Leave all settings as-is → **Deploy**
4. You get a URL like `betterme.vercel.app`
5. On iPhone: open URL in Safari → Share → **Add to Home Screen**

---

### 4. Set Up Supabase

**Create the table** — go to Supabase → SQL Editor → run:

```sql
CREATE TABLE bm_data (
  key TEXT PRIMARY KEY,
  value JSONB
);
ALTER TABLE bm_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON bm_data FOR ALL USING (true) WITH CHECK (true);
```

**Get your credentials** — Supabase → Project Settings → API:
- Copy `Project URL`
- Copy `anon public` key

**Paste into `js/config.js`:**

```js
SUPABASE_URL: 'https://xxxxx.supabase.co',
SUPABASE_ANON_KEY: 'eyJ...',
```

**Push the update:**
```bash
git add js/config.js
git commit -m "Add Supabase credentials"
git push
```
Vercel auto-redeploys within ~30 seconds.

---

### 5. Optional Improvements (future)

- **Better app icons** — replace the plain green squares with a proper logo
- **Re-add Reasons to onboarding** — fix the CSS clipping bug properly so the + button works inline during setup
- **Supabase Auth** — add login so data syncs across multiple devices (currently uses anon access, single-device cloud backup only)
- **Push notifications** — daily reminder to log your day (requires HTTPS, already handled by Vercel deploy)
- **Relapse recovery flow** — if you slip, a guided "get back on track" screen
- **Milestone celebrations** — full-screen animation when hitting key milestones (20 min, 1 day, 1 week, 1 month, 1 year)
