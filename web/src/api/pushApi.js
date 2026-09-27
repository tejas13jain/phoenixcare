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
  getProgress: () => apiClient.get('/wellness/progress').then((r) => r.data),
  getNutrition: () => apiClient.get('/wellness/nutrition').then((r) => r.data),

  getTodaySleep: () => apiClient.get('/wellness/sleep').then((r) => r.data),
  logSleep: (hours, quality) => apiClient.post('/wellness/sleep/log', { hours, quality }).then((r) => r.data),

  getTodayActivity: () => apiClient.get('/wellness/activity/today').then((r) => r.data),
  logActivity: (steps) => apiClient.post('/wellness/activity/log', { steps }).then((r) => r.data),

  getWeightHistory: () => apiClient.get('/wellness/weight').then((r) => r.data),
  logWeight: (weight) => apiClient.post('/wellness/weight/log', { weight }).then((r) => r.data),
};

export const patientApi = {
  getMyProfile: () => apiClient.get('/patients/me').then((r) => r.data),
  updateMyProfile: (payload) => apiClient.patch('/patients/me', payload).then((r) => r.data),
};

export const medicationApi = {
  list: () => apiClient.get('/medications').then((r) => r.data),
  create: (payload) => apiClient.post('/medications', payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/medications/${id}`).then((r) => r.data),
};
