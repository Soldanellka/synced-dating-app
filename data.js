/* ==============================================================
   SYNCED – data.js
   Otázky testu kompatibility + konfigurácia scoringu.
   Všetko je oddelené od logiky, aby sa otázky dali ľahko meniť.
   --------------------------------------------------------------
   Typy otázok:
   - 'likert' : škála 1–5 (Vôbec nesúhlasím → Úplne súhlasím)
   - 'choice' : jedna možnosť
   - 'multi'  : viac možností (max = maxSelect)
   ============================================================== */

'use strict';

const SYNCED_DATA = {

  /* Likert popisky (1–5) */
  likertLabels: [
    'Vôbec nesúhlasím',
    'Skôr nesúhlasím',
    'Neutrálne',
    'Skôr súhlasím',
    'Úplne súhlasím'
  ],

  /* ---------------------------------------------------------
     KROK 2 – HODNOTY (7 otázok, každá = jedna hodnota)
     Skóre 1–5 = ako veľmi je hodnota pre teba dôležitá.
     Top 3 s najvyšším skóre tvoria userProfile.values
     --------------------------------------------------------- */
  values: [
    { id: 'v_family',    value: 'rodina',       label: 'Rodina',        type: 'likert',
      text: 'Rodina a blízke vzťahy sú stredobodom môjho života.' },
    { id: 'v_career',    value: 'kariéra',      label: 'Kariéra',       type: 'likert',
      text: 'Kariéra a profesijný rast sú pre mňa veľmi dôležité.' },
    { id: 'v_calm',      value: 'pokoj',        label: 'Pokoj',         type: 'likert',
      text: 'Potrebujem pokoj, rovnováhu a dostatok času na oddych.' },
    { id: 'v_spirit',    value: 'spiritualita', label: 'Spiritualita',  type: 'likert',
      text: 'Duchovno alebo hlbší zmysel života pre mňa veľa znamená.' },
    { id: 'v_growth',    value: 'osobný rast',  label: 'Osobný rast',   type: 'likert',
      text: 'Neustále na sebe pracujem a chcem osobnostne rásť.' },
    { id: 'v_freedom',   value: 'sloboda',      label: 'Sloboda',       type: 'likert',
      text: 'Vo vzťahu si potrebujem zachovať slobodu a nezávislosť.' },
    { id: 'v_adventure', value: 'dobrodružstvo',label: 'Dobrodružstvo', type: 'likert',
      text: 'Milujem dobrodružstvo, cestovanie a spontánne zážitky.' }
  ],

  /* ---------------------------------------------------------
     KROK 3 – OSOBNOSŤ (Big Five light, 10 otázok, 2 na dimenziu)
     dim: openness | conscientiousness | extraversion | agreeableness | stability
     reverse:true = otázka je formulovaná opačne (skóre sa obráti)
     --------------------------------------------------------- */
  personality: [
    { id: 'p_o1', dim: 'openness',          type: 'likert', reverse: false,
      text: 'Rád(a) skúšam nové veci – jedlá, miesta, zážitky.' },
    { id: 'p_o2', dim: 'openness',          type: 'likert', reverse: true,
      text: 'Mám radšej zaužívané rutiny a veľké zmeny ma znervózňujú.' },

    { id: 'p_c1', dim: 'conscientiousness', type: 'likert', reverse: false,
      text: 'Som organizovaný(á) a veci si rád(a) plánujem dopredu.' },
    { id: 'p_c2', dim: 'conscientiousness', type: 'likert', reverse: true,
      text: 'Povinnosti často odkladám na poslednú chvíľu.' },

    { id: 'p_e1', dim: 'extraversion',      type: 'likert', reverse: false,
      text: 'Energiu dobíjam v spoločnosti ľudí.' },
    { id: 'p_e2', dim: 'extraversion',      type: 'likert', reverse: true,
      text: 'Po dlhšom čase medzi ľuďmi potrebujem byť sám/sama.' },

    { id: 'p_a1', dim: 'agreeableness',     type: 'likert', reverse: false,
      text: 'Ľahko sa vžijem do pocitov druhých a rád(a) pomáham.' },
    { id: 'p_a2', dim: 'agreeableness',     type: 'likert', reverse: true,
      text: 'V konflikte si idem tvrdo za svojím, aj na úkor druhých.' },

    { id: 'p_s1', dim: 'stability',         type: 'likert', reverse: false,
      text: 'Aj v strese si zvyknem zachovať pokoj.' },
    { id: 'p_s2', dim: 'stability',         type: 'likert', reverse: true,
      text: 'Často sa trápim a veci si beriem osobne.' }
  ],

  /* ---------------------------------------------------------
     KROK 4 – PREFERENCIE PARTNERA (5 otázok)
     --------------------------------------------------------- */
  preferences: [
    { id: 'pref_traits', type: 'multi', maxSelect: 3, output: 'preferredPartnerTraits',
      text: 'Ktoré vlastnosti u partnera oceníš najviac? (max 3)',
      options: ['Láskavosť', 'Ambície', 'Humor', 'Spoľahlivosť', 'Otvorenosť', 'Pokoj', 'Inteligencia', 'Empatia'] },

    { id: 'pref_shared', type: 'likert', output: 'sharedValuesImportance',
      text: 'Je pre mňa dôležité, aby partner zdieľal moje hodnoty.' },

    { id: 'pref_complement', type: 'likert', output: 'complementPreference',
      text: 'Priťahujú ma ľudia, ktorí sú v niečom iní alebo opační ako ja.' },

    { id: 'pref_pace', type: 'choice', output: 'pace',
      text: 'Ako rád(a) buduješ vzťah?',
      options: ['Pomaly a opatrne', 'Prirodzeným tempom', 'Rýchlo a intenzívne'] },

    { id: 'pref_dealbreakers', type: 'multi', maxSelect: 4, output: 'dealbreakers',
      text: 'Čo je pre teba „no-go"? (vyber všetko, čo platí)',
      options: ['Fajčenie', 'Nezáujem o rodinu', 'Nečestnosť', 'Rozdielne životné ciele', 'Žiadne – som otvorený(á)'] }
  ],

  /* ---------------------------------------------------------
     Archetypy osobnosti podľa najvýraznejšej dimenzie.
     Používa sa pri zostavovaní personality.type
     --------------------------------------------------------- */
  archetypes: {
    openness:          { name: 'Zvedavý objaviteľ',  desc: 'otvorený novým zážitkom a nápadom' },
    conscientiousness: { name: 'Spoľahlivý staviteľ', desc: 'organizovaný, cieľavedomý a stabilný' },
    extraversion:      { name: 'Spoločenská duša',    desc: 'energický, otvorený a rád medzi ľuďmi' },
    agreeableness:     { name: 'Empatický spojenec',  desc: 'láskavý, vnímavý a ohľaduplný' },
    stability:         { name: 'Pokojná kotva',       desc: 'vyrovnaný, pokojný aj v náročných chvíľach' }
  },

  dimLabels: {
    openness: 'Otvorenosť',
    conscientiousness: 'Svedomitosť',
    extraversion: 'Extraverzia',
    agreeableness: 'Prívetivosť',
    stability: 'Emocionálna stabilita'
  }
};

window.SYNCED_DATA = SYNCED_DATA;
