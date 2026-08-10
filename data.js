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
   rt: vzťahový kompas { os1, os2 } v rozsahu -1..1
     os1: Odstup (-) ⟷ Blízkosť (+), os2: Zmena (-) ⟷ Kontinuita (+)
     Len opisný soft signál – nikdy percento ani brána.
   ============================================================== */

const SAMPLE_USERS = [
  {
    id: 'u_anna', name: 'Anna', age: 28, location: 'Bratislava',
    bio: 'Pokojné večery, dobrá kniha a rodina nadovšetko.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'stredna', silhouette: 'drobna', hair: 'tmave', style: 'prirodzeny' },
    rt: { os1: 0.6, os2: 0.5 },
    valueVector: { 'rodina':5, 'kariéra':3, 'pokoj':5, 'spiritualita':3, 'osobný rast':4, 'sloboda':2, 'dobrodružstvo':2 },
    personality: { openness:3.5, conscientiousness:4, extraversion:3, agreeableness:4.5, stability:4 }
  },
  {
    id: 'u_peter', name: 'Peter', age: 32, location: 'Košice',
    bio: 'Ambiciózny, stále sa učím niečo nové. Hľadám parťáčku do života.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'vyssia', silhouette: 'atleticka', hair: 'tmave', style: 'upraveny' },
    rt: { os1: 0.1, os2: -0.4 },
    valueVector: { 'rodina':3, 'kariéra':5, 'pokoj':2, 'spiritualita':2, 'osobný rast':5, 'sloboda':4, 'dobrodružstvo':4 },
    personality: { openness:4, conscientiousness:4.5, extraversion:4, agreeableness:3, stability:3.5 }
  },
  {
    id: 'u_nina', name: 'Nina', age: 26, location: 'Žilina',
    bio: 'Cestovateľka, milujem spontánnosť a slobodu. Uvidíme, kam to pôjde.',
    intent: 'open',
    smokes: true,
    appearance: { heightBand: 'stredna', silhouette: 'drobna', hair: 'svetle', style: 'sportovy' },
    rt: { os1: -0.5, os2: -0.7 },
    valueVector: { 'rodina':2, 'kariéra':3, 'pokoj':2, 'spiritualita':3, 'osobný rast':4, 'sloboda':5, 'dobrodružstvo':5 },
    personality: { openness:5, conscientiousness:2.5, extraversion:4.5, agreeableness:3.5, stability:3 }
  },
  {
    id: 'u_tomas', name: 'Tomáš', age: 30, location: 'Bratislava',
    bio: 'Hlbšie rozhovory, príroda a pokoj. Vážim si autentickosť.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'vyssia', silhouette: 'silna', hair: 'tmave', style: 'prirodzeny' },
    rt: { os1: 0.3, os2: 0.6 },
    valueVector: { 'rodina':4, 'kariéra':2, 'pokoj':5, 'spiritualita':5, 'osobný rast':4, 'sloboda':3, 'dobrodružstvo':2 },
    personality: { openness:4, conscientiousness:3.5, extraversion:2.5, agreeableness:4.5, stability:4.5 }
  },
  {
    id: 'u_lucia', name: 'Lucia', age: 29, location: 'Nitra',
    bio: 'Rodina, viera a láskavosť. Verím na vzťahy, ktoré rastú.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'nizsia', silhouette: 'plna', hair: 'svetle', style: 'upraveny' },
    rt: { os1: 0.7, os2: 0.4 },
    valueVector: { 'rodina':5, 'kariéra':2, 'pokoj':4, 'spiritualita':4, 'osobný rast':3, 'sloboda':2, 'dobrodružstvo':3 },
    personality: { openness:3, conscientiousness:4, extraversion:3.5, agreeableness:5, stability:4 }
  },
  {
    id: 'u_marek', name: 'Marek', age: 34, location: 'Trnava',
    bio: 'Práca ma baví, rád si užívam slobodu. Zatiaľ bez veľkých plánov.',
    intent: 'company',
    smokes: true,
    appearance: { heightBand: 'vyssia', silhouette: 'atleticka', hair: 'tmave', style: 'sportovy' },
    rt: { os1: -0.6, os2: -0.2 },
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


/* ==============================================================
   VZŤAHOVÝ KOMPAS (RT test – Riemann-Thomannov model)
   --------------------------------------------------------------
   Dve osi: Blízkosť ⟷ Odstup a Kontinuita ⟷ Zmena.
   16 ORIGINÁLNYCH tvrdení napísaných pre Synced (nič prevzaté
   z externých/chránených testov). Škála súhlasu 1–5.
   Soft signál + sebapoznanie: ŽIADNE percento kompatibility,
   ŽIADNA brána — nemení matching číslo ani skóre.
   Poradie tvrdení je premiešané (nie zoskupené po póloch).
   ============================================================== */

const RT_TEST = {
  intro: '16 krátkych tvrdení, škála 1–5. Nie je to o správne/zle — ukazuje to, ' +
    'kde ti je vo vzťahoch prirodzene dobre.',

  scaleEnds: ['Vôbec mi nesedí', 'Úplne mi sedí'],

  /* pole: blizkost | odstup | kontinuita | zmena */
  items: [
    { id: 'rt1',  pole: 'blizkost',   text: 'Cítim sa najlepšie, keď mám k blízkym ľuďom naozaj blízko.' },
    { id: 'rt2',  pole: 'kontinuita', text: 'Mám rád(a), keď má môj deň jasný poriadok a plán.' },
    { id: 'rt3',  pole: 'odstup',     text: 'Potrebujem svoj vlastný priestor, aj keď mám niekoho veľmi rád(a).' },
    { id: 'rt4',  pole: 'zmena',      text: 'Rutina ma rýchlo omrzí — potrebujem do života novosť.' },
    { id: 'rt5',  pole: 'blizkost',   text: 'Harmónia vo vzťahu je pre mňa dôležitejšia než mať vždy pravdu.' },
    { id: 'rt6',  pole: 'odstup',     text: 'Radšej si veci vyriešim sám(a), než by som hneď hľadal(a) pomoc.' },
    { id: 'rt7',  pole: 'kontinuita', text: 'Na istotu a stálosť sa vo vzťahu spolieham viac než na prekvapenia.' },
    { id: 'rt8',  pole: 'zmena',      text: 'Spontánne rozhodnutia ma nabíjajú viac než dôkladné plány.' },
    { id: 'rt9',  pole: 'blizkost',   text: 'O svoje pocity sa rád(a) podelím hneď, ako ich mám.' },
    { id: 'rt10', pole: 'zmena',      text: 'Rád(a) skúšam nové veci, aj keď neviem, ako dopadnú.' },
    { id: 'rt11', pole: 'odstup',     text: 'Priveľa blízkosti ma po čase začne dusiť.' },
    { id: 'rt12', pole: 'kontinuita', text: 'Keď niečo sľúbim, držím sa toho — spoľahlivosť je pre mňa základ.' },
    { id: 'rt13', pole: 'zmena',      text: 'Priveľa pravidiel a stereotypu ma zväzuje.' },
    { id: 'rt14', pole: 'blizkost',   text: 'Samota mi po čase začne chýbať — potrebujem blízkosť druhých.' },
    { id: 'rt15', pole: 'kontinuita', text: 'Náhle zmeny ma znervózňujú; radšej mám veci predvídateľné.' },
    { id: 'rt16', pole: 'odstup',     text: 'Svoje súkromie si strážim aj v tom najbližšom vzťahu.' }
  ],

  axes: {
    os1: { plusLabel: 'Blízkosť',   minusLabel: 'Odstup' },
    os2: { plusLabel: 'Kontinuita', minusLabel: 'Zmena' }
  },

  /* Láskavé nehodnotiace popisy domovských kútov */
  corners: {
    'Blízkosť+Kontinuita': 'Vzťahy sú pre teba domov: teplo, istota a niekto, na koho sa dá spoľahnúť.',
    'Blízkosť+Zmena':      'Vzťah je pre teba spoločné dobrodružstvo: blízkosť ťa hreje a novosť vás drží živých.',
    'Odstup+Kontinuita':   'Pokojná stálosť s vlastným vzduchom: si spoľahlivá kotva, ktorá potrebuje aj svoj priestor.',
    'Odstup+Zmena':        'Voľnosť a objavovanie: najlepšie ti je, keď vzťah dýcha — dvaja slobodní ľudia na spoločnej ceste.'
  },

  /* Popisy jednotlivých pólov (keď je druhá os vyvážená) */
  poles: {
    'Blízkosť':   'Ťahá ťa to k ľuďom: blízkosť a zdieľanie ťa dobíjajú.',
    'Odstup':     'Potrebuješ vlastný priestor: blízkosť áno, ale s miestom na nádych.',
    'Kontinuita': 'Istota a stálosť sú tvoja kotva: na teba sa dá spoľahnúť.',
    'Zmena':      'Novosť ťa nabíja: život má byť v pohybe.'
  },
  poleBalancedNote: 'Na druhej osi si vyvážene v strede.',

  balanced: 'Si blízko stredu oboch osí: vieš dať blízkosť aj priestor, istotu ' +
    'aj zmenu — podľa toho, čo vzťah práve potrebuje.',

  note: 'Žiadny kút nie je lepší či horší — je to len mapa toho, kde ti je ' +
    'prirodzene dobre. 💛'
};

window.RT_TEST = RT_TEST;


/* ==============================================================
   ASERTIVITA – „pevný a láskavý zároveň" (tréning komunikácie)
   --------------------------------------------------------------
   SOFT/self-insight: ŽIADEN vplyv na matching ani brány.
   Cieľ je udržať vlastnú hranicu, NIE zlomiť cudzie „nie" –
   nič tu neučí manipulovať ani pretlačiť druhého.
   Texty láskavé a nehodnotiace (docs/vyzor-a-pravidla.md).
   ============================================================== */

const ASSERT_TRAINING = {
  intro: 'Keď na teba niekto tlačí, máš tri cesty. Bojovať — presadíš sa, ale ' +
    'zraníš. Vzdať sa — ustúpiš, ale zradíš seba. A tretia cesta: asertivita — ' +
    'udržíš svoje a zároveň neublížiš. „Vyhrať bez boja" znamená, že nikto ' +
    'nemusí prehrať. A pozor: cieľom je udržať vlastnú hranicu — nikdy nie ' +
    'zlomiť cudzie nie.',

  styles: [
    { id: 'pasivny',           label: 'pasívny',
      desc: 'Ustúpim, aby bol pokoj — ostatní ma časom prevalcujú.' },
    { id: 'agresivny',         label: 'agresívny',
      desc: 'Presadím sa silou — druhí sa zľaknú a bránia.' },
    { id: 'pasivne_agresivny', label: 'pasívne-agresívny',
      desc: 'Naznačujem a štipľavo mlčím, ale nepoviem to priamo.' },
    { id: 'asertivny',         label: 'asertívny',
      desc: 'Poviem, čo potrebujem, pokojne a priamo — berú ma vážne.' }
  ],

  triangle: 'Dramatický trojuholník: obeť ⟷ záchranca ⟷ agresor. Keď spadnem ' +
    'do roly obete, priťahujem si tie druhé dve — niekto ma zachraňuje, niekto ' +
    'na mňa útočí, a točíme sa dokola. Vystúpiť sa dá jediným smerom: do ' +
    'dospelej, asertívnej polohy — poviem, čo cítim a čo potrebujem, bez útoku ' +
    'a bez sebazapretia.',

  scenes: [
    {
      id: 'natlak',
      text: 'Píše ti: „Ak ma máš naozaj rád(a), pošli mi odvážnu fotku."',
      answers: [
        { style: 'pasivny', text: '„Tak dobre, keď to pre teba znamená…"',
          feedback: 'Ustúpiš proti sebe. Druhý sa naučí, že tlak funguje.' },
        { style: 'agresivny', text: '„Si normálny? Okamžite prestaň otravovať!"',
          feedback: 'Ubránil si sa, ale útokom — hovor sa zasekne v konflikte.' },
        { style: 'pasivne_agresivny', text: '„No jasné, veď ja som asi jediná, kto to nerobí…"',
          feedback: 'Nepovieš priame nie, len pichneš — druhý nevie, na čom je.' },
        { style: 'asertivny', text: '„Nie. Fotky takto neposielam — a to, či ťa mám rád(a), s tým nesúvisí."',
          feedback: 'Jasné nie + oddelenie citu od nátlaku. Držíš hranicu bez útoku.',
          technika: 'právo povedať nie' }
      ]
    },
    {
      id: 'vycitanie',
      text: 'Znova na poslednú chvíľu zrušil(a) spoločný plán. Keď to spomenieš, povie: „Ty vždy len kritizuješ."',
      answers: [
        { style: 'pasivny', text: '„Prepáč, asi som precitlivený(á)…"',
          feedback: 'Vezmeš vinu, ktorá nie je tvoja.' },
        { style: 'agresivny', text: '„Ty si ten, kto stále všetko ruší, tak nekecaj!"',
          feedback: 'Pravda v tom je, ale forma spustí obranu, nie riešenie.' },
        { style: 'pasivne_agresivny', text: '„Ale nie, to nič, veď mne je to jedno."',
          feedback: 'Povieš „nič", hoci nie je — problém ostane a nazbiera sa.' },
        { style: 'asertivny', text: '„Nekritizujem teba. Hovorím, že ma mrzí, keď sa plán zruší na poslednú chvíľu — a potrebujem sa naň vedieť spoľahnúť."',
          feedback: 'Fakt + pocit + potreba, bez obviňovania. Ťažko sa to zhodí zo stola.',
          technika: 'ja-výrok' }
      ]
    },
    {
      id: 'pasivna_agresia',
      text: 'Napíše: „No nič. Veď to je jedno. Aj tak ti na tom asi nezáleží."',
      answers: [
        { style: 'pasivny', text: '„Prepáč, čo som spravil(a)? Povedz, napravím to!"',
          feedback: 'Skočíš do roly, ktorú ti nastavil — ospravedlňuješ sa naslepo.' },
        { style: 'agresivny', text: '„Tak keď je to jedno, tak čo riešiš?"',
          feedback: 'Odpáliš — eskalácia namiesto rozhovoru.' },
        { style: 'pasivne_agresivny', text: '„Aha, dobre teda. Fajn."',
          feedback: 'Vrátiš mu tú istú hru — obaja mlčíte a hneváte.' },
        { style: 'asertivny', text: '„Znie to, akoby ti to vadilo. Mne na tom záleží — povedz mi priamo, čo sa deje?"',
          feedback: 'Pomenuješ nevyslovené a pozveš na priamy rozhovor. Vyvedieš to z hry.',
          technika: 'pomenovanie + otázka' }
      ]
    },
    {
      id: 'hranica_doma',
      text: 'Dohodli ste sa, že prvé stretnutie bude na verejnosti. Deň pred rande napíše: „Príď radšej rovno ku mne, uvaríme si, bude to príjemnejšie."',
      answers: [
        { style: 'agresivny', text: '„Ty to skúšaš? Také typy poznám. Zabudni!"',
          feedback: 'Hranicu udržíš, ale súdom — druhý sa nedozvie, čo potrebuješ, len že je odsúdený.' },
        { style: 'asertivny', text: '„Prvé stretnutie chcem na verejnosti, tak sme sa dohodli. Rád/rada prídem do kaviarne."',
          feedback: 'Pokojne zopakuješ dohodu bez ospravedlňovania a bez útoku. Hranica stojí.',
          technika: 'pokazená platňa' },
        { style: 'pasivny', text: '„No… dobre, tak prídem."',
          feedback: 'Prekročíš vlastnú hranicu, aby si nepokazil(a) náladu — a ideš do situácie, v ktorej ti nie je dobre.' },
        { style: 'pasivne_agresivny', text: '„Hm, uvidíme, možno hej…" (a potom sa odmlčíš)',
          feedback: 'Nepovieš nie, len sa vyparíš — neistota na oboch stranách.' }
      ]
    },
    {
      id: 'odmietnutie',
      text: 'Po prvom rande ti napíše: „Bolo mi s tebou krásne! Kedy sa vidíme zas?" Ty ale pokračovať nechceš.',
      answers: [
        { style: 'pasivne_agresivny', text: '(Neodpíšeš a dúfaš, že to pochopí.)',
          feedback: 'Ticho je tiež odpoveď — ale taká, ktorá druhého necháva domýšľať si.' },
        { style: 'pasivny', text: '„Uvidíme, teraz mám veľa práce, možno niekedy…"',
          feedback: 'Odsunieš to, aby si neranil(a) — druhý ostane v nádeji a čakaní.' },
        { style: 'asertivny', text: '„Ďakujem za pekný večer. Necítim z mojej strany to, čo by tam malo byť, tak nechcem pokračovať — želám ti niekoho, kto to cítiť bude."',
          feedback: 'Priame, láskavé nie bez falošnej nádeje — rešpekt k druhému aj k sebe.',
          technika: 'ja-výrok + jasné nie' },
        { style: 'agresivny', text: '„Úprimne? Nezaujal(a) si ma. Nemá to zmysel."',
          feedback: 'Pravda bez láskavosti zraní viac, než musí.' }
      ]
    }
  ],

  results: {
    pasivny: {
      desc: 'Často ustúpiš, aby bol pokoj — a ostaneš s pocitom, že tvoje potreby sa nepočítajú. Druhí sa učia, že tvoje hranice sa dajú posunúť.',
      technika: 'Skús ja-výrok: fakt + pocit + potreba. Malá veta, veľká zmena.',
      rola: 'V dramatickom trojuholníku sa najčastejšie ocitáš v role obete — vystúpiš z nej vo chvíli, keď svoju potrebu povieš nahlas.'
    },
    agresivny: {
      desc: 'Ubrániš sa — ale silou, ktorá druhých zatlačí do obrany. Vyhráš boj a prehráš rozhovor.',
      technika: 'Skús pokazenú platňu: pokojne zopakuj svoju hranicu bez zvyšovania hlasu.',
      rola: 'V trojuholníku ľahko skĺzneš do roly agresora — vystúpiš z nej, keď hranicu povieš bez útoku.'
    },
    pasivne_agresivny: {
      desc: 'Nahnevanie naznačíš, ale nepovieš — druhý cíti napätie a nevie, na čom je. Problém sa točí dokola.',
      technika: 'Skús pomenovanie: povedz priamo, čo sa deje a čo potrebuješ.',
      rola: 'V trojuholníku krúžiš medzi obeťou a tichým agresorom — von vedie priama, dospelá veta.'
    },
    asertivny: {
      desc: 'Držíš svoje a zároveň neubližuješ — presne o tom je „vyhrať bez boja". Ľudia pri tebe vedia, na čom sú.',
      technika: 'Udrž si to: ja-výrok a právo povedať nie sú svaly — silnejú používaním.',
      rola: 'Z dramatického trojuholníka vystupuješ do dospelej polohy — drž sa toho.'
    }
  },

  note: 'Toto je momentka, nie nálepka. Štýl je zvyk — a zvyky sa dajú preučiť. 💛'
};

window.ASSERT_TRAINING = ASSERT_TRAINING;
