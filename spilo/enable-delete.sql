-- Turn on the Remove button in the dashboard.
-- Run this ONCE in Supabase: SQL Editor -> New query -> paste ALL of it -> Run.
-- Safe to run more than once.
--
-- READ THIS FIRST.
--
-- leads-table.sql deliberately left DELETE switched off, so that nothing,
-- including you, could erase a lead through the website. That was the safe
-- default. This file undoes it on purpose.
--
-- After you run this there is no trash and no undo. A removed lead is gone.
-- If what you actually want is to clear a lead out of your list while keeping
-- the record, set its status to Dead in the dashboard instead. Dead leads are
-- hidden from every view except the Dead and All tabs, and you can always
-- change your mind.
--
-- Only accounts in app_admins can delete. Merely being signed in is not
-- enough, same as reading.

drop policy if exists "admin can delete leads" on public.leads;

create policy "admin can delete leads"
  on public.leads for delete to authenticated
  using (public.is_admin());

grant delete on public.leads to authenticated;

-- PostgREST caches the schema. Without this the API can keep refusing the
-- delete even though the policy now exists.
notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------
-- Confirmation. This should print, and it should list only you.
-- ---------------------------------------------------------------------

select 'can now remove leads: ' || coalesce(email, user_id::text) as who
from public.app_admins;
