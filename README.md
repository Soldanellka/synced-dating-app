# Synced – hodnotová zoznamka 💛

Moderná zoznamka založená na **hodnotách, kompatibilite a video overení**, ktorá spája ľudí hľadajúcich seriózny vzťah.

> „Zoznamka pre ľudí, ktorí sú na rovnakej vlne." – žiadne fejky, žiadne hry, len ľudia, ktorí zdieľajú tvoje hodnoty.

## 🧱 Štruktúra projektu

```
index.html   – hlavná stránka (landing, onboarding, profil, matchy, chat, video)
styles.css      – dizajn (jemná ružová paleta, responzívne, komponenty)
script.js       – logika (state, wizard, scoring, matchovanie)
data.js         – otázky testu + fiktívna databáza používateľov
```

## ✅ Postup vývoja (MVP po moduloch)

| # | Modul | Stav |
|---|-------|------|
| 1 | Frontend – responzivita, komponentizácia, JS state | ✅ Hotovo |
| 2 | Onboarding test kompatibility (otázky + scoring) | ✅ Hotovo |
| 3 | Matchovanie – algoritmus kompatibility | ✅ Hotovo |
| 4 | Chat + AI návrhy správ (rule-based) | ✅ Hotovo |
| 5 | Video overenie + video chat (architektúra) | ⏳ Ďalší krok |
| 6 | Backend návrh (Supabase – schéma, API, RLS) | ⬜ Plánované |
| 7 | Monetizácia + právne sekcie | ⬜ Plánované |

## 🚀 Spustenie

Projekt je čistý HTML/CSS/JS bez build kroku – stačí otvoriť `index.html` v prehliadači.

```bash
# alebo lokálny server
python3 -m http.server 8000
# potom otvor http://localhost:8000/index.html
```

## 🧠 Architektúra JS (state systém)

Jediný zdroj pravdy je globálny objekt `AppState` v `script.js`:

- `userProfile` – základné údaje, hodnoty (top 3), osobnosť (Big Five light), vzťahový zámer, preferencie partnera
- `answers` – surové odpovede z testu (Likert 1–5)
- `compatibilityScore` – výsledok matchovania
- `currentStep` / `totalSteps` – priebeh onboarding wizardu

---

*Rozpracované MVP. Vyvíjané krokovo, modul po module.*
