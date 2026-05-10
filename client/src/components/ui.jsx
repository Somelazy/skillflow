import React from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";

export function Button({ children, variant = "primary", className = "", ...props }) {
  return (
    <button className={`button button--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

export function Badge({ children, tone = "blue" }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

export function Loader({ text = "Загрузка..." }) {
  return (
    <div className="state state--loading">
      <Loader2 />
      <span>{text}</span>
    </div>
  );
}

export function EmptyState({ title = "Данных пока нет", text = "Здесь появится информация после добавления данных." }) {
  return (
    <div className="state">
      <Inbox />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export function ErrorMessage({ text = "Произошла ошибка. Попробуйте позже." }) {
  return (
    <div className="state state--error">
      <AlertCircle />
      <span>{text}</span>
    </div>
  );
}

export function PageHeader({ eyebrow, title, text, action }) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, text }) {
  return (
    <div className="section-title">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {text && <p>{text}</p>}
    </div>
  );
}

