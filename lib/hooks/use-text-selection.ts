import { useState, useEffect, useCallback } from 'react';

export interface TextSelection {
  text: string;
  rect: DOMRect;
  metadata?: {
    transcript?: {
      start?: number;
      end?: number;
      segmentIndex?: number;
      context?: string;
    };
  };
}

export function useTextSelection(containerRef: React.RefObject<HTMLElement | null>) {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.type === 'Caret') {
      // Don't clear immediately — allow popover click handlers to fire
      return;
    }

    const selectedText = sel.toString().trim();
    if (!selectedText || selectedText.length < 2) {
      setSelection(null);
      return;
    }

    // Make sure selection is within our container
    if (containerRef.current) {
      const range = sel.getRangeAt(0);
      if (!containerRef.current.contains(range.commonAncestorContainer)) {
        setSelection(null);
        return;
      }
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Extract transcript segment metadata from data attributes
    let transcriptMeta: TextSelection['metadata'] = undefined;
    const startEl = (range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement)?.closest('[data-segment-index]') as HTMLElement | null;
    const endEl = (range.endContainer instanceof Element ? range.endContainer : range.endContainer.parentElement)?.closest('[data-segment-index]') as HTMLElement | null;
    if (startEl) {
      const start = startEl.dataset.segmentStart ? parseFloat(startEl.dataset.segmentStart) : undefined;
      const end = endEl?.dataset.segmentEnd ? parseFloat(endEl.dataset.segmentEnd) : (startEl.dataset.segmentEnd ? parseFloat(startEl.dataset.segmentEnd) : undefined);
      const context = startEl.textContent?.trim().slice(0, 200);
      transcriptMeta = { transcript: { start, end, context } };
    }

    setSelection({ text: selectedText, rect, metadata: transcriptMeta });
  }, [containerRef]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  return { selection, clearSelection };
}
