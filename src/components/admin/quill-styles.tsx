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

      // Paraqraf üçün custom CSS əlavə et
      const style = document.createElement("style");
      style.id = "quill-paragraph-styles";
      
      if (!document.getElementById("quill-paragraph-styles")) {
        style.textContent = `
          .ql-editor {
            min-height: 200px;
          }
          
          .ql-editor p {
            margin: 0 0 0.4em 0;
            padding: 0;
            line-height: 1.6;
          }
          
          .ql-editor p:last-child {
            margin-bottom: 0;
          }
          
          .ql-editor p + p {
            margin-top: 0.4em;
          }
          
          .ql-editor h1,
          .ql-editor h2,
          .ql-editor h3 {
            margin: 1em 0 0.5em 0;
            font-weight: bold;
          }
          
          .ql-editor h1 {
            font-size: 2em;
          }
          
          .ql-editor h2 {
            font-size: 1.5em;
          }
          
          .ql-editor h3 {
            font-size: 1.25em;
          }
          
          .ql-editor ul,
          .ql-editor ol {
            margin: 1em 0;
            padding-left: 2em;
          }
          
          .ql-editor li {
            margin: 0.5em 0;
          }
          
          .ql-editor blockquote {
            margin: 1em 0;
            padding-left: 1em;
            border-left: 4px solid #ccc;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  return null;
}

