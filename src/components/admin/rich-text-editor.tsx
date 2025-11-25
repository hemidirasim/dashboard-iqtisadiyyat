"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { QuillStyles } from "./quill-styles";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

function Editor({ value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const isUpdatingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageHandlerRef = useRef<(() => void) | null>(null);
  const valueRef = useRef<string>(value);
  const [isClient, setIsClient] = useState(false);

  // Value-ni ref-də saxla
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Image upload handler
  useEffect(() => {
    if (!isClient) return;

    imageHandlerRef.current = async () => {
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        // Fayl ölçüsünü yoxla (5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("Şəkil ölçüsü maksimum 5MB ola bilər");
          return;
        }

        try {
          const formData = new FormData();
          formData.append("files", file);

          const response = await api.post("/admin/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });

          const uploadedFile = response.data.files?.[0];
          if (uploadedFile?.url && quillRef.current) {
            const range = quillRef.current.getSelection(true);
            quillRef.current.insertEmbed(range.index, "image", uploadedFile.url);
            quillRef.current.setSelection(range.index + 1);
            toast.success("Şəkil əlavə edildi");
          }
        } catch (error: any) {
          toast.error(error.message || "Şəkil yükləmə xətası");
        }
      };
    };
  }, [isClient]);

  useEffect(() => {
    if (!isClient || !editorRef.current) return;

    // Quill-i dinamik yüklə
    import("quill").then((QuillModule) => {
      const Quill = QuillModule.default;

      // Quill editor-u yalnız bir dəfə yarad
      if (!quillRef.current) {
        quillRef.current = new Quill(editorRef.current!, {
          theme: "snow",
          placeholder: "Kontent mətnini daxil edin...",
          modules: {
            toolbar: {
              container: [
                [{ header: [1, 2, 3, false] }],
                ["bold", "italic", "underline", "strike"],
                [{ list: "ordered" }, { list: "bullet" }],
                [{ align: [] }],
                ["link", "image"],
                ["blockquote", "code-block"],
                [{ color: [] }, { background: [] }],
                ["clean"],
              ],
              handlers: {
                image: () => {
                  imageHandlerRef.current?.();
                },
              },
            },
          },
        });

        // Dəyişiklikləri dinlə
        quillRef.current.on("text-change", () => {
          if (!isUpdatingRef.current && quillRef.current) {
            const html = quillRef.current.root.innerHTML || "";
            onChange(html);
          }
        });

        // Quill yaradıldıqdan sonra ilk dəfə value-ni set et
        // Promise asinxrondur, ona görə də ref-dən value-ni alırıq
        setTimeout(() => {
          const initialValue = valueRef.current || "<p><br></p>";
          if (quillRef.current) {
            isUpdatingRef.current = true;
            quillRef.current.root.innerHTML = initialValue;
            setTimeout(() => {
              isUpdatingRef.current = false;
            }, 0);
          }
        }, 100);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient]); // onChange və value-ni dependency array-dən çıxardıq

  // Value dəyişərsə, editor-u yenilə (yalnız Quill yaradıldıqdan sonra)
  useEffect(() => {
    if (!quillRef.current || !isClient) return;

    const currentContent = quillRef.current.root.innerHTML;
    const normalizedValue = value || "<p><br></p>";
    
    // Sadə müqayisə - HTML məzmununu normalize etmədən
    if (currentContent.trim() !== normalizedValue.trim()) {
      isUpdatingRef.current = true;
      const selection = quillRef.current.getSelection();
      quillRef.current.root.innerHTML = normalizedValue;
      
      // Cursor pozisiyasını bərpa et
      if (selection) {
        quillRef.current.setSelection(selection);
      }
      
      // setTimeout ilə flag-i sıfırla
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [value, isClient]);

  if (!isClient) {
    return (
      <div className="rounded-md border border-input bg-background min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Editor yüklənir...</p>
      </div>
    );
  }

  return (
    <>
      <QuillStyles />
      <div className="rounded-md border border-input bg-background">
        <div ref={editorRef} className="min-h-[200px]" />
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
      </div>
    </>
  );
}

export { Editor as RichTextEditor };

