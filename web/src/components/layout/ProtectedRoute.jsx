import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/slices/authStore.js';
import { doctorApi } from '../../api/doctorApi.js';
import { Skeleton } from '../ui/index.js';
import { hasAcceptedTerms, rememberTermsAccepted } from './doctorTermsGate.js';

export const DOCTOR_TERMS_PATH = '/doctor/terms';

export function ProtectedRoute({ children, roles }) {
  const { user, accessToken } = useAuthStore();
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  // Doctors must accept the Doctor Terms & Conditions before using any doctor-facing page.
  if (user.role === 'doctor' && location.pathname !== DOCTOR_TERMS_PATH) {
    return <DoctorTermsGuard user={user}>{children}</DoctorTermsGuard>;
  }
  return children;
}

function DoctorTermsGuard({ user, children }) {
  const location = useLocation();
  const [state, setState] = useState(hasAcceptedTerms(user._id) ? 'accepted' : 'checking');

  useEffect(() => {
    if (hasAcceptedTerms(user._id)) {
      setState('accepted');
      return undefined;
    }
    let cancelled = false;
    doctorApi
      .getMyTerms()
      .then((res) => {
        if (cancelled) return;
        if (res.data.status.accepted) rememberTermsAccepted(user._id);
        setState(res.data.status.accepted ? 'accepted' : 'required');
      })
      // If the check itself fails (e.g. offline) let the page load; the server still enforces it.
      .catch(() => !cancelled && setState('accepted'));
    return () => {
      cancelled = true;
    };
  }, [user._id, location.pathname]);

  if (state === 'checking') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (state === 'required') {
    return <Navigate to={DOCTOR_TERMS_PATH} state={{ from: location }} replace />;
  }
  return children;
}
