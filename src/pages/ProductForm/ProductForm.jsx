import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { getAbsoluteUrl } from '../../services/api';
import './ProductForm.css';

const DEFAULT_FORM_STATE = {
  name: '',
  category: '',
  subcategory: '',
  price: '',
  comparePrice: '',
  sku: '',
  stock: '',
  brand: 'AURA Atelier',
  material: '',
  colors: '',
  sizes: '',
  tags: '',
  description: '',
  featured: false,
  isFlash: false,
  isNew: true,
  status: 'active',
};

const parseCommaList = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : item?.name || item?.code || ''))
      .filter(Boolean)
      .join(', ');
  }
  return typeof value === 'string' ? value : '';
};

const normalizeProduct = (product = {}) => ({
  name: product.name || '',
  description: product.description || '',
  price: product.price ?? '',
  comparePrice: product.comparePrice ?? '',
  category: product.category?._id || product.category?.id || product.category || '',
  sku: product.sku || '',
  stock: product.stock ?? '',
  brand: product.brand || 'AURA Atelier',
  material: product.material || '',
  colors: parseCommaList(product.colors),
  sizes: parseCommaList(product.sizes),
  tags: parseCommaList(product.tags),
  subcategory: product.subcategory || '',
  featured: Boolean(product.isFeatured),
  isFlash: Boolean(product.isFlashSale ?? product.isFlash),
  isNew: Boolean(product.isNewArrival ?? product.isNew),
  status: product.isActive === false ? 'inactive' : 'active',
});

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(DEFAULT_FORM_STATE);
  const [categories, setCategories] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [previews, setPreviews] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [fetchingData, setFetchingData] = useState(isEdit);

  // Instant SEO update
  useEffect(() => {
    document.title = isEdit ? 'Edit Look | Aura Admin' : 'New Collection | Aura Admin';
  }, [isEdit]);

  // Non-blocking Category Fetching
  useEffect(() => {
    let mounted = true;
    categoryService.getAllCategories()
      .then((res) => {
        if (mounted) {
          setCategories(res.data?.categories || res.data || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Non-blocking Edit Data Fetching
  useEffect(() => {
    if (!isEdit) return;

    let mounted = true;
    setFetchingData(true);

    productService.getProduct(id)
      .then((res) => {
        if (!mounted) return;
        const product = res?.data?.product ?? res?.data?.data ?? res?.data;
        if (product) {
          setForm(normalizeProduct(product));
          if (Array.isArray(product.images)) {
            setExistingImages(product.images.map((img) => img.url || img).filter(Boolean));
          }
        }
      })
      .catch(() => {
        if (mounted) setError('Failed to retrieve luxury ensemble data');
      })
      .finally(() => {
        if (mounted) setFetchingData(false);
      });

    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  // Memory cleanup for object URLs
  useEffect(() => {
    return () => {
      Object.values(previews).forEach((preview) => {
        if (preview?.url?.startsWith('blob:')) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [previews]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setNewFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const isVideo = file.type?.startsWith('video/');
      const blobUrl = URL.createObjectURL(file);
      setPreviews((prev) => ({
        ...prev,
        [file.name]: { url: blobUrl, type: isVideo ? 'video' : 'image' },
      }));
    });
  };

  const removeNewImage = (fileName) => {
    if (previews[fileName]?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(previews[fileName].url);
    }
    setNewFiles((prev) => prev.filter((f) => f.name !== fileName));
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[fileName];
      return next;
    });
  };

  const removeExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Ensemble name is required');
    if (!form.price) return setError('Retail price is required');
    if (!form.category) return setError('Please select a collection category');

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (['sizes', 'colors'].includes(key)) {
          const list = val.split(',').map((s) => s.trim()).filter(Boolean);
          formData.append(key, JSON.stringify(list));
        } else if (['featured', 'isFlash', 'isNew'].includes(key)) {
          const mapKey = key === 'featured' ? 'isFeatured' : key;
          formData.append(mapKey, val);
        } else if (key === 'status') {
          formData.append('isActive', val === 'active');
        } else {
          formData.append(key, val);
        }
      });

      newFiles.forEach((file) => formData.append('images', file));
      if (isEdit) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      const config = {
        onUploadProgress: (evt) => {
          setUploadProgress(Math.round((evt.loaded * 100) / evt.total));
        },
      };

      const res = isEdit
        ? await productService.updateProduct(id, formData, config)
        : await productService.createProduct(formData, config);

      if (res.status === 200 || res.status === 201 || res.data?.success) {
        navigate('/products');
      } else {
        throw new Error(res.data?.message || 'Operation failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Server error occurred');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const allImages = useMemo(() => [
    ...existingImages.map((url) => ({
      url: getAbsoluteUrl(url),
      originalUrl: url,
      isExisting: true,
      type: /\.(mp4|webm|mov)$/i.test(url) ? 'video' : 'image',
    })),
    ...newFiles.map((file) => ({
      url: previews[file.name]?.url || '',
      name: file.name,
      isExisting: false,
      type: previews[file.name]?.type || 'image',
    })),
  ], [existingImages, newFiles, previews]);

  const priceFormatted = useMemo(() => {
    return form.price ? Number(form.price).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00';
  }, [form.price]);

  const availableSubcategories = useMemo(() => {
    if (!form.category || !categories.length) return [];
    const matched = categories.find((c) => (c._id || c.id) === form.category);
    return matched?.subcategoryNames || matched?.subcategories || [];
  }, [form.category, categories]);

  return (
    <form className={`product-form ${fetchingData ? 'pf-skeleton' : ''}`} onSubmit={handleSubmit}>
      {/* LEFT FORM FIELDS */}
      <div className="form-left">
        {error && <div className="error-banner">{error}</div>}

        <section className="card">
          <div className="card-header">
            <h2>
              Design Details
              {fetchingData && <span className="pf-inline-loader" />}
            </h2>
            <span className="card-subtitle">Exquisite garment information and title tags</span>
          </div>

          <div className="form-group">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Title (e.g., Silk Embellished Kurta)"
              required
            />
          </div>

          <div className="form-group">
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="SKU Reference (e.g., AUR-SLK-01)"
            />
          </div>

          <div className="grid2">
            <div className="price-input-wrapper">
              <span className="currency-prefix">Rs.</span>
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Retail Price"
                type="number"
                step="0.01"
                required
              />
            </div>
            <div className="price-input-wrapper">
              <span className="currency-prefix">Rs.</span>
              <input
                name="comparePrice"
                value={form.comparePrice}
                onChange={handleChange}
                placeholder="Original Price"
                type="number"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid2">
            <select name="category" value={form.category} onChange={handleChange} required>
              <option value="">
                {categories.length ? 'Select Luxury Collection' : 'Loading Collections...'}
              </option>
              {categories.map((cat) => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              name="subcategory"
              value={form.subcategory}
              onChange={handleChange}
              disabled={!availableSubcategories.length}
            >
              <option value="">
                {availableSubcategories.length ? 'Select Subcategory' : 'No Subcategories'}
              </option>
              {availableSubcategories.map((sub) => (
                <option key={typeof sub === 'string' ? sub : sub.name} value={typeof sub === 'string' ? sub : sub._id}>
                  {typeof sub === 'string' ? sub : sub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Atelier Narrative & Stitching Details..."
              rows={4}
              required
            />
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Inventory & Specifications</h2>
            <span className="card-subtitle">Manage quantities and physical product parameters</span>
          </div>

          <div className="grid2">
            <input
              name="stock"
              value={form.stock}
              onChange={handleChange}
              placeholder="Stock Quantity"
              type="number"
            />
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <input
            name="brand"
            value={form.brand}
            onChange={handleChange}
            placeholder="Brand Atelier"
          />
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Curation Attributes</h2>
            <span className="card-subtitle">Define sizing variations, palettes, and placement tags</span>
          </div>

          <div className="form-group">
            <input
              name="sizes"
              value={form.sizes}
              onChange={handleChange}
              placeholder="Sizing (e.g. XS, S, M, L, XL)"
            />
          </div>

          <div className="form-group">
            <input
              name="colors"
              value={form.colors}
              onChange={handleChange}
              placeholder="Color Palette (e.g. Crimson, Ivory)"
            />
          </div>

          <div className="form-group">
            <input
              name="tags"
              value={form.tags}
              onChange={handleChange}
              placeholder="Discovery Tags (e.g. Pret, Festive)"
            />
          </div>

          <div className="switches-box">
            <label className="switch-container">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
              />
              <span className="switch-slider" />
              <span className="switch-label">Curate as Featured Look</span>
            </label>

            <label className="switch-container">
              <input
                type="checkbox"
                name="isFlash"
                checked={form.isFlash}
                onChange={handleChange}
              />
              <span className="switch-slider" />
              <span className="switch-label">Assign to Flash Sale Room</span>
            </label>

            <label className="switch-container">
              <input
                type="checkbox"
                name="isNew"
                checked={form.isNew}
                onChange={handleChange}
              />
              <span className="switch-slider" />
              <span className="switch-label">Mark as Fresh Seasonal Arrival</span>
            </label>
          </div>
        </section>
      </div>

      {/* RIGHT PREVIEW & MEDIA */}
      <div className="form-right">
        <div className="preview-card">
          <span className="preview-indicator">Atelier Preview</span>
          <div className="preview-img-wrapper">
            {allImages[0] ? (
              allImages[0].type === 'video' ? (
                <video src={allImages[0].url} autoPlay loop muted playsInline />
              ) : (
                <img src={allImages[0].url} alt="Preview" />
              )
            ) : (
              <span className="preview-placeholder">No Preview Image</span>
            )}
          </div>
          <div className="preview-meta">
            <span className="preview-brand">{form.brand || 'AURA'}</span>
            <h3 className="preview-title">{form.name || 'Unnamed Masterpiece'}</h3>
            <div className="preview-price-tag">
              <span className="preview-price">Rs. {priceFormatted}</span>
              {form.comparePrice && (
                <span className="preview-compare">
                  Rs. {Number(form.comparePrice).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Media Assets</h2>
            <span className="card-subtitle">High-fidelity catalog images</span>
          </div>

          <div className="file-drop-zone">
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileChange}
              accept="image/*,video/*"
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="drop-zone-label">
              <span className="upload-icon">✦</span>
              <span className="upload-text-main">Add Images or Motion Clips</span>
              <span className="upload-text-sub">PNG, JPG, MP4 supported</span>
            </label>
          </div>

          {uploadProgress > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className="progress-text">Uploading Assets: {uploadProgress}%</span>
            </div>
          )}

          {allImages.length > 0 && (
            <div className="imgGrid">
              {allImages.map((img) => (
                <div key={img.isExisting ? img.originalUrl : img.name} className="imgBox">
                  {img.type === 'video' ? (
                    <video src={img.url} muted />
                  ) : (
                    <img src={img.url} alt="Thumbnail" />
                  )}
                  <button
                    type="button"
                    className="delete-img-btn"
                    onClick={() =>
                      img.isExisting
                        ? removeExistingImage(img.originalUrl)
                        : removeNewImage(img.name)
                    }
                    disabled={uploading}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="actions">
          <button type="submit" className="btn-primary" disabled={uploading}>
            {uploading ? 'Publishing...' : isEdit ? 'Publish Updates' : 'Add to Catalog'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/products')}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;