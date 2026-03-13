import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withSecurity, SECURITY_PRESETS } from '@/lib/security-middleware';
import { z } from 'zod';

const reviewSchema = z.object({
  flashcardId: z.string().uuid(),
  rating: z.enum(['again', 'hard', 'easy']),
});

async function handler(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = reviewSchema.parse(body);

    // Verify user owns this flashcard
    const { data: card } = await supabase
      .from('flashcards')
      .select('id')
      .eq('id', validated.flashcardId)
      .eq('user_id', user.id)
      .single();

    if (!card) {
      return NextResponse.json({ error: 'Flashcard not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('flashcard_review_events')
      .insert({
        user_id: user.id,
        flashcard_id: validated.flashcardId,
        rating: validated.rating,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
    }

    return NextResponse.json({ success: true, eventId: data.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to record review' }, { status: 500 });
  }
}

export const POST = withSecurity(handler, SECURITY_PRESETS.AUTHENTICATED);
