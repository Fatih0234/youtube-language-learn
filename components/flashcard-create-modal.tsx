"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { fetchWithCSRF } from "@/lib/csrf-client";
import { toast } from "sonner";

export interface FlashcardCreatePayload {
  videoId: string;
  selectedText: string;
  startTimestamp?: number;
  transcriptContext?: string;
  sourceLanguage?: string;
}

interface FlashcardCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: FlashcardCreatePayload | null;
  onCreated?: () => void;
}

export function FlashcardCreateModal({
  open,
  onOpenChange,
  payload,
  onCreated,
}: FlashcardCreateModalProps) {
  const [translation, setTranslation] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSuggest = async () => {
    if (!payload) return;
    setIsSuggesting(true);
    try {
      const res = await fetchWithCSRF("/api/flashcard-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedText: payload.selectedText,
          transcriptContext: payload.transcriptContext,
          sourceLanguage: payload.sourceLanguage,
        }),
      });
      const data = await res.json();
      if (data.translation) setTranslation(data.translation);
      if (data.explanation) setExplanation(data.explanation);
    } catch {
      toast.error("Failed to get suggestion");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSave = async () => {
    if (!payload) return;
    setIsSaving(true);
    try {
      const res = await fetchWithCSRF("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: payload.videoId,
          selectedText: payload.selectedText,
          startTimestamp: payload.startTimestamp,
          transcriptContext: payload.transcriptContext,
          sourceLanguage: payload.sourceLanguage,
          translation: translation || undefined,
          explanation: explanation || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      toast.success("Flashcard saved!");
      onOpenChange(false);
      setTranslation("");
      setExplanation("");
      onCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to save flashcard");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTranslation("");
      setExplanation("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Flashcard</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Phrase</Label>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium">
              {payload?.selectedText}
            </div>
            {payload?.transcriptContext && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                Context: {payload.transcriptContext}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Translation &amp; Explanation</Label>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1.5"
                onClick={handleSuggest}
                disabled={isSuggesting}
              >
                {isSuggesting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Suggest
              </Button>
            </div>
            <Textarea
              placeholder="Translation..."
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              rows={2}
            />
            <Textarea
              placeholder="Explanation or notes..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
