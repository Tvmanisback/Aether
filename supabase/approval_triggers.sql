-- Run after schema.sql. Generates each approved developer's random public integration key on the backend.
create or replace function public.promote_approved_developer() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.status='approved' and old.status is distinct from 'approved' then
    update public.profiles
    set role=case when role='player' then 'developer' else role end,
        developer_public_key=coalesce(developer_public_key,'aether_pk_'||encode(gen_random_bytes(32),'hex'))
    where id=new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists on_developer_application_approved on public.developer_applications;
create trigger on_developer_application_approved
after update of status on public.developer_applications
for each row execute procedure public.promote_approved_developer();
