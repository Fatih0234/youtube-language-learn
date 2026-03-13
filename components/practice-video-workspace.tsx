"use client";

import { Flashcard, TranscriptSegment } from "@/lib/types";
import { SceneWindow } from "@/lib/flashcard-scene";
import { YouTubePlayer } from "@/components/youtube-player";
import { TranscriptViewer } from "@/components/transcript-viewer";
import { FlashcardReview } from "@/components/flashcard-review";
import { PracticeScenePanel } from "@/components/practice-scene-panel";
import { fetchWithCSRF } from "@/lib/csrf-client";
import { YouTubePlayerController } from "@/lib/youtube-player-controller";

interface PracticeVideoWorkspaceProps {
  videoId: string;
  flashcards: Flashcard[];
  transcript: TranscriptSegment[];
  currentIndex: number;
  isFlipped: boolean;
  currentTime: number;
  scene: SceneWindow | null;
  playerControllerRef: { current: YouTubePlayerController | null };
  onFlip: () => void;
  onRate: (rating: "again" | "hard" | "easy") => void;
  onPlayerReady: () => void;
  onSeekToSceneStart: (seconds: number) => void;
  onPlayScene: () => void;
  onReplay: () => void;
  onSeekToTime: (seconds: number) => void;
  onTimeUpdate: (t: number) => void;
  onComplete?: () => void;
}

export function PracticeVideoWorkspace({
  videoId,
  flashcards,
  transcript,
  currentIndex,
  isFlipped,
  currentTime,
  scene,
  playerControllerRef,
  onFlip,
  onRate,
  onPlayerReady,
  onSeekToSceneStart,
  onPlayScene,
  onReplay,
  onSeekToTime,
  onTimeUpdate,
  onComplete,
}: PracticeVideoWorkspaceProps) {
  const currentCard = flashcards[currentIndex];

  return (
    <div className="flex gap-4">
      {/* Left column: player + scene panel */}
      <div className="flex flex-col gap-3 w-[480px] shrink-0">
        <YouTubePlayer
          videoId={videoId}
          selectedTopic={null}
          controllerRef={playerControllerRef}
          onPlayerReady={onPlayerReady}
          onTimeUpdate={onTimeUpdate}
          renderControls={false}
        />
        <PracticeScenePanel
          scene={scene}
          transcriptContext={currentCard?.transcriptContext}
          onSeekToSceneStart={onSeekToSceneStart}
          onPlayScene={onPlayScene}
          onReplay={onReplay}
        />
      </div>

      {/* Right column: transcript + card */}
      <div className="flex flex-col gap-3 flex-1 min-w-0">
        <div className="h-[420px] overflow-hidden rounded-lg border">
          <TranscriptViewer
            transcript={transcript}
            selectedTopic={null}
            onTimestampClick={(seconds) => onSeekToTime(seconds)}
            currentTime={currentTime}
          />
        </div>
        <FlashcardReview
          flashcards={flashcards}
          currentIndex={currentIndex}
          isFlipped={isFlipped}
          onFlip={onFlip}
          onRate={async (rating) => {
            if (!currentCard) return;
            onRate(rating);
            try {
              await fetchWithCSRF("/api/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ flashcardId: currentCard.id, rating }),
              });
            } catch {
              // silent fail
            }
          }}
          onComplete={onComplete}
        />
      </div>
    </div>
  );
}
