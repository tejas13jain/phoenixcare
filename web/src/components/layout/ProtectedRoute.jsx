import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/slices/authStore.js';
import { doctorApi } from '../../api/doctorApi.js';
import { Skeleton } from '../ui/index.js';
import {
  hasAcceptedTerms,
  hasDocumentsOk,
  rememberDocumentsOk,
  rememberTermsAccepted,
} from './doctorTermsGate.js';

export const DOCTOR_TERMS_PATH = '/doctor/terms';
export const DOCTOR_DOCUMENTS_PATH = '/doctor/documents';

export function ProtectedRoute({ children, roles }) {
  const { user, accessToken } = useAuthStore();
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  // Doctors finish onboarding before using any doctor-facing page: accept the Doctor Terms &
  // Conditions, then upload verification documents (unless they're already verified).
  if (user.role === 'doctor' && location.pathname !== DOCTOR_TERMS_PATH) {
    return <DoctorOnboardingGuard user={user}>{children}</DoctorOnboardingGuard>;
  }
  return children;
}

function DoctorOnboardingGuard({ user, children }) {
  const location = useLocation();
  const onDocumentsPage = location.pathname === DOCTOR_DOCUMENTS_PATH;
  const settled = hasAcceptedTerms(user._id) && (onDocumentsPage || hasDocumentsOk(user._id));
  const [state, setState] = useState(settled ? 'ok' : 'checking');

  useEffect(() => {
    if (hasAcceptedTerms(user._id) && (onDocumentsPage || hasDocumentsOk(user._id))) {
      setState('ok');
      return undefined;
    }
    let cancelled = false;

    async function check() {
      if (!hasAcceptedTerms(user._id)) {
        const terms = await doctorApi.getMyTerms();
        if (!terms.data.status.accepted) return 'terms';
        rememberTermsAccepted(user._id);
      }
      if (!onDocumentsPage && !hasDocumentsOk(user._id)) {
        const docs = await doctorApi.getMyDocuments();
        const { kycStatus, needsAction } = docs.data;
        if (kycStatus !== 'verified' && needsAction) return 'documents';
        rememberDocumentsOk(user._id);
      }
      return 'ok';
    }

    check()
      .then((next) => !cancelled && setState(next))
      // If a check itself fails (e.g. offline) let the page load; the server still enforces the rules that matter.
      .catch(() => !cancelled && setState('ok'));
    return () => {
      cancelled = true;
    };
  }, [user._id, location.pathname, onDocumentsPage]);

  if (state === 'checking') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (state === 'terms') return <Navigate to={DOCTOR_TERMS_PATH} state={{ from: location }} replace />;
  if (state === 'documents') return <Navigate to={DOCTOR_DOCUMENTS_PATH} state={{ from: location }} replace />;
  return children;
}
