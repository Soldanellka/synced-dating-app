-- ==============================================================
-- SYNCED – Databázová schéma pre Supabase (PostgreSQL)
-- Krok 6: users(profiles), matches, messages, payments + RLS
-- --------------------------------------------------------------
-- Spustenie: Supabase Dashboard → SQL Editor → vlož a spusti.
-- Poznámka: "users" zo zadania = tabuľka `profiles`, ktorá je
-- naviazaná na Supabase Auth (auth.users). Auth rieši heslá/login,
-- profiles drží aplikačné dáta (hodnoty, osobnosť, zámer).
-- ==============================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ==============================================================
-- 1) PROFILES  (aplikačný „users")
-- ==============================================================
create table if not exists public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  display_name          text,
  age                   int check (age between 18 and 120),
  location              text,
  gender                text,
  relationship_intent   text check (relationship_intent in ('serious','company','open')),

  -- Výstupy testu kompatibility (Krok 2)
  value_vector          jsonb default '{}'::jsonb,   -- { "rodina":5, "kariéra":3, ... }
  top_values            jsonb default '[]'::jsonb,   -- [ { "value":"rodina","score":5 }, ... ]
  personality           jsonb default '{}'::jsonb,   -- { "type":"...", "scores": { ... } }
  preferred_traits      jsonb default '[]'::jsonb,
  pace                  text,
  dealbreakers          jsonb default '[]'::jsonb,

  -- Profil a overenie
  photo_url             text,
  bio                   text,
  verification_status   text not null default 'none'
                          check (verification_status in ('none','pending','verified','rejected')),
  verification_video_path text,                      -- cesta v súkromnom storage bucketi

  -- Monetizácia
  is_premium            boolean not null default false,
  premium_until         timestamptz,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ==============================================================
-- 2) MATCHES  (páry + kompatibilita)
-- Kanonické poradie: vždy ukladáme user_low < user_high (uuid),
-- aby dvojica existovala len raz.
-- ==============================================================
create table if not exists public.matches (
  id                 uuid primary key default gen_random_uuid(),
  user_low           uuid not null references public.profiles(id) on delete cascade,
  user_high          uuid not null references public.profiles(id) on delete cascade,
  compatibility      int check (compatibility between 0 and 100),
  relationship_type  text,                            -- 'Harmonický pár', ...
  status             text not null default 'suggested'
                       check (status in ('suggested','liked','matched','passed')),
  created_at         timestamptz not null default now(),

  constraint matches_distinct check (user_low <> user_high),
  constraint matches_ordered  check (user_low < user_high),
  constraint matches_unique   unique (user_low, user_high)
);

create index if not exists idx_matches_user_low  on public.matches(user_low);
create index if not exists idx_matches_user_high on public.matches(user_high);

-- ==============================================================
-- 3) MESSAGES  (chat)
-- ==============================================================
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at    timestamptz
);

create index if not exists idx_messages_match on public.messages(match_id, created_at);

-- ==============================================================
-- 4) PAYMENTS  (premium, overenie, boost, report)
-- ==============================================================
create table if not exists public.payments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  product              text not null
                         check (product in ('premium','verification','boost','compat_report')),
  amount_cents         int not null check (amount_cents >= 0),
  currency             text not null default 'eur',
  status               text not null default 'pending'
                         check (status in ('pending','paid','failed','refunded')),
  stripe_session_id    text,
  stripe_payment_intent text,
  created_at           timestamptz not null default now(),
  paid_at              timestamptz
);

create index if not exists idx_payments_user on public.payments(user_id);

-- ==============================================================
-- 5) TRIGGERY
-- ==============================================================

-- 5a) Automatické updated_at na profiles
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 5b) Po registrácii v Auth vytvor prázdny profil
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Nový používateľ'));
  return new;
end;
$$;

drop trigger if exists trg_auth_user_created on auth.users;
create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================
-- 6) ROW LEVEL SECURITY  (každý vidí len svoje/relevantné dáta)
-- ==============================================================
alter table public.profiles enable row level security;
alter table public.matches  enable row level security;
alter table public.messages enable row level security;
alter table public.payments enable row level security;

-- ---- PROFILES ----
-- Vlastný profil: plný prístup
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Cudzí profil: viditeľný len ak s ním mám match/návrh
create policy "profiles_select_matched" on public.profiles
  for select using (
    exists (
      select 1 from public.matches m
      where (m.user_low = auth.uid() and m.user_high = profiles.id)
         or (m.user_high = auth.uid() and m.user_low = profiles.id)
    )
  );

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---- MATCHES ----
create policy "matches_select_participant" on public.matches
  for select using (auth.uid() in (user_low, user_high));

create policy "matches_insert_participant" on public.matches
  for insert with check (auth.uid() in (user_low, user_high));

create policy "matches_update_participant" on public.matches
  for update using (auth.uid() in (user_low, user_high))
              with check (auth.uid() in (user_low, user_high));

-- ---- MESSAGES ----
-- Čítať správy len z konverzácie, ktorej som účastník
create policy "messages_select_participant" on public.messages
  for select using (
    exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and auth.uid() in (m.user_low, m.user_high)
    )
  );

-- Poslať správu len ako ja a len do vlastnej konverzácie
create policy "messages_insert_participant" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and auth.uid() in (m.user_low, m.user_high)
    )
  );

-- ---- PAYMENTS ----
-- Používateľ vidí a zakladá len svoje platby.
-- Stav (paid/failed) mení Stripe webhook cez service_role (obchádza RLS).
create policy "payments_select_own" on public.payments
  for select using (auth.uid() = user_id);

create policy "payments_insert_own" on public.payments
  for insert with check (auth.uid() = user_id);

-- ==============================================================
-- 7) (BONUS) Výpočet kompatibility v DB
-- Zrkadlí JS algoritmus: hodnoty 45 % + osobnosť 35 % + zámer 20 %.
-- Dá sa volať cez RPC: select public.calculate_compatibility(a, b);
-- ==============================================================
create or replace function public.calculate_compatibility(a public.profiles, b public.profiles)
returns int
language plpgsql
stable
as $$
declare
  vkeys text[] := array['rodina','kariéra','pokoj','spiritualita','osobný rast','sloboda','dobrodružstvo'];
  pkeys text[] := array['openness','conscientiousness','extraversion','agreeableness','stability'];
  k text;
  vdiff numeric := 0;
  pdiff numeric := 0;
  value_sim numeric;
  pers_sim numeric;
  intent_score numeric;
  total numeric;
begin
  -- Hodnoty: priemerný absolútny rozdiel (default 3, ak chýba)
  foreach k in array vkeys loop
    vdiff := vdiff + abs(
      coalesce((a.value_vector->>k)::numeric, 3) - coalesce((b.value_vector->>k)::numeric, 3));
  end loop;
  value_sim := 1 - (vdiff / array_length(vkeys,1)) / 4;

  -- Osobnosť
  foreach k in array pkeys loop
    pdiff := pdiff + abs(
      coalesce((a.personality->'scores'->>k)::numeric, 3) - coalesce((b.personality->'scores'->>k)::numeric, 3));
  end loop;
  pers_sim := 1 - (pdiff / array_length(pkeys,1)) / 4;

  -- Zámer
  intent_score := case
    when a.relationship_intent is null or b.relationship_intent is null then 0.6
    when a.relationship_intent = b.relationship_intent then 1
    when a.relationship_intent = 'open' or b.relationship_intent = 'open' then 0.7
    else 0.4
  end;

  total := 0.45 * value_sim + 0.35 * pers_sim + 0.20 * intent_score;
  return greatest(0, least(100, round(total * 100)));
end;
$$;
