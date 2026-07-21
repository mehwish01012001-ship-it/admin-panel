import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, FiChevronLeft, FiChevronRight, 
  FiCopy, FiCheck, FiDownload, FiBox, 
  FiAlertTriangle, FiShield, FiPieChart, FiGrid 
} from 'react-icons/fi';
import { productService } from '../../services/productService';
import { getAbsoluteUrl } from '../../services/api';
import './Inventory.css';

const DEFAULT_LOW_STOCK_THRESHOLD = 10;
const PAGE_SIZE_OPTIONS = [8, 12, 24];

const getProductImageUrl = (product) => {
  const candidates = [
    product?.image,
    product?.productImage,
    product?.thumbnail,
    product?.coverImage,
    product?.featuredImage,
    product?.images?.[0],
    product?.images?.[0]?.url,
    product?.images?.[0]?.src,
    product?.images?.[0]?.path,
    product?.images?.[0]?.image,
    product?.media?.[0],
    product?.media?.[0]?.url,
    product?.media?.[0]?.src,
    product?.media?.[0]?.path,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return getAbsoluteUrl(candidate);
    }

    if (candidate && typeof candidate === 'object') {
      const nestedUrl = candidate.url || candidate.src || candidate.path || candidate.image;
      if (typeof nestedUrl === 'string' && nestedUrl.trim()) {
        return getAbsoluteUrl(nestedUrl);
      }
    }
  }

  return '';
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState('all');
  const [sortBy, setSortBy] = useState('stockDesc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [copiedId, setCopiedId] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Sync inventory data from backend api service
  useEffect(() => {
    let isMounted = true;

    const fetchInventory = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await productService.getAllProducts({ limit: 250 });
        
        // Extract multi-tier data wrappers safely from dynamic responses
        const products = Array.isArray(response?.data?.products)
          ? response.data.products
          : Array.isArray(response?.data?.data?.products)
            ? response.data.data.products
            : Array.isArray(response?.data)
              ? response.data
              : [];

        if (isMounted) {
          setItems(products);
        }
      } catch (err) {
        console.error('Inventory Fetch Failure:', err);
        if (isMounted) {
          setError('Unable to synchronize inventory live logs. Verify backend connectivity.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInventory();
    return () => { isMounted = false; };
  }, []);

  // Compute live analytical indicators based on backend results
  const analytics = useMemo(() => {
    let totalStock = 0;
    let lowStockItems = 0;

    items.forEach((product) => {
      const stock = Number(product.stock || 0);
      const threshold = Number(product.lowStockThreshold || DEFAULT_LOW_STOCK_THRESHOLD);
      totalStock += stock;
      if (stock <= threshold) lowStockItems++;
    });

    return {
      totalStock,
      totalProducts: items.length,
      lowStockItems,
      healthyItems: Math.max(0, items.length - lowStockItems),
    };
  }, [items]);

  // Handle client-side live search querying, segment partitions, and explicit sorts
  const filteredProducts = useMemo(() => {
    const searchTerm = query.trim().toLowerCase();
    let result = [...items];

    if (searchTerm) {
      result = result.filter((product) => {
        const payload = `${product.name || ''} ${product.title || ''} ${product.sku || ''} ${product.category?.name || ''}`.toLowerCase();
        return payload.includes(searchTerm);
      });
    }

    if (activeSegment === 'alerts') {
      result = result.filter((p) => Number(p.stock || 0) <= Number(p.lowStockThreshold || DEFAULT_LOW_STOCK_THRESHOLD));
    } else if (activeSegment === 'healthy') {
      result = result.filter((p) => Number(p.stock || 0) > Number(p.lowStockThreshold || DEFAULT_LOW_STOCK_THRESHOLD));
    }

    if (sortBy === 'stockAsc') {
      result.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
    } else if (sortBy === 'stockDesc') {
      result.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => (a.name || a.title || '').localeCompare(b.name || b.title || ''));
    }

    return result;
  }, [items, query, activeSegment, sortBy]);

  const maxPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  // Reset page layout frame if index out of bounds
  useEffect(() => {
    if (page > maxPages) setPage(1);
  }, [page, maxPages]);

  const pagedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page, pageSize]);

  const handleCopySKU = useCallback((sku, id) => {
    if (!sku) return;
    navigator.clipboard?.writeText(sku);
    setCopiedId(id);
    const nativeTimer = setTimeout(() => setCopiedId(null), 2000);
    return () => clearTimeout(nativeTimer);
  }, []);

  const handleExportCSV = useCallback(() => {
    if (filteredProducts.length === 0) return;
    setExporting(true);

    const headers = ['SKU', 'Name/Title', 'Current Stock', 'Stock Limit Threshold', 'Price', 'Category'];
    const rows = filteredProducts.map((p) => [
      `"${p.sku || 'N/A'}"`,
      `"${(p.name || p.title || 'Untitled').replace(/"/g, '""')}"`,
      Number(p.stock || 0),
      Number(p.lowStockThreshold || DEFAULT_LOW_STOCK_THRESHOLD),
      Number(p.price || 0),
      `"${p.category?.name || 'General'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);
    
    const virtualLink = document.createElement('a');
    virtualLink.href = blobUrl;
    virtualLink.download = `inventory_log_${new Date().toISOString().split('T')[0]}.csv`;
    virtualLink.click();
    
    URL.revokeObjectURL(blobUrl);
    const resetTimer = setTimeout(() => setExporting(false), 600);
    return () => clearTimeout(resetTimer);
  }, [filteredProducts]);

  return (
    <section className="inventory-dashboard-shell">
      {/* Structural Header block */}
      <header className="dashboard-hero-header">
        <div className="hero-headline-block">
          <h1>Inventory Engine</h1>
          <p className="hero-subtitle">Real-time analytical operational hub syncing streaming backend channel architecture logs.</p>
        </div>
      </header>

      {/* Metrics Counter Stripe */}
      <section className="analytics-overview-stripe" aria-label="System Metrics Summary">
        <div className="metric-node-card accent-gold">
          <div className="card-inner-flex">
            <span className="metric-label">Total Allocated Units</span>
            <div className="metric-value">{loading ? '—' : analytics.totalStock.toLocaleString()}</div>
            <p className="metric-caption">Aggregate balance inside distribution networks.</p>
          </div>
          <FiBox className="metric-background-icon" />
        </div>

        <div className="metric-node-card">
          <div className="card-inner-flex">
            <span className="metric-label">Tracked Profiles</span>
            <div className="metric-value">{loading ? '—' : analytics.totalProducts}</div>
            <p className="metric-caption">Distinct catalog profiles verified offline or live.</p>
          </div>
          <FiGrid className="metric-background-icon" />
        </div>

        <div className="metric-node-card accent-alert">
          <div className="card-inner-flex">
            <span className="metric-label">Critical Shortages</span>
            <div className={`metric-value ${analytics.lowStockItems > 0 ? 'critical-text' : ''}`}>
              {loading ? '—' : analytics.lowStockItems}
            </div>
            <p className="metric-caption">Lines requiring instant reconciliation workflows.</p>
          </div>
          <FiAlertTriangle className="metric-background-icon" />
        </div>

        <div className="metric-node-card accent-secure">
          <div className="card-inner-flex">
            <span className="metric-label">Secured Channels</span>
            <div className="metric-value">{loading ? '—' : analytics.healthyItems}</div>
            <p className="metric-caption">Optimal distributions meeting threshold limits.</p>
          </div>
          <FiShield className="metric-background-icon" />
        </div>
      </section>

      {/* Controller & Filtering Command Board */}
      <section className="control-center-panel" aria-label="Filter Controls Workspace">
        <div className="control-primary-row">
          <div className="search-input-wrapper">
            <FiSearch className="search-prefix-icon" />
            <input
              type="text"
              placeholder="Search via profile identity, catalog category or dynamic SKU code..."
              value={query}
              aria-label="Search items"
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="control-secondary-row">
          <div className="segmented-navigation-tabs" role="tablist">
            <button 
              role="tab"
              aria-selected={activeSegment === 'all'}
              className={`segment-tab-item ${activeSegment === 'all' ? 'is-active' : ''}`} 
              onClick={() => { setActiveSegment('all'); setPage(1); }}
            >
              All Data Logs <span className="tab-pill-count">{items.length}</span>
            </button>
            <button 
              role="tab"
              aria-selected={activeSegment === 'alerts'}
              className={`segment-tab-item ${activeSegment === 'alerts' ? 'is-active' : ''}`} 
              onClick={() => { setActiveSegment('alerts'); setPage(1); }}
            >
              Shortage Alerts <span className="tab-pill-count status-alert">{analytics.lowStockItems}</span>
            </button>
            <button 
              role="tab"
              aria-selected={activeSegment === 'healthy'}
              className={`segment-tab-item ${activeSegment === 'healthy' ? 'is-active' : ''}`} 
              onClick={() => { setActiveSegment('healthy'); setPage(1); }}
            >
              Stable Rows <span className="tab-pill-count status-secure">{analytics.healthyItems}</span>
            </button>
          </div>

          <div className="control-interactive-actions">
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} aria-label="Sort product ordering">
              <option value="stockDesc">Stock Volume: High to Low</option>
              <option value="stockAsc">Stock Volume: Low to High</option>
              <option value="name">Alphanumeric Labeling</option>
            </select>

            <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} aria-label="Items per grid view page">
              {PAGE_SIZE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt} entries per viewport</option>
              ))}
            </select>

            <button 
              className="action-utility-button" 
              onClick={handleExportCSV} 
              disabled={exporting || filteredProducts.length === 0} 
              title="Export Current Manifest Data to CSV File format"
              aria-label="Export manifest table"
            >
              <FiDownload />
            </button>
          </div>
        </div>
      </section>

      {/* Main Dynamic Viewport Grid */}
      <main className="inventory-viewport-body">
        {loading ? (
          <div className="shimmer-placeholder-grid" aria-hidden="true">
            {Array.from({ length: pageSize }).map((_, idx) => (
              <div key={idx} className="shimmer-skeleton-card" />
            ))}
          </div>
        ) : error ? (
          <div className="system-feedback-panel alert-theme" role="alert">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="system-feedback-panel complete-empty-theme">
            <FiPieChart size={32} />
            <p>No inventory entities verified through the specified parameters.</p>
          </div>
        ) : (
          <motion.div className="inventory-allocation-grid" layout>
            <AnimatePresence mode="popLayout">
              {pagedProducts.map((product, index) => {
                const stock = Number(product.stock || 0);
                const threshold = Number(product.lowStockThreshold || DEFAULT_LOW_STOCK_THRESHOLD);
                const isLowStock = stock <= threshold;
                
                // Algorithmic calculation for scalable percentage progress fill visualization
                const maxBarRange = Math.max(threshold * 3.5, 80);
                const progressPercentage = Math.min(100, Math.round((stock / maxBarRange) * 100));
                const uniqueKey = product._id || product.id || `${product.sku || 'item'}-${index}`;
                const productImageUrl = getProductImageUrl(product);

                return (
                  <motion.article
                    key={uniqueKey}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={`product-display-card ${isLowStock ? 'has-critical-alert' : ''}`}
                  >
                    <div className="card-preview-media-frame">
                      {productImageUrl ? (
                        <img src={productImageUrl} alt={product.name || product.title || 'Product Asset'} loading="lazy" />
                      ) : (
                        <div className="fallback-media-icon-box"><FiBox /></div>
                      )}
                    </div>

                    <div className="card-data-structural-wrapper">
                      <div className="card-identity-header-group">
                        <span className="sku-badge-code">{product.sku || 'UNASSIGNED-SKU'}</span>
                        <h2 className="product-title-heading" title={product.name || product.title}>
                          {product.name || product.title || 'Generic Product Item'}
                        </h2>
                      </div>

                      <div className="card-taxonomy-row">
                        <span className="taxonomy-pill"><FiShield className="inline-icon" /> {product.category?.name || 'General Stock'}</span>
                        <span className="taxonomy-pill financial-weight">{formatCurrency(product.price || 0)}</span>
                      </div>

                      <div className="card-volume-barometer-block">
                        <div className="barometer-labels-row">
                          <div className="barometer-volume-indicator">
                            <span className="volume-number">{stock}</span>
                            <span className="volume-label">units</span>
                          </div>
                          <span className="barometer-alert-limit-flag">Min limit: {threshold}</span>
                        </div>
                        <div className="barometer-progress-rail" aria-hidden="true">
                          <div 
                            className="barometer-progress-fill" 
                            style={{ 
                              width: `${Math.max(6, progressPercentage)}%`,
                              background: isLowStock 
                                ? 'var(--alert-crimson-solid)' 
                                : 'linear-gradient(90deg, var(--gold-metallic) 0%, var(--secure-mint-solid) 100%)'
                            }} 
                          />
                        </div>
                      </div>

                      <div className="card-footer-action-row">
                        <span className={`status-marker-pill ${isLowStock ? 'is-alert-state' : 'is-secure-state'}`}>
                          {isLowStock ? 'Replenish Required' : 'Asset Balanced'}
                        </span>
                        <button 
                          className="action-utility-button variant-small" 
                          onClick={() => handleCopySKU(product.sku, uniqueKey)} 
                          title="Copy product SKU to clipboard"
                          aria-label="Copy SKU"
                        >
                          {copiedId === uniqueKey ? <FiCheck className="success-checkmark-color" /> : <FiCopy />}
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Structural Data Viewport Footer controls */}
      <footer className="dashboard-pagination-footer">
        <div className="pagination-interaction-block">
          <button 
            disabled={page <= 1} 
            onClick={() => setPage(prev => Math.max(1, prev - 1))} 
            aria-label="Navigate to previous page"
          >
            <FiChevronLeft />
          </button>
          <span className="pagination-view-label">Page <strong>{page}</strong> of {maxPages}</span>
          <button 
            disabled={page >= maxPages} 
            onClick={() => setPage(prev => Math.min(maxPages, prev + 1))} 
            aria-label="Navigate to next page"
          >
            <FiChevronRight />
          </button>
        </div>

        <div className="summary-sync-meta-string">
          Showing {filteredProducts.length} filtered items • {items.length} synchronized streaming data lines.
        </div>
      </footer>
    </section>
  );
}