-- Fix: Add missing created_by column and update_video_analysis_secure function
-- These were defined in 20251214185226_security_ownership.sql but never applied
-- to the remote database (migration was tracked as applied but DDL was missing).

-- 1. Add created_by column if missing
ALTER TABLE public.video_analyses
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_video_analyses_created_by
ON public.video_analyses(created_by);

-- 2. Recreate insert_video_analysis_server to reference the new created_by column
--    (the version from 20260314000000 was created before this column existed,
--     so the function body was compiled without it)
CREATE OR REPLACE FUNCTION public.insert_video_analysis_server(
    p_youtube_id text,
    p_title text,
    p_author text,
    p_duration integer,
    p_thumbnail_url text,
    p_transcript jsonb,
    p_topics jsonb,
    p_summary jsonb DEFAULT NULL,
    p_suggested_questions jsonb DEFAULT NULL,
    p_model_used text DEFAULT NULL,
    p_user_id uuid DEFAULT NULL,
    p_language text DEFAULT NULL,
    p_available_languages jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_video_id uuid;
    v_existing_id uuid;
BEGIN
    SELECT id INTO v_existing_id
    FROM public.video_analyses
    WHERE youtube_id = p_youtube_id;

    IF v_existing_id IS NULL THEN
        INSERT INTO public.video_analyses (
            youtube_id, title, author, duration, thumbnail_url,
            transcript, topics, summary, suggested_questions, model_used,
            language, available_languages, created_by
        ) VALUES (
            p_youtube_id, p_title, p_author, p_duration, p_thumbnail_url,
            p_transcript, p_topics, p_summary, p_suggested_questions, p_model_used,
            p_language, p_available_languages, p_user_id
        )
        RETURNING id INTO v_video_id;
    ELSE
        UPDATE public.video_analyses SET
            transcript = COALESCE(p_transcript, transcript),
            topics = COALESCE(p_topics, topics),
            summary = COALESCE(p_summary, summary),
            suggested_questions = COALESCE(p_suggested_questions, suggested_questions),
            language = COALESCE(p_language, language),
            available_languages = COALESCE(p_available_languages, available_languages),
            updated_at = timezone('utc'::text, now())
        WHERE id = v_existing_id;

        v_video_id := v_existing_id;
    END IF;

    IF p_user_id IS NOT NULL THEN
        BEGIN
            INSERT INTO public.user_videos (user_id, video_id, accessed_at)
            VALUES (p_user_id, v_video_id, timezone('utc'::text, now()))
            ON CONFLICT (user_id, video_id) DO UPDATE SET
                accessed_at = timezone('utc'::text, now());
        EXCEPTION WHEN foreign_key_violation THEN
            RAISE WARNING 'user_videos FK failed for user % on video % — skipping link',
                p_user_id, v_video_id;
        END;
    END IF;

    RETURN v_video_id;
END;
$$;

-- 3. Create update_video_analysis_secure (was missing entirely)
DROP FUNCTION IF EXISTS public.update_video_analysis_secure(text, uuid, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.update_video_analysis_secure(
    p_youtube_id text,
    p_user_id uuid,
    p_summary jsonb DEFAULT NULL,
    p_suggested_questions jsonb DEFAULT NULL
)
RETURNS TABLE (success boolean, video_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_video_id uuid;
    v_created_by uuid;
BEGIN
    SELECT id, created_by INTO v_video_id, v_created_by
    FROM public.video_analyses
    WHERE youtube_id = p_youtube_id;

    IF v_video_id IS NULL THEN
        RETURN QUERY SELECT false::boolean, NULL::uuid;
        RETURN;
    END IF;

    IF v_created_by IS NOT NULL AND v_created_by != p_user_id THEN
        RETURN QUERY SELECT false::boolean, v_video_id;
        RETURN;
    END IF;

    UPDATE public.video_analyses SET
        summary = COALESCE(p_summary, summary),
        suggested_questions = COALESCE(p_suggested_questions, suggested_questions),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_video_id;

    RETURN QUERY SELECT true::boolean, v_video_id;
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.insert_video_analysis_server(
    text, text, text, integer, text, jsonb, jsonb, jsonb, jsonb, text, uuid, text, jsonb
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.insert_video_analysis_server(
    text, text, text, integer, text, jsonb, jsonb, jsonb, jsonb, text, uuid, text, jsonb
) TO anon;

GRANT EXECUTE ON FUNCTION public.update_video_analysis_secure(text, uuid, jsonb, jsonb)
TO authenticated;
