import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "hire_auth";

const defaultAuth = {
  token: null,
  role: null,
  companyId: null,
  companyName: null,
  email: null,
  user_id: null,
  adminId: null,
  profile_picture: null,
  firstname: null,
  lastname: null,
};

const loadAuth = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultAuth;
  } catch {
    return defaultAuth;
  }
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadAuth);

  const login = (data) => {
    const newAuth = { ...defaultAuth, ...data };
    setAuth(newAuth);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAuth));
  };

  const logout = () => {
    setAuth(defaultAuth);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}