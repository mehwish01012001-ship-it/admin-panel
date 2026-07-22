import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  FiAlertTriangle,
  FiCalendar,
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

const parseApiResponseList = (response, fallbackKey) => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[fallbackKey])) return payload[fallbackKey];
  if (Array.isArray(payload?.data?.[fallbackKey])) return payload.data[fallbackKey];
  return [];
};

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState(3);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardMetrics = async () => {
      try {
        const [productsRes, ordersRes, customersRes] = await Promise.all([
          productService.getAllProducts({ limit: 200 }),
          orderService.getAllOrders({ limit: 200 }),
          customerService.getAllCustomers(),
        ]);

        if (isMounted) {
          setProducts(parseApiResponseList(productsRes, "products"));
          setOrders(parseApiResponseList(ordersRes, "orders"));
          setCustomers(parseApiResponseList(customersRes, "customers"));
        }
      } catch (err) {
        if (isMounted) {
          console.error("Dashboard hydration error:", err);
          setError("Unable to sync live analytics engine.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDashboardMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - timeRange);

    return orders.filter((order) => {
      if (!order.createdAt) return false;
      const orderDate = new Date(order.createdAt);
      return !isNaN(orderDate.getTime()) && orderDate >= cutoffDate;
    });
  }, [orders, timeRange]);

  const stats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

    return [
      {
        id: "revenue",
        title: "Total Revenue",
        value: totalRevenue,
        icon: <span style={{ fontWeight: 800, fontSize: "15px" }}>Rs.</span>,
        prefix: "Rs. ",
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
        value: customers.length,
        icon: <FiUsers />,
        prefix: "",
        color: "#EC4899",
      },
      {
        id: "products",
        title: "Catalog Products",
        value: products.length,
        icon: <FiPackage />,
        prefix: "",
        color: "#10B981",
      },
    ];
  }, [filteredOrders, customers.length, products.length]);

  const chartData = useMemo(() => {
    const monthlyData = {};

    filteredOrders.forEach((order) => {
      const date = order.createdAt ? new Date(order.createdAt) : null;
      if (!date || isNaN(date.getTime())) return;

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = date.toLocaleString("en-US", { month: "short", year: "2-digit" });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          name: monthLabel,
          Revenue: 0,
          Profit: 0,
          key: monthKey,
        };
      }

      const rev = Number(order.totalAmount || 0);
      monthlyData[monthKey].Revenue += rev;
      monthlyData[monthKey].Profit += rev * 0.22;
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key, ...rest }) => rest);
  }, [filteredOrders]);

  const pieData = useMemo(() => {
    const counts = { Delivered: 0, Processing: 0, Pending: 0, Cancelled: 0 };

    filteredOrders.forEach((order) => {
      const statusRaw = String(order.orderStatus || "Processing").toLowerCase();
      const status = statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1);

      if (counts[status] !== undefined) {
        counts[status] += 1;
      } else {
        counts.Processing += 1;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const topProducts = useMemo(() => {
    const productMap = {};

    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const id = item.product?._id || item.product?.id || item.productId || "unknown";
        const title = item.product?.name || item.product?.title || item.productName || "Product";

        if (!productMap[id]) {
          productMap[id] = { name: title, sales: 0, revenue: 0 };
        }

        const qty = Number(item.quantity || 0);
        const unitPrice = Number(item.price || item.totalPrice || 0);

        productMap[id].sales += qty;
        productMap[id].revenue += unitPrice * qty;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);
  }, [filteredOrders]);

  const lowStockProducts = useMemo(() => {
    return products.filter((item) => Number(item.stock ?? item.inventory ?? 0) <= 10);
  }, [products]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 8);
  }, [orders]);

  return (
    <div className="dashboard-shell">
      {error && <div className="dashboard-error-banner">{error}</div>}

      {/* Main Header */}
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Operations Hub</p>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Real-time revenue, order flow, and product metrics.</p>
        </div>

        <div className="dashboard-actions">
          <label className="select-field">
            <FiCalendar />
            <select
              aria-label="Time Filter"
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <option value={3}>Last 3 months</option>
              <option value={6}>Last 6 months</option>
              <option value={9}>Last 9 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </label>
        </div>
      </header>

      {/* Top Stat Cards */}
      <section className="metrics-grid">
        {stats.map((item) => (
          <motion.article
            key={item.id}
            className="metric-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="metric-card-header">
              <div
                className="metric-icon"
                style={{ backgroundColor: `${item.color}15`, color: item.color }}
              >
                {item.icon}
              </div>
              <span className="metric-pill">Live</span>
            </div>
            <p className="metric-title">{item.title}</p>
            <h2 className="metric-value">
              {loading ? (
                <div className="skeleton" style={{ width: "100px", height: "30px" }} />
              ) : (
                <>
                  {item.prefix}
                  {item.id === "revenue"
                    ? item.value.toFixed(2)
                    : item.value.toLocaleString()}
                </>
              )}
            </h2>
            <div className="metric-accent" style={{ backgroundColor: item.color }} />
          </motion.article>
        ))}
      </section>

      {/* Analytics Visualization Section */}
      <div className="analytics-grid">
        <section className="analytics-card">
          <div className="card-heading">
            <div>
              <h3>Performance Trajectory</h3>
              <p>Revenue and profit movement over selected timeline.</p>
            </div>
            <span className="chip">
              <FiTrendingUp /> Live
            </span>
          </div>

          <div className="chart-wrapper">
            {loading ? (
              <div className="skeleton skeleton-chart" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
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
                  <Tooltip
                    formatter={(value) => [`Rs. ${Number(value).toLocaleString()}`, ""]}
                    contentStyle={{ background: "#0F172A", color: "#FFF", borderRadius: "8px", border: "none" }}
                  />
                  <Area type="monotone" dataKey="Revenue" stroke="#C9A86A" strokeWidth={2} fillOpacity={1} fill="url(#revenueGradient)" />
                  <Area type="monotone" dataKey="Profit" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#profitGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="analytics-card">
          <div className="card-heading">
            <div>
              <h3>Order Status Mix</h3>
              <p>Distribution breakdown across orders.</p>
            </div>
          </div>

          <div className="pie-wrapper">
            {loading ? (
              <div className="skeleton skeleton-chart" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={85} paddingAngle={4}>
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

      {/* Stock Warning Banner */}
      {lowStockProducts.length > 0 && (
        <section className="alert-card">
          <div className="alert-header">
            <div className="alert-icon">
              <FiAlertTriangle />
            </div>
            <div>
              <h3>Low stock alert</h3>
              <p>{lowStockProducts.length} items reaching inventory threshold limits.</p>
            </div>
          </div>

          <div className="alert-tags">
            {lowStockProducts.slice(0, 4).map((item, idx) => (
              <span key={item._id || item.id || idx} className="alert-tag">
                {item.name || item.title}
                <strong>{item.stock ?? item.inventory ?? 0} remaining</strong>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity Section */}
      <div className="content-grid">
        <section className="panel-card">
          <div className="panel-card-header">
            <div>
              <h3>Recent Orders</h3>
              <p>Latest synced consumer transactions.</p>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, idx) => {
                    const id = order._id || order.id || `ORD-${idx + 1}`;
                    const name = order.user
                      ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim()
                      : order.customer?.name || "Guest";
                    const statusClass = String(order.orderStatus || "Processing").toLowerCase();

                    return (
                      <tr key={id}>
                        <td>
                          <strong>{order.orderNumber || id.slice(0, 8)}</strong>
                        </td>
                        <td>
                          <div className="customer-cell">
                            <span>{name}</span>
                            <small>{order.user?.email || order.customer?.email || "No email"}</small>
                          </div>
                        </td>
                        <td>
                          <strong>Rs. {Number(order.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
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
                      No order history available.
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
              <p>Highest unit performing inventory.</p>
            </div>
          </div>

          <div className="ranking-list">
            {topProducts.length > 0 ? (
              topProducts.map((item, idx) => (
                <div className="ranking-item" key={`${item.name}-${idx}`}>
                  <div className="ranking-badge">#{idx + 1}</div>
                  <div className="ranking-details">
                    <strong>{item.name}</strong>
                    <span>{item.sales} units sold</span>
                  </div>
                  <div className="ranking-value">
                    Rs. {Number(item.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No product performance data found.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;