-- spilo.xyz CRM upgrade
-- Run this ONCE in Supabase: SQL Editor -> New query -> paste ALL of it -> Run.
-- Safe to run more than once. Nothing here drops or rewrites existing data.
--
-- Everything below is ADDITIVE. Every lead you already have keeps working,
-- with the new columns sitting null until you fill them in.
--
-- Run leads-table.sql first if you have not. This file assumes public.leads
-- and public.is_admin() already exist.
--
-- The last SELECT prints a confirmation. If you do not see it, you only ran
-- part of the file. Select all, rerun.

-- ---------------------------------------------------------------------
-- 1. New columns on the contact record
-- ---------------------------------------------------------------------

alter table public.leads add column if not exists next_action       text;
alter table public.leads add column if not exists next_action_date  date;
alter table public.leads add column if not exists last_touch        timestamptz;
alter table public.leads add column if not exists segment           text;
alter table public.leads add column if not exists segment_manual    boolean not null default false;
alter table public.leads add column if not exists my_read           text;
alter table public.leads add column if not exists my_read_note      text;
alter table public.leads add column if not exists archived          boolean not null default false;
alter table public.leads add column if not exists do_not_contact    boolean not null default false;
alter table public.leads add column if not exists dnc_registry      boolean not null default false;
alter table public.leads add column if not exists seq_step          smallint not null default 0;

alter table public.leads drop constraint if exists leads_segment_ck;
alter table public.leads add  constraint leads_segment_ck
  check (segment is null or segment in ('A','B','C','D','E'));

alter table public.leads drop constraint if exists leads_my_read_ck;
alter table public.leads add  constraint leads_my_read_ck
  check (my_read is null or my_read in ('hot','warm','cold'));

-- The due-today view reads this every time it opens. Partial index so it
-- only carries the rows that can actually come due.
create index if not exists leads_next_action_idx
  on public.leads (next_action_date)
  where next_action_date is not null and archived = false;

create index if not exists leads_segment_idx on public.leads (segment) where archived = false;

-- ---------------------------------------------------------------------
-- 2. Touch log
-- ---------------------------------------------------------------------

create table if not exists public.touches (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  contact_id  uuid not null references public.leads(id) on delete cascade,
  date        timestamptz not null default now(),
  channel     text not null,
  outcome     text not null,
  note        text
);

alter table public.touches drop constraint if exists touches_channel_ck;
alter table public.touches add  constraint touches_channel_ck
  check (channel in ('call','text','email','door','mail','in_person'));

alter table public.touches drop constraint if exists touches_outcome_ck;
alter table public.touches add  constraint touches_outcome_ck
  check (outcome in ('connected','no_answer','left_voicemail','sent','bounced','replied'));

alter table public.touches drop constraint if exists touches_note_len;
alter table public.touches add  constraint touches_note_len
  check (char_length(coalesce(note, '')) <= 2000);

create index if not exists touches_contact_idx on public.touches (contact_id, date desc);
create index if not exists touches_date_idx    on public.touches (date desc);

-- last_touch is derived, so keep it derived. A trigger means it cannot drift
-- no matter what writes the touch.
create or replace function public.bump_last_touch()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.leads
     set last_touch = greatest(coalesce(last_touch, 'epoch'::timestamptz), new.date)
   where id = new.contact_id;
  return new;
end;
$$;

drop trigger if exists touches_bump_last_touch on public.touches;
create trigger touches_bump_last_touch
  after insert on public.touches
  for each row execute function public.bump_last_touch();

-- Backfill for anyone importing history from a JSON backup.
update public.leads l
   set last_touch = t.max_date
  from (select contact_id, max(date) as max_date from public.touches group by contact_id) t
 where t.contact_id = l.id
   and (l.last_touch is null or l.last_touch < t.max_date);

-- ---------------------------------------------------------------------
-- 3. Templates
-- ---------------------------------------------------------------------

create table if not exists public.templates (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  slug        text unique,
  name        text not null,
  channel     text not null default 'text',
  subject     text,
  body        text not null default '',
  sort        smallint not null default 0
);

alter table public.templates drop constraint if exists templates_channel_ck;
alter table public.templates add  constraint templates_channel_ck
  check (channel in ('text','email','mail','call'));

-- ---------------------------------------------------------------------
-- 4. Drip sequences, one row per segment, steps as editable JSON
-- ---------------------------------------------------------------------

create table if not exists public.sequences (
  segment     text primary key,
  steps       jsonb not null default '[]'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.sequences drop constraint if exists sequences_segment_ck;
alter table public.sequences add  constraint sequences_segment_ck
  check (segment in ('A','B','C','D','E'));

-- ---------------------------------------------------------------------
-- 5. Farm parcels. Separate from contacts on purpose. These people never
--    gave you anything, so they are not leads and must not act like leads.
-- ---------------------------------------------------------------------

create table if not exists public.parcels (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  parcel_number     text,
  property_address  text,
  street            text,
  house_number      text,
  assessed_value    numeric,
  assessed_acres    numeric,
  owner_name        text,
  mailing_address   text,
  knocked           boolean not null default false,
  knocked_date      date,
  contact_captured  boolean not null default false,
  contact_id        uuid references public.leads(id) on delete set null,
  notes             text
);

create index if not exists parcels_street_idx on public.parcels (street, house_number);

-- absentee is derived, not stored, so it cannot go stale when a mailing
-- address is corrected. This view is here for the record and for SQL use.
create or replace view public.parcels_absentee as
  select *,
         case
           when mailing_address is null or property_address is null then null
           else lower(regexp_replace(mailing_address, '[^a-z0-9]', '', 'gi'))
                not like lower(regexp_replace(property_address, '[^a-z0-9]', '', 'gi')) || '%'
         end as absentee
    from public.parcels;

-- ---------------------------------------------------------------------
-- 6. Row Level Security on everything new
--
--    None of these tables are public. The open house sign in sheet writes
--    to public.leads and nothing else, so anon gets no access at all here.
-- ---------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array['touches','templates','sequences','parcels']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);

    -- Clear old policies by name so a leftover permissive one cannot survive.
    -- Policies are OR'd, so one stale "using (true)" would undo the rest.
    execute (
      select coalesce(string_agg(format('drop policy %I on public.%I;', policyname, t), ' '), '')
        from pg_policies where schemaname = 'public' and tablename = t
    );

    execute format($f$
      create policy "admin reads %1$s"   on public.%1$I for select to authenticated using (public.is_admin());
      create policy "admin adds %1$s"    on public.%1$I for insert to authenticated with check (public.is_admin());
      create policy "admin updates %1$s" on public.%1$I for update to authenticated using (public.is_admin()) with check (public.is_admin());
      create policy "admin deletes %1$s" on public.%1$I for delete to authenticated using (public.is_admin());
    $f$, t);

    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- The view inherits the underlying table's RLS, but lock the grant anyway.
revoke all on public.parcels_absentee from anon, authenticated;
grant select on public.parcels_absentee to authenticated;

-- ---------------------------------------------------------------------
-- 7. Grants for the new lead columns
--
--    The anon insert grant in leads-table.sql names its columns one by one,
--    which means the sign in sheet CANNOT write any of the columns added
--    above. A guest cannot set their own segment, clear a do-not-contact
--    flag, or hand themselves a next action date. Leave it that way.
-- ---------------------------------------------------------------------

grant select, insert, update on public.leads to authenticated;

-- ---------------------------------------------------------------------
-- 8. Backfill: nothing may exist without a next action date
--
--    Every open lead you already have gets flagged due today, so the first
--    time you open the new Today tab you see the backlog instead of an
--    empty screen that lies to you.
-- ---------------------------------------------------------------------

update public.leads
   set next_action      = coalesce(next_action, 'First contact, never been reached'),
       next_action_date = coalesce(next_action_date, current_date)
 where archived = false
   and status <> 'dead'
   and next_action_date is null
   -- Anyone represented by another agent is skipped here on purpose. The
   -- dashboard puts them on their own six month review instead, so opening
   -- the Today tab does not hand you a pile of people you are not allowed
   -- to contact.
   and has_agent is distinct from true;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- 9. Confirmation. This should print.
-- ---------------------------------------------------------------------

select 'upgrade done. '
       || (select count(*) from public.leads)   || ' leads, '
       || (select count(*) from public.touches) || ' touches, '
       || (select count(*) from public.parcels) || ' parcels, '
       || (select count(*) from public.leads where next_action_date is not null) || ' with a next action.'
       as result;
