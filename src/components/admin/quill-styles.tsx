"use client";

import { useEffect } from "react";

export function QuillStyles() {
  useEffect(() => {
    // Quill CSS-i dinamik yüklə (client-side only)
    if (typeof window !== "undefined") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = "https://cdn.quilljs.com/1.3.6/quill.snow.css";
      link.id = "quill-styles";
      
      // Yalnız əgər artıq yoxdursa əlavə et
      if (!document.getElementById("quill-styles")) {
        document.head.appendChild(link);
      }
    }
  }, []);

  return null;
}

