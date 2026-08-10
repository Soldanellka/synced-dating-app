# 💛 Synced – Výzor, avatar a pravidlá proti sklamaniu

Návrhový dokument pre **výzorovú vrstvu** a **pravidlá, ktoré predchádzajú
sklamaniam**. Nadväzuje na už hotové *tvrdé brány* (zámer + dealbreakery)
v [`script.js`](../script.js) → funkcia `passesHardGates`.

Je to zároveň **podklad pre kód**: každá sekcia hovorí *čo* sa má postaviť,
*prečo* a *ako* (dátový model, správanie, texty).

---

## 0. Tri princípy (z nich vyplýva všetko ostatné)

1. **Hodnoty pred výzorom.** Výzor nikdy nie je headline číslo ani tvrdá brána.
   Rozhodujú hodnoty, zámer a súlad – výzor je len tichý, mäkký signál.
2. **Pravdivá reprezentácia.** Nikto nemá byť na prvom rande prekvapený. Avatar
   sa stavia z reálnej postavy a **video overenie** ju potvrdí. Riešime *šok*,
   nie „nedokonalosť".
3. **Nedokonalosť ako dôvod lásky, nie mínus.** Odchýlku od ideálu appka nikdy
   nevyčísli ani nepomenuje – iba jemne naznačí, že práve tá „inakosť" sa časom
   často stane tým, čo na človeku miluješ.

---

## 1. Tvrdé brány – HOTOVÉ ✅ (referencia)

Už implementované v `passesHardGates(me, other)`:

- **Zámer:** „vážny vzťah" a „len spoločnosť" sa navzájom vylučujú; `open` je
  zlučiteľný so všetkým.
- **Dealbreakery:** *Fajčenie* (`other.smokes`), *Nezáujem o rodinu*
  (`valueVector.rodina ≤ 2`), *Rozdielne životné ciele* (`valueSim < 0.5`).
- Kto neprejde, **nezobrazí sa** – a používateľ vidí transparentnú poznámku,
  koľko a prečo bolo skrytých (`filteredNote`).

**Zámerne NIE brána:** *Nečestnosť* (nedá sa overiť pred zoznámením → rieši
feedback po rande) a **výzor** (viď sekcia 4 – prečo).

---

## 2. Avatar „Ja" a „Môj ideál" – NA IMPLEMENTÁCIU

### 2.1 Dátový model

Do profilu (a rovnako do `SAMPLE_USERS`) pribudnú dva objekty:

```js
appearance: {            // „aký/aká som" – pravdivá reprezentácia
  heightBand: 'stredna', // 'nizsia' | 'stredna' | 'vyssia'
  silhouette: 'atleticka', // neutrálne siluety, viď 2.2
  hair: 'tmave',
  style: 'prirodzeny'
},
ideal: {                 // „koho si predstavujem" – rovnaké polia + 'nezalezi'
  heightBand: 'vyssia',
  silhouette: 'nezalezi',
  hair: 'nezalezi',
  style: 'nezalezi'
}
```

> ⚠️ **Žiadne čísla ani miery.** Nie cm, nie kg, nie BMI. Iba široké pásma a
> siluety. Cieľ je pravdivá reprezentácia bez tlaku na telo – nie „stroj na
> porovnávanie postáv".

### 2.2 Siluety – neutrálne, nehodnotiace

Popisy musia byť rešpektujúce a nehodnotiace (žiadne „chudá/tučná", žiadne
klinické pojmy). Odporúčaný set (finálne slová prejsť s citom):

`drobná` · `atletická` · `plná` · `silná` · `nezáleží`

**KÁNON interných hodnôt** – tieto presné reťazce musia byť identické
v `SAMPLE_USERS`, v avatar builderi aj kdekoľvek inde (`appearanceFit`
porovnáva presné reťazce):

| Pole | Interné hodnoty | Zobrazené labely |
|------|-----------------|------------------|
| `heightBand` | `nizsia` · `stredna` · `vyssia` | nižšia / stredná / vyššia |
| `silhouette` | `drobna` · `atleticka` · `plna` · `silna` | drobná / atletická / plná / silná |
| `hair` | `tmave` · `svetle` · `rysave` | tmavé / svetlé / ryšavé |
| `style` | `prirodzeny` · `upraveny` · `sportovy` | prirodzený / upravený / športový |

Ideál má pri **každom** poli navyše možnosť `nezalezi` („Nezáleží mi").

Každý si vyberá **sám za seba**. Výber ideálu vždy ponúka aj možnosť
**„nezáleží mi"** ako plnohodnotnú (a jemne odporúčanú) voľbu.

### 2.3 Onboarding krok

Nový krok vo wizarde (za preferenciami, pred zhrnutím):

- Panel A – **„Ja"**: poskladaj svoju siluetu (abstraktný avatar, nie fotka).
- Panel B – **„Môj ideál"**: to isté pre predstavu partnera, s dôrazom, že
  „nezáleží" je úplne v poriadku.
- Mikrotext pod krokom: *„Toto neslúži na hodnotenie – pomáha to, aby na prvom
  stretnutí nikoho nič neprekvapilo."*

---

## 3. Výzor v matchingu – tichý, mäkký signál

Pod kapotou sa počíta `appearanceFit(me.ideal, other.appearance)` → `0–1`:

- porovná len polia, kde ideál **nie je** `nezalezi`;
- `nezalezi` a chýbajúce polia sa neráta ako mínus (neutrál);
- ak sú všetky polia `nezalezi` → `appearanceFit = null` (výzor sa ignoruje).

**Kde sa `appearanceFit` smie použiť:**

- jemné doradenie **v rámci už dobrých matchov** (nikdy nepreskočí hodnoty/zámer);
- spustenie „dôvod milovať" riadku (sekcia 3.1).

**Kde sa NESMIE použiť:**

- ❌ ako tvrdá brána (nikoho nevyradí);
- ❌ ako zobrazené percento či „mínus body";
- ❌ nikdy sa nepomenuje konkrétna odlišná črta.

### 3.1 Reframe „dôvod milovať" (kľúčová vec)

V karte matchu sa namiesto akéhokoľvek skóre výzoru zobrazí **jeden jemný
riadok**, podľa `appearanceFit`:

- **Je tam odchýlka** (`appearanceFit` nízke–stredné a match inak sedí):
  > „Niečo na ňom celkom nesedí do tvojej predstavy – a práve to sa časom často
  > stane tým, čo miluješ. 💛"
- **Sedí takmer dokonale** (`appearanceFit` veľmi vysoké):
  > „Sedí do tvojej predstavy – no skutoční ľudia sú vždy o kúsok inde, a to je
  > tá krajšia časť. 💛"
- **Výzor ignorovaný** (`appearanceFit = null`): riadok sa nezobrazí.

Pravidlá pre text:

- **Nikdy nemenovať konkrétnu chybu** („je nižší", „nie je drobná" → zakázané).
- Žiadne percento, žiadne odčítavanie.
- Vždy otvorené, láskavé, bez spotlightu na nedostatok.

---

## 4. Prečo výzor NIE je skóre ani brána (odôvodnenie)

Uvedený telesný ideál **takmer nepredpovedá**, ku komu človeka reálne priťahuje,
keď sa stretnú naživo (Eastwick & Finkel, 2008). Preto:

- **„Výzor 82 %"** by (a) vrátil appku k hodnoteniu tiel – proti hodnotovej
  myšlienke a (b) postavil očakávanie, ktoré živý človek nenaplní (halo efekt →
  sklamanie). Vysoké „100 % na výzor" je recept na sklamanie, nie liek.
- Drobná nedokonalosť naopak človeka **poľudští a priblíži** (pratfall efekt);
  milujeme konkrétnu osobu, nie šablónu.

Preto výzor riešime len cez **pravdivosť** (avatar + video) a **reframe**, nie
cez skóre.

---

## 5. Nezhoda zámeru a nátlak („všetci chcú sex")

Dva rôzne problémy, riešené vrstvením – nie jedným tlačidlom:

**A) Nezhoda zámeru** (jeden chce vzťah, druhý tají, že chce len sex)

- už riešené bránou zámeru (sekcia 1);
- dlhý hodnotový test = prirodzené trenie: kto chce len sex, 22 otázok o
  hodnotách nevyplní;
- **values-first tok**: najprv hodnoty a rozhovor, žiadne okamžité swipovanie fotiek.

**B) Nátlak a obťažovanie**

- **video overenie ako podmienka chatu** zdvihne latku a odplaší jednorazové profily;
- **report / blok** dostupný z každej konverzácie;
- **feedback po rande**: „Správal(a) sa v poriadku?" → kto opakovane tlačí na
  sex alebo obťažuje, ide von.

> Cieľ nie je zakázať túžbu (tá je normálna), ale spraviť appku nezaujímavou pre
> tých, čo chcú **iba** to, a chrániť ľudí pred nátlakom.

---

## 6. Poradie implementácie (od najlacnejšieho)

1. **Reframe riadok v karte** – žiadny nový model, len text podľa dočasného
   `appearanceFit` (zatiaľ môže vracať null). Okamžite viditeľný efekt.
2. **Avatar builder + `appearance` / `ideal`** v onboardingu a v `SAMPLE_USERS`.
3. **`appearanceFit`** ako tichý signál + doradenie v rámci matchov.
4. **Feedback po rande** + report/blok (napojí sa na Supabase, sekcia 5B).

---

## 7. Texty (SK) – na jednom mieste

| Kde | Text |
|-----|------|
| Onboarding – mikrotext | „Toto neslúži na hodnotenie – pomáha, aby na prvom stretnutí nikoho nič neprekvapilo." |
| Ideál – voľba | „Nezáleží mi" (plnohodnotná, jemne odporúčaná) |
| Karta – odchýlka | „Niečo na ňom celkom nesedí do tvojej predstavy – a práve to sa časom často stane tým, čo miluješ. 💛" |
| Karta – takmer sedí | „Sedí do tvojej predstavy – no skutoční ľudia sú vždy o kúsok inde, a to je tá krajšia časť. 💛" |
| Po rande | „Správal(a) sa v poriadku?" |

---

*Tento dokument je zdroj pravdy pre výzorovú vrstvu a pravidlá proti sklamaniu.
Pri zmene správania najprv uprav tento doc, potom kód.*
