-- Upgrade an existing Aether project from the first prototype schema.
alter table public.profiles add column if not exists birth_date date;
alter table public.developer_applications add column if not exists birth_date date;
alter table public.developer_applications alter column declared_age drop not null;
alter table public.game_submissions add column if not exists package_path text;
alter table public.game_submissions add column if not exists executable_path text;
alter table public.game_submissions add column if not exists package_manifest jsonb not null default '{}'::jsonb;
alter table public.game_submissions alter column game_path drop not null;
alter table public.game_submissions alter column source_path drop not null;
alter table public.games add column if not exists executable_path text;
alter table public.games add column if not exists status text not null default 'approved';
alter table public.games add column if not exists cover_url text;
alter table public.games add column if not exists package_manifest jsonb not null default '{}'::jsonb;
drop policy if exists "apply own once" on public.developer_applications;
create policy "apply own once" on public.developer_applications for insert with check(user_id=auth.uid() and birth_date is not null and birth_date<=current_date - interval '18 years');
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare b date;
begin
  b:=nullif(new.raw_user_meta_data->>'birth_date','')::date;
  if b is null or b>current_date - interval '13 years' then
    raise exception 'Aether accounts require a date of birth showing you are at least 13.';
  end if;
  insert into public.profiles(id,birth_date,age_attested) values(new.id,b,true);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
update storage.buckets set public=false,file_size_limit=1073741824,allowed_mime_types=null where id='game-submissions';

insert into storage.buckets(id,name,public,file_size_limit) values('published-games','published-games',true,1073741824) on conflict(id) do update set public=true,file_size_limit=1073741824;
