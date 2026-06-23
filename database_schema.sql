-- Bill Split Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists users (
  id uuid references auth.users on delete cascade primary key,
  name text,
  email text unique not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Groups table
create table if not exists groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Group Members table
create table if not exists group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_id, user_id)
);

-- Expenses table
create table if not exists expenses (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  title text not null,
  amount numeric(10, 2) not null,
  category text not null default 'other',
  paid_by uuid references users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Expense Participants table
create table if not exists expense_participants (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  amount_owed numeric(10, 2) not null,
  unique(expense_id, user_id)
);

-- Settlements table
create table if not exists settlements (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references groups(id) on delete cascade not null,
  payer_id uuid references users(id) on delete cascade not null,
  receiver_id uuid references users(id) on delete cascade not null,
  amount numeric(10, 2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table users enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_participants enable row level security;
alter table settlements enable row level security;

-- Create policies (Placeholder logic for MVP)
-- Users can view and update their own profile
create policy "Users can view all profiles" on users for select using (true);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

-- Groups: users can view groups they are members of
create policy "Users can view groups they belong to" on groups for select using (
  exists (select 1 from group_members where group_id = groups.id and user_id = auth.uid())
);
create policy "Users can create groups" on groups for insert with check (auth.uid() = created_by);

-- Group Members
create policy "Users can view group members for their groups" on group_members for select using (
  exists (select 1 from group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid())
);
create policy "Users can add members" on group_members for insert with check (true);

-- Expenses
create policy "Users can view expenses in their groups" on expenses for select using (
  exists (select 1 from group_members where group_id = expenses.group_id and user_id = auth.uid())
);
create policy "Users can add expenses to their groups" on expenses for insert with check (
  exists (select 1 from group_members where group_id = expenses.group_id and user_id = auth.uid())
);

-- Expense Participants
create policy "Users can view expense participants" on expense_participants for select using (
  exists (
    select 1 from expenses e
    join group_members gm on gm.group_id = e.group_id
    where e.id = expense_participants.expense_id and gm.user_id = auth.uid()
  )
);
create policy "Users can add expense participants" on expense_participants for insert with check (true);

-- Settlements
create policy "Users can view settlements in their groups" on settlements for select using (
  exists (select 1 from group_members where group_id = settlements.group_id and user_id = auth.uid())
);
create policy "Users can add settlements to their groups" on settlements for insert with check (
  exists (select 1 from group_members where group_id = settlements.group_id and user_id = auth.uid())
);

-- Triggers to auto-create user on auth.users signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to allow re-running
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
