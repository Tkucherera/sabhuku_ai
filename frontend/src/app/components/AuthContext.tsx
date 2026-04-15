// context/AuthContext.tsx
import { createContext, useContext, useState, ReactNode } from "react";

import { clearStoredToken, isTokenExpired } from "../auth";

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
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

  const login = (jwt: string) => {
    setToken(jwt);
    localStorage.setItem("token", jwt);
  };

  const logout = () => {
    setToken(null);
    clearStoredToken();
  };

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
