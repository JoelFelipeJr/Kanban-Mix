-- Drop existing objects to reset cleanly
drop table if exists comments cascade;
drop table if exists useful_links cascade;
drop table if exists card_assignees cascade;
drop table if exists cards cascade;
drop table if exists swimlanes cascade;
drop table if exists columns cascade;
drop table if exists board_members cascade;
drop table if exists boards cascade;
drop table if exists profiles cascade;
drop type if exists board_role cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ROLES ENUM
create type board_role as enum ('admin', 'member', 'reader');

-- PROFILES (Users)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  role text,
  avatar text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BOARDS
create table boards (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BOARD MEMBERS (For sharing boards)
create table board_members (
  board_id uuid references boards on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  role board_role not null default 'member',
  primary key (board_id, user_id)
);

-- COLUMNS
create table columns (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references boards on delete cascade not null,
  name text not null,
  "order" integer not null default 0
);

-- SWIMLANES
create table swimlanes (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references boards on delete cascade not null,
  name text not null,
  "order" integer not null default 0
);

-- CARDS
create table cards (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references boards on delete cascade not null,
  column_id uuid references columns on delete cascade not null,
  swimlane_id uuid references swimlanes on delete set null,
  parent_id uuid references cards on delete set null,
  title text not null,
  content text,
  type text default 'TSK',
  "order" integer not null default 0,
  priority text default 'medium',
  tags jsonb default '[]'::jsonb,
  start_date timestamp with time zone,
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- CARD ASSIGNEES
create table card_assignees (
  card_id uuid references cards on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  primary key (card_id, user_id)
);

-- LINKS
create table useful_links (
  id uuid default uuid_generate_v4() primary key,
  board_id uuid references boards on delete cascade not null,
  title text not null,
  url text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COMMENTS
create table comments (
  id uuid default uuid_generate_v4() primary key,
  card_id uuid references cards on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  author_name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Row Level Security) Policies
alter table profiles enable row level security;
alter table boards enable row level security;
alter table board_members enable row level security;
alter table columns enable row level security;
alter table swimlanes enable row level security;
alter table cards enable row level security;
alter table card_assignees enable row level security;
alter table useful_links enable row level security;
alter table comments enable row level security;

-- Policies for Profiles
create policy "Public profiles are viewable by everyone." on profiles for select using (true);
create policy "Users can insert their own profile." on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on profiles for update using (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper functions for RLS to avoid infinite recursion
create or replace function public.is_board_owner(b_id uuid)
returns boolean as $$
  select exists(select 1 from boards where id = b_id and owner_id = auth.uid());
$$ language sql security definer;

create or replace function public.is_board_member(b_id uuid)
returns boolean as $$
  select exists(select 1 from board_members where board_id = b_id and user_id = auth.uid());
$$ language sql security definer;

create or replace function public.is_board_admin(b_id uuid)
returns boolean as $$
  select exists(select 1 from board_members where board_id = b_id and user_id = auth.uid() and role = 'admin');
$$ language sql security definer;

-- Policies for Boards
create policy "Users can view boards" on boards for select using (
  auth.uid() = owner_id or is_board_member(id)
);
create policy "Users can create boards" on boards for insert with check (auth.uid() = owner_id);
create policy "Users can update their own boards" on boards for update using (
  auth.uid() = owner_id
);
create policy "Users can update boards they are admin of" on boards for update using (
  is_board_admin(id)
);
create policy "Users can delete their own boards" on boards for delete using (auth.uid() = owner_id);

-- Policies for Board Members
create policy "Users can view members of boards they belong to" on board_members for select using (
  user_id = auth.uid() or is_board_owner(board_id) or is_board_member(board_id)
);
create policy "Admins can add members" on board_members for insert with check (
  is_board_owner(board_id) or is_board_admin(board_id)
);
create policy "Admins can update members" on board_members for update using (
  is_board_owner(board_id) or is_board_admin(board_id)
);
create policy "Admins can delete members or users can leave" on board_members for delete using (
  user_id = auth.uid() or is_board_owner(board_id) or is_board_admin(board_id)
);

-- Policies for Columns
create policy "Users can view columns if they have reader access" on columns for select using (
  is_board_owner(board_id) or is_board_member(board_id)
);
create policy "Admins can insert columns" on columns for insert with check (
  is_board_owner(board_id) or is_board_admin(board_id)
);
create policy "Admins can update columns" on columns for update using (
  is_board_owner(board_id) or is_board_admin(board_id)
);
create policy "Admins can delete columns" on columns for delete using (
  is_board_owner(board_id) or is_board_admin(board_id)
);

-- Policies for Swimlanes
create policy "Users can view swimlanes if they have reader access" on swimlanes for select using (
  is_board_owner(board_id) or is_board_member(board_id)
);
create policy "Admins can insert swimlanes" on swimlanes for insert with check (
  is_board_owner(board_id) or is_board_admin(board_id)
);
create policy "Admins can update swimlanes" on swimlanes for update using (
  is_board_owner(board_id) or is_board_admin(board_id)
);
create policy "Admins can delete swimlanes" on swimlanes for delete using (
  is_board_owner(board_id) or is_board_admin(board_id)
);

-- Policies for Cards
create policy "Users can view cards if they have reader access" on cards for select using (
  is_board_owner(board_id) or is_board_member(board_id)
);
create policy "Members can insert cards" on cards for insert with check (
  is_board_owner(board_id) or is_board_member(board_id)
);
create policy "Members can update cards" on cards for update using (
  is_board_owner(board_id) or is_board_member(board_id)
);
create policy "Members can delete cards" on cards for delete using (
  is_board_owner(board_id) or is_board_member(board_id)
);

-- Policies for Card Assignees
create policy "Users can view assignees if they have reader access" on card_assignees for select using (
  exists (
    select 1 from cards c where c.id = card_assignees.card_id and (
      is_board_owner(c.board_id) or is_board_member(c.board_id)
    )
  )
);
create policy "Members can insert assignees" on card_assignees for insert with check (
  exists (
    select 1 from cards c where c.id = card_assignees.card_id and (
      is_board_owner(c.board_id) or is_board_member(c.board_id)
    )
  )
);
create policy "Members can delete assignees" on card_assignees for delete using (
  exists (
    select 1 from cards c where c.id = card_assignees.card_id and (
      is_board_owner(c.board_id) or is_board_member(c.board_id)
    )
  )
);

-- Policies for Links
create policy "Users can view links if they have reader access" on useful_links for select using (
  is_board_owner(board_id) or is_board_member(board_id)
);
create policy "Members can insert links" on useful_links for insert with check (
  is_board_owner(board_id) or is_board_member(board_id)
);
create policy "Members can delete links" on useful_links for delete using (
  is_board_owner(board_id) or is_board_member(board_id)
);

-- Policies for Comments
create policy "Users can view comments if they have reader access" on comments for select using (
  exists (
    select 1 from cards c where c.id = comments.card_id and (
      is_board_owner(c.board_id) or is_board_member(c.board_id)
    )
  )
);
create policy "Members can insert comments" on comments for insert with check (
  exists (
    select 1 from cards c where c.id = comments.card_id and (
      is_board_owner(c.board_id) or is_board_member(c.board_id)
    )
  )
);
create policy "Users can update own comments" on comments for update using (
  user_id = auth.uid() and exists (
    select 1 from cards c where c.id = comments.card_id and (
      is_board_owner(c.board_id) or is_board_member(c.board_id)
    )
  )
);
create policy "Users can delete own comments or admins can delete any" on comments for delete using (
  user_id = auth.uid() or exists (
    select 1 from cards c where c.id = comments.card_id and (
      is_board_owner(c.board_id) or is_board_admin(c.board_id)
    )
  )
);

