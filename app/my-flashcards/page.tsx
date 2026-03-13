"use client";

import { useState, useEffect, useCallback } from "react";
import { Flashcard } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, PlayCircle, Trash2, AlertCircle } from "lucide-react";
import { deleteFlashcard, fetchFlashcards } from "@/lib/flashcards-client";
import { toast } from "sonner";
import Link from "next/link";

export default function MyFlashcardsPage() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFlashcards = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const cards = await fetchFlashcards({ all: true });
      setFlashcards(cards);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load flashcards"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFlashcards();
  }, [loadFlashcards]);

  const handleDelete = async (id: string) => {
    try {
      await deleteFlashcard(id);
      setFlashcards((prev) => prev.filter((c) => c.id !== id));
      toast.success("Card deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete card");
    }
  };

  // Group by videoId
  const grouped = flashcards.reduce<Record<string, Flashcard[]>>((acc, card) => {
    (acc[card.videoId] = acc[card.videoId] || []).push(card);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Flashcards</h1>
        {flashcards.length > 0 && (
          <Link href="/practice/all">
            <Button className="gap-2">
              <PlayCircle className="h-4 w-4" />
              Practice All
            </Button>
          </Link>
        )}
      </div>

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
          <Button variant="outline" onClick={loadFlashcards}>Retry</Button>
        </div>
      ) : flashcards.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-4 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-medium">No flashcards yet</p>
            <p className="text-sm text-muted-foreground">Select text in a video transcript to create flashcards.</p>
          </div>
          <Link href="/">
            <Button>Study a video</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([videoId, cards]) => (
            <div key={videoId}>
              <div className="flex items-center justify-between mb-2">
                <Link href={`/analyze/${videoId}`} className="text-sm font-medium hover:underline text-muted-foreground">
                  {videoId}
                </Link>
                <Link href={`/practice/video/${videoId}`}>
                  <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs">
                    <PlayCircle className="h-3.5 w-3.5" />
                    Practice
                  </Button>
                </Link>
              </div>
              <div className="divide-y border rounded-lg">
                {cards.map((card) => (
                  <div key={card.id} className="flex items-start justify-between p-3 group hover:bg-muted/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{card.selectedText}</p>
                      {card.translation && (
                        <p className="text-xs text-muted-foreground mt-0.5">{card.translation}</p>
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
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
