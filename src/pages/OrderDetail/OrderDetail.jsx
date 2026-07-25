import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import './OrderDetail.css';

const OrderDetail = ({ orderId: propOrderId, onBack, onDelete, fetchOrderApi }) => {
  const { id: routeOrderId } = useParams();
  const navigate = useNavigate();
  const resolvedOrderId = propOrderId || routeOrderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

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

  const handleDelete = async () => {
    if (!resolvedOrderId || isDeleting) return;

    const confirmed = window.confirm('Delete this order permanently?');
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);

    try {
      await (onDelete ? onDelete(resolvedOrderId) : orderService.deleteOrder(resolvedOrderId));
      await new Promise((resolve) => setTimeout(resolve, 400));
      navigate('/orders', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Failed to delete order.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openItemDetails = (item) => {
    setSelectedItem(item);
  };

  const closeItemDetails = () => {
    setSelectedItem(null);
  };

  const handleStatusChange = async (type, value) => {
    if (!order?._id) return;

    setStatusUpdating(true);
    try {
      const payload = type === 'orderStatus' ? { orderStatus: value } : { paymentStatus: value };
      const response = await orderService.updateOrderStatus(order._id, payload);
      const updatedOrder = response?.data?.order || response?.data || response || null;

      if (updatedOrder) {
        setOrder((prev) => prev ? { ...prev, ...updatedOrder } : updatedOrder);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update order status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const customerName = order?.customerName || order?.shippingAddress?.fullName || order?.billingAddress?.fullName || order?.user?.name || 'N/A';
  const customerEmail = order?.customerEmail || order?.shippingAddress?.email || order?.billingAddress?.email || order?.user?.email || 'N/A';
  const customerPhone = order?.customerPhone || order?.shippingAddress?.phone || order?.billingAddress?.phone || order?.user?.phone || 'N/A';
  const customerAddress = formatShippingAddress(order?.shippingAddress || order?.billingAddress);

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
        <button
          type="button"
          className="order-details-btn-secondary"
          onClick={() => (onBack ? onBack() : navigate('/orders'))}
        >
          &larr; Back
        </button>
        <button
          type="button"
          className="order-details-btn-danger"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Order'}
        </button>
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
            <label className="order-details-status-control">
              <span className="order-details-status-label">Order</span>
              <select
                value={order.orderStatus || 'pending'}
                onChange={(e) => handleStatusChange('orderStatus', e.target.value)}
                disabled={statusUpdating}
                className="order-details-select"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <label className="order-details-status-control">
              <span className="order-details-status-label">Payment</span>
              <select
                value={order.paymentStatus || 'pending'}
                onChange={(e) => handleStatusChange('paymentStatus', e.target.value)}
                disabled={statusUpdating}
                className="order-details-select"
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>
          </div>
        </div>

        {/* 3-Column Meta Grid */}
        <div className="order-details-grid-three">
          {/* Customer Details */}
          <div className="order-details-info-box">
            <h2 className="order-details-box-heading">Customer Details</h2>
            <div className="order-details-info-content">
              <p><strong>Name:</strong> {customerName}</p>
              <p><strong>Email:</strong> {customerEmail}</p>
              <p><strong>Phone:</strong> {customerPhone}</p>
              <p><strong>Address:</strong> {customerAddress}</p>
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
              order.items.map((item, idx) => {
                const productName = item.productName || item.title || item.product?.name || item.product?.title || `Item Line #${idx + 1}`;
                const productSku = item.sku || item.product?.sku || 'N/A';
                const productImage = item.imageUrl || item.product?.images?.[0]?.url || item.product?.image || item.product?.images?.[0] || null;
                const productVariant = [item.size || item.product?.size, item.color || item.product?.color]
                  .filter(Boolean)
                  .join(' / ');
                const notes = item.note || item.notes || '';

                const productDescription = item.description || item.product?.description || item.product?.shortDescription || 'No description provided.';
                const productSize = item.size || item.product?.size || 'N/A';
                const productColor = item.color || item.product?.color || 'N/A';
                const productQuantity = item.quantity || 1;
                const productNotes = notes || 'No notes provided.';

                return (
                  <button
                    key={item.id || item._id || idx}
                    type="button"
                    className="order-details-item-card"
                    onClick={() => openItemDetails({
                      name: productName,
                      description: productDescription,
                      size: productSize,
                      color: productColor,
                      quantity: productQuantity,
                      notes: productNotes,
                      sku: productSku,
                      image: productImage,
                      price: item.price,
                    })}
                  >
                    <div className="order-details-item-thumb-container">
                      <img
                        src={productImage || null}
                        alt={productName}
                        className="order-details-item-thumb"
                        onError={handleImageError}
                      />
                      <div className="order-details-img-fallback">No Image</div>
                    </div>

                    <div className="order-details-item-info">
                      <h3 className="order-details-item-title">{productName}</h3>
                      <div className="order-details-item-meta">
                        <span className="order-details-pill">Qty: {productQuantity}</span>
                        <span className="order-details-pill">Size: {productSize}</span>
                        <span className="order-details-pill">Color: {productColor}</span>
                        <span className="order-details-pill">SKU: {productSku}</span>
                      </div>
                      {productVariant ? (
                        <div className="order-details-item-variant">Variant: {productVariant}</div>
                      ) : null}
                      {notes ? <div className="order-details-item-note">Note: {notes}</div> : null}
                    </div>

                    <div className="order-details-item-price">
                      Rs. {Number(item.price || 0).toFixed(2)}
                    </div>
                  </button>
                );
              })
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

      {selectedItem && (
        <div className="order-details-modal-backdrop" onClick={closeItemDetails}>
          <div className="order-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-details-modal-header">
              <div>
                <p className="order-details-subtitle">ORDER ITEM DETAILS</p>
                <h3 className="order-details-modal-title">{selectedItem.name}</h3>
              </div>
              <button type="button" className="order-details-modal-close" onClick={closeItemDetails}>
                ×
              </button>
            </div>

            <div className="order-details-modal-body">
              {selectedItem.image ? (
                <div className="order-details-modal-image-wrap">
                  <img src={selectedItem.image} alt={selectedItem.name} className="order-details-modal-image" />
                </div>
              ) : null}

              <div className="order-details-modal-grid">
                <div className="order-details-modal-field">
                  <span className="order-details-modal-label">Name</span>
                  <p>{selectedItem.name}</p>
                </div>
                <div className="order-details-modal-field">
                  <span className="order-details-modal-label">Description</span>
                  <p>{selectedItem.description}</p>
                </div>
                <div className="order-details-modal-field">
                  <span className="order-details-modal-label">Size</span>
                  <p>{selectedItem.size}</p>
                </div>
                <div className="order-details-modal-field">
                  <span className="order-details-modal-label">Color</span>
                  <p>{selectedItem.color}</p>
                </div>
                <div className="order-details-modal-field">
                  <span className="order-details-modal-label">Quantity</span>
                  <p>{selectedItem.quantity}</p>
                </div>
                <div className="order-details-modal-field">
                  <span className="order-details-modal-label">Notes</span>
                  <p>{selectedItem.notes}</p>
                </div>
                <div className="order-details-modal-field">
                  <span className="order-details-modal-label">SKU</span>
                  <p>{selectedItem.sku}</p>
                </div>
                <div className="order-details-modal-field">
                  <span className="order-details-modal-label">Price</span>
                  <p>Rs. {Number(selectedItem.price || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;