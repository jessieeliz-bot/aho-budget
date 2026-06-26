create table if not exists public.budget_state (
  household_id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.budget_state enable row level security;

drop policy if exists "Anyone can read a household budget row" on public.budget_state;
create policy "Anyone can read a household budget row"
on public.budget_state
for select
to anon
using (true);

drop policy if exists "Anyone can create a household budget row" on public.budget_state;
create policy "Anyone can create a household budget row"
on public.budget_state
for insert
to anon
with check (true);

drop policy if exists "Anyone can update a household budget row" on public.budget_state;
create policy "Anyone can update a household budget row"
on public.budget_state
for update
to anon
using (true)
with check (true);
