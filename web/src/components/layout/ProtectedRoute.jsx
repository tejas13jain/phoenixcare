import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/slices/authStore.js';

export function ProtectedRoute({ children, roles }) {
  const { user, accessToken } = useAuthStore();
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
