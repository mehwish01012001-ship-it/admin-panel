import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FiSearch, 
  FiEye, 
  FiShoppingCart, 
  FiX, 
  FiChevronDown, 
  FiChevronUp,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import './Orders.css';
import { orderService } from '../../services/orderService';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded'];

export default function Orders() {
  const location = useLocation();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Modals & Accordions
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [expandedItemId, setExpandedItemId] = useState('');

  // Fetch orders from API
  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.getAllOrders({ limit: 100 });
      const fetchedOrders = response?.data?.orders || [];
      setOrders(fetchedOrders);

      // Auto-select order if navigated from state
      const targetOrderId = location?.state?.orderId;
      if (targetOrderId) {
        const matched = fetchedOrders.find(
          (item) => (item._id || item.id) === targetOrderId
        );
        if (matched) setSelectedOrder(matched);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Orders load karne mein dushwari hui. Baraye meherbani dubara koshish karein.');
    } finally {
      setLoading(false);
    }
  }, [location?.state?.orderId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle status update
  const handleStatusUpdate = async (orderId, statusField, newStatus) => {
    if (!orderId || !newStatus) return;
    setUpdatingOrderId(orderId);

    try {
      await orderService.updateOrderStatus(orderId, { [statusField]: newStatus });

      setOrders((prev) =>
        prev.map((item) =>
          (item._id || item.id) === orderId ? { ...item, [statusField]: newStatus } : item
        )
      );

      if (selectedOrder && (selectedOrder._id || selectedOrder.id) === orderId) {
        setSelectedOrder((prev) => ({ ...prev, [statusField]: newStatus }));
      }
    } catch (err) {
      console.error('Status update error:', err);
      setError('Status update nahi ho saka.');
    } finally {
      setUpdatingOrderId('');
    }
  };

  // Safe image path builder
  const resolveImageUrl = useCallback((val) => {
    if (!val) return '';
    if (Array.isArray(val)) return resolveImageUrl(val[0]);
    if (typeof val === 'object') return resolveImageUrl(val.url || val.path || val.src || '');

    const strVal = String(val);
    if (strVal.startsWith('http://') || strVal.startsWith('https://')) return strVal;

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${apiBase.replace(/\/$/, '')}/${strVal.replace(/^\/+/, '')}`;
  }, []);

  // Address formatter
  const formatShippingAddress = (address) => {
    if (!address) return 'Address missing';
    const parts = [
      address.fullName,
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ];
    return parts.filter(Boolean).join(', ');
  };

  // Filtered dataset (Memoized for instant typing search)
  const filteredOrdersList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const id = (order._id || order.id || '').toLowerCase();
      const orderNum = (order.orderNumber || '').toLowerCase();
      const customerName = `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.toLowerCase();

      const matchesSearch = !query || id.includes(query) || orderNum.includes(query) || customerName.includes(query);
      const matchesStatus = selectedStatus === 'all' || (order.orderStatus || '').toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, selectedStatus]);

  // Total summary calculation
  const summaryMetrics = useMemo(() => {
    return filteredOrdersList.reduce(
      (acc, order) => {
        const itemQty = order.items?.reduce((sum, i) => sum + (i.quantity || 0), 0) || 0;
        acc.totalItems += itemQty;
        acc.totalAmount += Number(order.totalAmount || 0);
        return acc;
      },
      { totalItems: 0, totalAmount: 0 }
    );
  }, [filteredOrdersList]);

  return (
    <div className="orders-page-scope">
      {/* Page Header */}
      <header className="orders-header">
        <div className="orders-title-group">
          <h1>Orders Overview</h1>
          <p>{orders.length} total system entries recorded</p>
        </div>

        <div className="orders-metrics">
          <div className="metric-box">
            <span className="metric-value">{filteredOrdersList.length}</span>
            <span className="metric-label">Filtered</span>
          </div>
          <div className="metric-box">
            <span className="metric-value">{summaryMetrics.totalItems}</span>
            <span className="metric-label">Items</span>
          </div>
          <div className="metric-box accent">
            <span className="metric-value">Rs. {summaryMetrics.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
            <span className="metric-label">Revenue</span>
          </div>
        </div>
      </header>

      {/* Control Panel: Search & Tabs */}
      <div className="orders-controls">
        <div className="search-field">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by order ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <FiX />
            </button>
          )}
        </div>

        <div className="status-tabs-scroll">
          {['all', ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`status-tab-btn ${selectedStatus === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="orders-content-card">
        {loading ? (
          <div className="orders-state-container">
            <div className="orders-spinner" />
            <p>Loading order records...</p>
          </div>
        ) : error ? (
          <div className="orders-state-container error-state">
            <FiAlertCircle size={32} />
            <p>{error}</p>
          </div>
        ) : filteredOrdersList.length === 0 ? (
          <div className="orders-state-container">
            <FiShoppingCart size={36} />
            <p>No orders found matching your search.</p>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th className="hide-mobile">Date</th>
                  <th className="hide-mobile">Payment</th>
                  <th>Status</th>
                  <th className="text-right">Total Amount</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrdersList.map((order) => {
                  const id = order._id || order.id;
                  const cName = order.user
                    ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()
                    : 'Guest Customer';

                  return (
                    <tr key={id}>
                      <td className="order-id-cell">
                        <span className="primary-id">{order.orderNumber || id}</span>
                        <span className="sub-id">#{id?.slice(-6)}</span>
                      </td>

                      <td className="customer-cell">
                        <div className="name">{cName}</div>
                        <div className="email">{order.user?.email || 'N/A'}</div>
                      </td>

                      <td className="hide-mobile date-cell">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                      </td>

                      <td className="hide-mobile">
                        <span className={`status-pill payment-${(order.paymentStatus || 'pending').toLowerCase()}`}>
                          {order.paymentStatus || 'Pending'}
                        </span>
                      </td>

                      <td>
                        <span className={`status-pill order-${(order.orderStatus || 'pending').toLowerCase()}`}>
                          {order.orderStatus || 'Pending'}
                        </span>
                      </td>

                      <td className="text-right amount-cell">
                        Rs. {Number(order.totalAmount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          className="view-btn"
                          onClick={() => setSelectedOrder(order)}
                          title="View Details"
                        >
                          <FiEye />
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

      {/* Details Modal */}
      {selectedOrder && (
        <div className="orders-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="orders-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div>
                <h2>Order Summary</h2>
                <span className="modal-subheading">ID: {selectedOrder.orderNumber || (selectedOrder._id || selectedOrder.id)}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>
                <FiX />
              </button>
            </header>

            <div className="modal-scroll-body">
              {/* Status Controls */}
              <div className="modal-section-card highlight">
                <h3>Management Control</h3>
                <div className="modal-grid-2">
                  <div className="form-group">
                    <label>Order Status</label>
                    <select
                      value={selectedOrder.orderStatus || 'pending'}
                      disabled={updatingOrderId === (selectedOrder._id || selectedOrder.id)}
                      onChange={(e) => handleStatusUpdate(selectedOrder._id || selectedOrder.id, 'orderStatus', e.target.value)}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Payment Status</label>
                    <select
                      value={selectedOrder.paymentStatus || 'pending'}
                      disabled={updatingOrderId === (selectedOrder._id || selectedOrder.id)}
                      onChange={(e) => handleStatusUpdate(selectedOrder._id || selectedOrder.id, 'paymentStatus', e.target.value)}
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

              {/* Information Grid */}
              <div className="modal-grid-3">
                <div className="modal-section-card">
                  <h3>Customer Details</h3>
                  <p><strong>Name:</strong> {selectedOrder.user ? `${selectedOrder.user.firstName || ''} ${selectedOrder.user.lastName || ''}`.trim() : 'Guest'}</p>
                  <p><strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedOrder.shippingAddress?.phone || 'Not Provided'}</p>
                  <p><strong>Address:</strong> {formatShippingAddress(selectedOrder.shippingAddress)}</p>
                </div>

                <div className="modal-section-card">
                  <h3>Financial Summary</h3>
                  <p><strong>Method:</strong> {selectedOrder.paymentMethod || 'COD / Online'}</p>
                  <p><strong>Account #:</strong> {selectedOrder.paymentNumber || 'N/A'}</p>
                  <p><strong>Total Amount:</strong> <span className="price-tag">Rs. {Number(selectedOrder.totalAmount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span></p>
                  <p><strong>Date:</strong> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}</p>
                </div>

                <div className="modal-section-card">
                  <h3>Order Notes</h3>
                  <div className="notes-box">
                    {selectedOrder.notes || 'No customer notes attached to this order.'}
                  </div>
                </div>
              </div>

              {/* Purchased Items List */}
              <div className="modal-section-card">
                <h3>Order Items</h3>
                <div className="items-stack">
                  {(selectedOrder.items || []).map((item, index) => {
                    const prod = item.product;
                    const imgUrl = resolveImageUrl(prod?.images?.[0] || prod?.image || '');
                    const itemKey = `${selectedOrder._id || selectedOrder.id}-${index}`;
                    const isExpanded = expandedItemId === itemKey;

                    return (
                      <div key={itemKey} className="item-row-card">
                        <div className="item-main">
                          <img
                            src={imgUrl}
                            alt={prod?.name || 'Product'}
                            className="item-thumb"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/50?text=Item';
                            }}
                          />
                          <div className="item-info">
                            <span className="item-title">{prod?.name || `Product Line Item #${index + 1}`}</span>
                            <div className="item-meta">
                              <span>Qty: {item.quantity || 1}</span>
                              <span>Size: {item.size || 'N/A'}</span>
                              <span>Color: {item.color || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="item-price-col">
                            <span className="price">Rs. {Number(item.price || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>
                            <button
                              type="button"
                              className="expand-btn"
                              onClick={() => setExpandedItemId(isExpanded ? '' : itemKey)}
                            >
                              {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="item-details-drawer">
                            {prod?.sku && <p><strong>SKU:</strong> {prod.sku}</p>}
                            {prod?.brand && <p><strong>Brand:</strong> {prod.brand}</p>}
                            {prod?.category && <p><strong>Category:</strong> {prod.category}</p>}
                            {typeof prod?.stock === 'number' && <p><strong>Stock Remaining:</strong> {prod.stock}</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Proof Receipt */}
              {(selectedOrder.paymentReceipt || selectedOrder.paymentProof) && (
                <div className="modal-section-card">
                  <h3>Payment Receipt</h3>
                  <div className="receipt-container">
                    <img
                      src={resolveImageUrl(selectedOrder.paymentReceipt || selectedOrder.paymentProof)}
                      alt="Payment Receipt"
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