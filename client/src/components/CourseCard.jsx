import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Clock3, Layers, Sparkles } from "lucide-react";
import { Badge } from "./ui";

export default function CourseCard({ course }) {
  const price = Number(course.price);

  return (
    <article className="course-card">
      <div className="course-card__cover">
        <Sparkles size={22} />
        <span>{course.courseType || "Курс"}</span>
      </div>
      <div className="course-card__meta">
        <Badge>{course.difficultyLevel || "Base"}</Badge>
        <span><Clock3 size={14} /> {course.durationHours || 0} ч</span>
      </div>
      <h3>{course.title || `Курс #${course.id}`}</h3>
      <p>{course.description || "Описание курса скоро появится."}</p>
      <div className="chips">
        <span><BookOpen size={14} /> {course.lessonCount || 0} уроков</span>
        <span><Layers size={14} /> {course.moduleCount || 0} модулей</span>
      </div>
      <div className="course-card__footer">
        <strong>{price > 0 ? `${price} ₽` : "Бесплатно"}</strong>
        <Link className="button button--dark" to={`/courses/${course.id}`}>Подробнее</Link>
      </div>
    </article>
  );
}
