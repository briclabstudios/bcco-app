-- Archivage des actualités : masquage du fil sans suppression en base
alter table public.news_posts
  add column if not exists archive boolean not null default false;
