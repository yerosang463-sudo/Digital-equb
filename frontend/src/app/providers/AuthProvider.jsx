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

  function updateAuth(nextToken, nextUser) {
    setStoredAuth(nextToken, nextUser);
    setToken(nextToken);
    setUser(nextUser);
  }

  function updateUser(nextUser) {
    setUser(nextUser);
    if (token) {
      setStoredAuth(token, nextUser);
    }
  }

  function clearSession() {
    clearStoredAuth();
    setUser(null);
    setToken(null);
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();
      
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // If we have cached user data, use it immediately and refresh in background
      if (storedUser && !cancelled) {
        setUser(storedUser);
        setToken(storedToken);
        setLoading(false);
        
        // Refresh user data in background without blocking UI
        apiRequest("/api/auth/me", { token: storedToken, skipCache: true })
          .then(({ user: currentUser }) => {
            if (!cancelled) {
              updateAuth(storedToken, currentUser);
            }
          })
          .catch((error) => {
            if (!cancelled && (error.status === 401 || error.status === 403)) {
              clearSession();
            }
          });
        return;
      }

      // No cached user, fetch from API
      try {
        const { user: currentUser } = await apiRequest("/api/auth/me", { 
          token: storedToken,
          skipCache: true 
        });
        if (!cancelled) {
          updateAuth(storedToken, currentUser);
        }
      } catch (error) {
        if (!cancelled) {
          clearSession();
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

    const { user: completeUser } = await apiRequest("/api/auth/me", {
      token: payload.token,
      skipCache: true,
    });

    updateAuth(payload.token, completeUser);
    return { ...payload, user: completeUser };
  }

  async function signup(formData) {
    const payload = await apiRequest("/api/auth/register", {
      method: "POST",
      body: formData,
    });

    const { user: completeUser } = await apiRequest("/api/auth/me", {
      token: payload.token,
      skipCache: true,
    });

    updateAuth(payload.token, completeUser);
    return { ...payload, user: completeUser };
  }

  async function loginWithGoogle(credential) {
    if (!credential) {
      throw new Error("No Google credential provided");
    }

    setLoading(true);
    try {
      const payload = await apiRequest("/api/auth/google", {
        method: "POST",
        body: { credential },
      });

      const { user: completeUser } = await apiRequest("/api/auth/me", {
        token: payload.token,
        skipCache: true
      });

      updateAuth(payload.token, completeUser);
      return { ...payload, user: completeUser };
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    const payload = await apiRequest("/api/auth/me");
    updateUser(payload.user);
    return payload.user;
  }

  function logout() {
    clearSession();
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      signup,
      loginWithGoogle,
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
