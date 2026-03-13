"use client";

import { useState } from "react";
import { Flashcard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { fetchWithCSRF } from "@/lib/csrf-client";
import { CheckCircle2, RotateCcw } from "lucide-react";

interface FlashcardReviewProps {
  flashcards: Flashcard[];
  onComplete?: () => void;
  // Controlled mode — if provided, external state is used
  currentIndex?: number;
  isFlipped?: boolean;
  onFlip?: () => void;
  onRate?: (rating: "again" | "hard" | "easy") => void;
}

export function FlashcardReview({
  flashcards,
  onComplete,
  currentIndex: controlledIndex,
  isFlipped: controlledFlipped,
  onFlip,
  onRate: externalOnRate,
}: FlashcardReviewProps) {
  const isControlled = controlledIndex !== undefined;

  const [internalIndex, setInternalIndex] = useState(0);
  const [internalFlipped, setInternalFlipped] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [ratings, setRatings] = useState<Record<string, string>>({});

  const currentIndex = isControlled ? controlledIndex! : internalIndex;
  const isFlipped = isControlled ? (controlledFlipped ?? false) : internalFlipped;

  const current = flashcards[currentIndex];
  const progress = (currentIndex / flashcards.length) * 100;

  const handleFlip = () => {
    if (onFlip) {
      onFlip();
    } else {
      setInternalFlipped((f) => !f);
    }
  };

  const handleRate = async (rating: "again" | "hard" | "easy") => {
    if (!current) return;

    if (externalOnRate) {
      externalOnRate(rating);
      return;
    }

    setRatings((prev) => ({ ...prev, [current.id]: rating }));

    try {
      await fetchWithCSRF("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: current.id, rating }),
      });
    } catch {
      // silent fail — rating UI still advances
    }

    if (internalIndex + 1 >= flashcards.length) {
      setIsDone(true);
    } else {
      setInternalIndex((i) => i + 1);
      setInternalFlipped(false);
    }
  };

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p className="text-muted-foreground">No flashcards to review.</p>
      </div>
    );
  }

  if (!isControlled && isDone) {
    const easyCount = Object.values(ratings).filter((r) => r === "easy").length;
    const hardCount = Object.values(ratings).filter((r) => r === "hard").length;
    const againCount = Object.values(ratings).filter((r) => r === "again").length;

    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-6 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
        <div>
          <h2 className="text-xl font-semibold">Session Complete!</h2>
          <p className="text-muted-foreground mt-1">{flashcards.length} cards reviewed</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <p className="font-semibold text-green-600">{easyCount}</p>
            <p className="text-muted-foreground">Easy</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-yellow-600">{hardCount}</p>
            <p className="text-muted-foreground">Hard</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-red-600">{againCount}</p>
            <p className="text-muted-foreground">Again</p>
          </div>
        </div>
        {onComplete && (
          <Button onClick={onComplete}>Done</Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{currentIndex + 1} / {flashcards.length}</span>
        <Progress value={progress} className="w-40 h-1.5" />
      </div>

      <Card
        className="cursor-pointer min-h-48 flex items-center justify-center select-none"
        onClick={handleFlip}
      >
        <CardContent className="p-8 text-center space-y-4">
          {!isFlipped ? (
            <>
              <p className="text-2xl font-semibold">{current.selectedText}</p>
              {current.transcriptContext && (
                <p className="text-sm text-muted-foreground italic line-clamp-3">
                  &ldquo;{current.transcriptContext}&rdquo;
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-4">Tap to reveal answer</p>
            </>
          ) : (
            <>
              {current.translation && (
                <p className="text-xl font-semibold text-primary">{current.translation}</p>
              )}
              {current.explanation && (
                <p className="text-sm text-muted-foreground">{current.explanation}</p>
              )}
              {!current.translation && !current.explanation && (
                <p className="text-sm text-muted-foreground">No translation added yet.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {isFlipped && (
        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            className="flex-1 max-w-28 border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => handleRate("again")}
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Again
          </Button>
          <Button
            variant="outline"
            className="flex-1 max-w-28 border-yellow-200 text-yellow-600 hover:bg-yellow-50"
            onClick={() => handleRate("hard")}
          >
            Hard
          </Button>
          <Button
            variant="outline"
            className="flex-1 max-w-28 border-green-200 text-green-600 hover:bg-green-50"
            onClick={() => handleRate("easy")}
          >
            Easy
          </Button>
        </div>
      )}
    </div>
  );
}
