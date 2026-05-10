import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { coursesApi } from "../api/coursesApi";
import { progressApi } from "../api/progressApi";
import ProgressBar from "../components/ProgressBar";
import { Loader, PageHeader } from "../components/ui";

export default function CourseLearning() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);

  const lessons = useMemo(() => course?.modules?.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title }))) || [], [course]);

  useEffect(() => {
    Promise.all([coursesApi.getById(id), progressApi.getCourse(id)]).then(([courseResponse, progressResponse]) => {
      setCourse(courseResponse.data);
      setProgress(progressResponse.data);
    });
  }, [id]);

  const completed = new Set(progress?.lessons?.filter((item) => item.status === "completed").map((item) => item.lessonId));

  if (!course) return <main className="page"><Loader text="Загружаем обучение..." /></main>;

  return (
    <main className="page">
      <PageHeader
        eyebrow="Прохождение курса"
        title={course.title}
        text="Выберите урок, продолжите обучение и отмечайте завершённые занятия."
        action={<ProgressBar value={progress?.stats?.completionPercent || 0} />}
      />
      <div className="lesson-list">
        {lessons.map((lesson, index) => (
          <Link
            className={`lesson-card ${completed.has(lesson.id) ? "lesson-card--completed" : ""}`}
            key={lesson.id}
            to={`/lessons/${lesson.id}?course=${id}`}
          >
            <span>{index + 1}</span>
            <div>
              <p>{lesson.moduleTitle}</p>
              <h3>{lesson.title}</h3>
            </div>
            <strong>{completed.has(lesson.id) ? "Завершён" : "Открыть"}</strong>
          </Link>
        ))}
      </div>
    </main>
  );
}
