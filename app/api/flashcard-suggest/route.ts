import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withSecurity, SECURITY_PRESETS } from '@/lib/security-middleware';
import { generateAIResponse } from '@/lib/ai-client';
import { z } from 'zod';

const suggestSchema = z.object({
  selectedText: z.string().min(1).max(500),
  transcriptContext: z.string().max(2000).optional(),
  sourceLanguage: z.string().optional(),
  targetLanguage: z.string().optional(),
});

async function handler(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = suggestSchema.parse(body);

    const targetLang = validated.targetLanguage || 'English';
    const sourceLang = validated.sourceLanguage || 'the source language';
    const contextBlock = validated.transcriptContext
      ? `\n<context>${validated.transcriptContext}</context>`
      : '';

    const prompt = `You are a language tutor. Given a phrase from a video transcript, provide a translation and brief explanation.

<phrase>${validated.selectedText}</phrase>${contextBlock}
<sourceLanguage>${sourceLang}</sourceLanguage>
<targetLanguage>${targetLang}</targetLanguage>

Return strict JSON: {"translation":"string","explanation":"string"}
- translation: natural ${targetLang} translation of the phrase
- explanation: 1-2 sentences explaining usage, grammar, or nuance. Keep it concise.`;

    const response = await generateAIResponse(prompt, {
      temperature: 0.4,
      maxOutputTokens: 512,
    });

    // Parse JSON response
    let parsed;
    try {
      const cleaned = response.trim().replace(/```(?:json)?\s*([\s\S]*?)```/i, '$1').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({
      translation: parsed.translation || '',
      explanation: parsed.explanation || '',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 });
    }
    console.error('Flashcard suggest error:', error);
    return NextResponse.json({ error: 'Failed to generate suggestion' }, { status: 500 });
  }
}

export const POST = withSecurity(handler, SECURITY_PRESETS.AUTHENTICATED);
