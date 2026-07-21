import api from './api';

export const categoryService = {
  getAllCategories: async () => {
    try {
      const response = await api.get('/categories');
      return response;
    } catch (error) {
      console.error('Category fetch failed:', error);
      return { data: { categories: [] } };
    }
  },
  getCategoryById: (id) => api.get(`/categories/${id}`),
  createCategory: (formData) => api.post('/categories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateCategory: (id, formData) => api.put(`/categories/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};
