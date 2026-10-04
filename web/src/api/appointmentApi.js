import { apiClient } from './client.js';

export const appointmentApi = {
  create: (payload) => apiClient.post('/appointments', payload).then((r) => r.data),
  listMine: (params) => apiClient.get('/appointments', { params }).then((r) => r.data),
  getById: (id) => apiClient.get(`/appointments/${id}`).then((r) => r.data),
  cancel: (id, reason) => apiClient.post(`/appointments/${id}/cancel`, { reason }).then((r) => r.data),
  enterWaitingRoom: (id) => apiClient.post(`/appointments/${id}/waiting-room`).then((r) => r.data),
};

export const paymentApi = {
  createOrder: (appointmentId) => apiClient.post('/payments/orders', { appointmentId }).then((r) => r.data),
  verify: (payload) => apiClient.post('/payments/verify', payload).then((r) => r.data),
};

export const prescriptionApi = {
  create: (payload) => apiClient.post('/prescriptions', payload).then((r) => r.data),
  getByAppointment: (appointmentId) =>
    apiClient.get(`/prescriptions/appointment/${appointmentId}`).then((r) => r.data),
};

export const consultationApi = {
  getRoomInfo: (appointmentId) => apiClient.get(`/consultations/${appointmentId}/room`).then((r) => r.data),
  getChatHistory: (appointmentId) => apiClient.get(`/consultations/${appointmentId}/messages`).then((r) => r.data),
};

export const reviewApi = {
  create: (payload) => apiClient.post('/reviews', payload).then((r) => r.data),
  listForDoctor: (doctorId) => apiClient.get(`/reviews/doctor/${doctorId}`).then((r) => r.data),
};

export const notificationApi = {
  list: () => apiClient.get('/notifications').then((r) => r.data),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.patch('/notifications/read-all').then((r) => r.data),
};

export const healthRecordApi = {
  list: (type) => apiClient.get('/health-records', { params: { type } }).then((r) => r.data),
  upload: (formData) =>
    apiClient
      .post('/health-records', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data),
  remove: (id) => apiClient.delete(`/health-records/${id}`).then((r) => r.data),
};

export const adminApi = {
  pendingDoctors: () => apiClient.get('/admin/doctors/pending').then((r) => r.data),
  reviewKyc: (id, payload) => apiClient.patch(`/admin/doctors/${id}/kyc`, payload).then((r) => r.data),
  searchDoctors: (params) => apiClient.get('/admin/doctors', { params }).then((r) => r.data),
  createDoctor: (payload) => apiClient.post('/admin/doctors', payload).then((r) => r.data),
  resendStandardsEmail: (id) => apiClient.post(`/admin/doctors/${id}/standards-email`).then((r) => r.data),
  updateDoctor: (id, payload) => apiClient.patch(`/admin/doctors/${id}`, payload).then((r) => r.data),
  listUsers: (params) => apiClient.get('/admin/users', { params }).then((r) => r.data),
  setUserActive: (id, isActive) => apiClient.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data),
  analyticsOverview: () => apiClient.get('/admin/analytics/overview').then((r) => r.data),
  listPayments: (params) => apiClient.get('/admin/payments', { params }).then((r) => r.data),
  updatePayout: (id, payoutStatus) =>
    apiClient.patch(`/admin/payments/${id}/payout`, { payoutStatus }).then((r) => r.data),
  flaggedReviews: () => apiClient.get('/admin/reviews/flagged').then((r) => r.data),
  moderateReview: (id, isHidden) => apiClient.patch(`/admin/reviews/${id}/moderate`, { isHidden }).then((r) => r.data),
  sendCampaign: (payload) => apiClient.post('/admin/campaigns', payload).then((r) => r.data),
  listAppointments: (params) => apiClient.get('/admin/appointments', { params }).then((r) => r.data),
  exportAppointments: (params) =>
    apiClient.get('/admin/reports/appointments/export', { params, responseType: 'blob' }).then((r) => r.data),
  exportPayments: (params) =>
    apiClient.get('/admin/reports/payments/export', { params, responseType: 'blob' }).then((r) => r.data),
  exportDoctors: () => apiClient.get('/admin/reports/doctors/export', { responseType: 'blob' }).then((r) => r.data),
};

export const doctorReportApi = {
  getMyAnalytics: () => apiClient.get('/doctors/me/analytics').then((r) => r.data),
  exportMyReport: () => apiClient.get('/doctors/me/reports/export', { responseType: 'blob' }).then((r) => r.data),
};
