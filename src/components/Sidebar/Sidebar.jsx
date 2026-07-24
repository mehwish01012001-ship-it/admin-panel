import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  FiMenu,
  FiX,
  FiHome,
  FiBox,
  FiGrid,
  FiShoppingCart,
  FiUsers,
  FiImage,
  FiPackage,
  FiBarChart2,
  FiMessageSquare,
  FiSettings,
  FiUser,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { clearUser } from "../../redux/slices/authSlice";
import "./Sidebar.css";

const NAVIGATION_SCHEMA = [
  { path: "/dashboard", label: "Dashboard", icon: FiHome },
  { path: "/products", label: "Products", icon: FiBox },
  { path: "/categories", label: "Categories", icon: FiGrid },
  { path: "/orders", label: "Orders", icon: FiShoppingCart },
  { path: "/customers", label: "Customers", icon: FiUsers },
  { path: "/inventory", label: "Inventory", icon: FiPackage },
  { path: "/hero-slider", label: "Hero Slider", icon: FiImage },
  { path: "/contact-messages", label: "Contact Messages", icon: FiMessageSquare },
  { path: "/sales-reports", label: "Reports", icon: FiBarChart2 },
  { path: "/settings", label: "Settings", icon: FiSettings },
  { path: "/profile", label: "Profile", icon: FiUser },
];

const Sidebar = ({ collapsed, setCollapsed }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(clearUser());
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* Mobile Toggle Trigger */}
      <button
        className="sidebar-mobile-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open Navigation Menu"
      >
        <FiMenu />
      </button>

      {/* Backdrop Layer */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Container */}
      <aside
        className={`premium-sidebar ${collapsed ? "sidebar-collapsed" : ""} ${
          mobileOpen ? "sidebar-mobile-open" : ""
        }`}
      >
        <div className="sidebar-glow-field" />

        {/* Header Block */}
        <header className="sidebar-header">
          <div className="sidebar-brand-wrapper">
           
            <div className="brand-text-zone">
              <h2>RQ Fashion</h2>
              <span>Management Suite</span>
            </div>
          </div>

          <div className="sidebar-actions">
            {/* Desktop Collapse Trigger */}
            <button
              className="sidebar-control-btn desktop-only"
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </button>

            {/* Mobile Close Trigger */}
            <button
              className="sidebar-control-btn mobile-only"
              onClick={() => setMobileOpen(false)}
              aria-label="Close Navigation Menu"
            >
              <FiX />
            </button>
          </div>
        </header>

        {/* Authenticated User Context Card */}
        <div className="sidebar-profile-card">
          <div className="profile-avatar-wrapper">
            <img
              src="https://i.pravatar.cc/200?img=12"
              alt="Authenticated Administrator"
            />
            <span className="live-status-badge" />
          </div>

          <div className="profile-meta-data">
            <h4>Admin Panel</h4>
            <p>Super Administrator</p>
          </div>
        </div>

        {/* Navigation Core */}
        <div className="sidebar-section-divider">
          <span>Navigation</span>
        </div>

        <nav className="sidebar-navigation-links">
          {NAVIGATION_SCHEMA.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `sidebar-nav-item ${isActive ? "active-route" : ""}`
                }
              >
                <div className="nav-item-icon-box">
                  <IconComponent />
                </div>
                <span className="nav-item-text-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <footer className="sidebar-footer-action-zone">
          <button className="sidebar-logout-action" onClick={handleLogout}>
            <div className="logout-icon-box">
              <FiLogOut />
            </div>
            <span className="logout-text-label">Exit Application</span>
          </button>
        </footer>
      </aside>
    </>
  );
};

export default Sidebar;