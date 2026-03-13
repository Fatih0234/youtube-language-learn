# PRD — YouTube-to-Language-Learning Workspace (V1)

## Product name
Working title: **Longcut Language**  
Subtitle: **Learn a foreign language from YouTube videos through transcript-grounded flashcards and tutor chat**

---

## 1. Overview

This product turns YouTube videos into a language-learning workspace.

A user pastes a YouTube URL, the app fetches the transcript and video metadata, and the user studies the target language directly from the transcript. The core interaction is selecting a word or phrase from the transcript and turning it into a flashcard tied to that video and timestamp.

The existing video-analysis scaffold will be repurposed from “understand the video better” to “learn a language from the video.”

---

## 2. Problem

Language learners often consume YouTube videos in their target language, but the learning workflow is broken:

- useful phrases disappear as the video continues
- learners cannot easily turn transcript snippets into study material
- transcript, context, explanation, and review are separated across different tools
- generic flashcard apps lose the original video context
- AI chat tools are not grounded in the exact transcript moment the learner cares about

This creates friction between discovering useful language and actually learning it.

---

## 3. Vision

Build a **video-grounded language-learning system** where learners can study directly from real YouTube content, capture useful phrases in context, and review them later through flashcards and tutor-guided practice.

---

## 4. Target user

### Primary user
Intermediate language learners who use native or semi-native YouTube videos to improve vocabulary, phrase recognition, and comprehension.

### Secondary user
Beginner-to-lower-intermediate learners who want AI support to explain phrases, translations, and grammar in a gentle way.

---

## 5. Core job to be done

> When I find a useful phrase in a YouTube video transcript, I want to save it instantly as a flashcard with context, translation, and explanation, so I can review and learn from it later.

---

## 6. Product goals

### V1 goals
- Let users paste a YouTube URL and study from its transcript
- Let users select transcript text and create flashcards from it
- Preserve source context: video, timestamp, and transcript excerpt
- Let users practice flashcards by:
  - current video
  - grouped videos / bundles
  - all saved flashcards
- Repurpose chat into a transcript-grounded language tutor

### Non-goals for V1
- full spaced repetition scheduling
- advanced gamification
- social features
- classroom / multi-user collaboration
- deep speaking evaluation
- broad billing redesign

---

## 7. V1 user flow

1. User pastes a YouTube URL
2. App fetches transcript and video metadata
3. User opens the video study page
4. User hovers over or selects transcript text
5. Context action appears:
   - Add Flashcard
   - Ask Tutor
   - Save Note
6. User creates a flashcard from the selected phrase
7. Flashcard is saved with:
   - selected text
   - source video
   - timestamp
   - optional translation
   - optional explanation
8. User later reviews flashcards:
   - from that video
   - from a bundle of videos
   - from all videos
9. User uses tutor chat to ask transcript-grounded language questions

---

## 8. Core features

### 8.1 Video transcript workspace
The app accepts a YouTube URL and displays:
- video metadata
- transcript
- synced study interface
- AI tutor chat
- notes / learning actions

### 8.2 Transcript selection → flashcard creation
Users can select a word, phrase, or sentence fragment in the transcript and create a flashcard.

Flashcard creation should support:
- prefilled selected text
- timestamp
- source video link/reference
- optional translation suggestion
- optional explanation / gloss
- optional transcript context

### 8.3 Flashcards by video
Each video has its own flashcard set.

Users should be able to:
- view all flashcards created from a given video
- practice only flashcards from that video

### 8.4 Bundles / collections
Users can group videos into bundles.

Users should be able to:
- create a bundle
- add videos to a bundle
- practice all flashcards from videos inside that bundle

### 8.5 Global flashcard practice
Users should be able to review all flashcards across all videos.

### 8.6 Tutor chat
The chat should be reframed as a language tutor, grounded in the transcript and selected text.

The tutor should help users:
- explain meaning in context
- translate literally and naturally
- explain grammar briefly
- generate example sentences
- quiz the learner on the selected phrase
- simplify difficult transcript lines

---

## 9. Flashcard definition (V1)

A flashcard is a study unit created from transcript text and tied to source context.

### Required flashcard fields
- `id`
- `user_id`
- `video_id`
- `selected_text`
- `normalized_text`
- `start_timestamp`
- `end_timestamp` (optional if not available)
- `transcript_context`
- `source_language`
- `target_language`
- `translation`
- `explanation`
- `card_type`
- `difficulty`
- `created_at`
- `updated_at`

### Initial supported card type
- phrase/meaning card

### Optional future card types
- cloze card
- listening card
- grammar pattern card

---

## 10. Review loop (V1)

The first review system should stay simple.

### Review flow
- show front of card
- reveal back
- mark:
  - Again
  - Hard
  - Easy

### V1 review scope
- record review events
- support future extensibility toward SRS
- do not implement full scheduling logic yet

---

## 11. Functional requirements

### Must have
- YouTube URL input
- transcript retrieval and display
- transcript text selection
- flashcard creation from selection
- flashcard persistence
- flashcards linked to source video and timestamp
- practice mode by video
- practice mode by bundle
- global practice mode
- transcript-grounded tutor chat

### Should have
- translation suggestion on card creation
- explanation/gloss suggestion on card creation
- small editor before saving card
- ability to view saved flashcards by video

### Could have
- AI-generated example sentence
- learner notes attached to card
- tags

---

## 12. Success metrics

### Product signals
- number of flashcards created per analyzed video
- percentage of analyzed videos that lead to at least one flashcard
- number of review sessions started
- number of repeat users returning to review flashcards
- number of tutor interactions tied to selected text

### Qualitative success
Users should feel:
- “I can learn directly from real videos”
- “It is frictionless to save useful phrases”
- “My study cards keep the original context”

---

## 13. Risks

- transcript selection UX may be awkward if the current transcript renderer is not selection-friendly
- AI enrichment may add latency or cost during card creation
- too much scope may turn V1 into a messy rewrite
- card schema may become bloated if too many learning modes are added too early

---

## 14. Open questions

- Is the default learner flow phrase-based or word-based?
- Should card creation be instant or go through a lightweight edit modal?
- Should translation be auto-generated on save or only on demand?
- Should bundles contain videos only, or cards directly as well?
- Which target languages should V1 optimize for first?
- How much transcript context should be stored with each card?

---

## 15. Recommended V1 scope boundary

Keep V1 tightly focused on this loop:

**YouTube video → transcript → select phrase → save flashcard → review later → ask tutor about it**

If this loop feels smooth and valuable, then add:
- smarter card types
- spaced repetition
- richer tutoring
- listening and pronunciation features
- gamification

---

## 16. Summary

This product repurposes a YouTube transcript analysis app into a language-learning workspace.

The defining V1 feature is:
**turning selected transcript text into context-preserving flashcards tied to a video and timestamp.**

Everything else in V1 should support that loop.