"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Flashcard, TranscriptSegment } from "@/lib/types";
import {
  getScenePlayStartTime,
  getScenePreviewKey,
  getSceneWindow,
  SceneWindow,
  shouldAutoPreviewScene,
} from "@/lib/flashcard-scene";
import { PracticeVideoWorkspace } from "@/components/practice-video-workspace";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { fetchFlashcards } from "@/lib/flashcards-client";
import { YouTubePlayerController } from "@/lib/youtube-player-controller";

export default function PracticeVideoPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const router = useRouter();

  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Controlled review state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [practiceLoadVersion, setPracticeLoadVersion] = useState(0);
  const playerControllerRef = useRef<YouTubePlayerController | null>(null);
  const lastAutoPreviewSceneKeyRef = useRef<string | null>(null);

  const loadPracticeData = useCallback(async () => {
    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
    setIsLoading(true);
    setLoadError(null);
    lastAutoPreviewSceneKeyRef.current = null;

    const [flashcardsResult, cacheResult] = await Promise.allSettled([
      fetchFlashcards({ videoId }),
      fetch("/api/check-video-cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: youtubeUrl }),
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to load cached transcript data");
        }

        return response.json();
      }),
    ]);

    if (flashcardsResult.status === "fulfilled") {
      setFlashcards(flashcardsResult.value);
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsDone(false);
    } else {
      setFlashcards([]);
      setLoadError(
        flashcardsResult.reason instanceof Error
          ? flashcardsResult.reason.message
          : "Failed to load flashcards"
      );
    }

    if (cacheResult.status === "fulfilled") {
      setTranscript(cacheResult.value.transcript ?? []);
    } else {
      console.error("Failed to load cached transcript data", cacheResult.reason);
      setTranscript([]);
    }

    setPracticeLoadVersion((version) => version + 1);
    setIsLoading(false);
  }, [videoId]);

  useEffect(() => {
    void loadPracticeData();
  }, [loadPracticeData]);

  const currentCard = flashcards[currentIndex];
  const scene: SceneWindow | null = useMemo(
    () => (currentCard ? getSceneWindow(currentCard) : null),
    [currentCard]
  );
  const scenePreviewKey = useMemo(
    () => getScenePreviewKey(currentCard),
    [currentCard]
  );

  useEffect(() => {
    setIsPlayerReady(false);
    lastAutoPreviewSceneKeyRef.current = null;
  }, [videoId]);

  useEffect(() => {
    if (!isPlayerReady) return;
    if (!scene || !scenePreviewKey) return;
    if (!shouldAutoPreviewScene(scenePreviewKey, lastAutoPreviewSceneKeyRef.current)) {
      return;
    }

    const controller = playerControllerRef.current;
    if (!controller) return;

    controller.clearWindowStop();
    controller.seekAndPause(scene.start);
    lastAutoPreviewSceneKeyRef.current = scenePreviewKey;
  }, [isPlayerReady, practiceLoadVersion, scene, scenePreviewKey]);

  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  const handleFlip = useCallback(() => setIsFlipped((f) => !f), []);

  const handleRate = useCallback(() => {
    if (currentIndex + 1 >= flashcards.length) {
      setIsDone(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, flashcards.length]);

  const handlePlayScene = useCallback(() => {
    const s = sceneRef.current;
    const controller = playerControllerRef.current;
    if (!s || !controller) return;

    const startTime = getScenePlayStartTime(currentTime, s);
    controller.playWindow(startTime, s.end);
  }, [currentTime]);

  const handleReplay = useCallback(() => {
    const s = sceneRef.current;
    const controller = playerControllerRef.current;
    if (!s || !controller) return;

    controller.clearWindowStop();
    controller.playWindow(s.start, s.end);
  }, []);

  const handleSeekToTime = useCallback((seconds: number) => {
    const controller = playerControllerRef.current;
    if (!controller) return;

    controller.clearWindowStop();
    controller.seekAndPause(seconds);
  }, []);

  const handleSeekToSceneStart = useCallback((seconds: number) => {
    const s = sceneRef.current;
    const controller = playerControllerRef.current;
    if (!s || !controller) return;

    void seconds;
    controller.clearWindowStop();
    controller.seekAndPause(s.start);
  }, []);

  const handlePlayerReady = useCallback(() => {
    setIsPlayerReady(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-8 text-center">
        <p className="text-xl font-semibold">Session Complete!</p>
        <p className="text-muted-foreground">{flashcards.length} cards reviewed</p>
        <Button onClick={() => router.push(`/analyze/${videoId}`)}>Back to Study</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/analyze/${videoId}`}>
            <Button variant="ghost" size="sm" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back to Study
            </Button>
          </Link>
          <h1 className="text-sm font-medium text-muted-foreground">Practice</h1>
        </div>
      </div>

      <div className="flex-1 max-w-screen-xl mx-auto w-full px-4 py-6">
        {loadError ? (
          <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <p className="font-medium">Failed to load flashcards</p>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
            <Button variant="outline" onClick={loadPracticeData}>Retry</Button>
          </div>
        ) : flashcards.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-64 gap-4">
            <p className="text-muted-foreground">No flashcards for this video yet.</p>
            <Link href={`/analyze/${videoId}`}>
              <Button variant="outline">Go study</Button>
            </Link>
          </div>
        ) : (
          <PracticeVideoWorkspace
            videoId={videoId}
            flashcards={flashcards}
            transcript={transcript}
            currentIndex={currentIndex}
            isFlipped={isFlipped}
            currentTime={currentTime}
            scene={scene}
            playerControllerRef={playerControllerRef}
            onFlip={handleFlip}
            onRate={handleRate}
            onPlayerReady={handlePlayerReady}
            onSeekToSceneStart={handleSeekToSceneStart}
            onPlayScene={handlePlayScene}
            onReplay={handleReplay}
            onSeekToTime={handleSeekToTime}
            onTimeUpdate={setCurrentTime}
            onComplete={() => router.push(`/analyze/${videoId}`)}
          />
        )}
      </div>
    </div>
  );
}
