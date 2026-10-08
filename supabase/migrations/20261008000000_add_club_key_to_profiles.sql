-- Champ "Je possède la clé du club" (oui/non) sur le profil d'un membre
alter table public.profiles
  add column if not exists has_club_key boolean not null default false;
