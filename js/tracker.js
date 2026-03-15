// ─── Tracker Tab ──────────────────────────────────────────────────────────────

const BMTracker = {
  _logDate: null,
  _logChoice: null,

  render() {
    const p        = DB.getProfile();
    const days     = DB.getDaysSinceQuit();
    const money    = DB.getMoneySaved();
    const cigs     = DB.getCigsSaved();
    const streak   = DB.getCurrentStreak();
    const cur      = p.currency || '₪';
    const reminder = DB.getReminderTime();
    const today    = DB.todayStr();
    const todayLog = DB.getLog(today);

    document.getElementById('tracker-content').innerHTML = `

      <!-- Hero Stats -->
      <div class="tracker-hero">
        <div class="tracker-stat">
          <div class="tracker-stat-value">${days}</div>
          <div class="tracker-stat-label">days since quit</div>
        </div>
        <div class="tracker-stat" style="border-left:1px solid rgba(255,255,255,0.3);padding-left:16px">
          <div class="tracker-stat-value">${streak}</div>
          <div class="tracker-stat-label">current streak</div>
        </div>
      </div>

      <!-- Log Today -->
      ${!todayLog ? `
        <button class="log-today-btn" onclick="BMTracker.openLog('${today}')">
          📝 Log today — how did it go?
        </button>
      ` : `
        <div style="background:${todayLog.smokeFree ? 'var(--success)' : 'var(--crisis)'};margin:0 16px 14px;border-radius:16px;padding:16px 20px;color:white;display:flex;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:700;font-size:16px">${todayLog.smokeFree ? '✅ Smoke-free today!' : '😔 Logged as smoked'}</div>
            ${todayLog.note ? `<div style="font-size:13px;opacity:0.85;margin-top:4px">${todayLog.note}</div>` : ''}
          </div>
          <button onclick="BMTracker.openLog('${today}')" style="background:rgba(255,255,255,0.2);border:none;border-radius:10px;color:white;font-size:13px;font-weight:600;padding:8px 12px;cursor:pointer">Edit</button>
        </div>
      `}

      <!-- Tip if smoked -->
      ${todayLog && !todayLog.smokeFree ? this._renderTip() : ''}

      <!-- This Week Calendar -->
      <div class="week-calendar">
        <div class="week-title">This Week</div>
        <div class="week-grid" id="week-grid">
          ${this._renderWeekGrid()}
        </div>
      </div>

      <!-- Money Saved -->
      <div class="money-card">
        <div class="money-label">Total savings</div>
        <div class="money-amount">${cur}${money}</div>
        <div class="money-cigs">${cigs} cigarettes not smoked</div>
        ${this._renderMoneyContext(money, cur)}
      </div>

      <!-- Daily Reminder -->
      <div class="reminder-card">
        <div class="reminder-info">
          <h4>Daily Reminder</h4>
          <p>Prompt to log your day</p>
        </div>
        <input class="reminder-time-input" type="time" value="${reminder}"
          onchange="BMTracker.updateReminder(this.value)">
      </div>

      <!-- Month view -->
      <div class="week-calendar">
        <div class="week-title">This Month</div>
        ${this._renderMonthGrid()}
      </div>

    `;
  },

  _renderWeekGrid() {
    const today = new Date();
    const days  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayStr = DB.todayStr();

    // Get Monday of this week
    const monday = new Date(today);
    const dow    = today.getDay(); // 0=Sun, 1=Mon...
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

    return days.map((name, i) => {
      const d   = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = DB.dateStr(d);
      const log = DB.getLog(str);
      const isToday  = str === todayStr;
      const isFuture = d > today && !isToday;

      let boxClass = 'week-day-box';
      let content  = '';
      if (isFuture) { boxClass += ' future'; }
      else if (!log) { if (isToday) boxClass += ' today'; }
      else if (log.smokeFree) { boxClass += ' smoke-free'; content = '✓'; }
      else { boxClass += ' smoked'; content = '✗'; }

      const dateNum = d.getDate();
      return `
        <div class="week-day">
          <div class="week-day-name">${name}</div>
          <div class="${boxClass}" onclick="${!isFuture ? `BMTracker.openLog('${str}')` : ''}" title="${str}">
            ${content || `<span style="font-size:11px;color:var(--text-muted)">${dateNum}</span>`}
          </div>
        </div>
      `;
    }).join('');
  },

  _renderMonthGrid() {
    const today   = new Date();
    const year    = today.getFullYear();
    const month   = today.getMonth();
    const todayStr = DB.todayStr();

    // Days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // First day of month (0=Sun)
    const firstDow = new Date(year, month, 1).getDay();
    const offset   = firstDow === 0 ? 6 : firstDow - 1; // Mon-based offset

    const dayNames = ['M','T','W','T','F','S','S'];
    let html = `<div class="week-grid" style="gap:4px">${dayNames.map(d => `<div class="week-day"><div class="week-day-name">${d}</div></div>`).join('')}`;

    // Empty cells before first day
    for (let i = 0; i < offset; i++) {
      html += '<div></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d   = new Date(year, month, day);
      const str = DB.dateStr(d);
      const log = DB.getLog(str);
      const isToday  = str === todayStr;
      const isFuture = d > today && !isToday;

      let boxClass = 'week-day-box';
      let content  = String(day);
      if (isFuture) { boxClass += ' future'; }
      else if (log?.smokeFree) { boxClass += ' smoke-free'; content = '✓'; }
      else if (log && !log.smokeFree) { boxClass += ' smoked'; content = '✗'; }
      else if (isToday) { boxClass += ' today'; }

      html += `<div class="week-day"><div class="${boxClass}" style="font-size:11px" onclick="${!isFuture ? `BMTracker.openLog('${str}')` : ''}">${content}</div></div>`;
    }

    html += '</div>';
    return html;
  },

  _renderMoneyContext(money, cur) {
    if (money < 50)   return '';
    if (money < 150)  return `<div style="font-size:13px;color:var(--primary);margin-top:8px">That's a nice dinner out 🍽️</div>`;
    if (money < 500)  return `<div style="font-size:13px;color:var(--primary);margin-top:8px">Enough for a weekend trip 🏖️</div>`;
    if (money < 1000) return `<div style="font-size:13px;color:var(--primary);margin-top:8px">Enough for a new pair of shoes 👟</div>`;
    return `<div style="font-size:13px;color:var(--primary);margin-top:8px">Significant savings — treat yourself 🎉</div>`;
  },

  _renderTip() {
    const tips = [
      "Slipping doesn't erase your progress. Get back on track today — one slip is not a relapse.",
      "The most important thing after a slip: don't have another cigarette. Remove all cigarettes from your environment now.",
      "Identify what triggered today's cigarette. Add it to your If-Then plans in My Plan.",
      "Cravings feel stronger after a slip, but they pass just as fast. Use the 7-minute timer next time.",
      "Every smoke-free day you've had still counts. You haven't lost them.",
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    return `
      <div class="tracker-tip" style="margin-bottom:14px">
        <div class="tracker-tip-title">💡 Tip for getting back on track</div>
        <div class="tracker-tip-text">${tip}</div>
      </div>
    `;
  },

  // ── Log modal ──────────────────────────────────────────────────────────────
  openLog(dateStr) {
    this._logDate   = dateStr;
    this._logChoice = null;

    const existing = DB.getLog(dateStr);
    const d = new Date(dateStr + 'T12:00:00');
    const label = dateStr === DB.todayStr() ? 'today' :
      d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    document.getElementById('log-day-label').textContent    = label;
    document.getElementById('log-modal-title').textContent  = `Log ${label.charAt(0).toUpperCase() + label.slice(1)}`;
    document.getElementById('log-note').value = existing?.note || '';
    document.getElementById('log-save-btn').disabled = true;

    const btnFree   = document.getElementById('log-btn-free');
    const btnSmoked = document.getElementById('log-btn-smoked');
    btnFree.className   = 'log-choice-btn';
    btnSmoked.className = 'log-choice-btn';

    if (existing) {
      if (existing.smokeFree) { this.selectLog('free');   }
      else                    { this.selectLog('smoked'); }
    }

    f7App.popup.open('#popup-log');
  },

  selectLog(choice) {
    this._logChoice = choice;
    document.getElementById('log-btn-free').className   = 'log-choice-btn' + (choice === 'free'   ? ' selected-free'   : '');
    document.getElementById('log-btn-smoked').className = 'log-choice-btn' + (choice === 'smoked' ? ' selected-smoked' : '');
    document.getElementById('log-save-btn').disabled    = false;
  },

  saveLog() {
    if (!this._logDate || !this._logChoice) return;
    const smokeFree = this._logChoice === 'free';
    const note      = document.getElementById('log-note').value.trim();
    DB.setLog(this._logDate, smokeFree, note);
    f7App.popup.close('#popup-log');
    this.render();
    // Also refresh home tab stats
    BMHome.render();
  },

  // ── Reminder ───────────────────────────────────────────────────────────────
  updateReminder(time) {
    DB.setReminderTime(time);
    this.scheduleReminder();
  },

  scheduleReminder() {
    // Use a daily notification via service worker if available
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const time    = DB.getReminderTime();
    const [h, m]  = time.split(':').map(Number);
    const now     = new Date();
    const target  = new Date();
    target.setHours(h, m, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);

    const delay = target - now;
    setTimeout(() => {
      new Notification('BetterMe', {
        body: "Have you logged today? Tap to update your tracker.",
        icon: '/icons/icon-192.png',
        tag:  'daily-reminder',
      });
      // Reschedule for tomorrow
      this.scheduleReminder();
    }, delay);
  },
};
