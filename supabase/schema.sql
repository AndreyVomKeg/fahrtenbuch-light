-- Fahrtenbuch Light - Supabase Schema

create table if not exists fahrten (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  datum date not null,
  von text not null,
  nach text not null,
  km numeric(10,2) not null default 0,
  zweck text check (zweck in ('geschaeftlich', 'privat')) default 'geschaeftlich',
  fahrzeug text,
  notiz text,
  created_at timestamptz default now()
);

create table if not exists ausgaben (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  datum date not null,
  kategorie text not null,
  betrag numeric(10,2) not null default 0,
  fahrzeug text,
  notiz text,
  created_at timestamptz default now()
);

create table if not exists fahrzeuge (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  name text not null,
  kennzeichen text,
  created_at timestamptz default now()
);

-- RLS
alter table fahrten enable row level security;
alter table ausgaben enable row level security;
alter table fahrzeuge enable row level security;

create policy "Users see own fahrten" on fahrten for all using (auth.uid() = user_id);
create policy "Users see own ausgaben" on ausgaben for all using (auth.uid() = user_id);
create policy "Users see own fahrzeuge" on fahrzeuge for all using (auth.uid() = user_id);
