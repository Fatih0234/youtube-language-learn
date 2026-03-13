"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FlashcardReview } from "@/components/flashcard-review";
import { Flashcard } from "@/lib/types";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { fetchFlashcards } from "@/lib/flashcards-client";

export default function PracticeAllPage() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFlashcardsForPractice = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const cards = await fetchFlashcards({ all: true });
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setFlashcards(shuffled);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load flashcards"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFlashcardsForPractice();
  }, [loadFlashcardsForPractice]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/my-flashcards">
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-sm font-medium text-muted-foreground">Practice All Cards</h1>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <p className="font-medium">Failed to load flashcards</p>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
            <Button variant="outline" onClick={loadFlashcardsForPractice}>Retry</Button>
          </div>
        ) : (
          <FlashcardReview
            flashcards={flashcards}
            onComplete={() => router.push("/my-flashcards")}
          />
        )}
      </div>
    </div>
  );
}
