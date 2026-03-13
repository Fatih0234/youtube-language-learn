-- Fix: Ensure all functions and columns from 20251214185226 exist on the remote DB.
-- That migration was tracked as applied but its DDL was never fully executed.
-- This migration is self-contained and idempotent.

-- 1. Add created_by column if missing (from 20251214185226_security_ownership.sql)
ALTER TABLE public.video_analyses
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_video_analyses_created_by
ON public.video_analyses(created_by);

-- 2. Drop old 11-param overload of insert_video_analysis_server if it exists
DROP FUNCTION IF EXISTS public.insert_video_analysis_server(
    text, text, text, integer, text, jsonb, jsonb, jsonb, jsonb, text, uuid
);

-- 3. Create/replace the correct 13-param insert function with FK-safe exception block
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

    -- Wrapped in exception block so FK failure on user_videos does NOT
    -- roll back the video_analyses insert above.
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

-- 4. Drop old overloads of update_video_analysis_secure and recreate
DROP FUNCTION IF EXISTS public.update_video_analysis_secure(text, uuid, jsonb, jsonb);
DROP FUNCTION IF EXISTS public.update_video_analysis_secure(text, uuid, jsonb, jsonb, jsonb, jsonb, text);

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

-- 5. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.insert_video_analysis_server(
    text, text, text, integer, text, jsonb, jsonb, jsonb, jsonb, text, uuid, text, jsonb
) TO authenticated;

GRANT EXECUTE ON FUNCTION public.insert_video_analysis_server(
    text, text, text, integer, text, jsonb, jsonb, jsonb, jsonb, text, uuid, text, jsonb
) TO anon;

GRANT EXECUTE ON FUNCTION public.update_video_analysis_secure(text, uuid, jsonb, jsonb)
TO authenticated;
