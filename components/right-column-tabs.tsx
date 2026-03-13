"use client";

import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { TranscriptViewer } from "@/components/transcript-viewer";
import { AIChat } from "@/components/ai-chat";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Languages, MessageSquare, PenLine, BookOpen } from "lucide-react";
import { TranscriptSegment, Topic, Citation, Note, NoteSource, NoteMetadata, VideoInfo, TranslationRequestHandler } from "@/lib/types";
import { FlashcardPanel } from "@/components/flashcard-panel";
import { SelectionActionPayload } from "@/components/selection-actions";
import { NotesPanel, EditingNote } from "@/components/notes-panel";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageSelector } from "@/components/language-selector";

const translationSelectorEnabled = (() => {
  const raw = process.env.NEXT_PUBLIC_ENABLE_TRANSLATION_SELECTOR;
  if (!raw) {
    return false;
  }
  const normalized = raw.toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
})();

interface RightColumnTabsProps {
  transcript: TranscriptSegment[];
  selectedTopic: Topic | null;
  onTimestampClick: (seconds: number, endSeconds?: number, isCitation?: boolean, citationText?: string, isWithinHighlightReel?: boolean, isWithinCitationHighlight?: boolean) => void;
  currentTime?: number;
  topics?: Topic[];
  citationHighlight?: Citation | null;
  videoId: string;
  videoTitle?: string;
  videoInfo?: VideoInfo | null;
  onCitationClick: (citation: Citation) => void;
  showChatTab?: boolean;
  cachedSuggestedQuestions?: string[] | null;
  notes?: Note[];
  onSaveNote?: (payload: { text: string; source: NoteSource; sourceId?: string | null; metadata?: NoteMetadata | null }) => Promise<void>;
  onTakeNoteFromSelection?: (payload: SelectionActionPayload) => void;
  editingNote?: EditingNote | null;
  onSaveEditingNote?: (payload: { noteText: string; selectedText: string; metadata?: NoteMetadata }) => void;
  onCancelEditing?: () => void;
  isAuthenticated?: boolean;
  onRequestSignIn?: () => void;
  selectedLanguage?: string | null;
  translationCache?: Map<string, string>;
  onRequestTranslation?: TranslationRequestHandler;
  onLanguageChange?: (languageCode: string | null) => void;
  availableLanguages?: string[];
  currentSourceLanguage?: string;
  onRequestExport?: () => void;
  exportButtonState?: {
    tooltip?: string;
    disabled?: boolean;
    badgeLabel?: string;
    isLoading?: boolean;
  };
  onAddNote?: () => void;
  flashcardRefreshTrigger?: number;
  onFlashcardTimestampClick?: (seconds: number) => void;
}

export interface RightColumnTabsHandle {
  switchToTranscript: () => void;
  switchToChat?: () => void;
  switchToNotes: () => void;
  switchToFlashcards?: () => void;
}

export const RightColumnTabs = forwardRef<RightColumnTabsHandle, RightColumnTabsProps>(({
  transcript,
  selectedTopic,
  onTimestampClick,
  currentTime,
  topics,
  citationHighlight,
  videoId,
  videoTitle,
  videoInfo,
  onCitationClick,
  showChatTab,
  cachedSuggestedQuestions,
  notes,
  onSaveNote,
  onTakeNoteFromSelection,
  editingNote,
  onSaveEditingNote,
  onCancelEditing,
  isAuthenticated,
  onRequestSignIn,
  selectedLanguage = null,
  translationCache,
  onRequestTranslation,
  onLanguageChange,
  availableLanguages,
  currentSourceLanguage,
  onRequestExport,
  exportButtonState,
  onAddNote,
  flashcardRefreshTrigger,
  onFlashcardTimestampClick,
}, ref) => {
  const [activeTab, setActiveTab] = useState<"transcript" | "chat" | "notes" | "flashcards">("transcript");
  const showTranslationSelector = translationSelectorEnabled;

  // Expose methods to parent to switch tabs
  useImperativeHandle(ref, () => ({
    switchToTranscript: () => {
      setActiveTab("transcript");
    },
    switchToChat: () => {
      if (showChatTab) {
        setActiveTab("chat");
      }
    },
    switchToNotes: () => {
      setActiveTab("notes");
    },
    switchToFlashcards: () => {
      setActiveTab("flashcards");
    }
  }));

  useEffect(() => {
    // If chat tab is removed while active, switch to transcript
    if (!showChatTab && activeTab === "chat") {
      setActiveTab("transcript");
    }
  }, [showChatTab, activeTab]);

  return (
    <Card className="h-full flex flex-col overflow-hidden p-0 gap-0 border-0">
      <div className="flex items-center gap-2 p-2 rounded-t-3xl border-b">
        <div className="flex-1">
          {showTranslationSelector ? (
            <LanguageSelector
              activeTab={activeTab}
              selectedLanguage={selectedLanguage}
              availableLanguages={availableLanguages}
              currentSourceLanguage={currentSourceLanguage}
              isAuthenticated={isAuthenticated}
              onTabSwitch={setActiveTab}
              onLanguageChange={onLanguageChange}
              onRequestSignIn={onRequestSignIn}
            />
          ) : (
            <div className={cn(
              "flex items-center gap-0 rounded-2xl w-full",
              activeTab === "transcript"
                ? "bg-neutral-100"
                : "hover:bg-white/50"
            )}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab("transcript")}
                className={cn(
                  "flex-1 justify-center gap-2 rounded-2xl border-0",
                  activeTab === "transcript"
                    ? "text-foreground hover:bg-neutral-100"
                    : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                )}
              >
                <Languages className="h-4 w-4" />
                Transcript
              </Button>
            </div>
          )}
        </div>
        {showChatTab && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("chat")}
            className={cn(
              "flex-1 justify-center gap-2 rounded-2xl",
              activeTab === "chat"
                ? "bg-neutral-100 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-white/50"
            )}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("notes")}
          className={cn(
            "flex-1 justify-center gap-2 rounded-2xl",
            activeTab === "notes"
              ? "bg-neutral-100 text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-white/50",
            notes?.length ? undefined : "opacity-75"
          )}
        >
          <PenLine className="h-4 w-4" />
          Notes
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab("flashcards")}
          className={cn(
            "flex-1 justify-center gap-2 rounded-2xl",
            activeTab === "flashcards"
              ? "bg-neutral-100 text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-white/50"
          )}
        >
          <BookOpen className="h-4 w-4" />
          Cards
        </Button>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {/* Keep both components mounted but toggle visibility */}
        <div className={cn("absolute inset-0", activeTab !== "transcript" && "hidden")}>
          <TranscriptViewer
            transcript={transcript}
            selectedTopic={selectedTopic}
            onTimestampClick={onTimestampClick}
            currentTime={currentTime}
            topics={topics}
            citationHighlight={citationHighlight}
            onTakeNoteFromSelection={onTakeNoteFromSelection}
            videoId={videoId}
            selectedLanguage={selectedLanguage}
            onRequestTranslation={onRequestTranslation}
            onRequestExport={onRequestExport}
            exportButtonState={exportButtonState}
          />
        </div>
        <div className={cn("absolute inset-0", (activeTab !== "chat" || !showChatTab) && "hidden")}>
          <AIChat
            transcript={transcript}
            topics={topics || []}
            videoId={videoId}
            videoTitle={videoTitle}
            videoInfo={videoInfo}
            onCitationClick={onCitationClick}
            onTimestampClick={onTimestampClick}
            cachedSuggestedQuestions={cachedSuggestedQuestions}
            onSaveNote={onSaveNote}
            onTakeNoteFromSelection={onTakeNoteFromSelection}
            selectedLanguage={selectedLanguage}
            translationCache={translationCache}
            onRequestTranslation={onRequestTranslation}
            isAuthenticated={isAuthenticated}
            onRequestSignIn={onRequestSignIn}
          />
        </div>
        <div className={cn("absolute inset-0", activeTab !== "notes" && "hidden")}
        >
          <TooltipProvider delayDuration={0}>
            <NotesPanel
              notes={notes}
              editingNote={editingNote}
              onSaveEditingNote={onSaveEditingNote}
              onCancelEditing={onCancelEditing}
              isAuthenticated={isAuthenticated}
              onSignInClick={onRequestSignIn}
              currentTime={currentTime}
              onTimestampClick={onTimestampClick}
              onAddNote={onAddNote}
            />
          </TooltipProvider>
        </div>
        <div className={cn("absolute inset-0", activeTab !== "flashcards" && "hidden")}>
          <FlashcardPanel
            videoId={videoId}
            isAuthenticated={isAuthenticated}
            onRequestSignIn={onRequestSignIn}
            refreshTrigger={flashcardRefreshTrigger}
            onTimestampClick={onFlashcardTimestampClick}
          />
        </div>
      </div>
    </Card>
  );
});

RightColumnTabs.displayName = "RightColumnTabs";
