"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Power, PowerOff, Eye, EyeOff, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";

type PostActionsProps = {
  postId: string;
  postTitle: string;
  status: boolean;
  publish: number;
  deletedAt?: string | null;
  onUpdate?: () => void;
};

export function PostActions({
  postId,
  postTitle,
  status,
  publish,
  deletedAt,
  onUpdate,
}: PostActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isTogglingPublish, setIsTogglingPublish] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const isDeleted = deletedAt !== null && deletedAt !== undefined;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/admin/posts/${postId}`);
      toast.success("Məqalə silindi");
      setDeleteDialogOpen(false);
      router.refresh();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Xəta baş verdi");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true);
    try {
      await api.patch(`/admin/posts/${postId}`, { action: "toggle-status" });
      toast.success(status ? "Məqalə deaktivləşdirildi" : "Məqalə aktivləşdirildi");
      router.refresh();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Xəta baş verdi");
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleTogglePublish = async () => {
    setIsTogglingPublish(true);
    try {
      await api.patch(`/admin/posts/${postId}`, { action: "toggle-publish" });
      toast.success(
        publish === 1 ? "Məqalə qaralamaya çevrildi" : "Məqalə yayımlandı",
      );
      router.refresh();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Xəta baş verdi");
    } finally {
      setIsTogglingPublish(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await api.patch(`/admin/posts/${postId}`, { action: "restore" });
      toast.success("Məqalə bərpa edildi");
      router.refresh();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Xəta baş verdi");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isDeleted ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRestore}
          disabled={isRestoring}
          title="Bərpa et"
        >
          <RotateCcw className="size-4 text-green-600" />
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleStatus}
            disabled={isTogglingStatus}
            title={status ? "Deaktiv et" : "Aktiv et"}
          >
            {status ? (
              <PowerOff className="size-4 text-muted-foreground" />
            ) : (
              <Power className="size-4 text-green-600" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleTogglePublish}
            disabled={isTogglingPublish}
            title={publish === 1 ? "Qaralama et" : "Yayımla"}
          >
            {publish === 1 ? (
              <EyeOff className="size-4 text-muted-foreground" />
            ) : (
              <Eye className="size-4 text-blue-600" />
            )}
          </Button>
        </>
      )}

      {!isDeleted && (
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" title="Sil">
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Məqaləni silmək istədiyinizə əminsiniz?</DialogTitle>
              <DialogDescription>
                "{postTitle}" adlı məqalə silinəcək. Bu əməliyyat geri qaytarıla bilməz.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Ləğv et
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Silinir..." : "Sil"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

