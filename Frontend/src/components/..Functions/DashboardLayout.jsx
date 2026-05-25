import { Outlet } from 'react-router'
import Navbar from '../.Navbar/Navbar'
import NavbarHrStaff from '../.Navbar/NavbarHrStaff'


export default function DashboardLayout() {

  const role = localStorage.getItem("role");

  return (
    <>
      {role === "hr_staff" ? <NavbarHrStaff /> : <Navbar />}
      <Outlet />
    </>
  )
}