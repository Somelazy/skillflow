import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("skillflow_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((response) => setUser(response.data))
      .catch(() => localStorage.removeItem("skillflow_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload) => {
    const response = await authApi.login(payload);
    localStorage.setItem("skillflow_token", response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (payload) => {
    const response = await authApi.register(payload);
    localStorage.setItem("skillflow_token", response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem("skillflow_token");
    setUser(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin: ["Admin", "Mentor"].includes(user?.role) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
