-- OPTIONAL, but you should run it. Same lock, applied to your listings.
-- Run leads-table.sql FIRST, this depends on the is_admin() function it makes.
--
-- Why: listings has been "public read, any authenticated user can write"
-- since July. With public signup on, a stranger could register an account
-- and edit or delete your listings. Public read stays, because the
-- /listings page needs it. Writing becomes yours only.

-- Sanity check: stop early with a clear message if is_admin() is missing.
do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'Run leads-table.sql first, it creates is_admin().';
  end if;
end $$;

alter table public.listings enable row level security;

-- Clear every existing policy by name. Policies are OR'd together, so a
-- leftover permissive one would quietly undo the tightening below.
do $$
declare p record;
begin
  for p in select policyname from pg_policies
           where schemaname = 'public' and tablename = 'listings'
  loop
    execute format('drop policy %I on public.listings', p.policyname);
  end loop;
end $$;

-- Anyone may read: this is what fills the public /listings page.
create policy "anyone can read listings"
  on public.listings for select to anon, authenticated using (true);

-- Only you may change them.
create policy "admin can add listings"
  on public.listings for insert to authenticated with check (public.is_admin());

create policy "admin can update listings"
  on public.listings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admin can delete listings"
  on public.listings for delete to authenticated using (public.is_admin());

revoke all on public.listings from anon, authenticated;
grant select                         on public.listings to anon;
grant select, insert, update, delete on public.listings to authenticated;

notify pgrst, 'reload schema';

select 'listings locked down, ' || count(*) || ' listings' as result from public.listings;

-- ---------------------------------------------------------------------
-- One thing left that SQL should not touch blind: the photo bucket.
-- Storage policies are shared across buckets, so dropping them from here
-- risks breaking something unrelated.
--
-- Do it in the dashboard instead:
--   Storage -> Policies -> listing-photos
-- Public SELECT is fine, the photos are meant to be seen. Any INSERT,
-- UPDATE, or DELETE policy that applies to "authenticated" should be
-- changed to also require:  public.is_admin()
-- ---------------------------------------------------------------------
