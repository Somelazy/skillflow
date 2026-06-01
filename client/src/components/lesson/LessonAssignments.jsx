import React from "react";
import { ClipboardList } from "lucide-react";

export default function LessonAssignments({ assignments = [] }) {
  return (
    <section className="lesson-section">
      <div className="lesson-section__head">
        <h2>Задания</h2>
        <span>{assignments.length}</span>
      </div>

      {assignments.length ? (
        <div className="assignment-grid">
          {assignments.map((assignment) => (
            <article className="assignment" key={assignment.id}>
              <div className="assignment__meta">
                <ClipboardList size={20} />
                <strong>{assignment.type || "Задание"}</strong>
                {assignment.maxScore ? <span>{assignment.maxScore} баллов</span> : null}
              </div>
              <p>{assignment.question || "Описание задания пока не добавлено."}</p>
              <small className="assignment__status">Пока без отправки ответа</small>
            </article>
          ))}
        </div>
      ) : (
        <div className="lesson-empty-card">
          <ClipboardList size={24} />
          <div>
            <h3>Задания появятся позже</h3>
            <p>Сейчас можно изучить материал и ресурсы урока, а практику добавить после обновления курса.</p>
          </div>
        </div>
      )}
    </section>
  );
}
