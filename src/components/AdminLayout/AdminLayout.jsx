import React, { useEffect, useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import Topbar from "../Topbar/Topbar";
import { clearUser } from "../../redux/slices/authSlice";
import "./AdminLayout.css";

const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
const WARNING_WINDOW = 30 * 1000;

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Reset timers ko alag function banaya taake Continue button pr bhi use ho sake
  const handleResetTimers = useCallback(() => {
    setShowSessionModal(false);
    setRemainingSeconds(30);
  }, []);

  useEffect(() => {
    let warningTimer = null;
    let countdownTimer = null;
    let timeoutTimer = null;

    const startTimers = () => {
      setShowSessionModal(false);
      setRemainingSeconds(30);
      
      if (warningTimer) window.clearTimeout(warningTimer);
      if (countdownTimer) window.clearInterval(countdownTimer);
      if (timeoutTimer) window.clearTimeout(timeoutTimer);

      warningTimer = window.setTimeout(() => {
        setShowSessionModal(true);
        setRemainingSeconds(30);

        countdownTimer = window.setInterval(() => {
          setRemainingSeconds((prev) => {
            if (prev <= 1) {
              window.clearInterval(countdownTimer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, INACTIVITY_TIMEOUT - WARNING_WINDOW);

      timeoutTimer = window.setTimeout(() => {
        dispatch(clearUser());
        navigate("/login", { replace: true });
      }, INACTIVITY_TIMEOUT);
    };

    const activityEvents = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    
    // Sirf tabhi reset karein jab warning modal open NAL HO
    const handleActivity = () => {
      if (!showSessionModal) {
        startTimers();
      }
    };

    activityEvents.forEach((event) => window.addEventListener(event, handleActivity));
    startTimers();

    return () => {
      activityEvents.forEach((event) => window.removeEventListener(event, handleActivity));
      if (warningTimer) window.clearTimeout(warningTimer);
      if (countdownTimer) window.clearInterval(countdownTimer);
      if (timeoutTimer) window.clearTimeout(timeoutTimer);
    };
  }, [dispatch, navigate, showSessionModal]);

  return (
    <div className="rq-admin-layout">
      {/* Premium Background Blobs */}
      <div className="rq-bg rq-bg-1"></div>
      <div className="rq-bg rq-bg-2"></div>
      <div className="rq-bg rq-bg-3"></div>

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {showSessionModal && (
        <div className="session-expire-modal">
          <div className="session-expire-card">
            <h3>Session Expiring Soon</h3>
            <p>You have been inactive for a while. You will be logged out in {remainingSeconds} seconds.</p>
            <button
              type="button"
              onClick={handleResetTimers}
            >
              Continue Session
            </button>
          </div>
        </div>
      )}

      <main className={`rq-admin-main ${collapsed ? "collapsed" : ""}`}>
        <Topbar onMobileMenu={() => setMobileSidebarOpen((prev) => !prev)} />
        <div className="rq-admin-content">
          <div className="rq-content-wrapper">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;