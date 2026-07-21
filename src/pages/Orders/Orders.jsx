import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FiSearch, FiEye, FiShoppingCart, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import './Orders.css';
import { orderService } from '../../services/orderService';

const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const paymentStatusOptions = ['pending', 'paid', 'failed', 'refunded'];

export default function Orders() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [expandedItemId, setExpandedItemId] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await orderService.getAllOrders({ limit: 100 });
      const fetchedOrders = response?.data?.orders || [];
      setOrders(fetchedOrders);

      const triggeredOrderId = location?.state?.orderId;
      if (triggeredOrderId) {
        const matchedOrder = fetchedOrders.find(
          (o) => (o._id || o.id) === triggeredOrderId
        );
        if (matchedOrder) {
          setSelectedOrder(matchedOrder);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [location?.state?.orderId]);

  const handleStatusChange = async (orderId, field, nextStatus) => {
    if (!orderId || !nextStatus) return;
    setUpdatingOrderId(orderId);
    try {
      await orderService.updateOrderStatus(orderId, { [field]: nextStatus });
      
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          (order._id || order.id) === orderId ? { ...order, [field]: nextStatus } : order
        )
      );

      if (selectedOrder && (selectedOrder._id || selectedOrder.id) === orderId) {
        setSelectedOrder((prev) => ({ ...prev, [field]: nextStatus }));
      }
    } catch (err) {
      console.error(err);
      setError('Unable to update order status.');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const getImageUrl = (value) => {
    if (!value) return '';
    if (Array.isArray(value)) return getImageUrl(value[0]);
    if (typeof value === 'object') return getImageUrl(value.url || value.path || value.src || '');
    const stringValue = String(value);
    if (stringValue.startsWith('http://') || stringValue.startsWith('https://')) return stringValue;
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${base.replace(/\/$/, '')}/${stringValue.replace(/^\/+/, '')}`;
  };

  const formatAddress = (address) => {
    if (!address) return 'Not provided';
    return [
      address.fullName,
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean).join(', ');
  };

  const filteredOrders = orders.filter((order) => {
    const orderId = order._id || order.id || '';
    const orderNum = order.orderNumber || '';
    const fName = order.user?.firstName || '';
    const lName = order.user?.lastName || '';
    const fullName = `${fName} ${lName}`.toLowerCase();

    const matchesSearch =
      orderId.toLowerCase().includes(search.toLowerCase()) ||
      orderNum.toLowerCase().includes(search.toLowerCase()) ||
      fullName.includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      order.orderStatus?.toLowerCase() === filterStatus.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totals = filteredOrders.reduce(
    (acc, order) => {
      acc.items += order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      acc.amount += Number(order.totalAmount || 0);
      return acc;
    },
    { items: 0, amount: 0 }
  );

  return (
    <div className="orders-container">
      {/* Header Summary */}
      <div className="orders-header-row">
        <div>
          <h1 className="dashboard-title">Orders Dashboard</h1>
          <p className="dashboard-subtitle">{orders.length} total raw operational entries</p>
        </div>

        <div className="metrics-summary">
          <div className="metric-pill">
            <span className="metric-val">{filteredOrders.length}</span>
            <small className="metric-lbl">Filtered Orders</small>
          </div>
          <div className="metric-pill">
            <span className="metric-val">{totals.items}</span>
            <small className="metric-lbl">Total Items</small>
          </div>
          <div className="metric-pill">
            <span className="metric-val">${totals.amount.toFixed(2)}</span>
            <small className="metric-lbl">Total Volume</small>
          </div>
        </div>
      </div>

      {/* Control Filters Block */}
      <div className="filter-controls-bar">
        <div className="search-box-wrapper">
          <FiSearch className="search-icon-inside" size={18} />
          <input
            type="text"
            placeholder="Search order number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="native-search-input"
          />
        </div>
        <div className="status-horizontal-tabs">
          {['all', ...statusOptions].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`tab-filter-btn ${filterStatus === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Table Box */}
      <div className="orders-table-wrapper">
        {loading ? (
          <div className="table-state-msg">
            <div className="ui-loading-spinner" />
            <span>Fetching secure database data records...</span>
          </div>
        ) : error ? (
          <div className="table-state-msg state-error">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="table-state-msg">
            <FiShoppingCart size={32} className="muted-icon" />
            <span>No orders match your criteria.</span>
          </div>
        ) : (
          <div className="responsive-table-scroll">
            <table className="custom-dashboard-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="hide-md">Date</th>
                  <th className="hide-lg">Payment Status</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const id = order._id || order.id;
                  const cName = order.user
                    ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()
                    : 'Unknown User';
                  
                  return (
                    <tr key={id}>
                      <td className="font-bold-dark">
                        <span>{order.orderNumber || id}</span>
                        <div className="sub-id-hash">#{id?.slice(-6)}</div>
                      </td>
                      <td>
                        <div className="customer-cell-primary">{cName}</div>
                        <div className="customer-cell-sub">{order.user?.email || 'No email'}</div>
                      </td>
                      <td className="hide-md plain-muted-text">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="hide-lg">
                        <span className={`static-badge status-${order.paymentStatus?.toLowerCase() || 'pending'}`}>
                          {order.paymentStatus || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <span className={`static-badge status-${order.orderStatus?.toLowerCase() || 'pending'}`}>
                          {order.orderStatus || 'Pending'}
                        </span>
                      </td>
                      <td className="text-right highlight-amount-cell">
                        ${Number(order.totalAmount || 0).toFixed(2)}
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="action-view-eye-btn"
                          onClick={() => setSelectedOrder(order)}
                          title="View Details"
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
      </div>

      {/* Immersive Right-Side/Center Overlay Detail Modal */}
      {selectedOrder && (
        <div className="modal-backdrop-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-body-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top-header">
              <div>
                <h3>Order Details View</h3>
                <span className="order-header-hash-lbl">
                  ID: {selectedOrder.orderNumber || (selectedOrder._id || selectedOrder.id)}
                </span>
              </div>
              <button className="close-modal-x-btn" onClick={() => setSelectedOrder(null)}>
                <FiX size={20} />
              </button>
            </div>

            <div className="modal-scrollable-inner-grid">
              {/* Management Control Center Card */}
              <div className="panel-info-card highlighted-panel">
                <h4>Status Management</h4>
                <div className="interactive-select-row">
                  <div className="control-input-stack">
                    <label>Order Track Status</label>
                    <select
                      value={selectedOrder.orderStatus || 'pending'}
                      disabled={updatingOrderId === (selectedOrder._id || selectedOrder.id)}
                      onChange={(e) => handleStatusChange(selectedOrder._id || selectedOrder.id, 'orderStatus', e.target.value)}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="control-input-stack">
                    <label>Financial Payment Status</label>
                    <select
                      value={selectedOrder.paymentStatus || 'pending'}
                      disabled={updatingOrderId === (selectedOrder._id || selectedOrder.id)}
                      onChange={(e) => handleStatusChange(selectedOrder._id || selectedOrder.id, 'paymentStatus', e.target.value)}
                    >
                      {paymentStatusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Grid block info details */}
              <div className="three-column-detail-layout">
                <div className="panel-info-card">
                  <h4>Customer Detail</h4>
                  <p><strong>Name:</strong> {selectedOrder.user ? `${selectedOrder.user.firstName || ''} ${selectedOrder.user.lastName || ''}`.trim() : 'Unknown'}</p>
                  <p><strong>Email:</strong> {selectedOrder.user?.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedOrder.shippingAddress?.phone || 'Not Provided'}</p>
                  <p className="address-block-para"><strong>Shipping Destination:</strong> {formatAddress(selectedOrder.shippingAddress)}</p>
                </div>

                <div className="panel-info-card">
                  <h4>Financial Data</h4>
                  <p><strong>Method:</strong> {selectedOrder.paymentMethod || 'Not provided'}</p>
                  <p><strong>Transaction Account:</strong> {selectedOrder.paymentNumber || 'Not provided'}</p>
                  <p><strong>Total Gross Value:</strong> ${Number(selectedOrder.totalAmount || 0).toFixed(2)}</p>
                  <p><strong>System Date:</strong> {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}</p>
                </div>

                <div className="panel-info-card">
                  <h4>Notes</h4>
                  <div className="notes-display-box">
                    {selectedOrder.notes || 'No administrative memos left on this checkout profile.'}
                  </div>
                </div>
              </div>

              {/* Items Section Container */}
              <div className="panel-info-card">
                <h4 style={{ marginBottom: '12px' }}>Purchased Stock Allocation Items</h4>
                <div className="modal-items-list-container">
                  {(selectedOrder.items || []).map((item, index) => {
                    const prod = item.product;
                    const fallbackImg = prod?.images?.[0] || prod?.image || '';
                    const itemKey = `${selectedOrder._id || selectedOrder.id}-${index}`;
                    const isItemExpanded = expandedItemId === itemKey;

                    return (
                      <div key={itemKey} className="modal-nested-item-card">
                        <div className="nested-item-header-row">
                          <div className="nested-item-left-main">
                            <img
                              src={getImageUrl(fallbackImg)}
                              alt={prod?.name || 'Stock Item'}
                              className="modal-thumbnail"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/60x60?text=No+Image';
                              }}
                            />
                            <div>
                              <div className="item-name-heading">{prod?.name || `Product Line Entry #${index + 1}`}</div>
                              <div className="item-meta-row-pills">
                                <span>Qty: {item.quantity || 1}</span>
                                <span>Size: {item.size || 'N/A'}</span>
                                <span>Color: {item.color || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="nested-item-right-toggle">
                            <span className="nested-item-price-tag">${Number(item.price || 0).toFixed(2)}</span>
                            <button
                              type="button"
                              className="nested-expand-chevron-btn"
                              onClick={() => setExpandedItemId(isItemExpanded ? '' : itemKey)}
                            >
                              {isItemExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                            </button>
                          </div>
                        </div>

                        {isItemExpanded && (
                          <div className="nested-item-expanded-drawer">
                            <div className="drawer-grid-spec">
                              {prod?.sku && <p><strong>SKU Stock Code:</strong> {prod.sku}</p>}
                              {prod?.brand && <p><strong>Brand Line:</strong> {prod.brand}</p>}
                              {prod?.category && <p><strong>Categorization:</strong> {prod.category}</p>}
                              {typeof prod?.stock === 'number' && <p><strong>Warehouse Inventory Counter:</strong> {prod.stock} units left</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Payment Proof Image Panel View */}
              {(selectedOrder.paymentReceipt || selectedOrder.paymentProof) && (
                <div className="panel-info-card">
                  <h4>Verified Payment Proof Voucher Image</h4>
                  <div className="receipt-preview-box">
                    <img
                      src={getImageUrl(selectedOrder.paymentReceipt || selectedOrder.paymentProof)}
                      alt="Verified Receipt Scan Attachment"
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