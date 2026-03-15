// ─── BetterMe Data Layer ──────────────────────────────────────────────────────
// localStorage is always the primary (fast, sync) layer.
// When Supabase credentials are set in config.js, every write is also mirrored
// to the cloud, and on first load the cloud data is pulled down.

const DB = {
  PREFIX: 'bm_',
  _sb: null,   // Supabase client, set in init()

  // ── Supabase bootstrap ───────────────────────────────────────────────────────
  async init() {
    if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY) {
      this._sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
      await this._pullFromCloud();
    }
  },

  async _pullFromCloud() {
    try {
      const { data, error } = await this._sb.from('bm_data').select('key, value');
      if (error) { console.warn('[BetterMe] Cloud pull error:', error.message); return; }
      data.forEach(row => {
        localStorage.setItem(this.PREFIX + row.key, JSON.stringify(row.value));
      });
    } catch (e) { console.warn('[BetterMe] Cloud pull failed:', e); }
  },

  _pushToCloud(key, value) {
    if (!this._sb) return;
    this._sb.from('bm_data').upsert({ key, value }).then(({ error }) => {
      if (error) console.warn('[BetterMe] Cloud push error:', error.message);
    });
  },

  // ── Core localStorage helpers ───────────────────────────────────────────────
  _get(key) {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  _set(key, value) {
    try { localStorage.setItem(this.PREFIX + key, JSON.stringify(value)); } catch {}
    this._pushToCloud(key, value);
  },

  // ── Onboarding ──────────────────────────────────────────────────────────────
  isOnboarded()  { return !!this._get('onboarded'); },
  setOnboarded() { this._set('onboarded', true); },

  // ── Profile ─────────────────────────────────────────────────────────────────
  getProfile() {
    return this._get('profile') || {
      quitDate:      null,
      cigsPerDay:    13,
      costPerPack:   42,
      packSize:      20,
      currency:      '₪',
      supportName:   '',
      supportPhone:  '',
      nopeCommitted: false,
    };
  },
  setProfile(data) {
    this._set('profile', { ...this.getProfile(), ...data });
  },

  // ── Reasons ─────────────────────────────────────────────────────────────────
  getReasons() { return this._get('reasons') || []; },
  addReason(text) {
    const list = this.getReasons();
    const item = { id: Date.now().toString(), text };
    list.push(item);
    this._set('reasons', list);
    return item.id;
  },
  deleteReason(id) { this._set('reasons', this.getReasons().filter(r => r.id !== id)); },

  // ── If-Then Plans ───────────────────────────────────────────────────────────
  getIfThen() { return this._get('ifthen') || []; },
  addIfThen(trigger, action) {
    const list = this.getIfThen();
    const item = { id: Date.now().toString(), trigger, action };
    list.push(item);
    this._set('ifthen', list);
    return item.id;
  },
  deleteIfThen(id) { this._set('ifthen', this.getIfThen().filter(p => p.id !== id)); },

  // ── Coping Cards ────────────────────────────────────────────────────────────
  getCards() { return this._get('cards') || []; },
  addCard(trigger, thought, response, action) {
    const list = this.getCards();
    const item = { id: Date.now().toString(), trigger, thought, response, action };
    list.push(item);
    this._set('cards', list);
    return item.id;
  },
  deleteCard(id) { this._set('cards', this.getCards().filter(c => c.id !== id)); },

  // ── Daily Logs ──────────────────────────────────────────────────────────────
  getLogs()  { return this._get('logs') || {}; },
  getLog(date) { return this.getLogs()[date] || null; },
  setLog(date, smokeFree, note = '') {
    const logs = this.getLogs();
    logs[date] = { smokeFree, note, loggedAt: new Date().toISOString() };
    this._set('logs', logs);
  },

  // ── Reminder time ───────────────────────────────────────────────────────────
  getReminderTime()    { return this._get('reminder_time') || '21:00'; },
  setReminderTime(t)   { this._set('reminder_time', t); },

  // ── Computed stats ──────────────────────────────────────────────────────────
  getDaysSinceQuit() {
    const { quitDate } = this.getProfile();
    if (!quitDate) return 0;
    const quit = new Date(quitDate);
    quit.setHours(0, 0, 0, 0);
    const now  = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.max(0, Math.round((now - quit) / 86400000));
  },

  getMinutesSinceQuit() {
    const { quitDate } = this.getProfile();
    if (!quitDate) return 0;
    return Math.max(0, Math.round((Date.now() - new Date(quitDate)) / 60000));
  },

  getMoneySaved() {
    const p = this.getProfile();
    const days = this.getDaysSinceQuit();
    const costPerCig = (p.costPerPack || 42) / (p.packSize || 20);
    return Math.round(days * (p.cigsPerDay || 13) * costPerCig);
  },

  getCigsSaved() {
    const p = this.getProfile();
    return this.getDaysSinceQuit() * (p.cigsPerDay || 13);
  },

  getCurrentStreak() {
    const logs  = this.getLogs();
    const today = this.todayStr();
    let streak  = 0;
    let date    = new Date();

    for (let i = 0; i < 365; i++) {
      const str = this.dateStr(date);
      if (str === today && !logs[str]) {
        date.setDate(date.getDate() - 1);
        continue;
      }
      if (logs[str] && logs[str].smokeFree) {
        streak++;
        date.setDate(date.getDate() - 1);
      } else break;
    }
    return streak;
  },

  // ── Date helpers ─────────────────────────────────────────────────────────────
  todayStr() { return this.dateStr(new Date()); },
  dateStr(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // ── Health milestones ────────────────────────────────────────────────────────
  getCurrentMilestone() {
    const mins = this.getMinutesSinceQuit();
    const milestones = [
      { mins: 20,    icon: '❤️',  title: 'Heart rate recovering',    text: 'Your heart rate has already dropped toward a healthier level.' },
      { mins: 720,   icon: '🫁',  title: 'Carbon monoxide clearing', text: 'CO levels in your blood are returning to normal.' },
      { mins: 1440,  icon: '💪',  title: 'Heart attack risk dropping',text: 'Your risk of heart attack has started to decrease.' },
      { mins: 2880,  icon: '👃',  title: 'Senses returning',          text: 'Your sense of smell and taste are beginning to come back.' },
      { mins: 4320,  icon: '😮‍💨', title: 'Breathing easier',         text: 'Bronchial tubes are relaxing. Breathing gets easier.' },
      { mins: 20160, icon: '🏃',  title: 'Circulation improved',      text: 'Circulation has significantly improved. Movement feels lighter.' },
      { mins: 43200, icon: '🫁',  title: 'Lungs getting cleaner',     text: 'Lung function is improving. Cilia are clearing out mucus.' },
      { mins: 129600,icon: '🩸',  title: 'Circulation fully restored',text: 'Your blood circulation is operating at full strength.' },
      { mins: 388800,icon: '🌬️', title: 'Breathing transformed',     text: 'Coughing and shortness of breath have significantly decreased.' },
      { mins: 525600,icon: '🏆',  title: '1 year smoke-free!',        text: 'Your heart disease risk is now HALF that of a smoker.' },
    ];
    const passed = milestones.filter(m => mins >= m.mins);
    if (passed.length === 0) {
      return { icon: '🚀', title: 'Your journey begins', text: 'Every minute without a cigarette is a victory. Keep going.' };
    }
    const current = passed[passed.length - 1];
    const next = milestones[passed.length];
    if (next) {
      const remaining = next.mins - mins;
      const h = Math.floor(remaining / 60);
      const d = Math.floor(h / 24);
      current.next = d > 1 ? `Next milestone in ${d} days` : h > 1 ? `Next milestone in ${h} hours` : 'Next milestone very soon';
    }
    return current;
  },
};
