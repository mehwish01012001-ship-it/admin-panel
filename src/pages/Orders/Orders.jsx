import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { FiSearch, FiEye, FiShoppingCart, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import './Orders.css';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded'];

export default function Orders() {
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [expandedItemId, setExpandedItemId] = useState(null);

  // Load orders efficiently on mount
  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await orderService.getAllOrders({ limit: 100 });
        if (!isMounted) return;

        const fetchedOrders = response?.data?.orders || [];
        setOrders(fetchedOrders);

        // Auto-select trigger order if navigation passed an orderId in location state
        const triggeredOrderId = location?.state?.orderId;
        if (triggeredOrderId) {
          const matched = fetchedOrders.find(
            (o) => (o._id || o.id) === triggeredOrderId
          );
          if (matched) setSelectedOrder(matched);
        }
      } catch (err) {
        if (isMounted) setError('Unable to load orders. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [location?.state?.orderId]);

  // Handle status update with optimistic UI update
  const handleStatusChange = useCallback(async (orderId, field, nextStatus) => {
    if (!orderId || !nextStatus) return;

    setUpdatingOrderId(orderId);

    // Backup current state for rollback on error
    const previousOrders = [...orders];

    // Optimistic state update
    setOrders((prevOrders) =>
      prevOrders.map((order) => {
        const currentId = order._id || order.id;
        return currentId === orderId ? { ...order, [field]: nextStatus } : order;
      })
    );

    if (selectedOrder && (selectedOrder._id || selectedOrder.id) === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, [field]: nextStatus } : null));
    }

    try {
      await orderService.updateOrderStatus(orderId, { [field]: nextStatus });
    } catch (err) {
      // Revert on API failure
      setOrders(previousOrders);
      setError('Failed to update status. Reverted changes.');
    } finally {
      setUpdatingOrderId(null);
    }
  }, [orders, selectedOrder]);

  // Format dynamic image URLs safely
  const getImageUrl = useCallback((value) => {
    if (!value) return '/placeholder.png';
    if (Array.isArray(value)) return getImageUrl(value[0]);
    if (typeof value === 'object') return getImageUrl(value.url || value.path || value.src || '');

    const str = String(value);
    if (str.startsWith('http://') || str.startsWith('https://')) return str;

    const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
    return `${baseUrl}/${str.replace(/^\/+/, '')}`;
  }, []);

  // Format full shipping address
  const formatAddress = useCallback((address) => {
    if (!address) return 'Not provided';
    const { fullName, addressLine1, addressLine2, city, state, zipCode, country } = address;
    return [fullName, addressLine1, addressLine2, city, state, zipCode, country]
      .filter(Boolean)
      .join(', ');
  }, []);

  // Memoized client-side search & filtering to prevent recalculation lag
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const orderId = (order._id || order.id || '').toLowerCase();
      const orderNum = (order.orderNumber || '').toLowerCase();
      const customerName = `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.toLowerCase();

      const matchesSearch = !query || orderId.includes(query) || orderNum.includes(query) || customerName.includes(query);
      const matchesStatus = selectedStatus === 'all' || (order.orderStatus || '').toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, selectedStatus]);

  // Derived dashboard analytics totals
  const totals = useMemo(() => {
    return filteredOrders.reduce(
      (acc, order) => {
        const itemQuantity = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        acc.items += itemQuantity;
        acc.amount += Number(order.totalAmount || 0);
        return acc;
      },
      { items: 0, amount: 0 }
    );
  }, [filteredOrders]);

  return (
    <div className="orders-wrapper">
      {/* Header & Metrics */}
      <header className="orders-header">
        <div className="header-title-group">
          <h1 className="page-title">Orders Dashboard</h1>
          <p className="page-subtitle">{orders.length} total operational entries</p>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <span className="metric-value">{filteredOrders.length}</span>
            <span className="metric-label">Filtered</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">{totals.items}</span>
            <span className="metric-label">Total Items</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">Rs. {totals.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            <span className="metric-label">Total Volume</span>
          </div>
        </div>
      </header>

      {/* Control Bar: Search & Status Tabs */}
      <section className="filter-bar">
        <div className="search-input-wrapper">
          <FiSearch className="search-icon" size={18} />
          <input
            type="search"
            placeholder="Search order ID or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <nav className="status-tabs" aria-label="Order status filter">
          {['all', ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`tab-btn ${selectedStatus === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </nav>
      </section>

      {/* Orders Data List / Table */}
      <main className="orders-content">
        {loading ? (
          <div className="feedback-state">
            <div className="spinner" />
            <p>Loading dashboard orders...</p>
          </div>
        ) : error ? (
          <div className="feedback-state error-state">
            <p>{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="feedback-state">
            <FiShoppingCart size={36} className="empty-icon" />
            <p>No orders matched your current filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="col-hide-mobile">Date</th>
                  <th className="col-hide-tablet">Payment</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const id = order._id || order.id;
                  const customerName = order.user
                    ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()
                    : 'Guest User';

                  return (
                    <tr key={id}>
                      <td className="font-medium">
                        <div>{order.orderNumber || id}</div>
                        <div className="sub-text">#{id?.slice(-6)}</div>
                      </td>
                      <td>
                        <div className="font-medium">{customerName}</div>
                        <div className="sub-text">{order.user?.email || 'No email provided'}</div>
                      </td>
                      <td className="col-hide-mobile sub-text">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="col-hide-tablet">
                        <span className={`badge badge-${order.paymentStatus?.toLowerCase() || 'pending'}`}>
                          {order.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${order.orderStatus?.toLowerCase() || 'pending'}`}>
                          {order.orderStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="text-right font-bold">
                        Rs. {Number(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => setSelectedOrder(order)}
                          title="View Order Details"
                        >
                          <FiEye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal Detail View */}
      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h2>Order Details</h2>
                <span className="sub-text">
                  ID: {selectedOrder.orderNumber || (selectedOrder._id || selectedOrder.id)}
                </span>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setSelectedOrder(null)}
                aria-label="Close modal"
              >
                <FiX size={20} />
              </button>
            </header>

            <div className="modal-body">
              {/* Quick Status Controls */}
              <div className="detail-panel highlight-panel">
                <h3>Update Order Status</h3>
                <div className="select-group">
                  <div className="field-stack">
                    <label htmlFor="order-status-select">Order Status</label>
                    <select
                      id="order-status-select"
                      value={selectedOrder.orderStatus || 'pending'}
                      disabled={updatingOrderId === (selectedOrder._id || selectedOrder.id)}
                      onChange={(e) =>
                        handleStatusChange(selectedOrder._id || selectedOrder.id, 'orderStatus', e.target.value)
                      }
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field-stack">
                    <label htmlFor="payment-status-select">Payment Status</label>
                    <select
                      id="payment-status-select"
                      value={selectedOrder.paymentStatus || 'pending'}
                      disabled={updatingOrderId === (selectedOrder._id || selectedOrder.id)}
                      onChange={(e) =>
                        handleStatusChange(selectedOrder._id || selectedOrder.id, 'paymentStatus', e.target.value)
                      }
                    >
                      {PAYMENT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer and Financial Information */}
              <div className="details-grid">
                <div className="detail-panel">
                  <h3>Customer Details</h3>
                  <p><strong>Name:</strong> {selectedOrder.user ? `${selectedOrder.user.firstName || ''} ${selectedOrder.user.lastName || ''}`.trim() : 'Guest'}</p>
                  <p><strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedOrder.shippingAddress?.phone || 'Not provided'}</p>
                  <p><strong>Shipping:</strong> {formatAddress(selectedOrder.shippingAddress)}</p>
                </div>

                <div className="detail-panel">
                  <h3>Financial Details</h3>
                  <p><strong>Method:</strong> {selectedOrder.paymentMethod || 'Not provided'}</p>
                  <p><strong>Account:</strong> {selectedOrder.paymentNumber || 'N/A'}</p>
                  <p><strong>Total Amount:</strong> Rs. {Number(selectedOrder.totalAmount || 0).toFixed(2)}</p>
                  <p><strong>Order Date:</strong> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}</p>
                </div>

                <div className="detail-panel">
                  <h3>Admin Notes</h3>
                  <div className="notes-box">
                    {selectedOrder.notes || 'No operational notes attached to this order.'}
                  </div>
                </div>
              </div>

              {/* Purchased Items List */}
              <div className="detail-panel">
                <h3>Order Items</h3>
                <div className="items-list">
                  {(selectedOrder.items || []).map((item, index) => {
                    const prod = item.product;
                    const itemKey = `${selectedOrder._id || selectedOrder.id}-${index}`;
                    const isExpanded = expandedItemId === itemKey;

                    return (
                      <div key={itemKey} className="item-card">
                        <div className="item-header">
                          <div className="item-info">
                            <img
                              src={getImageUrl(prod?.images?.[0] || prod?.image)}
                              alt={prod?.name || 'Product'}
                              className="item-thumb"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/60?text=No+Image';
                              }}
                            />
                            <div>
                              <div className="font-medium">{prod?.name || `Item #${index + 1}`}</div>
                              <div className="sub-text">
                                Qty: {item.quantity || 1} | Size: {item.size || 'N/A'} | Color: {item.color || 'N/A'}
                              </div>
                            </div>
                          </div>

                          <div className="item-actions">
                            <span className="font-bold">Rs. {Number(item.price || 0).toFixed(2)}</span>
                            <button
                              type="button"
                              className="icon-btn"
                              onClick={() => setExpandedItemId(isExpanded ? null : itemKey)}
                            >
                              {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="item-drawer">
                            <div className="drawer-grid">
                              {prod?.sku && <p><strong>SKU:</strong> {prod.sku}</p>}
                              {prod?.brand && <p><strong>Brand:</strong> {prod.brand}</p>}
                              {prod?.category && <p><strong>Category:</strong> {prod.category}</p>}
                              {typeof prod?.stock === 'number' && <p><strong>In Stock:</strong> {prod.stock} units</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Proof Preview if present */}
              {(selectedOrder.paymentReceipt || selectedOrder.paymentProof) && (
                <div className="detail-panel">
                  <h3>Payment Receipt</h3>
                  <div className="receipt-preview">
                    <img
                      src={getImageUrl(selectedOrder.paymentReceipt || selectedOrder.paymentProof)}
                      alt="Payment Receipt Attachment"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}