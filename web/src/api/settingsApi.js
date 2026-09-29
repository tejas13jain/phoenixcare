import { apiClient } from './client.js';

export const settingsApi = {
  getFooter: () => apiClient.get('/settings/footer').then((r) => r.data),
  updateFooter: (payload) => apiClient.put('/settings/footer', payload).then((r) => r.data),
};
