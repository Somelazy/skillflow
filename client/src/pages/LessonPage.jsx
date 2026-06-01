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

const statusLabels = {
  not_started: "Не начат",
  in_progress: "В процессе",
  completed: "Завершён",
};

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

function getFriendlyError(error) {
  if (error.message === "You do not have access to this lesson") return "access_denied";
  if (error.message === "Урок не найден") return "lesson_not_found";
  if (error.message === "Курс не найден") return "course_not_found";
  return "common";
}

export default function LessonPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryCourseId = searchParams.get("course");
  const [courseId, setCourseId] = useState(queryCourseId || "");
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [lessonDetails, setLessonDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);
  const [lessonNotFound, setLessonNotFound] = useState(false);
  const [courseNotFound, setCourseNotFound] = useState(false);
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
    progress?.lessons?.filter((item) => item.status === "completed").map((item) => String(item.lessonId)) || []
  );
  const progressByLesson = new Map((progress?.lessons || []).map((item) => [String(item.lessonId), item]));
  const currentProgress = progressByLesson.get(String(id)) || progressByLesson.get(String(lesson?.id));
  const completionPercent = progress?.stats?.completionPercent || 0;
  const completedLessons = progress?.stats?.completedLessons || 0;
  const totalLessons = progress?.stats?.totalLessons || lessons.length;
  const isLessonCompleted = completedLessonIds.has(String(lesson?.id));
  const lessonStatus = currentProgress?.status || (isLessonCompleted ? "completed" : "not_started");
  const isFreeLesson = isTruthy(lesson?.isFree);

  const loadProgress = async (targetCourseId = courseId) => {
    if (!targetCourseId) return;
    const response = await progressApi.getCourse(targetCourseId);
    setProgress(response.data);
  };

  useEffect(() => {
    let isMounted = true;
    const loadLesson = async () => {
      setIsLoading(true);
      setCourseId(queryCourseId || "");
      setCourse(null);
      setProgress(null);
      setLessonDetails(null);
      setLessonNotFound(false);
      setCourseNotFound(false);
      setAccessDenied(false);
      setStatus("");
      setError("");

      try {
        const lessonResponse = await coursesApi.getLesson(id);
        const loadedLesson = lessonResponse.data;
        const nextCourseId = queryCourseId || loadedLesson.courseId;

        if (!nextCourseId) {
          throw new Error("Не удалось определить курс для этого урока.");
        }

        const [courseResponse, progressResponse] = await Promise.all([
          coursesApi.getById(nextCourseId),
          progressApi.getCourse(nextCourseId),
        ]);

        if (!isMounted) return;

        setCourseId(String(nextCourseId));
        setCourse(courseResponse.data);
        setProgress(progressResponse.data);
        setLessonDetails(loadedLesson);

        const existingProgress = progressResponse.data?.lessons?.find((item) => String(item.lessonId) === String(id));
        if (existingProgress?.status !== "completed") {
          await progressApi.startLesson(id).catch(() => null);
          const updatedProgressResponse = await progressApi.getCourse(nextCourseId).catch(() => null);
          if (isMounted && updatedProgressResponse?.data) {
            setProgress(updatedProgressResponse.data);
          }
        }
      } catch (requestError) {
        if (!isMounted) return;

        const errorKind = getFriendlyError(requestError);

        if (errorKind === "access_denied") {
          setAccessDenied(true);
          setError("Этот урок доступен после покупки курса.");
        } else if (errorKind === "lesson_not_found") {
          setLessonNotFound(true);
          setError("Урок не найден");
        } else if (errorKind === "course_not_found") {
          setCourseNotFound(true);
          setError("Курс не найден");
        } else {
          setError(requestError.message === "Не удалось определить курс для этого урока." ? requestError.message : "Произошла ошибка. Попробуйте позже.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadLesson();

    return () => {
      isMounted = false;
    };
  }, [queryCourseId, id]);

  const complete = async () => {
    if (isLessonCompleted) return;

    setError("");
    setStatus("");
    setIsCompleting(true);

    try {
      await progressApi.completeLesson(id, lesson?.assignments?.length || 0);
      await loadProgress();
      setStatus("Урок завершён. Прогресс сохранён.");
    } catch (requestError) {
      const errorKind = getFriendlyError(requestError);

      if (errorKind === "access_denied") {
        setAccessDenied(true);
        setError("Этот урок доступен после покупки курса.");
        return;
      }

      setError(errorKind === "lesson_not_found" ? "Урок не найден" : "Не удалось завершить урок. Проверьте авторизацию и попробуйте ещё раз.");
    } finally {
      setIsCompleting(false);
    }
  };

  if (lessonNotFound || courseNotFound) {
    return (
      <main className="page">
        <ErrorMessage text={lessonNotFound ? "Урок не найден" : "Курс не найден"} />
        <Link className="button button--ghost" to="/courses">
          Вернуться к курсам
        </Link>
      </main>
    );
  }

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

  if (isLoading || !lesson) return <LessonSkeleton />;

  return (
    <main className="page lesson-page">
      <nav className="breadcrumbs" aria-label="Навигация">
        <Link to="/courses">Курсы</Link>
        {course ? <Link to={`/courses/${course.id}`}>{course.title}</Link> : <span>Курс</span>}
        <span>{lesson.title}</span>
      </nav>

      <div className="lesson-layout">
        <article className="lesson-content">
        <header className="lesson-hero">
          <div className="lesson-status-row">
            <span className="lesson-type-badge">{lesson.contentType || "Материал"}</span>
            <span className={`lesson-access-badge ${isFreeLesson ? "lesson-access-badge--free" : "lesson-access-badge--paid"}`}>
              {isFreeLesson ? <Unlock size={15} /> : <Lock size={15} />}
              {isFreeLesson ? "Бесплатный урок" : "Платный урок"}
            </span>
            <span className={`lesson-status lesson-status--${lessonStatus}`}>
              {statusLabels[lessonStatus]}
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
          {previousLesson ? (
            <Link className="button button--ghost lesson-action lesson-action--stacked" to={`/lessons/${previousLesson.id}?course=${courseId}`}>
              <ArrowLeft size={18} />
              <span>
                <small>Предыдущий урок</small>
                {previousLesson.title}
              </span>
            </Link>
          ) : (
            <span className="button button--ghost lesson-action lesson-action--stacked lesson-action--disabled" aria-disabled="true">
              <ArrowLeft size={18} />
              <span>
                <small>Предыдущий урок</small>
                Нет предыдущего урока
              </span>
            </span>
          )}
          <button className="button lesson-action lesson-actions__complete" onClick={complete} disabled={isCompleting || isLessonCompleted}>
            {isLessonCompleted ? <CheckCircle2 size={18} /> : null}
            {isLessonCompleted ? "Урок завершён" : isCompleting ? "Сохраняем..." : "Завершить урок"}
          </button>
          {nextLesson ? (
            <Link className="button button--dark lesson-action lesson-action--stacked" to={`/lessons/${nextLesson.id}?course=${courseId}`}>
              <span>
                <small>Следующий урок</small>
                {nextLesson.title}
              </span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <span className="button button--dark lesson-action lesson-action--stacked lesson-action--disabled" aria-disabled="true">
              <span>
                <small>Следующий урок</small>
                Это последний урок
              </span>
              <ArrowRight size={18} />
            </span>
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
                const itemStatus = progressByLesson.get(String(item.id))?.status || "not_started";
                const completed = itemStatus === "completed";
                const globalIndex = lessons.findIndex((lessonItem) => String(lessonItem.id) === String(item.id));

                return (
                  <Link
                    key={item.id}
                    className={`${active ? "active" : ""} ${completed ? "completed" : ""} ${itemStatus === "in_progress" ? "in-progress" : ""}`.trim()}
                    to={`/lessons/${item.id}?course=${courseId}`}
                    title={item.title}
                  >
                    <span>{completed ? <CheckCircle2 size={16} /> : globalIndex + 1 || lessonIndex + 1}</span>
                    <div>
                      <small>{statusLabels[itemStatus]} · {isTruthy(item.isFree) ? "бесплатный" : "платный"}</small>
                      <strong>{item.title}</strong>
                    </div>
                  </Link>
                );
              })}
            </section>
          ))}
        </div>
      </aside>
      </div>
    </main>
  );
}
