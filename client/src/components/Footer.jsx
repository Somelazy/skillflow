import React from "react";
import { GraduationCap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__brand">
        <GraduationCap />
        <strong>SkillFlow</strong>
      </div>
      <p>Образовательная платформа для онлайн-курсов, уроков и отслеживания прогресса.</p>
      <span>Институтский проект</span>
    </footer>
  );
}
