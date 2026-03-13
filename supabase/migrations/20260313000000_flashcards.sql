-- flashcards
CREATE TABLE flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  selected_text TEXT NOT NULL,
  normalized_text TEXT,
  start_timestamp NUMERIC,
  end_timestamp NUMERIC,
  transcript_context TEXT,
  source_language TEXT,
  target_language TEXT,
  translation TEXT,
  explanation TEXT,
  card_type TEXT NOT NULL DEFAULT 'phrase',
  difficulty TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own flashcards" ON flashcards
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX flashcards_user_video ON flashcards(user_id, video_id);
CREATE INDEX flashcards_user ON flashcards(user_id);

-- flashcard_review_events
CREATE TABLE flashcard_review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('again', 'hard', 'easy')),
  reviewed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE flashcard_review_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own review events" ON flashcard_review_events
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX review_events_card ON flashcard_review_events(flashcard_id);

-- video_bundles
CREATE TABLE video_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE video_bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own bundles" ON video_bundles
  FOR ALL USING (auth.uid() = user_id);

-- video_bundle_items
CREATE TABLE video_bundle_items (
  bundle_id UUID NOT NULL REFERENCES video_bundles(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (bundle_id, video_id)
);

ALTER TABLE video_bundle_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own bundle items" ON video_bundle_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM video_bundles b
      WHERE b.id = bundle_id AND b.user_id = auth.uid()
    )
  );
