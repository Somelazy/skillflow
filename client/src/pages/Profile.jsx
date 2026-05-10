import React, { useState } from "react";
import { apiRequest } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { ErrorMessage, PageHeader } from "../components/ui";

const getInitial = (user) => (user?.firstName || user?.login || user?.email || "S").slice(0, 1).toUpperCase();

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    First_name: user?.firstName || "",
    Last_name: user?.lastName || "",
    Phone: user?.phone || "",
    City: user?.city || "",
    Bio: user?.bio || "",
    Avatar_url: user?.avatarUrl || "",
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const avatarPreview = form.Avatar_url || user?.avatarUrl || "";

  const updateField = (field, value) => {
    setSaved(false);
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAvatarFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Выберите изображение для аватара.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Файл аватара должен быть не больше 10 МБ.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => updateField("Avatar_url", reader.result);
    reader.onerror = () => setError("Не удалось прочитать файл аватара.");
    reader.readAsDataURL(file);
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaved(false);
    setError("");
    setIsSaving(true);

    try {
      const response = await apiRequest("/users/me", { method: "PUT", body: JSON.stringify(form) });
      updateUser(response.data);
      setSaved(true);
    } catch {
      setError("Не удалось сохранить профиль. Попробуйте позже.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="page">
      <PageHeader
        eyebrow="Профиль"
        title="Данные пользователя"
        text="Обновите информацию, которая отображается в личном кабинете."
      />
      <div className="profile-layout">
        <aside className="profile-card">
          <div className="avatar avatar--large">
            {avatarPreview ? <img src={avatarPreview} alt="Аватар пользователя" /> : getInitial(user)}
          </div>
          <h2>{user?.firstName || user?.login}</h2>
          <p>{user?.email}</p>
          <span>{user?.role || "Student"}</span>
        </aside>

        <form className="form-card wide" onSubmit={submit}>
          {saved && <p className="success">Профиль обновлён</p>}
          {error && <ErrorMessage text={error} />}

          <label className="field-label">
            <span>Аватар</span>
            <div className="avatar-upload">
              <div className="avatar avatar--preview">
                {avatarPreview ? <img src={avatarPreview} alt="Предпросмотр аватара" /> : getInitial(user)}
              </div>
              <div>
                <input type="file" accept="image/*" onChange={handleAvatarFile} />
                <p className="field-hint">Можно загрузить изображение до 10 МБ или вставить ссылку ниже.</p>
              </div>
            </div>
          </label>

          <label className="field-label">
            <span>Ссылка на аватар</span>
            <input
              placeholder="https://example.com/avatar.jpg"
              value={form.Avatar_url}
              onChange={(event) => updateField("Avatar_url", event.target.value)}
            />
          </label>

          <label className="field-label">
            <span>Имя</span>
            <input value={form.First_name} onChange={(event) => updateField("First_name", event.target.value)} />
          </label>

          <label className="field-label">
            <span>Фамилия</span>
            <input value={form.Last_name} onChange={(event) => updateField("Last_name", event.target.value)} />
          </label>

          <label className="field-label">
            <span>Телефон</span>
            <input value={form.Phone} onChange={(event) => updateField("Phone", event.target.value)} />
          </label>

          <label className="field-label">
            <span>Город</span>
            <input value={form.City} onChange={(event) => updateField("City", event.target.value)} />
          </label>

          <label className="field-label">
            <span>О себе</span>
            <textarea value={form.Bio} onChange={(event) => updateField("Bio", event.target.value)} />
          </label>

          <button className="button" disabled={isSaving}>
            {isSaving ? "Сохраняем..." : "Сохранить"}
          </button>
        </form>
      </div>
    </main>
  );
}
