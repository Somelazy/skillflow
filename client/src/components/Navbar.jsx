import React from "react";
import { Link, NavLink } from "react-router-dom";
import { LogOut, Menu, Moon, Shield, Sun, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const userInitial = (user?.firstName || user?.login || user?.email || "S").slice(0, 1).toUpperCase();
  const navLinkClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  return (
    <header className="navbar">
      <Link className="brand brand-logo" to="/" aria-label="SkillFlow — главная">
        <img className="brand-logo__image brand-logo__image--nav" src="/logo.png" alt="SkillFlow logo" />
        <span className="brand-logo__text">SkillFlow</span>
      </Link>
      <button className="navbar__menu" onClick={() => setIsOpen((value) => !value)} title="Меню">
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav className={isOpen ? "navbar__nav navbar__nav--open" : "navbar__nav"}>
        <NavLink className={navLinkClass} to="/courses">Курсы</NavLink>
        {user && <NavLink className={navLinkClass} to="/dashboard">Кабинет</NavLink>}
        {user && <NavLink className={navLinkClass} to="/my-courses">Мои курсы</NavLink>}
        {isAdmin && <NavLink className={navLinkClass} to="/admin/courses"><Shield size={16} /> Админ</NavLink>}
      </nav>
      <div className="navbar__actions">
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Переключить тему" title="Переключить тему">
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === "dark" ? "Светлая" : "Тёмная"}</span>
        </button>
        {user ? (
          <>
            <Link className="profile-pill" to="/profile">
              <span className="navbar-avatar">
                {user.avatarUrl ? <img src={user.avatarUrl} alt="Аватар пользователя" /> : userInitial}
              </span>
              <span>{user.login || user.email}</span>
            </Link>
            <button className="icon-button" onClick={logout} title="Выйти"><LogOut size={18} /></button>
          </>
        ) : (
          <>
            <Link className="button button--ghost" to="/login">Войти</Link>
            <Link className="button" to="/register">Регистрация</Link>
          </>
        )}
      </div>
    </header>
  );
}
