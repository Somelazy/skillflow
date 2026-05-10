import React, { useEffect, useMemo, useState } from "react";
import { progressApi } from "../api/progressApi";
import { Badge, EmptyState, ErrorMessage, Loader, PageHeader } from "../components/ui";

const statusLabels = {
  not_started: "Не начат",
  in_progress: "В процессе",
  completed: "Завершён",
};

const statusTone = {
  not_started: "gray",
  in_progress: "blue",
  completed: "green",
};

export default function Progress() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    progressApi
      .getMe()
      .then((response) => setItems(response.data))
      .catch(() => setError("Произошла ошибка. Попробуйте позже."))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const completed = items.filter((item) => item.Status === "completed").length;
    const inProgress = items.filter((item) => item.Status === "in_progress").length;
    return { completed, inProgress, total: items.length };
  }, [items]);

  return (
    <main className="page">
      <PageHeader
        eyebrow="Статистика"
        title="Прогресс обучения"
        text="Следите за начатыми и завершёнными уроками по всем курсам."
      />

      <div className="stats-cards progress-summary">
        <div><strong>{stats.total}</strong><span>уроков с прогрессом</span></div>
        <div><strong>{stats.inProgress}</strong><span>в процессе</span></div>
        <div><strong>{stats.completed}</strong><span>завершено</span></div>
      </div>

      {loading && <Loader text="Загружаем прогресс..." />}
      {error && <ErrorMessage text={error} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title="Прогресс пока пустой" text="Откройте первый урок, и здесь появится ваша история обучения." />
      )}

      <div className="progress-table">
        {items.map((item) => (
          <article className="progress-row" key={item.Id_Progress}>
            <div>
              <span>{item.course_title}</span>
              <strong>{item.lesson_title}</strong>
            </div>
            <Badge tone={statusTone[item.Status] || "gray"}>{statusLabels[item.Status] || item.Status}</Badge>
          </article>
        ))}
      </div>
    </main>
  );
}
