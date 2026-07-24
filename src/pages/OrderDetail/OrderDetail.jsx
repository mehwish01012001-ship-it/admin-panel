import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import './OrderDetail.css';

const OrderDetail = ({ orderId: propOrderId, onBack, onDelete, fetchOrderApi }) => {
  const { id: routeOrderId } = useParams();
  const resolvedOrderId = propOrderId || routeOrderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    if (!resolvedOrderId) {
      setLoading(false);
      setError('No order ID was provided.');
      return;
    }

    const loadOrderData = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiCall = fetchOrderApi || orderService.getOrder;
        const response = await apiCall(resolvedOrderId);
        const normalizedOrder = response?.data?.order || response?.data || response || null;

        if (isMounted) {
          setOrder(normalizedOrder);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to fetch order details. Please try again.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrderData();

    return () => {
      isMounted = false;
    };
  }, [resolvedOrderId, fetchOrderApi]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.style.display = 'none';
    if (e.target.nextElementSibling) {
      e.target.nextElementSibling.style.display = 'flex';
    }
  };

  const formatShippingAddress = (address) => {
    if (!address) return 'N/A';

    if (typeof address === 'string') {
      return address.trim() || 'N/A';
    }

    if (typeof address === 'object') {
      const parts = [
        address.fullName,
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.state,
        address.zipCode,
        address.country,
      ].filter(Boolean);

      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }

    return 'N/A';
  };

  if (loading) {
    return (
      <div className="order-details-wrapper">
        <div className="order-details-status-container">
          <p className="order-details-status-text">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-details-wrapper">
        <div className="order-details-status-container">
          <p className="order-details-status-text error">{error || 'Order record not found.'}</p>
          {onBack && (
            <button type="button" className="order-details-back-btn" onClick={onBack}>
              &larr; Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-wrapper">
      {/* Top Bar Actions */}
      <div className="order-details-action-bar">
        {onBack && (
          <button type="button" className="order-details-btn-secondary" onClick={onBack}>
            &larr; Back
          </button>
        )}
        {onDelete && (
          <button type="button" className="order-details-btn-danger" onClick={() => onDelete(order._id || order.id || resolvedOrderId)}>
            Delete Order
          </button>
        )}
      </div>

      {/* Main Order Card */}
      <div className="order-details-card">
        {/* Header Section */}
        <div className="order-details-header">
          <div className="order-details-title-group">
            <span className="order-details-subtitle">ORDER SUMMARY</span>
            <h1 className="order-details-id-title">{order.orderNumber || order._id || order.id}</h1>
          </div>
          <div className="order-details-status-badges">
            <span className="order-details-badge">{order.orderStatus || 'Pending'}</span>
            <span className="order-details-badge">{order.paymentStatus || 'Pending'}</span>
          </div>
        </div>

        {/* 3-Column Meta Grid */}
        <div className="order-details-grid-three">
          {/* Customer Details */}
          <div className="order-details-info-box">
            <h2 className="order-details-box-heading">Customer Details</h2>
            <div className="order-details-info-content">
              <p><strong>Name:</strong> {order.customerName || 'N/A'}</p>
              <p><strong>Email:</strong> {order.customerEmail || 'N/A'}</p>
              <p><strong>Phone:</strong> {order.customerPhone || 'N/A'}</p>
              <p><strong>Address:</strong> {formatShippingAddress(order.shippingAddress)}</p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="order-details-info-box">
            <h2 className="order-details-box-heading">Financial Summary</h2>
            <div className="order-details-info-content">
              <p><strong>Method:</strong> {order.paymentMethod || 'cash_on_delivery'}</p>
              <p><strong>Account #:</strong> {order.accountNumber || 'N/A'}</p>
              <p><strong>Total Amount:</strong> Rs. {Number(order.totalAmount || 0).toFixed(2)}</p>
              <p><strong>Date:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</p>
            </div>
          </div>

          {/* Order Notes */}
          <div className="order-details-info-box">
            <h2 className="order-details-box-heading">Order Notes</h2>
            <div className="order-details-info-content">
              <p className="order-details-notes-text">
                {order.notes && order.notes.trim() ? order.notes : 'No specific instructions provided.'}
              </p>
            </div>
          </div>
        </div>

        {/* Items Purchased Section */}
        <div className="order-details-section">
          <h2 className="order-details-section-heading">Order Items</h2>
          <div className="order-details-items-list">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => (
                <div key={item.id || idx} className="order-details-item-card">
                  <div className="order-details-item-thumb-container">
                    <img
                      src={item.imageUrl || null}
                      alt={item.title || 'Product Item'}
                      className="order-details-item-thumb"
                      onError={handleImageError}
                    />
                    <div className="order-details-img-fallback">No Image</div>
                  </div>

                  <div className="order-details-item-info">
                    <h3 className="order-details-item-title">{item.title || `Item Line #${idx + 1}`}</h3>
                    <div className="order-details-item-meta">
                      <span>Qty: {item.quantity || 1}</span>
                      <span>Size: {item.size || 'N/A'}</span>
                      <span>Color: {item.color || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="order-details-item-price">
                    Rs. {Number(item.price || 0).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <p className="order-details-empty-text">No items found in this order.</p>
            )}
          </div>
        </div>

        {/* Payment Receipt Attachment */}
        <div className="order-details-section">
          <h2 className="order-details-section-heading">Payment Receipt</h2>
          <div className="order-details-receipt-box">
            {order.receiptUrl ? (
              <div className="order-details-receipt-preview">
                <img
                  src={order.receiptUrl || null}
                  alt="Payment Receipt"
                  className="order-details-receipt-img"
                  onError={handleImageError}
                />
                <div className="order-details-img-fallback receipt">No Receipt Image Available</div>
              </div>
            ) : (
              <p className="order-details-empty-text">No payment receipt attached.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;