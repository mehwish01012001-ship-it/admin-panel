import api from './api';

export const orderService = {
  getAllOrders: (params = {}) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
};
