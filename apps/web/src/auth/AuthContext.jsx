import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const storageKey = "internFlowUser";
const tokenKey = "internFlowToken";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
  }, []);

  const signIn = (payload) => {
    const nextUser = {
      name: payload.name || "",
      email: payload.email,
      role: payload.role || "hr"
    };
    localStorage.setItem(storageKey, JSON.stringify(nextUser));
    if (payload.token) {
      localStorage.setItem(tokenKey, payload.token);
    }
    setUser(nextUser);
  };

  const signOut = () => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem(tokenKey);
    setUser(null);
  };

  const value = useMemo(() => ({ user, signIn, signOut }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
