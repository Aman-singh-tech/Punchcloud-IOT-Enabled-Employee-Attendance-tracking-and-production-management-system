import { createContext, ReactNode, useEffect, useState } from "react";
import { authApi } from "../api/authApi";
import { tokenStore } from "../api/tokenStore";
import { AuthenticatedUser } from "../types/employee";

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_KEY = "punchcloud.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY);
    const hasToken = !!tokenStore.getAccessToken();
    if (stored && hasToken) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string) {
    const { accessToken, refreshToken, user: loggedInUser } = await authApi.login(email, password);
    tokenStore.setTokens(accessToken, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  }

  function logout() {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
  );
}
