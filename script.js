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
    dealbreakers: [],
    // Výzor (Krok 5) – abstraktný avatar, KÁNON hodnôt viď docs/vyzor-a-pravidla.md
    appearance: {},             // „Ja": { heightBand, silhouette, hair, style }
    ideal: {                    // „Môj ideál": samé 'nezalezi' = výzor sa ignoruje
      heightBand: 'nezalezi',
      silhouette: 'nezalezi',
      hair: 'nezalezi',
      style: 'nezalezi'
    }
  },

  answers: {},                  // surové odpovede: { qid: hodnota | [hodnoty] }
  compatibilityScore: null,
  currentStep: 1,
  totalSteps: 5,

  // Chat (Krok 4): aktívna konverzácia + história správ podľa matchu
  chat: {
    activeMatchId: null,
    conversations: {}           // { matchId: [ { from:'me'|'them', text } ] }
  }
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
   2b) AVATAR – „Ja" a „Môj ideál" (Krok 5)
   --------------------------------------------------------------
   Abstraktné siluety podľa docs/vyzor-a-pravidla.md (sekcia 2.2).
   KÁNON interných hodnôt – presne tie isté reťazce ako
   v SAMPLE_USERS.appearance (appearanceFit porovnáva reťazce).
   -------------------------------------------------------------- */
const Avatar = {
  fields: [
    { key: 'heightBand', label: 'Výška',
      options: [['nizsia', 'nižšia'], ['stredna', 'stredná'], ['vyssia', 'vyššia']] },
    { key: 'silhouette', label: 'Postava',
      options: [['drobna', 'drobná'], ['atleticka', 'atletická'], ['plna', 'plná'], ['silna', 'silná']] },
    { key: 'hair', label: 'Vlasy',
      options: [['tmave', 'tmavé'], ['svetle', 'svetlé'], ['rysave', 'ryšavé']] },
    { key: 'style', label: 'Štýl',
      options: [['prirodzeny', 'prirodzený'], ['upraveny', 'upravený'], ['sportovy', 'športový']] }
  ],

  init() {
    const selfBox = document.querySelector('[data-avatar="self"]');
    const idealBox = document.querySelector('[data-avatar="ideal"]');
    if (!selfBox || !idealBox) return;

    selfBox.innerHTML = this.panelHTML('appearance', false);
    idealBox.innerHTML = this.panelHTML('ideal', true);

    // Klik na chip → aktívny stav + uloženie do profilu
    document.getElementById('onboarding').addEventListener('click', (e) => {
      const chip = e.target.closest('button[data-avatar-field]');
      if (!chip) return;
      const { avatarTarget, avatarField, avatarValue } = chip.dataset;
      AppState.userProfile[avatarTarget][avatarField] = avatarValue;
      chip.closest('.avatar-chips').querySelectorAll('.avatar-chip')
        .forEach(b => b.classList.toggle('is-active', b === chip));
    });
  },

  panelHTML(target, withNezalezi) {
    return this.fields.map(f => {
      const opts = withNezalezi ? [...f.options, ['nezalezi', 'Nezáleží mi']] : f.options;
      const current = AppState.userProfile[target]?.[f.key];
      return `
        <div class="avatar-field">
          <span class="avatar-field__label">${f.label}</span>
          <div class="avatar-chips">
            ${opts.map(([val, lab]) => `
              <button type="button" class="avatar-chip ${val === current ? 'is-active' : ''}"
                data-avatar-target="${target}" data-avatar-field="${f.key}"
                data-avatar-value="${val}">${lab}</button>`).join('')}
          </div>
        </div>`;
    }).join('');
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

    // Plný vektor hodnôt (všetkých 7) – potrebné pre matchovanie (Krok 3)
    P.valueVector = {};
    D.values.forEach(q => { P.valueVector[q.value] = this.likert(q.id); });

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
   3b) MATCHOVANIE – výpočet kompatibility
   --------------------------------------------------------------
   calculateCompatibility(a, b) → { score 0–100, type, ... }
   Vstupy z profilu: valueVector (7 hodnôt), personality (5 dim), intent
   -------------------------------------------------------------- */

// Priemerný absolútny rozdiel medzi dvoma objektmi so skóre (0–4)
function avgAbsDiff(a, b, keys) {
  let sum = 0;
  keys.forEach(k => { sum += Math.abs((a[k] ?? 3) - (b[k] ?? 3)); });
  return sum / keys.length;
}

function intentScore(a, b) {
  if (!a || !b) return 0.6;
  if (a === b) return 1;                       // rovnaký zámer
  if (a === 'open' || b === 'open') return 0.7; // otvorený možnostiam
  return 0.4;                                   // vážny vzťah vs spoločnosť
}

function relationshipType(valueSim, persComponent, intent) {
  const vHigh = valueSim >= 0.65;
  const pHigh = persComponent >= 0.65;
  if (vHigh && pHigh)  return { type: 'Harmonický pár',  desc: 'Zdieľate hodnoty aj naladenie – prirodzene si rozumiete.' };
  if (vHigh && !pHigh) return { type: 'Kontrastný pár',  desc: 'Spoločné hodnoty, no odlišné povahy – krásne sa dopĺňate.' };
  if (!vHigh && pHigh) return { type: 'Spriaznené duše', desc: 'Podobné naladenie, hodnoty sčasti odlišné – je o čom hovoriť.' };
  return { type: 'Objavný match', desc: 'Zaujímavý potenciál – veľa objavíte cez rozhovor.' };
}

/* --------------------------------------------------------------
   TVRDÉ BRÁNY – filtre pred skórovaním
   --------------------------------------------------------------
   passesHardGates(me, other) → { ok, reasons[] }
   Kto neprejde, do skórovania a zoradenia vôbec nejde.
   'Nečestnosť' NIE je brána (nedá sa merať z profilu).
   -------------------------------------------------------------- */
function passesHardGates(me, other) {
  const reasons = [];

  // 1) ZÁMER: vážny vzťah × spoločnosť sa vylučujú; 'open' je zlučiteľný so všetkým
  const a = me.intent, b = other.intent;
  if ((a === 'serious' && b === 'company') || (a === 'company' && b === 'serious')) {
    reasons.push('nezhoda v zámere');
  }

  // 2) DEALBREAKERY používateľa (z Kroku 4)
  const db = me.dealbreakers || [];

  if (db.includes('Fajčenie') && other.smokes === true) {
    reasons.push('fajčenie');
  }

  if (db.includes('Nezáujem o rodinu') && ((other.valueVector?.rodina ?? 3) <= 2)) {
    reasons.push('nezáujem o rodinu');
  }

  if (db.includes('Rozdielne životné ciele')) {
    const keys = Object.keys(me.valueVector || {});
    const valueSim = keys.length
      ? 1 - avgAbsDiff(me.valueVector || {}, other.valueVector || {}, keys) / 4
      : 1;
    if (valueSim < 0.5) reasons.push('rozdielne životné ciele');
  }

  return { ok: reasons.length === 0, reasons };
}
window.passesHardGates = passesHardGates;


/* --------------------------------------------------------------
   VÝZOR – tichý signál (NIKDY brána, NIKDY percento)
   --------------------------------------------------------------
   appearanceFit(ideal, appearance) → 0–1 alebo null
   Porovnáva len polia, kde ideál !== 'nezalezi'.
   Výsledok sa nikdy nezobrazuje ako číslo – len ako jemný reframe.
   -------------------------------------------------------------- */
function appearanceFit(ideal, appearance) {
  if (!ideal || !appearance) return null;
  const keys = ['heightBand', 'silhouette', 'hair', 'style']
    .filter(k => ideal[k] && ideal[k] !== 'nezalezi');
  if (!keys.length) return null;
  const hits = keys.filter(k => appearance[k] === ideal[k]).length;
  return hits / keys.length;
}
window.appearanceFit = appearanceFit;

// Reframe „dôvod milovať" – bez menovania konkrétnej odchýlky, bez percent
function reframeLove(fit) {
  if (fit == null) return '';
  const text = fit >= 1
    ? 'Sedí do tvojej predstavy – no skutoční ľudia sú vždy o kúsok inde, a to je tá krajšia časť. 💛'
    : 'Niečo na ňom celkom nesedí do tvojej predstavy – a práve to sa časom často stane tým, čo miluješ. 💛';
  return `<p class="match-love-note">${text}</p>`;
}
window.reframeLove = reframeLove;


// Hlavná funkcia – vráti kompatibilitu dvoch používateľov
function calculateCompatibility(a, b) {
  const valueKeys = Object.keys(a.valueVector || {});
  const persKeys = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'stability'];

  // 1) HODNOTY – podobnosť priorít (0–1) + prienik dôležitých hodnôt
  const valueSim = 1 - avgAbsDiff(a.valueVector || {}, b.valueVector || {}, valueKeys) / 4;
  const shared = valueKeys.filter(k => (a.valueVector?.[k] ?? 0) >= 4 && (b.valueVector?.[k] ?? 0) >= 4);

  // 2) OSOBNOSŤ – podobnosť (0–1), s prípadnou doplnkovosťou
  const persSim = 1 - avgAbsDiff(a.personality || {}, b.personality || {}, persKeys) / 4;
  let persComponent = persSim;
  // Ak používateľ preferuje „opak priťahuje", odmeníme rozdiel v extraverzii
  if ((a.complementPreference ?? 3) >= 4) {
    const extDiff = Math.abs((a.personality?.extraversion ?? 3) - (b.personality?.extraversion ?? 3)) / 4;
    persComponent = 0.6 * persSim + 0.4 * extDiff;
  }

  // 3) ZÁMER
  const iScore = intentScore(a.intent, b.intent);

  // Váhy: hodnoty 45 %, osobnosť 35 %, zámer 20 %
  const total = 0.45 * valueSim + 0.35 * persComponent + 0.20 * iScore;
  const score = Math.max(0, Math.min(100, Math.round(total * 100)));

  const rel = relationshipType(valueSim, persComponent, iScore);
  return { score, type: rel.type, desc: rel.desc, shared, valueSim, persComponent, intent: iScore };
}
window.calculateCompatibility = calculateCompatibility;


/* --------------------------------------------------------------
   3c) MATCHES – výpočet a vykreslenie do sekcie #matches
   -------------------------------------------------------------- */
const Matches = {
  render() {
    const grid = document.getElementById('matchesGrid');
    if (!grid) return;

    const me = this.currentUser();
    const users = window.SAMPLE_USERS || [];

    // Safety vrstva: blokovaní/nahlásení sa nezobrazujú vôbec
    // (iná kategória než brány – nepočítajú sa do „skryli sme N")
    const visible = users.filter(u => !Safety.isSuppressed(u.id));
    const suppressedCount = users.length - visible.length;

    // Tvrdé brány: kto neprejde, do skórovania nejde
    const passed = [];
    const filteredOut = [];
    visible.forEach(u => {
      const gate = passesHardGates(me, u);
      if (gate.ok) passed.push(u);
      else filteredOut.push({ user: u, reasons: gate.reasons });
    });

    const ranked = passed
      .map(u => {
        const result = calculateCompatibility(me, u);
        result.appearanceFit = appearanceFit(me.ideal, u.appearance);
        return { user: u, result };
      })
      .sort((a, b) => b.result.score - a.result.score);

    AppState.compatibilityScore = ranked[0]?.result.score ?? null;

    const cards = ranked.map(({ user, result }) => this.cardHTML(user, result)).join('');
    grid.innerHTML = (cards || this.emptyHTML())
      + this.filteredNoteHTML(filteredOut)
      + this.suppressedNoteHTML(suppressedCount);
  },

  // Nenápadný riadok – len keď je niekto blokovaný/nahlásený
  suppressedNoteHTML(n) {
    if (!n) return '';
    return `<p class="match-suppressed-note">🛡️ Niektoré profily nevidíš,
      lebo si ich zablokoval(a) alebo nahlásil(a).</p>`;
  },

  // Priateľský empty-state, keď tvrdými bránami neprejde nikto
  emptyHTML() {
    return `
      <div class="match-empty">
        <div class="match-empty__icon">🌱</div>
        <h3>Zatiaľ žiadny match</h3>
        <p>Tvoje „no-go" kritériá teraz nepustili nikoho ďalej – a to je v poriadku,
           radšej menej, ale poctivo. Skús sa vrátiť neskôr, alebo si v teste
           uprav svoje dealbreakery.</p>
      </div>`;
  },

  // Transparentná poznámka: koľko profilov a prečo sme skryli
  filteredNoteHTML(filteredOut) {
    if (!filteredOut.length) return '';
    const n = filteredOut.length;
    const word = n === 1 ? 'profil' : (n <= 4 ? 'profily' : 'profilov');
    const reasons = [...new Set(filteredOut.flatMap(f => f.reasons))].join(', ');
    return `<p class="match-filtered-note">🔒 ${n} ${word} sme skryli, lebo
      nesedia s tvojimi tvrdými kritériami (${reasons}).</p>`;
  },

  // Zostaví „mňa" z profilu do rovnakého tvaru ako sample users
  currentUser() {
    const P = AppState.userProfile;
    return {
      name: 'Ty',
      intent: P.relationshipIntent,
      valueVector: P.valueVector || {},
      personality: P.personality.scores || {},
      complementPreference: P.complementPreference,
      dealbreakers: P.dealbreakers || [],
      appearance: P.appearance || {},
      ideal: P.ideal || { heightBand: 'nezalezi', silhouette: 'nezalezi', hair: 'nezalezi', style: 'nezalezi' }
    };
  },

  cardHTML(user, r) {
    const sharedTxt = r.shared.length ? r.shared.join(', ') : 'objavíte spolu';
    return `
      <article class="match-card">
        <div class="match-card__head">
          <h3>${user.name}, ${user.age}</h3>
          <span class="match-badge">${r.score}%</span>
        </div>
        <p class="match-type">${r.type}</p>
        <p class="match-desc">${r.desc}</p>
        <p class="match-meta">📍 ${user.location}</p>
        <p class="match-meta">💛 Spoločné hodnoty: ${sharedTxt}</p>
        ${reframeLove(r.appearanceFit)}
        <p class="match-bio">„${user.bio}"</p>
        <button class="btn-primary" data-scroll="#chat">Napíš správu</button>
      </article>`;
  }
};


/* --------------------------------------------------------------
   3d) AI NÁVRHY SPRÁV (zatiaľ pravidlá v JS – bez reálnej AI)
   --------------------------------------------------------------
   generate(userProfile, matchProfile, messages) → [ návrhy ]
   Neskôr stačí telo funkcie nahradiť volaním AI API (viď koniec).
   -------------------------------------------------------------- */
const AiSuggestions = {
  // Otázka „na telo" pre každú hodnotu
  valueQuestion: {
    'rodina':        'Čo pre teba znamená rodina?',
    'kariéra':       'Čo ťa na tvojej práci najviac napĺňa?',
    'pokoj':         'Ako najradšej relaxuješ po náročnom dni?',
    'spiritualita':  'Čo ti dáva v živote hlbší zmysel?',
    'osobný rast':   'Na čom na sebe práve teraz pracuješ?',
    'sloboda':       'Čo pre teba znamená sloboda vo vzťahu?',
    'dobrodružstvo': 'Aké bolo tvoje najlepšie dobrodružstvo?'
  },

  generate(user, match, messages = []) {
    const out = [];
    const shared = this.sharedValues(user, match);

    // 1) Otázka podľa najsilnejšej spoločnej hodnoty
    if (shared.length) {
      out.push(this.valueQuestion[shared[0]] || `Povedz mi viac o tom, čo je pre teba dôležité.`);
    }

    // 2) Návrh podľa povahy matchu (extraverzia)
    const ext = match?.personality?.extraversion ?? 3;
    if (ext >= 4) out.push('Navrhni spoločnú aktivitu – ideš cez víkend do niečoho?');
    else out.push('Spýtaj sa na obľúbený pokojný večer či knihu.');

    // 3) Otvárač alebo nadviazanie podľa stavu konverzácie
    if (!messages.length) {
      const val = shared[0] || (match?.topValue);
      out.push(val
        ? `Ahoj! Videl(a) som, že obom nám sedí „${val}". Ako to máš ty? 😊`
        : 'Ahoj! Čo ti dnes spravilo radosť? 😊');
    } else {
      const last = messages[messages.length - 1];
      if (last.from === 'them' && last.text.includes('?')) {
        out.push('Odpovedz úprimne a otázku vráť naspäť.');
      } else {
        out.push('Pochváľ niečo z jej/jeho profilu a nadviaž otázkou.');
      }
    }

    // Max 3 unikátne návrhy
    return [...new Set(out)].slice(0, 3);
  },

  sharedValues(user, match) {
    const uv = user?.valueVector || {};
    const mv = match?.valueVector || {};
    return Object.keys(uv)
      .filter(k => (uv[k] ?? 0) >= 4 && (mv[k] ?? 0) >= 4)
      .sort((a, b) => (mv[b] + uv[b]) - (mv[a] + uv[a]));
  }

  /* ---- BUDÚCE NAPOJENIE NA REÁLNE AI ----
     async generateAI(user, match, messages) {
       const res = await fetch('/api/suggestions', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ user, match, messages })
       });
       return (await res.json()).suggestions;
     }
  ---------------------------------------- */
};


/* --------------------------------------------------------------
   3d2) SAFETY – report, blok a feedback po rande
   --------------------------------------------------------------
   Ochranná vrstva proti nátlaku (docs/vyzor-a-pravidla.md, 5B).
   Rozsah teraz = vymáhanie na strane používateľa: suppressed
   profily sa skryjú z MOJICH matchov a chatu.
   TODO: presunúť do Supabase (tabuľky blocks/reports/date_feedback)
   – potom bude vymáhanie globálne (strike systém pre celú appku).
   localStorage je len dočasný most, aby prototyp prežil refresh.
   -------------------------------------------------------------- */
const Safety = {
  KEY: 'synced_safety_v1',
  data: { blocked: [], reported: [], strikes: {}, dateFeedback: [] },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) this.data = { ...this.data, ...JSON.parse(raw) };
    } catch (_) { /* poškodené dáta ignorujeme, ostane čistý stav */ }
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (_) {}
  },

  isSuppressed(userId) {
    return this.data.blocked.includes(userId)
      || this.data.reported.some(r => r.id === userId)
      || (this.data.strikes[userId] || 0) >= 1;
  },

  block(id) {
    if (!this.data.blocked.includes(id)) this.data.blocked.push(id);
    this.save();
  },

  report(id, dovod, text) {
    this.data.reported.push({ id, dovod, text: text || '' });
    this.save();
  },

  recordDate(id, vysledok) {
    this.data.dateFeedback.push({ id, vysledok });
    if (vysledok === 'nataku') {
      this.data.strikes[id] = (this.data.strikes[id] || 0) + 1;
    }
    this.save();
  }
};
window.Safety = Safety;


/* --------------------------------------------------------------
   3d3) SAFETY UI – ⋯ menu v chate + modaly (vzor Modal/Billing)
   -------------------------------------------------------------- */
const SafetyUI = {
  reasons: [
    'Tlačil(a) na sex / sexuálny nátlak',
    'Obťažovanie alebo neúcta',
    'Falošný profil / iný než tvrdil(a)',
    'Niečo iné'
  ],

  init() {
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('chatSafetyMenu');

      // ⋯ prepína menu; klik kamkoľvek inam ho zavrie
      if (e.target.closest('[data-safety-menu]')) {
        if (menu) menu.hidden = !menu.hidden;
        return;
      }
      if (menu && !menu.hidden && !e.target.closest('#chatSafetyMenu')) menu.hidden = true;

      const action = e.target.closest('[data-safety-action]');
      if (action) {
        const id = action.dataset.safetyId;
        if (action.dataset.safetyAction === 'block') this.confirmBlock(id);
        if (action.dataset.safetyAction === 'report') this.openReport(id);
        return;
      }

      const dateBtn = e.target.closest('[data-date-feedback]');
      if (dateBtn) { this.openDateFeedback(dateBtn.dataset.safetyId); return; }

      const confirmBlock = e.target.closest('[data-confirm-block]');
      if (confirmBlock) { this.doBlock(confirmBlock.dataset.confirmBlock); return; }

      const reportSubmit = e.target.closest('[data-report-submit]');
      if (reportSubmit) { this.doReport(reportSubmit.dataset.reportSubmit); return; }

      const dateResult = e.target.closest('[data-date-result]');
      if (dateResult) this.doDate(dateResult.dataset.safetyId, dateResult.dataset.dateResult);
    });

    // Výber dôvodu odomkne odoslanie reportu
    document.addEventListener('change', (e) => {
      if (e.target.name === 'reportReason') {
        const btn = document.querySelector('[data-report-submit]');
        if (btn) btn.disabled = false;
      }
    });
  },

  userName(id) {
    const u = (window.SAMPLE_USERS || []).find(x => x.id === id);
    return u ? u.name : 'tento profil';
  },

  // Po skrytí profilu obnov chat aj matchy
  afterSuppress() {
    Chat.closeConversation();
    Chat.renderList();
    Matches.render();
  },

  /* --- BLOK --- */
  confirmBlock(id) {
    Modal.open(`
      <h3 class="modal__title">🚫 Zablokovať ${this.userName(id)}?</h3>
      <p class="modal__desc">Už sa vám nezobrazí a nemôžete si písať.</p>
      <div class="safety-actions">
        <button class="btn-secondary" data-close-modal>Zrušiť</button>
        <button class="btn-primary" data-confirm-block="${id}">Zablokovať</button>
      </div>`);
  },

  doBlock(id) {
    Safety.block(id);
    this.afterSuppress();
    Modal.open(`
      <div class="pay-success">
        <div class="pay-success__icon">🚫</div>
        <h3>Hotovo</h3>
        <p>Profil bol zablokovaný.</p>
        <button class="btn-primary" data-close-modal>OK</button>
      </div>`);
  },

  /* --- REPORT --- */
  openReport(id) {
    Modal.open(`
      <h3 class="modal__title">🚩 Nahlásiť ${this.userName(id)}</h3>
      <p class="modal__desc">Čo sa stalo? Zostane to medzi nami.</p>
      <div class="opts safety-reasons">
        ${this.reasons.map(r => `
        <label class="opt">
          <input type="radio" name="reportReason" value="${r}"> <span>${r}</span>
        </label>`).join('')}
      </div>
      <label class="safety-text">Chceš doplniť detail? (nepovinné)
        <textarea id="reportText" rows="3" placeholder="Napíš, čo sa stalo…"></textarea>
      </label>
      <div class="safety-actions">
        <button class="btn-secondary" data-close-modal>Zrušiť</button>
        <button class="btn-primary" data-report-submit="${id}" disabled>Odoslať</button>
      </div>`);
  },

  doReport(id) {
    const reason = document.querySelector('input[name="reportReason"]:checked')?.value;
    if (!reason) return;
    const text = (document.getElementById('reportText')?.value || '').trim();
    Safety.report(id, reason, text);
    this.afterSuppress();
    Modal.open(`
      <div class="pay-success">
        <div class="pay-success__icon">💛</div>
        <h3>Ďakujeme</h3>
        <p>Ďakujeme, že si to nahlásil(a). Tento profil sa ti už nezobrazí
           a záznam sme si uložili.</p>
        <button class="btn-primary" data-close-modal>OK</button>
      </div>`);
  },

  /* --- FEEDBACK PO RANDE --- */
  openDateFeedback(id) {
    Modal.open(`
      <h3 class="modal__title">🌹 Boli ste na rande</h3>
      <p class="modal__desc">Správal(a) sa ${this.userName(id)} v poriadku?</p>
      <div class="safety-date-options">
        <button class="btn-secondary" data-date-result="ok" data-safety-id="${id}">Áno, v pohode 👍</button>
        <button class="btn-secondary" data-date-result="slabe" data-safety-id="${id}">Skôr nie</button>
        <button class="btn-secondary" data-date-result="nataku" data-safety-id="${id}">Tlačil(a) na sex / bol(a) neúctivý(á)</button>
      </div>`);
  },

  doDate(id, result) {
    Safety.recordDate(id, result);
    if (Safety.isSuppressed(id)) this.afterSuppress();
    const reassure = (result === 'slabe' || result === 'nataku')
      ? '<p>Mrzí nás to. Postaráme sa, aby si takýto prístup nemusel(a) zažiť znova.</p>'
      : '';
    Modal.open(`
      <div class="pay-success">
        <div class="pay-success__icon">💛</div>
        <h3>Ďakujeme za spätnú väzbu</h3>
        ${reassure}
        <button class="btn-primary" data-close-modal>OK</button>
      </div>`);
  }
};


/* --------------------------------------------------------------
   3e) CHAT – zoznam konverzácií, správy, napojenie návrhov
   -------------------------------------------------------------- */
const Chat = {
  init() {
    this.listEl = document.getElementById('chatList');
    this.msgEl = document.getElementById('chatMessages');
    this.headerEl = document.getElementById('chatHeader');
    this.suggEl = document.getElementById('suggestionList');
    this.form = document.getElementById('chatForm');
    this.input = document.getElementById('chatInput');
    if (!this.listEl) return;

    this.renderList();

    // Výber konverzácie
    this.listEl.addEventListener('click', (e) => {
      const li = e.target.closest('li[data-match]');
      if (li) this.openConversation(li.dataset.match);
    });

    // Odoslanie správy
    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Klik na návrh → vloží do inputu
    this.suggEl?.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-suggestion]');
      if (!btn) return;
      this.input.value = btn.dataset.suggestion;
      this.input.focus();
    });
  },

  // Zoznam konverzácií = matchy (ak je hotový profil, aj s %)
  // Blokovaní/nahlásení sa v zozname vôbec neukážu
  renderList() {
    const users = (window.SAMPLE_USERS || []).filter(u => !Safety.isSuppressed(u.id));
    const me = (typeof Matches !== 'undefined') ? Matches.currentUser() : null;
    const hasProfile = me && Object.keys(me.valueVector || {}).length;

    const rows = users.map(u => {
      const pct = hasProfile ? calculateCompatibility(me, u).score : null;
      return { u, pct };
    }).sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));

    this.listEl.innerHTML = rows.map(({ u, pct }) => `
      <li data-match="${u.id}" class="${u.id === AppState.chat.activeMatchId ? 'is-active' : ''}">
        ${u.name}${pct != null ? ` <span class="chat-list__pct">${pct}%</span>` : ''}
      </li>`).join('');
  },

  openConversation(matchId) {
    if (Safety.isSuppressed(matchId)) return;   // so suppressed profilom sa nepíše
    AppState.chat.activeMatchId = matchId;
    const match = (window.SAMPLE_USERS || []).find(u => u.id === matchId);
    if (!match) return;

    // Prvá otvorená konverzácia = uvítacia správa od matchu
    if (!AppState.chat.conversations[matchId]) {
      AppState.chat.conversations[matchId] = [
        { from: 'them', text: `Ahoj! Teší ma, že sme si padli do oka. 😊 ${match.bio}` }
      ];
    }

    this.headerEl.innerHTML = `
      <span><strong>${match.name}, ${match.age}</strong> · ${match.location}</span>
      <span class="chat-safety">
        <button type="button" class="btn-secondary chat-date-btn"
          data-date-feedback data-safety-id="${match.id}">🌹 Boli sme na rande</button>
        <span class="chat-menu-wrap">
          <button type="button" class="chat-menu-btn" data-safety-menu
            aria-label="Ďalšie možnosti" aria-haspopup="true">⋯</button>
          <span class="chat-menu" id="chatSafetyMenu" hidden>
            <button type="button" data-safety-action="report" data-safety-id="${match.id}">🚩 Nahlásiť</button>
            <button type="button" data-safety-action="block" data-safety-id="${match.id}">🚫 Blokovať</button>
          </span>
        </span>
      </span>`;
    this.renderList();
    this.renderMessages();
    this.refreshSuggestions();
  },

  // Zavrie aktívnu konverzáciu (po bloku/reporte/strike)
  closeConversation() {
    AppState.chat.activeMatchId = null;
    if (this.headerEl) this.headerEl.innerHTML = '<span>Vyber si konverzáciu vľavo 💬</span>';
    if (this.msgEl) this.msgEl.innerHTML = '';
    if (this.suggEl) this.suggEl.innerHTML = '';
  },

  renderMessages() {
    const msgs = AppState.chat.conversations[AppState.chat.activeMatchId] || [];
    this.msgEl.innerHTML = msgs.map(m =>
      `<div class="message message-${m.from === 'me' ? 'me' : 'them'}">${this.escape(m.text)}</div>`
    ).join('');
    this.msgEl.scrollTop = this.msgEl.scrollHeight;
  },

  sendMessage() {
    const text = (this.input.value || '').trim();
    const id = AppState.chat.activeMatchId;
    if (!text || !id) return;

    AppState.chat.conversations[id].push({ from: 'me', text });
    this.input.value = '';
    this.renderMessages();

    // Jednoduchá simulovaná odpoveď (neskôr nahradí reálny druhý používateľ)
    setTimeout(() => {
      AppState.chat.conversations[id].push({ from: 'them', text: this.autoReply() });
      this.renderMessages();
      this.refreshSuggestions();
    }, 900);

    this.refreshSuggestions();
  },

  autoReply() {
    const replies = [
      'To znie super, povedz mi viac! 😊',
      'Presne tak to cítim aj ja.',
      'Zaujímavé! A ako si sa k tomu dostal(a)?',
      'Haha, to sa mi páči.'
    ];
    // Deterministicky podľa počtu správ (bez Math.random)
    const msgs = AppState.chat.conversations[AppState.chat.activeMatchId] || [];
    return replies[msgs.length % replies.length];
  },

  refreshSuggestions() {
    const match = (window.SAMPLE_USERS || []).find(u => u.id === AppState.chat.activeMatchId);
    const me = (typeof Matches !== 'undefined') ? Matches.currentUser() : { valueVector: {} };
    const msgs = AppState.chat.conversations[AppState.chat.activeMatchId] || [];
    const suggestions = AiSuggestions.generate(me, match, msgs);

    this.suggEl.innerHTML = suggestions.map(s =>
      `<button type="button" data-suggestion="${this.escape(s)}">${this.escape(s)}</button>`
    ).join('');
  },

  escape(str) {
    return String(str).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
};


/* --------------------------------------------------------------
   3f) VIDEO OVERENIE (placeholder – napojí sa na Supabase Storage)
   -------------------------------------------------------------- */
const VideoVerification = {
  init() {
    this.consent = document.getElementById('verifyConsent');
    this.pick = document.getElementById('verifyPick');
    this.file = document.getElementById('verifyFile');
    this.send = document.getElementById('verifySend');
    this.preview = document.getElementById('verifyPreview');
    this.status = document.getElementById('verifyStatus');
    if (!this.consent) return;

    // Súhlas GDPR odomkne nahrávanie
    this.consent.addEventListener('change', () => {
      this.pick.disabled = !this.consent.checked;
    });

    this.pick.addEventListener('click', () => this.file.click());

    this.file.addEventListener('change', () => {
      const f = this.file.files[0];
      if (!f) return;
      this.preview.src = URL.createObjectURL(f);
      this.preview.hidden = false;
      this.send.disabled = false;
    });

    this.send.addEventListener('click', () => this.upload());
  },

  upload() {
    // TODO: napojiť na Supabase Storage:
    //   const { data } = await supabase.storage
    //     .from('verification-videos')
    //     .upload(`${userId}/${Date.now()}.webm`, file);
    //   → následne vytvoriť záznam v DB so statusom 'pending'
    this.setStatus('pending');
    this.send.disabled = true;
    console.log('[Synced] (placeholder) Video odoslané na overenie – napojí sa na Supabase.');
  },

  setStatus(state) {
    const map = {
      none:     ['verify__badge--none', 'Neoverené'],
      pending:  ['verify__badge--pending', 'Čaká sa na overenie…'],
      verified: ['verify__badge--ok', 'Overený profil ✅']
    };
    const [cls, txt] = map[state] || map.none;
    this.status.innerHTML = `<span class="verify__badge ${cls}">${txt}</span>`;
  }
};


/* --------------------------------------------------------------
   3g) VIDEO CHAT (placeholder – napojí sa na Daily.co / WebRTC)
   -------------------------------------------------------------- */
const VideoChat = {
  init() {
    this.idle = document.getElementById('videoIdle');
    this.call = document.getElementById('videoCall');
    this.remoteLabel = document.getElementById('videoRemoteLabel');
    if (!this.idle) return;

    document.getElementById('videoStart')?.addEventListener('click', () => this.startCall());
    document.getElementById('videoEnd')?.addEventListener('click', () => this.endCall());
    document.getElementById('videoMic')?.addEventListener('click', (e) => this.toggle(e.currentTarget));
    document.getElementById('videoCam')?.addEventListener('click', (e) => this.toggle(e.currentTarget));
  },

  startCall() {
    // TODO: napojiť na Daily.co:
    //   const call = DailyIframe.createFrame(container);
    //   call.join({ url: roomUrl, token });  // room + token vytvorí backend
    this.idle.hidden = true;
    this.call.hidden = false;

    // Placeholder: „spojenie" s aktívnym matchom (ak je vybraný v chate)
    const match = (window.SAMPLE_USERS || []).find(u => u.id === AppState.chat.activeMatchId);
    this.remoteLabel.textContent = 'Čaká sa na spojenie…';
    setTimeout(() => {
      this.remoteLabel.textContent = match ? `${match.name} 🎥` : 'Spojené 🎥';
    }, 1200);
    console.log('[Synced] (placeholder) Video hovor spustený – napojí sa na Daily.co.');
  },

  endCall() {
    // TODO: call.leave(); call.destroy();
    this.call.hidden = true;
    this.idle.hidden = false;
  },

  toggle(btn) {
    btn.classList.toggle('is-off');
  }
};


/* --------------------------------------------------------------
   3h) MODAL – univerzálne okno (checkout + právne texty)
   -------------------------------------------------------------- */
const Modal = {
  init() {
    this.overlay = document.getElementById('modal');
    this.body = document.getElementById('modalBody');
    if (!this.overlay) return;
    document.getElementById('modalClose')?.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => { if (e.target === this.overlay) this.close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.close(); });
    // Delegované zatváracie tlačidlá vnútri modalu
    this.body.addEventListener('click', (e) => {
      if (e.target.closest('[data-close-modal]')) this.close();
    });
  },
  open(html) { if (!this.overlay) return; this.body.innerHTML = html; this.overlay.hidden = false; },
  close() { if (!this.overlay) return; this.overlay.hidden = true; this.body.innerHTML = ''; }
};


/* --------------------------------------------------------------
   3i) BILLING – monetizácia (mock, pripravené na Stripe)
   -------------------------------------------------------------- */
const Billing = {
  products: {
    premium:      { name: 'Synced Premium',       price: 12.99, unit: ' / mesiac', icon: '💛', badge: 'Najobľúbenejšie',
                    desc: 'Neobmedzené matchy, uvidíš kto ťa má rád, prémiové filtre a žiadne reklamy.', cta: 'Aktivovať Premium' },
    verification: { name: 'Overenie identity',     price: 2.99,  unit: '', icon: '✅',
                    desc: 'Odznak „Overený profil" – väčšia dôvera a kvalitnejšie matchy.', cta: 'Overiť sa' },
    boost:        { name: 'Boost profilu',         price: 3.99,  unit: '', icon: '⚡',
                    desc: '30 minút na vrchole – až 10× viac zobrazení tvojho profilu.', cta: 'Boostnúť profil' },
    report:       { name: 'Kompatibilita report',  price: 3.99,  unit: '', icon: '📊',
                    desc: 'Detailný rozbor tvojho súladu s konkrétnym matchom.', cta: 'Získať report' }
  },

  init() {
    this.grid = document.getElementById('pricingGrid');
    if (this.grid) this.renderGrid();
    // Delegované CTA na kúpu (funguje aj pre data-buy mimo cenníka)
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-buy]');
      if (!b) return;
      e.preventDefault();
      this.openCheckout(b.dataset.buy);
    });
  },

  fmt(p) { return p.toFixed(2).replace('.', ',') + ' €'; },

  renderGrid() {
    this.grid.innerHTML = Object.entries(this.products).map(([key, p]) => `
      <article class="price-card ${p.badge ? 'price-card--featured' : ''}">
        ${p.badge ? `<span class="price-card__badge">${p.badge}</span>` : ''}
        <div class="price-card__icon">${p.icon}</div>
        <h3>${p.name}</h3>
        <p class="price-card__price">${this.fmt(p.price)}<span>${p.unit}</span></p>
        <p class="price-card__desc">${p.desc}</p>
        <button class="btn-primary" data-buy="${key}">${p.cta}</button>
      </article>`).join('');
  },

  openCheckout(key) {
    const p = this.products[key];
    if (!p) return;
    Modal.open(`
      <h3 class="modal__title">${p.icon} ${p.name}</h3>
      <p class="modal__price">${this.fmt(p.price)}${p.unit}</p>
      <p class="modal__desc">${p.desc}</p>
      <div class="pay-form">
        <label>Číslo karty <input type="text" placeholder="4242 4242 4242 4242" inputmode="numeric"></label>
        <div class="pay-row">
          <label>Platnosť <input type="text" placeholder="MM/RR"></label>
          <label>CVC <input type="text" placeholder="123"></label>
        </div>
      </div>
      <button class="btn-primary btn-lg pay-btn" data-pay="${key}">Zaplatiť ${this.fmt(p.price)}</button>
      <p class="pay-note">🔒 Mock platba – tu sa napojí Stripe, nič sa reálne nestrhne.</p>
    `);
    document.querySelector('[data-pay]')?.addEventListener('click', () => this.pay(key));
  },

  pay(key) {
    const p = this.products[key];
    // TODO: Stripe – vytvoriť checkout session na serveri a presmerovať:
    //   const { url } = await fetch('/api/create-checkout',
    //       { method:'POST', body: JSON.stringify({ product: key }) }).then(r => r.json());
    //   window.location = url;
    AppState.payments = AppState.payments || [];
    AppState.payments.push({ product: key, amount: p.price, currency: 'eur', status: 'paid' });
    console.log('[Synced] (mock) Platba zaznamenaná:', key, p.price);
    this.applyEffect(key);
  },

  applyEffect(key) {
    if (key === 'report') return this.showReport();
    let msg = '';
    if (key === 'premium') { AppState.userProfile.isPremium = true; msg = 'Premium je aktívny 💛 Užime si neobmedzené matchy!'; }
    else if (key === 'verification') { if (typeof VideoVerification !== 'undefined') VideoVerification.setStatus('verified'); msg = 'Tvoj profil je overený ✅'; }
    else if (key === 'boost') { msg = 'Boost beží ⚡ Tvoj profil je 30 minút na vrchole.'; }
    Modal.open(`
      <div class="pay-success">
        <div class="pay-success__icon">🎉</div>
        <h3>Ďakujeme!</h3>
        <p>${msg}</p>
        <button class="btn-primary" data-close-modal>Super</button>
      </div>`);
  },

  showReport() {
    const me = (typeof Matches !== 'undefined') ? Matches.currentUser() : { valueVector: {} };
    const users = window.SAMPLE_USERS || [];
    if (!Object.keys(me.valueVector || {}).length || !users.length) {
      Modal.open(`<div class="pay-success"><h3>📊 Kompatibilita report</h3>
        <p>Najprv dokonči test kompatibility, aby sme mali z čoho report vytvoriť. 😊</p>
        <button class="btn-primary" data-close-modal>OK</button></div>`);
      return;
    }
    const top = users.map(u => ({ u, r: calculateCompatibility(me, u) }))
                     .sort((a, b) => b.r.score - a.r.score)[0];
    Modal.open(`
      <h3 class="modal__title">📊 Report: ty & ${top.u.name}</h3>
      <p class="report-score">${top.r.score}% · ${top.r.type}</p>
      <p class="modal__desc">${top.r.desc}</p>
      <ul class="report-list">
        <li>Zhoda hodnôt: <b>${Math.round(top.r.valueSim * 100)}%</b></li>
        <li>Súlad osobností: <b>${Math.round(top.r.persComponent * 100)}%</b></li>
        <li>Zhoda zámeru: <b>${Math.round(top.r.intent * 100)}%</b></li>
        <li>Spoločné hodnoty: <b>${top.r.shared.join(', ') || '—'}</b></li>
      </ul>
      <button class="btn-primary" data-close-modal>Zavrieť</button>`);
  }
};


/* --------------------------------------------------------------
   3j) LEGAL – právne texty (placeholder, nahradí právnik)
   -------------------------------------------------------------- */
const Legal = {
  texts: {
    terms: {
      title: 'Obchodné podmienky',
      body: `<p><em>Placeholder – tento text nahradí finálne právne znenie.</em></p>
        <p>Používaním aplikácie Synced súhlasíš s týmito obchodnými podmienkami. Synced je platforma
        na zoznamovanie založená na hodnotách a kompatibilite. Služby sú dostupné osobám starším ako 18 rokov.</p>
        <p>Časť služieb je spoplatnená (Premium, overenie identity, boost, report). Platby spracúva
        externá platobná brána. Predplatné sa obnovuje podľa zvoleného obdobia, kým ho nezrušíš.</p>
        <p>Zaväzuješ sa uvádzať pravdivé údaje a správať sa k ostatným s rešpektom. Vyhradzujeme si právo
        pozastaviť účty porušujúce pravidlá.</p>`
    },
    privacy: {
      title: 'Ochrana osobných údajov',
      body: `<p><em>Placeholder – tento text nahradí finálne GDPR znenie.</em></p>
        <p>Spracúvame údaje, ktoré nám poskytneš (profil, odpovede z testu kompatibility, správy) na účel
        poskytovania služby a hľadania vhodných matchov. Overovacie video je citlivý údaj a spracúvame ho
        len na overenie identity.</p>
        <p>Údaje nezdieľame s tretími stranami okrem spracovateľov nevyhnutných na chod služby (hosting,
        platby). Máš právo na prístup, opravu a výmaz svojich údajov.</p>
        <p>Kontakt pre otázky ochrany súkromia: privacy@synced.app (placeholder).</p>`
    },
    cookies: {
      title: 'Cookies',
      body: `<p><em>Placeholder – tento text nahradí finálne cookie znenie.</em></p>
        <p>Používame nevyhnutné cookies na prihlásenie a fungovanie aplikácie a (po tvojom súhlase)
        analytické cookies na zlepšovanie služby.</p>
        <p>Súhlas s cookies môžeš kedykoľvek zmeniť v nastaveniach prehliadača alebo v nastaveniach aplikácie.</p>`
    }
  },
  init() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-legal]');
      if (!a) return;
      e.preventDefault();
      this.open(a.dataset.legal);
    });
  },
  open(key) {
    const t = this.texts[key];
    if (!t) return;
    Modal.open(`<h3 class="modal__title">${t.title}</h3><div class="legal-text">${t.body}</div>
      <button class="btn-secondary" data-close-modal>Rozumiem</button>`);
  }
};


/* --------------------------------------------------------------
   3k) INVITE – zdieľateľný výsledok + „pozvi a porovnaj" + referral
   --------------------------------------------------------------
   Funguje bez backendu: profil pozývateľa sa zakóduje do linku.
   Neskôr: referral počítanie a odmeny rieši backend.
   -------------------------------------------------------------- */
const Invite = {
  currentName: '',

  init() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-share]')) { e.preventDefault(); this.openShareModal(); }
    });
    this.checkIncoming();
  },

  // --- Kódovanie profilu do linku (UTF-8 safe base64) ---
  encodeProfile(name) {
    const P = AppState.userProfile;
    const data = { n: name || '', t: P.personality.type || '', i: P.relationshipIntent || '',
                   v: P.valueVector || {}, p: P.personality.scores || {} };
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  },
  decodeProfile(str) {
    try { return JSON.parse(decodeURIComponent(escape(atob(str)))); } catch (_) { return null; }
  },

  buildLink(name) {
    const base = location.origin + location.pathname;
    const enc = this.encodeProfile(name);
    return `${base}?ref=SYNCED&invite=${encodeURIComponent(enc)}`;
  },

  openShareModal() {
    const P = AppState.userProfile;
    const hasProfile = !!(P.personality && P.personality.type);
    const link = this.buildLink(this.currentName);
    const values = (P.values || []).map(v => v.label).join(' · ') || '—';

    Modal.open(`
      <h3 class="modal__title">💌 Pozvi kamoša a porovnajte sa</h3>
      ${hasProfile ? `
      <div class="share-card">
        <div class="share-card__emoji">💛</div>
        <p class="share-card__type">${this.esc(P.personality.type)}</p>
        <p class="share-card__values">${this.esc(values)}</p>
        <p class="share-card__tag">Aký vzťahový typ si ty? Zisti to na Synced.</p>
      </div>` : `<p class="modal__desc">Sprav si najprv test, aby si mohol(a) zdieľať svoj vzťahový typ a porovnať sa. 🙂</p>`}

      <label class="share-name">Tvoje meno (nepovinné – pre osobnejšiu pozvánku)
        <input type="text" id="shareName" value="${this.esc(this.currentName)}" placeholder="Napr. Júlia">
      </label>

      <label class="share-link-label">Tvoj pozývací link
        <span class="share-link">
          <input type="text" id="shareLink" readonly value="${this.esc(link)}">
          <button class="btn-primary" id="shareCopy">Kopírovať</button>
        </span>
      </label>
      <button class="btn-secondary" id="shareNative">📲 Zdieľať…</button>

      <div class="referral">
        <p class="referral__title">🎁 Pozvi 3 kamošov = Premium na mesiac zadarmo</p>
        <div class="referral__bar"><span style="width:0%"></span></div>
        <p class="referral__count">0 / 3 pozvaní</p>
        <p class="pay-note">Počítanie pozvaní a odmeny sa napoja na backend – zatiaľ ukážka mechaniky.</p>
      </div>
    `);

    const nameEl = document.getElementById('shareName');
    const linkEl = document.getElementById('shareLink');
    nameEl?.addEventListener('input', () => {
      this.currentName = nameEl.value;
      linkEl.value = this.buildLink(this.currentName);
    });
    document.getElementById('shareCopy')?.addEventListener('click', () => this.copy(linkEl));
    document.getElementById('shareNative')?.addEventListener('click', () => this.nativeShare(linkEl.value));
  },

  copy(input) {
    input.select();
    const done = () => { const b = document.getElementById('shareCopy'); if (b) b.textContent = 'Skopírované ✓'; };
    if (navigator.clipboard) navigator.clipboard.writeText(input.value).then(done).catch(done);
    else { try { document.execCommand('copy'); done(); } catch (_) {} }
  },

  nativeShare(url) {
    const text = 'Aký si vzťahový typ? Zisti to na Synced 💛';
    if (navigator.share) navigator.share({ title: 'Synced', text, url }).catch(() => {});
    else this.copy(document.getElementById('shareLink'));
  },

  // --- Prichádzajúca pozvánka ---
  checkIncoming() {
    const inv = new URLSearchParams(location.search).get('invite');
    if (!inv) return;
    const prof = this.decodeProfile(inv);
    if (prof) { AppState.inviter = prof; this.showWelcome(prof); }
  },

  showWelcome(prof) {
    const bar = document.createElement('div');
    bar.className = 'invite-banner';
    const who = prof.n ? `<strong>${this.esc(prof.n)}</strong>` : 'Niekto';
    bar.innerHTML = `💛 ${who} ťa pozval(a) na Synced – sprav si test a zistite váš súlad!
      <button class="btn-primary" data-scroll="#signup">Spustiť test</button>`;
    document.body.prepend(bar);
  },

  // Pozývateľ ako „user" pre výpočet kompatibility
  inviterUser() {
    const p = AppState.inviter;
    if (!p) return null;
    return { name: p.n || 'tvoj pozývateľ', valueVector: p.v || {}, personality: p.p || {}, intent: p.i };
  },

  esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
    // Po Kroku 5 (avatar) spočítame profil a vykreslíme zhrnutie
    if (AppState.currentStep === 5) {
      Scoring.computeProfile();
      this.renderSummary();
      this.syncProfileSection();
      Matches.render();           // naplní sekciu #matches reálnymi dátami
      Chat.renderList();          // aktualizuje zoznam konverzácií o % kompatibility
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

    // Ak používateľ prišiel cez pozvánku – ukáž % súlad s pozývateľom
    let compareBlock = '';
    const inviter = (typeof Invite !== 'undefined') ? Invite.inviterUser() : null;
    if (inviter) {
      const r = calculateCompatibility(Matches.currentUser(), inviter);
      compareBlock = `
        <div class="summary-card summary-card--compare">
          <h4>💞 Ty & ${Invite.esc(inviter.name)}: ${r.score}%</h4>
          <p class="summary-sub">${r.type} – ${r.desc}</p>
        </div>`;
    }

    box.innerHTML = `
      ${compareBlock}
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
      <div class="summary-actions">
        <button class="btn-primary" data-share>💌 Pozvi kamoša a porovnajte sa</button>
        <button class="btn-secondary" data-buy="report">📊 Detailný report</button>
      </div>
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
  Safety.load();                // pred Chat/Matches – rešpektuje uložené bloky
  Questions.init();
  Avatar.init();
  Onboarding.init();
  Chat.init();
  SafetyUI.init();
  VideoVerification.init();
  VideoChat.init();
  Modal.init();
  Billing.init();
  Legal.init();
  Invite.init();
  Nav.init();
  SmoothScroll.init();
  console.log('[Synced] Aplikácia inicializovaná ✔');
});
