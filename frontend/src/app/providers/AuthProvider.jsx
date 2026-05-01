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
              setUser(currentUser);
              setStoredAuth(storedToken, currentUser);
            }
          })
          .catch(() => {
            // If refresh fails, keep using cached data
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
    try {
      const payload = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });

      // Use user data from login response if complete, otherwise fetch full profile
      const completeUser = payload.user || await apiRequest("/api/auth/me", { 
        token: payload.token,
        skipCache: true
      }).then(res => res.user).catch(() => payload.user);

      setStoredAuth(payload.token, completeUser);
      setToken(payload.token);
      setUser(completeUser);
      return { ...payload, user: completeUser };
    } catch (error) {
      throw error;
    }
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

  async function loginWithGoogle(credential) {
    if (!credential) {
      throw new Error("No Google credential provided");
    }

    setLoading(true);
    try {
      const payload = await apiRequest("/api/auth/google", {
        method: "POST",
        body: { idToken: credential },
      });

      const { user: completeUser } = await apiRequest("/api/auth/me", {
        token: payload.token,
        skipCache: true
      });

      setStoredAuth(payload.token, completeUser);
      setToken(payload.token);
      setUser(completeUser);
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
