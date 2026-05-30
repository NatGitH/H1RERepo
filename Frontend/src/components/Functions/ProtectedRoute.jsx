import { Navigate } from 'react-router';
import { useAuth } from '../../.Context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { auth } = useAuth();

  if (!auth.token) return <Navigate to="/" />;
  if (allowedRoles && !allowedRoles.includes(auth.role)) return <Navigate to="/" />;

  return children;
}