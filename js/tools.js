// ─── Tools ────────────────────────────────────────────────────────────────────

const BMTools = {

  // ── Audio ─────────────────────────────────────────────────────────────────
  _audio: null,

  _playAudio(filename, onEnd) {
    this._stopAudio();
    this._audio = new Audio(`audio/${filename}`);
    if (onEnd) this._audio.addEventListener('ended', onEnd);
    this._audio.play().catch(() => { if (onEnd) setTimeout(onEnd, 3000); });
  },

  _stopAudio() {
    if (this._audio) {
      this._audio.pause();
      this._audio.currentTime = 0;
      this._audio = null;
    }
  },

  // Soft sine-wave bowl tone — phase transition cue (no file needed)
  _playTone(hz = 432, durationSec = 1.2) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = hz;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationSec);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + durationSec);
    } catch (e) {}
  },

  _stopAll() {
    this._stopBreath();
    this._stopPMR();
    clearInterval(this._timerInterval);
    this._timerRunning = false;
    clearInterval(this._waterInterval);
    this._waterRunning = false;
    this._stopAudio();
  },

  // ── Breathing (4-7-8 + Urge Surfing) ─────────────────────────────────────
  _breathSeq: null,
  _breathTimer: null,
  _breathCycle: 0,
  _breathRunning: false,

  openBreathing() {
    this._stopAll();
    f7App.sheet.open('#sheet-breathing');
    this.resetBreathing();
  },

  stopBreathing() {
    this._stopBreath();
    f7App.sheet.close('#sheet-breathing');
  },

  resetBreathing() {
    this._stopBreath();
    document.getElementById('breath-circle').className = 'breath-circle';
    document.getElementById('breath-phase').textContent = 'Ready';
    document.getElementById('breath-count').textContent = '';
    document.getElementById('breath-prompt').textContent = "A craving has arrived. Let's breathe through it together.";
    document.getElementById('breath-subtext').textContent = 'Cravings are waves — they rise, peak, and pass.';
    document.getElementById('breath-start-btn').textContent = 'Start';
    [0,1,2,3].forEach(i => {
      const d = document.getElementById(`cd-${i}`);
      d.className = 'cycle-dot';
    });
    this._breathCycle = 0;
  },

  startBreathing() {
    if (this._breathRunning) return;
    this._breathRunning = true;
    document.getElementById('breath-start-btn').textContent = 'Running…';
    document.getElementById('breath-start-btn').disabled = true;

    if (CONFIG.USE_ELEVENLABS_AUDIO) {
      // Audio mode: circle runs its own autonomous loop timed to 0.85× speed.
      // Voice sets the mood; circle gives exact breathing timing. No drift.
      this._playAudio('breathing.mp3');
      this._runAudioBreath();
    } else {
      // No audio: script-driven with Web Speech API (perfectly synced).
      this._runScript([
        { phase: 'intro',  prompt: "Find a comfortable position. Place one hand on your belly.", subtext: "", duration: 3500 },
        { phase: 'intro',  prompt: "Notice where you feel the craving.", subtext: "Don't push it away — just observe.", duration: 4000 },
        { phase: 'inhale', prompt: "Breathe in through your nose…", subtext: "Slow and steady",           duration: 4000, count: 4, cycle: 0 },
        { phase: 'hold',   prompt: "Hold…",                         subtext: "Stay with it",               duration: 7000, count: 7, cycle: 0 },
        { phase: 'exhale', prompt: "Breathe out slowly…",           subtext: "Let it all go",              duration: 8000, count: 8, cycle: 0 },
        { phase: 'inhale', prompt: "Again. Breathe in…",            subtext: "Feel your body softening",   duration: 4000, count: 4, cycle: 1 },
        { phase: 'hold',   prompt: "Hold…",                         subtext: "",                           duration: 7000, count: 7, cycle: 1 },
        { phase: 'exhale', prompt: "And breathe out…",              subtext: "Notice how the craving shifts", duration: 8000, count: 8, cycle: 1 },
        { phase: 'inhale', prompt: "One more. In through the nose…",subtext: "",                           duration: 4000, count: 4, cycle: 2 },
        { phase: 'hold',   prompt: "Hold…",                         subtext: "The wave is already breaking", duration: 7000, count: 7, cycle: 2 },
        { phase: 'exhale', prompt: "Long breath out…",              subtext: "Let it go completely",       duration: 8000, count: 8, cycle: 2 },
        { phase: 'inhale', prompt: "Final breath in…",              subtext: "",                           duration: 4000, count: 4, cycle: 3 },
        { phase: 'hold',   prompt: "Hold…",                         subtext: "",                           duration: 7000, count: 7, cycle: 3 },
        { phase: 'exhale', prompt: "And breathe out…",              subtext: "Completely. Fully. Done.",   duration: 8000, count: 8, cycle: 3 },
        { phase: 'done',   prompt: "You made it through.",          subtext: "The craving has passed. Real strength.", duration: 5000 },
      ], 0);
    }
  },

  // Audio mode: intro mp3 plays first, cycles start on its 'ended' event.
  // Coaching tips play between cycles (also via ended event). No hardcoded delays.
  // Phase transitions cued by soft bowl tones. Visual countdown runs at true 4-7-8.
  _runAudioBreath() {
    document.getElementById('breath-prompt').textContent  = 'Close your eyes. Listen.';
    document.getElementById('breath-subtext').textContent = '';

    this._playAudio('breathing-intro.mp3', () => {
      if (this._breathRunning) this._startBreathCycles();
    });
  },

  _startBreathCycles() {
    const INHALE = 4000, HOLD = 7000, EXHALE = 8000;
    const TIPS = ['breathing-tip1.mp3', 'breathing-tip2.mp3', 'breathing-tip3.mp3'];
    let cycle = 0;

    const runCycle = () => {
      if (!this._breathRunning) return;
      if (cycle >= 4) { this._finishBreathing(); return; }

      [0,1,2,3].forEach(i => {
        document.getElementById(`cd-${i}`).className = 'cycle-dot' +
          (i < cycle ? ' done' : i === cycle ? ' active' : '');
      });

      // Inhale — 528 Hz (bright, ascending)
      this._playTone(528, 1.2);
      this._applyStep({ phase: 'inhale', prompt: 'Breathe in…', subtext: '', count: 4, cycle });
      this._countdown(4, INHALE);
      this._breathTimer = setTimeout(() => {
        if (!this._breathRunning) return;

        // Hold — 396 Hz (stable, grounding)
        this._playTone(396, 1.0);
        this._applyStep({ phase: 'hold', prompt: 'Hold…', subtext: '', count: 7, cycle });
        this._countdown(7, HOLD);
        this._breathTimer = setTimeout(() => {
          if (!this._breathRunning) return;

          // Exhale — 432 Hz (releasing, soft)
          this._playTone(432, 1.4);
          this._applyStep({ phase: 'exhale', prompt: 'Breathe out…', subtext: '', count: 8, cycle });
          this._countdown(8, EXHALE);
          this._breathTimer = setTimeout(() => {
            const done = cycle;
            cycle++;

            // Reset circle to neutral while tip plays
            document.getElementById('breath-circle').className = 'breath-circle';
            document.getElementById('breath-phase').textContent  = '';
            document.getElementById('breath-count').textContent  = '';

            if (done < 3) {
              // Play coaching tip then start next cycle
              document.getElementById('breath-prompt').textContent = '…';
              this._playAudio(TIPS[done], () => {
                if (this._breathRunning) runCycle();
              });
            } else {
              // Last cycle — play closing while showing done state
              this._playAudio('breathing-closing.mp3');
              this._finishBreathing();
            }
          }, EXHALE);
        }, HOLD);
      }, INHALE);
    };

    runCycle();
  },

  _runScript(script, idx) {
    if (!this._breathRunning || idx >= script.length) {
      this._finishBreathing();
      return;
    }
    const step = script[idx];
    this._applyStep(step);

    // TTS narration
    this._speak(step.prompt, step.duration);

    // Countdown ticker if needed
    if (step.count) this._countdown(step.count, step.duration);

    this._breathTimer = setTimeout(() => this._runScript(script, idx + 1), step.duration);
  },

  _applyStep(step) {
    const circle  = document.getElementById('breath-circle');
    const phase   = document.getElementById('breath-phase');
    const count   = document.getElementById('breath-count');
    const prompt  = document.getElementById('breath-prompt');
    const subtext = document.getElementById('breath-subtext');

    prompt.textContent  = step.prompt;
    subtext.textContent = step.subtext || '';

    circle.className = 'breath-circle';
    if (step.phase === 'inhale') { circle.classList.add('inhale'); phase.textContent = 'Breathe In'; }
    else if (step.phase === 'hold')   { circle.classList.add('hold');   phase.textContent = 'Hold'; }
    else if (step.phase === 'exhale') { circle.classList.add('exhale'); phase.textContent = 'Breathe Out'; }
    else { phase.textContent = ''; count.textContent = ''; }

    if (step.cycle !== undefined) {
      [0,1,2,3].forEach(i => {
        const d = document.getElementById(`cd-${i}`);
        d.className = 'cycle-dot' + (i < step.cycle ? ' done' : i === step.cycle ? ' active' : '');
      });
    }
  },

  _countdown(seconds, totalMs) {
    let remaining = seconds;
    document.getElementById('breath-count').textContent = remaining;
    const interval = setInterval(() => {
      remaining--;
      const el = document.getElementById('breath-count');
      if (el) el.textContent = remaining > 0 ? remaining : '';
      if (remaining <= 0) clearInterval(interval);
    }, totalMs / seconds);
  },

  _finishBreathing() {
    this._breathRunning = false;
    document.getElementById('breath-circle').className = 'breath-circle';
    document.getElementById('breath-phase').textContent = '✓';
    document.getElementById('breath-count').textContent = '';
    document.getElementById('breath-prompt').textContent = "You made it through. The craving has passed.";
    document.getElementById('breath-subtext').textContent = '';
    const btn = document.getElementById('breath-start-btn');
    btn.textContent = 'Start Again';
    btn.disabled = false;
    [0,1,2,3].forEach(i => document.getElementById(`cd-${i}`).className = 'cycle-dot done');
  },

  _stopBreath() {
    this._breathRunning = false;
    clearTimeout(this._breathTimer);
    window.speechSynthesis && window.speechSynthesis.cancel();
    this._stopAudio();
  },

  // ── PMR ───────────────────────────────────────────────────────────────────
  _pmrVersion: 'short',
  _pmrTimer: null,
  _pmrRunning: false,
  _pmrStep: 0,

  PMR_SHORT: [
    { name: "Shoulders & Fists", instruction: "Shrug shoulders to ears, squeeze hands into fists.", tense: "Tense everything", release: "Drop it all", tenseSec: 6, releaseSec: 15 },
    { name: "Belly", instruction: "Breathe in and pull your navel toward your spine.", tense: "Hold it tight", release: "Soften completely", tenseSec: 6, releaseSec: 15 },
    { name: "Face", instruction: "Squeeze eyes, clench jaw, raise brows — whole face.", tense: "Scrunch it all", release: "Smooth and still", tenseSec: 6, releaseSec: 15 },
    { name: "Whole Body", instruction: "Tense every single muscle at once — legs, belly, arms, face.", tense: "Everything tight", release: "Let go completely", tenseSec: 6, releaseSec: 20 },
  ],

  PMR_LONG: [
    { name: "Feet & Toes", instruction: "Curl your toes downward hard, like gripping the floor.", tense: "Curl and grip", release: "Spread and soften", tenseSec: 6, releaseSec: 18 },
    { name: "Calves", instruction: "Press heels into the floor, flex feet toward you.", tense: "Hold the tension", release: "Let calves melt down", tenseSec: 6, releaseSec: 18 },
    { name: "Thighs", instruction: "Squeeze both thigh muscles firmly together.", tense: "Squeeze tight", release: "Legs heavy and loose", tenseSec: 6, releaseSec: 18 },
    { name: "Buttocks", instruction: "Tighten and clench both sides firmly.", tense: "Clench", release: "Soften fully", tenseSec: 6, releaseSec: 16 },
    { name: "Belly", instruction: "Breathe in, pull navel toward spine, brace your core.", tense: "Hold and brace", release: "Let it go soft", tenseSec: 6, releaseSec: 18 },
    { name: "Hands & Arms", instruction: "Make tight fists, feel tension through your forearms.", tense: "Squeeze hard", release: "Open hands, feel the warmth", tenseSec: 6, releaseSec: 18 },
    { name: "Shoulders", instruction: "Shrug both shoulders up toward your ears as high as they go.", tense: "Shrug and hold", release: "Drop them completely", tenseSec: 6, releaseSec: 18 },
    { name: "Neck", instruction: "Gently press the back of your head backward, mild tension.", tense: "Press and hold", release: "Neck long and free", tenseSec: 5, releaseSec: 16 },
    { name: "Jaw", instruction: "Clench jaw gently, press tongue to roof of mouth.", tense: "Clench", release: "Jaw slightly open, soft", tenseSec: 6, releaseSec: 18 },
    { name: "Whole Face", instruction: "Squeeze eyes, scrunch nose, raise brows — whole face.", tense: "Scrunch everything", release: "Completely smooth", tenseSec: 6, releaseSec: 18 },
    { name: "Full Body", instruction: "Tense every muscle at once from toes to face.", tense: "Everything tight", release: "Let go completely", tenseSec: 7, releaseSec: 25 },
  ],

  openPMR(version) {
    this._stopAll();
    this._pmrVersion = version || 'short';
    this.setPMRVersion(this._pmrVersion);
    f7App.sheet.open('#sheet-pmr');
    this.resetPMR();
  },

  setPMRVersion(v) {
    this._pmrVersion = v;
    document.getElementById('pmr-tab-short').classList.toggle('active', v === 'short');
    document.getElementById('pmr-tab-long').classList.toggle('active', v === 'long');
    if (!this._pmrRunning) this.resetPMR();
  },

  resetPMR() {
    this._stopPMR();
    this._pmrStep = 0;
    document.getElementById('pmr-muscle-name').textContent = 'Ready to begin';
    document.getElementById('pmr-instruction').textContent = 'Sit or lie comfortably. Let your eyes close.';
    document.getElementById('pmr-phase').textContent = 'Prepare';
    document.getElementById('pmr-phase').className = 'pmr-phase active';
    document.getElementById('pmr-start-btn').textContent = 'Start';
    document.getElementById('pmr-start-btn').disabled = false;
    const steps = this._pmrVersion === 'short' ? this.PMR_SHORT : this.PMR_LONG;
    document.getElementById('pmr-progress').innerHTML = steps.map(() => '<div class="cycle-dot"></div>').join('');
  },

  startPMR() {
    if (this._pmrRunning) return;
    this._pmrRunning = true;
    if (CONFIG.USE_ELEVENLABS_AUDIO) {
      this._playAudio(this._pmrVersion === 'short' ? 'pmr-short.mp3' : 'pmr-long.mp3');
    }
    document.getElementById('pmr-start-btn').textContent = 'Running…';
    document.getElementById('pmr-start-btn').disabled = true;
    this._pmrStep = 0;
    const steps = this._pmrVersion === 'short' ? this.PMR_SHORT : this.PMR_LONG;

    // Intro
    this._updatePMR('Take three slow breaths', 'Breathe in… and out. Settle into this moment.', 'Settling');
    this._speak("Let's begin. Take three slow breaths and settle into this moment.", 5000);

    this._pmrTimer = setTimeout(() => this._runPMR(steps, 0), 5000);
  },

  _runPMR(steps, idx) {
    if (!this._pmrRunning || idx >= steps.length) {
      this._finishPMR();
      return;
    }
    const s = steps[idx];

    // Mark progress dot
    const dots = document.getElementById('pmr-progress').querySelectorAll('.cycle-dot');
    dots.forEach((d, i) => d.className = 'cycle-dot' + (i < idx ? ' done' : i === idx ? ' active' : ''));

    // Tense phase
    this._updatePMR(s.name, s.instruction, s.tense);
    this._speak(`${s.name}. ${s.instruction} ${s.tense}.`, s.tenseSec * 1000);

    this._pmrTimer = setTimeout(() => {
      if (!this._pmrRunning) return;
      // Release phase
      this._updatePMR(s.name, s.release, 'Release');
      this._speak(`Release. ${s.release}.`, s.releaseSec * 1000);

      this._pmrTimer = setTimeout(() => this._runPMR(steps, idx + 1), s.releaseSec * 1000);
    }, s.tenseSec * 1000);
  },

  _updatePMR(name, instruction, phase) {
    document.getElementById('pmr-muscle-name').textContent = name;
    document.getElementById('pmr-instruction').textContent = instruction;
    document.getElementById('pmr-phase').textContent = phase;
  },

  _finishPMR() {
    this._pmrRunning = false;
    this._updatePMR('✓ Complete', 'Scan your body from head to toe. Notice the quiet.', 'Done');
    this._speak("You've completed the practice. Take a moment to feel the stillness in your body. The craving has passed. You did it.", 6000);
    document.getElementById('pmr-start-btn').textContent = 'Start Again';
    document.getElementById('pmr-start-btn').disabled = false;
    const dots = document.getElementById('pmr-progress').querySelectorAll('.cycle-dot');
    dots.forEach(d => d.className = 'cycle-dot done');
  },

  stopPMR() {
    this._stopPMR();
    f7App.sheet.close('#sheet-pmr');
  },

  _stopPMR() {
    this._pmrRunning = false;
    clearTimeout(this._pmrTimer);
    window.speechSynthesis && window.speechSynthesis.cancel();
    this._stopAudio();
  },

  // ── Wave Timer (7 min) ────────────────────────────────────────────────────
  _timerInterval: null,
  _timerRemaining: 420,
  _timerRunning: false,

  openTimer() {
    this._stopAll();
    f7App.sheet.open('#sheet-timer');
    this.resetTimer();
  },

  resetTimer() {
    clearInterval(this._timerInterval);
    this._timerRunning = false;
    this._timerRemaining = 420;
    this._updateTimerDisplay(420, 420);
    document.getElementById('timer-start-btn').textContent = 'Start';
    document.getElementById('timer-msg').textContent =
      "The most intense part of a craving lasts about 7 minutes. You just need to get through this window.";
  },

  toggleTimer() {
    if (this._timerRunning) {
      clearInterval(this._timerInterval);
      this._timerRunning = false;
      document.getElementById('timer-start-btn').textContent = 'Resume';
    } else {
      this._timerRunning = true;
      document.getElementById('timer-start-btn').textContent = 'Pause';
      this._timerInterval = setInterval(() => {
        this._timerRemaining--;
        this._updateTimerDisplay(this._timerRemaining, 420);

        if (this._timerRemaining <= 0) {
          clearInterval(this._timerInterval);
          this._timerRunning = false;
          document.getElementById('timer-msg').textContent = "✓ You made it. The craving has passed. Every craving you've ever had has passed — and this one did too.";
          document.getElementById('timer-start-btn').textContent = 'Start Again';
          document.getElementById('timer-start-btn').onclick = () => { this.resetTimer(); this.toggleTimer(); };
          this._speak("You made it. The craving has passed. You are stronger than the urge.", 5000);
        }

        // Encouraging messages mid-timer
        if (this._timerRemaining === 300) {
          document.getElementById('timer-msg').textContent = "Halfway there. The wave is already at its peak — it only goes down from here.";
        } else if (this._timerRemaining === 120) {
          document.getElementById('timer-msg').textContent = "Almost done. 2 minutes left. You've got this.";
        }
      }, 1000);
    }
  },

  _updateTimerDisplay(remaining, total) {
    const min = Math.floor(remaining / 60);
    const sec = String(remaining % 60).padStart(2, '0');
    document.getElementById('timer-display').textContent = `${min}:${sec}`;

    const circumference = 2 * Math.PI * 96;
    const progress = remaining / total;
    const arc = document.getElementById('timer-arc');
    if (arc) arc.style.strokeDashoffset = `${circumference * (1 - progress)}`;
  },

  stopTimer() {
    clearInterval(this._timerInterval);
    this._timerRunning = false;
    f7App.sheet.close('#sheet-timer');
  },

  // ── Push-ups ──────────────────────────────────────────────────────────────
  _pushupCount: 0,

  openPushups() {
    this._stopAll();
    this._pushupCount = 0;
    this._renderPushups();
    f7App.sheet.open('#sheet-pushups');
  },

  adjustPushups(delta) {
    this._pushupCount = Math.max(0, this._pushupCount + delta);
    this._renderPushups();
  },

  resetPushups() {
    this._pushupCount = 0;
    this._renderPushups();
  },

  _renderPushups() {
    document.getElementById('pushup-count').textContent = this._pushupCount;
    const msgs = ['', 'Keep going!', 'Great start!', 'You\'re doing it!', 'Strong!', '5 reps! Momentum building.', '', '', '', '', '10 reps! Channel that energy.', '', '', '', '', '15! Craving doesn\'t stand a chance.', '', '', '', '', '20 push-ups. You\'re unstoppable.'];
    document.getElementById('pushup-message').textContent = msgs[this._pushupCount] || (this._pushupCount > 20 ? `${this._pushupCount} reps. Incredible.` : '');
  },

  // ── Water ─────────────────────────────────────────────────────────────────
  _waterInterval: null,
  _waterRemaining: 120,
  _waterRunning: false,

  openWater() {
    this._stopAll();
    this._waterRemaining = 120;
    this._waterRunning = false;
    this._updateWaterDisplay(120);
    document.getElementById('water-start-btn').textContent = 'Start Sipping';
    document.getElementById('water-start-btn').disabled = false;
    f7App.sheet.open('#sheet-water');
  },

  toggleWater() {
    if (this._waterRunning) {
      clearInterval(this._waterInterval);
      this._waterRunning = false;
      document.getElementById('water-start-btn').textContent = 'Resume';
    } else {
      this._waterRunning = true;
      document.getElementById('water-start-btn').textContent = 'Pause';
      this._waterInterval = setInterval(() => {
        this._waterRemaining--;
        this._updateWaterDisplay(this._waterRemaining);
        if (this._waterRemaining <= 0) {
          clearInterval(this._waterInterval);
          this._waterRunning = false;
          document.getElementById('water-start-btn').textContent = '✓ Done';
          document.getElementById('water-start-btn').disabled = true;
        }
      }, 1000);
    }
  },

  _updateWaterDisplay(remaining) {
    const min = Math.floor(remaining / 60);
    const sec = String(remaining % 60).padStart(2, '0');
    document.getElementById('water-timer-display').textContent = `${min}:${sec}`;
  },

  // ── TTS (speech synthesis) ────────────────────────────────────────────────
  _speak(text, duration) {
    if (CONFIG.USE_ELEVENLABS_AUDIO) return; // mp3 files handle it
    if (!window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate  = 0.82;
    u.pitch = 0.9;
    u.volume = 1;

    // Prefer a calm voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') || v.name.includes('Karen') ||
      v.name.includes('Moira')    || v.name.includes('Tessa') ||
      (v.lang === 'en-US' && !v.name.includes('Google') && !v.name.includes('Alex'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferred) u.voice = preferred;
    window.speechSynthesis.speak(u);
  },
};
