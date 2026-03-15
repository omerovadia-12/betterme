#!/usr/bin/env python3
"""
BetterMe — ElevenLabs Audio Generator
Generates all narration audio files for the breathing and PMR tools.

Usage:
  python3 generate-audio.py --api-key YOUR_ELEVENLABS_API_KEY

After running:
  1. mp3 files will be saved to ./audio/
  2. Set CONFIG.USE_ELEVENLABS_AUDIO = true in js/config.js
"""

import argparse
import os
import sys

try:
    import requests
except ImportError:
    print("Installing requests...")
    os.system(f"{sys.executable} -m pip install requests")
    import requests

# ─── Voice Config ──────────────────────────────────────────────────────────────
# "Rachel" — calm, warm, American female. Good for breathing exercises.
# Alternatives: "Bella", "Elli", "Domi", "Dorothy"
VOICE_ID = "EXAVITQu4vr4xnSDxMaL"  # Sarah — Mature, Reassuring, Confident (free premade)
MODEL_ID  = "eleven_turbo_v2"

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "audio")

# ─── Scripts ───────────────────────────────────────────────────────────────────

BREATHING_SCRIPT = """
Close your eyes. A craving has arrived — that's okay. Follow the circle and breathe with me.

Breathe in... one... two... three... four.

Hold... one... two... three... four... five... six... seven.

Breathe out... one... two... three... four... five... six... seven... eight.

Good.

Breathe in... one... two... three... four.

Hold... one... two... three... four... five... six... seven.

Breathe out... one... two... three... four... five... six... seven... eight.

Good.

Breathe in... one... two... three... four.

Hold... one... two... three... four... five... six... seven.

Breathe out... one... two... three... four... five... six... seven... eight.

Good.

Breathe in... one... two... three... four.

Hold... one... two... three... four... five... six... seven.

And release... one... two... three... four... five... six... seven... eight.

You made it. The craving has passed. That was real strength.
"""

PMR_SHORT_SCRIPT = """
You've got this. Let's take four minutes to get through this craving together.

Find a comfortable position — sitting or lying down. Let your eyes close if that's comfortable.

One slow breath in... and out. Good. Let's begin.

Shoulders and hands. Shrug your shoulders up toward your ears as high as they'll go. At the same time, squeeze both hands into tight fists. Breathe in and hold everything tense.

...

And release. Drop your shoulders, open your hands wide, breathe out completely.

Feel the tension drain away.

...

Belly. Breathe in and tighten your abdominal muscles — pulling your navel gently inward, bracing your core. Hold.

...

Let it go completely on the exhale. Soft belly. Easy breath.

...

Face. Squeeze your jaw, scrunch your nose and eyes, raise your brows — tense your whole face.

Hold.

...

Let everything go smooth and soft. Jaw open slightly, eyes resting.

...

Final release. Take the deepest breath you can and tense every muscle in your body at once — legs, belly, fists, shoulders, face — everything.

Hold.

...

And let go completely on the exhale. Every single muscle. Let your whole body go limp and heavy.

...

Take one more slow breath. Feel how your body has changed in just these few minutes.

This craving is already passing. It always does. You are stronger than this urge.

Gently come back when you're ready. You did it.
"""

PMR_LONG_SCRIPT = """
Welcome. This practice is here for you right now — to help you ride out this moment and return to calm.

Find a comfortable position — sitting or lying down. Let your hands rest loosely in your lap or at your sides. If it feels right, gently close your eyes.

Let's begin with a few slow breaths.

Breathe in through your nose... for four counts. One... two... three... four.

Hold gently... two... three... four.

And exhale slowly through your mouth... two... three... four... five... six.

Let's do that once more. Breathe in... two... three... four. And release... slowly... completely.

Good. With each breath, you're already beginning to let go.

Feet and toes. Curl your toes tightly downward — as if you're gripping the floor with them. Squeeze... hold that tension.

...

And release. Let your toes spread open and your feet go completely soft.

...

Notice the difference. That warmth and heaviness — that's relaxation moving in.

Calves. Press your heels gently into the floor and flex your feet upward. Feel the tension build in the back of your lower legs. Hold it.

...

And release. Let your calves go soft and heavy.

...

Thighs. Squeeze the large muscles of both thighs together — firm and strong. Inhale and hold.

...

And let go. Let your legs become loose and heavy, sinking down with gravity.

...

Belly. Take a breath in, and tighten your abdominal muscles. Hold.

...

And breathe out and let it all go. Let your belly become soft and easy with every exhale.

...

Hands and forearms. Make tight fists — squeeze your fingers into your palms. Feel the tension running from your fingertips up through your forearms. Hold.

...

Open your hands slowly. Let your fingers spread wide... and then rest softly. Feel the warmth spreading into your palms.

...

These hands don't need to hold anything right now.

Shoulders. Take a breath in and shrug them up toward your ears — as high as they'll go. Hold them there. Feel that familiar place where you carry stress.

...

And drop them. All the way down. Exhale completely.

...

Notice how much lower and softer they feel now. Let them stay there.

Jaw and face. Clench your jaw gently — press your back teeth together and press your tongue against the roof of your mouth. Feel the tension through your jaw and cheeks.

...

Let it go. Let your jaw drop slightly open. Let your tongue rest softly at the bottom of your mouth.

...

There's nothing you need to say or hold onto right now.

Finally, raise your eyebrows as high as you can — wrinkling the forehead. Feel the stretch and tension across your brow.

...

And release. Let your brow become completely smooth. Let the muscles of your forehead and scalp melt and settle.

...

Now take a slow, gentle breath and let your awareness travel from the top of your head... all the way down your face... your neck and shoulders... your arms and hands... your chest and belly... your back... all the way down to your feet.

Notice how your body feels now compared to when you started. Softer. Heavier. Quieter.

This moment of calm belongs to you. The urge that may have brought you here — it is already beginning to pass. Cravings peak and they fall. You are simply riding this wave.

When you're ready, begin to wiggle your fingers and toes gently. Take a deeper breath. And when it feels right, slowly open your eyes.

You made it through. Well done.
"""

# ─── Generator ─────────────────────────────────────────────────────────────────

AUDIO_FILES = [
    ("breathing.mp3",  BREATHING_SCRIPT),
    ("pmr-short.mp3",  PMR_SHORT_SCRIPT),
    ("pmr-long.mp3",   PMR_LONG_SCRIPT),
]

def generate_audio(api_key: str, text: str, output_path: str):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    payload = {
        "text": text.strip(),
        "model_id": MODEL_ID,
        "voice_settings": {
            "stability":         0.80,
            "similarity_boost":  0.75,
            "style":             0.2,
            "use_speaker_boost": True,
            "speed":             0.85,
        },
    }
    print(f"  Generating {os.path.basename(output_path)}...")
    resp = requests.post(url, json=payload, headers=headers, timeout=120)
    if resp.status_code != 200:
        print(f"  ✗ Error {resp.status_code}: {resp.text[:200]}")
        return False

    with open(output_path, "wb") as f:
        f.write(resp.content)
    size_kb = len(resp.content) // 1024
    print(f"  ✓ Saved ({size_kb} KB)")
    return True


def main():
    global VOICE_ID
    parser = argparse.ArgumentParser(description="Generate BetterMe audio files via ElevenLabs")
    parser.add_argument("--api-key", required=True, help="Your ElevenLabs API key")
    parser.add_argument("--voice",   default=VOICE_ID, help=f"ElevenLabs voice ID (default: Rachel = {VOICE_ID})")
    args = parser.parse_args()

    VOICE_ID = args.voice

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"\nBetterMe Audio Generator")
    print(f"Voice ID: {VOICE_ID}")
    print(f"Output:   {OUTPUT_DIR}/\n")

    success = 0
    for filename, script in AUDIO_FILES:
        path = os.path.join(OUTPUT_DIR, filename)
        if generate_audio(args.api_key, script, path):
            success += 1

    print(f"\n{'─' * 40}")
    print(f"Generated {success}/{len(AUDIO_FILES)} files.\n")

    if success == len(AUDIO_FILES):
        print("✓ All done! Now open js/config.js and set:")
        print("    USE_ELEVENLABS_AUDIO: true\n")
    else:
        print("Some files failed. Check your API key and retry.\n")


if __name__ == "__main__":
    main()
