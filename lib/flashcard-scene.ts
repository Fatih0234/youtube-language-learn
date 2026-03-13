import { Flashcard } from "@/lib/types";

export interface SceneWindow {
  start: number;
  end: number;
  hasPreciseBounds: boolean;
}

const SCENE_RESUME_TOLERANCE_SECONDS = 0.15;

export function getSceneWindow(card: Flashcard): SceneWindow | null {
  const start = card.startTimestamp ?? null;
  const end = card.endTimestamp ?? null;

  if (start === null) return null;

  if (end !== null) {
    return { start, end, hasPreciseBounds: true };
  }

  return { start, end: start + 6, hasPreciseBounds: false };
}

export function isTimeWithinSceneWindow(
  currentTime: number,
  scene: SceneWindow
): boolean {
  return currentTime >= scene.start - SCENE_RESUME_TOLERANCE_SECONDS && currentTime < scene.end;
}

export function getScenePlayStartTime(
  currentTime: number,
  scene: SceneWindow
): number {
  return isTimeWithinSceneWindow(currentTime, scene)
    ? Math.max(scene.start, currentTime)
    : scene.start;
}

export function getScenePreviewKey(
  card: Pick<Flashcard, "id" | "startTimestamp" | "endTimestamp"> | null | undefined
): string | null {
  if (!card || card.startTimestamp == null) {
    return null;
  }

  return `${card.id}:${card.startTimestamp}:${card.endTimestamp ?? "fallback"}`;
}

export function shouldAutoPreviewScene(
  nextScenePreviewKey: string | null,
  lastScenePreviewKey: string | null
): boolean {
  return nextScenePreviewKey !== null && nextScenePreviewKey !== lastScenePreviewKey;
}
