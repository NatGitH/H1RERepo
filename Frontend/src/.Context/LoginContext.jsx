import { createContext, useContext, useState } from "react";

const LoginContext = createContext(null);

const STORAGE_KEY = "hire_login_data";

const defaultLoginData = {
  companyId: null,
  companyName: null,
  pendingUserEmail: null,
};

const loadLoginData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultLoginData;
  } catch {
    return defaultLoginData;
  }
};

export function LoginProvider({ children }) {
  const [loginData, setLoginData] = useState(loadLoginData);

  const setCompany = (data) => {
    const newData = { ...defaultLoginData, ...data };
    setLoginData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const clearCompany = () => {
    setLoginData(defaultLoginData);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <LoginContext.Provider value={{ loginData, setCompany, clearCompany }}>
      {children}
    </LoginContext.Provider>
  );
}

export function useLogin() {
  return useContext(LoginContext);
}