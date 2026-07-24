import React, { useEffect, useState, useTransition, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiArrowLeft,
  FiEdit3,
  FiTrash2,
  FiPackage,
  FiTag,
  FiLayers,
  FiStar,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiZoomIn
} from 'react-icons/fi';
import { productService } from '../../services/productService';
import { getAbsoluteUrl } from '../../services/api';
import './ProductDetail.css';

const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23fcfbfa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23c2b19e" font-size="16" font-family="sans-serif">No Image Available</text></svg>';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [, startTransition] = useTransition();

  // Instant local hydration from router state if present
  const [product, setProduct] = useState(location.state?.product || null);
  const [loading, setLoading] = useState(!location.state?.product);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('specs');
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchProductData = async () => {
      if (!product) {
        setLoading(true);
      }
      setError('');

      try {
        const response = await productService.getProduct(id);
        const data = response?.data?.product || response?.data || null;

        if (isMounted) {
          startTransition(() => {
            setProduct(data);
            setLoading(false);
          });
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load product details.');
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchProductData();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Gallery items extraction
  const mediaItems = useMemo(() => {
    if (!product) return [];
    const list = [];

    if (Array.isArray(product.images)) list.push(...product.images);
    if (Array.isArray(product.media)) list.push(...product.media);
    if (product.image || product.thumbnail) {
      list.push(product.image || product.thumbnail);
    }

    return list
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') {
          return { url: getAbsoluteUrl(item), isVideo: /\.(mp4|webm|ogg|mov)$/i.test(item) };
        }
        if (typeof item === 'object') {
          const rawUrl = item.url || item.src || item.path;
          return rawUrl
            ? { url: getAbsoluteUrl(rawUrl), isVideo: item.type === 'video' || /\.(mp4|webm|ogg|mov)$/i.test(rawUrl) }
            : null;
        }
        return null;
      })
      .filter(Boolean);
  }, [product]);

  const currentMedia = mediaItems[activeImageIndex] || mediaItems[0] || { url: FALLBACK_IMAGE, isVideo: false };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleDelete = async () => {
    if (!product || isDeleting) return;

    const confirmed = window.confirm('Delete this product from the catalog?');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await productService.deleteProduct(product._id || product.id);
      await new Promise((resolve) => setTimeout(resolve, 400));
      navigate('/products', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="adm-pd-wrapper">
        <div className="adm-pd-container">
          <div className="adm-pd-skeleton">
            <div className="adm-skel-gallery" />
            <div className="adm-skel-info" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="adm-pd-wrapper">
        <div className="adm-pd-container">
          <div className="adm-pd-error-card">
            <FiAlertCircle className="adm-pd-err-icon" />
            <h3>Product Not Found</h3>
            <p>{error || 'The requested product could not be located.'}</p>
            <button className="adm-pd-btn-back" onClick={() => navigate('/products')}>
              Return to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;

  return (
    <div className="adm-pd-wrapper">
      <Helmet>
        <title>{`${product.name || 'Product Detail'} | Admin Dashboard`}</title>
      </Helmet>

      <div className="adm-pd-container">
        {/* Top Header Actions */}
        <div className="adm-pd-header">
          <button className="adm-pd-back-link" onClick={() => navigate('/products')}>
            <FiArrowLeft /> Back to Products
          </button>
          <div className="adm-pd-header-actions">
            <button className="adm-pd-delete-btn" onClick={handleDelete} disabled={isDeleting}>
              <FiTrash2 /> {isDeleting ? 'Deleting...' : 'Delete Product'}
            </button>
            <Link to={`/products/edit/${product._id || product.id}`} className="adm-pd-edit-btn">
              <FiEdit3 /> Edit Product
            </Link>
          </div>
        </div>

        {/* Main Grid Card */}
        <div className="adm-pd-grid-card">
          {/* Gallery Column */}
          <div className="adm-pd-gallery-section">
            <div
              className="adm-pd-main-stage"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              {currentMedia.isVideo ? (
                <video src={currentMedia.url} controls className="adm-pd-stage-media" />
              ) : (
                <div className="adm-pd-zoom-frame">
                  <img
                    src={currentMedia.url}
                    alt={product.name}
                    className="adm-pd-stage-media"
                    style={
                      isZoomed
                        ? {
                            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                            transform: 'scale(1.8)'
                          }
                        : undefined
                    }
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
              )}
              {!currentMedia.isVideo && (
                <span className="adm-pd-zoom-tag">
                  <FiZoomIn /> Hover to Zoom
                </span>
              )}
            </div>

            {mediaItems.length > 1 && (
              <div className="adm-pd-thumb-list">
                {mediaItems.map((item, idx) => (
                  <button
                    key={`${item.url}-${idx}`}
                    className={`adm-pd-thumb-item ${activeImageIndex === idx ? 'active' : ''}`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    {item.isVideo ? (
                      <div className="adm-pd-thumb-video">▶</div>
                    ) : (
                      <img
                        src={item.url}
                        alt={`Thumbnail ${idx + 1}`}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information Column */}
          <div className="adm-pd-info-section">
            <div className="adm-pd-badge-bar">
              <span className={`adm-pd-badge ${product.isActive ? 'active' : 'inactive'}`}>
                {product.isActive ? <FiCheckCircle /> : <FiXCircle />}
                {product.isActive ? 'Active on Storefront' : 'Hidden / Inactive'}
              </span>
              <span className={`adm-pd-badge ${product.stock > 0 ? 'in-stock' : 'out-stock'}`}>
                <FiPackage /> {product.stock > 0 ? `${product.stock} Units Available` : 'Out of Stock'}
              </span>
            </div>

            <span className="adm-pd-brand-label">{product.brand || 'Unbranded Collection'}</span>
            <h1 className="adm-pd-title">{product.name}</h1>

            <div className="adm-pd-rating-bar">
              <FiStar className="star-icon" />
              <span>{product.rating ? `${product.rating} / 5.0 Rating` : 'No reviews yet'}</span>
            </div>

            <div className="adm-pd-price-panel">
              <div className="adm-price-block">
                <span className="adm-label">Listing Price</span>
                <span className="adm-price-val">Rs. {Number(product.price || 0).toLocaleString()}</span>
              </div>
              {product.comparePrice && (
                <div className="adm-price-block">
                  <span className="adm-label">Compare Price</span>
                  <span className="adm-price-old">Rs. {Number(product.comparePrice).toLocaleString()}</span>
                </div>
              )}
              <div className="adm-price-block">
                <span className="adm-label">SKU Identifier</span>
                <span className="adm-sku-val">{product.sku || 'N/A'}</span>
              </div>
            </div>

            <p className="adm-pd-desc">{product.description || 'No detailed description provided for this product.'}</p>

            {/* Structured Info Panels */}
            <div className="adm-pd-spec-grid">
              <div className="adm-spec-box">
                <div className="adm-spec-head">
                  <FiPackage /> Category & Meta
                </div>
                <ul>
                  <li>
                    <span>Category:</span> <strong>{categoryName || 'Uncategorized'}</strong>
                  </li>
                  <li>
                    <span>Material:</span> <strong>{product.material || 'N/A'}</strong>
                  </li>
                  <li>
                    <span>Featured:</span> <strong>{product.isFeatured ? 'Yes' : 'No'}</strong>
                  </li>
                </ul>
              </div>

              <div className="adm-spec-box">
                <div className="adm-spec-head">
                  <FiTag /> Variations
                </div>
                <ul>
                  <li>
                    <span>Sizes:</span>{' '}
                    <strong>
                      {Array.isArray(product.sizes) && product.sizes.length
                        ? product.sizes.map((s) => (typeof s === 'object' ? s.name : s)).join(', ')
                        : 'N/A'}
                    </strong>
                  </li>
                  <li>
                    <span>Colors:</span>{' '}
                    <strong>
                      {Array.isArray(product.colors) && product.colors.length
                        ? product.colors.map((c) => (typeof c === 'object' ? c.name : c)).join(', ')
                        : 'N/A'}
                    </strong>
                  </li>
                  <li>
                    <span>Tags:</span>{' '}
                    <strong>
                      {Array.isArray(product.tags) && product.tags.length ? product.tags.join(', ') : 'N/A'}
                    </strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tab System for Extended Information */}
        <div className="adm-pd-tabs-wrapper">
          <div className="adm-pd-tabs-header">
            <button
              className={`adm-tab-btn ${activeTab === 'specs' ? 'active' : ''}`}
              onClick={() => setActiveTab('specs')}
            >
              <FiLayers /> Additional Specifications
            </button>
          </div>

          <div className="adm-pd-tab-body">
            {activeTab === 'specs' && (
              <div className="adm-pd-table-list">
                <div className="adm-table-row">
                  <span>Product ID</span>
                  <code>{product._id || product.id || 'N/A'}</code>
                </div>
                <div className="adm-table-row">
                  <span>Short Summary</span>
                  <p>{product.shortDescription || product.description || 'N/A'}</p>
                </div>
                <div className="adm-table-row">
                  <span>Stock Quantity</span>
                  <span>{product.stock || 0} Units</span>
                </div>
                <div className="adm-table-row">
                  <span>Visibility Status</span>
                  <span>{product.isActive ? 'Published on Storefront' : 'Draft / Private'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;