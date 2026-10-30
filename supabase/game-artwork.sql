-- Aether game artwork and title typography
alter table public.games add column if not exists banner_url text;
alter table public.games add column if not exists title_font text not null default 'Space Grotesk';
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('aether-game-artwork','aether-game-artwork',true,8388608,array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/png','image/jpeg','image/webp'];
drop policy if exists "Public can view Aether game artwork" on storage.objects;
create policy "Public can view Aether game artwork" on storage.objects for select using (bucket_id='aether-game-artwork');
drop policy if exists "Developers upload own Aether game artwork" on storage.objects;
create policy "Developers upload own Aether game artwork" on storage.objects for insert to authenticated with check (bucket_id='aether-game-artwork' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "Developers update own Aether game artwork" on storage.objects;
create policy "Developers update own Aether game artwork" on storage.objects for update to authenticated using (bucket_id='aether-game-artwork' and (storage.foldername(name))[1]=auth.uid()::text) with check (bucket_id='aether-game-artwork' and (storage.foldername(name))[1]=auth.uid()::text);
