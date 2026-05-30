import { useState } from 'react'
import { Routes, Route } from 'react-router'
import DashboardLayout from './components/Functions/DashboardLayout'
import ProtectedRoute from './components/Functions/ProtectedRoute'

import Home from './components/1Home/Home'

import CreateCompany from './components/1Home/CreateCompany/CreateCompany'
import CompanyDocuments from './components/1Home/CreateCompany/CompanyDocuments'
import AccountVerification from './components/1Home/CreateCompany/AccountVerification'
import SubscriptionPlan from './components/1Home/CreateCompany/Subscriptions/SubscriptionPlan'
import Receipt from './components/1Home/CreateCompany/Subscriptions/Receipt'
import Payment from './components/1Home/CreateCompany/Subscriptions/Payment'

import LoginCompany from './components/1Home/LoginCompany/LoginCompany'
import CompanyHome from './components/1Home/LoginCompany/LoginHR/CompanyHome'
import CreateHRAccount from './components/1Home/LoginCompany/LoginHR/CreateHRAccount'
import CreateHRProfile from './components/1Home/LoginCompany/LoginHR/CreateHRProfile'
import LoginHRAccount from './components/1Home/LoginCompany/LoginHR/LoginHRAccount'
import HRForgotPassword from './components/1Home/LoginCompany/LoginHR/HRForgotPassword'
import VerifyCode from './components/1Home/LoginCompany/LoginHR/VerifyCode'
import HRNewPassword from './components/1Home/LoginCompany/LoginHR/HRNewPassword'

import LoginOwner from './components/1Home/LoginOwner/LoginOwner'

import Applicants from './components/Applicants/Applicants'

import HRAccountRequirements from './components/Requirements/HRAccountRequirements'
import Requirements from './components/Requirements/Requirements'

import Employer from './components/Employer/Employer'

import MyProfile from './components/Profile/MyProfile'
import Profile from './components/Profile/Profile'



function App() {
  return (
    <>
      <Routes>
          /* Home */
          <Route path="" element={<Home/>}/>

          /* Create Company */
          <Route path="/Create-Company" element={<CreateCompany/>}/>
          <Route path="/Company-Documents" element={<CompanyDocuments />} />
          <Route path="/Account-Verification" element={<AccountVerification />} />
          <Route path="/Subscription-Plan" element={<SubscriptionPlan />} />
          <Route path="/Receipt" element={<Receipt />} />
          <Route path="/Payment" element={<Payment />} />

          /* Login Company */
          <Route path="/Login-Company" element={<LoginCompany />} />
          <Route path="/Company-Home" element={<CompanyHome />} />
          <Route path="/Create-HR-Account" element={<CreateHRAccount />} />
          <Route path="/Create-HR-Profile" element={<CreateHRProfile />} />
          <Route path="/Login-HR-Account" element={<LoginHRAccount />} />
          <Route path="/HR-Forgot-Password" element={<HRForgotPassword />} />
          <Route path="/Verify-Code" element={<VerifyCode />} />
          <Route path="/HR-New-Password" element={<HRNewPassword />} />

           /* Login Owner */
          <Route path="/Login-Owner" element={<LoginOwner />} />

          <Route element={
            <ProtectedRoute allowedRoles={["owner", "HRManager", "HRStaff"]}>
              <DashboardLayout />
            </ProtectedRoute>
            }>
            /* Applicants */
            <Route path="/Applicants" element={<Applicants/>}/>

            /* Requirements */
            <Route path="/Requirements" element={<Requirements />} />
            <Route path="/HR-Account-Requirements" element={<HRAccountRequirements />} />
           
            /* Profile */
            <Route path="/Profile" element={<Profile />} />
            <Route path="/My-Profile" element={<MyProfile />} />

            /* Employer */
            <Route path="/Employer" element={<Employer/>}/>
          </Route>
      </Routes>
    </>
  )
}

export default App
