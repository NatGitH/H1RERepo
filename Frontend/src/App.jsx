import { useState } from 'react'
import { Routes, Route } from 'react-router'
import DashboardLayout from './components/..Functions/DashboardLayout'

import Navbar from './components/.Navbar/Navbar'

import Home from './components/1Home/Home'

import CreateCompany from './components/1Home/CreateCompany/CreateCompany'
import CompanyDocuments from './components/1Home/CreateCompany/CompanyDocuments'
import AccountVerification from './components/1Home/CreateCompany/AccountVerification'
import AccountActivated from './components/1Home/CreateCompany/AccountActivated'
import SubscriptionPlan from './components/1Home/CreateCompany/Subscriptions/SubscriptionPlan'
import Receipt from './components/1Home/CreateCompany/Subscriptions/Receipt'

import LoginCompany from './components/1Home/LoginCompany/LoginCompany'
import CompanyHome from './components/1Home/LoginCompany/CompanyHome'
import CreateHRAccount from './components/1Home/LoginCompany/CreateHRAccount'
import CreateHRProfile from './components/1Home/LoginCompany/CreateHRProfile'
import LoginHRAccount from './components/1Home/LoginCompany/LoginHRAccount'
import HRForgotPassword from './components/1Home/LoginCompany/HRForgotPassword'
import VerifyCode from './components/1Home/LoginCompany/VerifyCode'
import HRNewPassword from './components/1Home/LoginCompany/HRNewPassword'

import Applicants from './components/Applicants/Applicants'

import Requirements from './components/Requirements/Requirements'

import Employer from './components/Employer/Employer'

import Profile from './components/Profile/Profile'



function App() {
  return (
    <>
      <Navbar />
      <Routes>
          /* Home */
          <Route path="" element={<Home/>}/>

          /* Create Company */
          <Route path="/Create-Company" element={<CreateCompany/>}/>
          <Route path="/Company-Documents" element={<CompanyDocuments />} />
          <Route path="/Account-Verification" element={<AccountVerification />} />
          <Route path="/Account-Activated" element={<AccountActivated />} />
          <Route path="/Subscription-Plan" element={<SubscriptionPlan />} />
          <Route path="/Receipt" element={<Receipt />} />

          /* Login Company */
          <Route path="/Login-Company" element={<LoginCompany />} />
          <Route path="/Company-Home" element={<CompanyHome />} />
          <Route path="/Create-HR-Account" element={<CreateHRAccount />} />
          <Route path="/Create-HR-Profile" element={<CreateHRProfile />} />
          <Route path="/Login-HR-Account" element={<LoginHRAccount />} />
          <Route path="/HR-Forgot-Password" element={<HRForgotPassword />} />
          <Route path="/Verify-Code" element={<VerifyCode />} />
          <Route path="/HR-New-Password" element={<HRNewPassword />} />

          <Route element={<DashboardLayout />}>
            /* Applicants */
            <Route path="/Applicants" element={<Applicants/>}/>

            /* Requirements */
            <Route path="/Requirements" element={<Requirements />} />

            /* Profile */
            <Route path="/Profile" element={<Profile />} />

            /* Employer */
            <Route path="/Employer" element={<Employer/>}/>
          </Route>
      </Routes>
    </>
  )
}

export default App
