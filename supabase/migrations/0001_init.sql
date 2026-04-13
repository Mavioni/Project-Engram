-- ════════════════════════════════════════════════════════════
-- Engram — initial schema
-- ════════════════════════════════════════════════════════════
-- Tables:
--   profiles        one-per-user, mirrors auth.users
--   iris_snapshots  append-only history of IRIS assessments
--   entries         daily check-ins (one per local day)
--   notes           free-form notes attached to an entry
--   insights        cached Claude outputs
--   chat_threads    chat-with-your-IRIS conversations
--   chat_messages   messages in those threads
--   subscriptions   Stripe subscription state per user
--
-- RLS is ON everywhere. Users can only read/write their own rows.
-- Service-role key (used by edge functions) bypasses RLS.
-- ════════════════════════════════════════════════════════════

-- ── profiles ───────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text,
  display_name text,
  timezone     text default 'UTC',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles self upsert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles self update"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── iris_snapshots ─────────────────────────────────────────
create table if not exists public.iris_snapshots (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  facet_scores     jsonb not null,
  enneagram_type   int,
  enneagram_scores jsonb,
  taken_at         timestamptz not null default now()
);

create index if not exists iris_snapshots_user_idx
  on public.iris_snapshots (user_id, taken_at desc);

alter table public.iris_snapshots enable row level security;

create policy "iris self read"
  on public.iris_snapshots for select using (auth.uid() = user_id);
create policy "iris self insert"
  on public.iris_snapshots for insert with check (auth.uid() = user_id);

-- ── entries ────────────────────────────────────────────────
create table if not exists public.entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  day        date not null,
  mood       numeric(4,3) not null,
  activities text[] not null default '{}',
  metadata   jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, day)
);

create index if not exists entries_user_day_idx
  on public.entries (user_id, day desc);

alter table public.entries enable row level security;

create policy "entries self all"
  on public.entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── notes ──────────────────────────────────────────────────
create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  entry_id   uuid references public.entries(id) on delete cascade,
  kind       text not null default 'reflection',
  text       text not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_user_created_idx
  on public.notes (user_id, created_at desc);
create index if not exists notes_entry_idx on public.notes (entry_id);

alter table public.notes enable row level security;

create policy "notes self all"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── insights ───────────────────────────────────────────────
create table if not exists public.insights (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  kind         text not null check (kind in ('daily','weekly','monthly','chat')),
  content      text not null,
  model        text,
  window_days  int,
  created_at   timestamptz not null default now()
);

create index if not exists insights_user_created_idx
  on public.insights (user_id, created_at desc);

alter table public.insights enable row level security;

create policy "insights self all"
  on public.insights for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── chat threads / messages ────────────────────────────────
create table if not exists public.chat_threads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  title      text,
  created_at timestamptz not null default now()
);

alter table public.chat_threads enable row level security;
create policy "threads self all"
  on public.chat_threads for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.chat_threads(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null check (role in ('user','assistant','system')),
  content    text not null,
  model      text,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_idx
  on public.chat_messages (thread_id, created_at);

alter table public.chat_messages enable row level security;
create policy "messages self all"
  on public.chat_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── subscriptions ──────────────────────────────────────────
create table if not exists public.subscriptions (
  user_id                uuid primary key references public.profiles(id) on delete cascade,
  tier                   text not null default 'free' check (tier in ('free','pro')),
  status                 text,                        -- 'active' | 'trialing' | 'canceled' | 'past_due' ...
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  current_period_end     timestamptz,
  ai_credits_used        int not null default 0,
  ai_credits_reset_at    timestamptz,
  updated_at             timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions self read"
  on public.subscriptions for select using (auth.uid() = user_id);
-- Writes only from edge functions (service role).

-- ── helpful views ──────────────────────────────────────────
create or replace view public.entries_with_notes as
  select
    e.*,
    coalesce(
      (select jsonb_agg(jsonb_build_object(
         'id', n.id, 'kind', n.kind, 'text', n.text, 'created_at', n.created_at
       ) order by n.created_at)
       from public.notes n where n.entry_id = e.id),
      '[]'::jsonb
    ) as notes
  from public.entries e;
