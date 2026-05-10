import React, { useEffect, useState } from "react";
import { coursesApi } from "../api/coursesApi";
import CourseCard from "../components/CourseCard";
import { EmptyState, ErrorMessage, Loader, PageHeader } from "../components/ui";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [level, setLevel] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    coursesApi
      .getAll()
      .then((response) => setCourses(response.data))
      .catch(() => setError("Произошла ошибка. Попробуйте позже."))
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = level === "all"
    ? courses
    : courses.filter((course) => String(course.difficultyLevel).toLowerCase() === level);

  return (
    <main className="page">
      <PageHeader
        eyebrow="Каталог"
        title="Найдите курс под свою цель"
        text="Программы подтягиваются из реальной базы данных SkillFlow."
      />
      <div className="filter-panel">
        <button className={level === "all" ? "active" : ""} onClick={() => setLevel("all")}>Все</button>
        <button className={level === "b" ? "active" : ""} onClick={() => setLevel("b")}>Beginner</button>
        <button className={level === "i" ? "active" : ""} onClick={() => setLevel("i")}>Intermediate</button>
        <button className={level === "a" ? "active" : ""} onClick={() => setLevel("a")}>Advanced</button>
      </div>
      {loading && <Loader text="Загружаем каталог курсов..." />}
      {error && <ErrorMessage text={error} />}
      {!loading && !error && filteredCourses.length === 0 && (
        <EmptyState title="Курсы пока не найдены" text="Попробуйте другой фильтр или добавьте курс в админ-панели." />
      )}
      <div className="course-grid">
        {filteredCourses.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </main>
  );
}
