"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Star, GripVertical } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type UploadedFile = {
  name: string;
  url: string;
  size: number;
  type: string;
};

type ImageUploadProps = {
  value?: string[];
  onChange?: (urls: string[]) => void;
  onMainImageChange?: (url: string) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
};

export function ImageUpload({
  value = [],
  onChange,
  onMainImageChange,
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 5,
}: ImageUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef<string>("");

  // Value dəyişəndə uploadedFiles state-ini yenilə
  useEffect(() => {
    const normalizedValue = Array.isArray(value) ? value.filter((url) => url && typeof url === "string" && url.trim().length > 0) : [];
    const valueStr = JSON.stringify(normalizedValue);
    
    // Debug üçün console.log
    if (normalizedValue.length > 0) {
      console.log("ImageUpload: Received value", {
        valueLength: value?.length,
        normalizedLength: normalizedValue.length,
        normalizedValue: normalizedValue,
      });
    }
    
    // Yalnız value dəyişdikdə yenilə
    if (prevValueRef.current !== valueStr) {
      prevValueRef.current = valueStr;
      
      if (normalizedValue.length > 0) {
        // Value-dakı URL-ləri UploadedFile formatına çevir
        const files: UploadedFile[] = normalizedValue.map((url) => ({
          name: url.split("/").pop() || url,
          url: url,
          size: 0,
          type: "image/*",
        }));
        
        console.log("ImageUpload: Setting uploadedFiles", files);
        setUploadedFiles(files);
      } else {
        setUploadedFiles([]);
      }
    }
  }, [value]);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const imageFiles = fileArray.filter(
        (file) => file.type.startsWith("image/"),
      );

      if (imageFiles.length === 0) {
        toast.error("Yalnız şəkil faylları yüklənə bilər");
        return;
      }

      if (imageFiles.length > maxFiles) {
        toast.error(`Maksimum ${maxFiles} şəkil yüklənə bilər`);
        return;
      }

      const oversizedFiles = imageFiles.filter(
        (file) => file.size > maxSizeMB * 1024 * 1024,
      );
      if (oversizedFiles.length > 0) {
        toast.error(
          `Bəzi fayllar çox böyükdür. Maksimum ölçü: ${maxSizeMB}MB`,
        );
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        imageFiles.forEach((file) => {
          formData.append("files", file);
        });

        const response = await api.post("/admin/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const newFiles = response.data.files || [];
        const newUrls = newFiles.map((f: UploadedFile) => f.url);
        const updatedUrls = [...value, ...newUrls];

        setUploadedFiles((prev) => [...prev, ...newFiles]);
        onChange?.(updatedUrls);
        toast.success(`${newFiles.length} şəkil yükləndi`);
      } catch (error: any) {
        toast.error(error.message || "Şəkil yükləmə xətası");
      } finally {
        setIsUploading(false);
      }
    },
    [value, onChange, maxFiles, maxSizeMB],
  );

  const handleUploadDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleUploadDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUploadDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles],
  );

  const handleRemove = useCallback(
    (urlToRemove: string) => {
      const updatedUrls = value.filter((url) => url !== urlToRemove);
      setUploadedFiles((prev) => prev.filter((f) => f.url !== urlToRemove));
      onChange?.(updatedUrls);
    },
    [value, onChange],
  );

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleImageDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;

      const newUrls = [...value];
      const draggedItem = newUrls[draggedIndex];
      newUrls.splice(draggedIndex, 1);
      newUrls.splice(index, 0, draggedItem);

      onChange?.(newUrls);
      setDraggedIndex(index);
    },
    [value, onChange, draggedIndex],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleSetMainImage = useCallback(
    (index: number) => {
      if (index === 0) return; // Artıq əsas şəkildir

      const newUrls = [...value];
      const mainImage = newUrls[index];
      newUrls.splice(index, 1);
      newUrls.unshift(mainImage);

      onChange?.(newUrls);
      onMainImageChange?.(mainImage);
      toast.success("Əsas şəkil seçildi");
    },
    [value, onChange, onMainImageChange],
  );

  // Value-dan URL-ləri filter et və normalize et
  const allUrls = Array.isArray(value) 
    ? value.filter((url) => url && typeof url === "string" && url.trim().length > 0)
    : [];

  // Debug üçün console.log
  useEffect(() => {
    if (allUrls.length > 0) {
      console.log("ImageUpload: allUrls", {
        allUrlsLength: allUrls.length,
        allUrls: allUrls,
        valueLength: value?.length,
        value: value,
      });
    }
  }, [allUrls, value]);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isUploading && "opacity-50 pointer-events-none",
        )}
        onDragOver={handleUploadDragOver}
        onDragLeave={handleUploadDragLeave}
        onDrop={handleUploadDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {isUploading ? (
            <>
              <Loader2 className="size-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Yüklənir...</p>
            </>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Upload className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Şəkilləri buraya sürükləyin və ya klikləyin
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, GIF (maksimum {maxSizeMB}MB, {maxFiles} şəkil)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="mr-2 size-4" />
                Şəkil seç
              </Button>
            </>
          )}
        </div>
      </div>

      {allUrls.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {allUrls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleImageDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative aspect-square rounded-lg border overflow-hidden bg-muted cursor-move",
                draggedIndex === index && "opacity-50 scale-95",
                index === 0 && "ring-2 ring-primary"
              )}
            >
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
              />
              
              {/* Əsas şəkil badge */}
              {index === 0 && (
                <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                  <Star className="size-3 mr-1 fill-current" />
                  Əsas şəkil
                </Badge>
              )}

              {/* Drag handle */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="size-4 text-white bg-black/50 rounded p-0.5" />
              </div>

              {/* Action buttons */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index !== 0 && (
                  <button
                    type="button"
                    onClick={() => handleSetMainImage(index)}
                    className="p-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    title="Əsas şəkil et"
                  >
                    <Star className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(url)}
                  className="p-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
                  title="Sil"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

