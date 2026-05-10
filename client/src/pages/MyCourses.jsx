import React, { useEffect, useState } from "react";
import { coursesApi } from "../api/coursesApi";
import CourseCard from "../components/CourseCard";
import { EmptyState, Loader, PageHeader } from "../components/ui";

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursesApi
      .getAll()
      .then((response) => setCourses(response.data.filter((course) => course.isActive !== false)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page">
      <PageHeader eyebrow="Обучение" title="Мои курсы" text="Продолжайте доступные программы и открывайте уроки." />
      {loading && <Loader text="Загружаем ваши курсы..." />}
      {!loading && courses.length === 0 && (
        <EmptyState title="У вас пока нет курсов" text="Откройте каталог и выберите первую программу." />
      )}
      <div className="course-grid">
        {courses.map((course) => <CourseCard key={course.id} course={course} />)}
      </div>
    </main>
  );
}
