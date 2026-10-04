import { apiClient } from './client.js';

export const assistantApi = {
  status: () => apiClient.get('/assistant/status').then((r) => r.data),
  // The model may call several tools before it answers, so allow longer than a normal request.
  chat: (payload) => apiClient.post('/assistant/chat', payload, { timeout: 70000 }).then((r) => r.data),
};
