import { apiClient } from './client.js';

export const dietPlanApi = {
  listMineAsDoctor: (params) => apiClient.get('/diet-plans/mine', { params }).then((r) => r.data),
  listMineAsPatient: () => apiClient.get('/diet-plans/patient/mine').then((r) => r.data),
  getById: (id) => apiClient.get(`/diet-plans/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/diet-plans', payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/diet-plans/${id}`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/diet-plans/${id}`).then((r) => r.data),
};
