import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, ChartNoAxesCombined, CheckCircle2, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { coursesApi } from "../api/coursesApi";
import CourseCard from "../components/CourseCard";
import { SectionTitle } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const startLearningPath = user ? "/my-courses" : "/register";

  useEffect(() => {
    coursesApi.getAll().then((response) => setCourses(response.data.slice(0, 3))).catch(() => setCourses([]));
  }, []);

  return (
    <main>
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Онлайн-обучение с понятным прогрессом</p>
          <h1>SkillFlow помогает учиться без хаоса</h1>
          <p className="lead">
            Курсы, уроки, задания и материалы собраны в единую траекторию. Студент видит прогресс, а ментор управляет программой курса.
          </p>
          <div className="hero__actions">
            <Link className="button button--large" to={startLearningPath}>Начать обучение <ArrowRight size={18} /></Link>
            <Link className="button button--large button--glass" to="/courses">Смотреть курсы</Link>
          </div>
        </div>
        <div className="hero__panel">
          <div><Sparkles /><span>Персональный прогресс</span></div>
          <strong>24 урока</strong>
          <p>Полный курс Python уже доступен для прохождения.</p>
        </div>
      </section>

      <section className="feature-band">
        <div><BookOpen /><h3>Структура курса</h3><p>Модули, уроки, ресурсы и задания в одном месте.</p></div>
        <div><ChartNoAxesCombined /><h3>Прогресс</h3><p>Статусы уроков и процент завершения курса.</p></div>
        <div><ShieldCheck /><h3>Роли</h3><p>Интерфейс для студента, ментора и администратора.</p></div>
      </section>

      <section className="page landing-section">
        <SectionTitle eyebrow="Популярное" title="Курсы, с которых удобно начать" text="Первые программы уже подтягиваются из реальной PostgreSQL базы." />
        <div className="course-grid">
          {courses.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      </section>

      <section className="page how-section">
        <SectionTitle eyebrow="Как это работает" title="От выбора курса до завершённого урока" />
        <div className="steps-grid">
          <div><span>1</span><h3>Выберите курс</h3><p>Откройте программу, посмотрите модули и длительность.</p></div>
          <div><span>2</span><h3>Проходите уроки</h3><p>Читайте материалы, открывайте ресурсы и выполняйте задания.</p></div>
          <div><span>3</span><h3>Следите за прогрессом</h3><p>Система сохраняет начатые и завершённые уроки.</p></div>
        </div>
      </section>

      <section className="stats-band">
        <div><strong>100+</strong><span>уроков</span></div>
        <div><strong>20+</strong><span>курсов</span></div>
        <div><strong>1000+</strong><span>студентов</span></div>
        <div><strong><GraduationCap /></strong><span>единая платформа</span></div>
      </section>

      <section className="page final-cta">
        <div>
          <CheckCircle2 />
          <h2>Начните обучение сегодня</h2>
          <p>Откройте каталог, выберите программу и продолжайте курс с любого устройства.</p>
        </div>
        <Link className="button button--large" to="/courses">Смотреть курсы</Link>
      </section>
    </main>
  );
}
