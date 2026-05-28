import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { CompanyRegistrationProvider } from './.Context/CompanyRegistrationContext.jsx'
import { AuthProvider } from './.Context/AuthContext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CompanyRegistrationProvider>
          <App />
        </CompanyRegistrationProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)