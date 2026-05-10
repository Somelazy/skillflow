import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { GraduationCap } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ Email: "", Login: "", Password_hash: "", First_name: "", Last_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (error) {
      setError("Не удалось создать аккаунт. Проверьте данные формы.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="form-card auth-card" onSubmit={submit}>
        <div className="auth-card__icon"><GraduationCap /></div>
        <h1>Регистрация</h1>
        <p className="muted">Создайте аккаунт, чтобы проходить курсы и сохранять прогресс.</p>
        {error && <p className="form-error">{error}</p>}
        <input placeholder="Email" value={form.Email} onChange={(e) => setForm({ ...form, Email: e.target.value })} />
        <input placeholder="Логин" value={form.Login} onChange={(e) => setForm({ ...form, Login: e.target.value })} />
        <input placeholder="Имя" value={form.First_name} onChange={(e) => setForm({ ...form, First_name: e.target.value })} />
        <input placeholder="Фамилия" value={form.Last_name} onChange={(e) => setForm({ ...form, Last_name: e.target.value })} />
        <input placeholder="Пароль" type="password" value={form.Password_hash} onChange={(e) => setForm({ ...form, Password_hash: e.target.value })} />
        <button className="button" disabled={loading}>{loading ? "Создаём..." : "Создать аккаунт"}</button>
        <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
      </form>
    </main>
  );
}
