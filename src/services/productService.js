import api from './api';

const productService = {
  getAllProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data, config = {}) => api.post('/products', data, config),
  updateProduct: (id, data, config = {}) => api.put(`/products/${id}`, data, config),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export default productService;
export { productService };
