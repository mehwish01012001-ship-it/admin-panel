import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiRefreshCcw,
  FiArrowUpRight,
  FiClipboard,
  FiUsers,
  FiTrendingUp,
  FiAlertCircle,
} from 'react-icons/fi';
import { orderService } from '../../services/orderService';
import './SalesReports.css';

const STATUS_MAP = {
  delivered: 'success',
  completed: 'success',
  paid: 'success',
  success: 'success',
  fulfilled: 'success',
  processing: 'processing',
  shipped: 'processing',
  packed: 'processing',
  'out-for-delivery': 'processing',
  cancelled: 'cancelled',
  failed: 'cancelled',
  returned: 'cancelled',
  refunded: 'cancelled',
};

const RANGE_MAP = {
  '3m': { months: 3, label: 'Last 3 months' },
  '6m': { months: 6, label: 'Last 6 months' },
  '12m': { months: 12, label: 'Last 12 months' },
};

const formatCurrency = (value) => {
  const num = Number(value || 0);
  return `Rs. ${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatusTone = (status) => STATUS_MAP[String(status).toLowerCase()] || 'pending';

const AnimatedValue = ({ value, prefix = '', suffix = '', decimals = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const duration = 600;
    const startTime = performance.now();
    const startValue = displayValue;

    const animate = (timestamp) => {
      const progress = Math.min(1, (timestamp - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * eased);

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value]);

  const formattedValue = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(displayValue);

  return (
    <span aria-live="polite">
      {prefix} {formattedValue} {suffix}
    </span>
  );
};

const SalesReports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('6m');

  const fetchOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError('');

    try {
      const response = await orderService.getAllOrders({ limit: 240 });

      const apiOrders =
        response?.data?.orders ||
        response?.data?.data?.orders ||
        response?.data?.data ||
        response?.data ||
        response?.orders ||
        [];

      if (!Array.isArray(apiOrders)) {
        throw new Error('Malformed response received from the backend.');
      }

      setOrders(apiOrders);
    } catch (err) {
      console.error('[Sales Reports] Sync error:', err);
      setError('Unable to synchronize sales data from the backend right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders(true);
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - RANGE_MAP[range].months);

    return orders.filter((order) => {
      const createdAt = order.createdAt ? new Date(order.createdAt) : null;
      return createdAt && createdAt >= cutoffDate;
    });
  }, [orders, range]);

  const metrics = useMemo(() => {
    const totalOrders = filteredOrders.length;

    let totalRevenue = 0;
    let completedOrders = 0;
    const monthlyMap = {};

    filteredOrders.forEach((order) => {
      const amount = Number(order.totalAmount || order.total || 0);
      totalRevenue += amount;

      const status = String(order.status || '').toLowerCase();
      if (STATUS_MAP[status] === 'success') {
        completedOrders += 1;
      }

      if (order.createdAt) {
        const dateObj = new Date(order.createdAt);
        const monthLabel = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });

        if (!monthlyMap[monthLabel]) {
          monthlyMap[monthLabel] = { month: monthLabel, revenue: 0, timestamp: dateObj.getTime() };
        }
        monthlyMap[monthLabel].revenue += amount;
      }
    });

    const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
    const pendingOrders = totalOrders - completedOrders;
    const fulfilledRatio = totalOrders ? Math.round((completedOrders / totalOrders) * 100) : 0;

    const monthlyTrend = Object.values(monthlyMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-6);

    return {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      completedOrders,
      pendingOrders,
      fulfilledRatio,
      monthlyTrend,
    };
  }, [filteredOrders]);

  const recentOrders = useMemo(() => {
    return [...filteredOrders]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8);
  }, [filteredOrders]);

  const maxRevenueTrend = useMemo(() => {
    return Math.max(...metrics.monthlyTrend.map((item) => item.revenue), 1);
  }, [metrics.monthlyTrend]);

  return (
    <div className="sales-reports-page">
      <div className="sales-glow glow-one" aria-hidden="true" />
      <div className="sales-glow glow-two" aria-hidden="true" />

      <motion.header
        className="sales-hero"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="hero-copy">
          <h1>Sales reports</h1>
          <p>Track revenue momentum, order velocity, and fulfillment health in real time.</p>

          <div className="hero-actions">
            <button
              type="button"
              className="refresh-btn"
              onClick={() => fetchOrders(true)}
              disabled={loading}
            >
              <FiRefreshCcw className={loading ? 'spinning' : ''} />
              {loading ? 'Syncing...' : 'Refresh data'}
            </button>

            <nav className="range-switcher" aria-label="Time range filters">
              {Object.keys(RANGE_MAP).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={key === range ? 'active' : ''}
                  onClick={() => setRange(key)}
                  aria-pressed={key === range}
                >
                  {key.toUpperCase()}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="hero-insight">
          <span className="insight-pill">{RANGE_MAP[range].label}</span>
          <h2>{formatCurrency(metrics.totalRevenue)}</h2>
          <p>{metrics.totalOrders} total transactions in this period</p>
          <div className="insight-track" aria-hidden="true">
            <div className="insight-progress" style={{ width: `${metrics.fulfilledRatio}%` }} />
          </div>
          <div className="hero-metrics">
            <div>
              <strong>{metrics.completedOrders}</strong>
              <span>Completed</span>
            </div>
            <div>
              <strong>{metrics.pendingOrders}</strong>
              <span>Pending</span>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            className="loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(3)].map((_, index) => (
              <div key={index} className="loading-card" />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            className="error-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="alert"
          >
            <FiAlertCircle size={20} />
            <span>{error}</span>
          </motion.div>
        ) : (
          <motion.main
            key="data"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <section className="stats-grid" aria-label="Key performance indicators">
              <article className="stat-card">
                <div className="stat-icon accent-purple" aria-hidden="true">
                  <FiArrowUpRight />
                </div>
                <div>
                  <p>Total revenue</p>
                  <h3>
                    <AnimatedValue value={metrics.totalRevenue} prefix="Rs." />
                  </h3>
                </div>
              </article>

              <article className="stat-card">
                <div className="stat-icon accent-gold" aria-hidden="true">
                  <FiClipboard />
                </div>
                <div>
                  <p>Order count</p>
                  <h3>
                    <AnimatedValue value={metrics.totalOrders} />
                  </h3>
                </div>
              </article>

              <article className="stat-card">
                <div className="stat-icon accent-cream" aria-hidden="true">
                  <FiTrendingUp />
                </div>
                <div>
                  <p>Average order</p>
                  <h3>
                    <AnimatedValue value={metrics.averageOrderValue} prefix="Rs." />
                  </h3>
                </div>
              </article>

              <article className="stat-card">
                <div className="stat-icon accent-green" aria-hidden="true">
                  <FiUsers />
                </div>
                <div>
                  <p>Fulfilled ratio</p>
                  <h3>{metrics.fulfilledRatio}%</h3>
                </div>
              </article>
            </section>

            <div className="dashboard-grid">
              <section className="panel panel-chart">
                <div className="panel-heading">
                  <div>
                    <h3>Monthly momentum</h3>
                    <p>Revenue distribution across active window</p>
                  </div>
                  <span className="chip text-uppercase">Live analytics</span>
                </div>

                {metrics.monthlyTrend.length === 0 ? (
                  <div className="empty-state">No sales records available for this range.</div>
                ) : (
                  <div className="bars-wrapper">
                    {metrics.monthlyTrend.map((item) => (
                      <div key={item.month} className="bar-group">
                        <div className="bar-track">
                          <motion.div
                            className="bar-fill"
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.max(8, (item.revenue / maxRevenueTrend) * 100)}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                          />
                        </div>
                        <span>{item.month}</span>
                        <strong>{formatCurrency(item.revenue)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Order health status</h3>
                    <p>Fulfillment status ratio</p>
                  </div>
                </div>

                <div className="breakdown-list">
                  <div className="breakdown-row">
                    <span className="breakdown-label">
                      <span className="dot dot-success" /> Completed
                    </span>
                    <div className="breakdown-track">
                      <div
                        className="breakdown-fill fill-success"
                        style={{ width: `${metrics.totalOrders ? (metrics.completedOrders / metrics.totalOrders) * 100 : 0}%` }}
                      />
                    </div>
                    <strong>{metrics.completedOrders}</strong>
                  </div>

                  <div className="breakdown-row">
                    <span className="breakdown-label">
                      <span className="dot dot-pending" /> Pending
                    </span>
                    <div className="breakdown-track">
                      <div
                        className="breakdown-fill fill-pending"
                        style={{ width: `${metrics.totalOrders ? (metrics.pendingOrders / metrics.totalOrders) * 100 : 0}%` }}
                      />
                    </div>
                    <strong>{metrics.pendingOrders}</strong>
                  </div>
                </div>
              </section>
            </div>

            <section className="panel recent-orders-panel">
              <div className="panel-heading">
                <div>
                  <h3>Recent orders</h3>
                  <p>Real-time backend order records</p>
                </div>
                <span className="chip soft">{recentOrders.length} records</span>
              </div>

              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Customer</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-state">
                          No transactions found for the selected range.
                        </td>
                      </tr>
                    ) : (
                      recentOrders.map((order) => (
                        <tr key={order._id || order.id || order.orderNumber}>
                          <td>
                            <strong>{order.orderNumber || `#${String(order._id || '').slice(-6)}` || '—'}</strong>
                          </td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            <span className={`status-badge ${getStatusTone(order.status)}`}>
                              {order.status || 'Pending'}
                            </span>
                          </td>
                          <td>{order.customer?.name || order.customerName || 'Guest user'}</td>
                          <td>
                            <strong>{formatCurrency(order.totalAmount || order.total || 0)}</strong>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesReports;