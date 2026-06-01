import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { coursesApi } from "../api/coursesApi";
import { progressApi } from "../api/progressApi";
import ProgressBar from "../components/ProgressBar";
import { EmptyState, ErrorMessage, Loader, PageHeader } from "../components/ui";

const statusLabels = {
  not_started: "Не начат",
  in_progress: "В процессе",
  completed: "Завершён",
};

function getLessonStatus(progressByLesson, lessonId) {
  return progressByLesson.get(String(lessonId))?.status || "not_started";
}

export default function CourseLearning() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const modules = useMemo(
    () => course?.modules?.map((module) => ({ ...module, lessons: module.lessons || [] })) || [],
    [course]
  );
  const lessons = useMemo(
    () => modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleTitle: module.title }))),
    [modules]
  );
  const progressByLesson = useMemo(
    () => new Map((progress?.lessons || []).map((item) => [String(item.lessonId), item])),
    [progress]
  );
  const continueLesson = useMemo(
    () =>
      lessons.find((lesson) => getLessonStatus(progressByLesson, lesson.id) === "in_progress") ||
      lessons.find((lesson) => getLessonStatus(progressByLesson, lesson.id) !== "completed") ||
      lessons[0],
    [lessons, progressByLesson]
  );

  useEffect(() => {
    setError("");
    setCourse(null);
    setProgress(null);

    Promise.all([coursesApi.getById(id), progressApi.getCourse(id)])
      .then(([courseResponse, progressResponse]) => {
        setCourse(courseResponse.data);
        setProgress(progressResponse.data);
      })
      .catch((requestError) => {
        setError(requestError.message === "Курс не найден" ? "Курс не найден" : "Не удалось загрузить обучение. Попробуйте позже.");
      });
  }, [id]);

  if (error) return <main className="page"><ErrorMessage text={error} /></main>;
  if (!course) return <main className="page"><Loader text="Загружаем обучение..." /></main>;

  return (
    <main className="page">
      <PageHeader
        eyebrow="Прохождение курса"
        title={course.title}
        text="Выберите урок, продолжите обучение и отмечайте завершённые занятия."
        action={
          <div className="learning-actions">
            <ProgressBar value={progress?.stats?.completionPercent || 0} />
            {continueLesson && (
              <Link className="button" to={`/lessons/${continueLesson.id}?course=${id}`}>
                Продолжить обучение
              </Link>
            )}
          </div>
        }
      />

      {!lessons.length ? (
        <EmptyState
          title="В курсе пока нет уроков"
          text="Когда программа будет заполнена, модули и уроки появятся на этой странице."
        />
      ) : (
        <div className="learning-modules">
          {modules.map((module, moduleIndex) => {
            const moduleLessons = module.lessons || [];
            const completedCount = moduleLessons.filter((lesson) => getLessonStatus(progressByLesson, lesson.id) === "completed").length;
            const modulePercent = moduleLessons.length ? Math.round((completedCount / moduleLessons.length) * 100) : 0;

            return (
              <section className="learning-module" key={module.id || `${moduleIndex}-${module.title}`}>
                <div className="learning-module__head">
                  <div>
                    <p className="eyebrow">Модуль {module.orderNum || moduleIndex + 1}</p>
                    <h2>{module.title}</h2>
                    {module.description && <p>{module.description}</p>}
                  </div>
                  <div className="learning-module__progress">
                    <strong>{completedCount} из {moduleLessons.length}</strong>
                    <ProgressBar value={modulePercent} />
                  </div>
                </div>

                <div className="lesson-list">
                  {moduleLessons.map((lesson, lessonIndex) => {
                    const lessonStatus = getLessonStatus(progressByLesson, lesson.id);

                    return (
                      <Link
                        className={`lesson-card lesson-card--${lessonStatus}`}
                        key={lesson.id}
                        to={`/lessons/${lesson.id}?course=${id}`}
                      >
                        <span>{lesson.orderNum || lessonIndex + 1}</span>
                        <div>
                          <p>{lesson.contentType || "Материал"}</p>
                          <h3>{lesson.title}</h3>
                        </div>
                        <div className="lesson-card__side">
                          <small className={`lesson-status lesson-status--${lessonStatus}`}>
                            {statusLabels[lessonStatus]}
                          </small>
                          <strong>Открыть</strong>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
