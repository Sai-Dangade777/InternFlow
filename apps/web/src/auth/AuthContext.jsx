import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const storageKey = "internflow_auth";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser(parsed?.user || parsed);
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    setLoading(false);
  }, []);

  const signIn = (payload) => {
    const nextUser = {
      id: payload.id || payload.user?.id || "",
      name: payload.name || payload.user?.name || "",
      email: payload.email || payload.user?.email || "",
      role: payload.role || payload.user?.role || "candidate",
      token: payload.token || payload.user?.token || ""
    };

    localStorage.setItem(storageKey, JSON.stringify({ user: nextUser }));
    setUser(nextUser);
  };

  const signOut = () => {
    localStorage.removeItem(storageKey);
    setUser(null);
  };

  const switchRole = (role) => {
    if (!user) {
      return;
    }

    const nextUser = { ...user, role };
    localStorage.setItem(storageKey, JSON.stringify({ user: nextUser }));
    setUser(nextUser);
  };

  const value = useMemo(() => ({ user, loading, signIn, signOut, switchRole }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
