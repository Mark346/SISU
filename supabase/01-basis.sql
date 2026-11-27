-- Zoofi online, stap 1: bedrijven, leden met rollen, uitnodigingen, schouwen en foto's.
-- Eén keer uitvoeren in Supabase: SQL Editor -> New query -> plakken -> Run.
-- Iedereen ziet alleen de gegevens van zijn eigen bedrijf (Row Level Security).
-- Rollen: beheerder (hele app, tabel beheerders), beheerder_bedrijf en gebruiker (per bedrijf, tabel leden).

create extension if not exists pgcrypto;

create table if not exists public.bedrijven(
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  gemaakt timestamptz not null default now());

create table if not exists public.beheerders(
  user_id uuid primary key references auth.users(id) on delete cascade);

create table if not exists public.leden(
  user_id uuid not null references auth.users(id) on delete cascade,
  bedrijf_id uuid not null references public.bedrijven(id) on delete cascade,
  rol text not null check (rol in ('beheerder_bedrijf','gebruiker')),
  email text,
  gemaakt timestamptz not null default now(),
  primary key(user_id,bedrijf_id));

create table if not exists public.uitnodigingen(
  code text primary key,
  bedrijf_id uuid not null references public.bedrijven(id) on delete cascade,
  rol text not null check (rol in ('beheerder_bedrijf','gebruiker')),
  gemaakt_door uuid references auth.users(id) on delete set null,
  gemaakt timestamptz not null default now(),
  verloopt timestamptz not null default now()+interval '7 days',
  gebruikt_door uuid references auth.users(id) on delete set null,
  gebruikt_op timestamptz);

-- schouwen en foto's: de app bewaart haar eigen gegevens als JSON; plaatjes staan in de opslag 'fotos'
create table if not exists public.schouwen(
  id text primary key,
  bedrijf_id uuid not null references public.bedrijven(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  bijgewerkt timestamptz not null default now(),
  bijgewerkt_door uuid references auth.users(id) on delete set null,
  verwijderd boolean not null default false);
create index if not exists schouwen_bedrijf on public.schouwen(bedrijf_id,bijgewerkt);

create table if not exists public.fotos(
  id text primary key,
  schouw_id text not null,
  bedrijf_id uuid not null references public.bedrijven(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  pad text,
  bijgewerkt timestamptz not null default now(),
  bijgewerkt_door uuid references auth.users(id) on delete set null,
  verwijderd boolean not null default false);
create index if not exists fotos_bedrijf on public.fotos(bedrijf_id,bijgewerkt);
create index if not exists fotos_schouw on public.fotos(schouw_id);

-- ---------- hulpfuncties voor de regels ----------
create or replace function public.is_beheerder() returns boolean
language sql stable security definer set search_path=public as
$$ select exists(select 1 from beheerders where user_id=auth.uid()) $$;

create or replace function public.is_lid(b uuid) returns boolean
language sql stable security definer set search_path=public as
$$ select public.is_beheerder() or exists(select 1 from leden where user_id=auth.uid() and bedrijf_id=b) $$;

create or replace function public.is_bedrijfsbeheerder(b uuid) returns boolean
language sql stable security definer set search_path=public as
$$ select public.is_beheerder() or exists(select 1 from leden where user_id=auth.uid() and bedrijf_id=b and rol='beheerder_bedrijf') $$;

-- ---------- regels (Row Level Security) ----------
alter table public.bedrijven enable row level security;
alter table public.beheerders enable row level security;
alter table public.leden enable row level security;
alter table public.uitnodigingen enable row level security;
alter table public.schouwen enable row level security;
alter table public.fotos enable row level security;

drop policy if exists bedrijven_lezen on public.bedrijven;
create policy bedrijven_lezen on public.bedrijven for select to authenticated using (public.is_lid(id));
drop policy if exists bedrijven_maken on public.bedrijven;
create policy bedrijven_maken on public.bedrijven for insert to authenticated with check (public.is_beheerder());
drop policy if exists bedrijven_wijzigen on public.bedrijven;
create policy bedrijven_wijzigen on public.bedrijven for update to authenticated using (public.is_bedrijfsbeheerder(id)) with check (public.is_bedrijfsbeheerder(id));
drop policy if exists bedrijven_verwijderen on public.bedrijven;
create policy bedrijven_verwijderen on public.bedrijven for delete to authenticated using (public.is_beheerder());

drop policy if exists beheerders_lezen on public.beheerders;
create policy beheerders_lezen on public.beheerders for select to authenticated using (user_id=auth.uid() or public.is_beheerder());

drop policy if exists leden_lezen on public.leden;
create policy leden_lezen on public.leden for select to authenticated using (public.is_lid(bedrijf_id));
drop policy if exists leden_beheren on public.leden;
create policy leden_beheren on public.leden for all to authenticated using (public.is_bedrijfsbeheerder(bedrijf_id)) with check (public.is_bedrijfsbeheerder(bedrijf_id));

drop policy if exists uitnodigingen_beheren on public.uitnodigingen;
create policy uitnodigingen_beheren on public.uitnodigingen for all to authenticated using (public.is_bedrijfsbeheerder(bedrijf_id)) with check (public.is_bedrijfsbeheerder(bedrijf_id));

drop policy if exists schouwen_bedrijf on public.schouwen;
create policy schouwen_bedrijf on public.schouwen for all to authenticated using (public.is_lid(bedrijf_id)) with check (public.is_lid(bedrijf_id));
drop policy if exists fotos_bedrijf on public.fotos;
create policy fotos_bedrijf on public.fotos for all to authenticated using (public.is_lid(bedrijf_id)) with check (public.is_lid(bedrijf_id));

-- alleen ingelogde gebruikers; niets voor anoniem
revoke all on public.bedrijven,public.beheerders,public.leden,public.uitnodigingen,public.schouwen,public.fotos from anon;
grant select,insert,update,delete on public.bedrijven,public.leden,public.uitnodigingen,public.schouwen,public.fotos to authenticated;
grant select on public.beheerders to authenticated;

-- ---------- acties ----------
-- De eerste gebruiker die dit aanroept wordt de beheerder van de hele app (daarna kan het niet meer).
create or replace function public.word_beheerder() returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then return false; end if;
  if exists(select 1 from beheerders) then return exists(select 1 from beheerders where user_id=auth.uid()); end if;
  insert into beheerders(user_id) values(auth.uid());
  return true;
end $$;

-- Uitnodiging gebruiken: maakt je lid van het bedrijf met de rol uit de uitnodiging. Eén keer te gebruiken, 7 dagen geldig.
create or replace function public.accepteer_uitnodiging(p_code text) returns uuid
language plpgsql security definer set search_path=public as $$
declare u uitnodigingen; mail text;
begin
  if auth.uid() is null then raise exception 'Niet ingelogd'; end if;
  select * into u from uitnodigingen where code=upper(trim(p_code)) for update;
  if not found then raise exception 'Deze uitnodiging bestaat niet'; end if;
  if u.gebruikt_door is not null and u.gebruikt_door<>auth.uid() then raise exception 'Deze uitnodiging is al gebruikt'; end if;
  if u.verloopt<now() then raise exception 'Deze uitnodiging is verlopen'; end if;
  select email into mail from auth.users where id=auth.uid();
  insert into leden(user_id,bedrijf_id,rol,email) values(auth.uid(),u.bedrijf_id,u.rol,mail)
    on conflict (user_id,bedrijf_id) do update set rol=excluded.rol,email=excluded.email;
  update uitnodigingen set gebruikt_door=auth.uid(),gebruikt_op=now() where code=u.code;
  return u.bedrijf_id;
end $$;

-- Wie mag welke uitnodiging zien zonder lid te zijn: alleen de bedrijfsnaam, voor de begroeting
create or replace function public.uitnodiging_info(p_code text) returns table(bedrijf text, rol text, geldig boolean)
language sql stable security definer set search_path=public as
$$ select b.naam,u.rol,(u.gebruikt_door is null and u.verloopt>now()) from uitnodigingen u join bedrijven b on b.id=u.bedrijf_id where u.code=upper(trim(p_code)) $$;

revoke all on function public.word_beheerder(),public.accepteer_uitnodiging(text),public.uitnodiging_info(text) from public,anon;
grant execute on function public.word_beheerder(),public.accepteer_uitnodiging(text),public.uitnodiging_info(text),
  public.is_beheerder(),public.is_lid(uuid),public.is_bedrijfsbeheerder(uuid) to authenticated;

-- ---------- opslag voor foto's: map per bedrijf (bedrijf_id/...) ----------
insert into storage.buckets(id,name,public) values('fotos','fotos',false) on conflict (id) do nothing;
drop policy if exists fotos_opslag on storage.objects;
create policy fotos_opslag on storage.objects for all to authenticated
  using (bucket_id='fotos' and public.is_lid(((storage.foldername(name))[1])::uuid))
  with check (bucket_id='fotos' and public.is_lid(((storage.foldername(name))[1])::uuid));
