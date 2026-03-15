// ─── My Plan Tab ──────────────────────────────────────────────────────────────

const BMPlan = {

  render() {
    const p       = DB.getProfile();
    const reasons = DB.getReasons();
    const ifthen  = DB.getIfThen();
    const cards   = DB.getCards();

    document.getElementById('plan-content').innerHTML = `

      <!-- N.O.P.E. Banner -->
      <div class="nope-banner">
        <div class="nope-banner-word">N.O.P.E.</div>
        <div class="nope-banner-sub">Not One Puff Ever</div>
        <div class="nope-banner-status">
          ${p.nopeCommitted ? '✓ Committed on day one. This holds.' : '— Commit during onboarding —'}
        </div>
      </div>

      <!-- Factual Reframe Card -->
      <div style="background:var(--card);margin:14px 16px;border-radius:18px;padding:18px 20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div style="font-size:13px;font-weight:700;color:var(--primary);text-transform:uppercase;margin-bottom:10px">Remember This</div>
        <div style="font-size:15px;color:var(--text);line-height:1.7">
          • A craving peaks in <strong>3–5 minutes</strong> and then fades — with or without a cigarette.<br>
          • Every craving you've ever had has passed. This one will too.<br>
          • One puff is not harmless. It re-activates the addiction cycle.
        </div>
      </div>

      <!-- My Reasons -->
      <div class="plan-section">
        <div class="plan-section-header">
          <div class="plan-section-title">💛 My Reasons</div>
          <button class="plan-add-btn" onclick="BMPlan.openAddReason()">+ Add</button>
        </div>
        ${reasons.length === 0
          ? '<div class="plan-empty">No reasons added yet. Add your personal reasons for quitting.</div>'
          : reasons.map(r => `
            <div class="plan-item">
              <div class="plan-item-text">${r.text}</div>
              <button class="plan-item-del" onclick="BMPlan.deleteReason('${r.id}')">×</button>
            </div>
          `).join('')
        }
      </div>

      <!-- If-Then Plans -->
      <div class="plan-section">
        <div class="plan-section-header">
          <div class="plan-section-title">🗺️ If-Then Plans</div>
          <button class="plan-add-btn" onclick="BMPlan.openAddIfThen()">+ Add</button>
        </div>
        ${ifthen.length === 0
          ? '<div class="plan-empty">No plans yet. Pre-plan your response to your biggest triggers.</div>'
          : ifthen.map(p => `
            <div class="plan-item">
              <div>
                <div class="plan-item-text">If <em>${p.trigger}</em></div>
                <div class="plan-item-sub">→ ${p.action}</div>
              </div>
              <button class="plan-item-del" onclick="BMPlan.deleteIfThen('${p.id}')">×</button>
            </div>
          `).join('')
        }
      </div>

      <!-- Coping Cards -->
      <div class="plan-section">
        <div class="plan-section-header">
          <div class="plan-section-title">🃏 Coping Cards</div>
          <button class="plan-add-btn" onclick="BMPlan.openAddCard()">+ Add</button>
        </div>
        ${cards.length === 0
          ? '<div class="plan-empty">No cards yet. Create cards for your most common craving thoughts.</div>'
          : cards.map(c => `
            <div class="plan-item" style="flex-direction:column;gap:8px">
              ${c.thought ? `<div style="font-size:12px;color:var(--crisis);font-weight:600">💭 "${c.thought}"</div>` : ''}
              <div class="plan-item-text">${c.response}</div>
              ${c.action ? `<div class="plan-item-sub">→ ${c.action}</div>` : ''}
              <button class="plan-item-del" onclick="BMPlan.deleteCard('${c.id}')" style="align-self:flex-end">Delete</button>
            </div>
          `).join('')
        }
      </div>

      <!-- Support Person -->
      <div class="plan-section">
        <div class="plan-section-header">
          <div class="plan-section-title">📞 Support Person</div>
          <button class="plan-add-btn" onclick="BMPlan.editSupport()">Edit</button>
        </div>
        <div class="plan-item">
          ${DB.getProfile().supportName
            ? `<div class="plan-item-text"><strong>${DB.getProfile().supportName}</strong><div class="plan-item-sub">${DB.getProfile().supportPhone || 'No phone added'}</div></div>
               ${DB.getProfile().supportPhone ? `<a href="tel:${DB.getProfile().supportPhone}" style="color:var(--primary);font-weight:700;font-size:14px;text-decoration:none">📞 Call</a>` : ''}`
            : '<div class="plan-item-text" style="color:var(--text-muted)">No support person added yet.</div>'
          }
        </div>
      </div>

    `;
  },

  // ── Reasons ────────────────────────────────────────────────────────────────
  openAddReason() {
    document.getElementById('modal-reason-text').value = '';
    f7App.popup.open('#popup-reason');
    setTimeout(() => document.getElementById('modal-reason-text').focus(), 300);
  },

  saveReason() {
    const text = document.getElementById('modal-reason-text').value.trim();
    if (!text) return;
    DB.addReason(text);
    f7App.popup.close('#popup-reason');
    this.render();
  },

  deleteReason(id) {
    f7App.dialog.confirm('Remove this reason?', '', () => {
      DB.deleteReason(id);
      this.render();
    });
  },

  // ── If-Then ────────────────────────────────────────────────────────────────
  openAddIfThen() {
    document.getElementById('modal-ifthen-trigger').value = '';
    document.getElementById('modal-ifthen-action').value  = '';
    f7App.popup.open('#popup-ifthen');
    setTimeout(() => document.getElementById('modal-ifthen-trigger').focus(), 300);
  },

  saveIfThen() {
    const trigger = document.getElementById('modal-ifthen-trigger').value.trim();
    const action  = document.getElementById('modal-ifthen-action').value.trim();
    if (!trigger || !action) {
      f7App.dialog.alert('Please fill in both fields.'); return;
    }
    DB.addIfThen(trigger, action);
    f7App.popup.close('#popup-ifthen');
    this.render();
  },

  deleteIfThen(id) {
    f7App.dialog.confirm('Remove this plan?', '', () => {
      DB.deleteIfThen(id);
      this.render();
    });
  },

  // ── Cards ──────────────────────────────────────────────────────────────────
  openAddCard() {
    document.getElementById('modal-card-thought').value   = '';
    document.getElementById('modal-card-response').value  = '';
    document.getElementById('modal-card-action').value    = '';
    f7App.popup.open('#popup-card');
    setTimeout(() => document.getElementById('modal-card-thought').focus(), 300);
  },

  saveCard() {
    const thought   = document.getElementById('modal-card-thought').value.trim();
    const response  = document.getElementById('modal-card-response').value.trim();
    const action    = document.getElementById('modal-card-action').value.trim();
    if (!response) {
      f7App.dialog.alert('Please add your rational response.'); return;
    }
    DB.addCard('', thought, response, action);
    f7App.popup.close('#popup-card');
    this.render();
    // Re-render crisis to show updated cards
    BMCrisis.render();
  },

  deleteCard(id) {
    f7App.dialog.confirm('Remove this coping card?', '', () => {
      DB.deleteCard(id);
      this.render();
      BMCrisis.render();
    });
  },

  // ── Support person ──────────────────────────────────────────────────────────
  editSupport() {
    const p = DB.getProfile();
    f7App.dialog.create({
      title: 'Support Person',
      content: `
        <div style="padding:8px 0">
          <input id="dlg-support-name"  class="dialog-input" type="text"  placeholder="Name"         value="${p.supportName || ''}">
          <input id="dlg-support-phone" class="dialog-input" type="tel"   placeholder="Phone number"  value="${p.supportPhone || ''}">
        </div>
      `,
      buttons: [
        { text: 'Cancel' },
        { text: 'Save', onClick: () => {
          const name  = document.getElementById('dlg-support-name').value.trim();
          const phone = document.getElementById('dlg-support-phone').value.trim();
          DB.setProfile({ supportName: name, supportPhone: phone });
          this.render();
          BMCrisis.render();
        }},
      ],
    }).open();
  },
};
