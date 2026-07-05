import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { CompanyRegistrationProvider } from './.Context/CompanyRegistrationContext.jsx'
import { HRRegistrationProvider } from './.Context/HRRegistrationContext.jsx'
import { AuthProvider } from './.Context/AuthContext.jsx'
import { LoginProvider } from './.Context/LoginContext'
import ErrorBoundary from './components/Functions/ErrorBoundary.jsx'
import AlertHost from './components/Functions/AlertHost.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AlertHost />
      <HashRouter>
        <AuthProvider>
          <LoginProvider>
            <CompanyRegistrationProvider>
              <HRRegistrationProvider>
                <App />
              </HRRegistrationProvider>
            </CompanyRegistrationProvider>
          </LoginProvider>
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>
)