"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FlashcardReview } from "@/components/flashcard-review";
import { Flashcard } from "@/lib/types";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PracticeAllPage() {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/flashcards?all=true")
      .then((r) => r.json())
      .then((data) => {
        // Shuffle for variety
        const cards = (data.flashcards || []) as Flashcard[];
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        setFlashcards(shuffled);
      })
      .finally(() => setIsLoading(false));
  }, []);

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
