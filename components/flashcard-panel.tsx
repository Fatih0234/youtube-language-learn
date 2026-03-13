"use client";

import { useState, useEffect, useCallback } from "react";
import { Flashcard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, PlayCircle, BookOpen, AlertCircle } from "lucide-react";
import { deleteFlashcard, fetchFlashcards } from "@/lib/flashcards-client";
import { toast } from "sonner";
import Link from "next/link";
import { formatDuration } from "@/lib/utils";

interface FlashcardPanelProps {
  videoId: string;
  isAuthenticated?: boolean;
  onRequestSignIn?: () => void;
  refreshTrigger?: number;
  onTimestampClick?: (seconds: number) => void;
}

export function FlashcardPanel({
  videoId,
  isAuthenticated,
  onRequestSignIn,
  refreshTrigger,
  onTimestampClick,
}: FlashcardPanelProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFlashcards = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const cards = await fetchFlashcards({ videoId });
      setFlashcards(cards);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load flashcards"
      );
    } finally {
      setIsLoading(false);
    }
  }, [videoId, isAuthenticated]);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards, refreshTrigger]);

  const handleDelete = async (id: string) => {
    try {
      await deleteFlashcard(id);
      setFlashcards((prev) => prev.filter((c) => c.id !== id));
      toast.success("Card deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete card");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Sign in to create and review flashcards.</p>
        <Button size="sm" onClick={onRequestSignIn}>Sign in</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Failed to load flashcards</p>
          <p className="text-xs text-muted-foreground">{loadError}</p>
        </div>
        <Button size="sm" variant="outline" onClick={loadFlashcards}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-sm font-medium">{flashcards.length} card{flashcards.length !== 1 ? "s" : ""}</span>
        {flashcards.length > 0 && (
          <Link href={`/practice/video/${videoId}`}>
            <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
              <PlayCircle className="h-3.5 w-3.5" />
              Practice
            </Button>
          </Link>
        )}
      </div>

      {flashcards.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 p-6 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No flashcards yet. Select text in the transcript to add one.</p>
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 divide-y">
          {flashcards.map((card) => (
            <div key={card.id} className="p-3 group hover:bg-muted/30 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{card.selectedText}</p>
                  {card.translation && (
                    <p className="text-xs text-muted-foreground mt-0.5">{card.translation}</p>
                  )}
                  {card.startTimestamp != null && (
                    <button
                      className="text-xs text-blue-500 hover:underline mt-0.5"
                      onClick={() => onTimestampClick?.(card.startTimestamp!)}
                    >
                      {formatDuration(card.startTimestamp)}
                    </button>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => handleDelete(card.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
