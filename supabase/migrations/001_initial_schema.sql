-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  tier text not null default 'free' check (tier in ('free', 'pro', 'business')),
  posts_used_this_month integer not null default 0,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Generated posts table
create table public.generated_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  ticker text,
  context text not null,
  platform text not null,
  tone text not null,
  content text not null,
  character_count integer not null,
  hashtags text[] default '{}',
  created_at timestamptz not null default now()
);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.generated_posts enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can read own posts"
  on public.generated_posts for select
  using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_profiles_updated
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();
