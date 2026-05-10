import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { coursesApi } from "../api/coursesApi";
import { progressApi } from "../api/progressApi";
import { useAuth } from "../context/AuthContext";
import { Badge, ErrorMessage, Loader } from "../components/ui";
import ProgressBar from "../components/ProgressBar";

export default function CourseDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    coursesApi
      .getById(id)
      .then((response) => setCourse(response.data))
      .catch(() => setError("Произошла ошибка. Попробуйте позже."));
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
          <Link className="button button--large" to={user ? `/learn/${course.id}` : "/login"}>
            {user ? "Начать обучение" : "Войти для обучения"}
          </Link>
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
        </div>
      </section>

      <section className="curriculum curriculum--full">
        <div className="section-title">
          <p className="eyebrow">Программа</p>
          <h2>Что входит в курс</h2>
        </div>
        <div className="curriculum-grid">
        {course.modules?.length ? course.modules.map((module) => (
          <div className="module-block" key={module.id}>
            <h3>{module.orderNum}. {module.title}</h3>
            <p>{module.description}</p>
            {module.lessons.map((lesson) => <span className="lesson-line" key={lesson.id}>{lesson.title}</span>)}
          </div>
        )) : <div className="empty">Программа курса пока не заполнена.</div>}
        </div>
      </section>
    </main>
  );
}
