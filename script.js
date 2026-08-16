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
    valuesRanking: [],          // Hra: Rebríček hodnôt – poradie kľúčov (soft signál)
    kitchenRanking: [],         // Hra: Kuchynský test – poradie 5 kľúčov (soft signál)
    shapePersona: null,         // Hra: Panáčik z tvarov – { sex, cit, rozum } počty z 10 (soft signál)
    rt: null,                   // Vzťahový kompas – { os1, os2, kut } (soft signál, nikdy % ani brána)
    archetypeSet: 'neutral',    // Archetypy: 'm' | 'z' | 'neutral' | 'none' (none → neutrálna sada)
    archetypePrefSet: 'both',   // Koho hľadám – sada na zoraďovanie: 'm' | 'z' | 'both'
    archetypePref: null,        // Koho hľadám – { poradie, prefOs1, prefOs2 } (soft doradenie, nikdy brána)
    essenceName: null,          // Meno podstaty – { adjektivum, substantivum, cely, why, od } (mimo scoringu)
    mode: 'dating',             // Prečo si tu: 'dating' | 'growth' (rast = nezobrazuje sa ostatným)
    assertStyle: null,          // Asertivita – { counts, dominant } (privátny self-insight, mimo scoringu)
    assertProgress: null,       // Asertivita – prejdené mikro-lekcie { amygdala, kindness, techniques }
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

/* --------------------------------------------------------------
   VZŤAHOVÝ ŠTÝL v karte matchu – opisný soft signál z RT kompasu
   --------------------------------------------------------------
   Zobrazí sa LEN keď majú RT profil obaja. Žiadne %, žiadna brána
   – NEvstupuje do čísla kompatibility ani do passesHardGates.
   -------------------------------------------------------------- */
function rtStyleLine(meRt, otherRt) {
  if (!meRt || !otherRt
    || typeof meRt.os1 !== 'number' || typeof otherRt.os1 !== 'number'
    || typeof meRt.os2 !== 'number' || typeof otherRt.os2 !== 'number') return '';

  const d1 = Math.abs(meRt.os1 - otherRt.os1);
  const d2 = Math.abs(meRt.os2 - otherRt.os2);
  const SIM = 0.6;   // podobní = na oboch osiach blízko seba

  if (d1 <= SIM && d2 <= SIM) {
    return `<p class="match-rt">🧭 Vzťahový štýl: Podobný vzťahový rytmus — ťaháte za rovnaký koniec.</p>`;
  }
  // Pomenuj os s najväčším rozdielom
  const A = window.RT_TEST.axes;
  const axis = d1 >= d2 ? 'os1' : 'os2';
  const labels = axis === 'os1' ? A.os1 : A.os2;
  const mePole = meRt[axis] >= otherRt[axis] ? labels.plusLabel : labels.minusLabel;
  const otherPole = mePole === labels.plusLabel ? labels.minusLabel : labels.plusLabel;
  return `<p class="match-rt">🧭 Vzťahový štýl: Iný rytmus — ty viac ${mePole.toLowerCase()},
    on/ona viac ${otherPole.toLowerCase()}; môže sa to krásne dopĺňať, keď si dáte priestor.</p>`;
}
window.rtStyleLine = rtStyleLine;


/* --------------------------------------------------------------
   ARCHETYPY nad RT kompasom – hrdé oblečenie kúta, nie náhrada
   --------------------------------------------------------------
   Nevstupujú do čísla kompatibility ani do brán. Sada podľa
   voľby používateľa ('none' → neutrálna).
   -------------------------------------------------------------- */
function rtQuadrant(rt) {
  // pri presnej nule sa uprednostní Blízkosť resp. Stálosť
  return ((rt.os1 ?? 0) >= 0 ? 'B' : 'O') + ((rt.os2 ?? 0) >= 0 ? 'S' : 'Z');
}

function archetypeFor(rt, set) {
  if (!rt || typeof rt.os1 !== 'number' || typeof rt.os2 !== 'number') return null;
  const corner = window.ARCHETYPES?.corners[rtQuadrant(rt)];
  if (!corner) return null;
  const s = (set === 'm' || set === 'z') ? set : 'neutral';
  return { name: corner[s].name, desc: corner[s].desc, icon: corner.icon, img: corner[s].img };
}
window.archetypeFor = archetypeFor;

// Kruhový avatar archetypu (obrázok v ráme). Neutrálna sada nemá
// obrázok → kruhový rám s neutrálnym SVG erbom; pri chýbajúcom
// súbore obrázka fallback na erb cez CSS – nič sa nerozbije
function archetypeAvatarHTML(arch, size) {
  if (!arch) return '';
  if (!arch.img) {
    return `<span class="arch-avatar arch-avatar--${size || 'md'} arch-avatar--erb"
      role="img" aria-label="${arch.name}">${archetypeIconSVG(arch.icon)}</span>`;
  }
  return `<span class="arch-avatar arch-avatar--${size || 'md'}">
    <img src="${arch.img}" alt="${arch.name}" loading="lazy"
      onerror="this.classList.add('is-broken')">
    ${archetypeIconSVG(arch.icon)}
  </span>`;
}
window.archetypeAvatarHTML = archetypeAvatarHTML;

// Malé štylizované erby (meč, lutna, hviezda, luk) – čisté SVG v palete
function archetypeIconSVG(icon) {
  const shapes = {
    mec: `<path d="M14 2 L16.5 4.5 L16.5 15 L11.5 15 L11.5 4.5 Z" fill="var(--primary-dark)"/>
      <rect x="8" y="15" width="12" height="3" rx="1.5" fill="var(--primary)"/>
      <rect x="12.5" y="18" width="3" height="7" rx="1.5" fill="var(--primary-dark)"/>`,
    lutna: `<circle cx="11" cy="18.5" r="7" fill="var(--primary)"/>
      <circle cx="11" cy="18.5" r="2.2" fill="var(--bg-light)"/>
      <rect x="15.5" y="2" width="3" height="14" rx="1.5" fill="var(--primary-dark)"
        transform="rotate(32 17 9)"/>`,
    hviezda: `<polygon fill="var(--primary-dark)" points="14,3 17.2,10.2 25,10.5 18.9,15.6 20.9,23.4 14,18.9 7.1,23.4 9.1,15.6 3,10.5 10.8,10.2"/>`,
    luk: `<path d="M8 3 Q23 14 8 25" fill="none" stroke="var(--primary-dark)" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="8" y1="3" x2="8" y2="25" stroke="var(--primary)" stroke-width="1.6"/>
      <line x1="8" y1="14" x2="24" y2="14" stroke="var(--primary-dark)" stroke-width="2"/>
      <path d="M24 14 L20 11 M24 14 L20 17" fill="none" stroke="var(--primary-dark)" stroke-width="2" stroke-linecap="round"/>`
  };
  return `<svg class="arch-icon" viewBox="0 0 28 28" aria-hidden="true">${shapes[icon] || ''}</svg>`;
}

// Opisný riadok do karty matchu – len keď majú archetyp obaja
function archetypeLine(meRt, meSet, otherRt, otherGender) {
  const mine = archetypeFor(meRt, meSet);
  const theirs = archetypeFor(otherRt, otherGender);
  if (!mine || !theirs) return '';
  const pron = otherGender === 'z' ? 'ona' : (otherGender === 'm' ? 'on' : 'on/ona');
  return `<p class="match-arch">${archetypeAvatarHTML(theirs, 'sm')}
    <span>🏰 Ty ${mine.name} · ${pron} ${theirs.name}</span></p>`;
}
window.archetypeLine = archetypeLine;


/* --------------------------------------------------------------
   KOHO HĽADÁM – preferované ladenie partnera z poradia archetypov
   --------------------------------------------------------------
   SOFT: nikoho neskrýva, nemení zobrazené % ani passesHardGates.
   archPrefScore je len kozmetické doradenie výpisu + opisný riadok.
   -------------------------------------------------------------- */

// Zhoda preferovaného ladenia s RT osami profilu (0..1).
// Bez preferencie alebo bez RT profilu → 0.5 (neutrál, neznevýhodní).
function archPrefScore(pref, otherRt) {
  if (!pref || typeof pref.prefOs1 !== 'number'
    || !otherRt || typeof otherRt.os1 !== 'number') return 0.5;
  return 1 - (Math.abs(pref.prefOs1 - otherRt.os1) + Math.abs(pref.prefOs2 - otherRt.os2)) / 4;
}
window.archPrefScore = archPrefScore;

// Opisný riadok LEN pri výraznej zhode (≥ 0.75) a s archetypom profilu.
// Pri nesúlade sa nikdy nič nehovorí (žiadne „nie je tvoj typ").
function archPrefLine(pref, otherRt, otherGender) {
  const s = archPrefScore(pref, otherRt);
  if (!pref || s < 0.75) return '';
  const arch = archetypeFor(otherRt, otherGender);
  if (!arch) return '';
  const fem = otherGender === 'z';
  const pron = fem ? 'ona' : (otherGender === 'm' ? 'on' : 'on/ona');
  return `<p class="match-arch match-arch--pref">🏰 Tvojmu srdcu je ${fem ? 'blízka' : 'blízky'}
    ${arch.name} — a ${pron} ${fem ? 'ňou' : 'ním'} práve je. 💛</p>`;
}
window.archPrefLine = archPrefLine;


/* Modul zoraďovania „Koho hľadám" (vzor šípok z createRankingGame) */
const ArchetypePref = {
  KEY: 'synced_archpref_v1',
  setOptions: [['m', 'Mužské'], ['z', 'Ženské'], ['both', 'Oboje']],
  set: 'both',
  order: [],
  result: null,     // { set, poradie, prefOs1, prefOs2 }

  init() {
    this.cardsEl = document.getElementById('apCards');
    if (!this.cardsEl || !window.ARCHETYPES) return;

    this.load();
    this.set = this.result?.set || AppState.userProfile.archetypePrefSet || 'both';
    this.order = this.validOrder(this.result?.poradie) || this.items(this.set).map(i => i.id);
    // Bez vlastného poradia ponúkni návrh podľa kompasu (ak je RT hotový)
    if (!this.result) this.suggestFromRT(false);

    this.renderPicker();
    this.renderCards();
    if (this.result) { this.renderResult(); this.renderProfileStrip(); }

    document.getElementById('apSetPicker').addEventListener('click', (e) => {
      const chip = e.target.closest('button[data-prefset]');
      if (!chip) return;
      this.set = chip.dataset.prefset;
      AppState.userProfile.archetypePrefSet = this.set;
      this.order = this.items(this.set).map(i => i.id);
      this.suggested = false;
      if (!this.result) this.suggestFromRT(false);
      this.renderPicker();
      this.renderCards();
    });

    this.cardsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-move]');
      if (!btn) return;
      this.move(btn.closest('li').dataset.id, btn.dataset.move);
    });

    document.getElementById('apConfirm').addEventListener('click', () => this.confirm());
  },

  // Karty zvolenej sady; 'both' = všetkých 8
  items(set) {
    const quads = ['BS', 'BZ', 'OS', 'OZ'];
    const sets = set === 'both' ? ['m', 'z'] : [set];
    const out = [];
    quads.forEach(q => sets.forEach(s => {
      const c = window.ARCHETYPES.corners[q];
      out.push({ id: q + '_' + s, quad: q, name: c[s].name, desc: c[s].desc,
        icon: c.icon, img: c[s].img });
    }));
    return out;
  },

  validOrder(poradie) {
    if (!Array.isArray(poradie)) return null;
    const ids = this.items(this.result?.set || this.set).map(i => i.id);
    const ok = poradie.length === ids.length && ids.every(id => poradie.includes(id));
    return ok ? poradie : null;
  },

  renderPicker() {
    document.getElementById('apSetPicker').innerHTML = `
      <span class="arch-picker__label">Ktoré archetypy ti zobraziť?</span>
      <span class="avatar-chips">
        ${this.setOptions.map(([v, l]) => `
          <button type="button" class="avatar-chip ${v === this.set ? 'is-active' : ''}"
            data-prefset="${v}">${l}</button>`).join('')}
      </span>`;
  },

  /* Návrh poradia podľa RT kompasu – LEN návrh, ručné poradie má vždy
     prednosť. Jemná komplementarita: opačný pól na osi blízkosť/odstup
     často dopĺňa, podobný pól na osi kontinuita/zmena upokojuje. */
  suggestFromRT(rerender = true) {
    const rt = AppState.userProfile.rt;
    if (!rt || typeof rt.os1 !== 'number') return false;
    const t1 = -rt.os1;   // doplnenie
    const t2 = rt.os2;    // podobnosť
    const byId = Object.fromEntries(this.items(this.set).map(i => [i.id, i]));
    this.order = [...this.order].sort((a, b) => {
      const d = (id) => {
        const q = byId[id]?.quad || 'BS';
        return Math.abs((q[0] === 'B' ? 1 : -1) - t1) + Math.abs((q[1] === 'S' ? 1 : -1) - t2);
      };
      return d(a) - d(b);
    });
    this.suggested = true;
    if (rerender) this.renderCards();
    return true;
  },

  renderCards() {
    const byId = Object.fromEntries(this.items(this.set).map(i => [i.id, i]));
    const hint = document.getElementById('apSuggestNote');
    if (hint) hint.hidden = !this.suggested || !!this.result;
    this.cardsEl.innerHTML = this.order.map((id, i) => {
      const it = byId[id];
      return `
        <li class="vg-card ap-card" data-id="${id}">
          <span class="vg-card__rank">${i + 1}.</span>
          ${archetypeAvatarHTML(it, 'md')}
          <span class="vg-card__name">${it.name}
            <span class="ap-card__desc">${it.desc}</span></span>
          <span class="vg-card__move">
            <button type="button" data-move="up" aria-label="Posunúť vyššie"
              ${i === 0 ? 'disabled' : ''}>▲</button>
            <button type="button" data-move="down" aria-label="Posunúť nižšie"
              ${i === this.order.length - 1 ? 'disabled' : ''}>▼</button>
          </span>
        </li>`;
    }).join('');
  },

  move(id, dir) {
    const i = this.order.indexOf(id);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= this.order.length) return;
    [this.order[i], this.order[j]] = [this.order[j], this.order[i]];
    this.renderCards();
  },

  // Vážené ťažisko: vyššie poradie = väčšia váha (n..1);
  // osi archetypu = znamienka kvadrantu (B/O → ±1, S/Z → ±1)
  compute() {
    const n = this.order.length;
    let s1 = 0, s2 = 0, sw = 0;
    this.order.forEach((id, i) => {
      const w = n - i;
      const quad = id.split('_')[0];
      s1 += w * (quad[0] === 'B' ? 1 : -1);
      s2 += w * (quad[1] === 'S' ? 1 : -1);
      sw += w;
    });
    const round = (x) => Math.round(x / sw * 100) / 100;
    return { prefOs1: round(s1), prefOs2: round(s2) };
  },

  confirm() {
    const { prefOs1, prefOs2 } = this.compute();
    this.result = { set: this.set, poradie: [...this.order], prefOs1, prefOs2 };
    AppState.userProfile.archetypePrefSet = this.set;
    AppState.userProfile.archetypePref = { poradie: [...this.order], prefOs1, prefOs2 };
    this.save();
    this.renderResult();
    this.renderProfileStrip();
    // Jemné doradenie sa prejaví hneď (ak sú matchy vykreslené)
    if (Object.keys(AppState.userProfile.valueVector || {}).length) Matches.render();
    if (typeof Dashboard !== 'undefined') Dashboard.render();
    document.getElementById('apResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  orderedNames() {
    const byId = Object.fromEntries(this.items(this.result.set).map(i => [i.id, i]));
    return this.result.poradie.map(id => byId[id]?.name).filter(Boolean);
  },

  renderResult() {
    const names = this.orderedNames();
    const box = document.getElementById('apResult');
    box.hidden = false;
    box.innerHTML = `
      <h3>Ku komu ťa to ťahá</h3>
      <p class="vg-result__intro">${names.join(' › ')}</p>
      <p class="vg-result__desc">V matchoch to ľudí s podobným ladením jemne
        posunie vyššie — nikoho to neskryje a percentá to nemení.</p>
      <p class="vg-result__note">Skutoční ľudia vždy prekvapia — a to je tá krajšia časť. 💛</p>`;
  },

  renderProfileStrip() {
    const box = document.getElementById('profileArchPref');
    if (!box) return;
    const names = this.orderedNames();
    const shown = names.slice(0, 4).join(', ') + (names.length > 4 ? '…' : '');
    box.innerHTML = `
      <p class="vg-strip">Ku komu ťa to ťahá: <strong>${shown}</strong></p>
      <div class="vg-strip__actions">
        <a class="vg-again" href="#archetype-pref" data-scroll="#archetype-pref">Zoradiť znova</a>
      </div>`;
  },

  /* localStorage – dočasný most (TODO Supabase); archetypePref sú čisté
     dáta pripravené na neskoršie serverové porovnanie medzi reálnymi účtami */
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.result)); } catch (_) {}
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      const valid = saved && ['m', 'z', 'both'].includes(saved.set)
        && typeof saved.prefOs1 === 'number' && typeof saved.prefOs2 === 'number'
        && Array.isArray(saved.poradie);
      if (!valid) return;   // iný/starší formát sa ticho zahodí
      this.result = saved;
      AppState.userProfile.archetypePrefSet = saved.set;
      AppState.userProfile.archetypePref = {
        poradie: [...saved.poradie], prefOs1: saved.prefOs1, prefOs2: saved.prefOs2
      };
    } catch (_) { /* poškodené dáta ignorujeme */ }
  }
};


/* --------------------------------------------------------------
   MENO TVOJEJ PODSTATY – návrhy z výsledkov testov
   --------------------------------------------------------------
   SOFT/self-insight, mimo scoringu. Prídavné meno sa skloňuje
   podľa gramatického rodu podstatného mena (Tichá Hviezda,
   Hĺbavý Prameň, Verné Srdce) – rodovo neutrálne voči hráčovi.
   essenceName sú čisté dáta (pole „od") – neskôr pôjde meno aj
   prijať darom od iného človeka (Supabase).
   -------------------------------------------------------------- */
function buildEssenceNames(P, offset = 0) {
  const E = window.ESSENCE_NAME;
  const adjPool = [];
  const nounPool = [];

  // RT kompas → prídavné mená podľa osí + podstatné mená kvadrantu
  if (P.rt && typeof P.rt.os1 === 'number') {
    adjPool.push(...(P.rt.os1 >= 0 ? E.adjectives.blizkost : E.adjectives.odstup));
    adjPool.push(...(P.rt.os2 >= 0 ? E.adjectives.stalost : E.adjectives.zmena));
    nounPool.push(...(E.nouns[rtQuadrant(P.rt)] || []));
  }

  // Panáčik z tvarov → dominantná zložka
  if (P.shapePersona) {
    const top = ['cit', 'rozum', 'sex'].reduce((b, k) =>
      (P.shapePersona[k] ?? 0) > (P.shapePersona[b] ?? 0) ? k : b, 'cit');
    adjPool.push(...E.adjectives[top]);
  }

  // Rebríček hodnôt (Lola) → motív z hodnoty #1
  if (Array.isArray(P.valuesRanking) && P.valuesRanking.length) {
    const motif = E.valueNouns[P.valuesRanking[0]];
    if (motif) nounPool.push(motif);
  }

  const enough = adjPool.length > 0 && nounPool.length > 0;

  // Základné návrhy aj bez testov (jemné pozvanie ich doplniť)
  if (!adjPool.length) {
    adjPool.push(E.adjectives.blizkost[0], E.adjectives.zmena[0], E.adjectives.rozum[0]);
  }
  if (!nounPool.length) {
    nounPool.push(E.nouns.OS[0], E.nouns.BZ[2], E.nouns.OZ[0]);
  }

  // Deterministické kombinácie (bez Math.random): diagonálne párovanie,
  // offset stránkuje ďalšie návrhy pri „Vygenerovať ďalšie"
  const A = adjPool.length, N = nounPool.length, total = A * N;
  const out = [];
  const seen = new Set();
  for (let k = 0; out.length < Math.min(6, total) && k < total; k++) {
    const i = (k + offset) % total;
    const adj = adjPool[i % A];
    const noun = nounPool[(i % A + Math.floor(i / A)) % N];
    const adjForm = adj[noun.rod];
    const cely = `${adjForm} ${noun.word}`;
    if (seen.has(cely)) continue;
    seen.add(cely);
    out.push({
      adjektivum: adjForm,
      substantivum: noun.word,
      cely,
      why: `${adjForm} — ${adj.why}. ${noun.word} — ${noun.why}.`
    });
  }
  return { suggestions: out, enough };
}
window.buildEssenceNames = buildEssenceNames;


const EssenceName = {
  KEY: 'synced_essence_v1',
  offset: 0,
  chosen: null,
  current: [],

  init() {
    this.cardsEl = document.getElementById('enCards');
    if (!this.cardsEl || !window.ESSENCE_NAME) return;
    document.querySelector('#essence-name .vg-intro').textContent = window.ESSENCE_NAME.intro;

    this.load();
    this.renderCards();
    if (this.chosen) { this.renderChosen(); this.renderProfile(); }

    this.cardsEl.addEventListener('click', (e) => {
      const c = e.target.closest('button[data-essence]');
      if (c) this.choose(Number(c.dataset.essence));
    });
    document.getElementById('enMore').addEventListener('click', () => {
      this.offset += 6;
      this.renderCards();
    });
  },

  renderCards() {
    const { suggestions, enough } = buildEssenceNames(AppState.userProfile, this.offset);
    this.current = suggestions;
    const invite = document.getElementById('enInvite');
    invite.hidden = enough;
    if (!enough) invite.textContent = window.ESSENCE_NAME.invite;
    this.cardsEl.innerHTML = suggestions.map((s, i) => `
      <button type="button" class="en-card ${this.chosen?.cely === s.cely ? 'is-active' : ''}"
        data-essence="${i}">✨ ${s.cely}</button>`).join('');
  },

  choose(i) {
    const s = this.current[i];
    if (!s) return;
    this.chosen = { adjektivum: s.adjektivum, substantivum: s.substantivum,
      cely: s.cely, why: s.why, od: 'ja' };
    AppState.userProfile.essenceName = { ...this.chosen };
    this.save();
    this.renderCards();
    this.renderChosen();
    this.renderProfile();
    if (typeof Dashboard !== 'undefined') Dashboard.render();
  },

  renderChosen() {
    const box = document.getElementById('enResult');
    box.hidden = false;
    box.innerHTML = `
      <h3>✨ ${this.chosen.cely}</h3>
      <p class="vg-result__intro">${this.chosen.why}</p>
      <p class="vg-result__note">${window.ESSENCE_NAME.note}</p>`;
  },

  renderProfile() {
    const head = document.getElementById('profileEssence');
    if (head) {
      head.innerHTML = `<div class="essence-header">✨ <span>${this.chosen.cely}</span></div>`;
    }
    const entry = document.getElementById('profileEssenceEntry');
    if (entry) {
      entry.innerHTML = `
        <p class="vg-strip">Moje meno podstaty: <strong>${this.chosen.cely}</strong></p>
        <div class="vg-strip__actions">
          <a class="vg-again" href="#essence-name" data-scroll="#essence-name">Zmeniť meno</a>
        </div>`;
    }
  },

  /* localStorage – dočasný most (TODO Supabase), vzor ostatných modulov */
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.chosen)); } catch (_) {}
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      const valid = saved && typeof saved.cely === 'string'
        && typeof saved.adjektivum === 'string' && typeof saved.substantivum === 'string';
      if (!valid) return;   // iný/starší formát sa ticho zahodí
      this.chosen = saved;
      AppState.userProfile.essenceName = { ...saved };
    } catch (_) { /* poškodené dáta ignorujeme */ }
  }
};


/* --------------------------------------------------------------
   ROZCESTNÍK – „čo mám spraviť ďalej"
   --------------------------------------------------------------
   Len navigácia a stav (hotové ✓ / dĺžka). Nič nepočíta.
   V režime rast idú testy pred matchmi.
   -------------------------------------------------------------- */
const Dashboard = {
  tiles: [
    { id: 'rt',      icon: '🧭', name: 'Vzťahový kompas',   target: '#rt-test',
      desc: 'Zisti svoje vzťahové ladenie a archetyp.', time: '3 min',
      done: () => typeof RTTest !== 'undefined' && RTTest.done, world: 'growth' },
    { id: 'pref',    icon: '🏰', name: 'Koho hľadám',       target: '#archetype-pref',
      desc: 'Zoraď archetypy podľa svojho srdca.', time: '2 min',
      done: () => typeof ArchetypePref !== 'undefined' && !!ArchetypePref.result, world: 'growth' },
    { id: 'essence', icon: '✨', name: 'Meno tvojej podstaty', target: '#essence-name',
      desc: 'Dve slová, ktoré vystihujú tvoje jadro.', time: '1 min',
      done: () => !!AppState.userProfile.essenceName, world: 'growth' },
    { id: 'assert',  icon: '🛡️', name: 'Asertivita',        target: '#assert-training',
      desc: 'Tréning: udrž hranicu bez boja.', time: '5 min',
      done: () => typeof AssertTraining !== 'undefined' && !!AssertTraining.result, world: 'growth' },
    { id: 'games',   icon: '🎭', name: 'Hry o tebe',         target: '#values-game',
      desc: 'Rebríček hodnôt, kuchynský test, panáčik z tvarov.', time: '2 min',
      done: () => !!AppState.userProfile.valuesRanking?.length
        && !!AppState.userProfile.kitchenRanking?.length
        && !!AppState.userProfile.shapePersona, world: 'growth' },
    { id: 'matches', icon: '💞', name: 'Matchy',             target: '#matches',
      desc: 'Ľudia, ktorí sú na rovnakej vlne.', time: '',
      done: () => false, world: 'dating' },
    { id: 'chat',    icon: '💬', name: 'Chat',               target: '#chat',
      desc: 'Napíš tým, s ktorými to má zmysel.', time: '',
      done: () => false, world: 'dating' }
  ],

  init() {
    const grid = document.getElementById('dashGrid');
    if (!grid) return;
    this.grid = grid;
    this.render();
  },

  render() {
    if (!this.grid) return;
    const growth = typeof Mode !== 'undefined' && Mode.isGrowth();
    // Rast: testy a sebapoznanie prvé. Zoznamovanie: matchy a chat prvé.
    const first = growth ? 'growth' : 'dating';
    const order = [...this.tiles].sort((a, b) =>
      (a.world === first ? 0 : 1) - (b.world === first ? 0 : 1));

    this.grid.innerHTML = order.map(t => {
      const done = (() => { try { return !!t.done(); } catch (_) { return false; } })();
      const status = done ? '<span class="dash-tile__done">hotové ✓</span>'
        : (t.time ? `<span class="dash-tile__time">${t.time}</span>` : '');
      return `
        <a class="dash-tile ${done ? 'is-done' : ''}" href="${t.target}" data-scroll="${t.target}">
          <span class="dash-tile__icon">${t.icon}</span>
          <span class="dash-tile__body">
            <span class="dash-tile__name">${t.name}</span>
            <span class="dash-tile__desc">${t.desc}</span>
          </span>
          ${status}
        </a>`;
    }).join('');
  }
};


/* --------------------------------------------------------------
   REŽIM „Prečo si tu" – zoznamovanie × rast
   --------------------------------------------------------------
   'growth' = som tu pre testy a rast: matchy a chat ostávajú
   viditeľné, ale profil je označený ako nedostupný a v matchmakingu
   sa nemá ponúkať ostatným (flag `visibleToOthers` – reálne
   vymáhanie medzi ľuďmi príde so Supabase).
   Nemení výpočty kompatibility ani tvrdé brány.
   -------------------------------------------------------------- */
const Mode = {
  KEY: 'synced_mode_v1',
  options: [
    ['dating', '💞 Hľadám vzťah', 'Matchy, chat aj testy — celá appka.'],
    ['growth', '🌙 Som tu pre testy a rast', 'Nehľadám vzťah — zoznamovanie mám vypnuté.']
  ],

  init() {
    try {
      const v = localStorage.getItem(this.KEY);
      if (v === 'dating' || v === 'growth') AppState.userProfile.mode = v;
    } catch (_) {}
    this.renderPickers();
    this.applyMode();

    document.addEventListener('click', (e) => {
      const chip = e.target.closest('button[data-mode]');
      if (chip) { this.set(chip.dataset.mode); return; }
      if (e.target.closest('[data-mode-enable-dating]')) this.set('dating');
    });
  },

  isGrowth() { return AppState.userProfile.mode === 'growth'; },

  // Flag pre budúce serverové vymáhanie (Supabase)
  visibleToOthers() { return !this.isGrowth(); },

  set(mode) {
    if (mode !== 'dating' && mode !== 'growth') return;
    AppState.userProfile.mode = mode;
    try { localStorage.setItem(this.KEY, mode); } catch (_) {}
    this.renderPickers();
    this.applyMode();
  },

  renderPickers() {
    const cur = AppState.userProfile.mode;
    const html = `
      <p class="mode-picker__label">Prečo si tu?</p>
      <div class="mode-options">
        ${this.options.map(([v, title, desc]) => `
          <button type="button" class="mode-option ${v === cur ? 'is-active' : ''}" data-mode="${v}">
            <span class="mode-option__title">${title}</span>
            <span class="mode-option__desc">${desc}</span>
          </button>`).join('')}
      </div>`;
    ['modePickerOnboarding', 'modePickerProfile'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    });
  },

  applyMode() {
    const growth = this.isGrowth();
    document.body.classList.toggle('is-growth', growth);

    // Badge „nedostupný/á na zoznámenie" v profile
    const badgeHost = document.getElementById('modePickerProfile');
    if (badgeHost) {
      const old = document.getElementById('modeBadge');
      if (old) old.remove();
      if (growth) {
        badgeHost.insertAdjacentHTML('afterbegin',
          '<p class="mode-badge" id="modeBadge">🌙 Nedostupný/á na zoznámenie</p>');
      }
    }

    // Info pruh nad matchmi + rýchle zapnutie zoznamovania
    const note = document.getElementById('matchesModeNote');
    if (note) {
      note.innerHTML = growth ? `
        <div class="mode-note">
          <span>Si v režime rast – zoznamovanie máš vypnuté.
            Môžeš ho kedykoľvek zapnúť v profile.</span>
          <button type="button" class="btn-primary" data-mode-enable-dating>Zapnúť zoznamovanie</button>
        </div>` : '';
    }

    // Rozcestník sa preusporiada: v režime rast idú testy pred matchy
    if (typeof Dashboard !== 'undefined') Dashboard.render();
  }
};


/* Voľba archetypovej sady v profile (pohlavie appka nezbiera) */
const ArchetypeSet = {
  KEY: 'synced_archetypeset_v1',
  options: [['m', 'Mužské'], ['z', 'Ženské'], ['neutral', 'Neutrálne'], ['none', 'Nechcem uvádzať']],

  init() {
    this.box = document.getElementById('archetypeSetPicker');
    try {
      const v = localStorage.getItem(this.KEY);
      if (['m', 'z', 'neutral', 'none'].includes(v)) AppState.userProfile.archetypeSet = v;
    } catch (_) {}
    this.render();
    this.box?.addEventListener('click', (e) => {
      const chip = e.target.closest('button[data-set]');
      if (chip) this.apply(chip.dataset.set);
    });
    // Prepínač ♂/♀ pri zobrazenom archetype (RT výsledok) – ten istý stav
    document.addEventListener('click', (e) => {
      const t = e.target.closest('button[data-arch-toggle]');
      if (t) this.apply(t.dataset.archToggle);
    });
  },

  apply(set) {
    if (!['m', 'z', 'neutral', 'none'].includes(set)) return;
    AppState.userProfile.archetypeSet = set;
    try { localStorage.setItem(this.KEY, set); } catch (_) {}
    this.render();
    // Prekresli všade, kde sa archetyp ukazuje
    if (RTTest.done) { RTTest.renderResult(); RTTest.renderProfileStrip(); }
    if (Object.keys(AppState.userProfile.valueVector || {}).length) Matches.render();
  },

  render() {
    const cur = AppState.userProfile.archetypeSet || 'neutral';
    this.box.innerHTML = `
      <span class="arch-picker__label">Archetypy zobrazovať ako:</span>
      <span class="avatar-chips">
        ${this.options.map(([v, l]) => `
          <button type="button" class="avatar-chip ${v === cur ? 'is-active' : ''}"
            data-set="${v}">${l}</button>`).join('')}
      </span>`;
  }
};

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
   KVALITATÍVNE SIGNÁLY namiesto tvrdých percent
   --------------------------------------------------------------
   Skóre z calculateCompatibility sa naďalej počíta a používa na
   ZORADENIE matchov – len sa nikde nevypisuje ako číslo.
   Filozofia: jemné signály, nie čísla (docs/vyzor-a-pravidla.md).
   -------------------------------------------------------------- */

// Veta o spoločných hodnotách (bez čísel)
function sharedValuesLine(shared) {
  const s = shared || [];
  if (s.length >= 2) {
    return `Veľa spoločného v hodnotách — <b>${s[0]}</b> a <b>${s[1]}</b> vás spájajú.`;
  }
  if (s.length === 1) return `Spája vás <b>${s[0]}</b>.`;
  return 'Spoločné hodnoty ešte len objavíte — je o čom hovoriť.';
}
window.sharedValuesLine = sharedValuesLine;

// Slovné vyjadrenie miery (0–1) pre report – žiadne percentá
function qualLabel(v) {
  if (typeof v !== 'number') return '—';
  if (v >= 0.8) return 'veľmi blízko';
  if (v >= 0.65) return 'blízko';
  if (v >= 0.5) return 'sčasti podobné';
  return 'odlišné — a to môže dopĺňať';
}
window.qualLabel = qualLabel;


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
        result.rtLine = rtStyleLine(me.rt, u.rt);   // opisný riadok, nie skóre
        result.archLine = archetypeLine(me.rt, me.archetypeSet, u.rt, u.gender);
        result.archPrefScore = archPrefScore(me.archetypePref, u.rt);
        result.archPrefLine = archPrefLine(me.archetypePref, u.rt, u.gender);
        return { user: u, result };
      })
      // Primárne stále % kompatibility. archPrefScore je len KOZMETICKÉ
      // doradenie: v rámci tesných matchov (rozdiel do 2 %) jemne nadradí
      // profily bližšie preferovanému ladeniu z „Koho hľadám".
      // Nie je to kritérium – nikoho neskryje, % ani brány nemení;
      // profil bez RT má neutrál 0.5 a doradenie ho neznevýhodní.
      .sort((a, b) => {
        if (Math.abs(a.result.score - b.result.score) <= 2) {
          const d = b.result.archPrefScore - a.result.archPrefScore;
          if (d) return d;
        }
        return b.result.score - a.result.score;
      });

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
      ideal: P.ideal || { heightBand: 'nezalezi', silhouette: 'nezalezi', hair: 'nezalezi', style: 'nezalezi' },
      rt: P.rt || null,
      archetypeSet: P.archetypeSet || 'neutral',
      archetypePref: P.archetypePref || null
    };
  },

  // r.score sa TU NEVYPISUJE – slúži len na zoradenie v render()
  cardHTML(user, r) {
    return `
      <article class="match-card">
        <div class="match-card__head">
          <h3>${user.name}, ${user.age}</h3>
        </div>
        <p class="match-type">${r.type}</p>
        <p class="match-desc">${r.desc}</p>
        <p class="match-meta">📍 ${user.location}</p>
        <p class="match-meta">💛 ${sharedValuesLine(r.shared)}</p>
        ${reframeLove(r.appearanceFit)}
        ${r.rtLine || ''}
        ${r.archLine || ''}
        ${r.archPrefLine || ''}
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

    // pct sa používa len na zoradenie – číslo sa nezobrazuje
    this.listEl.innerHTML = rows.map(({ u }) => `
      <li data-match="${u.id}" class="${u.id === AppState.chat.activeMatchId ? 'is-active' : ''}">
        ${u.name}
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
   3e2) ZORAĎOVACIE HRY – spoločná mechanika
   --------------------------------------------------------------
   Rebríček hodnôt (Lola) a Kuchynský test zdieľajú rovnaký engine:
   zoradenie kariet šípkami, výsledok s odhaleným mapovaním,
   pruh v profile + zdieľanie. Soft signál + obsah do profilu —
   NIE tvrdá brána, NIE percento — nemení matching ani skóre.
   Persistencia v localStorage je dočasný most — TODO: neskôr
   do Supabase + do profilu pre soft matching.
   -------------------------------------------------------------- */
function createRankingGame(cfg) {
  return {
    order: [],        // aktuálne poradie id-čiek počas hrania
    played: false,

    init() {
      const D = cfg.data();
      this.cardsEl = document.getElementById(cfg.ids.cards);
      if (!D || !this.cardsEl) return;

      this.byId = Object.fromEntries(D.characters.map(c => [c.id, c]));
      this.order = D.characters.map(c => c.id);

      const introEl = document.querySelector(cfg.ids.intro);
      if (introEl) introEl.textContent = D.intro;
      document.getElementById(cfg.ids.story).textContent = D.story;

      this.load();
      this.renderCards();
      if (this.played) { this.renderResult(); this.renderProfileStrip(); }

      // Šípky hore/dole (delegovane – karty sa prekresľujú)
      this.cardsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-move]');
        if (!btn) return;
        this.move(btn.closest('li').dataset.id, btn.dataset.move);
      });

      document.getElementById(cfg.ids.confirm).addEventListener('click', () => this.confirm());

      // Zdieľať z profilového pruhu (pruh sa vykresľuje dynamicky)
      document.addEventListener('click', (e) => {
        if (e.target.closest('#' + cfg.ids.share)) this.share();
      });
    },

    move(id, dir) {
      const i = this.order.indexOf(id);
      const j = dir === 'up' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= this.order.length) return;
      [this.order[i], this.order[j]] = [this.order[j], this.order[i]];
      this.renderCards();
    },

    renderCards() {
      this.cardsEl.innerHTML = this.order.map((id, i) => `
        <li class="vg-card" data-id="${id}">
          <span class="vg-card__rank">${i + 1}.</span>
          <span class="vg-card__name">${this.byId[id].name}</span>
          <span class="vg-card__move">
            <button type="button" data-move="up" aria-label="Posunúť vyššie"
              ${i === 0 ? 'disabled' : ''}>▲</button>
            <button type="button" data-move="down" aria-label="Posunúť nižšie"
              ${i === this.order.length - 1 ? 'disabled' : ''}>▼</button>
          </span>
        </li>`).join('');
    },

    confirm() {
      AppState.userProfile[cfg.profileField] = [...this.order];
      this.played = true;
      this.save();
      this.renderResult();
      this.renderProfileStrip();
      if (typeof Dashboard !== 'undefined') Dashboard.render();
      document.getElementById(cfg.ids.result).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    renderResult() {
      const box = document.getElementById(cfg.ids.result);
      box.hidden = false;
      box.innerHTML = `
        <h3>${cfg.resultTitle}</h3>
        <p class="vg-result__intro">${cfg.resultIntro}</p>
        <ol class="vg-result__list">
          ${this.order.map(id => {
            const c = this.byId[id];
            return `<li><strong>${c.value}</strong>
              <span class="vg-result__who">${cfg.whoLine(c)}</span><br>
              <span class="vg-result__desc">${c.desc}</span></li>`;
          }).join('')}
        </ol>
        <p class="vg-result__note">Nie je to diagnóza ani skóre — len momentka.
          O rok môže vyzerať inak, a to je v poriadku. 💛</p>`;
    },

    renderProfileStrip() {
      const box = document.getElementById(cfg.ids.profileBox);
      if (!box) return;
      box.innerHTML = `
        <p class="vg-strip">${cfg.stripLabel} <strong>${this.rankingText()}</strong></p>
        <div class="vg-strip__actions">
          <button type="button" class="btn-secondary" id="${cfg.ids.share}">💌 Zdieľať</button>
          <a class="vg-again" href="${cfg.sectionAnchor}" data-scroll="${cfg.sectionAnchor}">Zahrať znova</a>
        </div>`;
    },

    rankingText() {
      return this.order.map(id => this.byId[id].value).join(' › ');
    },

    share() {
      const text = cfg.shareText(this.rankingText());
      const done = () => {
        const b = document.getElementById(cfg.ids.share);
        if (b) b.textContent = 'Skopírované ✓';
      };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(done);
      else done();
    },

    /* localStorage – dočasný most (TODO Supabase), vzor Safety store */
    save() {
      try { localStorage.setItem(cfg.storageKey, JSON.stringify({ ranking: this.order })); } catch (_) {}
    },

    load() {
      try {
        const raw = localStorage.getItem(cfg.storageKey);
        if (!raw) return;
        const saved = JSON.parse(raw);
        const valid = Array.isArray(saved.ranking)
          && saved.ranking.length === this.order.length
          && this.order.every(id => saved.ranking.includes(id));
        if (!valid) return;   // starší/iný formát sa ticho zahodí, hra začne odznova
        this.order = saved.ranking;
        AppState.userProfile[cfg.profileField] = [...this.order];
        this.played = true;
      } catch (_) { /* poškodené dáta ignorujeme */ }
    }
  };
}

/* Hra 1: Rebríček hodnôt (príbeh o Lole) */
const ValuesGame = createRankingGame({
  data: () => window.VALUES_GAME,
  storageKey: 'synced_valuesgame_v1',
  profileField: 'valuesRanking',
  sectionAnchor: '#values-game',
  ids: { intro: '#values-game .vg-intro', story: 'vgStory', cards: 'vgCards',
         confirm: 'vgConfirm', result: 'vgResult',
         profileBox: 'profileValuesGame', share: 'vgShare' },
  stripLabel: 'Môj rebríček hodnôt:',
  resultTitle: 'Tvoj rebríček hodnôt',
  resultIntro: 'Každá postava predstavovala jednu hodnotu. ' +
    'Tvoje poradie sympatií ukazuje, čo máš práve teraz na prvom mieste:',
  whoLine: (c) => `(v príbehu ${c.name})`,
  shareText: (r) => `Môj rebríček hodnôt na Synced: ${r}. Aký je tvoj? 💛`
});

/* Hra 2: Kuchynský test (5 podnetov)
   localStorage 'synced_kitchengame_v1' – formát = 5 kľúčov
   ja | sex | praca | rodina | priatelia (kúpeľ = Moja chvíľka,
   umývadlo = Sex). Starší záznam s inou sadou kľúčov (napr.
   'peniaze' alebo 4 podnety) load() ticho zahodí a hra začne
   odznova. */
const KitchenGame = createRankingGame({
  data: () => window.KITCHEN_GAME,
  storageKey: 'synced_kitchengame_v1',
  profileField: 'kitchenRanking',
  sectionAnchor: '#kitchen-game',
  ids: { intro: '#kitchen-game .vg-intro', story: 'kgStory', cards: 'kgCards',
         confirm: 'kgConfirm', result: 'kgResult',
         profileBox: 'profileKitchenGame', share: 'kgShare' },
  stripLabel: 'Moje priority:',
  resultTitle: 'Tvoje priority',
  resultIntro: 'Každý podnet predstavuje jednu oblasť života. ' +
    'Tvoje poradie ukazuje, čo máš práve teraz na prvom mieste:',
  whoLine: (c) => `(podnet: ${c.short})`,
  shareText: (r) => `Moje priority na Synced: ${r}. Aké sú tvoje? 💛`
});


/* --------------------------------------------------------------
   3e3) HRA: PANÁČIK Z TVAROV (iná mechanika – skladanie, nie
        zoraďovanie, preto samostatný modul mimo createRankingGame)
   --------------------------------------------------------------
   10 slotov tela, každý klikaním cykluje △ → ○ → □.
   Podiel tvarov = balans zložiek (trojuholník=sex, kruh=cit,
   štvorec=rozum). Percentá LEN ako opis seba, NIKDY ako zhoda
   s niekým. NIE brána — shapePersona sa NEpoužíva v scoringu.
   Persistencia v localStorage je dočasný most — TODO: neskôr
   do Supabase + do profilu pre soft matching.
   -------------------------------------------------------------- */
const ShapeGame = {
  KEY: 'synced_shapegame_v1',
  slots: {},        // { slotId: 'sex' | 'cit' | 'rozum' }
  done: false,

  init() {
    const D = window.SHAPE_GAME;
    this.boardEl = document.getElementById('sgBoard');
    if (!D || !this.boardEl) return;
    this.D = D;
    this.cycle = D.shapes.map(s => s.id);
    this.shapeById = Object.fromEntries(D.shapes.map(s => [s.id, s]));

    document.querySelector('#shape-game .vg-intro').textContent = D.intro;
    document.getElementById('sgHowto').textContent = D.howto;

    this.load();
    this.renderBoard();
    this.renderCounter();
    if (this.done) { this.renderResult(); this.renderProfileStrip(); }

    // Klik na slot → cyklus tvaru (delegovane – board sa prekresľuje)
    this.boardEl.addEventListener('click', (e) => {
      const slot = e.target.closest('button[data-slot]');
      if (!slot) return;
      this.cycleSlot(slot.dataset.slot);
    });

    document.getElementById('sgConfirm').addEventListener('click', () => this.confirm());

    // Zdieľať z profilového pruhu (pruh sa vykresľuje dynamicky)
    document.addEventListener('click', (e) => {
      if (e.target.closest('#sgShare')) this.share();
    });
  },

  cycleSlot(slotId) {
    const cur = this.slots[slotId];
    const idx = cur ? this.cycle.indexOf(cur) : -1;
    this.slots[slotId] = this.cycle[(idx + 1) % this.cycle.length];
    this.renderBoard();
    this.renderCounter();
  },

  counts() {
    const c = { sex: 0, cit: 0, rozum: 0 };
    Object.values(this.slots).forEach(id => { c[id]++; });
    return c;
  },

  filled() { return Object.keys(this.slots).length; },

  shapeSVG(shapeId) {
    if (!shapeId) return '<span class="sg-empty">+</span>';
    const inner = {
      sex:   '<polygon points="20,4 36,36 4,36"/>',
      cit:   '<circle cx="20" cy="20" r="16"/>',
      rozum: '<rect x="4" y="4" width="32" height="32" rx="4"/>'
    }[shapeId];
    return `<svg class="sg-shape sg-shape--${shapeId}" viewBox="0 0 40 40" aria-hidden="true">${inner}</svg>`;
  },

  renderBoard() {
    this.boardEl.innerHTML = this.D.slots.map(slot => {
      const cur = this.slots[slot.id];
      const stateTxt = cur ? this.shapeById[cur].glyph : 'prázdne';
      return `
        <button type="button" class="sg-slot sg-slot--${slot.id} ${cur ? 'is-filled' : ''}"
          data-slot="${slot.id}" title="${slot.label}"
          aria-label="${slot.label}: ${stateTxt}">
          ${this.shapeSVG(cur)}
        </button>`;
    }).join('');
    document.getElementById('sgConfirm').disabled = this.filled() < this.D.slots.length;
  },

  renderCounter() {
    const c = this.counts();
    document.getElementById('sgCounter').textContent =
      `△ ${c.sex} · ○ ${c.cit} · □ ${c.rozum} (spolu ${this.filled()}/${this.D.slots.length})`;
  },

  confirm() {
    if (this.filled() < this.D.slots.length) return;
    AppState.userProfile.shapePersona = this.counts();
    this.done = true;
    this.save();
    this.renderResult();
    this.renderProfileStrip();
    if (typeof Dashboard !== 'undefined') Dashboard.render();
    document.getElementById('sgResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  // Zložky zoradené od najsilnejšej (percentá = počet × 10)
  ranked() {
    const c = this.counts();
    return this.D.shapes
      .map(s => ({ ...s, n: c[s.id], pct: c[s.id] * 10 }))
      .sort((a, b) => b.n - a.n);
  },

  renderResult() {
    const R = this.D.results;
    const ranked = this.ranked();
    const top = ranked[0];
    const low = ranked[ranked.length - 1];

    // Pri remíze na vrchole spomeň obe zložky
    const tops = ranked.filter(s => s.n === top.n);
    const domTxt = tops.map(s => R.dominant[s.id]).join(' ');

    const bars = ranked.map(s => `
      <div class="bar-row">
        <span class="bar-row__label">${s.label}</span>
        <span class="bar"><span class="bar__fill" style="width:${s.pct}%"></span></span>
        <span class="bar-row__val">${s.pct} %</span>
      </div>`).join('');

    const box = document.getElementById('sgResult');
    box.hidden = false;
    box.innerHTML = `
      <h3>Z čoho sa práve skladáš</h3>
      <p class="vg-result__intro">${this.D.shapes.map(s => `${s.glyph} = ${s.long}`).join(' · ')}</p>
      ${bars}
      <p class="vg-result__desc">${domTxt}${tops.length < ranked.length && low.n < top.n ? ' ' + R.lowest[low.id] : ''}</p>
      <p class="vg-result__note">${R.note}</p>`;
  },

  personaText() {
    return this.ranked().map(s => `${s.label} ${s.pct} %`).join(' · ');
  },

  renderProfileStrip() {
    const box = document.getElementById('profileShapeGame');
    if (!box) return;
    box.innerHTML = `
      <p class="vg-strip">Z čoho sa skladám: <strong>${this.personaText()}</strong></p>
      <div class="vg-strip__actions">
        <button type="button" class="btn-secondary" id="sgShare">💌 Zdieľať</button>
        <a class="vg-again" href="#shape-game" data-scroll="#shape-game">Zahrať znova</a>
      </div>`;
  },

  share() {
    const text = `Z čoho sa skladám (Synced): ${this.personaText()}. A ty? 💛`;
    const done = () => {
      const b = document.getElementById('sgShare');
      if (b) b.textContent = 'Skopírované ✓';
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  },

  /* localStorage – dočasný most (TODO Supabase), vzor ostatných hier */
  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify({
        slots: this.slots,
        persona: this.counts()
      }));
    } catch (_) {}
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      const ids = this.D.slots.map(s => s.id);
      const valid = saved.slots
        && Object.keys(saved.slots).length === ids.length
        && ids.every(id => this.cycle.includes(saved.slots[id]));
      if (!valid) return;   // iný/starší formát sa ticho zahodí
      this.slots = saved.slots;
      AppState.userProfile.shapePersona = this.counts();
      this.done = true;
    } catch (_) { /* poškodené dáta ignorujeme */ }
  }
};


/* --------------------------------------------------------------
   3e4) VZŤAHOVÝ KOMPAS (RT test – Riemann-Thomannov model)
   --------------------------------------------------------------
   16 vlastných tvrdení → poloha na dvoch osiach + domovský kút.
   Soft signál + sebapoznanie: ŽIADNE %, ŽIADNA brána — číselné osi
   sa ukladajú len pre budúci soft matching (TODO Supabase).
   Persistencia v localStorage je dočasný most, vzor ostatných hier.
   -------------------------------------------------------------- */
const RTTest = {
  KEY: 'synced_rt_v1',
  answers: {},      // { itemId: 1..5 }
  done: false,

  init() {
    const D = window.RT_TEST;
    this.itemsEl = document.getElementById('rtItems');
    if (!D || !this.itemsEl) return;
    this.D = D;

    document.querySelector('#rt-test .vg-intro').textContent = D.intro;

    this.load();
    this.renderItems();
    this.updateProgress();
    if (this.done) { this.renderResult(); this.renderProfileStrip(); }

    this.itemsEl.addEventListener('change', (e) => {
      if (!e.target.name || !e.target.name.startsWith('rt')) return;
      this.answers[e.target.name] = Number(e.target.value);
      this.updateProgress();
    });

    document.getElementById('rtConfirm').addEventListener('click', () => this.confirm());
  },

  renderItems() {
    const ends = this.D.scaleEnds;
    this.itemsEl.innerHTML = this.D.items.map((it, i) => `
      <div class="question rt-item">
        <p class="question__text">${i + 1}. ${it.text}</p>
        <div class="likert" role="radiogroup" aria-label="${it.text}">
          ${[1, 2, 3, 4, 5].map(n => `
          <label class="likert__opt">
            <input type="radio" name="${it.id}" value="${n}"
              ${this.answers[it.id] === n ? 'checked' : ''}>
            <span class="likert__dot">${n}</span>
          </label>`).join('')}
        </div>
        <div class="likert__ends"><span>${ends[0]}</span><span>${ends[1]}</span></div>
      </div>`).join('');
  },

  answered() { return Object.keys(this.answers).length; },

  updateProgress() {
    const total = this.D.items.length;
    document.getElementById('rtProgress').textContent =
      `Zodpovedané ${this.answered()}/${total}`;
    document.getElementById('rtConfirm').disabled = this.answered() < total;
  },

  // os = priemer(plus pól) − priemer(mínus pól), normalizované na -1..1
  compute() {
    const byPole = { blizkost: [], odstup: [], kontinuita: [], zmena: [] };
    this.D.items.forEach(it => { byPole[it.pole].push(this.answers[it.id] ?? 3); });
    const avg = a => a.reduce((s, n) => s + n, 0) / a.length;
    const round = n => Math.round(n * 100) / 100;
    return {
      os1: round((avg(byPole.blizkost) - avg(byPole.odstup)) / 4),
      os2: round((avg(byPole.kontinuita) - avg(byPole.zmena)) / 4)
    };
  },

  // Domovský kút: znamienko osi; blízko 0 (|os| <= 0.125) = vyvážené
  kutOf(os1, os2) {
    const T = 0.125;
    const A = this.D.axes;
    const p1 = os1 > T ? A.os1.plusLabel : (os1 < -T ? A.os1.minusLabel : null);
    const p2 = os2 > T ? A.os2.plusLabel : (os2 < -T ? A.os2.minusLabel : null);

    if (p1 && p2) return { label: `${p1}+${p2}`, desc: this.D.corners[`${p1}+${p2}`] };
    if (p1 || p2) {
      const p = p1 || p2;
      return { label: p, desc: `${this.D.poles[p]} ${this.D.poleBalancedNote}` };
    }
    return { label: 'Vyvážený stred', desc: this.D.balanced };
  },

  confirm() {
    if (this.answered() < this.D.items.length) return;
    const { os1, os2 } = this.compute();
    const kut = this.kutOf(os1, os2);
    this.rt = { os1, os2, kut: kut.label };
    AppState.userProfile.rt = { ...this.rt };
    this.done = true;
    this.save();
    this.renderResult();
    this.renderProfileStrip();
    // Obnov matchy – pribudol opisný riadok „Vzťahový štýl" (nie skóre)
    if (typeof Matches !== 'undefined') Matches.render();
    // Ponúkni predvyplnené poradie v „Koho hľadám" (len návrh)
    if (typeof ArchetypePref !== 'undefined' && !ArchetypePref.result) {
      ArchetypePref.suggestFromRT();
    }
    if (typeof Dashboard !== 'undefined') Dashboard.render();
    document.getElementById('rtResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  // Jednoduchý SVG kompas: os1 vodorovne (Odstup ⟵ ⟶ Blízkosť),
  // os2 zvislo (Zmena dole, Kontinuita hore), bodka = používateľ.
  // V rohoch kvadrantov sú malé kruhové avatary archetypov (vizuál).
  compassSVG(os1, os2) {
    const cx = 110 + os1 * 80;
    const cy = 110 - os2 * 80;
    const set = AppState.userProfile.archetypeSet;
    const s = (set === 'm' || set === 'z') ? set : 'neutral';
    const userQuad = rtQuadrant({ os1, os2 });
    // pozície avatarov kvadrantov: BS vpravo hore, OS vľavo hore,
    // BZ vpravo dole, OZ vľavo dole (s odsadením od osí a popiskov)
    const spots = { BS: [165, 55], OS: [55, 55], BZ: [165, 165], OZ: [55, 165] };
    const R = 24;
    const minis = Object.entries(spots).map(([q, [x, y]]) => {
      const corner = window.ARCHETYPES?.corners[q];
      if (!corner) return '';
      const a = corner[s];
      const mine = q === userQuad;
      // zvýraznenie kvadrantu používateľa: teplý prstenec okolo avatara
      // rola: jemný dôraz (žltá) – tvoj kvadrant
      const halo = mine ? `<circle cx="${x}" cy="${y}" r="${R + 6}" fill="none"
          stroke="var(--c-highlight)" stroke-width="4" opacity="0.9"/>` : '';
      // neutrálna sada nemá obrázok → erb vo svetlom kruhu
      const media = a.img ? `
        <clipPath id="rtClip${q}"><circle cx="${x}" cy="${y}" r="${R}"/></clipPath>
        <image href="${a.img}" x="${x - R}" y="${y - R}" width="${R * 2}" height="${R * 2}"
          clip-path="url(#rtClip${q})" preserveAspectRatio="xMidYMid slice">
          <title>${a.name}</title>
        </image>` : `
        <circle cx="${x}" cy="${y}" r="${R}" fill="var(--bg-light)"/>
        ${archetypeIconSVG(corner.icon).replace('<svg class="arch-icon"',
          `<svg x="${x - R * 0.6}" y="${y - R * 0.6}" width="${R * 1.2}" height="${R * 1.2}"`)}`;
      return `${halo}${media}
        <circle cx="${x}" cy="${y}" r="${R}" fill="none"
          stroke="${mine ? 'var(--primary-dark)' : 'var(--primary)'}"
          stroke-width="${mine ? 3 : 2}"/>`;
    }).join('');
    return `
      <svg class="rt-compass" viewBox="0 0 220 220" role="img"
        aria-label="Kompas: poloha na osiach blízkosť–odstup a kontinuita–zmena">
        <rect x="10" y="10" width="200" height="200" rx="16" fill="var(--accent)"/>
        <line x1="110" y1="22" x2="110" y2="198" stroke="var(--primary)" stroke-width="2"/>
        <line x1="22" y1="110" x2="198" y2="110" stroke="var(--primary)" stroke-width="2"/>
        ${minis}
        <text x="110" y="36" text-anchor="middle">Kontinuita</text>
        <text x="110" y="192" text-anchor="middle">Zmena</text>
        <text x="194" y="104" text-anchor="end">Blízkosť</text>
        <text x="26" y="104">Odstup</text>
        <circle cx="${cx}" cy="${cy}" r="8" fill="var(--primary-dark)"
          stroke="var(--bg-light)" stroke-width="2"/>
      </svg>`;
  },

  renderResult() {
    const { os1, os2 } = this.rt;
    const kut = this.kutOf(os1, os2);
    const arch = archetypeFor(this.rt, AppState.userProfile.archetypeSet);
    const box = document.getElementById('rtResult');
    box.hidden = false;
    box.innerHTML = `
      <h3>Tvoj domovský kút: ${kut.label}</h3>
      <p class="vg-result__intro">${kut.desc}</p>
      ${arch ? `
      <div class="rt-archetype">
        ${archetypeAvatarHTML(arch, 'lg')}
        <div>
          <p class="rt-archetype__name">🏰 Tvoj archetyp: <strong>${arch.name}</strong></p>
          <p class="rt-archetype__desc">${arch.desc}</p>
          <span class="arch-toggle" role="group" aria-label="Zobraziť archetyp ako">
            <button type="button" data-arch-toggle="m"
              class="${AppState.userProfile.archetypeSet === 'm' ? 'is-active' : ''}">♂ Mužský</button>
            <button type="button" data-arch-toggle="z"
              class="${AppState.userProfile.archetypeSet === 'z' ? 'is-active' : ''}">♀ Ženský</button>
          </span>
        </div>
      </div>` : ''}
      ${this.compassSVG(os1, os2)}
      <p class="vg-result__note">${this.D.note}</p>`;
  },

  renderProfileStrip() {
    const box = document.getElementById('profileRtTest');
    if (!box) return;
    const kut = this.kutOf(this.rt.os1, this.rt.os2);
    const arch = archetypeFor(this.rt, AppState.userProfile.archetypeSet);
    box.innerHTML = `
      <p class="vg-strip">Môj vzťahový kompas: <strong>${kut.label}</strong></p>
      ${arch ? `<p class="rt-strip-desc">🏰 Archetyp: <strong>${arch.name}</strong></p>` : ''}
      <p class="rt-strip-desc">${kut.desc}</p>
      <div class="vg-strip__actions">
        <a class="vg-again" href="#rt-test" data-scroll="#rt-test">Zahrať znova</a>
      </div>`;
  },

  /* localStorage – dočasný most (TODO Supabase), vzor ostatných hier */
  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify({ answers: this.answers, rt: this.rt }));
    } catch (_) {}
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      const ids = this.D.items.map(it => it.id);
      const valid = saved.answers
        && ids.every(id => [1, 2, 3, 4, 5].includes(saved.answers[id]))
        && saved.rt && typeof saved.rt.os1 === 'number' && typeof saved.rt.os2 === 'number';
      if (!valid) return;   // iný/starší formát sa ticho zahodí
      this.answers = saved.answers;
      this.rt = saved.rt;
      AppState.userProfile.rt = { ...saved.rt };
      this.done = true;
    } catch (_) { /* poškodené dáta ignorujeme */ }
  }
};


/* --------------------------------------------------------------
   3e5) ASERTIVITA – tréning komunikácie (cvičné scény)
   --------------------------------------------------------------
   SOFT/self-insight: ŽIADEN vplyv na matching ani brány,
   assertStyle sa NEpoužíva v scoringu. Výsledok je privátny;
   zdieľanie len dobrovoľné tlačidlom.
   Persistencia v localStorage je dočasný most (TODO Supabase).
   -------------------------------------------------------------- */
const AssertTraining = {
  KEY: 'synced_assert_v1',
  PROG_KEY: 'synced_assertprogress_v1',
  idx: 0,
  answered: false,
  counts: { pasivny: 0, agresivny: 0, pasivne_agresivny: 0, asertivny: 0 },
  result: null,     // { counts, dominant } – uložený výsledok (aj po refreshi)
  // Mikro-lekcie a knižnica (bez vplyvu na scoring)
  progress: { amygdala: false, kindness: false, techniques: false },
  extraView: null,  // 'amygdala' | 'kindness' | 'tech' | null
  amyIdx: 0,
  kindIdx: 0,
  kindAnswered: false,

  init() {
    const D = window.ASSERT_TRAINING;
    this.sceneEl = document.getElementById('atScene');
    if (!D || !this.sceneEl) return;
    this.D = D;
    this.labelOf = Object.fromEntries(D.styles.map(s => [s.id, s.label]));

    document.getElementById('atPhilosophy').textContent = D.intro;
    document.getElementById('atStyles').innerHTML = `
      <h4>Prečo sa mi to deje — štyri štýly</h4>
      ${D.styles.map(s => `<p class="at-style"><strong>${s.label}:</strong> ${s.desc}</p>`).join('')}`;
    document.getElementById('atTriangle').innerHTML = `
      <h4>Dramatický trojuholník</h4>
      <p class="at-style">${D.triangle}</p>`;

    this.load();
    this.loadProgress();
    this.renderScene();
    this.renderTiles();
    if (this.result) { this.renderResult(); this.renderProfileStrip(); }

    this.sceneEl.addEventListener('click', (e) => {
      const a = e.target.closest('button[data-answer]');
      if (a && !this.answered) { this.choose(Number(a.dataset.answer)); return; }
      if (e.target.closest('[data-at-next]')) this.next();
      if (e.target.closest('[data-at-restart]')) this.restart();
    });

    // Dlaždice prehľadu + obsah mikro-lekcií a knižnice
    document.getElementById('atTiles').addEventListener('click', (e) => {
      const tile = e.target.closest('button[data-at-view]');
      if (tile) this.toggleExtra(tile.dataset.atView);
    });
    document.getElementById('atExtra').addEventListener('click', (e) => {
      if (e.target.closest('[data-amy-nav]')) {
        this.amyIdx += e.target.closest('[data-amy-nav]').dataset.amyNav === 'next' ? 1 : -1;
        this.renderAmygdala();
        return;
      }
      const kindBtn = e.target.closest('button[data-kind]');
      if (kindBtn && !this.kindAnswered) { this.kindChoose(kindBtn.dataset.kind); return; }
      if (e.target.closest('[data-kind-next]')) { this.kindNext(); return; }
      const practice = e.target.closest('button[data-practice]');
      if (practice) this.practice(practice.dataset.practice);
    });

    document.addEventListener('click', (e) => {
      if (e.target.closest('#atShare')) this.share();
    });
  },

  /* --- Prehľad modulu: dlaždice --- */
  renderTiles() {
    const tiles = [
      ['amygdala', '🧠', this.D.amygdala.title],
      ['kindness', '💛', this.D.kindness.title],
      ['tech', '📚', this.D.techniques.title]
    ];
    const doneKey = { amygdala: 'amygdala', kindness: 'kindness', tech: 'techniques' };
    document.getElementById('atTiles').innerHTML = tiles.map(([view, icon, title]) => `
      <button type="button" class="at-tile ${this.extraView === view ? 'is-open' : ''}"
        data-at-view="${view}">
        <span class="at-tile__icon">${icon}</span>
        <span class="at-tile__title">${title}</span>
        ${this.progress[doneKey[view]] ? '<span class="at-tile__done">✓</span>' : ''}
      </button>`).join('');
  },

  toggleExtra(view) {
    const box = document.getElementById('atExtra');
    if (this.extraView === view) {
      this.extraView = null;
      box.hidden = true;
      this.renderTiles();
      return;
    }
    this.extraView = view;
    box.hidden = false;
    if (view === 'amygdala') { this.amyIdx = 0; this.renderAmygdala(); }
    if (view === 'kindness') { this.kindIdx = 0; this.kindAnswered = false; this.renderKindness(); }
    if (view === 'tech') {
      this.renderTechniques();
      this.markDone('techniques');   // referenčný prehľad = otvorené → prejdené
    }
    this.renderTiles();
  },

  markDone(key) {
    if (this.progress[key]) return;
    this.progress[key] = true;
    AppState.userProfile.assertProgress = { ...this.progress };
    try { localStorage.setItem(this.PROG_KEY, JSON.stringify(this.progress)); } catch (_) {}
    this.renderTiles();
  },

  loadProgress() {
    try {
      const raw = localStorage.getItem(this.PROG_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      ['amygdala', 'kindness', 'techniques'].forEach(k => {
        if (saved[k] === true) this.progress[k] = true;
      });
      AppState.userProfile.assertProgress = { ...this.progress };
    } catch (_) { /* poškodené dáta ignorujeme */ }
  },

  /* --- Mikro-lekcia: amygdala (3 karty + trojuholník) --- */
  renderAmygdala() {
    const A = this.D.amygdala;
    const n = A.cards.length;
    this.amyIdx = Math.max(0, Math.min(this.amyIdx, n - 1));
    const last = this.amyIdx === n - 1;
    if (last) this.markDone('amygdala');
    document.getElementById('atExtra').innerHTML = `
      <h3>🧠 ${A.title}</h3>
      <p class="at-progress">Karta ${this.amyIdx + 1}/${n}</p>
      <p class="at-situation at-amy-card">${A.cards[this.amyIdx]}</p>
      ${last ? `<p class="at-amy-triangle">🔺 ${A.triangleNote}</p>` : ''}
      <div class="at-extra-nav">
        <button type="button" class="btn-secondary" data-amy-nav="prev"
          ${this.amyIdx === 0 ? 'disabled' : ''}>Späť</button>
        ${last ? '' : '<button type="button" class="btn-primary" data-amy-nav="next">Ďalej</button>'}
      </div>`;
  },

  /* --- Cvičenie: láskavosť vs. oprávnený nárok --- */
  renderKindness() {
    const K = this.D.kindness;
    if (this.kindIdx >= K.items.length) {
      this.markDone('kindness');
      document.getElementById('atExtra').innerHTML = `
        <h3>💛 ${K.title}</h3>
        <p class="vg-result__note">${K.outro}</p>`;
      return;
    }
    const it = K.items[this.kindIdx];
    this.kindAnswered = false;
    document.getElementById('atExtra').innerHTML = `
      <h3>💛 ${K.title}</h3>
      ${this.kindIdx === 0 ? `<p class="at-style">${K.intro}</p>` : ''}
      <p class="at-progress">Situácia ${this.kindIdx + 1}/${K.items.length}</p>
      <p class="at-situation">${it.text}</p>
      <div class="at-answers">
        <button type="button" class="at-answer" data-kind="laskavost">Láskavosť (slobodne dávam)</button>
        <button type="button" class="at-answer" data-kind="narok">Môj oprávnený nárok (mám na to právo)</button>
      </div>
      <div class="at-feedback" id="atKindFeedback" hidden></div>`;
  },

  kindChoose(choice) {
    const it = this.D.kindness.items[this.kindIdx];
    this.kindAnswered = true;
    document.querySelectorAll('#atExtra .at-answer').forEach(b => {
      b.disabled = true;
      b.classList.toggle('is-chosen', b.dataset.kind === choice);
      if (it.answer !== 'oboje' && b.dataset.kind === it.answer) b.classList.add('is-assert');
    });
    const ok = it.answer === 'oboje' || choice === it.answer;
    const lead = it.answer === 'oboje' ? 'Tu platí oboje:'
      : (ok ? 'Presne tak.' : 'Skús sa na to pozrieť takto:');
    const fb = document.getElementById('atKindFeedback');
    fb.hidden = false;
    fb.innerHTML = `
      <p><strong>${lead}</strong> ${it.feedback}</p>
      <button type="button" class="btn-primary" data-kind-next>Ďalej</button>`;
  },

  kindNext() {
    this.kindIdx++;
    this.renderKindness();
  },

  /* --- Knižnica techník --- */
  renderTechniques() {
    const T = this.D.techniques;
    document.getElementById('atExtra').innerHTML = `
      <h3>📚 ${T.title}</h3>
      <div class="at-tech-grid">
        ${T.items.map(t => `
          <div class="at-tech" data-tech="${t.id}">
            <p class="at-tech__name">${t.name}</p>
            <p class="at-tech__when">${t.when}</p>
            <p class="at-tech__example">${t.example}</p>
            <button type="button" class="btn-secondary" data-practice="${t.id}">Precvičiť</button>
            <p class="at-tech__extra" hidden></p>
          </div>`).join('')}
      </div>`;
  },

  // „Precvičiť": otvorí cvičnú scénu s technikou, inak ukáže ďalší príklad
  practice(techId) {
    const t = this.D.techniques.items.find(x => x.id === techId);
    if (!t) return;
    if (t.sceneId) {
      const i = this.D.scenes.findIndex(s => s.id === t.sceneId);
      if (i >= 0) {
        this.idx = i;
        this.renderScene();
        this.sceneEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
    }
    const box = document.querySelector(`#atExtra .at-tech[data-tech="${techId}"] .at-tech__extra`);
    if (box) { box.hidden = false; box.textContent = 'Ďalší príklad: ' + t.extra; }
  },

  renderScene() {
    const sc = this.D.scenes[this.idx];
    this.answered = false;
    this.sceneEl.innerHTML = `
      <p class="at-progress">Scéna ${this.idx + 1}/${this.D.scenes.length}</p>
      <p class="at-situation">${sc.text}</p>
      <div class="at-answers">
        ${sc.answers.map((a, i) => `
          <button type="button" class="at-answer" data-answer="${i}">${a.text}</button>`).join('')}
      </div>
      <div class="at-feedback" id="atFeedback" hidden></div>`;
  },

  choose(i) {
    const sc = this.D.scenes[this.idx];
    const chosen = sc.answers[i];
    this.answered = true;
    this.counts[chosen.style]++;

    const assertIdx = sc.answers.findIndex(a => a.style === 'asertivny');
    this.sceneEl.querySelectorAll('.at-answer').forEach((btn, j) => {
      btn.disabled = true;
      btn.classList.toggle('is-chosen', j === i);
      if (j === assertIdx) {
        btn.classList.add('is-assert');
        btn.insertAdjacentHTML('beforeend',
          `<span class="at-badge">asertívna cesta · ${sc.answers[assertIdx].technika}</span>`);
      }
    });

    const fb = document.getElementById('atFeedback');
    fb.hidden = false;
    const last = this.idx === this.D.scenes.length - 1;
    fb.innerHTML = `
      <p><strong>Tvoja voľba (${this.labelOf[chosen.style]} štýl):</strong> ${chosen.feedback}</p>
      <button type="button" class="btn-primary" data-at-next>${last ? 'Vyhodnotiť' : 'Ďalej'}</button>`;
  },

  next() {
    if (this.idx < this.D.scenes.length - 1) {
      this.idx++;
      this.renderScene();
    } else {
      this.finish();
    }
  },

  finish() {
    // Dominantný štýl; pri remíze láskavo uprednostni asertívny
    const order = ['asertivny', 'pasivny', 'agresivny', 'pasivne_agresivny'];
    const dominant = order.reduce((best, s) =>
      this.counts[s] > this.counts[best] ? s : best, order[0]);

    this.result = { counts: { ...this.counts }, dominant };
    AppState.userProfile.assertStyle = { ...this.result.counts, dominant };
    this.save();
    this.renderResult();
    this.renderProfileStrip();

    if (typeof Dashboard !== 'undefined') Dashboard.render();
    this.sceneEl.innerHTML = `
      <p class="at-situation">Prešiel/prešla si všetky scény. 💛</p>
      <button type="button" class="btn-secondary" data-at-restart>Prejsť scény znova</button>`;
    document.getElementById('atResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  restart() {
    this.idx = 0;
    this.counts = { pasivny: 0, agresivny: 0, pasivne_agresivny: 0, asertivny: 0 };
    this.renderScene();
  },

  countsText(counts) {
    return this.D.styles
      .map(s => `${s.label} ${counts[s.id]}×`)
      .join(' · ');
  },

  renderResult() {
    const R = this.D.results[this.result.dominant];
    const box = document.getElementById('atResult');
    box.hidden = false;
    box.innerHTML = `
      <h3>Tvoja tendencia: prevažne ${this.labelOf[this.result.dominant]} štýl</h3>
      <p class="vg-result__intro">${R.desc}</p>
      <p class="at-counts">Tvoje voľby: ${this.countsText(this.result.counts)}</p>
      <p class="vg-result__desc">🛠 Na precvičenie: ${R.technika}</p>
      <p class="vg-result__desc">🔺 ${R.rola}</p>
      <p class="vg-result__note">${this.D.note}</p>`;
  },

  renderProfileStrip() {
    const box = document.getElementById('profileAssert');
    if (!box) return;
    box.innerHTML = `
      <p class="vg-strip">Moja tendencia: <strong>prevažne ${this.labelOf[this.result.dominant]} štýl</strong></p>
      <div class="vg-strip__actions">
        <button type="button" class="btn-secondary" id="atShare">💌 Zdieľať tendenciu</button>
        <a class="vg-again" href="#assert-training" data-scroll="#assert-training">Prejsť znova</a>
      </div>`;
  },

  share() {
    const text = `Môj komunikačný tréning na Synced: tendencia prevažne ` +
      `${this.labelOf[this.result.dominant]} štýl. Trénujem „vyhrať bez boja". 💛`;
    const done = () => {
      const b = document.getElementById('atShare');
      if (b) b.textContent = 'Skopírované ✓';
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  },

  /* localStorage – dočasný most (TODO Supabase), vzor ostatných hier */
  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.result)); } catch (_) {}
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      const styles = this.D.styles.map(s => s.id);
      const valid = saved && styles.includes(saved.dominant)
        && saved.counts && styles.every(s => Number.isFinite(saved.counts[s]));
      if (!valid) return;   // iný/starší formát sa ticho zahodí
      this.result = saved;
      AppState.userProfile.assertStyle = { ...saved.counts, dominant: saved.dominant };
    } catch (_) { /* poškodené dáta ignorujeme */ }
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
      <p class="report-score">${top.r.type}</p>
      <p class="modal__desc">${top.r.desc}</p>
      <ul class="report-list">
        <li>Hodnoty: <b>${qualLabel(top.r.valueSim)}</b></li>
        <li>Naladenie a povahy: <b>${qualLabel(top.r.persComponent)}</b></li>
        <li>Zámer: <b>${qualLabel(top.r.intent)}</b></li>
        <li>Spoločné hodnoty: <b>${top.r.shared.join(', ') || 'objavíte spolu'}</b></li>
      </ul>
      <p class="pay-note">Zámerne bez percent — čísla zvádzajú porovnávať,
        my radšej ukazujeme, čo vás spája. 💛</p>
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
      if (typeof TestGate !== 'undefined') TestGate.markDone();   // odomkne appku
      this.renderSummary();
      this.syncProfileSection();
      Matches.render();           // naplní sekciu #matches reálnymi dátami
      Chat.renderList();          // zoradí konverzácie podľa (interného) skóre
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

    // Ak používateľ prišiel cez pozvánku – ukáž jemný signál súladu (bez čísla)
    let compareBlock = '';
    const inviter = (typeof Invite !== 'undefined') ? Invite.inviterUser() : null;
    if (inviter) {
      // Kvalitatívny signál namiesto percenta (skóre sa nezobrazuje)
      const r = calculateCompatibility(Matches.currentUser(), inviter);
      const sharedTop = (r.shared || []).slice(0, 3);
      compareBlock = `
        <div class="summary-card summary-card--compare">
          <h4>💞 Ty & ${Invite.esc(inviter.name)}: máte veľa spoločného 💛</h4>
          <p class="summary-sub">${r.type} – ${r.desc}</p>
          <p class="summary-sub">${sharedTop.length
            ? 'Spájajú vás: <b>' + sharedTop.join('</b>, <b>') + '</b>'
            : 'Spoločné hodnoty objavíte v rozhovore.'}</p>
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
   5a1) OCHUTNÁVKA – 3 kliky v hero → náznak „sveta" archetypu
   --------------------------------------------------------------
   Len ochutnávka: NEUKLADÁ sa ako RT výsledok a nepredvyplňuje
   archetyp. Bez percent, bez pohlavia. Skryje sa, keď je celý
   test hotový.
   -------------------------------------------------------------- */
const Taster = {
  idx: 0,
  answers: {},

  init() {
    this.el = document.getElementById('taster');
    this.D = window.TASTER;
    if (!this.el || !this.D) return;

    this.el.addEventListener('click', (e) => {
      const opt = e.target.closest('button[data-taster-opt]');
      if (opt) { this.choose(opt.dataset.tasterOpt); return; }
      if (e.target.closest('[data-taster-restart]')) this.restart();
    });

    this.render();
  },

  choose(value) {
    const q = this.D.questions[this.idx];
    this.answers[q.options[0].axis] = value;
    this.idx++;
    this.render();
  },

  restart() {
    this.idx = 0;
    this.answers = {};
    this.render();
  },

  worldKey() {
    return `${this.answers.a || 'blizkost'}+${this.answers.b || 'kontinuita'}`;
  },

  render() {
    // Hotový test → ochutnávka netreba
    if (typeof TestGate !== 'undefined' && TestGate.isDone()) {
      this.el.hidden = true;
      const portrait = document.getElementById('heroPortrait');
      if (portrait) portrait.hidden = false;
      return;
    }
    this.el.hidden = false;

    if (this.idx < this.D.questions.length) {
      const q = this.D.questions[this.idx];
      this.el.innerHTML = `
        <p class="taster__progress">Ochutnávka · ${this.idx + 1}/${this.D.questions.length}</p>
        <p class="taster__q">${q.text}</p>
        <div class="taster__opts">
          ${q.options.map(o => `
            <button type="button" class="taster__opt"
              data-taster-opt="${o.value}">${o.label}</button>`).join('')}
        </div>`;
      return;
    }

    // Mikro-výsledok: svet + dochuť + JEDINÉ CTA
    const w = this.D.worlds[this.worldKey()];
    const flavor = this.D.flavor[this.answers.c] || '';
    this.el.innerHTML = `
      <p class="taster__progress">Tvoja ochutnávka</p>
      <div class="taster__imgs">
        ${w.imgs.map((src, i) => `
          <img src="${src}" alt="${w.alts[i]}" loading="lazy" width="96" height="96">`).join('')}
      </div>
      <p class="taster__world">Blízky ti je <strong>${w.name}</strong></p>
      <p class="taster__line">${w.line} ${flavor}</p>
      <button class="btn-primary btn-lg taster__cta" data-scroll="#signup">${this.D.cta}</button>
      <p class="taster__note">${this.D.note}
        <button type="button" class="taster__again" data-taster-restart>Skúsiť znova</button>
      </p>`;
  }
};


/* --------------------------------------------------------------
   5a2) TEST GATE – nezahltiť návštevníka pred testom
   --------------------------------------------------------------
   Kým nie je hotový test kompatibility, ťažké sekcie appky sa
   nezobrazujú (landing je krátky a vedie k jednému cieľu).
   Po dokončení testu sa appka odomkne celá.
   -------------------------------------------------------------- */
const TestGate = {
  KEY: 'synced_testdone_v1',
  // Sekcie, ktoré dávajú zmysel až s výsledkom testu
  heavy: ['dashboard', 'rt-test', 'archetype-pref', 'profile', 'matches',
    'values-game', 'kitchen-game', 'shape-game', 'essence-name',
    'assert-training', 'chat', 'video'],

  init() {
    try { this.done = localStorage.getItem(this.KEY) === '1'; } catch (_) { this.done = false; }
    // Ak profil už v tomto sedení existuje, ber test ako hotový
    if (AppState.userProfile.personality?.type) this.done = true;
    this.apply();
  },

  isDone() { return !!this.done; },

  markDone() {
    this.done = true;
    try { localStorage.setItem(this.KEY, '1'); } catch (_) {}
    this.apply();
    if (typeof Taster !== 'undefined') Taster.render();
  },

  apply() {
    const done = this.isDone();
    document.body.classList.toggle('is-locked', !done);
    this.heavy.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.hidden = !done;
    });
    // Sekcie určené len pre návštevníka pred testom
    document.querySelectorAll('[data-before-test]').forEach(el => { el.hidden = done; });
    // Odkazy do appky nemajú kam viesť, kým je zamknutá
    document.querySelectorAll('[data-app-nav]').forEach(el => { el.hidden = !done; });

    // Nenápadná informácia, že sa toho po teste odomkne viac
    const note = document.getElementById('lockedNote');
    if (note) note.hidden = done;
  }
};


/* --------------------------------------------------------------
   5b) STICKY CTA na mobile – kým používateľ nezačne test
   -------------------------------------------------------------- */
const StickyCta = {
  init() {
    this.el = document.getElementById('stickyCta');
    this.signup = document.getElementById('signup');
    if (!this.el || !this.signup) return;

    // Skryje sa, keď je test v zábere, už sa rozbehol, alebo naň
    // používateľ klikol (vtedy už pruh nemá čo pripomínať)
    const update = () => {
      const started = AppState.currentStep > 1
        || Object.keys(AppState.answers).length > 0;
      const box = this.signup.getBoundingClientRect();
      const inView = box.top < window.innerHeight * 0.8;
      const hide = started || inView || this.dismissed;
      this.el.classList.toggle('is-hidden', hide);
      document.body.classList.toggle('cta-hidden', hide);
    };
    this.update = update;

    update();
    // IntersectionObserver zaberie aj pri skoku cez odkaz či programovom
    // skrolovaní (kde sa scroll event nemusí vyvolať)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(update, { rootMargin: '0px 0px -20% 0px' }).observe(this.signup);
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // Po dopočítaní layoutu (načítanie obrázkov mení výšku hero sekcie)
    window.addEventListener('load', update);
    document.addEventListener('change', update);
    // Klik na CTA vedúce k testu pruh zavrie (aj počas plynulého skrolovania)
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-scroll="#signup"]')) this.dismissed = true;
      update();
      setTimeout(update, 500);
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
  Dashboard.init();
  ValuesGame.init();
  KitchenGame.init();
  ShapeGame.init();
  ArchetypeSet.init();          // pred RTTest – sada musí byť načítaná pred vykreslením
  RTTest.init();
  ArchetypePref.init();         // po RTTest – návrh poradia číta uložené RT osi
  EssenceName.init();           // po RTTest a hrách – návrhy čítajú ich uložené výsledky
  AssertTraining.init();
  Mode.init();                  // ako posledný – prekreslí rozcestník podľa režimu
  Dashboard.render();
  VideoVerification.init();
  VideoChat.init();
  Modal.init();
  Billing.init();
  Legal.init();
  Invite.init();
  Nav.init();
  SmoothScroll.init();
  TestGate.init();              // pred Taster – ochutnávka sa podľa neho skrýva
  Taster.init();
  StickyCta.init();
  console.log('[Synced] Aplikácia inicializovaná ✔');
});
