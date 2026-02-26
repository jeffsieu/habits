"use client";

import { useState } from "react";
import { Cloud, HardDrive, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PendingLocalData } from "@/lib/storage/storage-adapter";

interface SyncPromptDialogProps {
  pendingData: PendingLocalData;
  isSyncing: boolean;
  onSync: () => Promise<void>;
  onDismiss: () => void;
}

export function SyncPromptDialog({
  pendingData,
  isSyncing,
  onSync,
  onDismiss,
}: SyncPromptDialogProps) {
  const [error, setError] = useState<string | null>(null);

  const habitCount = pendingData.habits.length;
  const tagCount = pendingData.tags.length;

  const handleSync = async () => {
    setError(null);
    try {
      await onSync();
    } catch {
      setError("Failed to sync data. Please try again.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onDismiss()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Sync Local Data to Cloud
          </DialogTitle>
          <DialogDescription>
            You have local habits that aren&apos;t synced to your account yet.
            Would you like to upload them to the cloud?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 rounded-lg border p-4 bg-muted/50">
            <HardDrive className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Local Data Found</p>
              <p className="text-sm text-muted-foreground">
                {habitCount} habit{habitCount !== 1 ? "s" : ""}
                {tagCount > 0 && (
                  <>
                    , {tagCount} tag{tagCount !== 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDismiss}
            disabled={isSyncing}
            className="sm:order-1"
          >
            Keep Separate
          </Button>
          <Button
            onClick={handleSync}
            disabled={isSyncing}
            className="sm:order-2"
          >
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Cloud className="mr-2 h-4 w-4" />
                Sync to Cloud
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
