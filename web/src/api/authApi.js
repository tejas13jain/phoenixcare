import { apiClient } from './client.js';

export const authApi = {
  signup: (payload) => apiClient.post('/auth/signup', payload).then((r) => r.data),
  login: (payload) => apiClient.post('/auth/login', payload).then((r) => r.data),
  requestOtp: (payload) => apiClient.post('/auth/otp/request', payload).then((r) => r.data),
  verifyOtp: (payload) => apiClient.post('/auth/otp/verify', payload).then((r) => r.data),
  me: () => apiClient.get('/auth/me').then((r) => r.data),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data),
};
