-- Only John can have an account. Already run on 2026-08-27.
--
-- Why this exists: the Supabase dashboard toggle "Allow new users to sign up"
-- would not save. Clicked off, UI showed off, reverted to on after a reload,
-- twice, with no error. So the block is done in the database instead, where
-- the dashboard cannot quietly undo it. Nothing can create an auth user while
-- this trigger exists, whatever the dashboard says.
--
-- TO ALLOW A NEW ACCOUNT LATER:
--   drop trigger no_new_signups on auth.users;
--   ... create the user in Authentication > Users ...
--   then run this file again to put the block back.

create or replace function public.block_new_signups()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  raise exception 'Sign ups are disabled for this project.';
end;
$$;

drop trigger if exists no_new_signups on auth.users;
create trigger no_new_signups
  before insert on auth.users
  for each row execute function public.block_new_signups();

select
  (select count(*) from pg_trigger t
     where t.tgname = 'no_new_signups' and not t.tgisinternal) as block_installed,
  (select case tgenabled when 'O' then 'enabled' else tgenabled::text end
     from pg_trigger where tgname = 'no_new_signups' and not tgisinternal) as block_status,
  (select count(*) from auth.users) as accounts_that_exist,
  (select string_agg(email, ' | ') from auth.users) as the_only_account;
