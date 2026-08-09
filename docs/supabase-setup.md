# 🗄️ Synced – Napojenie Supabase (krok za krokom)

Tento návod ťa prevedie tým, ako z prototypu spraviť **reálnu appku** s registráciou,
profilmi, matchmi a chatom. Je to zadarmo a bez firmy (Supabase free tier).

Rozdelené na **tvoju časť** (pár klikov) a **moju časť** (kód).

---

## ČASŤ A – čo spravíš ty (~10 minút)

### 1. Založ Supabase projekt
1. Choď na **supabase.com** → **Start your project** (prihlásiš sa aj cez GitHub).
2. **New project**:
   - Name: `synced`
   - Database password: vymysli silné heslo a **ulož si ho** (budeš ho potrebovať).
   - **Region: Frankfurt / Central EU** (dôležité kvôli GDPR – dáta v EÚ).
3. Počkaj ~2 minúty, kým sa projekt vytvorí.

### 2. Spusti databázovú schému
1. V ľavom menu **SQL Editor** → **New query**.
2. Otvor súbor `supabase/schema.sql` z repozitára, **skopíruj celý obsah** a vlož ho sem.
3. Klikni **Run**. Malo by to vytvoriť tabuľky `profiles`, `matches`, `messages`, `payments`
   aj bezpečnostné pravidlá (RLS). Ak vidíš „Success", je hotovo. ✅

### 3. Vytvor úložisko pre overovacie videá
1. V ľavom menu **Storage** → **New bucket**.
2. Name: `verification-videos`, typ **Private** (nie public!). Ulož.

### 4. Skopíruj mi dva údaje
1. V ľavom menu **Project Settings** (ozubené koliesko) → **API**.
2. Skopíruj:
   - **Project URL** (napr. `https://xxxx.supabase.co`)
   - **anon public** kľúč (dlhý reťazec – tento je určený na použitie v prehliadači, je verejný a bezpečný na zdieľanie)
3. **Pošli mi tieto dva údaje do chatu.**

> ⚠️ Nikdy mi neposielaj `service_role` kľúč ani databázové heslo – tie sú tajné a do prehliadača nepatria.

---

## ČASŤ B – čo spravím ja (keď mi pošleš tie 2 údaje)

1. Pridám do appky `@supabase/supabase-js` a konfiguráciu (tvoj URL + anon key).
2. **Registrácia a prihlásenie** (email + heslo) cez Supabase Auth.
3. **Uloženie profilu** – výsledok testu sa uloží do tabuľky `profiles`.
4. **Reálne matchy** – namiesto `SAMPLE_USERS` sa načítajú skutoční používatelia.
5. **Chat** – správy sa ukladajú do `messages` a chodia naživo (realtime).
6. Postupne aj **referral počítanie** a napojenie **Stripe** na platby.

Pushnem to na GitHub a Vercel to nasadí – appku potom otestuješ naživo tak,
že sa s kamoškou obe zaregistrujete a uvidíte reálne matchy.

---

## Bezpečnosť a poriadok
- `anon` kľúč je verejný (patrí do prehliadača), takže OK. Tajné kľúče nie.
- RLS (v schéme) zaručuje, že každý vidí len svoje/relevantné dáta.
- Free projekt sa po týždni nečinnosti „uspí" – stačí sa prihlásiť do Supabase a beží ďalej.
