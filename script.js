/* ==============================================================
   SYNCED – script.js
   Krok 1: state + onboarding wizard + navigácia
   Krok 2: vykreslenie otázok + zber odpovedí + scoring + zhrnutie
   --------------------------------------------------------------
   Ďalšie kroky:
   - Krok 3: calculateCompatibility() + render matchov
   - Krok 4: aiSuggestions modul
   ============================================================== */

'use strict';

/* --------------------------------------------------------------
   1) GLOBÁLNY STATE – jediný zdroj pravdy
   -------------------------------------------------------------- */
const AppState = {
  userProfile: {
    basics: { age: null, location: '', gender: '', intent: '' },
    values: [],                 // top 3: [{ value, label, score }]
    personality: {
      type: null,               // napr. 'Empatický spojenec'
      headline: '',             // krátky popis typu
      scores: {}                // { openness, conscientiousness, extraversion, agreeableness, stability }
    },
    relationshipIntent: null,   // 'serious' | 'company' | 'open'
    preferredPartnerTraits: [], // z Kroku 4
    // ďalšie preferencie (využije matchovanie v Kroku 3):
    sharedValuesImportance: null,
    complementPreference: null,
    pace: null,
    dealbreakers: []
  },

  answers: {},                  // surové odpovede: { qid: hodnota | [hodnoty] }
  compatibilityScore: null,
  currentStep: 1,
  totalSteps: 5
};

window.AppState = AppState;


/* --------------------------------------------------------------
   2) VYKRESLENIE OTÁZOK z SYNCED_DATA do krokov 2–4
   -------------------------------------------------------------- */
const Questions = {
  init() {
    const D = window.SYNCED_DATA;
    if (!D) { console.warn('[Synced] Chýba data.js'); return; }

    this.render('values', D.values);
    this.render('personality', D.personality);
    this.render('preferences', D.preferences);

    // Zber odpovedí – delegovane na celom onboardingu
    const root = document.getElementById('onboarding');
    root.addEventListener('change', (e) => this.capture(e));
  },

  render(key, list) {
    const box = document.querySelector(`[data-questions="${key}"]`);
    if (!box) return;
    box.innerHTML = list.map((q, i) => this.questionHTML(q, i)).join('');
  },

  questionHTML(q, i) {
    let body = '';

    if (q.type === 'likert') {
      const labels = window.SYNCED_DATA.likertLabels;
      body = `<div class="likert" role="radiogroup" aria-label="${q.text}">` +
        [1,2,3,4,5].map(n => `
          <label class="likert__opt" title="${labels[n-1]}">
            <input type="radio" name="${q.id}" value="${n}">
            <span class="likert__dot">${n}</span>
          </label>`).join('') +
        `</div>
        <div class="likert__ends"><span>${labels[0]}</span><span>${labels[4]}</span></div>`;
    }

    else if (q.type === 'choice') {
      body = `<div class="opts">` + q.options.map(opt => `
        <label class="opt">
          <input type="radio" name="${q.id}" value="${opt}"> <span>${opt}</span>
        </label>`).join('') + `</div>`;
    }

    else if (q.type === 'multi') {
      body = `<div class="opts" data-multi="${q.id}" data-max="${q.maxSelect || 99}">` +
        q.options.map(opt => `
        <label class="opt">
          <input type="checkbox" name="${q.id}" value="${opt}"> <span>${opt}</span>
        </label>`).join('') +
        `</div>${q.maxSelect ? `<small class="opt-hint">Vyber max. ${q.maxSelect}</small>` : ''}`;
    }

    return `
      <div class="question" data-qid="${q.id}">
        <p class="question__text">${i + 1}. ${q.text}</p>
        ${body}
      </div>`;
  },

  // Uloží odpoveď do AppState.answers
  capture(e) {
    const input = e.target;
    if (!input.name) return;

    if (input.type === 'checkbox') {
      const group = document.querySelector(`[data-multi="${input.name}"]`);
      const checked = Array.from(document.querySelectorAll(`input[name="${input.name}"]:checked`));
      const max = Number(group?.dataset.max || 99);

      // Enforce max: ak prekročené, odškrtni práve zaškrtnuté
      if (checked.length > max) {
        input.checked = false;
        return;
      }
      AppState.answers[input.name] = checked.map(c => c.value);

      // Vizuálne zablokuj ďalšie, keď je dosiahnuté maximum
      if (group) {
        const atMax = checked.length >= max;
        group.querySelectorAll('input[type="checkbox"]').forEach(cb => {
          cb.disabled = atMax && !cb.checked;
          cb.closest('.opt').classList.toggle('is-disabled', cb.disabled);
        });
      }
    } else {
      AppState.answers[input.name] = input.value;
    }
  }
};


/* --------------------------------------------------------------
   3) SCORING – výpočet profilu z odpovedí
   -------------------------------------------------------------- */
const Scoring = {
  // Bezpečné načítanie Likert odpovede (default 3 = neutrálne)
  likert(qid) {
    const v = Number(AppState.answers[qid]);
    return Number.isFinite(v) ? v : 3;
  },

  computeProfile() {
    const D = window.SYNCED_DATA;
    const P = AppState.userProfile;

    // --- HODNOTY: skóre 1–5, vyber top 3 ---
    const valueScores = D.values.map(q => ({
      value: q.value,
      label: q.label,
      score: this.likert(q.id)
    })).sort((a, b) => b.score - a.score);
    P.values = valueScores.slice(0, 3);

    // --- OSOBNOSŤ: priemer 2 otázok na dimenziu (reverse => 6 - x) ---
    const dims = {};
    D.personality.forEach(q => {
      let raw = this.likert(q.id);
      if (q.reverse) raw = 6 - raw;
      (dims[q.dim] = dims[q.dim] || []).push(raw);
    });
    const scores = {};
    Object.keys(dims).forEach(dim => {
      const arr = dims[dim];
      scores[dim] = Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 10) / 10;
    });
    P.personality.scores = scores;

    // Primárna + sekundárna dimenzia → archetyp
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const primary = ranked[0]?.[0];
    const secondary = ranked[1]?.[0];
    if (primary && D.archetypes[primary]) {
      P.personality.type = D.archetypes[primary].name;
      P.personality.headline = `${D.archetypes[primary].desc}` +
        (secondary ? `, s prvkami: ${D.archetypes[secondary].desc}` : '');
    }

    // --- PREFERENCIE ---
    P.preferredPartnerTraits = AppState.answers['pref_traits'] || [];
    P.sharedValuesImportance = this.likert('pref_shared');
    P.complementPreference = this.likert('pref_complement');
    P.pace = AppState.answers['pref_pace'] || null;
    P.dealbreakers = AppState.answers['pref_dealbreakers'] || [];

    // --- ZÁMER (z Kroku 1) ---
    P.relationshipIntent = P.basics.intent || null;

    console.log('[Synced] Vypočítaný profil:', JSON.parse(JSON.stringify(P)));
    return P;
  }
};


/* --------------------------------------------------------------
   4) ONBOARDING WIZARD
   -------------------------------------------------------------- */
const Onboarding = {
  init() {
    this.steps = Array.from(document.querySelectorAll('.onboarding-step'));
    this.bar = document.getElementById('progressBar');
    this.currentEl = document.getElementById('stepCurrent');
    this.totalEl = document.getElementById('stepTotal');
    if (!this.steps.length) return;

    AppState.totalSteps = this.steps.length;
    if (this.totalEl) this.totalEl.textContent = AppState.totalSteps;

    document.getElementById('onboarding').addEventListener('click', (e) => {
      const nav = e.target.closest('[data-nav]');
      if (!nav) return;
      if (nav.dataset.nav === 'next') this.next();
      if (nav.dataset.nav === 'prev') this.prev();
    });

    this.goToStep(1, false);
  },

  goToStep(n, scroll = true) {
    n = Math.max(1, Math.min(n, AppState.totalSteps));
    AppState.currentStep = n;

    this.steps.forEach((step) => {
      step.classList.toggle('is-active', Number(step.dataset.step) === n);
    });

    const pct = (n / AppState.totalSteps) * 100;
    if (this.bar) this.bar.style.width = pct + '%';
    if (this.currentEl) this.currentEl.textContent = n;

    if (scroll) {
      document.getElementById('signup').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  next() {
    if (AppState.currentStep === 1) this.saveBasics();
    // Po Kroku 4 spočítame profil a vykreslíme zhrnutie
    if (AppState.currentStep === 4) {
      Scoring.computeProfile();
      this.renderSummary();
      this.syncProfileSection();
    }
    this.goToStep(AppState.currentStep + 1);
  },

  prev() { this.goToStep(AppState.currentStep - 1); },

  saveBasics() {
    const form = document.getElementById('basic-info-form');
    if (!form) return;
    const data = new FormData(form);
    AppState.userProfile.basics = {
      age: Number(data.get('age')) || null,
      location: (data.get('location') || '').trim(),
      gender: data.get('gender') || '',
      intent: data.get('intent') || ''
    };
    AppState.userProfile.relationshipIntent = data.get('intent') || null;
  },

  // Vykreslí zhrnutie profilu v Kroku 5
  renderSummary() {
    const box = document.getElementById('profileSummary');
    if (!box) return;
    const P = AppState.userProfile;
    const D = window.SYNCED_DATA;

    const values = P.values.map(v =>
      `<span class="chip">${v.label} <b>${Math.round(v.score / 5 * 100)}%</b></span>`).join('');

    const bars = Object.entries(P.personality.scores).map(([dim, sc]) => `
      <div class="bar-row">
        <span class="bar-row__label">${D.dimLabels[dim] || dim}</span>
        <span class="bar"><span class="bar__fill" style="width:${sc / 5 * 100}%"></span></span>
        <span class="bar-row__val">${sc.toFixed(1)}</span>
      </div>`).join('');

    const traits = P.preferredPartnerTraits.length
      ? P.preferredPartnerTraits.map(t => `<span class="chip chip--soft">${t}</span>`).join('')
      : '<em>neuvedené</em>';

    const intentMap = { serious: 'Vážny vzťah', company: 'Spoločnosť', open: 'Otvorený možnostiam' };

    box.innerHTML = `
      <div class="summary-card">
        <h4>💛 Tvoj typ: ${P.personality.type || '—'}</h4>
        <p class="summary-sub">${P.personality.headline || ''}</p>
      </div>

      <div class="summary-block">
        <h4>Tvoje top hodnoty</h4>
        <div class="chips">${values || '<em>neuvedené</em>'}</div>
      </div>

      <div class="summary-block">
        <h4>Osobnostný profil</h4>
        ${bars}
      </div>

      <div class="summary-block">
        <h4>Čo hľadáš</h4>
        <p><strong>Zámer:</strong> ${intentMap[P.relationshipIntent] || '—'} ·
           <strong>Tempo:</strong> ${P.pace || '—'}</p>
        <div class="chips">${traits}</div>
      </div>

      <p class="summary-note">Na základe tohto profilu ti Synced vypočíta najlepšie matchy. 🎯</p>
    `;
  },

  // Prepíše aj sekciu „Môj profil" reálnymi dátami
  syncProfileSection() {
    const P = AppState.userProfile;
    const list = document.getElementById('profileValuesList');
    if (list && P.values.length) {
      list.innerHTML = P.values.map(v => `<li>${v.label}</li>`).join('');
    }
    const pers = document.getElementById('profilePersonality');
    if (pers && P.personality.type) {
      pers.textContent = `Typ: „${P.personality.type}" – ${P.personality.headline}`;
    }
  }
};


/* --------------------------------------------------------------
   5) MOBILNÁ NAVIGÁCIA (hamburger)
   -------------------------------------------------------------- */
const Nav = {
  init() {
    const toggle = document.getElementById('navToggle');
    const nav = document.getElementById('mainNav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
};


/* --------------------------------------------------------------
   6) PLYNULÝ SCROLL pre data-scroll="#cieľ"
   -------------------------------------------------------------- */
const SmoothScroll = {
  init() {
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-scroll]');
      if (!el) return;
      e.preventDefault();
      const target = document.querySelector(el.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
};


/* --------------------------------------------------------------
   7) ŠTART
   -------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  Questions.init();
  Onboarding.init();
  Nav.init();
  SmoothScroll.init();
  console.log('[Synced] Aplikácia inicializovaná ✔');
});
