import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { coursesApi } from "../api/coursesApi";
import { EmptyState, PageHeader } from "../components/ui";

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);

  const load = () => coursesApi.getAll().then((response) => setCourses(response.data));

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!confirm("Удалить курс?")) return;
    await coursesApi.remove(id);
    load();
  };

  return (
    <main className="page">
      <PageHeader
        eyebrow="Админ/ментор"
        title="Управление курсами"
        text="Создавайте программы, редактируйте структуру и наполняйте уроки."
        action={<Link className="button" to="/admin/courses/new"><Plus size={18} /> Новый курс</Link>}
      />
      {courses.length === 0 && <EmptyState title="Курсы пока не найдены" text="Создайте первый курс через кнопку выше." />}
      <div className="admin-list">
        {courses.map((course) => (
          <div key={course.id}>
            <strong>{course.title}</strong>
            <span>{course.lessonCount || 0} уроков</span>
            <Link className="button button--ghost" to={`/admin/courses/${course.id}`}>Редактировать</Link>
            <button className="icon-button danger" onClick={() => remove(course.id)} title="Удалить"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>
    </main>
  );
}
