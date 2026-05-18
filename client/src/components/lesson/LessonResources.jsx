import React from "react";
import { FileText, Link as LinkIcon } from "lucide-react";

export default function LessonResources({ resources = [] }) {
  return (
    <section className="lesson-section">
      <div className="lesson-section__head">
        <h2>Ресурсы</h2>
        <span>{resources.length}</span>
      </div>

      {resources.length ? (
        <div className="resource-grid">
          {resources.map((resource) => (
            <article className="resource-card" key={resource.id}>
              <div className="resource-card__icon">
                {resource.fileType === "link" ? <LinkIcon size={22} /> : <FileText size={22} />}
              </div>
              <div>
                <h3>{resource.fileName}</h3>
                <p>{resource.fileType || "Материал"} к этому уроку</p>
              </div>
              <a href={resource.fileUrl} target="_blank" rel="noreferrer">
                Открыть
              </a>
            </article>
          ))}
        </div>
      ) : (
        <div className="lesson-empty-card">
          <FileText size={24} />
          <div>
            <h3>Дополнительных материалов пока нет</h3>
            <p>Когда преподаватель добавит файлы или ссылки, они появятся в этом блоке.</p>
          </div>
        </div>
      )}
    </section>
  );
}
