import React, { useEffect, useMemo, useState, useCallback } from "react";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import {
  FiAlertTriangle,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiShoppingBag,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { customerService } from "../../services/customerService";
import { orderService } from "../../services/orderService";
import { productService } from "../../services/productService";
import "./Dashboard.css";

const PIE_COLORS = ["#10B981", "#4F46E5", "#C9A86A", "#EF4444"];

/**
 * Safely extracts arrays from standardized API envelope responses
 */
const extractList = (response, key) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  return [];
};

// --- Sub-components for better readibility and rendering control ---

const MetricCard = React.memo(({ title, value, icon, prefix, color, loading, variants }) => (
  <motion.article
    className="metric-card"
    variants={variants}
    whileHover={{ y: -3, transition: { duration: 0.15 } }}
  >
    <div className="metric-card-header">
      <div className="metric-icon" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <span className="metric-pill">Live</span>
    </div>
    <p className="metric-title">{title}</p>
    <h2 className="metric-value">
      {loading ? (
        <span className="skeleton-text short" />
      ) : (
        <>
          {prefix}
          <CountUp
            end={value}
            decimals={prefix === "Rs." ? 2 : 0}
            separator=","
            duration={1.2}
          />
        </>
      )}
    </h2>
    <div className="metric-accent" style={{ backgroundColor: color }} />
  </motion.article>
));

const SkeletonLoader = () => (
  <div className="skeleton-wrapper">
    <div className="skeleton-bar" />
  </div>
);

// --- Main Dashboard Component ---

const Dashboard = () => {
  const [data, setData] = useState({ products: [], orders: [], customers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(3);

  // Fetch operational analytics
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [productsRes, ordersRes, customersRes] = await Promise.all([
        productService.getAllProducts({ limit: 200 }),
        orderService.getAllOrders({ limit: 200 }),
        customerService.getAllCustomers(),
      ]);

      setData({
        products: extractList(productsRes, "products"),
        orders: extractList(ordersRes, "orders"),
        customers: extractList(customersRes, "customers"),
      });
    } catch (err) {
      console.error("[Dashboard] Error fetching operational data:", err);
      setError("Unable to sync live operational analytics. Displaying cached state.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Filter orders based on the selected timeframe
  const filteredOrders = useMemo(() => {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - timeRange);

    return data.orders.filter((order) => {
      if (!order?.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return !isNaN(orderDate.getTime()) && orderDate >= cutoff;
    });
  }, [data.orders, timeRange]);

  // Derived KPI metrics
  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce(
      (acc, order) => acc + Number(order.totalAmount || 0),
      0
    );

    return [
      {
        id: "revenue",
        title: "Total Revenue",
        value: totalRevenue,
        icon: <FiDollarSign />,
        prefix: "Rs.",
        color: "#C9A86A",
      },
      {
        id: "orders",
        title: "Orders Placed",
        value: filteredOrders.length,
        icon: <FiShoppingBag />,
        prefix: "",
        color: "#4F46E5",
      },
      {
        id: "customers",
        title: "Active Customers",
        value: data.customers.length,
        icon: <FiUsers />,
        prefix: "",
        color: "#EC4899",
      },
      {
        id: "products",
        title: "Catalog Products",
        value: data.products.length,
        icon: <FiPackage />,
        prefix: "",
        color: "#10B981",
      },
    ];
  }, [filteredOrders, data.customers.length, data.products.length]);

  // Chart data calculation
  const chartData = useMemo(() => {
    const monthlyMap = {};

    filteredOrders.forEach((order) => {
      const date = order.createdAt ? new Date(order.createdAt) : null;
      if (!date || isNaN(date.getTime())) return;

      const sortKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleString("en-US", { month: "short", year: "2-digit" });

      if (!monthlyMap[sortKey]) {
        monthlyMap[sortKey] = { name: label, Revenue: 0, Profit: 0, sortKey };
      }

      const rev = Number(order.totalAmount || 0);
      monthlyMap[sortKey].Revenue += rev;
      monthlyMap[sortKey].Profit += rev * 0.22; // Estimated margin formula
    });

    return Object.values(monthlyMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ sortKey, ...rest }) => rest);
  }, [filteredOrders]);

  // Fulfillment status distribution
  const pieData = useMemo(() => {
    const counts = { Delivered: 0, Processing: 0, Pending: 0, Cancelled: 0 };

    filteredOrders.forEach((order) => {
      const rawStatus = String(order.orderStatus || "Processing").toLowerCase();
      const statusKey = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

      if (counts[statusKey] !== undefined) {
        counts[statusKey] += 1;
      } else {
        counts.Processing += 1;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  // Top products by volume
  const topProducts = useMemo(() => {
    const map = {};

    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const id = item.product?._id || item.productId || "unknown";
        const name = item.product?.name || item.productName || "Product";

        if (!map[id]) map[id] = { name, sales: 0, revenue: 0 };

        const qty = Number(item.quantity || 0);
        const price = Number(item.price || item.totalPrice || 0);

        map[id].sales += qty;
        map[id].revenue += price * qty;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [filteredOrders]);

  // Inventory threshold alerts
  const lowStockItems = useMemo(() => {
    return data.products.filter((p) => Number(p.stock ?? p.inventory ?? 0) <= 10);
  }, [data.products]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  };

  return (
    <div className="dashboard-shell">
      {error && <div className="dashboard-error-banner">{error}</div>}

      {/* Header Bar */}
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Operations Center</p>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            Real-time performance insights from products, orders, and customers.
          </p>
        </div>

        <div className="dashboard-actions">
          <label className="select-field">
            <FiCalendar className="field-icon" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              aria-label="Select timeframe"
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={9}>Last 9 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </label>
        </div>
      </header>

      {/* KPI Metrics */}
      <motion.div
        className="metrics-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((item) => (
          <MetricCard
            key={item.id}
            {...item}
            loading={loading}
            variants={cardVariants}
          />
        ))}
      </motion.div>

      {/* Analytics Visualizations */}
      <div className="analytics-grid">
        <section className="analytics-card">
          <div className="card-heading">
            <div>
              <h3>Performance Trajectory</h3>
              <p>Revenue and profit movement over the selected period.</p>
            </div>
            <span className="chip">
              <FiTrendingUp /> Live trend
            </span>
          </div>

          <div className="chart-wrapper">
            {loading ? (
              <SkeletonLoader />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A86A" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#C9A86A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={11} />
                  <Tooltip contentStyle={{ background: "#0F172A", color: "#FFF", borderRadius: "8px", border: "none" }} />
                  <Area type="monotone" dataKey="Revenue" stroke="#C9A86A" strokeWidth={2} fill="url(#revenueGrad)" />
                  <Area type="monotone" dataKey="Profit" stroke="#4F46E5" strokeWidth={2} fill="url(#profitGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="analytics-card">
          <div className="card-heading">
            <div>
              <h3>Order Status Mix</h3>
              <p>Current fulfillment distribution across the window.</p>
            </div>
          </div>

          <div className="pie-wrapper">
            {loading ? (
              <SkeletonLoader />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={65} outerRadius={85} paddingAngle={4}>
                      {pieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0F172A", color: "#FFF", borderRadius: "8px", border: "none" }} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="legend-list">
                  {pieData.map((item, idx) => (
                    <div className="legend-item" key={item.name}>
                      <span className="legend-dot" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span>{item.name}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Inventory Warning Notice */}
      {lowStockItems.length > 0 && !loading && (
        <section className="alert-card">
          <div className="alert-header">
            <div className="alert-icon">
              <FiAlertTriangle />
            </div>
            <div>
              <h3>Low Stock Alert</h3>
              <p>{lowStockItems.length} items are running low (under 10 units remaining).</p>
            </div>
          </div>
          <div className="alert-tags">
            {lowStockItems.slice(0, 5).map((item, idx) => (
              <span key={item._id || idx} className="alert-tag">
                {item.name || item.title}
                <strong>{item.stock ?? item.inventory ?? 0} left</strong>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Tables & Top Items */}
      <div className="content-grid">
        <section className="panel-card">
          <div className="panel-card-header">
            <div>
              <h3>Recent Activity</h3>
              <p>Latest transactions synchronized from the backend.</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan="4"><SkeletonLoader /></td>
                    </tr>
                  ))
                ) : data.orders.length > 0 ? (
                  data.orders.slice(0, 7).map((order, idx) => {
                    const orderId = order._id || order.id || `ord-${idx}`;
                    const customerName = order.user
                      ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
                      : order.customer?.name || "Guest";
                    const status = String(order.orderStatus || "Processing").toLowerCase();

                    return (
                      <tr key={orderId}>
                        <td>
                          <strong>{order.orderNumber || orderId.slice(0, 8)}</strong>
                        </td>
                        <td>
                          <div className="customer-cell">
                            <span>{customerName}</span>
                            <small>{order.user?.email || "N/A"}</small>
                          </div>
                        </td>
                        <td>
                          <strong>Rs. {Number(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                        </td>
                        <td>
                          <span className={`status-pill ${status}`}>
                            {order.orderStatus || "Processing"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">No recent orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel-card">
          <div className="panel-card-header">
            <div>
              <h3>Top Sellers</h3>
              <p>Products generating highest sales volume.</p>
            </div>
          </div>

          <div className="ranking-list">
            {loading ? (
              <SkeletonLoader />
            ) : topProducts.length > 0 ? (
              topProducts.map((product, idx) => (
                <div className="ranking-item" key={`${product.name}-${idx}`}>
                  <div className="ranking-badge">#{idx + 1}</div>
                  <div className="ranking-details">
                    <strong>{product.name}</strong>
                    <span>{product.sales} units sold</span>
                  </div>
                  <div className="ranking-value">
                    Rs. {Number(product.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No product performance data available.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;