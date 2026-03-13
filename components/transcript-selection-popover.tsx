"use client";

import { useEffect, useRef } from "react";
import { BookOpen, MessageSquare, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextSelection } from "@/lib/hooks/use-text-selection";
import { toast } from "sonner";

export interface FlashcardSelectionPayload {
  text: string;
  startTimestamp?: number;
  endTimestamp?: number;
  transcriptContext?: string;
}

interface TranscriptSelectionPopoverProps {
  selection: TextSelection;
  onAddFlashcard: (payload: FlashcardSelectionPayload) => void;
  onAskTutor: (text: string) => void;
  onClose: () => void;
}

export function TranscriptSelectionPopover({
  selection,
  onAddFlashcard,
  onAskTutor,
  onClose,
}: TranscriptSelectionPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Position popover above selection
  const style: React.CSSProperties = {
    position: "fixed",
    top: selection.rect.top - 52,
    left: selection.rect.left + selection.rect.width / 2,
    transform: "translateX(-50%)",
    zIndex: 50,
  };

  // Adjust if too high
  const adjustedTop = selection.rect.top - 52;
  if (adjustedTop < 8) {
    style.top = selection.rect.bottom + 8;
  }

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(selection.text);
    toast.success("Copied to clipboard");
    onClose();
  };

  return (
    <div
      ref={popoverRef}
      style={style}
      className="flex items-center gap-1 bg-popover border rounded-lg shadow-lg p-1"
    >
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs gap-1.5"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          onAddFlashcard({
            text: selection.text,
            startTimestamp: selection.metadata?.transcript?.start,
            endTimestamp: selection.metadata?.transcript?.end,
            transcriptContext: selection.metadata?.transcript?.context,
          });
          onClose();
        }}
      >
        <BookOpen className="h-3.5 w-3.5" />
        Add Card
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs gap-1.5"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => { onAskTutor(selection.text); onClose(); }}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Ask Tutor
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-8 px-2 text-xs gap-1.5"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleCopy}
      >
        <Copy className="h-3.5 w-3.5" />
        Copy
      </Button>
    </div>
  );
}
