"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { VideoBundle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, PlayCircle, Film, Trash2 } from "lucide-react";
import { fetchWithCSRF } from "@/lib/csrf-client";
import { toast } from "sonner";
import Link from "next/link";

export default function BundleDetailPage() {
  const { bundleId } = useParams<{ bundleId: string }>();
  const [bundle, setBundle] = useState<VideoBundle | null>(null);
  const [videoIds, setVideoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/bundles/${bundleId}`)
      .then((r) => r.json())
      .then((data) => {
        setBundle(data.bundle);
        setVideoIds(data.videos || []);
      })
      .finally(() => setIsLoading(false));
  }, [bundleId]);

  const handleRemoveVideo = async (videoId: string) => {
    try {
      await fetchWithCSRF(`/api/bundles/${bundleId}/videos?videoId=${encodeURIComponent(videoId)}`, {
        method: "DELETE",
      });
      setVideoIds((prev) => prev.filter((id) => id !== videoId));
      toast.success("Video removed from bundle");
    } catch {
      toast.error("Failed to remove video");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bundle) {
    return <div className="max-w-4xl mx-auto px-4 py-8 text-center text-muted-foreground">Bundle not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/bundles">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            Bundles
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{bundle.name}</h1>
          {bundle.description && <p className="text-muted-foreground mt-1">{bundle.description}</p>}
        </div>
        {videoIds.length > 0 && (
          <Link href={`/practice/bundle/${bundleId}`}>
            <Button className="gap-2">
              <PlayCircle className="h-4 w-4" />
              Practice Bundle
            </Button>
          </Link>
        )}
      </div>

      {videoIds.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3 text-center">
          <Film className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No videos in this bundle yet.</p>
          <p className="text-sm text-muted-foreground">Add videos from a study page via the &ldquo;Add to Bundle&rdquo; menu.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {videoIds.map((videoId) => (
            <div key={videoId} className="flex items-center justify-between p-4 rounded-lg border">
              <Link href={`/analyze/${videoId}`} className="flex items-center gap-3 flex-1 hover:underline">
                <Film className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{videoId}</span>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveVideo(videoId)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
