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
- **Deployed** on Vercel (auto-deploys on every `git push`)
- **Cloud sync** via Supabase — data survives browser clears and works across devices

### Tabs & Features

#### 🏠 Home
- Days smoke-free counter
- ₪ money saved (calculated from smoking profile)
- Cigarettes not smoked
- Health milestone card (auto-updates — 20min, 12hr, 1 day, 2 days, 2 weeks, 1 month, 1 year...)

#### 🛠️ Tools (for use during cravings)
- **4-7-8 Breathing** — narrated by ElevenLabs Sarah voice; circle animates the exact 4-7-8 timing; soft bowl tones (528/396/432 Hz) mark each phase; coaching tips play between cycles
- **PMR Short** (4 min) — Progressive Muscle Relaxation, voice narrated
- **PMR Long** (15 min) — Full body PMR, 11 muscle groups, voice narrated
- **7-Minute Wave Timer** — animated SVG countdown ("ride the craving wave")
- **Push-ups Counter** — physical distraction with rep counter
- **Sip Water** — 2-minute sipping timer

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

### Voice Narration — Architecture
- **ElevenLabs Sarah voice** — speed 0.75, stability 0.85, low style (calm, not dramatic)
- **Breathing**: 5 separate mp3 files played by JS at exactly the right moment via `ended` events — no timing drift possible
  - `breathing-intro.mp3` — opening narration while circle is at rest
  - `breathing-tip1/2/3.mp3` — coaching tip between each cycle
  - `breathing-closing.mp3` — closing after 4th cycle
- **PMR**: single mp3 files (`pmr-short.mp3`, `pmr-long.mp3`) — narration runs alongside visual
- **Fallback**: browser `speechSynthesis` if ElevenLabs files not present
- **Phase transition tones**: Web Audio API sine waves (528Hz inhale / 396Hz hold / 432Hz exhale) — no file needed, generated live

### Data Layer
- **localStorage** — primary layer (fast, offline, immediate)
- **Supabase** — cloud sync (every write also pushes to cloud; on app start, cloud data is pulled down)
- All data prefixed `bm_` in localStorage / `key-value` rows in Supabase `bm_data` table

### User Profile (set during onboarding)
- Cigarettes per day, cost per pack, pack size, currency (₪ default)
- Quit date, support person name + phone, N.O.P.E. commitment flag

---

## File Structure

```
betterme/
├── index.html               # App shell — all HTML, onboarding, modals
├── manifest.json            # PWA manifest
├── sw.js                    # Service worker (offline caching, v2 cache)
├── generate-audio.py        # ElevenLabs audio generator
├── PROGRESS.md              # This file
├── css/
│   └── app.css              # All custom styles
├── js/
│   ├── config.js            # API keys (Supabase URL+key, ElevenLabs flag)
│   ├── db.js                # Data layer (localStorage + Supabase sync)
│   ├── app.js               # Framework7 init + onboarding logic
│   ├── home.js              # Home tab
│   ├── tools.js             # All tool logic (breathing, PMR, timer, etc.)
│   ├── crisis.js            # Crisis tab
│   ├── plan.js              # My Plan tab
│   └── tracker.js           # Tracker tab
├── audio/
│   ├── breathing-intro.mp3  # ElevenLabs — opening narration
│   ├── breathing-tip1.mp3   # "Good. Your nervous system is calming down."
│   ├── breathing-tip2.mp3   # "The craving is already shifting."
│   ├── breathing-tip3.mp3   # "One more cycle. Almost through it."
│   ├── breathing-closing.mp3# "You made it. Every craving passes."
│   ├── pmr-short.mp3        # PMR 4-min narration
│   └── pmr-long.mp3         # PMR 15-min narration
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
| TTS | ElevenLabs (Sarah) speed 0.75 + speechSynthesis fallback | Pre-generated for performance; slower pace is calmer |
| Breathing narration | 5-file split, JS-timed via `ended` events | Only way to avoid counting conflict; no silence gaps needed |
| Phase cues | Web Audio API sine waves | Perfect sync, no extra files |
| Narration style | Coach speaks between phases only, never during | Double-counting creates cognitive load; MBSR research supports this |
| Storage | localStorage + Supabase | Offline-first, cloud backup |
| Breathing technique | 4-7-8 (inhale 4 / hold 7 / exhale 8) | Evidence-based, superior to 4-5-6 |
| Affirmations | Replaced with N.O.P.E. + if-then + factual reframes | Pop affirmations don't work; evidence says pre-commitment does |
| Language | English | User preference |
| Currency | ₪ Shekels | User is Israeli |

---

## Known Issues / Decisions Made

- **Reasons slide removed from onboarding** — the + button was clipped by `overflow: hidden` on a parent. Reasons can be added from the My Plan tab after onboarding.
- **PWA icons** — currently plain green squares. Can be improved.
- **PMR narration not yet updated** — speed and sync changes pending user approval of breathing version first.

---

## Regenerating Audio

Run this any time you need to regenerate:

```bash
cd /Users/omerovadia/betterme
python3 generate-audio.py --api-key YOUR_ELEVENLABS_KEY
```

Then push:
```bash
git add audio/
git commit -m "Regenerate audio"
git push
```

---

## Deployment

- **GitHub**: github.com/omerovadia-12/betterme
- **Vercel**: auto-deploys on every push to `main`
- **Supabase**: connected — credentials in `js/config.js`

To redeploy manually: just `git push` — Vercel picks it up in ~30 seconds.

---

## Next Steps

### Immediate — Pending Your Feedback
1. **Test breathing audio** — regenerate the 5 new files and check if speed 0.75 + no-counting feels right
2. **If approved → apply to PMR**:
   - Same speed (0.75) for `pmr-short.mp3` and `pmr-long.mp3`
   - Adjust tense/release JS timers in `tools.js` to stay in sync with slower audio
   - Update duration labels ("4 min" / "15 min") on tool cards to reflect new pacing

### Optional Improvements
- **Better app icons** — replace plain green squares with a proper logo
- **Re-add Reasons to onboarding** — properly fix the overflow clipping so + button works inline
- **Milestone celebrations** — full-screen animation at key milestones (1 day, 1 week, 1 month, 1 year)
- **Relapse recovery flow** — if you slip, a guided "get back on track" screen
- **Supabase Auth** — add login so data syncs across multiple devices (currently single-device cloud backup)
