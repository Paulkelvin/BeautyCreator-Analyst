-- Remove temporary Supabase fallback for YOUTUBE_API_KEY (now in Vercel env)
delete from app_runtime_secrets where key = 'YOUTUBE_API_KEY';
drop table if exists app_runtime_secrets;
