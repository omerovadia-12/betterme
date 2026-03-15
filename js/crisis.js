// ─── Crisis Tab ───────────────────────────────────────────────────────────────

const BMCrisis = {
  _interval: null,
  _remaining: 420,
  _running: false,
  _total: 420,

  render() {
    const p = DB.getProfile();
    const cards = DB.getCards();
    const supportName  = p.supportName  || 'your support person';
    const supportPhone = p.supportPhone || '';

    document.getElementById('crisis-content').innerHTML = `
      <!-- Timer -->
      <div class="crisis-timer-section">
        <div class="crisis-wave-text">
          The most intense part of a craving lasts <strong>~7 minutes</strong>.<br>
          Start the timer and ride it out.
        </div>
        <div class="crisis-timer-svg-wrap">
          <svg class="crisis-timer-svg" viewBox="0 0 180 180" width="180" height="180">
            <circle fill="none" stroke="#F5E6E8" stroke-width="8" cx="90" cy="90" r="78"/>
            <circle id="crisis-arc" fill="none" stroke="#D62839" stroke-width="8"
              stroke-linecap="round" cx="90" cy="90" r="78"
              stroke-dasharray="490.1" stroke-dashoffset="0"/>
          </svg>
          <div class="crisis-time-display">
            <div class="crisis-time-num" id="crisis-time">7:00</div>
          </div>
        </div>
        <div class="crisis-timer-controls">
          <button class="crisis-timer-btn crisis-start-btn" id="crisis-start-btn" onclick="BMCrisis.toggle()">Start Timer</button>
          <button class="crisis-timer-btn crisis-reset-btn" onclick="BMCrisis.reset()">Reset</button>
        </div>
      </div>

      <!-- Quick Tools -->
      <div class="crisis-quick-tools">
        <h3>Quick Relief</h3>
        <div class="crisis-tools-grid">
          <button class="crisis-tool-card" onclick="BMTools.openBreathing()">
            <div class="ct-icon">🫁</div>
            <div class="ct-name">Breathe</div>
          </button>
          <button class="crisis-tool-card" onclick="BMTools.openPMR('short')">
            <div class="ct-icon">🧘</div>
            <div class="ct-name">Relax</div>
          </button>
          <button class="crisis-tool-card" onclick="BMTools.openPushups()">
            <div class="ct-icon">💪</div>
            <div class="ct-name">Push-ups</div>
          </button>
          <button class="crisis-tool-card" onclick="BMTools.openWater()">
            <div class="ct-icon">💧</div>
            <div class="ct-name">Water</div>
          </button>
        </div>
      </div>

      <!-- Coping Cards -->
      ${cards.length > 0 ? `
      <div class="crisis-cards-section">
        <h3>Your Coping Cards</h3>
        ${cards.map(c => `
          <div class="crisis-card-item">
            ${c.thought ? `<div class="crisis-card-trigger">"${c.thought}"</div>` : ''}
            <div class="crisis-card-response">${c.response}</div>
            ${c.action ? `<div style="font-size:12px;color:var(--primary);font-weight:600;margin-top:6px">→ ${c.action}</div>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- Your Reasons -->
      ${this._renderReasonsBanner()}

      <!-- Support Call -->
      ${supportPhone ? `
        <a class="crisis-support-btn" href="tel:${supportPhone}">
          <span>📞</span> Call ${supportName}
        </a>
      ` : `
        <div style="margin:0 16px 16px;text-align:center;color:var(--text-muted);font-size:13px">
          Add a support person in My Plan to enable one-tap calling.
        </div>
      `}
    `;

    // Reset timer state
    this._remaining = 420;
    this._running   = false;
    this._updateDisplay(420, 420);
  },

  _renderReasonsBanner() {
    const reasons = DB.getReasons();
    if (!reasons.length) return '';
    const random = reasons[Math.floor(Math.random() * reasons.length)];
    return `
      <div style="background:var(--primary-light);margin:0 16px 16px;border-radius:16px;padding:18px 20px;border-left:4px solid var(--primary)">
        <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;margin-bottom:6px">Why you're doing this</div>
        <div style="font-size:15px;color:var(--text);line-height:1.5">${random.text}</div>
      </div>
    `;
  },

  startTimer() {
    if (!this._running) this.toggle();
  },

  toggle() {
    if (this._running) {
      clearInterval(this._interval);
      this._running = false;
      document.getElementById('crisis-start-btn').textContent = 'Resume';
    } else {
      if (this._remaining <= 0) this.reset();
      this._running = true;
      document.getElementById('crisis-start-btn').textContent = 'Pause';
      this._interval = setInterval(() => {
        this._remaining--;
        this._updateDisplay(this._remaining, this._total);
        if (this._remaining <= 0) {
          clearInterval(this._interval);
          this._running = false;
          document.getElementById('crisis-start-btn').textContent = 'Done ✓';
          document.getElementById('crisis-start-btn').style.background = 'var(--success)';
        }
      }, 1000);
    }
  },

  reset() {
    clearInterval(this._interval);
    this._running   = false;
    this._remaining = this._total;
    this._updateDisplay(this._total, this._total);
    const btn = document.getElementById('crisis-start-btn');
    if (btn) {
      btn.textContent = 'Start Timer';
      btn.style.background = '';
    }
  },

  _updateDisplay(remaining, total) {
    const min = Math.floor(remaining / 60);
    const sec = String(remaining % 60).padStart(2, '0');
    const el = document.getElementById('crisis-time');
    if (el) el.textContent = `${min}:${sec}`;

    const arc = document.getElementById('crisis-arc');
    if (arc) {
      const circ = 2 * Math.PI * 78;
      arc.style.strokeDashoffset = `${circ * (1 - remaining / total)}`;
    }
  },
};
