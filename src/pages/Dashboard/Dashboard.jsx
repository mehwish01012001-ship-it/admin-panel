import React, { useEffect, useMemo, useState } from "react";
import * as CountUpModule from "react-countup";
import { motion } from "framer-motion";
import {
  FiAlertTriangle,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiSearch,
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

const CountUp = CountUpModule.default?.default || CountUpModule.default || CountUpModule;
const PIE_COLORS = ["#10B981", "#4F46E5", "#C9A86A", "#EF4444"];

const getListFromResponse = (response, fallbackKey) => {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.[fallbackKey])) {
    return payload[fallbackKey];
  }

  if (Array.isArray(payload?.data?.[fallbackKey])) {
    return payload.data[fallbackKey];
  }

  return [];
};

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState(3);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const [productsResponse, ordersResponse, customersResponse] = await Promise.all([
          productService.getAllProducts({ limit: 200 }),
          orderService.getAllOrders({ limit: 200 }),
          customerService.getAllCustomers(),
        ]);

        setProducts(getListFromResponse(productsResponse, "products"));
        setOrders(getListFromResponse(ordersResponse, "orders"));
        setCustomers(getListFromResponse(customersResponse, "customers"));
      } catch (err) {
        console.error(err);
        setError("Unable to load live dashboard analytics.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const filteredOrdersByTime = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - timeRange);

    return orders.filter((order) => {
      if (!order.createdAt) {
        return false;
      }

      const createdAt = new Date(order.createdAt);
      return !Number.isNaN(createdAt.getTime()) && createdAt >= cutoffDate;
    });
  }, [orders, timeRange]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrdersByTime.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    return [
      {
        title: "Total Revenue",
        value: totalRevenue,
        icon: <FiDollarSign />,
        prefix: "$",
        color: "#C9A86A",
      },
      {
        title: "Orders Placed",
        value: filteredOrdersByTime.length,
        icon: <FiShoppingBag />,
        prefix: "",
        color: "#4F46E5",
      },
      {
        title: "Active Customers",
        value: customers.length,
        icon: <FiUsers />,
        prefix: "",
        color: "#EC4899",
      },
      {
        title: "Catalog Products",
        value: products.length,
        icon: <FiPackage />,
        prefix: "",
        color: "#10B981",
      },
    ];
  }, [customers.length, filteredOrdersByTime, products.length]);

  const chartData = useMemo(() => {
    const monthly = {};

    filteredOrdersByTime.forEach((order) => {
      const date = order.createdAt ? new Date(order.createdAt) : null;
      if (!date || Number.isNaN(date.getTime())) {
        return;
      }

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleString("en-US", { month: "short", year: "2-digit" });

      if (!monthly[monthKey]) {
        monthly[monthKey] = {
          name: monthLabel,
          Revenue: 0,
          Profit: 0,
          _sortKey: monthKey,
        };
      }

      monthly[monthKey].Revenue += Number(order.totalAmount || 0);
      monthly[monthKey].Profit += Number(order.totalAmount || 0) * 0.22;
    });

    return Object.values(monthly)
      .sort((a, b) => a._sortKey.localeCompare(b._sortKey))
      .map(({ _sortKey, ...item }) => item);
  }, [filteredOrdersByTime]);

  const pieData = useMemo(() => {
    const segments = {
      Delivered: 0,
      Processing: 0,
      Pending: 0,
      Cancelled: 0,
    };

    filteredOrdersByTime.forEach((order) => {
      const status = String(order.orderStatus || "Processing").toLowerCase();
      const key = status.charAt(0).toUpperCase() + status.slice(1);

      if (segments[key] !== undefined) {
        segments[key] += 1;
      } else {
        segments.Processing += 1;
      }
    });

    return Object.entries(segments).map(([name, value]) => ({ name, value }));
  }, [filteredOrdersByTime]);

  const topProducts = useMemo(() => {
    const productMap = {};

    filteredOrdersByTime.forEach((order) => {
      order.items?.forEach((item) => {
        const id = item.product?._id || item.product?.id || item.productId || "unknown";
        const title = item.product?.name || item.product?.title || item.productName || "Unknown Product";

        if (!productMap[id]) {
          productMap[id] = { name: title, sales: 0, revenue: 0 };
        }

        productMap[id].sales += Number(item.quantity || 0);
        productMap[id].revenue += Number(item.price || item.totalPrice || 0) * Number(item.quantity || 0);
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [filteredOrdersByTime]);

  const lowStockProducts = useMemo(() => {
    return products.filter((product) => Number(product.stock ?? product.inventory ?? 0) <= 10);
  }, [products]);

  const filteredRecentOrders = useMemo(() => {
    const baseOrders = orders.slice(0, 8);
    if (!searchQuery.trim()) {
      return baseOrders;
    }

    const query = searchQuery.toLowerCase();
    return orders
      .filter((order) => {
        const orderRef = `${order.orderNumber || ""} ${order._id || ""}`.toLowerCase();
        const customerInfo = `${order.user?.firstName || ""} ${order.user?.lastName || ""} ${order.user?.email || ""}`.toLowerCase();
        return orderRef.includes(query) || customerInfo.includes(query);
      })
      .slice(0, 8);
  }, [orders, searchQuery]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.08 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  if (loading) {
    return (
      <div className="dashboard-loading-state">
        <div className="spinner" />
        <p>Syncing live operational data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      {error ? <div className="dashboard-error-banner">{error}</div> : null}

      <div className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Operations Center</p>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Real-time performance insights from products, orders, and customers.</p>
        </div>

        <div className="dashboard-actions">
          

          <label className="select-field">
            <FiCalendar />
            <select value={timeRange} onChange={(event) => setTimeRange(Number(event.target.value))}>
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={9}>Last 9 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </label>
        </div>
      </div>

      <motion.div className="metrics-grid" variants={containerVariants} initial="hidden" animate="visible">
        {stats.map((item, index) => (
          <motion.article key={index} className="metric-card" variants={cardVariants} whileHover={{ y: -4, scale: 1.01 }}>
            <div className="metric-card-header">
              <div className="metric-icon" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                {item.icon}
              </div>
              <span className="metric-pill">Live</span>
            </div>
            <p className="metric-title">{item.title}</p>
            <h2 className="metric-value">
              {item.prefix}
              <CountUp end={item.value} decimals={item.prefix === "$" ? 2 : 0} separator="," duration={1.4} />
            </h2>
            <div className="metric-accent" style={{ backgroundColor: item.color }} />
          </motion.article>
        ))}
      </motion.div>

      <div className="analytics-grid">
        <section className="analytics-card trend-card">
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
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A86A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A86A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={11} />
                <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" fontSize={11} />
                <Tooltip contentStyle={{ background: "#0F172A", color: "#FFF", borderRadius: "12px", border: "none" }} />
                <Area type="monotone" dataKey="Revenue" stroke="#C9A86A" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGradient)" />
                <Area type="monotone" dataKey="Profit" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#profitGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="analytics-card pie-card">
          <div className="card-heading">
            <div>
              <h3>Order Status Mix</h3>
              <p>Current fulfillment distribution across the selected window.</p>
            </div>
          </div>

          <div className="pie-wrapper">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={70} outerRadius={95} paddingAngle={3}>
                  {pieData.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#0F172A", color: "#FFF", borderRadius: "8px", border: "none" }} />
              </PieChart>
            </ResponsiveContainer>

            <div className="legend-list">
              {pieData.map((item, index) => (
                <div className="legend-item" key={item.name}>
                  <span className="legend-dot" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <span>{item.name}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {lowStockProducts.length > 0 ? (
        <section className="alert-card">
          <div className="alert-header">
            <div className="alert-icon">
              <FiAlertTriangle />
            </div>
            <div>
              <h3>Low stock notice</h3>
              <p>{lowStockProducts.length} items are at or below the threshold of 10 units.</p>
            </div>
          </div>

          <div className="alert-tags">
            {lowStockProducts.slice(0, 4).map((product, index) => (
              <span key={`${product._id || product.id || index}`} className="alert-tag">
                {product.name || product.title}
                <strong>{product.stock ?? product.inventory ?? 0} left</strong>
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="content-grid">
        <section className="panel-card">
          <div className="panel-card-header">
            <div>
              <h3>Recent Orders</h3>
              <p>Latest orders captured from the connected backend.</p>
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
                {filteredRecentOrders.length > 0 ? (
                  filteredRecentOrders.map((order, index) => {
                    const orderId = order._id || order.id || `ord-${index + 1}`;
                    const customerName = order.user
                      ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
                      : order.customer?.name || "Guest";
                    const statusClass = String(order.orderStatus || "Processing").toLowerCase();

                    return (
                      <tr key={orderId}>
                        <td>
                          <strong>{order.orderNumber || orderId.slice(0, 8)}</strong>
                        </td>
                        <td>
                          <div className="customer-cell">
                            <span>{customerName}</span>
                            <small>{order.user?.email || order.customer?.email || "No email available"}</small>
                          </div>
                        </td>
                        <td>
                          <strong>${Number(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                        </td>
                        <td>
                          <span className={`status-pill ${statusClass}`}>{order.orderStatus || "Processing"}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      No orders matched the current search.
                    </td>
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
              <p>Highest-volume products from the selected period.</p>
            </div>
          </div>

          <div className="ranking-list">
            {topProducts.length > 0 ? (
              topProducts.map((product, index) => (
                <div className="ranking-item" key={`${product.name}-${index}`}>
                  <div className="ranking-badge">#{index + 1}</div>
                  <div className="ranking-details">
                    <strong>{product.name}</strong>
                    <span>{product.sales} items sold</span>
                  </div>
                  <div className="ranking-value">${Number(product.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                </div>
              ))
            ) : (
              <div className="empty-state">No product sales were recorded for this range.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
