import test from "node:test";
import assert from "node:assert/strict";

import {
  getScenePlayStartTime,
  getScenePreviewKey,
  getSceneWindow,
  isTimeWithinSceneWindow,
  shouldAutoPreviewScene,
} from "@/lib/flashcard-scene";
import { Flashcard } from "@/lib/types";

function createFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "card-1",
    userId: "user-1",
    videoId: "video-1",
    selectedText: "squeeze",
    normalizedText: "squeeze",
    startTimestamp: 325,
    endTimestamp: 341,
    transcriptContext: "the ankle. Full stretch at the bottom...",
    sourceLanguage: "en",
    targetLanguage: "de",
    translation: "quetschen",
    explanation: "Example flashcard",
    cardType: "phrase",
    difficulty: "medium",
    createdAt: "2026-03-13T00:00:00.000Z",
    updatedAt: "2026-03-13T00:00:00.000Z",
    ...overrides,
  };
}

test("getSceneWindow returns precise bounds when both timestamps exist", () => {
  const scene = getSceneWindow(createFlashcard());

  assert.deepEqual(scene, {
    start: 325,
    end: 341,
    hasPreciseBounds: true,
  });
});

test("getSceneWindow returns a short fallback window when only the start exists", () => {
  const scene = getSceneWindow(createFlashcard({ endTimestamp: null }));

  assert.deepEqual(scene, {
    start: 325,
    end: 331,
    hasPreciseBounds: false,
  });
});

test("scene playback resumes only while the current time is inside the active scene window", () => {
  const scene = getSceneWindow(createFlashcard());
  assert.ok(scene);

  assert.equal(isTimeWithinSceneWindow(330, scene), true);
  assert.equal(getScenePlayStartTime(330, scene), 330);

  assert.equal(isTimeWithinSceneWindow(324.7, scene), false);
  assert.equal(getScenePlayStartTime(324.7, scene), 325);

  assert.equal(isTimeWithinSceneWindow(341, scene), false);
  assert.equal(getScenePlayStartTime(341, scene), 325);
});

test("scene preview key stays stable for the same card and changes for a different card or timestamp", () => {
  const firstCard = createFlashcard();
  const sameCardSameScene = createFlashcard();
  const differentCard = createFlashcard({ id: "card-2" });
  const shiftedScene = createFlashcard({ startTimestamp: 400, endTimestamp: 412 });

  const firstKey = getScenePreviewKey(firstCard);
  const sameKey = getScenePreviewKey(sameCardSameScene);
  const differentCardKey = getScenePreviewKey(differentCard);
  const shiftedSceneKey = getScenePreviewKey(shiftedScene);

  assert.equal(firstKey, "card-1:325:341");
  assert.equal(sameKey, firstKey);
  assert.notEqual(differentCardKey, firstKey);
  assert.notEqual(shiftedSceneKey, firstKey);
});

test("auto-preview only re-arms when the scene preview key changes", () => {
  const sceneKey = getScenePreviewKey(createFlashcard());
  const nextSceneKey = getScenePreviewKey(createFlashcard({ id: "card-2" }));

  assert.equal(shouldAutoPreviewScene(sceneKey, null), true);
  assert.equal(shouldAutoPreviewScene(sceneKey, sceneKey), false);
  assert.equal(shouldAutoPreviewScene(nextSceneKey, sceneKey), true);
  assert.equal(shouldAutoPreviewScene(null, sceneKey), false);
});
