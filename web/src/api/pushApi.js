import { apiClient } from './client.js';

export const pushApi = {
  getPublicKey: () => apiClient.get('/push/public-key').then((r) => r.data),
  subscribe: (subscription) => apiClient.post('/push/subscribe', { subscription }).then((r) => r.data),
  unsubscribe: (endpoint) => apiClient.post('/push/unsubscribe', { endpoint }).then((r) => r.data),
};

export const wellnessApi = {
  getTodayTip: () => apiClient.get('/wellness/tips/today').then((r) => r.data),
  getTodayWater: () => apiClient.get('/wellness/water/today').then((r) => r.data),
  logWater: (delta) => apiClient.post('/wellness/water/log', { delta }).then((r) => r.data),
};
