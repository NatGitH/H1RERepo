import { createContext, useContext, useState } from "react";

const CompanyRegistrationContext = createContext(null);

export function CompanyRegistrationProvider({ children }) {
  const [registrationData, setRegistrationData] = useState({
    companyName: "",
    email: "",
    password: "",
    staffPassword: "",
    businessPermit: null,
    dtiSec: null,
    bir: null,
    planType: "",
  });

  const updateData = (fields) =>
    setRegistrationData((prev) => ({ ...prev, ...fields }));

  return (
    <CompanyRegistrationContext.Provider value={{ registrationData, updateData }}>
      {children}
    </CompanyRegistrationContext.Provider>
  );
}

export function useCompanyRegistration() {
  return useContext(CompanyRegistrationContext);
}