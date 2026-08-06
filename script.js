/* ==============================================================
   SYNCED – script.js
   Krok 1: state systém + onboarding wizard + navigácia
   --------------------------------------------------------------
   V ďalších krokoch pribudne:
   - Krok 2: otázky testu + scoring -> naplní AppState.userProfile
   - Krok 3: calculateCompatibility() + render matchov
   - Krok 4: aiSuggestions modul
   ============================================================== */

'use strict';

/* --------------------------------------------------------------
   1) GLOBÁLNY STATE
   Jediné miesto pravdy o používateľovi a priebehu appky.
   -------------------------------------------------------------- */
const AppState = {
  // Profil používateľa – postupne ho napĺňame počas onboardingu
  userProfile: {
    basics: {                 // z Kroku 1
      age: null,
      location: '',
      gender: '',
      intent: ''
    },
    values: [],               // top 3 hodnoty, napr. ['rodina','pokoj','rast']  (Krok 2)
    personality: {            // Big Five light (Krok 3)
      type: null,             // napr. 'Empatický analytik'
      scores: {}              // { openness: 3.4, conscientiousness: 4.1, ... }
    },
    relationshipIntent: null, // 'serious' | 'company' | 'open'
    preferredPartnerTraits: [] // (Krok 4)
  },

  // Surové odpovede z testu (Likert 1–5) – zdroj pre scoring v Kroku 2
  answers: {},

  // Výsledné skóre kompatibility voči matchom (Krok 3)
  compatibilityScore: null,

  // Priebeh onboarding wizardu
  currentStep: 1,
  totalSteps: 5
};

// Pre pohodlné ladenie v konzole
window.AppState = AppState;


/* --------------------------------------------------------------
   2) ONBOARDING WIZARD – prepínanie krokov
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

    // Delegované klikanie na tlačidlá Späť/Pokračovať
    document.getElementById('onboarding').addEventListener('click', (e) => {
      const nav = e.target.closest('[data-nav]');
      if (!nav) return;
      if (nav.dataset.nav === 'next') this.next();
      if (nav.dataset.nav === 'prev') this.prev();
    });

    // Pri inicializácii nastavíme krok 1 bez skrolovania (nechceme skok pri načítaní)
    this.goToStep(1, false);
  },

  goToStep(n, scroll = true) {
    // Ohraničíme rozsah 1..totalSteps
    n = Math.max(1, Math.min(n, AppState.totalSteps));
    AppState.currentStep = n;

    this.steps.forEach((step) => {
      const isActive = Number(step.dataset.step) === n;
      step.classList.toggle('is-active', isActive);
    });

    // Progres bar + počítadlo
    const pct = (n / AppState.totalSteps) * 100;
    if (this.bar) this.bar.style.width = pct + '%';
    if (this.currentEl) this.currentEl.textContent = n;

    // Plynulý scroll na začiatok sekcie testu (len pri navigácii, nie pri načítaní)
    if (scroll) {
      document.getElementById('signup').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  next() {
    // Pri odchode z Kroku 1 uložíme základné údaje do state
    if (AppState.currentStep === 1) this.saveBasics();

    // Pri odchode z Kroku 4 (posledný pred zhrnutím) sa vypočíta profil.
    // Zatiaľ len placeholder – reálny scoring pridáme v Kroku 2/3.
    if (AppState.currentStep === 4) this.buildSummary();

    this.goToStep(AppState.currentStep + 1);
  },

  prev() {
    this.goToStep(AppState.currentStep - 1);
  },

  // Uloží formulár z Kroku 1 do AppState.userProfile.basics
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
    console.log('[Synced] Uložené základné údaje:', AppState.userProfile.basics);
  },

  // Dočasné zhrnutie – v Kroku 2/3 ho nahradí reálny výpočet profilu
  buildSummary() {
    const box = document.getElementById('profileSummary');
    if (!box) return;
    const b = AppState.userProfile.basics;
    box.innerHTML = `
      <p><strong>Základné údaje:</strong> ${b.age ? b.age + ' r.' : '—'}, ${b.location || '—'}</p>
      <p class="placeholder-note">
        Hodnoty, osobnosť a preferencie doplníme v ďalšom kroku –
        potom sa tu zobrazí tvoj kompletný vzťahový profil.
      </p>
    `;
  }
};


/* --------------------------------------------------------------
   3) MOBILNÁ NAVIGÁCIA (hamburger)
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

    // Po kliknutí na odkaz menu zavrieme (na mobile)
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
};


/* --------------------------------------------------------------
   4) PLYNULÝ SCROLL pre tlačidlá s data-scroll="#cieľ"
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
   5) ŠTART APLIKÁCIE
   -------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  Onboarding.init();
  Nav.init();
  SmoothScroll.init();
  console.log('[Synced] Aplikácia inicializovaná ✔');
});
