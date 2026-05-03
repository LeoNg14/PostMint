-- Video jobs table
create table public.video_jobs (
  id uuid primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'queued' check (status in ('queued','scripting','voicing','rendering','stitching','done','failed')),
  progress integer not null default 0,
  ticker text,
  context text not null,
  style text not null,
  script text,
  video_url text,
  thumbnail_url text,
  duration integer,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.video_jobs enable row level security;

create policy "Users can read own video jobs"
  on public.video_jobs for select
  using (auth.uid() = user_id);

-- Index for polling
create index video_jobs_user_status on public.video_jobs(user_id, status);
create index video_jobs_updated on public.video_jobs(updated_at desc);

-- Auto updated_at
create trigger on_video_jobs_updated
  before update on public.video_jobs
  for each row execute procedure public.handle_updated_at();

-- Storage bucket for videos (run this separately in Supabase dashboard)
-- insert into storage.buckets (id, name, public) values ('postmint-videos', 'postmint-videos', true);
