import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <main className="page"><div className="empty">Проверяем права...</div></main>;
  if (!user) return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
}
