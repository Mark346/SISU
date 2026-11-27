-- Zoofi online, stap 2: synchroniseren van schouwen en foto's.
-- Eén keer uitvoeren in Supabase: SQL Editor -> plakken -> Run. Mag vaker; er wordt niets gewist.
-- De database zet zelf de tijd van de laatste wijziging en wie het deed; de app haalt daarmee alleen op wat nieuw is.

create or replace function public.zet_bijgewerkt() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  new.bijgewerkt := clock_timestamp();
  new.bijgewerkt_door := auth.uid();
  return new;
end $$;

drop trigger if exists schouwen_bijgewerkt on public.schouwen;
create trigger schouwen_bijgewerkt before insert or update on public.schouwen
  for each row execute function public.zet_bijgewerkt();

drop trigger if exists fotos_bijgewerkt on public.fotos;
create trigger fotos_bijgewerkt before insert or update on public.fotos
  for each row execute function public.zet_bijgewerkt();
