import { apiClient } from './client.js';

export const surgeryApi = {
  createEnquiry: (payload) => apiClient.post('/surgery/enquiries', payload).then((r) => r.data),
  listEnquiries: (params) => apiClient.get('/surgery/enquiries', { params }).then((r) => r.data),
  updateEnquiryStatus: (id, status) =>
    apiClient.patch(`/surgery/enquiries/${id}/status`, { status }).then((r) => r.data),
};
