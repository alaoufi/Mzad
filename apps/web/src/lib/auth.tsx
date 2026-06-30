'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

interface User {
  id: string;
  name: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  ready: boolean;            // اكتملت قراءة الجلسة (لمنع وميض «سجّل الدخول»)
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  ready: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem('mazad_token');
      const u = localStorage.getItem('mazad_user');
      if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    } catch { /* تجاهل */ }
    setReady(true);
  }, []);

  const login = (t: string, u: User) => {
    localStorage.setItem('mazad_token', t);
    localStorage.setItem('mazad_user', JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('mazad_token');
    localStorage.removeItem('mazad_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
