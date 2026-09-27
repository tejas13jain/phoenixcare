import axios from 'axios';
import { useAuthStore } from '../store/slices/authStore.js';

export const apiClient = axios.create({
  baseURL: '/api/v1',
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
            .post('/api/v1/auth/refresh', { refreshToken })
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
