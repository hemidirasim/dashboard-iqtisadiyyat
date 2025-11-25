"use client";

import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2, Power, Shield } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { useState } from "react";

type UserActionsProps = {
  userId: string;
  userName: string;
  status: boolean;
  role: number;
};

export function UserActions({ userId, userName, status, role }: UserActionsProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleStatus = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/admin/users/${userId}`, { action: "toggle-status" });
      toast.success(`İstifadəçi ${status ? "deaktiv" : "aktiv"} edildi`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xəta baş verdi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRole = async () => {
    try {
      setIsLoading(true);
      await api.patch(`/admin/users/${userId}`, { action: "toggle-role" });
      toast.success("Rol dəyişdirildi");
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xəta baş verdi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await api.delete(`/admin/users/${userId}`);
      toast.success("İstifadəçi silindi");
      setShowDeleteDialog(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xəta baş verdi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isLoading}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={`/dashboard/users/${userId}`}>
              <Pencil className="mr-2 size-4" />
              Redaktə et
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleToggleStatus} disabled={isLoading}>
            <Power className="mr-2 size-4" />
            {status ? "Deaktiv et" : "Aktiv et"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleRole} disabled={isLoading}>
            <Shield className="mr-2 size-4" />
            Rol dəyişdir
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
            className="text-destructive"
          >
            <Trash2 className="mr-2 size-4" />
            Sil
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>İstifadəçini silmək</DialogTitle>
            <DialogDescription>
              <strong>{userName}</strong> istifadəçisini silmək istədiyinizə əminsiniz? Bu əməliyyat
              geri alına bilməz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}
            >
              Ləğv et
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isLoading}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

