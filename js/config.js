// ─── BetterMe Configuration ───────────────────────────────────────────────────
// Fill in Supabase credentials to enable cloud persistence (data survives
// browser clears). Leave empty to use localStorage.

const CONFIG = {
  // Supabase — get these from supabase.com → Project Settings → API
  SUPABASE_URL: 'https://yothtmelvamzkirplksn.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdGh0bWVsdmFtemtpcnBsa3NuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjQyNTQsImV4cCI6MjA4OTE0MDI1NH0.xqIT1q4lGe23usK-k5wzmXNm7wwXxKuKzxW2r5ybxUY',

  // ElevenLabs — set to true after running generate-audio.py
  USE_ELEVENLABS_AUDIO: true,

  // App
  APP_NAME: 'BetterMe',
  VERSION: '1.0.0',
};
