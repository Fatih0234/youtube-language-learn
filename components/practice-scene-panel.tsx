"use client";

import { Button } from "@/components/ui/button";
import { PlayCircle, RotateCcw } from "lucide-react";
import { SceneWindow } from "@/lib/flashcard-scene";
import { formatDuration } from "@/lib/utils";
import { TimestampButton } from "@/components/timestamp-button";

interface PracticeScenePanelProps {
  scene: SceneWindow | null;
  transcriptContext?: string | null;
  onSeekToSceneStart: (seconds: number) => void;
  onPlayScene: () => void;
  onReplay: () => void;
}

export function PracticeScenePanel({
  scene,
  transcriptContext,
  onSeekToSceneStart,
  onPlayScene,
  onReplay,
}: PracticeScenePanelProps) {
  if (!scene) return null;

  const timestampLabel = scene.hasPreciseBounds
    ? `${formatDuration(scene.start)} - ${formatDuration(scene.end)}`
    : formatDuration(scene.start);

  return (
    <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
      <div className="flex items-center justify-between">
        <TimestampButton
          timestamp={timestampLabel}
          seconds={scene.start}
          onClick={onSeekToSceneStart}
          className="font-mono px-2.5 py-1 text-[11px]"
        />
        {!scene.hasPreciseBounds && (
          <span className="text-xs text-muted-foreground">(approx.)</span>
        )}
      </div>

      {transcriptContext && (
        <p className="text-xs text-muted-foreground italic line-clamp-2">
          &ldquo;{transcriptContext}&rdquo;
        </p>
      )}

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs h-7" onClick={onPlayScene}>
          <PlayCircle className="h-3.5 w-3.5" />
          Play scene
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5 text-xs h-7" onClick={onReplay}>
          <RotateCcw className="h-3.5 w-3.5" />
          Replay
        </Button>
      </div>
    </div>
  );
}
