import { createContext, useContext, useState } from "react";

const HRRegistrationContext = createContext(null);

export function HRRegistrationProvider({ children }) {
  const [registrationData, setRegistrationData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const updateData = (fields) =>
    setRegistrationData((prev) => ({ ...prev, ...fields }));

  return (
    <HRRegistrationContext.Provider value={{ registrationData, updateData }}>
      {children}
    </HRRegistrationContext.Provider>
  );
}

export function useHRRegistration() {
  return useContext(HRRegistrationContext);
}