import React from "react";

export default function LessonSkeleton() {
  return (
    <main className="page lesson-layout lesson-skeleton" aria-label="Загружаем урок">
      <article className="lesson-content">
        <div className="skeleton skeleton--badge" />
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--text skeleton--text-short" />
        <div className="lesson-material">
          <div className="skeleton skeleton--media" />
          <div className="lesson-material__body">
            <div className="skeleton skeleton--text" />
            <div className="skeleton skeleton--text skeleton--text-short" />
            <div className="skeleton skeleton--button" />
          </div>
        </div>
        <div className="skeleton skeleton--section" />
        <div className="skeleton skeleton--section" />
      </article>

      <aside className="lesson-sidebar">
        <div className="skeleton skeleton--text" />
        <div className="skeleton skeleton--progress" />
        <div className="skeleton skeleton--nav" />
        <div className="skeleton skeleton--nav" />
        <div className="skeleton skeleton--nav" />
      </aside>
    </main>
  );
}
