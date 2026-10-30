-- Run after schema.sql. Promotes a developer account only after an admin approves its application.
create or replace function public.promote_approved_developer() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if new.status='approved' and old.status is distinct from 'approved' then
    update public.profiles set role='developer' where id=new.user_id and role='player';
  end if;
  return new;
end $$;
drop trigger if exists on_developer_application_approved on public.developer_applications;
create trigger on_developer_application_approved
after update of status on public.developer_applications
for each row execute procedure public.promote_approved_developer();
