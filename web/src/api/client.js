import axios from 'axios';
import { useAuthStore } from '../store/slices/authStore.js';
import { clearDocumentsOk, clearTermsAccepted } from '../components/layout/doctorTermsGate.js';

// In dev, '/api/v1' is proxied to the backend by vite.config.js. In production there is no
// dev-server proxy, so a deployed build needs VITE_API_BASE_URL pointing at the real backend
// origin (e.g. https://phoenixcare-api.onrender.com/api/v1), set as a build-time env var.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshPromise = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 403 && error.response?.data?.code === 'TERMS_REQUIRED') {
      clearTermsAccepted();
      clearDocumentsOk();
      if (window.location.pathname !== '/doctor/terms') window.location.assign('/doctor/terms');
    }

    if (status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
      originalRequest._retry = true;
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
            .then((res) => res.data.data)
            .finally(() => {
              refreshPromise = null;
            });
        }
        const { accessToken, refreshToken: newRefreshToken } = await refreshPromise;
        setTokens({ accessToken, refreshToken: newRefreshToken });

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(error) {
  const data = error?.response?.data;
  // A validation failure arrives as "Validation failed" plus a list of what was actually wrong.
  // Show the specifics — "Validation failed" alone tells the person nothing.
  if (Array.isArray(data?.details) && data.details.length) {
    const reasons = [...new Set(data.details.map((d) => d?.message).filter(Boolean))];
    if (reasons.length) return reasons.join(' · ');
  }
  return data?.message || error?.message || 'Something went wrong. Please try again.';
}
