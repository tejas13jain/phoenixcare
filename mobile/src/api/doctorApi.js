import { apiClient } from './client.js';

export const doctorApi = {
  list: (params) => apiClient.get('/doctors', { params }).then((r) => r.data),
  featured: () => apiClient.get('/doctors/featured').then((r) => r.data),
  specialties: () => apiClient.get('/doctors/specialties').then((r) => r.data),
  getById: (id) => apiClient.get(`/doctors/${id}`).then((r) => r.data),
  getSlots: (doctorId, params) => apiClient.get(`/doctors/${doctorId}/slots`, { params }).then((r) => r.data),
};

export const appointmentApi = {
  create: (payload) => apiClient.post('/appointments', payload).then((r) => r.data),
  listMine: (params) => apiClient.get('/appointments', { params }).then((r) => r.data),
  cancel: (id, reason) => apiClient.post(`/appointments/${id}/cancel`, { reason }).then((r) => r.data),
};

export const paymentApi = {
  createOrder: (appointmentId) => apiClient.post('/payments/orders', { appointmentId }).then((r) => r.data),
  verify: (payload) => apiClient.post('/payments/verify', payload).then((r) => r.data),
};
