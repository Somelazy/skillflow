import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { coursesApi } from "../api/coursesApi";
import { progressApi } from "../api/progressApi";
import ProgressBar from "../components/ProgressBar";
import { ErrorMessage, Loader } from "../components/ui";

export default function LessonPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get("course");
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [lessonDetails, setLessonDetails] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const lessons = useMemo(() => course?.modules?.flatMap((module) => module.lessons) || [], [course]);
  const lessonFromCourse = lessons.find((item) => String(item.id) === String(id));
  const lesson = lessonDetails || lessonFromCourse;
  const currentIndex = lessons.findIndex((item) => String(item.id) === String(id));
  const previousLesson = lessons[currentIndex - 1];
  const nextLesson = lessons[currentIndex + 1];
  const completedLessonIds = new Set(
    progress?.lessons?.filter((item) => item.status === "completed").map((item) => item.lessonId) || []
  );

  const loadProgress = async () => {
    if (!courseId) return;
    const response = await progressApi.getCourse(courseId);
    setProgress(response.data);
  };

  useEffect(() => {
    if (!courseId) {
      setError("Не удалось определить курс для этого урока.");
      return;
    }

    setStatus("");
    setError("");
    setAccessDenied(false);
    setLessonDetails(null);

    Promise.all([
      coursesApi.getById(courseId),
      progressApi.getCourse(courseId),
      coursesApi.getLesson(id),
    ])
      .then(async ([courseResponse, progressResponse, lessonResponse]) => {
        setCourse(courseResponse.data);
        setProgress(progressResponse.data);
        setLessonDetails(lessonResponse.data);
        await progressApi.startLesson(id).catch(() => null);
      })
      .catch((requestError) => {
        if (requestError.message === "You do not have access to this lesson") {
          setAccessDenied(true);
          setError("Этот урок доступен после покупки курса.");
          return;
        }

        setError("Произошла ошибка. Попробуйте позже.");
      });
  }, [courseId, id]);

  const complete = async () => {
    setError("");
    setStatus("");
    setIsCompleting(true);

    try {
      await progressApi.completeLesson(id, lesson?.assignments?.length || 0);
      await loadProgress();
      setStatus("Урок завершён. Прогресс сохранён.");
    } catch (requestError) {
      if (requestError.message === "You do not have access to this lesson") {
        setAccessDenied(true);
        setError("Этот урок доступен после покупки курса.");
        return;
      }

      setError("Не удалось завершить урок. Проверьте авторизацию и попробуйте ещё раз.");
    } finally {
      setIsCompleting(false);
    }
  };

  if (accessDenied) {
    return (
      <main className="page">
        <ErrorMessage text="Этот урок доступен после покупки курса." />
        <Link className="button button--ghost" to={courseId ? `/courses/${courseId}` : "/courses"}>
          Вернуться к странице курса
        </Link>
      </main>
    );
  }

  if (error && !course) return <main className="page"><ErrorMessage text={error} /></main>;
  if (!lesson) return <main className="page"><Loader text="Загружаем урок..." /></main>;

  return (
    <main className="page lesson-layout">
      <article className="lesson-content">
        <p className="eyebrow">{lesson.contentType}</p>
        <h1>{lesson.title}</h1>
        <p className="lead">{lesson.description || "Материал урока доступен ниже."}</p>
        {lesson.contentUrl && (
          <a className="button button--ghost" href={lesson.contentUrl} target="_blank" rel="noreferrer">
            Открыть материал
          </a>
        )}

        <section>
          <h2>Ресурсы</h2>
          {lesson.resources?.length ? lesson.resources.map((resource) => (
            <a className="resource-line" key={resource.id} href={resource.fileUrl} target="_blank" rel="noreferrer">
              {resource.fileName}
            </a>
          )) : <p className="muted">Для этого урока пока нет дополнительных материалов.</p>}
        </section>

        <section>
          <h2>Задания</h2>
          {lesson.assignments?.length ? lesson.assignments.map((assignment) => (
            <div className="assignment" key={assignment.id}>
              <strong>{assignment.type}</strong>
              <p>{assignment.question}</p>
            </div>
          )) : <p className="muted">Задания появятся позже.</p>}
        </section>

        {error && <ErrorMessage text={error} />}
        {status && <div className="success">{status}</div>}

        <div className="button-row">
          {previousLesson && (
            <Link className="button button--ghost" to={`/lessons/${previousLesson.id}?course=${courseId}`}>
              Предыдущий урок
            </Link>
          )}
          <button className="button" onClick={complete} disabled={isCompleting || completedLessonIds.has(lesson.id)}>
            {completedLessonIds.has(lesson.id) ? "Урок завершён" : isCompleting ? "Сохраняем..." : "Завершить урок"}
          </button>
          {nextLesson && (
            <Link className="button button--dark" to={`/lessons/${nextLesson.id}?course=${courseId}`}>
              Следующий урок
            </Link>
          )}
        </div>
      </article>

      <aside className="lesson-sidebar">
        <ProgressBar value={progress?.stats?.completionPercent || 0} />
        <Link to={`/learn/${courseId}`}>Вернуться к курсу</Link>
        {lessons.map((item) => (
          <Link
            key={item.id}
            className={`${String(item.id) === String(id) ? "active" : ""} ${completedLessonIds.has(item.id) ? "completed" : ""}`.trim()}
            to={`/lessons/${item.id}?course=${courseId}`}
          >
            {item.title}
          </Link>
        ))}
      </aside>
    </main>
  );
}
