import { Flashcard } from './types';

export function mapFlashcard(row: any): Flashcard {
  return {
    id: row.id,
    userId: row.user_id,
    videoId: row.video_id,
    selectedText: row.selected_text,
    normalizedText: row.normalized_text,
    startTimestamp: row.start_timestamp,
    endTimestamp: row.end_timestamp,
    transcriptContext: row.transcript_context,
    sourceLanguage: row.source_language,
    targetLanguage: row.target_language,
    translation: row.translation,
    explanation: row.explanation,
    cardType: row.card_type,
    difficulty: row.difficulty,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapBundle(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
