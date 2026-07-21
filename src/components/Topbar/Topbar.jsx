import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBell,
  FiSettings,
  FiChevronDown,
  FiMenu,
  FiUser,
  FiLogOut,
  FiAlertTriangle,
  FiPackage,
} from "react-icons/fi";
import { useDispatch } from "react-redux";
import { orderService } from "../../services/orderService";
import productService from "../../services/productService";
import { clearUser } from "../../redux/slices/authSlice";

import "./Topbar.css";

const STORAGE_KEY = "rq-admin-topbar-notifications";

const createAlert = (id, type, title, description, route, payload = {}) => ({
  id,
  type,
  title,
  description,
  route,
  payload,
  isRead: false,
  createdAt: Date.now(),
});

const Topbar = ({
  onMobileMenu,
  user = {
    name: "RQ Admin",
    role: "Administrator",
    email: "administrator@rqfashion.com",
    avatarUrl: "https://i.pravatar.cc/200?img=12",
  },
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  });

  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const unreadCount = alerts.filter((item) => !item.isRead).length;

  useEffect(() => {
    const closeDropdown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeDropdown);
    return () => document.removeEventListener("mousedown", closeDropdown);
  }, []);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const [ordersResponse, productsResponse] = await Promise.allSettled([
          orderService.getAllOrders({ limit: 10 }),
          productService.getAllProducts({ limit: 100 }),
        ]);

        const orders = ordersResponse.status === "fulfilled"
          ? (ordersResponse.value?.data?.orders || ordersResponse.value?.data?.data?.orders || ordersResponse.value?.orders || [])
          : [];

        const products = productsResponse.status === "fulfilled"
          ? (productsResponse.value?.data?.products || productsResponse.value?.data?.data?.products || productsResponse.value?.products || [])
          : [];

        const nextAlerts = [];

        products
          .filter((product) => Number(product.stock || product.inventory || 0) <= Number(product.lowStockThreshold || 10))
          .slice(0, 3)
          .forEach((product) => {
            nextAlerts.push(
              createAlert(
                `stock-${product._id || product.id || product.sku}`,
                "warning",
                "Low stock alert",
                `${product.name || "Product"} has only ${product.stock || product.inventory || 0} units left`,
                "/inventory"
              )
            );
          });

        orders.slice(0, 3).forEach((order) => {
          const orderId = order._id || order.id;
          nextAlerts.push(
            createAlert(
              `order-${orderId}`,
              "info",
              "New order placed",
              `${order.customerName || "Customer"} placed order #${order.orderNumber || orderId || "N/A"}`,
              "/orders",
              { orderId }
            )
          );
        });

        setAlerts((prev) => {
          const merged = [...prev];

          nextAlerts.forEach((alert) => {
            const existingIndex = merged.findIndex((item) => item.id === alert.id);
            if (existingIndex >= 0) {
              merged[existingIndex] = {
                ...merged[existingIndex],
                ...alert,
                isRead: merged[existingIndex].isRead ?? alert.isRead,
              };
            } else {
              merged.push(alert);
            }
          });

          return merged.slice(0, 8);
        });
      } catch (error) {
        // Ignore notification loading errors.
      }
    };

    void loadAlerts();

    const timer = window.setInterval(() => {
      void loadAlerts();
    }, 20000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    } catch (error) {
      // Ignore storage issues.
    }
  }, [alerts]);

  const handleNotificationClick = (item) => {
    setNotificationsOpen(false);
    setAlerts((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, isRead: true } : entry)));
    navigate(item.route, { state: item.payload || {} });
  };

  const handleProfileNavigate = () => {
    setProfileOpen(false);
    navigate("/profile");
  };

  const handleSettingsNavigate = () => {
    setNotificationsOpen(false);
    navigate("/settings");
  };

  const handleLogout = () => {
    setProfileOpen(false);
    setNotificationsOpen(false);
    dispatch(clearUser());
    navigate("/login", { replace: true });
  };

  return (
    <header className="premium-topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onMobileMenu}
          aria-label="Toggle Mobile Menu"
        >
          <FiMenu />
        </button>

        <div className="logo-container">
          <span className="logo-text-brand">Rq</span>
          <span className="logo-text-sub">Fashion</span>
          <div className="logo-underline"></div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="notify-wrapper" ref={notificationRef}>
          <button
            className={`topbar-icon notify ${notificationsOpen ? "active" : ""}`}
            aria-label="Notifications"
            onClick={() => setNotificationsOpen((prev) => !prev)}
          >
            <FiBell />
            {unreadCount > 0 && <span>{unreadCount}</span>}
          </button>

          {notificationsOpen && (
            <div className="notification-dropdown" role="menu">
              <div className="notification-header">
                <h4>Alerts</h4>
                <p>{unreadCount} new updates</p>
              </div>

              <div className="notification-list">
                {alerts.length > 0 ? (
                  alerts.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`notification-item ${item.type} ${item.isRead ? "read" : "unread"}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      <div className="notification-icon">
                        {item.type === "warning" ? <FiAlertTriangle /> : <FiPackage />}
                      </div>
                      <div className="notification-content">
                        <strong>{item.title}</strong>
                        <span>{item.description}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="notification-empty">No alerts right now.</div>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          className="topbar-icon settings"
          aria-label="Settings"
          onClick={handleSettingsNavigate}
        >
          <FiSettings />
        </button>

        <div className="profile-wrapper" ref={profileRef}>
          <button
            className="profile-trigger"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
          >
            <div className="profile-avatar">
              <img src={user.avatarUrl} alt={user.name} />
              <span className="online-dot"></span>
            </div>

            <div className="profile-info">
              <h4>{user.name}</h4>
              <p>{user.role}</p>
            </div>

            <FiChevronDown className={`chevron-icon ${profileOpen ? "rotate" : ""}`} />
          </button>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <img src={user.avatarUrl} alt={user.name} />
                <div className="dropdown-meta">
                  <h4>{user.name}</h4>
                  <p>{user.email}</p>
                </div>
              </div>

              <div className="dropdown-body">
                <button className="dropdown-item" onClick={handleProfileNavigate}>
                  <FiUser />
                  <span>Profile</span>
                </button>
              </div>

              <div className="dropdown-divider"></div>

              <div className="dropdown-footer">
                <button className="logout-btn dropdown-item" onClick={handleLogout}>
                  <FiLogOut />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;