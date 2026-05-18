import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, Unlock } from "lucide-react";
import { coursesApi } from "../api/coursesApi";
import { progressApi } from "../api/progressApi";
import ProgressBar from "../components/ProgressBar";
import { ErrorMessage } from "../components/ui";
import LessonAssignments from "../components/lesson/LessonAssignments";
import LessonMaterial from "../components/lesson/LessonMaterial";
import LessonResources from "../components/lesson/LessonResources";
import LessonSkeleton from "../components/lesson/LessonSkeleton";

function isTruthy(value) {
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true" || String(value).toLowerCase() === "t";
}

function toRoman(value) {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) return value;

  const numerals = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];

  let remaining = number;
  let result = "";

  numerals.forEach(([decimal, roman]) => {
    while (remaining >= decimal) {
      result += roman;
      remaining -= decimal;
    }
  });

  return result;
}

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

  const modules = useMemo(
    () =>
      course?.modules?.map((module, moduleIndex) => ({
        ...module,
        moduleOrder: module.orderNum ?? moduleIndex + 1,
        lessons: module.lessons || [],
      })) || [],
    [course]
  );

  const lessons = useMemo(
    () =>
      modules.flatMap((module) =>
        module.lessons.map((moduleLesson, lessonIndex) => ({
          ...moduleLesson,
          moduleTitle: module.title,
          moduleOrder: module.moduleOrder,
          lessonNumber: lessonIndex + 1,
        }))
      ),
    [modules]
  );

  const lessonFromCourse = lessons.find((item) => String(item.id) === String(id));
  const lesson = lessonDetails || lessonFromCourse;
  const currentIndex = lessons.findIndex((item) => String(item.id) === String(id));
  const previousLesson = lessons[currentIndex - 1];
  const nextLesson = lessons[currentIndex + 1];
  const completedLessonIds = new Set(
    progress?.lessons?.filter((item) => item.status === "completed").map((item) => item.lessonId) || []
  );
  const completionPercent = progress?.stats?.completionPercent || 0;
  const completedLessons = progress?.stats?.completedLessons || 0;
  const totalLessons = progress?.stats?.totalLessons || lessons.length;
  const isLessonCompleted = completedLessonIds.has(lesson?.id);
  const isFreeLesson = isTruthy(lesson?.isFree);

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

  if (error && !course) {
    return (
      <main className="page">
        <ErrorMessage text={error} />
      </main>
    );
  }

  if (!lesson) return <LessonSkeleton />;

  return (
    <main className="page lesson-layout">
      <article className="lesson-content">
        <header className="lesson-hero">
          <div className="lesson-status-row">
            <span className="lesson-type-badge">{lesson.contentType || "Материал"}</span>
            <span className={`lesson-access-badge ${isFreeLesson ? "lesson-access-badge--free" : "lesson-access-badge--paid"}`}>
              {isFreeLesson ? <Unlock size={15} /> : <Lock size={15} />}
              {isFreeLesson ? "Бесплатный урок" : "Платный урок"}
            </span>
          </div>
          <h1>{lesson.title}</h1>
          <p className="lead">{lesson.description || "Материал урока доступен ниже."}</p>
        </header>

        <LessonMaterial lesson={lesson} />
        <LessonResources resources={lesson.resources || []} />
        <LessonAssignments assignments={lesson.assignments || []} />

        {error && <ErrorMessage text={error} />}
        {status && <div className="success">{status}</div>}

        <nav className="lesson-actions" aria-label="Навигация по урокам">
          {previousLesson && (
            <Link className="button button--ghost" to={`/lessons/${previousLesson.id}?course=${courseId}`}>
              <ArrowLeft size={18} />
              Предыдущий урок
            </Link>
          )}
          <button className="button lesson-actions__complete" onClick={complete} disabled={isCompleting || isLessonCompleted}>
            {isLessonCompleted ? <CheckCircle2 size={18} /> : null}
            {isLessonCompleted ? "Урок завершён" : isCompleting ? "Сохраняем..." : "Завершить урок"}
          </button>
          {nextLesson && (
            <Link className="button button--dark" to={`/lessons/${nextLesson.id}?course=${courseId}`}>
              Следующий урок
              <ArrowRight size={18} />
            </Link>
          )}
        </nav>
      </article>

      <aside className="lesson-sidebar">
        <div className="lesson-progress-card">
          <div className="lesson-progress-card__head">
            <span>Прогресс курса</span>
            <strong>{completionPercent}%</strong>
          </div>
          <ProgressBar value={completionPercent} />
          <p>Пройдено {completedLessons} из {totalLessons} уроков</p>
        </div>

        <Link className="lesson-back-link" to={`/learn/${courseId}`}>
          <ArrowLeft size={16} />
          Вернуться к курсу
        </Link>

        <div className="lesson-nav-list">
          <h2>Уроки курса</h2>
          {modules.map((module) => (
            <section className="lesson-module-group" key={module.id || `${module.moduleOrder}-${module.title}`}>
              <h3 className="lesson-module-title">
                <span>{toRoman(module.moduleOrder)}</span>
                {module.title}
              </h3>

              {module.lessons.map((item, lessonIndex) => {
                const active = String(item.id) === String(id);
                const completed = completedLessonIds.has(item.id);
                const globalIndex = lessons.findIndex((lessonItem) => String(lessonItem.id) === String(item.id));

                return (
                  <Link
                    key={item.id}
                    className={`${active ? "active" : ""} ${completed ? "completed" : ""}`.trim()}
                    to={`/lessons/${item.id}?course=${courseId}`}
                    title={item.title}
                  >
                    <span>{completed ? <CheckCircle2 size={16} /> : globalIndex + 1 || lessonIndex + 1}</span>
                    <div>
                      <small>
                        {isTruthy(item.isFree) ? "Бесплатный" : "Платный"} урок
                      </small>
                      <strong>{item.title}</strong>
                    </div>
                  </Link>
                );
              })}
            </section>
          ))}
        </div>
      </aside>
    </main>
  );
}
