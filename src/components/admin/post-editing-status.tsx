"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { api } from "@/lib/api";

type OtherUser = {
  userId: number;
  userName: string;
  startedAt: string;
};

type EditingStatus = {
  editing: boolean;
  otherUsers?: OtherUser[];
  currentUserEditing?: boolean;
};

type PostEditingStatusProps = {
  postId: string;
};

export function PostEditingStatus({ postId }: PostEditingStatusProps) {
  const [editingStatus, setEditingStatus] = useState<EditingStatus | null>(null);

  // Editing session-u başlat
  useEffect(() => {
    let isMounted = true;

    // Statusu yoxla funksiyası
    const checkStatus = async () => {
      if (!isMounted) return;

      try {
        const response = await api.get<EditingStatus>(`/admin/posts/${postId}/editing`);
        if (isMounted) {
          setEditingStatus(response.data);
        }
      } catch (error) {
        console.error("Failed to check editing status:", error);
      }
    };

    // Session-u başlat
    const startEditing = async () => {
      try {
        await api.post(`/admin/posts/${postId}/editing`);
        // Session yaradıldıqdan sonra dərhal statusu yoxla
        await checkStatus();
      } catch (error) {
        console.error("Failed to start editing session:", error);
      }
    };

    // Session-u başlat və statusu yoxla
    startEditing();

    // Polling ilə statusu yoxla
    const checkInterval = setInterval(checkStatus, 2000); // Hər 2 saniyədə bir yoxla

    // Səhifə tərk edildikdə session-u təmizlə
    const handleBeforeUnload = () => {
      api.delete(`/admin/posts/${postId}/editing`).catch(() => {
        // Ignore errors on unload
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      isMounted = false;
      clearInterval(checkInterval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Cleanup on unmount
      api.delete(`/admin/posts/${postId}/editing`).catch(() => {
        // Ignore errors on cleanup
      });
    };
  }, [postId]);

  // Bildiriş göstər - həm edit edən, həm də sonradan girən üçün
  useEffect(() => {
    const toastIdPrefix = `editing-${postId}`;
    let currentToastId: string | number | undefined;

    if (!editingStatus) {
      // editingStatus null olduqda toast-u sil
      toast.dismiss(toastIdPrefix);
      return;
    }

    // Başqa istifadəçilər edit edirsə, bildiriş göstər
    if (editingStatus.editing && editingStatus.otherUsers && editingStatus.otherUsers.length > 0) {
      const userNames = editingStatus.otherUsers.map((u) => u.userName).join(", ");
      const userIds = editingStatus.otherUsers.map((u) => u.userId).join(",");
      
      // Əgər cari istifadəçi də edit edirsə, fərqli mesaj göstər
      const message = editingStatus.currentUserEditing
        ? `Siz və ${userNames} eyni anda bu məqaləni redaktə edirsiniz`
        : editingStatus.otherUsers.length === 1
          ? `${userNames} hal-hazırda bu məqaləni redaktə edir`
          : `${editingStatus.otherUsers.length} istifadəçi hal-hazırda bu məqaləni redaktə edir: ${userNames}`;

      // User ID-lərini toast ID-yə əlavə et ki, yeni istifadəçi əlavə olunduqda yenidən göstərilsin
      const toastId = `${toastIdPrefix}-${userIds}`;
      currentToastId = toastId;
      toast(message, {
        duration: 10000,
        id: toastId, // User ID-ləri ilə dinamik ID
        description: "Eyni anda redaktə etmək məlumatların itirilməsinə səbəb ola bilər.",
      });
    } else {
      // Başqa istifadəçilər yoxdursa, toast-u sil
      toast.dismiss(toastIdPrefix);
    }

    // Cleanup: komponent unmount olduqda və ya editingStatus dəyişdikdə toast-u sil
    return () => {
      if (currentToastId) {
        toast.dismiss(currentToastId);
      } else {
        toast.dismiss(toastIdPrefix);
      }
    };
  }, [editingStatus, postId]);

  if (!editingStatus?.editing && !editingStatus?.currentUserEditing) {
    return null;
  }

  // Yalnız başqa istifadəçilər edit edirsə
  if (editingStatus.editing && editingStatus.otherUsers && editingStatus.otherUsers.length > 0) {
    const userNames = editingStatus.otherUsers.map((u) => u.userName).join(", ");
    return (
      <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
        <AlertCircle className="size-4 text-yellow-600 dark:text-yellow-500" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">
          Diqqət: {editingStatus.otherUsers.length === 1 ? "Başqa istifadəçi" : "Başqa istifadəçilər"} bu məqaləni redaktə edir
        </AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-300">
          <strong>{userNames}</strong> hal-hazırda bu məqalə üzərində işləyir.
          {editingStatus.currentUserEditing && " Siz də eyni anda redaktə edirsiniz."}
          Eyni anda redaktə etmək məlumatların itirilməsinə səbəb ola bilər.
        </AlertDescription>
      </Alert>
    );
  }

  // Cari istifadəçi edit edirsə (başqa istifadəçilər yoxdursa, bu alert göstərilməz)
  return null;
}

