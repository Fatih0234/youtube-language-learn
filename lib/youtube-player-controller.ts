export interface YouTubePlayerInstance {
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
}

export interface YouTubePlayerController {
  seek: (seconds: number) => void;
  seekAndPause: (seconds: number) => void;
  playWindow: (start: number, end?: number, fallbackDuration?: number) => void;
  clearWindowStop: () => void;
}

interface CreateYouTubePlayerControllerOptions {
  playerRef: { current: YouTubePlayerInstance | null };
  playWindowEndRef: { current: number | null };
  onTimeUpdate?: (seconds: number) => void;
}

export function resolvePlaybackWindowEnd(
  start: number,
  end?: number,
  fallbackDuration = 6
): number {
  return end ?? start + fallbackDuration;
}

export function createYouTubePlayerController({
  playerRef,
  playWindowEndRef,
  onTimeUpdate,
}: CreateYouTubePlayerControllerOptions): YouTubePlayerController {
  const syncTime = (seconds: number) => {
    onTimeUpdate?.(seconds);
  };

  return {
    seek(seconds: number) {
      const player = playerRef.current;
      if (!player) return;

      playWindowEndRef.current = null;
      player.seekTo(seconds, true);
      syncTime(seconds);
      player.playVideo();
    },

    seekAndPause(seconds: number) {
      const player = playerRef.current;
      if (!player) return;

      playWindowEndRef.current = null;
      player.seekTo(seconds, true);
      syncTime(seconds);
      player.pauseVideo();
    },

    playWindow(start: number, end?: number, fallbackDuration = 6) {
      const player = playerRef.current;
      if (!player) return;

      playWindowEndRef.current = resolvePlaybackWindowEnd(start, end, fallbackDuration);
      player.seekTo(start, true);
      syncTime(start);
      player.playVideo();
    },

    clearWindowStop() {
      playWindowEndRef.current = null;
    },
  };
}
