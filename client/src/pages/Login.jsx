import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap } from "lucide-react";

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ Login: "", Password_hash: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (error) {
      setError("Не удалось войти. Проверьте логин и пароль.");
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
        <div className="auth-card__icon"><GraduationCap /></div>
        <h1>Вход</h1>
        <p className="muted">Войдите, чтобы продолжить обучение и видеть прогресс.</p>
        {error && <p className="form-error">{error}</p>}
        <input placeholder="Логин или email" value={form.Login} onChange={(e) => setForm({ ...form, Login: e.target.value })} />
        <input placeholder="Пароль" type="password" value={form.Password_hash} onChange={(e) => setForm({ ...form, Password_hash: e.target.value })} />
        <button className="button" disabled={loading}>{loading ? "Входим..." : "Войти"}</button>
        <p>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
      </form>
    </main>
  );
}
