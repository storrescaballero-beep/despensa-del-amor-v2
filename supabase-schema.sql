-- =============================================
-- LA DESPENSA DEL AMOR v2 — Supabase SQL Schema
-- Ejecuta esto en Supabase > SQL Editor > Run
-- =============================================

-- Items de la lista de la compra
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'otros',
  quantity integer not null default 1,
  done boolean not null default false,
  added_by text not null default 'yo',
  created_at timestamptz default now()
);

-- Menús semanales guardados
create table if not exists menus (
  id uuid primary key default gen_random_uuid(),
  week_data jsonb not null,
  created_at timestamptz default now()
);

-- Perfil de rutinas y preferencias
create table if not exists rutinas (
  id uuid primary key default gen_random_uuid(),
  perfil jsonb not null,
  updated_at timestamptz default now()
);

-- Habilitar Realtime
alter publication supabase_realtime add table items;

-- Políticas de acceso
alter table items enable row level security;
alter table menus enable row level security;
alter table rutinas enable row level security;

create policy "allow all items" on items for all using (true) with check (true);
create policy "allow all menus" on menus for all using (true) with check (true);
create policy "allow all rutinas" on rutinas for all using (true) with check (true);
