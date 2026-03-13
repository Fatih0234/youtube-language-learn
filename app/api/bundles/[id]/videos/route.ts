import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const addVideoSchema = z.object({ videoId: z.string().min(1) });

async function getVerifiedBundle(bundleId: string, userId: string) {
  const supabase = await createClient();
  const { data: bundle } = await supabase
    .from('video_bundles')
    .select('id')
    .eq('id', bundleId)
    .eq('user_id', userId)
    .single();
  return { supabase, bundle };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id: bundleId } = await params;

  // Verify bundle ownership
  const { data: bundle } = await supabase
    .from('video_bundles')
    .select('id')
    .eq('id', bundleId)
    .eq('user_id', user.id)
    .single();

  if (!bundle) return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });

  try {
    const body = await req.json();
    const { videoId } = addVideoSchema.parse(body);

    const { error } = await supabase
      .from('video_bundle_items')
      .upsert({ bundle_id: bundleId, video_id: videoId });

    if (error) return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { id: bundleId } = await params;

  // Verify bundle ownership
  const { data: bundle } = await supabase
    .from('video_bundles')
    .select('id')
    .eq('id', bundleId)
    .eq('user_id', user.id)
    .single();

  if (!bundle) return NextResponse.json({ error: 'Bundle not found' }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

  const { error } = await supabase
    .from('video_bundle_items')
    .delete()
    .eq('bundle_id', bundleId)
    .eq('video_id', videoId);

  if (error) return NextResponse.json({ error: 'Failed to remove video' }, { status: 500 });
  return NextResponse.json({ success: true });
}
