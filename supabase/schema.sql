-- Game Night Picker — ratings table
-- Run this in the Supabase SQL editor: https://app.supabase.com/project/_/sql

create table if not exists ratings (
  id          uuid        default gen_random_uuid() primary key,
  steam_id    text        not null,
  app_id      bigint      not null,
  game_name   text,
  rating      smallint    not null check (rating >= 1 and rating <= 10),
  updated_at  timestamptz default now(),

  constraint ratings_steam_id_app_id_key unique (steam_id, app_id)
);

-- Indexes for the two query patterns used by the API
create index if not exists ratings_steam_id_idx on ratings (steam_id);
create index if not exists ratings_app_id_idx   on ratings (app_id);

-- Row-level security (service-role key used by the server bypasses RLS,
-- but enabling it prevents accidental direct-client exposure)
alter table ratings enable row level security;
