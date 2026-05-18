import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    Email: "",
    Login: "",
    Password_hash: "",
    First_name: "",
    Last_name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await register(form);
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError.message || "Не удалось создать аккаунт. Проверьте данные формы.");
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="auth-page">
      <form className="form-card auth-card" onSubmit={submit}>
        <div className="auth-card__icon">
          <GraduationCap />
        </div>
        <h1>Регистрация</h1>
        <p className="muted">Создайте аккаунт, чтобы проходить курсы и сохранять прогресс.</p>
        {error && <p className="form-error">{error}</p>}

        <input
          placeholder="Email"
          value={form.Email}
          onChange={(event) => setForm({ ...form, Email: event.target.value })}
        />
        <input
          placeholder="Логин"
          value={form.Login}
          onChange={(event) => setForm({ ...form, Login: event.target.value })}
        />
        <input
          placeholder="Имя"
          value={form.First_name}
          onChange={(event) => setForm({ ...form, First_name: event.target.value })}
        />
        <input
          placeholder="Фамилия"
          value={form.Last_name}
          onChange={(event) => setForm({ ...form, Last_name: event.target.value })}
        />
        <input
          placeholder="Пароль"
          type="password"
          value={form.Password_hash}
          onChange={(event) => setForm({ ...form, Password_hash: event.target.value })}
        />

        <button className="button" disabled={loading}>
          {loading ? "Создаём..." : "Создать аккаунт"}
        </button>

        <p>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </form>
    </main>
  );
}
