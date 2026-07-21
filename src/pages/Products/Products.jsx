import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiGrid,
  FiPackage,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { getAbsoluteUrl } from '../../services/api';
import './Products.css';

const Products = () => {
  const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23fcfbfa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23c2b19e" font-size="18" font-family="Playfair Display, serif">No Image Available</text></svg>';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getAllProducts({ limit: 100, includeInactive: true });
      setProducts(response?.data?.products || []);
    } catch (err) {
      console.error(err);
      setError('Unable to retrieve luxury collection records.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    const confirmDelete = window.confirm(
      'Are you certain you want to remove this exquisite design from your catalogue?'
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await productService.deleteProduct(productId);
      setProducts((prev) =>
        prev.filter((product) => (product._id || product.id) !== productId)
      );
    } catch (err) {
      console.error(err);
      alert('Failed to delete product from the catalog.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product?.name?.toLowerCase().includes(search.toLowerCase()) ||
        product?.category?.name?.toLowerCase().includes(search.toLowerCase()) ||
        product?.sku?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? product.isActive
          : statusFilter === 'inactive'
          ? !product.isActive
          : statusFilter === 'low-stock'
          ? Number(product.stock) < 10
          : true;

      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((item) => item.isActive).length;
    const lowStockProducts = products.filter((item) => item.stock < 10).length;
    const totalValue = products.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.stock) || 0),
      0
    );

    return {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalValue
    };
  }, [products]);

  return (
    <div className="products-page">
      <Helmet>
        <title>Manage Luxury Women's Stitched Outfits | Couture Admin</title>
        <meta name="description" content="Seamlessly manage premium women's stitched collections, traditional formal attire, hand-embroidered ensembles, and boutique luxury stocks." />
        <meta name="keywords" content="stitched luxury clothing, women premium pret, designer inventory dashboard, boutique designer management" />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="products-header-card animate-fade-in">
        <div className="header-text-group">
    
          <h1>Collection</h1>
          <p>Analyze, and refine your premium apparel assets dynamically.</p>
        </div>

        <Link to="/products/create" className="btn-primary">
          <FiPlus /> Add Design
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon beige">
            <FiPackage />
          </div>
          <div>
            <h3>{stats.totalProducts}</h3>
            <p>Total Designs</p>
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="stat-icon olive">
            <FiCheckCircle />
          </div>
          <div>
            <h3>{stats.activeProducts}</h3>
            <p>On Display</p>
          </div>
        </div>

        <div
          className={`stat-card animate-slide-up ${statusFilter === 'low-stock' ? 'active' : ''}`}
          style={{ animationDelay: '0.3s', cursor: 'pointer' }}
          onClick={() => setStatusFilter((prev) => (prev === 'low-stock' ? 'all' : 'low-stock'))}
        >
          <div className="stat-icon terracotta">
            <FiAlertCircle />
          </div>
          <div>
            <h3>{stats.lowStockProducts}</h3>
            <p>Low Stock</p>
          </div>
        </div>

        <div className="stat-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="stat-icon champagne">
            <FiDollarSign />
          </div>
          <div>
            <h3>${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p>Valuation</p>
          </div>
        </div>
      </div>

      <div className="toolbar animate-fade-in">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by name, SKU, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <div className="status-toggle-group" role="group" aria-label="Filter products by status">
            <button
              type="button"
              className={`status-toggle-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </button>
            <button
              type="button"
              className={`status-toggle-btn ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Active
            </button>
            <button
              type="button"
              className={`status-toggle-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive
            </button>
          </div>

          <button
            className="refresh-btn"
            onClick={fetchProducts}
            title="Reload Inventory"
            aria-label="Reload Inventory"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      <div className="products-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="lux-spinner"></div>
            <p>Curating boutique collection...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <FiAlertCircle size={36} />
            <p>{error}</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map((product, index) => {
              const productId = product._id || product.id;
              const rawImage = product.images?.[0]?.url || product.images?.[0] || null;
              const image = getAbsoluteUrl(rawImage || PLACEHOLDER_IMAGE);

              return (
                <div 
                  className="product-card animate-fade-in-up" 
                  key={productId}
                  style={{ animationDelay: `${(index % 8) * 0.05}s` }}
                >
                  <div className="card-media">
                    <img
                      src={image}
                      alt={product.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                    <div className="luxury-overlay">
                      <span className="sku-overlay">SKU: {product.sku || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="card-content">
                      <span className="category-label">
                        {product.category?.name || product.category || 'Uncategorized'}
                      </span>
                      <h4>{product.name}</h4>
                    </div>
                    
                    <div className="card-meta-row">
                      <span className="price">${Number(product.price || 0).toFixed(2)}</span>
                      <span className={`stock-badge ${product.stock < 10 ? 'low' : 'good'}`}>
                        {product.stock} left
                      </span>
                    </div>

                    <div className="card-footer">
                      <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="action-buttons">
                        <Link 
                          to={`/products/edit/${productId}`} 
                          className="btn-icon edit"
                          title="Edit Outfit Details"
                        >
                          <FiEdit />
                        </Link>
                        <button 
                          className="btn-icon delete" 
                          onClick={() => handleDelete(productId)}
                          title="Remove Outfit"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state animate-fade-in">
            <FiGrid size={48} />
            <h3>No Creations Found</h3>
            <p>Begin typing to filter or add your brand's next signature luxury stitched product.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;