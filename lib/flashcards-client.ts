import { csrfFetch } from '@/lib/csrf-client';
import { Flashcard } from '@/lib/types';

interface FetchFlashcardsParams {
  videoId?: string;
  bundleId?: string;
  all?: boolean;
}

async function getErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  const error = await response.json().catch(() => ({}));

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (typeof error?.error === 'string' && error.error.trim()) {
    return error.error;
  }

  return fallback;
}

export async function fetchFlashcards(
  params: FetchFlashcardsParams
): Promise<Flashcard[]> {
  const query = new URLSearchParams();

  if (params.bundleId) {
    query.set('bundleId', params.bundleId);
  } else if (params.videoId) {
    query.set('videoId', params.videoId);
  } else if (params.all) {
    query.set('all', 'true');
  } else {
    throw new Error('Missing flashcard query parameters');
  }

  const response = await csrfFetch.get(`/api/flashcards?${query.toString()}`);

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, 'Failed to fetch flashcards')
    );
  }

  const data = await response.json();
  return (data.flashcards || []) as Flashcard[];
}

export async function deleteFlashcard(id: string): Promise<void> {
  const response = await csrfFetch.delete(`/api/flashcards/${id}`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to delete flashcard'));
  }
}
