import { useAuthStore } from '../../store/slices/authStore.js';

// Per-tab memory of the signed-in doctor's onboarding checks, so the route guard doesn't ask
// the server on every navigation:
//  - terms:     they have accepted the current Doctor Terms & Conditions
//  - documents: they have nothing left to upload (or they're already verified)
// Both are cleared when the server says otherwise (e.g. terms updated mid-session).
let termsAcceptedFor = null;
let documentsOkFor = null;

export const hasAcceptedTerms = (userId) => termsAcceptedFor === userId;
export const rememberTermsAccepted = (userId) => {
  termsAcceptedFor = userId;
};
export const clearTermsAccepted = () => {
  termsAcceptedFor = null;
};

export const hasDocumentsOk = (userId) => documentsOkFor === userId;
export const rememberDocumentsOk = (userId) => {
  documentsOkFor = userId;
};
export const clearDocumentsOk = () => {
  documentsOkFor = null;
};

// Used by the terms page right after a successful accept.
export function markTermsAccepted() {
  const user = useAuthStore.getState().user;
  if (user) termsAcceptedFor = user._id;
}
