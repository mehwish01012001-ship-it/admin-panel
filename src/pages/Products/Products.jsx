// import React, { useEffect, useMemo, useState } from 'react';
// import { Helmet } from 'react-helmet-async';
// import {
//   FiEdit,
//   FiTrash2,
//   FiPlus,
//   FiSearch,
//   FiEye,
//   FiRefreshCw,
//   FiGrid,
//   FiPackage,
//   FiDollarSign,
//   FiCheckCircle,
//   FiAlertCircle
// } from 'react-icons/fi';
// import { Link } from 'react-router-dom';
// import { productService } from '../../services/productService';
// import { getAbsoluteUrl } from '../../services/api';
// import './Products.css';

// const Products = () => {
//   const PLACEHOLDER_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23fcfbfa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23c2b19e" font-size="18" font-family="Playfair Display, serif">No Image Available</text></svg>';
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const [search, setSearch] = useState('');
//   const [statusFilter, setStatusFilter] = useState('all');

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   const fetchProducts = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await productService.getAllProducts({ limit: 100, includeInactive: true });
//       setProducts(response?.data?.products || []);
//     } catch (err) {
//       console.error(err);
//       setError('Unable to retrieve luxury collection records.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDelete = async (productId) => {
//     const confirmDelete = window.confirm(
//       'Are you certain you want to remove this exquisite design from your catalogue?'
//     );
//     if (!confirmDelete) return;

//     try {
//       setLoading(true);
//       await productService.deleteProduct(productId);
//       setProducts((prev) =>
//         prev.filter((product) => (product._id || product.id) !== productId)
//       );
//     } catch (err) {
//       console.error(err);
//       alert('Failed to delete product from the catalog.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const filteredProducts = useMemo(() => {
//     return products.filter((product) => {
//       const matchesSearch =
//         product?.name?.toLowerCase().includes(search.toLowerCase()) ||
//         product?.category?.name?.toLowerCase().includes(search.toLowerCase()) ||
//         product?.sku?.toLowerCase().includes(search.toLowerCase());

//       const matchesStatus =
//         statusFilter === 'all'
//           ? true
//           : statusFilter === 'active'
//           ? product.isActive
//           : statusFilter === 'inactive'
//           ? !product.isActive
//           : statusFilter === 'low-stock'
//           ? Number(product.stock) < 10
//           : true;

//       return matchesSearch && matchesStatus;
//     });
//   }, [products, search, statusFilter]);

//   const stats = useMemo(() => {
//     const totalProducts = products.length;
//     const activeProducts = products.filter((item) => item.isActive).length;
//     const lowStockProducts = products.filter((item) => item.stock < 10).length;
//     const totalValue = products.reduce(
//       (sum, item) => sum + (Number(item.price) || 0) * (Number(item.stock) || 0),
//       0
//     );

//     return {
//       totalProducts,
//       activeProducts,
//       lowStockProducts,
//       totalValue
//     };
//   }, [products]);

//   return (
//     <div className="products-page">
//       <Helmet>
//         <title>Manage Luxury Women's Stitched Outfits | Couture Admin</title>
//         <meta name="description" content="Seamlessly manage premium women's stitched collections, traditional formal attire, hand-embroidered ensembles, and boutique luxury stocks." />
//         <meta name="keywords" content="stitched luxury clothing, women premium pret, designer inventory dashboard, boutique designer management" />
//         <link rel="canonical" href={window.location.href} />
//       </Helmet>

//       <div className="products-header-card animate-fade-in">
//         <div className="header-text-group">
    
//           <h1>Collection</h1>
//           <p>Analyze, and refine your premium apparel assets dynamically.</p>
//         </div>

//         <Link to="/products/create" className="btn-primary">
//           <FiPlus /> Add Design
//         </Link>
//       </div>

//       <div className="stats-grid">
//         <div className="stat-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
//           <div className="stat-icon beige">
//             <FiPackage />
//           </div>
//           <div>
//             <h3>{stats.totalProducts}</h3>
//             <p>Total Designs</p>
//           </div>
//         </div>

//         <div className="stat-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
//           <div className="stat-icon olive">
//             <FiCheckCircle />
//           </div>
//           <div>
//             <h3>{stats.activeProducts}</h3>
//             <p>On Display</p>
//           </div>
//         </div>

//         <div
//           className={`stat-card animate-slide-up ${statusFilter === 'low-stock' ? 'active' : ''}`}
//           style={{ animationDelay: '0.3s', cursor: 'pointer' }}
//           onClick={() => setStatusFilter((prev) => (prev === 'low-stock' ? 'all' : 'low-stock'))}
//         >
//           <div className="stat-icon terracotta">
//             <FiAlertCircle />
//           </div>
//           <div>
//             <h3>{stats.lowStockProducts}</h3>
//             <p>Low Stock</p>
//           </div>
//         </div>

//           <div className="stat-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
//           <div className="stat-icon champagne">
//             <FiDollarSign />
//           </div>
//           <div>
//             <h3>Rs. {stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
//             <p>Valuation</p>
//           </div>
//         </div>
//       </div>

//       <div className="toolbar animate-fade-in">
//         <div className="search-box">
//           <FiSearch />
//           <input
//             type="text"
//             placeholder="Search by name, SKU, or category..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         <div className="toolbar-actions">
//           <div className="status-toggle-group" role="group" aria-label="Filter products by status">
//             <button
//               type="button"
//               className={`status-toggle-btn ${statusFilter === 'all' ? 'active' : ''}`}
//               onClick={() => setStatusFilter('all')}
//             >
//               All
//             </button>
//             <button
//               type="button"
//               className={`status-toggle-btn ${statusFilter === 'active' ? 'active' : ''}`}
//               onClick={() => setStatusFilter('active')}
//             >
//               Active
//             </button>
//             <button
//               type="button"
//               className={`status-toggle-btn ${statusFilter === 'inactive' ? 'active' : ''}`}
//               onClick={() => setStatusFilter('inactive')}
//             >
//               Inactive
//             </button>
//           </div>

//           <button
//             className="refresh-btn"
//             onClick={fetchProducts}
//             title="Reload Inventory"
//             aria-label="Reload Inventory"
//           >
//             <FiRefreshCw />
//           </button>
//         </div>
//       </div>

//       <div className="products-table-container">
//         {loading ? (
//           <div className="loading-state">
//             <div className="lux-spinner"></div>
//             <p>Curating boutique collection...</p>
//           </div>
//         ) : error ? (
//           <div className="error-state">
//             <FiAlertCircle size={36} />
//             <p>{error}</p>
//           </div>
//         ) : filteredProducts.length > 0 ? (
//           <div className="products-grid">
//             {filteredProducts.map((product, index) => {
//               const productId = product._id || product.id;
//               const rawImage = product.images?.[0]?.url || product.images?.[0] || null;
//               const image = getAbsoluteUrl(rawImage || PLACEHOLDER_IMAGE);

//               return (
//                 <div 
//                   className="product-card animate-fade-in-up" 
//                   key={productId}
//                   style={{ animationDelay: `${(index % 8) * 0.05}s` }}
//                   onClick={() => window.location.assign(`/products/${productId}`)}
//                   role="button"
//                   tabIndex={0}
//                   onKeyDown={(event) => {
//                     if (event.key === 'Enter' || event.key === ' ') {
//                       event.preventDefault();
//                       window.location.assign(`/products/${productId}`);
//                     }
//                   }}
//                 >
//                   <div className="card-media">
//                     <img
//                       src={image}
//                       alt={product.name}
//                       loading="lazy"
//                       onError={(e) => {
//                         e.currentTarget.onerror = null;
//                         e.currentTarget.src = PLACEHOLDER_IMAGE;
//                       }}
//                     />
//                     <div className="luxury-overlay">
//                       <span className="sku-overlay">SKU: {product.sku || 'N/A'}</span>
//                     </div>
//                   </div>
//                   <div className="card-body">
//                     <div className="card-content">
//                       <span className="category-label">
//                         {product.category?.name || product.category || 'Uncategorized'}
//                       </span>
//                       <h4>{product.name}</h4>
//                     </div>
                    
//                     <div className="card-meta-row">
//                       <span className="price">Rs. {Number(product.price || 0).toFixed(2)}</span>
//                       <span className={`stock-badge ${product.stock < 10 ? 'low' : 'good'}`}>
//                         {product.stock} left
//                       </span>
//                     </div>

//                     <div className="card-footer">
//                       <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
//                         {product.isActive ? 'Active' : 'Inactive'}
//                       </span>
//                       <div className="action-buttons">
//                         <Link 
//                           to={`/products/${productId}`} 
//                           className="btn-icon edit"
//                           title="View Outfit Details"
//                         >
//                           <FiEye />
//                         </Link>
//                         <Link 
//                           to={`/products/edit/${productId}`} 
//                           className="btn-icon edit"
//                           title="Edit Outfit Details"
//                         >
//                           <FiEdit />
//                         </Link>
//                         <button 
//                           className="btn-icon delete" 
//                           onClick={() => handleDelete(productId)}
//                           title="Remove Outfit"
//                         >
//                           <FiTrash2 />
//                         </button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         ) : (
//           <div className="empty-state animate-fade-in">
//             <FiGrid size={48} />
//             <h3>No Creations Found</h3>
//             <p>Begin typing to filter or add your brand's next signature luxury stitched product.</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Products;























import React, { useMemo, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiEye,
  FiRefreshCw,
  FiGrid,
  FiPackage,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../services/productService';
import { getAbsoluteUrl } from '../../services/api';
import './Products.css';

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%23fcfbfa"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23c2b19e" font-size="18" font-family="Playfair Display, serif">No Image Available</text></svg>';

/**
 * Cloudinary CDN Image Transformation helper
 * Cloudinary URLs mein auto-format, auto-quality, aur auto-resizing add karta hai
 */
const getOptimizedImageUrl = (url, width = 500) => {
  if (!url || typeof url !== 'string') return PLACEHOLDER_IMAGE;
  const absoluteUrl = getAbsoluteUrl(url);

  // Agar image Cloudinary CDN ki hai, to load time 80% kam karne ke liye automatic transformations apply karein
  if (absoluteUrl.includes('cloudinary.com') && absoluteUrl.includes('/upload/')) {
    return absoluteUrl.replace(
      '/upload/',
      `/upload/w_${width},f_auto,q_auto,c_fill,dpr_auto/`
    );
  }

  return absoluteUrl;
};

// Skeleton Loader Component
const ProductsSkeleton = () => (
  <div className="products-grid">
    {Array.from({ length: 8 }).map((_, index) => (
      <div className="product-card skeleton-card" key={index}>
        <div className="skeleton-media skeleton-pulse" />
        <div className="card-body">
          <div className="skeleton-line category skeleton-pulse" />
          <div className="skeleton-line title skeleton-pulse" />
          <div className="card-meta-row">
            <div className="skeleton-line price skeleton-pulse" />
            <div className="skeleton-line badge skeleton-pulse" />
          </div>
          <div className="card-footer">
            <div className="skeleton-line status skeleton-pulse" />
            <div className="skeleton-line actions skeleton-pulse" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const Products = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // React Query for Data Fetching & Caching
  const {
    data: products = [],
    isLoading,
    isFetching,
    error,
    refetch
  } = useQuery({
    queryKey: ['products', 'all-inactive'],
    queryFn: async () => {
      const response = await productService.getAllProducts({
        limit: 100,
        includeInactive: true
      });
      return response?.data?.products || [];
    },
    staleTime: 5 * 60 * 1000, // 5 mints tak cache response valid rahega
    cacheTime: 30 * 60 * 1000, // 30 mints tak memory/browser browser memory mein hold karega
    refetchOnWindowFocus: false
  });

  // React Query Mutation for Delete Operation
  const deleteMutation = useMutation({
    mutationFn: (productId) => productService.deleteProduct(productId),
    onSuccess: (_, productId) => {
      // Optimistic UI updates - Update local cache immediately without re-fetching
      queryClient.setQueryData(['products', 'all-inactive'], (oldProducts) =>
        oldProducts ? oldProducts.filter((p) => (p._id || p.id) !== productId) : []
      );
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to delete product from the catalog.');
    }
  });

  const handleDelete = useCallback(
    (e, productId) => {
      e.stopPropagation(); // Card Click event trigger na ho
      const confirmDelete = window.confirm(
        'Are you certain you want to remove this exquisite design from your catalogue?'
      );
      if (!confirmDelete) return;

      deleteMutation.mutate(productId);
    },
    [deleteMutation]
  );

  const filteredProducts = useMemo(() => {
    const searchLower = search.toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !searchLower ||
        product?.name?.toLowerCase().includes(searchLower) ||
        product?.category?.name?.toLowerCase().includes(searchLower) ||
        product?.sku?.toLowerCase().includes(searchLower);

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
    let totalProducts = products.length;
    let activeProducts = 0;
    let lowStockProducts = 0;
    let totalValue = 0;

    for (let i = 0; i < totalProducts; i++) {
      const item = products[i];
      if (item.isActive) activeProducts++;
      if (Number(item.stock) < 10) lowStockProducts++;
      totalValue += (Number(item.price) || 0) * (Number(item.stock) || 0);
    }

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
        <meta
          name="description"
          content="Seamlessly manage premium women's stitched collections, traditional formal attire, hand-embroidered ensembles, and boutique luxury stocks."
        />
        <meta
          name="keywords"
          content="stitched luxury clothing, women premium pret, designer inventory dashboard, boutique designer management"
        />
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
          className={`stat-card animate-slide-up ${
            statusFilter === 'low-stock' ? 'active' : ''
          }`}
          style={{ animationDelay: '0.3s', cursor: 'pointer' }}
          onClick={() =>
            setStatusFilter((prev) => (prev === 'low-stock' ? 'all' : 'low-stock'))
          }
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
            <h3>
              Rs.{' '}
              {stats.totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </h3>
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
          <div
            className="status-toggle-group"
            role="group"
            aria-label="Filter products by status"
          >
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
            className={`refresh-btn ${isFetching ? 'spin' : ''}`}
            onClick={() => refetch()}
            title="Reload Inventory"
            aria-label="Reload Inventory"
          >
            <FiRefreshCw />
          </button>
        </div>
      </div>

      <div className="products-table-container">
        {isLoading ? (
          <ProductsSkeleton />
        ) : error ? (
          <div className="error-state">
            <FiAlertCircle size={36} />
            <p>Unable to retrieve luxury collection records.</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="products-grid">
            {filteredProducts.map((product, index) => {
              const productId = product._id || product.id;
              const rawImage = product.images?.[0]?.url || product.images?.[0] || null;
              const imageSrc = getOptimizedImageUrl(rawImage, 500);

              return (
                <div
                  className="product-card animate-fade-in-up"
                  key={productId}
                  style={{ animationDelay: `${(index % 8) * 0.05}s` }}
                  onClick={() => navigate(`/products/${productId}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/products/${productId}`);
                    }
                  }}
                >
                  <div className="card-media">
                    <img
                      src={imageSrc}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
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
                      <span className="price">
                        Rs. {Number(product.price || 0).toFixed(2)}
                      </span>
                      <span
                        className={`stock-badge ${
                          product.stock < 10 ? 'low' : 'good'
                        }`}
                      >
                        {product.stock} left
                      </span>
                    </div>

                    <div className="card-footer">
                      <span
                        className={`status-badge ${
                          product.isActive ? 'active' : 'inactive'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <div className="action-buttons">
                        <Link
                          to={`/products/${productId}`}
                          className="btn-icon edit"
                          title="View Outfit Details"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiEye />
                        </Link>
                        <Link
                          to={`/products/edit/${productId}`}
                          className="btn-icon edit"
                          title="Edit Outfit Details"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FiEdit />
                        </Link>
                        <button
                          className="btn-icon delete"
                          onClick={(e) => handleDelete(e, productId)}
                          title="Remove Outfit"
                          disabled={deleteMutation.isLoading}
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
            <p>
              Begin typing to filter or add your brand's next signature luxury stitched
              product.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;