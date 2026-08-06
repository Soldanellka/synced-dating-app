# Synced – kontext projektu (pre Claude)

Tento súbor slúži ako „context pack" pre projekt Synced. Nahraj ho do
*Context* nového cloudového projektu, aby mal Claude hneď celý prehľad.

## O projekte
Synced je moderná **hodnotová zoznamka** založená na hodnotách, kompatibilite
a video overení – pre ľudí, ktorí hľadajú seriózny vzťah.
Slogan: „Zoznamka pre ľudí, ktorí sú na rovnakej vlne."

## Kde všetko žije
- **GitHub repo (zdroj pravdy):** https://github.com/Soldanellka/synced-dating-app  (vetva `main`)
- **Live web (Vercel, auto-deploy z GitHubu):** https://synced-dating-app.vercel.app
- **Lokálna kópia:** C:\Users\HP\Downloads\zoznamka

## Ako funguje nasadenie
Vercel je prepojený s GitHub repom → **každý push do `main` sa automaticky nasadí**
na live web. Netreba nič manuálne nahrávať.

## Technológie
Čistý **HTML + CSS + JavaScript** (bez build kroku). Súbory:
- `index.html` – hlavná stránka (landing, onboarding, profil, matchy, chat, video)
- `styles.css` – dizajn (jemná ružová paleta, responzívne)
- `script.js` – logika (state `AppState`, wizard, scoring, matchovanie, chat, video)
- `data.js` – otázky testu + fiktívna databáza používateľov
- `docs/video-architektura.md`, `docs/backend-supabase.md` – návrhové dokumenty
- `supabase/schema.sql` – DB schéma + RLS pre budúci backend

## Stav vývoja (MVP po moduloch)
| # | Modul | Stav |
|---|-------|------|
| 1 | Frontend – responzivita, komponenty, JS state | ✅ Hotovo |
| 2 | Onboarding test kompatibility (22 otázok + scoring) | ✅ Hotovo |
| 3 | Matchovanie – algoritmus kompatibility | ✅ Hotovo |
| 4 | Chat + AI návrhy správ (rule-based) | ✅ Hotovo |
| 5 | Video overenie + video chat (architektúra + placeholder) | ✅ Hotovo |
| 6 | Backend návrh (Supabase – schéma, API, RLS) | ✅ Hotovo |
| 7 | Monetizácia + právne sekcie | ⏳ Ďalší krok (posledný) |

## Čo appka aktuálne vie
Test kompatibility (hodnoty, osobnosť Big Five light, preferencie) → vypočíta
profil (top 3 hodnoty + typ osobnosti) → zobrazí 6 matchov s % a vzťahovým typom
→ chat s AI návrhmi tém → placeholdery pre video overenie a video hovor.

## Ďalší krok
Krok 7 – Monetizácia (CTA na premium/overenie/boost, mock billing modul pripravený
na Stripe) + právne sekcie (Obchodné podmienky, Ochrana údajov, Cookies) ako modaly.

## Ako pokračovať v práci
Pracuje sa cez GitHub repo `synced-dating-app`. Zmeny commitni/pushni do `main`
a Vercel ich sám nasadí. Pri väčších úpravách drž štýl a štruktúru z existujúcich súborov.
