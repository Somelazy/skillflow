import React from "react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand brand-logo brand-logo--footer">
        <img className="brand-logo__image brand-logo__image--footer" src="/logo.png" alt="SkillFlow logo" />
        <div>
          <strong className="brand-logo__text">SkillFlow</strong>
          <small>Поток знаний для практического обучения</small>
        </div>
      </div>
      <p>Образовательная платформа для онлайн-курсов, уроков и отслеживания прогресса.</p>
      <span>Институтский проект</span>
    </footer>
  );
}
