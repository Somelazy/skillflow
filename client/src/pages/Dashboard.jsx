import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, ChartNoAxesCombined, Clock3, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageHeader } from "../components/ui";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  return (
    <main className="page">
      <PageHeader
        eyebrow="Личный кабинет"
        title={`Здравствуйте, ${user?.firstName || user?.login}`}
        text="Здесь собраны обучение, прогресс и быстрые действия."
      />
      <div className="stats-cards">
        <div><BookOpen /><strong>Активные курсы</strong><span>Откройте доступные программы</span></div>
        <div><ChartNoAxesCombined /><strong>Прогресс</strong><span>Следите за завершёнными уроками</span></div>
        <div><Clock3 /><strong>Продолжить</strong><span>Возвращайтесь к последнему занятию</span></div>
      </div>
      <div className="dashboard-grid">
        <Link className="action-panel" to="/my-courses"><BookOpen /><h3>Мои курсы</h3><p>Продолжить обучение и открыть текущие уроки.</p></Link>
        <Link className="action-panel" to="/progress"><ChartNoAxesCombined /><h3>Прогресс</h3><p>Посмотреть завершённые и начатые уроки.</p></Link>
        <Link className="action-panel" to="/profile"><UserRound /><h3>Профиль</h3><p>Обновить личные данные пользователя.</p></Link>
        {isAdmin && <Link className="action-panel" to="/admin/courses"><h3>Управление курсами</h3><p>Создание и редактирование учебных материалов.</p></Link>}
      </div>
    </main>
  );
}
