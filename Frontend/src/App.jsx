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


import Applicants from './components/Applicants/Applicants'

import Requirements from './components/Requirements/Requirements'

import Employer from './components/Employer/Employer'

import Profile from './components/Profile/Profile'



function App() {
  return (
    <>
      <link href="/src/style.css" rel="stylesheet"></link>

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
