import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FiSearch, 
  FiEye, 
  FiShoppingCart, 
  FiX, 
  FiChevronDown, 
  FiChevronUp,
  FiAlertCircle,
  FiTrash2
} from 'react-icons/fi';
import './Orders.css';
import { orderService } from '../../services/orderService';

const ORDER_STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded'];

export default function Orders() {
  const location = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  
  // Interactive States
  const [activeUpdatingId, setActiveUpdatingId] = useState('');

  // Safe Image URL Resolver
  const resolveImageUrl = useCallback((imageSource) => {
    if (!imageSource) return '';
    if (Array.isArray(imageSource)) return resolveImageUrl(imageSource[0]);
    if (typeof imageSource === 'object') {
      return resolveImageUrl(imageSource.url || imageSource.path || imageSource.src || '');
    }

    const pathString = String(imageSource);
    if (pathString.startsWith('http://') || pathString.startsWith('https://')) {
      return pathString;
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://backend-production-a2eb.up.railway.app/api';
    const apiOrigin = apiBaseUrl.replace(/\/api\/?$/, '');
    return `${apiOrigin.replace(/\/$/, '')}/${pathString.replace(/^\/+/, '')}`;
  }, []);

  // Shipping Address Formatter
  const formatShippingAddress = useCallback((address) => {
    if (!address) return 'Address not available';
    const addressParts = [
      address.fullName,
      address.addressLine1,
      address.addressLine2,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ];
    return addressParts.filter(Boolean).join(', ');
  }, []);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await orderService.getAllOrders({ limit: 100 });
      const fetchedOrders = response?.data?.orders || [];
      setOrders(fetchedOrders);

      // Keep the orders list clean; detail pages now use their own route.
    } catch (error) {
      console.error('Failed to load orders:', error);
      setErrorMessage('Orders load karne mein dushwari hui. Baraye meherbani dubara koshish karein.');
    } finally {
      setIsLoading(false);
    }
  }, [location?.state?.orderId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handle Status Update
  const handleStatusChange = async (orderId, statusField, newStatus) => {
    if (!orderId || !newStatus) return;
    setActiveUpdatingId(orderId);

    try {
      await orderService.updateOrderStatus(orderId, { [statusField]: newStatus });

      setOrders((previousOrders) =>
        previousOrders.map((item) =>
          (item._id || item.id) === orderId ? { ...item, [statusField]: newStatus } : item
        )
      );

    } catch (error) {
      console.error('Status update failed:', error);
      setErrorMessage('Status update nahi ho saka.');
    } finally {
      setActiveUpdatingId('');
    }
  };

  // Handle Order Delete
  const handleOrderDelete = async (orderId) => {
    if (!orderId) return;

    const isConfirmed = window.confirm('Kya aap yaqeenan is order ko delete karna chahte hain?');
    if (!isConfirmed) return;

    setActiveUpdatingId(orderId);
    setErrorMessage('');

    try {
      await orderService.deleteOrder(orderId);
      setOrders((previous) => previous.filter((item) => (item._id || item.id) !== orderId));
    } catch (error) {
      console.error('Delete order error:', error);
      setErrorMessage('Order delete nahi ho saka. Dobara koshish karein.');
    } finally {
      setActiveUpdatingId('');
    }
  };

  // Instant Memoized Order Search & Filtering
  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const orderId = (order._id || order.id || '').toLowerCase();
      const orderNum = (order.orderNumber || '').toLowerCase();
      const customerName = `${order.user?.firstName || ''} ${order.user?.lastName || ''}`.toLowerCase();

      const matchesSearch = !query || orderId.includes(query) || orderNum.includes(query) || customerName.includes(query);
      const matchesStatus = activeStatusFilter === 'all' || (order.orderStatus || '').toLowerCase() === activeStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, activeStatusFilter]);

  // Memoized Revenue & Quantity Calculations
  const metrics = useMemo(() => {
    return filteredOrders.reduce(
      (acc, order) => {
        const itemQuantity = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        acc.totalItems += itemQuantity;
        acc.totalAmount += Number(order.totalAmount || 0);
        return acc;
      },
      { totalItems: 0, totalAmount: 0 }
    );
  }, [filteredOrders]);

  return (
    <div className="orders-page-scope">
      {/* Page Header */}
      <header className="orders-header">
        <div className="orders-title-group">
          <h1>Orders Overview</h1>
          <p>{orders.length} total system entries recorded</p>
        </div>

        <div className="orders-metrics">
          <div className="metric-card">
            <span className="metric-value">{filteredOrders.length}</span>
            <span className="metric-label">Filtered</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">{metrics.totalItems}</span>
            <span className="metric-label">Items</span>
          </div>
          <div className="metric-card highlight">
            <span className="metric-value">
              Rs. {metrics.totalAmount.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
            </span>
            <span className="metric-label">Revenue</span>
          </div>
        </div>
      </header>

      {/* Control Panel: Search & Category Tabs */}
      <div className="orders-controls">
        <div className="search-field">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by order ID or customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')} type="button">
              <FiX />
            </button>
          )}
        </div>

        <div className="status-tabs-container">
          {['all', ...ORDER_STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatusFilter(status)}
              className={`status-tab ${activeStatusFilter === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Body */}
      <main className="orders-content-card">
        {isLoading ? (
          <div className="state-display-container">
            <div className="loading-spinner" />
            <p>Loading order records...</p>
          </div>
        ) : errorMessage ? (
          <div className="state-display-container error">
            <FiAlertCircle size={32} />
            <p>{errorMessage}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="state-display-container">
            <FiShoppingCart size={36} />
            <p>No orders found matching your search.</p>
          </div>
        ) : (
          <div className="orders-table-responsive">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th className="hide-on-mobile">Date</th>
                  <th className="hide-on-mobile">Payment</th>
                  <th>Status</th>
                  <th className="text-right">Total Amount</th>
                  <th className="text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const id = order._id || order.id;
                  const customerFullName = order.user
                    ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()
                    : 'Guest Customer';

                  return (
                    <tr key={id}>
                      <td className="order-id-cell">
                        <span className="primary-id">{order.orderNumber || id}</span>
                        <span className="sub-id">#{id?.slice(-6)}</span>
                      </td>

                      <td className="customer-cell">
                        <div className="customer-name">{customerFullName}</div>
                        <div className="customer-email">{order.user?.email || 'N/A'}</div>
                      </td>

                      <td className="hide-on-mobile date-cell">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                      </td>

                      <td className="hide-on-mobile">
                        <span className={`status-badge payment-${(order.paymentStatus || 'pending').toLowerCase()}`}>
                          {order.paymentStatus || 'Pending'}
                        </span>
                      </td>

                      <td>
                        <span className={`status-badge order-${(order.orderStatus || 'pending').toLowerCase()}`}>
                          {order.orderStatus || 'Pending'}
                        </span>
                      </td>

                      <td className="text-right amount-cell">
                        Rs. {Number(order.totalAmount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="text-center">
                        <button
                          type="button"
                          className="view-details-btn"
                          onClick={() => navigate(`/orders/${id}`)}
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

    </div>
  );
}