-- spilo.xyz open house leads
-- Run this ONCE in Supabase: SQL Editor -> New query -> paste ALL of it -> Run.
-- Safe to run more than once.
--
-- The last two SELECTs print who has access and whether the table is ready.
-- If you do not see those rows, you only ran part of the file. Select all, rerun.
--
-- ALSO DO THIS, it matters more than the SQL:
--   Supabase dashboard -> Authentication -> Sign In / Providers -> Email
--   -> turn OFF "Allow new users to sign up".
-- Public signup is currently ON. The publishable key is visible in the page
-- source of /leads, so with signup on, a stranger can register their own
-- account and become "authenticated". The policies below no longer trust
-- "authenticated" on its own, but turning signup off closes the whole class.

-- ---------------------------------------------------------------------
-- 1. Who counts as you
-- ---------------------------------------------------------------------

create table if not exists public.app_admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  email    text,
  added_at timestamptz not null default now()
);

-- Nobody reaches this table through the API. Only the SQL editor.
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;

-- Seed with every account that exists RIGHT NOW. If you have only ever made
-- your own login, that is just you. Check the printout at the bottom.
insert into public.app_admins (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

-- security definer so it can read app_admins even though the caller cannot.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.app_admins a where a.user_id = auth.uid());
$$;

revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------
-- 2. The leads table
-- ---------------------------------------------------------------------

create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  name            text not null,
  phone           text,
  email           text,
  property        text,
  timeline        text,
  timeline_months smallint,
  has_agent       boolean,
  financing       text,
  notes           text,          -- what the guest typed
  agent_notes     text,          -- your follow-up notes, added in /leads
  status          text not null default 'new',
  source          text not null default 'open house'
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_property_idx   on public.leads (property);

-- Size limits. The sign in sheet is open to the public, so cap what a
-- stranger can stuff into it.
alter table public.leads drop constraint if exists leads_sane_lengths;
alter table public.leads add  constraint leads_sane_lengths check (
  char_length(name)              between 1 and 120
  and char_length(coalesce(phone, ''))     <= 40
  and char_length(coalesce(email, ''))     <= 200
  and char_length(coalesce(property, ''))  <= 200
  and char_length(coalesce(timeline, ''))  <= 40
  and char_length(coalesce(financing, '')) <= 60
  and char_length(coalesce(notes, ''))     <= 2000
  and char_length(coalesce(source, ''))    <= 40
);

-- ---------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------

alter table public.leads enable row level security;

-- Drop every existing policy on the table by name, so an older permissive
-- one cannot survive and quietly keep granting access. Policies are OR'd,
-- so a leftover "to authenticated using (true)" would undo everything below.
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'leads'
  loop
    execute format('drop policy %I on public.leads', p.policyname);
  end loop;
end $$;

-- Open house guests: write only, never read, and only as themselves.
create policy "guests can add a lead"
  on public.leads for insert to anon with check (true);

-- You: full access, but only if you are in app_admins. Merely being
-- signed in is not enough.
create policy "admin can read leads"
  on public.leads for select to authenticated using (public.is_admin());

create policy "admin can update leads"
  on public.leads for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admin can add leads"
  on public.leads for insert to authenticated with check (public.is_admin());

-- Deliberately no DELETE policy anywhere. Nothing can delete a lead
-- through the API, including you. Use the SQL editor if you ever need to.

-- ---------------------------------------------------------------------
-- 4. Table grants, underneath RLS
-- ---------------------------------------------------------------------

revoke all on public.leads from anon, authenticated;

-- Guests may only fill in the guest-facing columns. They cannot set id,
-- created_at, status, or your private agent_notes.
grant insert (name, phone, email, property, timeline, timeline_months,
              has_agent, financing, notes, source)
  on public.leads to anon;

grant select, insert, update on public.leads to authenticated;

-- PostgREST caches the schema. Without this the API can keep answering
-- "Could not find the table 'public.leads' in the schema cache".
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- 5. Confirmation. Both of these should print.
-- ---------------------------------------------------------------------

-- Everyone who can see your leads. This should be you and nobody else.
select 'has access: ' || coalesce(email, user_id::text) as who from public.app_admins;

select 'leads table is ready, ' || count(*) || ' rows so far' as result from public.leads;
