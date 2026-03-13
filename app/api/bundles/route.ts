import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withSecurity, SECURITY_PRESETS } from '@/lib/security-middleware';
import { z } from 'zod';
import { mapBundle } from '@/lib/flashcard-helpers';

const createBundleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

async function handler(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('video_bundles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch bundles' }, { status: 500 });
    }

    return NextResponse.json({ bundles: (data || []).map(mapBundle) });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const validated = createBundleSchema.parse(body);

      const { data, error } = await supabase
        .from('video_bundles')
        .insert({
          user_id: user.id,
          name: validated.name,
          description: validated.description ?? null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 });
      }

      return NextResponse.json({ bundle: mapBundle(data) }, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
      }
      return NextResponse.json({ error: 'Failed to create bundle' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export const GET = withSecurity(handler, SECURITY_PRESETS.AUTHENTICATED);
export const POST = withSecurity(handler, SECURITY_PRESETS.AUTHENTICATED);
