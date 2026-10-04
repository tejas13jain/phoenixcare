import { apiClient } from './client.js';

export const labApi = {
  list: (params) => apiClient.get('/labs', { params }).then((r) => r.data),
  cities: () => apiClient.get('/labs/cities').then((r) => r.data),
  get: (id) => apiClient.get(`/labs/${id}`).then((r) => r.data),
};

export const adminLabApi = {
  list: (params) => apiClient.get('/admin/labs', { params }).then((r) => r.data),
  get: (id) => apiClient.get(`/admin/labs/${id}`).then((r) => r.data),
  create: (payload) => apiClient.post('/admin/labs', payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/admin/labs/${id}`, payload).then((r) => r.data),
};
