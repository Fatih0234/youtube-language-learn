"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FlashcardReview } from "@/components/flashcard-review";
import { Flashcard } from "@/lib/types";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { fetchFlashcards } from "@/lib/flashcards-client";

export default function PracticeBundlePage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadBundleFlashcards = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const cards = await fetchFlashcards({ bundleId });
      setFlashcards(cards);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load flashcards"
      );
    } finally {
      setIsLoading(false);
    }
  }, [bundleId]);

  useEffect(() => {
    void loadBundleFlashcards();
  }, [loadBundleFlashcards]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/bundles/${bundleId}`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back to Bundle
            </Button>
          </Link>
          <h1 className="text-sm font-medium text-muted-foreground">Practice Bundle</h1>
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
            <Button variant="outline" onClick={loadBundleFlashcards}>Retry</Button>
          </div>
        ) : (
          <FlashcardReview
            flashcards={flashcards}
            onComplete={() => router.push(`/bundles/${bundleId}`)}
          />
        )}
      </div>
    </div>
  );
}
