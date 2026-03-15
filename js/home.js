// ─── Home Tab ─────────────────────────────────────────────────────────────────

const BMHome = {
  render() {
    this.renderHero();
    this.renderMilestone();
  },

  renderHero() {
    const p    = DB.getProfile();
    const days = DB.getDaysSinceQuit();
    const money= DB.getMoneySaved();
    const cigs = DB.getCigsSaved();
    const cur  = p.currency || '₪';

    document.getElementById('home-hero').innerHTML = `
      <div class="home-hero">
        <div class="home-streak-number">${days}</div>
        <div class="home-streak-label">${days === 1 ? 'day' : 'days'} smoke-free</div>
        <div class="home-stats">
          <div class="home-stat">
            <div class="home-stat-value">${cur}${money}</div>
            <div class="home-stat-label">saved</div>
          </div>
          <div class="home-stat" style="border-left:1px solid rgba(255,255,255,0.3);padding-left:16px">
            <div class="home-stat-value">${cigs}</div>
            <div class="home-stat-label">cigs not smoked</div>
          </div>
        </div>
      </div>
    `;
  },

  renderMilestone() {
    const m = DB.getCurrentMilestone();
    document.getElementById('home-milestone').innerHTML = `
      <div class="home-milestone">
        <div class="home-milestone-icon">${m.icon}</div>
        <div>
          <div class="home-milestone-title">${m.title}</div>
          <div class="home-milestone-text">${m.text}${m.next ? `<br><span style="color:var(--primary);font-size:12px;font-weight:600;margin-top:4px;display:block">${m.next}</span>` : ''}</div>
        </div>
      </div>
    `;
  },
};
