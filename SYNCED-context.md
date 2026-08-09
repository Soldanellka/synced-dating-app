# Synced – kontext projektu (pre Claude)

Context pack pre projekt Synced. Nahraj ho do *Context* nového cloudového
projektu, aby mal Claude hneď celý prehľad.

## O projekte
Synced je moderná **hodnotová zoznamka** založená na hodnotách, kompatibilite
a video overení – pre ľudí, ktorí hľadajú seriózny vzťah.
Slogan: „Zoznamka pre ľudí, ktorí sú na rovnakej vlne."

## Kde všetko žije
- **GitHub repo (zdroj pravdy):** https://github.com/Soldanellka/synced-dating-app  (vetva `main`)
- **Live web:** https://synced-dating-app.vercel.app
- **Nasadenie:** Vercel je prepojený s GitHub repom → **každý push do `main` sa nasadí automaticky**. Netreba nič nahrávať ručne.

## Technológie
Čistý **HTML + CSS + JavaScript** (bez build kroku). Súbory:
- `index.html` – hlavná stránka (landing, onboarding, profil, matchy, chat, video, premium)
- `styles.css` – dizajn (jemná ružová paleta, responzívne)
- `script.js` – logika (state `AppState`, wizard, scoring, matchovanie, chat, video, billing, invite)
- `data.js` – otázky testu + fiktívna databáza používateľov (`SAMPLE_USERS`)
- `docs/` – návrhové dokumenty (video architektúra, backend Supabase, setup návod)
- `supabase/schema.sql` – DB schéma + RLS pre backend

## Stav vývoja – MVP KOMPLETNÉ
| # | Modul | Stav |
|---|-------|------|
| 1 | Frontend – responzivita, komponenty, JS state | ✅ |
| 2 | Onboarding test kompatibility (22 otázok + scoring) | ✅ |
| 3 | Matchovanie – algoritmus kompatibility | ✅ |
| 4 | Chat + AI návrhy správ (rule-based) | ✅ |
| 5 | Video overenie + video hovor (architektúra + placeholder) | ✅ |
| 6 | Backend návrh (Supabase – schéma, API, RLS) | ✅ |
| 7 | Monetizácia (cenník, mock checkout) + právne modaly | ✅ |
| ➕ | Rastový hook – zdieľateľný výsledok, „pozvi a porovnaj", referral | ✅ |

## Čo appka aktuálne vie
Test kompatibility (hodnoty, osobnosť Big Five light, preferencie) → vypočíta
profil (top 3 hodnoty + typ osobnosti) → 6 matchov s % a vzťahovým typom →
chat s AI návrhmi → placeholdery pre video overenie a hovor → cenník
(Premium/overenie/boost/report) s mock checkoutom → právne modaly →
pozývací link, cez ktorý kamoš po teste vidí váš % súlad.

## Rastový hook (dôležité pre studený štart)
Po teste sa dá vygenerovať **pozývací link**, ktorý v sebe zakóduje profil.
Keď ho kamoš otvorí, uvidí uvítací banner, spraví si test a dostane
**„Ty & [meno]: X% súlad"**. Plus referral: pozvi 3 → Premium zadarmo
(počítanie sa napojí na backend).

## Ďalší krok – napojenie Supabase
Aby sa z prototypu stala reálna appka: založiť Supabase projekt (EU región),
spustiť `supabase/schema.sql`, pridať `@supabase/supabase-js`, prepnúť
registráciu/profil/chat na Supabase a nahradiť `SAMPLE_USERS` reálnymi profilmi.
Postup je v `docs/supabase-setup.md`.

## Ako pokračovať v práci
Pracuje sa cez GitHub repo `synced-dating-app`. Zmeny pushni do `main`
a Vercel ich sám nasadí. Drž existujúci štýl a štruktúru súborov.
Reálny beta test sa dá spraviť zadarmo bez firmy (Supabase free + Daily.co free
+ Stripe test mód).
