import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { coursesApi } from "../api/coursesApi";
import { progressApi } from "../api/progressApi";
import { useAuth } from "../context/AuthContext";
import { Badge, EmptyState, ErrorMessage, Loader } from "../components/ui";
import ProgressBar from "../components/ProgressBar";

const statusLabels = {
  not_started: "Не начат",
  in_progress: "В процессе",
  completed: "Завершён",
};

function getLessonStatus(progressByLesson, lessonId) {
  return progressByLesson.get(String(lessonId))?.status || "not_started";
}

export default function CourseDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  const modules = useMemo(
    () => course?.modules?.map((module) => ({ ...module, lessons: module.lessons || [] })) || [],
    [course]
  );
  const lessons = useMemo(() => modules.flatMap((module) => module.lessons), [modules]);
  const progressByLesson = useMemo(
    () => new Map((progress?.lessons || []).map((item) => [String(item.lessonId), item])),
    [progress]
  );
  const hasStartedProgress = useMemo(
    () => (progress?.lessons || []).some((item) => item.status !== "not_started" || item.startedAt || item.completedAt),
    [progress]
  );
  const continueLesson = useMemo(
    () =>
      lessons.find((lesson) => getLessonStatus(progressByLesson, lesson.id) === "in_progress") ||
      lessons.find((lesson) => getLessonStatus(progressByLesson, lesson.id) !== "completed"),
    [lessons, progressByLesson]
  );
  const continueLink = continueLesson ? `/lessons/${continueLesson.id}?course=${course?.id || id}` : `/learn/${course?.id || id}`;

  useEffect(() => {
    setError("");
    setCourse(null);
    coursesApi
      .getById(id)
      .then((response) => setCourse(response.data))
      .catch((requestError) => setError(requestError.message === "Курс не найден" ? "Курс не найден" : "Произошла ошибка. Попробуйте позже."));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    progressApi.getCourse(id).then((response) => setProgress(response.data)).catch(() => setProgress(null));
  }, [id, user]);

  if (error) return <main className="page"><ErrorMessage text="Произошла ошибка. Попробуйте позже." /></main>;
  if (!course) return <main className="page"><Loader text="Загружаем курс..." /></main>;

  return (
    <main className="page">
      <section className="course-hero">
        <div>
          <p className="eyebrow">Страница курса</p>
          <h1>{course.title}</h1>
          <p className="lead">{course.description}</p>
          <div className="stats-row">
            <Badge>{course.difficultyLevel || "Base"}</Badge>
            <span>{course.stats?.moduleCount || 0} модулей</span>
            <span>{course.stats?.lessonCount || 0} уроков</span>
            <span>{course.durationHours || 0} часов</span>
          </div>
          <div className="button-row course-hero__actions">
            <Link className="button button--large" to={user ? `/learn/${course.id}` : "/login"}>
              {user ? "Начать обучение" : "Войти для обучения"}
            </Link>
            {user && hasStartedProgress && (
              <Link className="button button--ghost button--large" to={continueLink}>
                Продолжить обучение
              </Link>
            )}
          </div>
        </div>
        <aside>
          <strong>{Number(course.price) > 0 ? `${course.price} ₽` : "Бесплатно"}</strong>
          <p>Доступ к урокам, заданиям, ресурсам и отслеживанию прогресса.</p>
          {user && (
            <div className="course-hero__progress">
              <span>Ваш прогресс</span>
              <ProgressBar value={progress?.stats?.completionPercent || 0} />
            </div>
          )}
        </aside>
      </section>

      <section className="course-overview-grid">
        <div className="course-info-card">
          <p className="eyebrow">О курсе</p>
          <h2>{course.title}</h2>
          <p className="lead">{course.description}</p>
          <div className="course-info-list">
            <span>Практические уроки</span>
            <span>Задания и ресурсы</span>
            <span>Сохранение прогресса</span>
          </div>
        </div>
        <div className="course-info-card">
          <p className="eyebrow">Формат</p>
          <h2>Учитесь по шагам</h2>
          <p>
            Курс разбит на модули и уроки, чтобы можно было проходить материал последовательно и возвращаться к нужным темам.
          </p>
          <div className="course-info-list">
            <span>{course.stats?.moduleCount || modules.length} модулей</span>
            <span>{course.stats?.lessonCount || lessons.length} уроков</span>
            <span>{course.durationHours || 0} часов</span>
          </div>
        </div>
      </section>

      <section className="curriculum curriculum--full">
        <div className="section-title">
          <p className="eyebrow">Программа</p>
          <h2>Что входит в курс</h2>
        </div>
        {lessons.length ? (
          <div className="curriculum-grid">
            {modules.map((module, moduleIndex) => (
              <div className="module-block module-block--status" key={module.id || `${moduleIndex}-${module.title}`}>
                <div className="module-block__head">
                  <h3>{module.orderNum || moduleIndex + 1}. {module.title}</h3>
                  <span>{module.lessons.length} уроков</span>
                </div>
                {module.description && <p>{module.description}</p>}
                <div className="curriculum-lessons">
                  {module.lessons.map((lesson) => {
                    const lessonStatus = getLessonStatus(progressByLesson, lesson.id);

                    return (
                      <span className="lesson-line lesson-line--status" key={lesson.id}>
                        <span>{lesson.title}</span>
                        <small className={`lesson-status lesson-status--${lessonStatus}`}>
                          {statusLabels[lessonStatus]}
                        </small>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Программа курса пока не заполнена"
            text="Модули, уроки, ресурсы и задания появятся здесь после добавления преподавателем."
          />
        )}
      </section>
    </main>
  );
}
