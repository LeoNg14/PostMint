-- Function to safely increment posts_used_this_month
create or replace function public.increment_posts_used(user_id uuid, count integer)
returns void as $$
begin
  update public.profiles
  set posts_used_this_month = posts_used_this_month + count
  where id = user_id;
end;
$$ language plpgsql security definer;

-- Function to reset monthly usage (call via cron or Supabase scheduled function)
create or replace function public.reset_monthly_usage()
returns void as $$
begin
  update public.profiles set posts_used_this_month = 0;
end;
$$ language plpgsql security definer;
