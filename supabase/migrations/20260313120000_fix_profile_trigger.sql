-- Fix missing profile trigger that caused cascade of issues:
-- No profile → FK violation → user_videos never created → history lost → notes fail

-- 1. Update handle_new_user to be idempotent (ON CONFLICT DO NOTHING)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- 2. Create the trigger that was commented out in the initial schema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill profiles for existing auth.users with no profile row
INSERT INTO public.profiles (id, email, full_name, avatar_url)
SELECT
    id,
    email,
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Backfill user_videos for analyses where created_by has no user_videos link
-- Guard: created_by column may not exist on all database instances
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'video_analyses'
      AND column_name = 'created_by'
  ) THEN
    INSERT INTO public.user_videos (user_id, video_id, accessed_at)
    SELECT created_by, id, created_at
    FROM public.video_analyses
    WHERE created_by IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.user_videos uv
        WHERE uv.user_id = video_analyses.created_by
          AND uv.video_id = video_analyses.id
      )
    ON CONFLICT (user_id, video_id) DO NOTHING;
  END IF;
END;
$$;
