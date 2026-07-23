import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import DashboardLayout from './components/Functions/DashboardLayout'
import ProtectedRoute from './components/Functions/ProtectedRoute'

import Home from './components/1Home/Home'

import CreateAccount from './components/1Home/CreateAccount'
import HRSignup from './components/1Home/HRSignup'
import UserLogin from './components/1Home/UserLogin'
import HRCompanyHome from './components/1Home/HRCompanyHome'
import CreateCompany from './components/1Home/CreateCompany/CreateCompany'
import CompanyDocuments from './components/1Home/CreateCompany/CompanyDocuments'
import AccountVerification from './components/1Home/CreateCompany/AccountVerification'
import SubscriptionPlan from './components/1Home/CreateCompany/Subscriptions/SubscriptionPlan'
import Receipt from './components/1Home/CreateCompany/Subscriptions/Receipt'
import Payment from './components/1Home/CreateCompany/Subscriptions/Payment'

// Password-reset pages kept — the reset-link email still routes here.
import HRForgotPassword from './components/1Home/LoginCompany/LoginHR/HRForgotPassword'
import VerifyCode from './components/1Home/LoginCompany/LoginHR/VerifyCode'
import HRNewPassword from './components/1Home/LoginCompany/LoginHR/HRNewPassword'

import Applicants from './components/Applicants/Applicants'

import Requirements from './components/Requirements/Requirements'

import Employer from './components/Employer/Employer'

import Profile from './components/Profile/Profile'

import Metrics from './components/Metrics/Metrics'

import AdminDashboard from './components/Admin/AdminDashboard'

function App() {
  return (
    <>
      <Routes>
          <Route path="" element={<Home/>}/>

          <Route path="/Create-Account" element={<CreateAccount/>}/>
          <Route path="/HR-Signup" element={<HRSignup/>}/>
          <Route path="/User-Login" element={<UserLogin/>}/>
          <Route path="/HR-Home" element={<HRCompanyHome/>}/>
          <Route path="/Create-Company" element={<CreateCompany/>}/>
          <Route path="/Company-Documents" element={<CompanyDocuments />} />
          <Route path="/Account-Verification" element={<AccountVerification />} />
          <Route path="/Subscription-Plan" element={<SubscriptionPlan />} />
          <Route path="/Receipt" element={<Receipt />} />
          <Route path="/Payment" element={<Payment />} />

          <Route path="/HR-Forgot-Password" element={<HRForgotPassword />} />
          <Route path="/Verify-Code" element={<VerifyCode />} />
          <Route path="/HR-New-Password" element={<HRNewPassword />} />

          <Route path="/Admin-Dashboard" element={<AdminDashboard />} />

          <Route element={
            <ProtectedRoute allowedRoles={["owner", "HRManager", "HRStaff"]}>
              <DashboardLayout />
            </ProtectedRoute>
            }>

            <Route path="/Applicants" element={<Applicants/>}/>

            <Route path="/Requirements" element={<Requirements />} />

            <Route path="/Profile" element={<Profile />} />

            <Route path="/Employer" element={<Employer/>}/>

            <Route path="/Metrics" element={
              <ProtectedRoute allowedRoles={["owner", "HRManager"]}>
                <Metrics />
              </ProtectedRoute>
            }/>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
