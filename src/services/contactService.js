import api from './api';

export const contactService = {
  submitMessage: (payload) => api.post('/contact', payload),
  getAllMessages: () => api.get('/contact'),
  updateMessageStatus: (id, status) => api.put(`/contact/${id}/status`, { status }),
};
