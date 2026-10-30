-- Aether game management, age ratings, and reviewed game updates.
-- Run this once in the Supabase SQL Editor after the existing schema.
alter table public.games add column if not exists age_rating text not null default '13+';
alter table public.games add column if not exists version text not null default '1.0.0';
alter table public.game_submissions add column if not exists age_rating text not null default '13+';
alter table public.game_submissions add column if not exists version text not null default '1.0.0';
alter table public.games drop constraint if exists games_age_rating_check;
alter table public.games add constraint games_age_rating_check check (age_rating in ('13+','16+','18+'));
alter table public.game_submissions drop constraint if exists game_submissions_age_rating_check;
alter table public.game_submissions add constraint game_submissions_age_rating_check check (age_rating in ('13+','16+','18+'));
create table if not exists public.game_update_submissions (
 id uuid primary key default gen_random_uuid(),
 game_id uuid not null references public.games(id) on delete cascade,
 developer_id uuid not null references auth.users(id) on delete cascade,
 version text not null,
 package_path text not null,
 executable_path text not null,
 package_manifest jsonb not null default '{}'::jsonb,
 status text not null default 'pending_human_review' check(status in ('pending_human_review','approved','rejected')),
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
alter table public.game_update_submissions enable row level security;
create policy "developers submit updates for owned games" on public.game_update_submissions for insert
 with check(developer_id=auth.uid() and exists(select 1 from public.games g where g.id=game_id and g.developer_id=auth.uid() and g.status='approved') and status='pending_human_review');
create policy "owners and admins read update submissions" on public.game_update_submissions for select
 using(developer_id=auth.uid() or public.is_admin());
create policy "admins review game updates" on public.game_update_submissions for update
 using(public.is_admin()) with check(public.is_admin());

create or replace function public.aether_user_age()
returns integer language sql stable security definer set search_path=public as $$
 select case when p.birth_date is null then null else
  extract(year from age(current_date,p.birth_date))::integer end
 from public.profiles p where p.id=auth.uid()
$$;
create or replace function public.aether_can_view_rating(rating text)
returns boolean language sql stable security definer set search_path=public as $$
 select coalesce(
  (rating='13+' and public.aether_user_age()>=13) or
  (rating='16+' and public.aether_user_age()>=16) or
  (rating='18+' and public.aether_user_age()>=18), false)
$$;
drop policy if exists "approved games public" on public.games;
create policy "approved games visible by declared age" on public.games for select
 using(status='approved' and public.aether_can_view_rating(age_rating));
