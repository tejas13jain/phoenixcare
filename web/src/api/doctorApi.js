import { apiClient } from './client.js';

export const doctorApi = {
  list: (params) => apiClient.get('/doctors', { params }).then((r) => r.data),
  featured: () => apiClient.get('/doctors/featured').then((r) => r.data),
  specialties: () => apiClient.get('/doctors/specialties').then((r) => r.data),
  getById: (id) => apiClient.get(`/doctors/${id}`).then((r) => r.data),
  getSlots: (doctorId, params) => apiClient.get(`/doctors/${doctorId}/slots`, { params }).then((r) => r.data),
  getMyProfile: () => apiClient.get('/doctors/me/profile').then((r) => r.data),
  updateMyProfile: (payload) => apiClient.patch('/doctors/me/profile', payload).then((r) => r.data),
  generateSlots: (payload) => apiClient.post('/doctors/me/slots/generate', payload).then((r) => r.data),
  updateSlotStatus: (slotId, status) =>
    apiClient.patch(`/doctors/me/slots/${slotId}`, { status }).then((r) => r.data),
  deleteSlot: (slotId) => apiClient.delete(`/doctors/me/slots/${slotId}`).then((r) => r.data),
};
