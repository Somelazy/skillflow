import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, PlayCircle } from "lucide-react";

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderInlineMarkdown(value) {
  return value
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function markdownToHtml(markdown) {
  const lines = escapeHtml(markdown).replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let listOpen = false;
  let codeOpen = false;
  let codeLines = [];

  const closeList = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  };

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      closeList();
      if (codeOpen) {
        html.push(`<pre><code>${codeLines.join("\n")}</code></pre>`);
        codeLines = [];
        codeOpen = false;
      } else {
        codeOpen = true;
      }
      return;
    }

    if (codeOpen) {
      codeLines.push(line);
      return;
    }

    if (!line.trim()) {
      closeList();
      return;
    }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3>${renderInlineMarkdown(line.slice(4))}</h3>`);
      return;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2>${renderInlineMarkdown(line.slice(3))}</h2>`);
      return;
    }

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1>${renderInlineMarkdown(line.slice(2))}</h1>`);
      return;
    }

    if (line.startsWith("- ")) {
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${renderInlineMarkdown(line.slice(2))}</li>`);
      return;
    }

    closeList();
    html.push(`<p>${renderInlineMarkdown(line)}</p>`);
  });

  closeList();
  if (codeOpen) {
    html.push(`<pre><code>${codeLines.join("\n")}</code></pre>`);
  }

  return html.join("");
}

function getMaterialKind(contentUrl = "") {
  const cleanUrl = String(contentUrl).split("?")[0].toLowerCase();

  if (cleanUrl.endsWith(".md") || cleanUrl.endsWith(".markdown")) return "markdown";
  if (cleanUrl.endsWith(".html") || cleanUrl.endsWith(".htm")) return "html";
  return "link";
}

export default function LessonMaterial({ lesson }) {
  const contentUrl = lesson?.contentUrl || "";
  const materialType = String(lesson?.contentType || "").toLowerCase();
  const isVideoLesson = materialType.includes("video");
  const materialKind = useMemo(() => getMaterialKind(contentUrl), [contentUrl]);
  const isInlineMaterial = ["markdown", "html"].includes(materialKind);
  const [viewerState, setViewerState] = useState({
    loading: false,
    error: "",
    content: "",
  });

  useEffect(() => {
    let isMounted = true;

    if (!contentUrl || !isInlineMaterial) {
      setViewerState({ loading: false, error: "", content: "" });
      return () => {
        isMounted = false;
      };
    }

    setViewerState({ loading: true, error: "", content: "" });

    fetch(contentUrl)
      .then((response) => {
        if (!response.ok) throw new Error("Material loading failed");
        return response.text();
      })
      .then((content) => {
        if (!isMounted) return;
        setViewerState({ loading: false, error: "", content });
      })
      .catch(() => {
        if (!isMounted) return;
        setViewerState({
          loading: false,
          error: "Не удалось загрузить материал внутри страницы. Его можно открыть в новой вкладке.",
          content: "",
        });
      });

    return () => {
      isMounted = false;
    };
  }, [contentUrl, isInlineMaterial]);

  const materialTitle = isVideoLesson ? "Видео-материал" : materialKind === "markdown" ? "Markdown-материал" : "Учебный материал";
  const htmlPreview = useMemo(
    () => `
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 24px; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.65; color: #182235; }
        img, video, iframe { max-width: 100%; }
        pre { max-width: 100%; overflow-x: auto; padding: 16px; border-radius: 8px; background: #0f172a; color: #e2e8f0; }
        code { overflow-wrap: anywhere; }
      </style>
      ${viewerState.content}
    `,
    [viewerState.content]
  );

  return (
    <section className={`lesson-material ${isVideoLesson ? "lesson-material--video" : ""}`}>
      <div className="lesson-material__preview">
        {isVideoLesson ? <PlayCircle size={54} /> : <FileText size={54} />}
        <div>
          <span>Основной материал урока</span>
          <strong>{materialTitle}</strong>
        </div>
      </div>

      <div className="lesson-material__body">
        <p>
          {isVideoLesson
            ? "Откройте видео и проходите урок в своём темпе. После просмотра можно отметить урок завершённым."
            : "Изучите основной материал прямо на странице, затем переходите к ресурсам, заданиям и завершению урока."}
        </p>

        {contentUrl ? (
          <a className="button" href={contentUrl} target="_blank" rel="noreferrer">
            {isVideoLesson ? <PlayCircle size={18} /> : <ExternalLink size={18} />}
            {isVideoLesson ? "Смотреть материал" : "Открыть материал"}
          </a>
        ) : (
          <div className="lesson-material__empty">
            <FileText size={20} />
            <span>Материал урока пока не добавлен.</span>
          </div>
        )}

        {contentUrl && !isInlineMaterial && (
          <span className="lesson-material__url">{contentUrl}</span>
        )}
      </div>

      {contentUrl && isInlineMaterial ? (
        <div className="material-viewer">
          {viewerState.loading ? (
            <div className="material-viewer__loading">
              <span />
              <span />
              <span />
            </div>
          ) : viewerState.error ? (
            <div className="material-viewer__error">
              <p>{viewerState.error}</p>
              <a href={contentUrl} target="_blank" rel="noreferrer">
                Открыть материал
              </a>
            </div>
          ) : materialKind === "html" ? (
            <iframe
              className="material-viewer__frame"
              title={`Материал урока: ${lesson?.title || "урок"}`}
              sandbox=""
              srcDoc={htmlPreview}
            />
          ) : (
            <div
              className="markdown-viewer"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(viewerState.content) }}
            />
          )}
        </div>
      ) : null}
    </section>
  );
}
