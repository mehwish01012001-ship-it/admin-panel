import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import './AdminProfile.css';

const AdminProfile = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await authService.getProfile();
        setAdmin(response?.data?.user || null);
        setTimeout(() => setIsVisible(true), 120);
      } catch (err) {
        console.error(err);
        setError('Unable to securely connect to profile services.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="admin-profile-page">
        <div className="luxury-loader-card">
          <div className="loader-ring" />
          <p>Preparing your executive workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-profile-page">
        <div className="luxury-error-card">{error}</div>
      </div>
    );
  }

  return (
    <div className={`premium-profile-wrapper ${isVisible ? 'fade-in' : ''}`}>
      <header className="premium-header">
        <div className="header-text">
          <div className="eyebrow">Executive Console</div>
          <h1>Administrative Profile</h1>
          <p>System intelligence and secure control center.</p>
        </div>
        <div className="header-actions">
          <button className="action-btn-icon" type="button" aria-label="Settings">
            <span aria-hidden="true">⚙</span>
          </button>
          <button className="action-btn-icon logout" type="button" aria-label="Logout">
            <span aria-hidden="true">↩</span>
          </button>
        </div>
      </header>

      <div className="luxury-grid">
        <section className="grid-col-main">
          <div className="identity-card luxury-card">
            <div className="avatar-wrapper">
              <div className="avatar-ring">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(`${admin?.firstName || 'Admin'} ${admin?.lastName || ''}`)}&background=0D0D0D&color=fff&size=128`}
                  alt="Admin"
                />
                <div className="status-indicator-online" />
              </div>
            </div>

            <div className="identity-details">
              <h2>
                {`${admin?.firstName || ''} ${admin?.lastName || ''}`.trim() || 'Administrator'}
                <span className="verified-icon" aria-hidden="true">
                  ✓
                </span>
              </h2>
              <span className="role-badge">{admin?.role || 'Senior Administrator'}</span>
              <div className="location-tag">
                <span aria-hidden="true">📍</span> Global Headquarters
              </div>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">98%</span>
                <span className="stat-label">Efficiency</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">2.4k</span>
                <span className="stat-label">Actions</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">12</span>
                <span className="stat-label">Teams</span>
              </div>
            </div>
          </div>

          <div className="details-card luxury-card">
            <h3>Administrative credentials</h3>
            <div className="luxury-row">
              <div className="row-icon">
                <span aria-hidden="true">✉</span>
              </div>
              <div className="row-content">
                <label>Verified Email</label>
                <p>{admin?.email || 'Unavailable'}</p>
              </div>
            </div>
            <div className="luxury-row">
              <div className="row-icon">
                <span aria-hidden="true">🛡</span>
              </div>
              <div className="row-content">
                <label>Access Level</label>
                <p>Full-System Authority</p>
              </div>
            </div>
            <div className="luxury-row">
              <div className="row-icon">
                <span aria-hidden="true">📅</span>
              </div>
              <div className="row-content">
                <label>Enrolled Since</label>
                <p>
                  {admin?.createdAt
                    ? new Date(admin.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Jan 2024'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid-col-side">
          <div className="security-card luxury-card">
            <div className="card-header-flex">
              <h3>Security matrix</h3>
              <span className="gold-text" aria-hidden="true">
                ★
              </span>
            </div>
            <div className="completion-bar-container">
              <div className="completion-label">
                Profile integrity <span>85%</span>
              </div>
              <div className="bar-bg">
                <div className="bar-fill" style={{ width: '85%' }} />
              </div>
            </div>
            <div className="security-status">
              <div className="status-pill active">2FA active</div>
              <div className="status-pill active">End-to-end encryption</div>
            </div>
          </div>

          <div className="activity-card luxury-card">
            <h3>Recent intelligence</h3>
            <div className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-info">
                <p>System audit completed</p>
                <span>2 hours ago</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot" />
              <div className="timeline-info">
                <p>Permission matrix updated</p>
                <span>Yesterday</span>
              </div>
            </div>
            <button className="view-more-btn" type="button">
              Access logs
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminProfile;
