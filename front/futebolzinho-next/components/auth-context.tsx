"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "@/lib/api";

type AuthContextValue = {
  isLoggedIn: boolean;
  userEmail: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("token");
    if (stored) {
      setIsLoggedIn(true);
      setUserEmail(stored);
    }
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoggedIn,
      userEmail,
      loading,
      async login(email: string, password: string) {
        const response = await api.login(email, password);
        const tokenEmail = response.token.email;
        window.localStorage.setItem("token", tokenEmail);
        setUserEmail(tokenEmail);
        setIsLoggedIn(true);
      },
      logout() {
        window.localStorage.removeItem("token");
        setUserEmail(null);
        setIsLoggedIn(false);
      },
    }),
    [isLoggedIn, loading, userEmail]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth precisa ser usado dentro de AuthProvider");
  }
  return context;
}
