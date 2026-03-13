import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withSecurity, SECURITY_PRESETS } from '@/lib/security-middleware';
import { z } from 'zod';
import { mapFlashcard } from '@/lib/flashcard-helpers';

const createFlashcardSchema = z.object({
  videoId: z.string().min(1),
  selectedText: z.string().min(1).max(2000),
  startTimestamp: z.number().optional(),
  endTimestamp: z.number().optional(),
  transcriptContext: z.string().max(4000).optional(),
  sourceLanguage: z.string().optional(),
  targetLanguage: z.string().optional(),
  translation: z.string().max(2000).optional(),
  explanation: z.string().max(4000).optional(),
  cardType: z.string().default('phrase'),
});

async function handler(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (req.method === 'GET') {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    const bundleId = searchParams.get('bundleId');
    const all = searchParams.get('all') === 'true';

    let query = supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (bundleId) {
      // Get all video IDs in this bundle
      const { data: items } = await supabase
        .from('video_bundle_items')
        .select('video_id')
        .eq('bundle_id', bundleId);
      const videoIds = (items || []).map((i: any) => i.video_id);
      if (videoIds.length === 0) {
        return NextResponse.json({ flashcards: [] });
      }
      query = query.in('video_id', videoIds);
    } else if (videoId) {
      query = query.eq('video_id', videoId);
    } else if (!all) {
      return NextResponse.json({ error: 'Provide videoId, bundleId, or all=true' }, { status: 400 });
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching flashcards:', error);
      return NextResponse.json({ error: 'Failed to fetch flashcards' }, { status: 500 });
    }

    return NextResponse.json({ flashcards: (data || []).map(mapFlashcard) });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const validated = createFlashcardSchema.parse(body);

      const { data, error } = await supabase
        .from('flashcards')
        .insert({
          user_id: user.id,
          video_id: validated.videoId,
          selected_text: validated.selectedText,
          start_timestamp: validated.startTimestamp ?? null,
          end_timestamp: validated.endTimestamp ?? null,
          transcript_context: validated.transcriptContext ?? null,
          source_language: validated.sourceLanguage ?? null,
          target_language: validated.targetLanguage ?? null,
          translation: validated.translation ?? null,
          explanation: validated.explanation ?? null,
          card_type: validated.cardType,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating flashcard:', error);
        return NextResponse.json({ error: 'Failed to create flashcard' }, { status: 500 });
      }

      return NextResponse.json({ flashcard: mapFlashcard(data) }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to create flashcard' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const GET = withSecurity(handler, SECURITY_PRESETS.AUTHENTICATED);
export const POST = withSecurity(handler, SECURITY_PRESETS.AUTHENTICATED);
