import { apiClient } from './client.js';

export const blogApi = {
  list: (params) => apiClient.get('/blogs', { params }).then((r) => r.data),
  featured: () => apiClient.get('/blogs/featured').then((r) => r.data),
  getBySlug: (slug) => apiClient.get(`/blogs/slug/${slug}`).then((r) => r.data),
  listMine: () => apiClient.get('/blogs/mine').then((r) => r.data),
  create: (payload) => apiClient.post('/blogs', payload).then((r) => r.data),
  update: (id, payload) => apiClient.patch(`/blogs/${id}`, payload).then((r) => r.data),
  remove: (id) => apiClient.delete(`/blogs/${id}`).then((r) => r.data),
  setStatus: (id, publish) => apiClient.patch(`/blogs/${id}/${publish ? 'publish' : 'unpublish'}`).then((r) => r.data),
};
