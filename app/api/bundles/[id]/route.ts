import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { mapBundle } from '@/lib/flashcard-helpers';

const updateBundleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;

  const { data: bundle, error } = await supabase
    .from('video_bundles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !bundle) return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });

  const { data: items } = await supabase
    .from('video_bundle_items')
    .select('*')
    .eq('bundle_id', id);

  return NextResponse.json({ bundle: mapBundle(bundle), videos: (items || []).map((i: any) => i.video_id) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    const validated = updateBundleSchema.parse(body);

    const { data, error } = await supabase
      .from('video_bundles')
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 });
    return NextResponse.json({ bundle: mapBundle(data) });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to update bundle' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from('video_bundles')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'Failed to delete bundle' }, { status: 500 });
  return NextResponse.json({ success: true });
}
