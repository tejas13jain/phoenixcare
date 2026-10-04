import { useAuthStore } from '../../store/slices/authStore.js';

// Remembers (for this browser tab) that the signed-in doctor has accepted the current terms,
// so the route guard doesn't re-check with the server on every navigation. It is cleared when
// the server says terms are required again (e.g. the terms were updated mid-session).
let acceptedFor = null;

export const hasAcceptedTerms = (userId) => acceptedFor === userId;
export const rememberTermsAccepted = (userId) => {
  acceptedFor = userId;
};
export const clearTermsAccepted = () => {
  acceptedFor = null;
};

// Used by the terms page right after a successful accept.
export function markTermsAccepted() {
  const user = useAuthStore.getState().user;
  if (user) acceptedFor = user._id;
}
