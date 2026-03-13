import test from "node:test";
import assert from "node:assert/strict";

import { getScenePlayStartTime, type SceneWindow } from "@/lib/flashcard-scene";
import {
  createYouTubePlayerController,
  resolvePlaybackWindowEnd,
  type YouTubePlayerInstance,
} from "@/lib/youtube-player-controller";

function createMockPlayer() {
  const calls: Array<[string, ...unknown[]]> = [];

  const player: YouTubePlayerInstance = {
    seekTo(seconds: number, allowSeekAhead?: boolean) {
      calls.push(["seekTo", seconds, allowSeekAhead]);
    },
    playVideo() {
      calls.push(["playVideo"]);
    },
    pauseVideo() {
      calls.push(["pauseVideo"]);
    },
  };

  return { player, calls };
}

test("seekAndPause clears the active stop window and pauses at the requested time", () => {
  const { player, calls } = createMockPlayer();
  const playerRef = { current: player };
  const playWindowEndRef = { current: 341 };
  let syncedTime = 0;

  const controller = createYouTubePlayerController({
    playerRef,
    playWindowEndRef,
    onTimeUpdate: (seconds) => {
      syncedTime = seconds;
    },
  });

  controller.seekAndPause(325);

  assert.equal(playWindowEndRef.current, null);
  assert.equal(syncedTime, 325);
  assert.deepEqual(calls, [
    ["seekTo", 325, true],
    ["pauseVideo"],
  ]);
});

test("playWindow seeks, plays, and stores the clip end boundary", () => {
  const { player, calls } = createMockPlayer();
  const playerRef = { current: player };
  const playWindowEndRef = { current: null as number | null };
  let syncedTime = 0;

  const controller = createYouTubePlayerController({
    playerRef,
    playWindowEndRef,
    onTimeUpdate: (seconds) => {
      syncedTime = seconds;
    },
  });

  controller.playWindow(325, 341);

  assert.equal(playWindowEndRef.current, 341);
  assert.equal(syncedTime, 325);
  assert.deepEqual(calls, [
    ["seekTo", 325, true],
    ["playVideo"],
  ]);
});

test("playWindow uses the fallback duration when no end timestamp is available", () => {
  assert.equal(resolvePlaybackWindowEnd(325, undefined, 6), 331);
});

test("practice scene playback supports preview, resume, replay, and transcript seeks", () => {
  const { player, calls } = createMockPlayer();
  const playerRef = { current: player };
  const playWindowEndRef = { current: null as number | null };

  const controller = createYouTubePlayerController({
    playerRef,
    playWindowEndRef,
  });

  const scene: SceneWindow = {
    start: 325,
    end: 341,
    hasPreciseBounds: true,
  };

  controller.seekAndPause(scene.start);
  controller.playWindow(getScenePlayStartTime(333, scene), scene.end);
  controller.playWindow(scene.start, scene.end);
  controller.seekAndPause(412);

  assert.equal(playWindowEndRef.current, null);
  assert.deepEqual(calls, [
    ["seekTo", 325, true],
    ["pauseVideo"],
    ["seekTo", 333, true],
    ["playVideo"],
    ["seekTo", 325, true],
    ["playVideo"],
    ["seekTo", 412, true],
    ["pauseVideo"],
  ]);
});
