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
   gender: 'm' | 'z' – len pre zobrazenie archetypovej sady
     a zámen v opisnom riadku (nie matching, nie filter)
   ============================================================== */

const SAMPLE_USERS = [
  {
    id: 'u_anna', name: 'Anna', age: 28, location: 'Bratislava',
    bio: 'Pokojné večery, dobrá kniha a rodina nadovšetko.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'stredna', silhouette: 'drobna', hair: 'tmave', style: 'prirodzeny' },
    gender: 'z', rt: { os1: 0.6, os2: 0.5 },
    hobbies: ['čítanie', 'varenie', 'príroda/záhrada', 'zvieratá'],
    musicGenres: ['folk', 'klasika', 'indie'], musicArtists: 'Norah Jones, Sigur Rós',
    valueVector: { 'rodina':5, 'kariéra':3, 'pokoj':5, 'spiritualita':3, 'osobný rast':4, 'sloboda':2, 'dobrodružstvo':2 },
    personality: { openness:3.5, conscientiousness:4, extraversion:3, agreeableness:4.5, stability:4 }
  },
  {
    id: 'u_peter', name: 'Peter', age: 32, location: 'Košice',
    bio: 'Ambiciózny, stále sa učím niečo nové. Hľadám parťáčku do života.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'vyssia', silhouette: 'atleticka', hair: 'tmave', style: 'upraveny' },
    gender: 'm', rt: { os1: 0.1, os2: -0.4 },
    hobbies: ['cestovanie', 'behanie', 'jazyky', 'kaviarne'],
    musicGenres: ['indie', 'rock', 'filmová hudba'], musicArtists: 'The National, Hans Zimmer',
    valueVector: { 'rodina':3, 'kariéra':5, 'pokoj':2, 'spiritualita':2, 'osobný rast':5, 'sloboda':4, 'dobrodružstvo':4 },
    personality: { openness:4, conscientiousness:4.5, extraversion:4, agreeableness:3, stability:3.5 }
  },
  {
    id: 'u_nina', name: 'Nina', age: 26, location: 'Žilina',
    bio: 'Cestovateľka, milujem spontánnosť a slobodu. Uvidíme, kam to pôjde.',
    intent: 'open',
    smokes: true,
    appearance: { heightBand: 'stredna', silhouette: 'drobna', hair: 'svetle', style: 'sportovy' },
    gender: 'z', rt: { os1: -0.5, os2: -0.7 },
    hobbies: ['cestovanie', 'fotografovanie', 'tanec', 'koncerty', 'turistika'],
    musicGenres: ['elektronická', 'latino', 'techno/house'], musicArtists: 'Rüfüs Du Sol, Bad Bunny',
    valueVector: { 'rodina':2, 'kariéra':3, 'pokoj':2, 'spiritualita':3, 'osobný rast':4, 'sloboda':5, 'dobrodružstvo':5 },
    personality: { openness:5, conscientiousness:2.5, extraversion:4.5, agreeableness:3.5, stability:3 }
  },
  {
    id: 'u_tomas', name: 'Tomáš', age: 30, location: 'Bratislava',
    bio: 'Hlbšie rozhovory, príroda a pokoj. Vážim si autentickosť.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'vyssia', silhouette: 'silna', hair: 'tmave', style: 'prirodzeny' },
    gender: 'm', rt: { os1: 0.3, os2: 0.6 },
    hobbies: ['šport/fitness', 'cestovanie', 'technológie', 'jazyky'],
    musicGenres: ['rock', 'elektronická', 'indie'], musicArtists: 'Foals, Bonobo',
    valueVector: { 'rodina':4, 'kariéra':2, 'pokoj':5, 'spiritualita':5, 'osobný rast':4, 'sloboda':3, 'dobrodružstvo':2 },
    personality: { openness:4, conscientiousness:3.5, extraversion:2.5, agreeableness:4.5, stability:4.5 }
  },
  {
    id: 'u_lucia', name: 'Lucia', age: 29, location: 'Nitra',
    bio: 'Rodina, viera a láskavosť. Verím na vzťahy, ktoré rastú.',
    intent: 'serious',
    smokes: false,
    appearance: { heightBand: 'nizsia', silhouette: 'plna', hair: 'svetle', style: 'upraveny' },
    gender: 'z', rt: { os1: 0.7, os2: 0.4 },
    hobbies: ['varenie', 'čítanie', 'dobrovoľníctvo', 'zvieratá', 'joga'],
    musicGenres: ['klasika', 'folk', 'R&B/soul'], musicArtists: 'Adele, Ludovico Einaudi',
    valueVector: { 'rodina':5, 'kariéra':2, 'pokoj':4, 'spiritualita':4, 'osobný rast':3, 'sloboda':2, 'dobrodružstvo':3 },
    personality: { openness:3, conscientiousness:4, extraversion:3.5, agreeableness:5, stability:4 }
  },
  {
    id: 'u_marek', name: 'Marek', age: 34, location: 'Trnava',
    bio: 'Práca ma baví, rád si užívam slobodu. Zatiaľ bez veľkých plánov.',
    intent: 'company',
    smokes: true,
    appearance: { heightBand: 'vyssia', silhouette: 'atleticka', hair: 'tmave', style: 'sportovy' },
    gender: 'm', rt: { os1: -0.6, os2: -0.2 },
    hobbies: ['šport/fitness', 'bicykel', 'koncerty', 'technológie'],
    musicGenres: ['techno/house', 'hip-hop/rap', 'rock'], musicArtists: 'Fred again.., Kendrick Lamar',
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

  note: 'Toto je momentka, nie nálepka. Štýl je zvyk — a zvyky sa dajú preučiť. 💛',

  /* --- Mikro-lekcia: čo sa deje v tele (amygdala) --- */
  amygdala: {
    title: 'Čo sa deje v tele: amygdala',
    cards: [
      'Keď sa cítiš napadnutý(á) — slovom, výčitkou, tlakom — časť mozgu zvaná ' +
        'amygdala spustí poplach skôr, než stihneš rozmyslieť. Je to strážca, ' +
        'čo nerozlišuje medzi levom a nepríjemnou správou.',
      'Telo prepne do jedného z troch režimov: BOJ (útočím, zvýšim hlas), ÚTEK ' +
        '(uhýbam, mením tému) alebo ZAMRZNUTIE (onemiem, súhlasím, len aby bol ' +
        'pokoj). Preto niekedy zareaguješ inak, než by si chcel(a) — nie je to ' +
        'slabosť, je to biológia.',
      'Čo s tým: 1) Pomenuj to („teraz cítim, že mi tuhne telo"). 2) Jeden ' +
        'pomalý nádych a výdych — dá to mozgu 6 sekúnd, aby sa zapla rozumná ' +
        'časť. 3) Až potom odpovedz. Pauza nie je slabosť — je to tvoja moc.'
    ],
    triangleNote: 'V poplachu ľahko spadneš do roly obete alebo agresora. ' +
      'Nádych ťa vráti do dospelej, asertívnej polohy.'
  },

  /* --- Mikro-lekcia + cvičenie: láskavosť vs. oprávnený nárok --- */
  kindness: {
    title: 'Láskavosť vs. oprávnený nárok',
    intro: 'Byť láskavý neznamená vždy povedať áno. Láskavosť je dar, ktorý ' +
      'dávaš slobodne. Oprávnený nárok je niečo, na čo máš právo — povedať nie, ' +
      'mať súkromie, zmeniť názor, byť rešpektovaný(á). Problém nastáva, keď si ' +
      'zamieňaš „som milý" s „nemám právo odmietnuť".',
    /* answer: 'laskavost' | 'narok' | 'oboje' */
    items: [
      { text: 'Kamarát ma poprosí o pomoc so sťahovaním.',
        answer: 'laskavost',
        feedback: 'Dar, ktorý dávaš slobodne — a slobodne ho smieš aj nedať, keď nevládzeš.' },
      { text: 'Chcem, aby partner rešpektoval, keď poviem nie.',
        answer: 'narok',
        feedback: 'Na rešpektovanie svojho „nie" máš právo — to sa nevyslúži, to sa má.' },
      { text: 'Niekto chce vedieť môj plat hneď na prvom rande.',
        answer: 'narok',
        feedback: 'Súkromie je tvoj oprávnený nárok — nemusíš ho darovať nikomu.' },
      { text: 'Susedka chce, aby som jej strážila deti každý deň zadarmo.',
        answer: 'laskavost',
        feedback: 'Pomoc je láskavosť, nie povinnosť — máš plné právo odmietnuť alebo dať hranicu.' },
      { text: 'Zmenil(a) som názor a už nechcem ísť na to stretnutie.',
        answer: 'narok',
        feedback: 'Zmeniť názor je tvoje právo — aj bez dlhých ospravedlnení.' },
      { text: 'Kolega chce, aby som za neho urobil(a) jeho prácu.',
        answer: 'oboje',
        feedback: 'Môžeš pomôcť ako dar — a rovnako máš právo povedať nie. Rozhoduje tvoja sloboda, nie jeho tlak.' }
    ],
    outro: 'Keď vieš, čo je dar a čo právo, prestaneš sa cítiť vinný(á) za to, ' +
      'že sa staráš aj o seba.'
  },

  /* --- 10 asertívnych práv (vlastné formulácie) ---
     Rámec recipročnosti je zámerne NAD zoznamom: bez neho sa
     z práv stáva zbraň. Ku každému právu ide veta, ktorá
     pripomenie, že to isté právo má aj druhý. */
  rights: {
    title: '10 asertívnych práv',
    frame: 'Moje práva sú aj tvoje práva. Každé právo, ktoré si nárokujem pre ' +
      'seba, má rovnako aj druhý. Asertivita nie je zbraň — je to rešpekt ' +
      'k obom stranám.',
    items: [
      { right: 'Mám právo povedať nie bez pocitu viny.',
        why: 'Nie je odmietnutie človeka, len jeho žiadosti.',
        mutual: 'A rovnako smie povedať nie mne — bez toho, aby som ho presviedčal(a) ďalej.' },
      { right: 'Mám právo zmeniť názor.',
        why: 'Nový pohľad nie je zrada starého; je to známka, že rastieš.',
        mutual: 'A druhý ho smie zmeniť tiež — nebudem mu to vyčítať ako nespoľahlivosť.' },
      { right: 'Mám právo urobiť chybu a niesť za ňu zodpovednosť.',
        why: 'Chyba je cena za to, že vôbec konáš. Dôležité je, čo s ňou urobíš.',
        mutual: 'A druhý má právo pomýliť sa bez toho, aby som mu to pripomínal(a) navždy.' },
      { right: 'Mám právo povedať „nerozumiem" alebo „neviem".',
        why: 'Predstierať istotu je drahšie než sa spýtať.',
        mutual: 'A druhý smie nevedieť — nebudem z toho robiť dôkaz o jeho hodnote.' },
      { right: 'Mám právo požiadať o to, čo chcem.',
        why: 'Nevyslovená potreba sa nesplní. Prosba nie je nátlak.',
        mutual: 'A druhý má plné právo odmietnuť — inak by to nebola prosba, ale tlak.' },
      { right: 'Mám právo na svoje pocity a na to vyjadriť ich.',
        why: 'Pocit nie je na diskusiu. To, čo s ním urobíš, už áno.',
        mutual: 'A druhý má právo cítiť niečo iné než ja — aj vtedy, keď mi to nesedí.' },
      { right: 'Mám právo rozhodovať o svojich veciach.',
        why: 'Tvoj čas, telo a hranice patria tebe.',
        mutual: 'A do vecí druhého mi nič nie je, kým sa ma priamo netýkajú.' },
      { right: 'Mám právo byť vypočutý a braný vážne.',
        why: 'Aj keď so mnou druhý nesúhlasí, moja vec má zaznieť celá.',
        mutual: 'A ja dlžím to isté jemu — vypočuť ho bez skákania do reči.' },
      { right: 'Mám právo nebyť závislý od súhlasu druhých.',
        why: 'Byť obľúbený je pekné. Byť sebou je nutné.',
        mutual: 'A druhý nemusí robiť veci preto, aby sa zapáčil mne.' },
      { right: 'Mám právo povedať „potrebujem si to premyslieť".',
        why: 'Čas na rozmyslenie je súčasť slobodného rozhodnutia, nie vyhýbanie.',
        mutual: 'A keď si čas pýta druhý, dám mu ho — nebudem tlačiť na odpoveď hneď.' }
    ],
    note: 'Keď si niektoré právo nárokuješ len pre seba, prestáva to byť ' +
      'asertivita a začína to byť presadzovanie sa cez druhého. 💛'
  },

  /* --- Knižnica asertívnych techník (referenčný prehľad) ---
     sceneId → „Precvičiť" otvorí cvičnú scénu s touto technikou;
     extra → „Precvičiť" ukáže ďalší príklad vety */
  techniques: {
    title: 'Knižnica asertívnych techník',
    items: [
      { id: 'ja_vyrok', name: 'Ja-výrok',
        when: 'Namiesto „ty vždy…" povedz „cítim… keď… potrebujem…".',
        example: '„Mrzí ma, keď sa plán zruší na poslednú chvíľu — potrebujem sa naň vedieť spoľahnúť."',
        sceneId: 'vycitanie' },
      { id: 'platna', name: 'Pokazená platňa',
        when: 'Pokojne zopakuj svoje „nie", aj keď tlačí ďalej.',
        example: '„Rozumiem ti, a predsa nie. … Chápem, a predsa nie."',
        sceneId: 'hranica_doma' },
      { id: 'pravo_nie', name: 'Právo povedať nie',
        when: 'Nie je veta, za ktorou musí nasledovať výhovorka.',
        example: '„Nie, to mi nevyhovuje." je celá odpoveď.',
        sceneId: 'natlak' },
      { id: 'hranica', name: 'Pomenovanie hranice',
        when: 'Povedz nahlas, kde je čiara.',
        example: '„Toto už je pre mňa za hranicou, prosím prestaň."',
        extra: '„Rozprávať sa môžeme, ale týmto tónom nie. Skúsme znova pokojne."' },
      { id: 'hra', name: 'Pomenovanie hry',
        when: 'Keď cítiš pasívnu agresiu, pomenuj ju láskavo.',
        example: '„Znie to, akoby ti niečo vadilo — povedz mi to priamo?"',
        sceneId: 'pasivna_agresia' },
      { id: 'pauza', name: 'Zaseknutá otázka / pauza',
        when: 'Získaj čas.',
        example: '„Potrebujem si to premyslieť, ozvem sa."',
        extra: '„Dobrá otázka — nechám si ju prejsť hlavou a odpoviem ti večer."' }
    ]
  }
};

window.ASSERT_TRAINING = ASSERT_TRAINING;


/* ==============================================================
   ARCHETYPY – stredoveký svet nad Vzťahovým kompasom (RT test)
   --------------------------------------------------------------
   Honosnejšie oblečenie RT kúta, nie jeho náhrada. Sebapoznanie
   a jemný opisný signál – NIKDY percento, NIKDY brána.
   Kvadranty: B/O (os1 Blízkosť/Odstup) × S/Z (os2 Stálosť/Zmena);
   pri presnej nule sa uprednostní Blízkosť resp. Stálosť.
   Sady: m (mužská) | z (ženská) | neutral (aj pre „nechcem uvádzať").
   ============================================================== */

/* img: obrázok archetypu (assets/archetypes/, 512×512).
   Neutrálne varianty NEMAJÚ obrázok (img: null) – kým si používateľ
   nevyberie ♂/♀, zobrazuje sa neutrálny názov + neutrálny SVG erb
   (oprava bugu „žene vychádza mužský archetyp") */
const ARCHETYPES = {
  corners: {
    BS: {
      icon: 'mec',
      growthEdge: 'Harmónia je tvoj dar — no niekedy pre pokoj prehltneš, čo ťa trápi, a nazbiera sa to. Keď sa naučíš povedať svoje láskavo a včas, skôr než pretečie, tvoje vzťahy budú ešte pevnejšie. Presne na to je tréning asertivity — je pre teba ako stvorený. 🌱',
      m:       { name: 'Rytier',     img: 'assets/archetypes/rytier.png',     desc: 'Verné srdce ríše. Držíš slovo aj tých, na ktorých ti záleží — pri tebe má človek pocit domova a istoty.',
        story: 'Keď dáš slovo, platí. Pri zmenách dôsledne zvažuješ dôsledky každého rozhodnutia — nevrháš sa do nich bezhlavo. Ľudia vedia, že sa o teba môžu oprieť, keď sa všetko rúca. Tvoja stálosť nie je nuda; je to hrad, do ktorého sa dá vojsť, keď je vonku búrka.' },
      z:       { name: 'Kráľovná',   img: 'assets/archetypes/kralovna.png',   desc: 'Verné srdce ríše. Držíš slovo aj svojich ľudí — pri tebe má človek pocit domova a istoty.',
        story: 'Nosíš v sebe teplo, ktoré drží ľudí pokope. Možno si povieš, že priveľa dávaš alebo sa ťažko lúčiš so starým — ale práve tvoja vernosť je to, na čom vzťahy stoja. Kde si ty, tam je domov. A domov je to najvzácnejšie, čo vieš dať.' },
      neutral: { name: 'Ochranca',   img: null,                               desc: 'Verné srdce ríše. Držíš slovo aj tých, na ktorých ti záleží — pri tebe má človek pocit domova a istoty.',
        story: 'Keď dáš slovo, platí. Pri zmenách dôsledne zvažuješ dôsledky každého rozhodnutia — nevrháš sa do nich bezhlavo. Ľudia vedia, že sa o teba môžu oprieť, keď sa všetko rúca. Tvoja stálosť nie je nuda; je to hrad, do ktorého sa dá vojsť, keď je vonku búrka.' }
    },
    BZ: {
      icon: 'lutna',
      growthEdge: 'Cítiš veci naplno — a preto ťa kritika vie zasiahnuť viac, než dáš najavo. Keď si spomenieš, že tvoja hodnota nestojí na cudzom súde, tvoja iskra bude ešte slobodnejšia. A z mnohých nápadov si vyber ten jeden a dotiahni ho — svetu ho treba celý. 🌱',
      m:       { name: 'Trubadúr',   img: 'assets/archetypes/trubadur.png',   desc: 'Duša, čo spája a zapaľuje. Prinášaš ľuďom nové obzory a robíš všedné dni krajšími.',
        story: 'Vieš rozospievať aj obyčajný deň a spojiť ľudí, čo by sa inak minuli. Si ako slnko — všade; dokážeš byť na rôznych miestach v rovnakom čase. A pri takom množstve nápadov nie je ľahké všetko stihnúť — a keď to stihneš, tak iba ty. A ak aj nie, tvoj šarm odzbrojí každého a tvoja iskra rozhýbe to, čo zamrzlo. Si ten, kto pripomenie, že život má znieť.' },
      z:       { name: 'Múza',       img: 'assets/archetypes/muza.png',       desc: 'Duša, čo spája a zapaľuje. Prinášaš ľuďom nové obzory a robíš všedné dni krajšími.',
        story: 'Vidíš krásu tam, kde ju iní prehliadnu, a vieš ňou nakaziť. Dokážeš sa slobodne hýbať aj v oblakoch — a možno ani netušíš, že z tých oblakov nosíš to, čo ostatných posunie. Tvoja čarovná premenlivosť je prameň, z ktorého vzniká nové.' },
      neutral: { name: 'Trubadúr',   img: null,                               desc: 'Duša, čo spája a zapaľuje. Prinášaš ľuďom nové obzory a robíš všedné dni krajšími.',
        story: 'Vieš rozospievať aj obyčajný deň a spojiť ľudí, čo by sa inak minuli. Si ako slnko — všade; dokážeš byť na rôznych miestach v rovnakom čase. A pri takom množstve nápadov nie je ľahké všetko stihnúť — a keď to stihneš, tak iba ty. A ak aj nie, tvoj šarm odzbrojí každého a tvoja iskra rozhýbe to, čo zamrzlo. Si ten, kto pripomenie, že život má znieť.' }
    },
    OS: {
      icon: 'hviezda',
      growthEdge: 'Tvoja rozvaha je poklad — a niekedy druhí nevidia, čo sa v tichu deje, a zdáš sa im vzdialenejší. Keď z času na čas nahlas povieš, čo si všímaš, dáš ľuďom kúsok toho svetla, čo v sebe nosíš. 🌱',
      m:       { name: 'Alchymista', img: 'assets/archetypes/alchymista.png', desc: 'Majster tichého umenia. Ideš vlastnou hĺbkou, poctivo a sústredene — a to, čo vytvoríš, má váhu.',
        story: 'Ty vieš, čo šaman: že na dobrý elixír treba správnu chvíľu. Bylinka je v máji ešte jed, v auguste už liek — a ty počkáš. Nenecháš sa zmiasť emóciami; ty vieš, kedy je ten správny čas. Svojou precíznosťou vytvoríš hodnotu postavenú na kvalite — a to je majstrovstvo.' },
      z:       { name: 'Hvezdárka',  img: 'assets/archetypes/hvezdarka.png',  desc: 'Majsterka tichého umenia. Ideš vlastnou hĺbkou, poctivo a sústredene — a to, čo vytvoríš, má váhu.',
        story: 'V tichu čítaš to, čo iní v zhone prehliadnu. Vieš hľadať múdro v hĺbke duše, a tak vidíš vzory, čo unikajú rýchlym očiam. Nepotrebuješ byť stredom pozornosti; tvoja hĺbka svieti aj potme. Svet, čo sa ženie, potrebuje niekoho, kto sa zastaví a pozrie hore.' },
      neutral: { name: 'Alchymista', img: null,                               desc: 'Tiché umenie hĺbky. Ideš vlastnou cestou, poctivo a sústredene — a to, čo vytvoríš, má váhu.',
        story: 'Ty vieš, čo šaman: že na dobrý elixír treba správnu chvíľu. Bylinka je v máji ešte jed, v auguste už liek — a ty počkáš. Nenecháš sa zmiasť emóciami; ty vieš, kedy je ten správny čas. Svojou precíznosťou vytvoríš hodnotu postavenú na kvalite — a to je majstrovstvo.' }
    },
    OZ: {
      icon: 'luk',
      growthEdge: 'Tvoja istota ťa ženie dopredu — a niekedy tak rýchlo, že tichší ľudia okolo teba nestihnú povedať svoje. Keď občas pribrzdíš a vypočuješ aj toho, kto nekričí, tvoje vedenie získa ešte väčšiu silu — lebo za tebou pôjdu radi. 🌱',
      m:       { name: 'Templár',    img: 'assets/archetypes/templar.png',    desc: 'Nebojácny hľadač vlastnej cesty. Nezastavíš sa pri hraniciach mapy — sloboda a odvaha sú tvoj kompas.',
        story: 'Nezastavíš sa pri hranici mapy — tam, kde iní cúvnu, ty ideš ďalej. Keď to situácia vyžaduje, vieš, že práve risk ti pomohol objaviť cesty, o ktorých ostatní ani nesnívali. Tvoja túžba po slobode je odvaha ísť prvý.' },
      z:       { name: 'Amazonka',   img: 'assets/archetypes/amazonka.png',   desc: 'Nebojácna hľadačka vlastnej cesty. Nezastavíš sa pri hraniciach mapy — sloboda a odvaha sú tvoj kompas.',
        story: 'Slobodu nosíš v sebe a nedáš si ju vziať. Nezdržiavaš sa zbytočne na jednom mieste — a aj vďaka tomu sa nedáš zlomiť a ideš, kam ťa srdce volá. Tvoja nezávislosť je sila, čo inšpiruje aj tých, čo sa báli pohnúť.' },
      neutral: { name: 'Pútnik',     img: null,                               desc: 'Srdce na ceste. Nezastavíš sa pri hraniciach mapy — sloboda a odvaha sú tvoj kompas.',
        story: 'Nezastavíš sa pri hranici mapy — tam, kde iní cúvnu, ty ideš ďalej. Keď to situácia vyžaduje, vieš, že práve risk ti pomohol objaviť cesty, o ktorých ostatní ani nesnívali. Tvoja túžba po slobode je odvaha ísť prvý.' }
    }
  },

  /* Záverečná veta o dopĺňaní – zobrazuje sa pod rastovou hranou */
  complementNote: 'Žiadny typ nie je lepší ani horší — každý je kúsok celku. ' +
    'Preto sa oplatí pochopiť aj tú druhú stranu: lovec potrebuje šamana ' +
    'a šaman lovca. 💛'
};

window.ARCHETYPES = ARCHETYPES;


/* ==============================================================
   OCHUTNÁVKA (mini-tok v hero: 3 kliky → náznak „sveta")
   --------------------------------------------------------------
   Iba ochutnávka: NEUKLADÁ sa ako RT výsledok a nepredvyplňuje
   archetyp. Žiadne percentá, žiadne pohlavie – „svet" sa pomenúva
   dvojicou archetypov neutrálne.
   ============================================================== */

const TASTER = {
  questions: [
    { id: 't1', text: 'Po náročnom dni ťa dobije…',
      options: [
        { label: 'Byť s blízkymi', axis: 'a', value: 'blizkost' },
        { label: 'Chvíľa pre seba', axis: 'a', value: 'odstup' }
      ] },
    { id: 't2', text: 'Viac ťa láka…',
      options: [
        { label: 'Istota a pokoj', axis: 'b', value: 'kontinuita' },
        { label: 'Nové a nečakané', axis: 'b', value: 'zmena' }
      ] },
    { id: 't3', text: 'Čo ťa vo vzťahu drží?',
      options: [
        { label: 'Oprieť sa o seba navzájom', axis: 'c', value: 'opora' },
        { label: 'Spolu rásť', axis: 'c', value: 'rast' }
      ] }
  ],

  /* Svet podľa Q1+Q2 (Q3 je len dochuť do vety) */
  worlds: {
    'blizkost+kontinuita': {
      name: 'svet Rytiera a Kráľovnej',
      line: 'Domov, teplo a istota — miesto, kde sa dá na niekoho spoľahnúť.',
      imgs: ['assets/archetypes/rytier.png', 'assets/archetypes/kralovna.png'],
      alts: ['Archetyp Rytier', 'Archetyp Kráľovná']
    },
    'blizkost+zmena': {
      name: 'svet Trubadúra a Múzy',
      line: 'Spájanie a inšpirácia — všedné dni sa pri tebe menia na zážitok.',
      imgs: ['assets/archetypes/trubadur.png', 'assets/archetypes/muza.png'],
      alts: ['Archetyp Trubadúr', 'Archetyp Múza']
    },
    'odstup+kontinuita': {
      name: 'svet Alchymistu a Hvezdárky',
      line: 'Tichá hĺbka — poctivá práca v pokoji, ktorá má váhu.',
      imgs: ['assets/archetypes/alchymista.png', 'assets/archetypes/hvezdarka.png'],
      alts: ['Archetyp Alchymista', 'Archetyp Hvezdárka']
    },
    'odstup+zmena': {
      name: 'svet Templára a Amazonky',
      line: 'Sloboda a hľadanie — cesta, ktorá sa nekončí pri hraniciach mapy.',
      imgs: ['assets/archetypes/templar.png', 'assets/archetypes/amazonka.png'],
      alts: ['Archetyp Templár', 'Archetyp Amazonka']
    }
  },

  /* Dochuť podľa Q3 */
  flavor: {
    opora: 'A držíš sa toho, o čo sa dá oprieť.',
    rast:  'A ťahá ťa to tam, kde sa rastie spolu.'
  },

  cta: 'Sprav si celý test (5 min) — odhalíš svoj skutočný archetyp, ' +
    'vzťahový kompas aj meno svojej podstaty.',

  note: 'Toto bola len ochutnávka — tri kliky nikoho nevystihnú. 💛'
};

window.TASTER = TASTER;


/* ==============================================================
   ZÁĽUBY A HUDBA – spoločné body do rozhovoru
   --------------------------------------------------------------
   SOFT signál: nikdy brána, nikdy percento, nemení poradie matchov
   ani calculateCompatibility. Slúži len na to, aby bolo o čom
   začať rozprávať.
   TODO: hudbu neskôr napojiť na Spotify (žánre + interpreti),
   spoločné body počítať na serveri (Supabase) medzi reálnymi účtami.
   ============================================================== */

const HOBBY_TAGS = [
  'turistika', 'čítanie', 'varenie', 'cestovanie', 'šport/fitness', 'tanec',
  'joga', 'hry (deskové/PC)', 'umenie/kreslenie', 'fotografovanie',
  'hudba (hranie)', 'príroda/záhrada', 'zvieratá', 'filmy/seriály',
  'dobrovoľníctvo', 'meditácia', 'jazyky', 'technológie', 'behanie',
  'bicykel', 'plávanie', 'písanie', 'kaviarne', 'koncerty'
];

const MUSIC_GENRES = [
  'pop', 'rock', 'klasika', 'jazz', 'hip-hop/rap', 'elektronická', 'folk',
  'metal', 'R&B/soul', 'country', 'latino', 'filmová hudba', 'indie',
  'punk', 'techno/house', 'ľudová', 'blues', 'reggae'
];

window.HOBBY_TAGS = HOBBY_TAGS;
window.MUSIC_GENRES = MUSIC_GENRES;


/* ==============================================================
   SPÄTNÁ VÄZBA – ako ju dávať a prijímať
   --------------------------------------------------------------
   Vzdelávací modul (SOFT/self-insight): žiadny vplyv na matching,
   brány ani skóre. Model Joharyho okna je verejne známy koncept,
   všetky formulácie tu sú vlastné. Diskusné a komunitné časti sú
   mimo rozsahu (prídu so Supabase).
   ============================================================== */

const FEEDBACK_TRAINING = {
  intro: 'Spätná väzba je jedna z mála vecí, ktorá ti ukáže to, čo o sebe ' +
    'sám(a) nevidíš — a jedna z mála, ktorú vieš druhému dať ako dar. ' +
    'Nejde o hodnotenie človeka. Ide o to, aby sme si rozumeli.',

  /* --- 1) Joharyho okno --- */
  johari: {
    title: 'Prečo spätná väzba — Joharyho okno',
    quadrants: [
      { id: 'arena',  name: 'Otvorená (aréna)', short: 'viem ja + vedia druhí' },
      { id: 'blind',  name: 'Slepé miesto',     short: 'vidia druhí, ja nie' },
      { id: 'facade', name: 'Skrytá (fasáda)',  short: 'viem ja, skrývam' },
      { id: 'unknown',name: 'Neznáma',          short: 'zatiaľ nevie nikto' }
    ],
    cards: [
      'Predstav si seba ako okno so štyrmi tabuľkami. V <strong>otvorenej</strong> ' +
        'je to, čo o sebe vieš ty aj ľudia okolo. V <strong>slepom mieste</strong> ' +
        'to, čo vidia oni, ale ty nie — tvoj tón hlasu pri únave, spôsob, akým ' +
        'skáčeš do reči, alebo to, ako veľmi vieš upokojiť miestnosť.',
      'V <strong>skrytej</strong> je to, čo o sebe vieš, ale zatiaľ si nechávaš ' +
        'pre seba. A v <strong>neznámej</strong> to, čo zatiaľ nevie nikto — ' +
        'odhalí to až čas, nová situácia alebo človek, s ktorým sa ukáže niečo, ' +
        'o čom si nemal(a) tušenia.',
      'A tu je celá pointa: <strong>spätná väzba zmenšuje slepé miesto</strong> ' +
        'a <strong>úprimné zdieľanie zmenšuje fasádu</strong>. Obe zväčšujú ' +
        'otvorenú oblasť — a práve v nej sa dejú blízke vzťahy. Čím väčšia ' +
        'aréna, tým menej domýšľania na oboch stranách. 💛'
    ]
  },

  /* --- 2) Osobný uhol pohľadu --- */
  perspective: {
    title: 'Osobný uhol pohľadu',
    cards: [
      'Predtým, než niekomu niečo povieš, skús jednu otázku: ' +
        '<strong>„Ako by som sa to chcel(a) dozvedieť o sebe ja?"</strong> ' +
        'Nie či to je pravda — to už väčšinou vieš. Ale akými slovami, kedy ' +
        'a pred kým by ti to bolo znesiteľné počuť.',
      'Platí to najmä pri citlivom — pri tom, čím by si sa sám(a) nechválil(a). ' +
        'Čím nepríjemnejšia téma, tým viac záleží na forme. Empatia nie je ' +
        'zmäkčovanie pravdy; je to filter, cez ktorý pravda prejde tak, aby ju ' +
        'druhý uniesol a mohol s ňou niečo robiť.'
    ]
  },

  /* --- 3) Pravidlá podávania a prijímania --- */
  rules: {
    title: 'Pravidlá podávania a prijímania',
    giving: {
      title: 'Keď dávaš',
      items: [
        ['Konkrétne', 'Nie „si super", ale „páčilo sa mi, ako si vysvetlil tú vec pokojne, keď boli všetci nervózni."'],
        ['O správaní, nie o osobe', '„Prišiel si neskôr" namiesto „si nespoľahlivý". Správanie sa dá zmeniť, nálepka ostane.'],
        ['Včas', 'Kým si to obaja pamätáte. Po pol roku už je to len výčitka.'],
        ['Ja-výrokom', 'Hovor za seba: „mne to prišlo…", nie „všetci si mysleli…".'],
        ['So súhlasom', 'Spýtaj sa, či o ňu druhý stojí. Nevyžiadaná spätná väzba býva počutá ako útok.'],
        ['Nielen kritika', 'Keď hovoríš len vtedy, keď je zle, naučíš druhého báť sa tvojho hlasu.']
      ]
    },
    receiving: {
      title: 'Keď prijímaš',
      items: [
        ['Počúvaj, nebráň sa', 'Prvý impulz býva vysvetľovať. Skús ho vydržať a nechať vetu dopovedať.'],
        ['Pýtaj sa na spresnenie', '„Môžeš mi dať príklad?" spraví z hmly niečo, s čím sa dá pracovať.'],
        ['Poďakuj', 'Povedať niekomu pravdu stojí odvahu. Aj keď s ňou nesúhlasíš, ten človek riskoval.'],
        ['Vyber si, čo si vezmeš', 'Spätná väzba je pohľad, nie rozsudok. Nemusíš prijať všetko — rozhoduješ ty.']
      ]
    }
  },

  /* --- 4) Polievam kvety, nie burinu --- */
  flowers: {
    title: 'Polievam kvety, nie burinu',
    intro: 'Rastie to, čo zalievaš. Pozitívna spätná väzba nie je chvála bez ' +
      'dôvodu — je to <strong>hľadanie a pomenovanie toho, čo sa naozaj podarilo</strong>. ' +
      'A často to treba chvíľu hľadať, lebo oko ide samo po tom, čo nesedí.',
    scenes: [
      {
        text: 'Kamarát ti prvý raz varil. Cesnak pripálil, omáčka bola presolená ' +
          'a s večerou meškal hodinu. Keď si prišla, mal prestretý stôl so sviečkou, ' +
          'ospravedlnil sa bez výhovoriek a spýtal sa, či ti chutí — a keď si ' +
          'povedala, že je to slané, hneď doniesol vodu a smial sa na sebe.',
        options: [
          { text: 'Priznal chybu bez výhovoriek a vedel sa na sebe zasmiať.', ok: true },
          { text: 'Nič — jedlo bolo pokazené a meškal.', ok: false },
          { text: 'Aspoň to skúsil, to stačí.', ok: false, weak: true }
        ],
        model: '„Páčilo sa mi, že si sa neschovával za výhovorky, keď to nevyšlo — ' +
          'a že si sa hneď spýtal, či mi chutí. Pri tebe sa dá pokojne povedať pravda."'
      },
      {
        text: 'Kolegyňa viedla poradu prvýkrát. Prezentáciu čítala z papiera, ' +
          'dvakrát stratila niť a skončila o dvadsať minút neskôr. Keď sa však ' +
          'niekto opýtal nepríjemnú otázku, nezamotala sa — priznala, že odpoveď ' +
          'nevie, zapísala si ju a do večera ju poslala celému tímu.',
        options: [
          { text: 'Povedala „neviem", zapísala si to a odpoveď naozaj dodala.', ok: true },
          { text: 'Nič zvláštne, porada bola slabá.', ok: false },
          { text: 'Bola aspoň milá.', ok: false, weak: true }
        ],
        model: '„Ocenil som, ako si zvládla tú ťažkú otázku — povedala si rovno, ' +
          'že to nevieš, a do večera si to zistila. To dáva ľuďom istotu, že ' +
          'sa na tvoje slovo dá spoľahnúť."'
      },
      {
        text: 'Brat ti pomáhal so sťahovaním. Prišiel neskoro, dve krabice zabalil ' +
          'tak, že sa cestou vysypali, a polovicu času presedel na telefóne. ' +
          'Keď ste ale zistili, že skriňa neprejde dverami, ostal tam s tebou ' +
          'do noci, rozobral ju a nepovedal jediné krivé slovo.',
        options: [
          { text: 'Keď prišla naozajstná krízovka, ostal a vydržal až do konca.', ok: true },
          { text: 'Nič — viac zavadzal, než pomohol.', ok: false },
          { text: 'Prišiel, aj keď sa mu nechcelo.', ok: false, weak: true }
        ],
        model: '„Najviac mi pomohlo, že si pri tej skrini ostal do noci a ani raz ' +
          'si nezavzdychal. V momente, keď to bolo naozaj ťažké, si tam bol."'
      }
    ],
    feedbackOk: 'Presne tak — to je ten kvet. Keď ho pomenuješ konkrétne, druhý ' +
      'vie, čo má robiť znova.',
    feedbackWeak: 'Blízko. Lenže „aspoň to skúsil" je útecha, nie spätná väzba — ' +
      'druhý sa z nej nedozvie, čo konkrétne mu vyšlo.',
    feedbackNo: 'Skús sa pozrieť ešte raz. Aj v nepodarenom dni sa väčšinou nájde ' +
      'niečo, čo ten človek zvládol — a práve to má zmysel pomenovať.',
    note: 'Nejde o to prehliadať, čo nefunguje. Ide o to, aby to dobré nezostalo ' +
      'nepovedané. 💛'
  },

  /* --- 5) Ty-výrok → Ja-výrok --- */
  youToI: {
    title: 'Ty-výrok → Ja-výrok',
    intro: 'Ty-výrok obviňuje a druhý sa začne brániť. Ja-výrok hovorí, čo sa ' +
      'stalo, čo to so mnou robí a čo potrebujem — a s tým sa už dá pracovať. ' +
      'Je to tá istá technika ako v module Asertivita.',
    items: [
      {
        you: '„Nikdy ma nepočúvaš."',
        options: [
          { text: '„Cítim sa nevypočutá, keď si pri rozhovore pozeráš do telefónu — potrebujem chvíľu, keď sme naozaj obaja tu."', ok: true },
          { text: '„Cítim, že si bezohľadný, keď ma nepočúvaš."', ok: false },
          { text: '„Nevadí, veď to nie je dôležité."', ok: false }
        ]
      },
      {
        you: '„Zase meškáš."',
        options: [
          { text: '„Mrzí ma, keď čakám bez správy — potrebujem vedieť, na čom som."', ok: true },
          { text: '„Ty proste nevieš prísť načas."', ok: false },
          { text: '„To nič, počkám, ja mám času dosť."', ok: false }
        ]
      },
      {
        you: '„Vždy všetko rozhoduješ za mňa."',
        options: [
          { text: '„Bolo mi nepríjemné, že sa o víkende rozhodlo bezo mňa — chcem sa na takých veciach podieľať."', ok: true },
          { text: '„Cítim, že si dominantný a nerešpektuješ ma."', ok: false },
          { text: '„Rob si, ako myslíš, mne je to jedno."', ok: false }
        ]
      },
      {
        you: '„Vôbec ti na mne nezáleží."',
        options: [
          { text: '„Chýba mi tvoja pozornosť posledné týždne — potrebujem cítiť, že sme priorita."', ok: true },
          { text: '„Keby ti na mne záležalo, vedel by si to sám."', ok: false },
          { text: '„Asi som len prehnane citlivá."', ok: false }
        ]
      },
      {
        you: '„Ty ma vždy zhodíš pred ľuďmi."',
        options: [
          { text: '„Bolo mi trápne, keď si tú historku rozprával pred ostatnými — potrebujem, aby veci medzi nami zostali medzi nami."', ok: true },
          { text: '„Ty nemáš žiadny takt."', ok: false },
          { text: '„Veď si robil len srandu, nechaj tak."', ok: false }
        ]
      }
    ],
    feedbackOk: 'Áno — fakt + pocit + potreba, bez obviňovania. Toto sa ťažko ' +
      'zhadzuje zo stola.',
    feedbackDisguised: 'Pozor, toto je ty-výrok v prezlečení: začína sa „cítim", ' +
      'ale pokračuje hodnotením druhého. Skús povedať, čo sa stalo a čo potrebuješ.',
    feedbackPassive: 'Toto je ustúpenie, nie ja-výrok — tvoja potreba v ňom ' +
      'nezaznie a druhý sa nedozvie nič.'
  },

  /* --- 6) Krátka sebareflexia (bez skóre, len na zamyslenie) --- */
  reflection: {
    title: 'Krátke zamyslenie',
    intro: 'Žiadny test, žiadne skóre — len tri otázky pre teba. Nikam sa ' +
      'neukladajú ani neposielajú.',
    questions: [
      'Čo o sebe zvyknem skrývať — a pred kým najviac?',
      'Čo mi ľudia o mne hovoria, čo sám(a) nevidím?',
      'Komu by som mal(a) povedať niečo pekné, čo som zatiaľ nechal(a) nevypovedané?'
    ],
    note: 'Ak si na niektorú odpovedal(a) rýchlo, je to dobrá stopa. Ak na inú ' +
      'nie, aj to je odpoveď. 💛'
  }
};

window.FEEDBACK_TRAINING = FEEDBACK_TRAINING;


/* ==============================================================
   EGOGRAM – ako vediem komunikáciu (transakčná analýza)
   --------------------------------------------------------------
   Sebapoznanie, NIE diagnóza ani škatuľka. Otázky sú vlastné.
   SOFT: žiadny vplyv na matching, brány ani skóre; egogram sa
   nepoužíva v kartách matchov.
   Škála 0–4, každá poloha má 4 otázky (skóre 0–16). Percentá sú
   tu povolené ako SEBAOPIS, nikdy ako zhoda s niekým.
   TODO: neskôr do Supabase (spolu s ostatnými self-insight dátami).
   ============================================================== */

const EGOGRAM = {
  intro: 'Toto nie je test, v ktorom môžeš prepadnúť — všetky odpovede sú ' +
    'správne. Ukáže ti, ako vedieš komunikáciu ty: ktoré polohy v tebe žijú ' +
    'a čo nimi prirodzene vyvolávaš v druhých. Nie sú to škatuľky — poloha sa ' +
    'mení podľa človeka aj chvíle. A každá je dar.',

  scaleLabels: ['skoro nikdy', 'zriedka', 'občas', 'často', 'veľmi často'],

  poles: {
    KR: { name: 'Kritický Rodič', tag: 'strážca latky', icon: '📏',
      desc: 'Vidíš, čo nesedí, a vieš to pomenovať. Dávaš jasno, poriadok a ' +
        'chrániš, čo je dôležité. Keď komunikuješ z tejto polohy, v druhom ' +
        'prirodzene prebúdzaš Dieťa — buď sa prispôsobí, alebo sa vzoprie. ' +
        'Keď to vieš, môžeš si vybrať, kedy je latka namieste a kedy radšej ' +
        'siahneš po inej polohe.' },
    SR: { name: 'Starostlivý Rodič', tag: 'opora', icon: '🤲',
      desc: 'Keď niekto potrebuje pomoc, prirodzene sa oňho postaráš. Dávaš ' +
        'teplo, bezpečie a pocit, že v tom človek nie je sám. Táto poloha ' +
        'v druhom prebúdza jeho hravé, prirodzené Dieťa — cíti sa pri tebe ' +
        'v bezpečí. Len pozor, aby si sa nestaral aj tam, kde to druhý nechce.' },
    DO: { name: 'Dospelý', tag: 'pokojný rozvažovač', icon: '⚖️',
      desc: 'Skôr než zareaguješ, zvážiš fakty a možnosti — vecne, tu a teraz. ' +
        'Táto poloha pozýva druhého do jeho Dospelého — a rozhovor „dospelý ' +
        's dospelým" je ten, kde sa najlepšie hľadá riešenie. Je to pevná pôda, ' +
        'na ktorú sa oplatí vrátiť, keď emócie stúpnu.' },
    SD: { name: 'Slobodné Dieťa', tag: 'iskra a hravosť', icon: '✨',
      desc: 'Dopraješ si spontánnosť, radosť, tvorivosť. Smeješ sa nahlas, ' +
        'tešíš sa, hráš sa. Táto poloha nakazí druhých ľahkosťou a rozohreje ' +
        'aj chladnú atmosféru. Dovoľ si ju aj vtedy, keď „treba byť vážny".' },
    PD: { name: 'Prispôsobené Dieťa', tag: 'citlivé na súlad', icon: '🕊️',
      desc: 'Vnímaš, čo druhí čakajú, a vieš sa naladiť; pre pokoj vieš ustúpiť. ' +
        'Prispôsobenie je dar, keď je vedomé — a informácia, keď ustúpiš aj tam, ' +
        'kde si nechcel(a). Keď to zbadáš, môžeš povedať svoje — a tu ti pomôže ' +
        'asertivita.' },
    RD: { name: 'Rebelujúce Dieťa', tag: 'zdravý vzdor', icon: '🔥',
      desc: 'Keď je niečo nefér alebo ťa niekto tlačí, ozve sa v tebe „nie, ' +
        'takto nie". Vzdor nie je zlozvyk — je to energia, ktorá stráži tvoje ' +
        'hranice; prirodzene sa ozve najmä oproti Kritickému Rodičovi. Keď ju ' +
        'vieš podať pokojne (nie výbuchom), stáva sa z nej pevnosť, nie hádka.' }
  },

  /* Poradie je zámerne premiešané – nie zoskupené po polohách */
  items: [
    { id: 'eg01', pole: 'KR', text: 'Keď niekto poruší dohodu, dám mu to najavo.' },
    { id: 'eg02', pole: 'SR', text: 'Keď vidím, že to niekto potrebuje, prirodzene mu pomôžem.' },
    { id: 'eg03', pole: 'DO', text: 'Skôr než sa rozhodnem, v pokoji zvážim fakty.' },
    { id: 'eg04', pole: 'SD', text: 'Doprajem si spontánnosť — smejem sa a teším sa nahlas.' },
    { id: 'eg05', pole: 'PD', text: 'Prispôsobím sa, aj keď mi to celkom nesedí, len aby bol pokoj.' },
    { id: 'eg06', pole: 'RD', text: 'Keď ma niekto tlačí, vzoprem sa.' },

    { id: 'eg07', pole: 'KR', text: 'Mám jasno v tom, čo je správne a čo nie.' },
    { id: 'eg08', pole: 'SR', text: 'Rád(a) podržím a povzbudím druhých.' },
    { id: 'eg09', pole: 'DO', text: 'Aj v napätí sa snažím ostať vecný(á).' },
    { id: 'eg10', pole: 'SD', text: 'Rád(a) skúšam nové veci len tak, pre radosť.' },
    { id: 'eg11', pole: 'PD', text: 'Záleží mi, čo si o mne druhí pomyslia.' },
    { id: 'eg12', pole: 'RD', text: 'Nemám rád(a), keď mi niekto rozkazuje.' },

    { id: 'eg13', pole: 'KR', text: 'Všimnem si chybu skôr než to, čo sa podarilo.' },
    { id: 'eg14', pole: 'SR', text: 'Záleží mi, aby sa ľudia okolo mňa cítili dobre.' },
    { id: 'eg15', pole: 'DO', text: 'Pýtam sa otázky, aby som veciam lepšie rozumel(a).' },
    { id: 'eg16', pole: 'SD', text: 'Dám na intuíciu a nápady, čo mi prídu.' },
    { id: 'eg17', pole: 'PD', text: 'Ťažko poviem „nie", keď to niekto odo mňa čaká.' },
    { id: 'eg18', pole: 'RD', text: 'Keď je niečo nefér, dám to najavo.' },

    { id: 'eg19', pole: 'KR', text: 'Očakávam od ľudí, že veci spravia poriadne.' },
    { id: 'eg20', pole: 'SR', text: 'Niekedy dávam viac, než mi zostáva pre seba.' },
    { id: 'eg21', pole: 'DO', text: 'Oddelím, čo sa naozaj stalo, od toho, čo si domýšľam.' },
    { id: 'eg22', pole: 'SD', text: 'Viem sa zahrať a nebrať všetko smrteľne vážne.' },
    { id: 'eg23', pole: 'PD', text: 'Radšej ustúpim, než by som vyvolal(a) napätie.' },
    { id: 'eg24', pole: 'RD', text: 'Idem si po svojom, aj keď to ostatní vidia inak.' }
  ],

  resultIntro: 'Takto to v tebe žije práve teraz. Nie je tu nič „málo" ani ' +
    '„priveľa" — každá poloha je dar a každá sa hodí na inú chvíľu.',

  /* Doplnkové ladenie – podané ako pochopenie, nie ako súd */
  complements: {
    title: 'Čo v druhom prirodzene prebúdzaš',
    items: [
      'Starostlivý Rodič ↔ hravé (Slobodné) Dieťa — keď dávaš teplo a bezpečie, druhý sa uvoľní a rozohrá.',
      'Dospelý ↔ Dospelý — vecný tón pozýva druhého na tú istú pôdu; tam sa hľadá riešenie najlepšie.',
      'Kritický Rodič → prebúdza poslušné (Prispôsobené) alebo rebelujúce Dieťa — buď sa druhý stiahne, alebo sa vzoprie.'
    ],
    note: 'Nie je to zákon, len tendencia — ale keď ju poznáš, máš na výber, ' +
      'z ktorej polohy prehovoríš.'
  },

  outro: 'Iných zmeniť neviem a seba nemusím — len v komunikácii využijem svoj ' +
    'potenciál, aby som dosiahol(la) harmóniu. 💛'
};

window.EGOGRAM = EGOGRAM;


/* ==============================================================
   MENO TVOJEJ PODSTATY (prídavné + podstatné meno)
   --------------------------------------------------------------
   Neutrálny, univerzálny rámec (zámerne bez „indiánskeho"
   označenia). SOFT/self-insight – žiadny vplyv na matching.
   Prídavné meno sa skloňuje podľa GRAMATICKÉHO rodu podstatného
   mena („Tichá Hviezda", „Hĺbavý Prameň", „Verné Srdce") — tým je
   meno prirodzene rodovo neutrálne voči hráčovi.
   rod: m | z | s (mužský/ženský/stredný rod podstatného mena)
   ============================================================== */

const ESSENCE_NAME = {
  intro: 'Meno tvojej podstaty je prídavné + podstatné meno — dve slová, ' +
    'ktoré vystihujú, kým v jadre si. Nie je to prezývka, je to zrkadlo.',

  /* Prídavné mená podľa dominantnej črty (tvary podľa rodu podst. mena) */
  adjectives: {
    odstup: [
      { m: 'Tichý',      z: 'Tichá',      s: 'Tiché',      why: 'lebo ideš vlastnou hĺbkou' },
      { m: 'Hĺbavý',     z: 'Hĺbavá',     s: 'Hĺbavé',     why: 'lebo sa nezastavíš na povrchu' }
    ],
    blizkost: [
      { m: 'Vrúcny',     z: 'Vrúcna',     s: 'Vrúcne',     why: 'lebo ľudí hreješ blízkosťou' },
      { m: 'Otvorený',   z: 'Otvorená',   s: 'Otvorené',   why: 'lebo máš dvere aj srdce dokorán' },
      { m: 'Hrejivý',    z: 'Hrejivá',    s: 'Hrejivé',    why: 'lebo pri tebe je teplo' }
    ],
    stalost: [
      { m: 'Pevný',      z: 'Pevná',      s: 'Pevné',      why: 'lebo sa o teba dá oprieť' },
      { m: 'Verný',      z: 'Verná',      s: 'Verné',      why: 'lebo držíš slovo aj ľudí' },
      { m: 'Neochvejný', z: 'Neochvejná', s: 'Neochvejné', why: 'lebo ťa vietor nezlomí' }
    ],
    zmena: [
      { m: 'Slobodný',   z: 'Slobodná',   s: 'Slobodné',   why: 'lebo potrebuješ vzduch a obzor' },
      { m: 'Neúnavný',   z: 'Neúnavná',   s: 'Neúnavné',   why: 'lebo ťa pohyb nabíja' },
      { m: 'Bystrý',     z: 'Bystrá',     s: 'Bystré',     why: 'lebo nové chytáš za pochodu' }
    ],
    cit: [
      { m: 'Láskavý',    z: 'Láskavá',    s: 'Láskavé',    why: 'lebo srdce máš v rukách' },
      { m: 'Citlivý',    z: 'Citlivá',    s: 'Citlivé',    why: 'lebo vnímaš aj nevyslovené' }
    ],
    rozum: [
      { m: 'Múdry',      z: 'Múdra',      s: 'Múdre',      why: 'lebo hľadáš jasno' },
      { m: 'Jasný',      z: 'Jasná',      s: 'Jasné',      why: 'lebo do vecí vnášaš svetlo' }
    ],
    sex: [
      { m: 'Vášnivý',    z: 'Vášnivá',    s: 'Vášnivé',    why: 'lebo horíš naplno' },
      { m: 'Živý',       z: 'Živá',       s: 'Živé',       why: 'lebo energia je tvoj živel' }
    ]
  },

  /* Podstatné mená podľa RT kvadrantu archetypu */
  nouns: {
    OS: [
      { word: 'Hviezda', rod: 'z', why: 'lebo tvoríš v samote niečo, čo má svetlo' },
      { word: 'Prameň',  rod: 'm', why: 'lebo z hĺbky ide čistá sila' },
      { word: 'Plameň',  rod: 'm', why: 'lebo tiché veci vedia horieť najdlhšie' }
    ],
    BS: [
      { word: 'Štít',    rod: 'm', why: 'lebo chrániš, čo miluješ' },
      { word: 'Koreň',   rod: 'm', why: 'lebo držíš celý strom' },
      { word: 'Dom',     rod: 'm', why: 'lebo pri tebe je domov' }
    ],
    BZ: [
      { word: 'Pieseň',  rod: 'z', why: 'lebo rozozvučíš aj všedný deň' },
      { word: 'Vietor',  rod: 'm', why: 'lebo prinášaš čerstvý vzduch' },
      { word: 'Iskra',   rod: 'z', why: 'lebo zapaľuješ nové veci' }
    ],
    OZ: [
      { word: 'Cesta',   rod: 'z', why: 'lebo smer je tvoj' },
      { word: 'Sokol',   rod: 'm', why: 'lebo vidíš ďaleko a letíš vlastným nebom' },
      { word: 'Rieka',   rod: 'z', why: 'lebo si voľnosť a sila zároveň' }
    ]
  },

  /* Motív z hodnoty #1 v Rebríčku hodnôt (Lola) */
  valueNouns: {
    laska:   { word: 'Srdce',  rod: 's', why: 'lebo láska je tvoj prvý jazyk' },
    rozum:   { word: 'Svetlo', rod: 's', why: 'lebo rozum ti svieti na cestu' },
    ego:     { word: 'Koruna', rod: 'z', why: 'lebo poznáš svoju hodnotu' },
    sex:     { word: 'Oheň',   rod: 'm', why: 'lebo telesnosť je tvoja živá sila' },
    peniaze: { word: 'Zlato',  rod: 's', why: 'lebo istota má u teba váhu' }
  },

  invite: 'Zatiaľ vychádzam len zo základov — keď si spravíš Vzťahový kompas, ' +
    'panáčika z tvarov či rebríček hodnôt, návrhy budú presnejšie. 💛',

  note: 'Meno si môžeš kedykoľvek zmeniť — podstata sa vyvíja. Neskôr ti ho ' +
    'bude môcť darovať aj niekto, kto ťa pozná. 💛'
};

window.ESSENCE_NAME = ESSENCE_NAME;
