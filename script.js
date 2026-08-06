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

    const ranked = users
      .map(u => ({ user: u, result: calculateCompatibility(me, u) }))
      .sort((a, b) => b.result.score - a.result.score);

    AppState.compatibilityScore = ranked[0]?.result.score ?? null;

    grid.innerHTML = ranked.map(({ user, result }) => this.cardHTML(user, result)).join('');
  },

  // Zostaví „mňa" z profilu do rovnakého tvaru ako sample users
  currentUser() {
    const P = AppState.userProfile;
    return {
      name: 'Ty',
      intent: P.relationshipIntent,
      valueVector: P.valueVector || {},
      personality: P.personality.scores || {},
      complementPreference: P.complementPreference
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
  renderList() {
    const users = window.SAMPLE_USERS || [];
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
    AppState.chat.activeMatchId = matchId;
    const match = (window.SAMPLE_USERS || []).find(u => u.id === matchId);
    if (!match) return;

    // Prvá otvorená konverzácia = uvítacia správa od matchu
    if (!AppState.chat.conversations[matchId]) {
      AppState.chat.conversations[matchId] = [
        { from: 'them', text: `Ahoj! Teší ma, že sme si padli do oka. 😊 ${match.bio}` }
      ];
    }

    this.headerEl.innerHTML = `<strong>${match.name}, ${match.age}</strong> · ${match.location}`;
    this.renderList();
    this.renderMessages();
    this.refreshSuggestions();
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
  Chat.init();
  VideoVerification.init();
  VideoChat.init();
  Nav.init();
  SmoothScroll.init();
  console.log('[Synced] Aplikácia inicializovaná ✔');
});
