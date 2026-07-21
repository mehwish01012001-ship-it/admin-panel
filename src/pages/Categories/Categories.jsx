import React, { useEffect, useState } from 'react';
import './Categories.css';
import { categoryService } from '../../services/categoryService';

const normalizeCategory = (category) => ({
  ...category,
  id: category._id || category.id || '',
  name: category.name || category.season || 'Unnamed Category',
  subcategoryNames: Array.isArray(category.subcategoryNames) 
    ? category.subcategoryNames 
    : category.subcategoryNames 
      ? String(category.subcategoryNames).split(',').map((s) => s.trim()).filter(Boolean) 
      : [],
});

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const [formMode, setFormMode] = useState('create');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [subcategoriesInput, setSubcategoriesInput] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: '' }), 3500);
  };

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await categoryService.getAllCategories();
      const fetched = response?.data?.categories || [];
      setCategories(fetched.map(normalizeCategory));
    } catch (err) {
      console.error('Fetch categories failed:', err);
      setError('Unable to load categories at the moment.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCategory(null);
    setCategoryName('');
    setSubcategoriesInput('');
    setFormMode('create');
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(!isFormOpen);
  };

  const openCategoryModal = (category, index) => {
    setActiveCategory({ ...category, srNo: index + 1 });
  };

  const closeCategoryModal = () => {
    setActiveCategory(null);
  };

  const openEditForm = (category) => {
    setSelectedCategory(category);
    setFormMode('edit');
    setCategoryName(category.name);
    setSubcategoriesInput(category.subcategoryNames ? category.subcategoryNames.join(', ') : '');
    setIsFormOpen(true);
  };

  const buildFormData = () => {
    const payload = new FormData();
    payload.append('name', categoryName.trim());
    payload.append('subcategoryNames', subcategoriesInput.trim());
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!categoryName.trim()) {
      return showToast('Please enter a category name before saving.', 'error');
    }

    try {
      setLoading(true);
      const payload = buildFormData();

      if (formMode === 'create') {
        await categoryService.createCategory(payload);
        showToast('Category created successfully.');
      } else if (selectedCategory) {
        await categoryService.updateCategory(selectedCategory.id, payload);
        showToast('Category updated successfully.');
      }

      await fetchCategories();
      resetForm();
      setIsFormOpen(false);
    } catch (err) {
      console.error('Save category failed:', err);
      const message = err?.response?.data?.message || 'Failed to save the category.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    const confirmed = window.confirm('Remove this category permanently?');
    if (!confirmed) return;

    try {
      setLoading(true);
      await categoryService.deleteCategory(categoryId);
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
      showToast('Category removed successfully.', 'success');
    } catch (err) {
      console.error('Delete category failed:', err);
      showToast('Failed to remove category.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      cat.name.toLowerCase().includes(query) ||
      cat.subcategoryNames.join(', ').toLowerCase().includes(query) ||
      cat.slug?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="categories-page">
      {toast.message && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}

      <header className="categories-header">
        <div>
          <h1>Global Categories</h1>
          <p>Create and manage endless layers of categories and sub-categories on the go</p>
        </div>
        <button className="primary-btn" onClick={openCreateForm}>
          {isFormOpen ? 'Close Panel' : 'Add Custom Category'}
        </button>
      </header>

      <section className={`category-form-panel ${isFormOpen ? 'open' : ''}`}>
        <form className="category-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="categoryName">Category Name</label>
            <input
              id="categoryName"
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="e.g., Autumn Collection, Footwear, Accessories"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="subcategories">Subcategories</label>
            <input
              id="subcategories"
              type="text"
              value={subcategoriesInput}
              onChange={(e) => setSubcategoriesInput(e.target.value)}
              placeholder="e.g., Boots, Sneakers, Sandals"
            />
            <p className="hint">Separate individual items using commas.</p>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-btn" onClick={() => { resetForm(); setIsFormOpen(false); }}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {formMode === 'edit' ? 'Update Details' : 'Save Category'}
            </button>
          </div>
        </form>
      </section>

      {activeCategory && (
        <div className="category-modal-backdrop" onClick={closeCategoryModal}>
          <div className="category-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="category-modal__close" onClick={closeCategoryModal}>
              ×
            </button>

            <div className="category-modal__header">
              <p className="category-modal__eyebrow">Category Details</p>
              <h3>{activeCategory.name}</h3>
            </div>

            <div className="category-modal__grid">
              <div className="category-modal__item">
                <span>Sr No</span>
                <strong>{activeCategory.srNo}</strong>
              </div>

              <div className="category-modal__item">
                <span>Title</span>
                <strong>{activeCategory.name}</strong>
              </div>

              <div className="category-modal__item">
                <span>Subcategory</span>
                {activeCategory.subcategoryNames?.length ? (
                  <div className="subcategory-tags modal-tags">
                    {activeCategory.subcategoryNames.map((sub, idx) => (
                      <span key={idx} className="sub-tag">{sub}</span>
                    ))}
                  </div>
                ) : (
                  <strong>—</strong>
                )}
              </div>

              <div className="category-modal__item">
                <span>Status</span>
                <span className={`status-pill ${activeCategory.isActive !== false ? 'active' : 'inactive'}`}>
                  {activeCategory.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="category-modal__item category-modal__item--actions">
                <span>Actions</span>
                <div className="action-group">
                  <button
                    className="action-button edit"
                    onClick={() => {
                      closeCategoryModal();
                      openEditForm(activeCategory);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="action-button delete"
                    onClick={() => {
                      closeCategoryModal();
                      handleDelete(activeCategory.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="categories-table-section">
        <div className="table-bar">
          <input
            type="search"
            placeholder="Search by category or subcategory..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span>{filteredCategories.length} structural segments found</span>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div className="table-empty">Synchronizing categories...</div>
          ) : error ? (
            <div className="table-empty error">{error}</div>
          ) : filteredCategories.length === 0 ? (
            <div className="table-empty">No dynamic categories recorded.</div>
          ) : (
            <table className="categories-table categories-table--compact">
              <thead>
                <tr>
                  <th>Sr No</th>
                  <th>Category Title</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category, index) => (
                  <tr
                    key={category.id}
                    className="category-row"
                    onClick={() => openCategoryModal(category, index)}
                  >
                    <td className="compact-cell compact-cell--number" data-label="Sr No">
                      {index + 1}
                    </td>
                    <td className="compact-cell compact-cell--title" data-label="Category Title">
                      <span className="category-title-cell">{category.name}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}