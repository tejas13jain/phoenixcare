import axios from 'axios';
import Constants from 'expo-constants';
import { useAuthStore } from '../store/authStore.js';

// extra.apiBaseUrl (app.json) points at the same Express API the web app consumes —
// swap it per environment (dev machine LAN IP / staging / prod) without touching any screen.
const baseURL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({ baseURL, timeout: 15000 });

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
            .post(`${baseURL}/auth/refresh`, { refreshToken })
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
  return error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
}
