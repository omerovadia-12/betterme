// ─── BetterMe App Init + Onboarding ──────────────────────────────────────────

// ── Framework7 Init ──────────────────────────────────────────────────────────
const f7App = new Framework7({
  name: 'BetterMe',
  el: '#app',
  theme: 'ios',
});

// ── Global F7 shorthand ───────────────────────────────────────────────────────
const BMApp = {
  f7: f7App,

  init() {
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }

    if (DB.isOnboarded()) {
      this.launchApp();
    } else {
      this.showOnboarding();
    }
  },

  showOnboarding() {
    document.getElementById('onboarding').style.display = 'flex';

    // Set default quit date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('ob-quit-date').value = DB.dateStr(tomorrow);

    BMOnboarding.init();
    document.getElementById('app').classList.add('ready');
  },

  launchApp() {
    document.getElementById('onboarding').style.display = 'none';

    // Render all tabs
    BMHome.render();
    BMCrisis.render();
    BMPlan.render();
    BMTracker.render();

    document.getElementById('app').classList.add('ready');

    // Request notification permission for daily reminder
    this.setupNotifications();
  },

  goToCrisis() {
    f7App.tab.show('#tab-crisis');
    BMCrisis.startTimer();
  },

  setupNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
      // Ask on first launch after a short delay
      setTimeout(() => {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') BMTracker.scheduleReminder();
        });
      }, 3000);
    } else if (Notification.permission === 'granted') {
      BMTracker.scheduleReminder();
    }
  },
};

// ── Onboarding Controller ─────────────────────────────────────────────────────
const BMOnboarding = {
  step: 0,
  totalSteps: 8,
  nopeCommitted: false,

  init() {
    this.step = 0;
    this.nopeCommitted = false;
    this.update();

    // Enter key support for inputs
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.getElementById('onboarding').style.display !== 'none') {
        this.next();
      }
    });
  },

  update() {
    const slides = document.getElementById('ob-slides');
    slides.style.transform = `translateX(-${this.step * 100}%)`;

    // Progress bar
    document.getElementById('ob-progress').style.width = `${((this.step + 1) / this.totalSteps) * 100}%`;

    // Back button
    const backBtn = document.getElementById('ob-back');
    backBtn.style.display = this.step === 0 ? 'none' : '';

    // Next button text
    const nextBtn = document.getElementById('ob-next');
    if (this.step === this.totalSteps - 1) {
      nextBtn.textContent = 'Start BetterMe →';
    } else if (this.step === 1) {
      nextBtn.textContent = 'Continue →';
      nextBtn.disabled = !this.nopeCommitted;
    } else {
      nextBtn.textContent = 'Continue →';
      nextBtn.disabled = false;
    }

  },

  next() {
    const nextBtn = document.getElementById('ob-next');
    if (nextBtn.disabled) return;

    // Validate before advancing
    if (!this.validateStep()) return;

    if (this.step < this.totalSteps - 1) {
      this.step++;
      this.update();
    } else {
      this.finish();
    }
  },

  back() {
    if (this.step > 0) { this.step--; this.update(); }
  },

  validateStep() {
    if (this.step === 1 && !this.nopeCommitted) {
      f7App.dialog.alert('Please commit to N.O.P.E. before continuing.', 'One step needed');
      return false;
    }
    return true;
  },

  commitNOPE() {
    this.nopeCommitted = true;
    const btn = document.getElementById('ob-nope-btn');
    btn.textContent = '✓ Committed. Not One Puff Ever.';
    btn.classList.add('committed');
    document.getElementById('ob-next').disabled = false;
  },

  finish() {
    // Save all collected data
    DB.setProfile({
      cigsPerDay:    parseInt(document.getElementById('ob-cigs').value) || 13,
      costPerPack:   parseFloat(document.getElementById('ob-cost').value) || 42,
      packSize:      parseInt(document.getElementById('ob-pack-size').value) || 20,
      currency:      document.getElementById('ob-currency').value || '₪',
      quitDate:      document.getElementById('ob-quit-date').value,
      supportName:   document.getElementById('ob-support-name').value.trim(),
      supportPhone:  document.getElementById('ob-support-phone').value.trim(),
      nopeCommitted: true,
    });

    // Save if-then plan
    const trigger = document.getElementById('ob-ifthen-trigger').value.trim();
    const action  = document.getElementById('ob-ifthen-action').value.trim();
    if (trigger && action) DB.addIfThen(trigger, action);

    // Save first coping card
    const thought   = document.getElementById('ob-card-thought').value.trim();
    const response  = document.getElementById('ob-card-response').value.trim();
    const cardAction= document.getElementById('ob-card-action').value.trim();
    if (thought && response) DB.addCard('', thought, response, cardAction);

    DB.setOnboarded();
    BMApp.launchApp();
  },
};

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => BMApp.init());
