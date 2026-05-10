import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <main className="page"><div className="empty">Загрузка профиля...</div></main>;
  return user ? children : <Navigate to="/login" replace />;
}
