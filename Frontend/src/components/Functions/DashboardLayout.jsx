import { Outlet } from 'react-router'
import Navbar from '../.Navbar/Navbar'
import { useAuth } from "../../.Context/AuthContext";

export default function DashboardLayout() {
  const { auth } = useAuth();
  const role = auth.role;

  return (
    <>
      <Navbar />
      <Outlet />
    </>
  )
}