

import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { getAbsoluteUrl } from '../../services/api';
import './ProductForm.css';

const getInitialState = () => ({
  name: '',
  category: '',
  subcategory: '',
  price: '',
  comparePrice: '',
  sku: '',
  stock: '',
  brand: '', // Dynamic default for a luxury stitched clothing brand
  material: '',
  colors: '',
  sizes: '',
  tags: '',
  description: '',
  featured: false,
  isFlash: false,
  isNew: true, // Default to true for fresh seasonal arrivals
  status: 'active',
});

const normalizeProductForForm = (product = {}) => {
  const normalizeList = (value) => {
    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item : item?.name || item?.code || ''))
        .filter(Boolean)
        .join(', ');
    }

    if (typeof value === 'string') {
      return value;
    }

    return '';
  };

  return {
    name: product.name || '',
    description: product.description || '',
    price: product.price ?? '',
    comparePrice: product.comparePrice ?? '',
    category: product.category?._id || product.category?.id || product.category || '',
    sku: product.sku || '',
    stock: product.stock ?? '',
    brand: product.brand || '',
    material: product.material || '',
    colors: normalizeList(product.colors),
    sizes: normalizeList(product.sizes),
    tags: normalizeList(product.tags),
    subcategory: product.subcategory || '',
    featured: Boolean(product.isFeatured),
    isFlash: Boolean(product.isFlashSale ?? product.isFlash),
    isNew: Boolean(product.isNewArrival ?? product.isNew),
    status: product.isActive === false ? 'inactive' : 'active',
  };
};

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(getInitialState());
  const [categories, setCategories] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(isEdit);

  // SEO & Head Metadata Optimization for Admin Form
  useEffect(() => {
    const pageTitle = isEdit ? "Edit Premium Ensemble | Aura Portal" : "Add New Stitched Masterpiece | Aura Portal";
    const pageDesc = "Management portal for curating premium women's stitched collections, pret wear, and artisanal formal ensembles.";
    
    document.title = pageTitle;
    
    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = pageDesc;

    // Open Graph / Social SEO Optimization
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = pageTitle;
  }, [isEdit]);

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAllCategories();
      setCategories(response.data?.categories || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Failed to load seasonal collections');
    }
  };

  const loadProduct = async () => {
    try {
      setLoadingProduct(true);
      setError(null);

      const response = await productService.getProduct(id);
      const productPayload = response?.data?.product ?? response?.data?.data ?? response?.data;
      const product = productPayload && typeof productPayload === 'object' && !Array.isArray(productPayload)
        ? productPayload
        : null;

      if (!product) {
        throw new Error('No product data returned');
      }

      setForm(normalizeProductForForm(product));
      setNewFiles([]);
      setPreviews({});

      if (product.images && product.images.length > 0) {
        const imageUrls = product.images.map((img) => img.url || img).filter(Boolean);
        setExistingImages(imageUrls);
      } else {
        setExistingImages([]);
      }
    } catch (err) {
      console.error('Failed to load product:', err);
      setError('Failed to retrieve luxury ensemble data');
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setNewFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const isVideo = file.type?.startsWith('video/');

      if (isVideo) {
        const previewUrl = URL.createObjectURL(file);
        setPreviews((prev) => ({
          ...prev,
          [file.name]: { url: previewUrl, type: 'video' },
        }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviews((prev) => ({
          ...prev,
          [file.name]: { url: event.target.result, type: 'image' },
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (fileName) => {
    const preview = previews[fileName];
    if (preview?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(preview.url);
    }

    setNewFiles((prev) => prev.filter((f) => f.name !== fileName));
    setPreviews((prev) => {
      const updated = { ...prev };
      delete updated[fileName];
      return updated;
    });
  };

  const removeExistingImage = (url) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) return setError('Ensemble name is required');
    if (!form.description.trim()) return setError('Artisanal description is required');
    if (!form.price) return setError('Retail price is required');
    if (!form.category) return setError('Please select a main collection category');

    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (!objectIdPattern.test(form.category)) {
      return setError('Please select a valid system category ID');
    }

    if (!form.sku.trim()) return setError('Inventory SKU reference is required');

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      formData.append('comparePrice', form.comparePrice || '');
      formData.append('category', form.category);
      formData.append('subcategory', form.subcategory || '');
      formData.append('sku', form.sku);
      formData.append('stock', form.stock || 0);
      formData.append('brand', form.brand);
      formData.append('material', form.material);
      formData.append('tags', form.tags);
      formData.append('isFeatured', form.featured);
      formData.append('isFlash', form.isFlash);
      formData.append('isNew', form.isNew);
      formData.append('isActive', form.status === 'active');

      const sizes = form.sizes
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      const colors = form.colors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      formData.append('sizes', JSON.stringify(sizes));
      formData.append('colors', JSON.stringify(colors));

      newFiles.forEach((file) => {
        formData.append('images', file);
      });

      if (isEdit && existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      const config = {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      };

      let response;
      if (isEdit) {
        response = await productService.updateProduct(id, formData, config);
      } else {
        response = await productService.createProduct(formData, config);
      }

      if (response.data?.success || response.status === 200 || response.status === 201) {
        navigate('/products');
      } else {
        throw new Error(response.data?.message || 'Failed to save premium apparel record');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.response?.data?.message || err.message || 'Server synchronization failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const allImages = [
    ...existingImages.map((url) => ({
      url: getAbsoluteUrl(url),
      originalUrl: url,
      isExisting: true,
      type: /\.(mp4|webm|ogg|mov)$/i.test(String(url)) ? 'video' : 'image',
    })),
    ...newFiles.map((file) => ({
      url: previews[file.name]?.url || '',
      name: file.name,
      isExisting: false,
      type: previews[file.name]?.type || (file.type?.startsWith('video/') ? 'video' : 'image'),
    })),
  ];

  const firstImage = allImages[0]?.url;

  const pricePreview = useMemo(() => {
    return form.price ? Number(form.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
  }, [form.price]);

  if (loadingProduct) {
    return (
      <div className="pf-loading">
        <div className="spinner"></div>
        <span>Retrieving Atelier Records...</span>
      </div>
    );
  }

  return (
    <form className="product-form" onSubmit={handleSubmit}>
      {/* LEFT FORM FIELDS */}
      <div className="form-left">
        {error && <div className="error-banner">{error}</div>}

        <section className="card">
          <div className="card-header">
            <h2>Design Details</h2>
            <span className="card-subtitle">Exquisite garment information and title tags</span>
          </div>
          
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Title (e.g., Silk Embellished Kurta)"
            required
          />
          
          <div>
            <input
              name="sku"
              value={form.sku}
              onChange={handleChange}
              placeholder="SKU Reference (e.g., AUR-SLK-01)"
            />
          </div>

          <div className="grid2">
            <div className="price-input-wrapper">
              <span className="currency-prefix">$</span>
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
              <span className="currency-prefix">$</span>
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
            <select
              name="category"
              value={form.category}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  category: e.target.value,
                  subcategory: '',
                }));
              }}
              required
              disabled={categories.length === 0}
            >
              <option value="">
                {categories.length === 0 ? 'Loading Collections...' : 'Select Luxury Collection'}
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
              disabled={
                !form.category ||
                !categories.find((cat) => (cat._id || cat.id) === form.category)?.subcategoryNames?.length
              }
            >
              <option value="">
                {categories.find((cat) => (cat._id || cat.id) === form.category)?.subcategoryNames?.length
                  ? 'Select Subcategory'
                  : 'No subcategories available'}
              </option>
              {categories
                .find((cat) => (cat._id || cat.id) === form.category)
                ?.subcategoryNames?.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
            </select>
          </div>

          {categories.length === 0 && (
            <div className="field-note">
              No active architectural collections defined in the database.
            </div>
          )}

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Atelier Narrative & Stitching Details (e.g., Threadwork, cutline description, lining specifics...)"
            rows={5}
            required
          />
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
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="grid2">
            <input
              name="brand"
              value={form.brand}
              onChange={handleChange}
              placeholder="Brand Atelier"
            />
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Curation Attributes</h2>
            <span className="card-subtitle">Define sizing variations, palettes, and placement tags</span>
          </div>
          <input
            name="sizes"
            value={form.sizes}
            onChange={handleChange}
            placeholder="Sizing (comma separated e.g. XS, S, M, L, XL)"
          />
          <input
            name="colors"
            value={form.colors}
            onChange={handleChange}
            placeholder="Color Palette (comma separated e.g. Crimson, Ivory, Olive Gold)"
          />
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="Discovery Tags (comma separated e.g. Pret, Festive, Eid)"
          />
          
          <div className="switches-box">
            <label className="switch-container">
              <input
                type="checkbox"
                name="featured"
                checked={form.featured}
                onChange={handleChange}
              />
              <span className="switch-slider"></span>
              <span className="switch-label">Curate as Featured Look</span>
            </label>
            
            <label className="switch-container">
              <input
                type="checkbox"
                name="isFlash"
                checked={form.isFlash}
                onChange={handleChange}
              />
              <span className="switch-slider"></span>
              <span className="switch-label">Assign to Flash Sale Room</span>
            </label>
            
            <label className="switch-container">
              <input
                type="checkbox"
                name="isNew"
                checked={form.isNew}
                onChange={handleChange}
              />
              <span className="switch-slider"></span>
              <span className="switch-label">Mark as Fresh Seasonal Arrival</span>
            </label>
          </div>
        </section>
      </div>

      {/* RIGHT PREVIEW & IMAGE MEDIA */}
      <div className="form-right">
        <div className="preview-card">
          <span className="preview-indicator">Atelier Preview</span>
          <div className="preview-img-wrapper">
            <img src={firstImage} alt="Luxury Silhouette Preview" />
          </div>
          <div className="preview-meta">
            <span className="preview-brand">{form.brand || 'AURA'}</span>
            <h3 className="preview-title">{form.name || 'Unnamed Masterpiece'}</h3>
            <div className="preview-price-tag">
              <span className="preview-price">${pricePreview}</span>
              {form.comparePrice && (
                <span className="preview-compare">${Number(form.comparePrice).toFixed(2)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="upload-card card">
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
              <span className="upload-text-sub">PNG, JPG, MP4, WEBM and other media files accepted</span>
            </label>
          </div>

          {uploadProgress > 0 && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="progress-text">Uploading Assets: {uploadProgress}%</span>
            </div>
          )}

          {allImages.length > 0 && (
            <div className="imgGrid">
              {allImages.map((img, idx) => (
                <div key={img.isExisting ? img.originalUrl : img.name} className="imgBox">
                  {img.type === 'video' ? (
                    <video src={img.url} controls playsInline muted />
                  ) : (
                    <img src={img.url} alt={`Silhouette ${idx + 1}`} />
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
                    ✦
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="actions">
          <button type="submit" className="btn-primary" disabled={uploading || loadingProduct}>
            {uploading ? 'Archiving...' : isEdit ? 'Publish Updates' : 'Add to Catalog'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/products')}>
            Return to Wardrobe
          </button>
        </div>
      </div>
    </form>
  );
};

export default ProductForm;