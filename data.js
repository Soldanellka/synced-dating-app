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


/* ==============================================================
   FIKTÍVNA DATABÁZA POUŽÍVATEĽOV (pre matchovanie – Krok 3)
   Neskôr ju nahradí backend (Supabase). Štruktúra je zámerne
   rovnaká ako userProfile, aby algoritmus fungoval na oboch.
   --------------------------------------------------------------
   valueVector: 1–5 pre všetkých 7 hodnôt
   personality: 1–5 pre 5 dimenzií (Big Five light)
   intent: 'serious' | 'company' | 'open'
   smokes: true/false – pre tvrdú bránu „Fajčenie"
   appearance: abstraktný výzor (žiadne miery ani fotky) – KÁNON
   podľa docs/vyzor-a-pravidla.md (sekcia 2.2), presné reťazce:
     heightBand: 'nizsia' | 'stredna' | 'vyssia'
     silhouette: 'drobna' | 'atleticka' | 'plna' | 'silna'
     hair:       'tmave' | 'svetle' | 'rysave'
     style:      'prirodzeny' | 'upraveny' | 'sportovy'
   ============================================================== */

const SAMPLE_USERS = [
  {
    id: 'u_anna', name: 'Anna', age: 28, location: 'Bratislava',
    bio: 'Pokojné večery, dobrá kniha a rodina nadovšetko.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'stredna', silhouette: 'drobna', hair: 'tmave', style: 'prirodzeny' },
    valueVector: { 'rodina':5, 'kariéra':3, 'pokoj':5, 'spiritualita':3, 'osobný rast':4, 'sloboda':2, 'dobrodružstvo':2 },
    personality: { openness:3.5, conscientiousness:4, extraversion:3, agreeableness:4.5, stability:4 }
  },
  {
    id: 'u_peter', name: 'Peter', age: 32, location: 'Košice',
    bio: 'Ambiciózny, stále sa učím niečo nové. Hľadám parťáčku do života.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'vyssia', silhouette: 'atleticka', hair: 'tmave', style: 'upraveny' },
    valueVector: { 'rodina':3, 'kariéra':5, 'pokoj':2, 'spiritualita':2, 'osobný rast':5, 'sloboda':4, 'dobrodružstvo':4 },
    personality: { openness:4, conscientiousness:4.5, extraversion:4, agreeableness:3, stability:3.5 }
  },
  {
    id: 'u_nina', name: 'Nina', age: 26, location: 'Žilina',
    bio: 'Cestovateľka, milujem spontánnosť a slobodu. Uvidíme, kam to pôjde.',
    intent: 'open',
    smokes: true,
    appearance: { heightBand: 'stredna', silhouette: 'drobna', hair: 'svetle', style: 'sportovy' },
    valueVector: { 'rodina':2, 'kariéra':3, 'pokoj':2, 'spiritualita':3, 'osobný rast':4, 'sloboda':5, 'dobrodružstvo':5 },
    personality: { openness:5, conscientiousness:2.5, extraversion:4.5, agreeableness:3.5, stability:3 }
  },
  {
    id: 'u_tomas', name: 'Tomáš', age: 30, location: 'Bratislava',
    bio: 'Hlbšie rozhovory, príroda a pokoj. Vážim si autentickosť.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'vyssia', silhouette: 'silna', hair: 'tmave', style: 'prirodzeny' },
    valueVector: { 'rodina':4, 'kariéra':2, 'pokoj':5, 'spiritualita':5, 'osobný rast':4, 'sloboda':3, 'dobrodružstvo':2 },
    personality: { openness:4, conscientiousness:3.5, extraversion:2.5, agreeableness:4.5, stability:4.5 }
  },
  {
    id: 'u_lucia', name: 'Lucia', age: 29, location: 'Nitra',
    bio: 'Rodina, viera a láskavosť. Verím na vzťahy, ktoré rastú.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'nizsia', silhouette: 'plna', hair: 'svetle', style: 'upraveny' },
    valueVector: { 'rodina':5, 'kariéra':2, 'pokoj':4, 'spiritualita':4, 'osobný rast':3, 'sloboda':2, 'dobrodružstvo':3 },
    personality: { openness:3, conscientiousness:4, extraversion:3.5, agreeableness:5, stability:4 }
  },
  {
    id: 'u_marek', name: 'Marek', age: 34, location: 'Trnava',
    bio: 'Práca ma baví, rád si užívam slobodu. Zatiaľ bez veľkých plánov.',
    intent: 'company',
    smokes: true,
    appearance: { heightBand: 'vyssia', silhouette: 'atleticka', hair: 'tmave', style: 'sportovy' },
    valueVector: { 'rodina':2, 'kariéra':5, 'pokoj':3, 'spiritualita':1, 'osobný rast':4, 'sloboda':5, 'dobrodružstvo':4 },
    personality: { openness:3.5, conscientiousness:4, extraversion:4, agreeableness:2.5, stability:3.5 }
  }
];

window.SAMPLE_USERS = SAMPLE_USERS;


/* ==============================================================
   HRA: REBRÍČEK HODNÔT (príbeh o Lole)
   --------------------------------------------------------------
   Soft signál + obsah do profilu + zdieľateľná vec.
   NIE je to tvrdá brána ani percento kompatibility — nemení
   matching ani skóre. Mapovanie postava → hodnota je hráčovi
   počas hrania SKRYTÉ, odhalí sa až vo výsledku.
   ============================================================== */

const VALUES_GAME = {
  intro: 'Nie je to o správne/zle — ukazuje to, čo máš práve teraz na prvom mieste.',

  story: 'Lola miluje Eduarda. Nevie bez neho žiť, a tak sa rozhodne vydať sa ' +
    'za ním. Cestou stretne Radoma, ktorý spláva rieku, a poprosí ho, aby ju ' +
    'previezol na plti. Radom odmietne — blíži sa búrka a splav by nebol ' +
    'bezpečný. Vydá sa teda cez pozemky: najprv poprosí Paloma, ktorý ju pustí ' +
    'za peniaze, potom Selina, ktorý ju pustí za sex. Nakoniec sa dostane ' +
    'k Eduardovi — a ten jej povie, že takú, zneuctenú a bez peňazí, nechce.',

  /* Poradie = poradie v príbehu (východiskové poradie kariet) */
  characters: [
    { id: 'laska',   name: 'Lola',   value: 'Láska',
      desc: 'Cit, ktorý ťa ženie za druhým človekom — aj cez rieku, aj cez prekážky.' },
    { id: 'ego',     name: 'Eduard', value: 'Ego',
      desc: 'Vlastná hrdosť a obraz o sebe — potreba chrániť si svoju hodnotu.' },
    { id: 'sex',     name: 'Selin',  value: 'Sex',
      desc: 'Telesná blízkosť a príťažlivosť — sila, ktorá je prirodzenou súčasťou vzťahov.' },
    { id: 'peniaze', name: 'Palom',  value: 'Peniaze',
      desc: 'Istota a praktickosť — svet, v ktorom majú veci svoju cenu.' },
    { id: 'rozum',   name: 'Radom',  value: 'Rozum',
      desc: 'Rozvaha a hranice — vedieť povedať nie, keď to nie je bezpečné.' }
  ]
};

window.VALUES_GAME = VALUES_GAME;


/* ==============================================================
   HRA: KUCHYNSKÝ TEST (5 súčasných podnetov)
   --------------------------------------------------------------
   Rovnaký princíp ako VALUES_GAME: soft signál, NIE brána,
   NIE percento. Hráč zoradí podnety podľa toho, čo urobí prvé —
   poradie = jeho priority. Mapovanie podnet → oblasť je počas
   hrania skryté. Texty rodovo neutrálne (2. osoba, prítomný čas).
   Kľúče: ja | sex | praca | rodina | priatelia.
   POZOR: kúpeľ (ja = Moja chvíľka) a voda z kuchynského umývadla
   (sex) sú DVE RÔZNE veci. 'short' sa používa vo výsledku ako
   názov podnetu.
   ============================================================== */

const KITCHEN_GAME = {
  intro: 'Nie je to o správne/zle — ukazuje to, čo máš práve teraz na prvom mieste.',

  story: 'Po náročnom dni máš konečne chvíľu len pre seba. Napustená vaňa, ' +
    'sviečky, vonné tyčinky, tlmená hudba a na hladine plávajú vonné kvety. ' +
    'Vstupuješ do vane, ponoríš sa do teplej vody a vychutnávaš si ten pokoj. ' +
    'A vtom sa naraz spustí všetko ostatné: z kuchynského umývadla prúdom ' +
    'preteká voda, zvoní telefón, z detskej izby sa ozve plač a niekto zvoní ' +
    'pri dverách. Čo urobíš ako prvé — a čo necháš na koniec?',

  characters: [
    { id: 'ja',        short: 'kúpeľ',    name: 'Zostať vo vani a vychutnať si svoju chvíľku',
      value: 'Moja chvíľka',
      desc: 'Jediná vec v tom chaose, ktorá je len tvoja. Kam si ju zaradíš, ' +
        'ukazuje, koľko priestoru si necháš pre seba — vysoko či nízko, oboje ' +
        'je len momentka, nie hodnotenie.' },
    { id: 'sex',       short: 'tečúca voda z umývadla', name: 'Zastaviť vodu, čo prúdom tečie z kuchynského umývadla',
      value: 'Sex a telesnosť',
      desc: 'Telesnosť a vášeň. Nie je to o množstve — len o tom, kde ju máš ' +
        'práve teraz v rebríčku.' },
    { id: 'praca',     short: 'telefón',  name: 'Zdvihnúť telefón',
      value: 'Práca a povinnosti',
      desc: 'Svet, ktorý na teba čaká „vonku" — zodpovednosť, ktorá sa hlási sama.' },
    { id: 'rodina',    short: 'dieťa',    name: 'Utíšiť plačúce dieťa',
      value: 'Rodina a blízki',
      desc: 'Ľudia, ktorí ťa potrebujú — starostlivosť a blízkosť, ktorá nepočká.' },
    { id: 'priatelia', short: 'dvere',    name: 'Otvoriť dvere',
      value: 'Priatelia a okolie',
      desc: 'Tí, čo stoja za dverami — otvorenosť voči svetu a vzťahom okolo teba.' }
  ]
};

window.KITCHEN_GAME = KITCHEN_GAME;


/* ==============================================================
   HRA: PANÁČIK Z TVAROV (10 dielikov, 3 tvary)
   --------------------------------------------------------------
   Soft signál + self-insight. Podiel tvarov = balans troch zložiek.
   Percentá sú tu POVOLENÉ, ale len ako opis seba („60 % rozum…"),
   NIKDY ako zhoda s niekým. NIE brána — nemení matching ani skóre.
   Mapovanie: trojuholník=sex, kruh=cit, štvorec=rozum
   (počas skladania sa mapovanie neukazuje, odhalí sa vo výsledku).
   ============================================================== */

const SHAPE_GAME = {
  intro: 'Nie je lepšie ani horšie — ukazuje to len, z čoho práve teraz skladáš sám seba.',

  howto: 'Poskladaj panáčika z 10 dielikov. Klikaním na dielik prepínaš tvar: ' +
    '△ trojuholník, ○ kruh, □ štvorec. Pre každé miesto vyber tvar, ktorý ti sedí — ' +
    'nerozmýšľaj dlho, prvé pocity bývajú najúprimnejšie.',

  /* Poradie = poradie cyklovania pri klikaní */
  shapes: [
    { id: 'sex',   glyph: '△', label: 'Sex',   long: 'Sex a telesnosť (vášeň, energia)' },
    { id: 'cit',   glyph: '○', label: 'Cit',   long: 'Cit (emócie, blízkosť, srdce)' },
    { id: 'rozum', glyph: '□', label: 'Rozum', long: 'Rozum (logika, poriadok, hlava)' }
  ],

  /* 10 slotov tela – id sa používa aj ako grid-area v CSS */
  slots: [
    { id: 'hlava',     label: 'Hlava' },
    { id: 'trup',      label: 'Trup' },
    { id: 'lruka',     label: 'Ľavá ruka' },
    { id: 'pruka',     label: 'Pravá ruka' },
    { id: 'ldlan',     label: 'Ľavá dlaň' },
    { id: 'pdlan',     label: 'Pravá dlaň' },
    { id: 'lstehno',   label: 'Ľavá noha' },
    { id: 'pstehno',   label: 'Pravá noha' },
    { id: 'lchodidlo', label: 'Ľavé chodidlo' },
    { id: 'pchodidlo', label: 'Pravé chodidlo' }
  ],

  results: {
    dominant: {
      rozum: 'Ideš hlavou — poriadok a jasná myšlienka ti dávajú istotu.',
      cit:   'Ideš srdcom — blízkosť a emócie sú pre teba kompas.',
      sex:   'Ideš telom — vášeň a energia ťa poháňajú.'
    },
    lowest: {
      rozum: 'Rozum je dnes v úzadí — rozhoduješ viac citom a telom, a aj to je cesta.',
      cit:   'Emócie sú dnes tichšie — čo neznamená, že tam nie sú.',
      sex:   'Telesnosť je dnes v úzadí — energia sa práve sústreďuje inde.'
    },
    note: 'Nie je lepšie ani horšie — ukazuje to len, z čoho práve teraz skladáš ' +
      'sám seba. Ideálny nie je prevaha jednej zložky, ale balans, ktorý sedí práve tebe. 💛'
  }
};

window.SHAPE_GAME = SHAPE_GAME;
