# Synced – hodnotová zoznamka 💛

Moderná zoznamka založená na **hodnotách, kompatibilite a video overení**, ktorá spája ľudí hľadajúcich seriózny vzťah.

> „Zoznamka pre ľudí, ktorí sú na rovnakej vlne." – žiadne fejky, žiadne hry, len ľudia, ktorí zdieľajú tvoje hodnoty.

## 🧱 Štruktúra projektu

```
zoznamka.html   – hlavná stránka (landing, onboarding, profil, matchy, chat, video)
styles.css      – dizajn (jemná ružová paleta, responzívne, komponenty)
script.js       – logika (state systém, onboarding wizard, navigácia)
```

## ✅ Postup vývoja (MVP po moduloch)

| # | Modul | Stav |
|---|-------|------|
| 1 | Frontend – responzivita, komponentizácia, JS state | ✅ Hotovo |
| 2 | Onboarding test kompatibility (otázky + scoring) | ⏳ Ďalší krok |
| 3 | Matchovanie – algoritmus kompatibility | ⬜ Plánované |
| 4 | Chat + AI návrhy správ (rule-based) | ⬜ Plánované |
| 5 | Video overenie + video chat (architektúra) | ⬜ Plánované |
| 6 | Backend návrh (Supabase – schéma, API, RLS) | ⬜ Plánované |
| 7 | Monetizácia + právne sekcie | ⬜ Plánované |

## 🚀 Spustenie

Projekt je čistý HTML/CSS/JS bez build kroku – stačí otvoriť `zoznamka.html` v prehliadači.

```bash
# alebo lokálny server
python3 -m http.server 8000
# potom otvor http://localhost:8000/zoznamka.html
```

## 🧠 Architektúra JS (state systém)

Jediný zdroj pravdy je globálny objekt `AppState` v `script.js`:

- `userProfile` – základné údaje, hodnoty (top 3), osobnosť (Big Five light), vzťahový zámer, preferencie partnera
- `answers` – surové odpovede z testu (Likert 1–5)
- `compatibilityScore` – výsledok matchovania
- `currentStep` / `totalSteps` – priebeh onboarding wizardu

---

*Rozpracované MVP. Vyvíjané krokovo, modul po module.*
