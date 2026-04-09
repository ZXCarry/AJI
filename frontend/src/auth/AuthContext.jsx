import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import * as endpoints from '../api/endpoints';

export const AuthContext = createContext(null);

function readAuthFromStorage() {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    role: localStorage.getItem('role'),
    login: localStorage.getItem('login'),
  };
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    accessToken: null,
    refreshToken: null,
    role: null,
    login: null,
  });

  const [isLoading, setIsLoading] = useState(true); // Stan ładowania

  // Zaktualizuj stan po załadowaniu danych z localStorage
  useEffect(() => {
    const storedAuth = readAuthFromStorage();
    setAuth(storedAuth);
    setIsLoading(false);  // Po załadowaniu danych ustawiamy isLoading na false
  }, []);

  const isLoggedIn = !!auth.accessToken;  // Jestem zalogowany, jeśli accessToken jest dostępny
  const role = auth.role || null;
  const loginName = auth.login || null;

  function persistAuth(next) {
    if (next?.accessToken) localStorage.setItem('accessToken', next.accessToken);
    if (next?.refreshToken) localStorage.setItem('refreshToken', next.refreshToken);
    if (next?.role) localStorage.setItem('role', next.role);
    if (next?.login) localStorage.setItem('login', next.login);
    setAuth(readAuthFromStorage());
  }

  function clearAuth() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('login');
    setAuth(readAuthFromStorage());
  }

  async function login(login, password) {
    const data = await endpoints.login(login, password);
    persistAuth({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      role: data.role,
      login: data.login,
    });
    return data;
  }

  async function register(login, password) {
    return endpoints.register(login, password);
  }

  function logout() {
    clearAuth();
  }

  const value = useMemo(
    () => ({
      isLoggedIn,
      role,
      loginName,
      login,
      register,
      logout,
    }),
    [isLoggedIn, role, loginName]
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
