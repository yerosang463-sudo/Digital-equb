import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  apiRequest,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
} from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(Boolean(getStoredToken()));

  function updateUser(nextUser) {
    setUser(nextUser);
    if (token) {
      setStoredAuth(token, nextUser);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const { user: currentUser } = await apiRequest("/api/auth/me", { token: storedToken });
        if (!cancelled) {
          setToken(storedToken);
          setStoredAuth(storedToken, currentUser);
          setUser(currentUser);
        }
      } catch (error) {
        if (!cancelled) {
          clearStoredAuth();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email, password) {
    const payload = await apiRequest("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });

    setStoredAuth(payload.token, payload.user);
    setToken(payload.token);
    setUser(payload.user);
    return payload;
  }

  async function signup(formData) {
    const payload = await apiRequest("/api/auth/register", {
      method: "POST",
      body: formData,
    });

    setStoredAuth(payload.token, payload.user);
    setToken(payload.token);
    setUser(payload.user);
    return payload;
  }

  async function refreshUser() {
    const payload = await apiRequest("/api/auth/me");
    updateUser(payload.user);
    return payload.user;
  }

  function logout() {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      logout,
      refreshUser,
      setUser: updateUser,
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
