import api from './api';

export const customerService = {
  getAllCustomers: () => api.get('/customers'),
  getCustomerById: (id) => api.get(`/customers/${id}`),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
};
