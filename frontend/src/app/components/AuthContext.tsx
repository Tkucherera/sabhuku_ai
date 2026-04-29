// context/AuthContext.tsx
import { createContext, useCallback, useEffect, useRef, useContext, useState, ReactNode } from "react";

import { refreshAuthToken } from "../api/authApi";
import {
  AUTH_TOKEN_UPDATED_EVENT,
  clearStoredToken,
  getStoredRefreshToken,
  isTokenExpired,
  isTokenExpiringSoon,
  storeAuthTokens,
} from "../auth";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken?: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const lastActivityRef = useRef(Date.now());
  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const [token, setToken] = useState<string | null>(
    () => {
      const storedToken = localStorage.getItem("token");
      if (isTokenExpired(storedToken)) {
        clearStoredToken();
        return null;
      }
      return storedToken;
    }
  );

  const logout = useCallback(() => {
    setToken(null);
    clearStoredToken();
  }, []);

  const refreshSession = useCallback(async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      logout();
      return;
    }

    if (!refreshInFlightRef.current) {
      refreshInFlightRef.current = refreshAuthToken(refreshToken)
        .then((data) => {
          storeAuthTokens(data.access, data.refresh ?? refreshToken);
          setToken(data.access);
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          refreshInFlightRef.current = null;
        });
    }

    await refreshInFlightRef.current;
  }, [logout]);

  const login = (jwt: string, refreshToken?: string | null) => {
    setToken(jwt);
    storeAuthTokens(jwt, refreshToken);
  };

  useEffect(() => {
    const markActive = () => {
      lastActivityRef.current = Date.now();
      if (token && isTokenExpiringSoon(token)) {
        void refreshSession();
      }
    };

    const syncToken = () => {
      setToken(localStorage.getItem("token"));
    };

    const events: Array<keyof WindowEventMap> = ["focus", "click", "keydown", "mousemove", "scroll", "touchstart"];
    events.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }));
    window.addEventListener(AUTH_TOKEN_UPDATED_EVENT, syncToken);
    window.addEventListener("storage", syncToken);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, markActive));
      window.removeEventListener(AUTH_TOKEN_UPDATED_EVENT, syncToken);
      window.removeEventListener("storage", syncToken);
    };
  }, [refreshSession, token]);

  useEffect(() => {
    if (!token) return;

    const checkSession = () => {
      const activeWithinFiveMinutes = Date.now() - lastActivityRef.current < 5 * 60 * 1000;
      if (activeWithinFiveMinutes && isTokenExpiringSoon(token)) {
        void refreshSession();
      }
    };

    checkSession();
    const interval = window.setInterval(checkSession, 60 * 1000);
    return () => window.clearInterval(interval);
  }, [refreshSession, token]);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: Boolean(token), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
