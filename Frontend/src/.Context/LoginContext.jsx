import { createContext, useContext, useState } from "react";

const LoginContext = createContext(null);

export function LoginProvider({ children }) {
  const [loginData, setLoginData] = useState({
    companyId: null,
    companyName: null,
    pendingUserEmail: null,
  });

  const setCompany = (data) => setLoginData(data);

  return (
    <LoginContext.Provider value={{ loginData, setCompany }}>
      {children}
    </LoginContext.Provider>
  );
}

export function useLogin() {
  return useContext(LoginContext);
}