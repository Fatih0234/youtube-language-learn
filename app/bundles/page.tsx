"use client";

import { useState, useEffect } from "react";
import { VideoBundle } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, FolderOpen, ArrowRight } from "lucide-react";
import { fetchWithCSRF } from "@/lib/csrf-client";
import { toast } from "sonner";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function BundlesPage() {
  const [bundles, setBundles] = useState<VideoBundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadBundles = async () => {
    try {
      const res = await fetch("/api/bundles");
      const data = await res.json();
      setBundles(data.bundles || []);
    } catch {
      toast.error("Failed to load bundles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadBundles(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetchWithCSRF("/api/bundles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      setBundles((prev) => [data.bundle, ...prev]);
      setNewName("");
      setDialogOpen(false);
      toast.success("Bundle created");
    } catch {
      toast.error("Failed to create bundle");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Bundles</h1>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Bundle
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : bundles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <FolderOpen className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-medium">No bundles yet</p>
            <p className="text-sm text-muted-foreground">Create a bundle to group videos for practice.</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>Create your first bundle</Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {bundles.map((bundle) => (
            <Link key={bundle.id} href={`/bundles/${bundle.id}`}>
              <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/40 transition-colors cursor-pointer">
                <div>
                  <p className="font-medium">{bundle.name}</p>
                  {bundle.description && (
                    <p className="text-sm text-muted-foreground">{bundle.description}</p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Bundle</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Bundle name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isCreating || !newName.trim()}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
