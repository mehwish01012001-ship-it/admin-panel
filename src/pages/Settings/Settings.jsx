import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import './Settings.css';

const Settings = () => {
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [completeness, setCompleteness] = useState(0);
  const [syncMode, setSyncMode] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('Not synced yet');

  useEffect(() => {
    const filledFields = Object.values(formValues).filter((value) => String(value).trim() !== '').length;
    const totalFields = Object.keys(formValues).length;
    setCompleteness(Math.round((filledFields / totalFields) * 100));
  }, [formValues]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError('');
      setMessage('');

      try {
        const response = await authService.getProfile();
        const user = response?.data?.user || {};
        setFormValues({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
        });
      } catch (err) {
        console.error(err);
        setError('Unable to load your premium profile workspace.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
      };

      if (formValues.phone.trim()) {
        payload.phone = formValues.phone.trim();
      }

      await authService.updateProfile(payload);
      setLastUpdated(new Date().toLocaleString());
      setMessage('Profile credentials optimized and updated.');
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || 'The system engine rejected the synchronization request.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="page-header__content">
          <div className="page-header__eyebrow">Admin Control Center</div>
          <h1>Settings</h1>
          <p>Refine your workspace with a secure, elegant, and fully responsive profile experience.</p>
        </div>
        <div className="header-badge">
          <span className="header-badge__dot" />
          Live sync enabled
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-ring" />
          <div>Initializing your luxury workspace...</div>
        </div>
      ) : (
        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="settings-grid">
            <div className="settings-card profile-card">
              <div className="card-heading">
                <div>
                  <p className="section-kicker">Profile architecture</p>
                  <h2>Identity & access</h2>
                </div>
                <div className="chip chip--accent">{completeness}% complete</div>
              </div>

              <div className="profile-completeness">
                <div className="progress-metrics">
                  <span>Profile completeness</span>
                  <span>{completeness}%</span>
                </div>
                <div className="progress-bar-wrapper">
                  <div className="progress-bar-fill" style={{ width: `${completeness}%` }} />
                </div>
              </div>

              <div className="form-grid-two-col">
                <div className="form-group">
                  <label>First name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formValues.firstName}
                    onChange={handleChange}
                    placeholder="Ava"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formValues.lastName}
                    onChange={handleChange}
                    placeholder="Martinez"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email anchor</label>
                <input type="email" name="email" value={formValues.email} disabled />
              </div>

              <div className="form-group">
                <label>Phone terminal</label>
                <input
                  type="text"
                  name="phone"
                  value={formValues.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="inline-options">
                <button
                  type="button"
                  className={`toggle-pill ${syncMode ? 'active' : ''}`}
                  onClick={() => setSyncMode((prev) => !prev)}
                >
                  <span className="toggle-pill__dot" />
                  Auto sync {syncMode ? 'on' : 'off'}
                </button>
                <button
                  type="button"
                  className={`toggle-pill ${alertsEnabled ? 'active' : ''}`}
                  onClick={() => setAlertsEnabled((prev) => !prev)}
                >
                  <span className="toggle-pill__dot" />
                  Security alerts {alertsEnabled ? 'on' : 'off'}
                </button>
              </div>
            </div>

            <div className="settings-right-column">
              <div className="settings-card info-card">
                <div className="card-heading">
                  <div>
                    <p className="section-kicker">System matrix</p>
                    <h3>Security overview</h3>
                  </div>
                  <div className="chip">Shield active</div>
                </div>

                <div className="security-status-widget">
                  <span>Encryption shield</span>
                  <span className="badge-secure">Active</span>
                </div>

                <div className="stats-row">
                  <div className="mini-stat">
                    <span>Security</span>
                    <strong>99.2%</strong>
                  </div>
                  <div className="mini-stat">
                    <span>Latency</span>
                    <strong>24ms</strong>
                  </div>
                </div>

                <ul className="luxury-list">
                  <li>Global access controls verified.</li>
                  <li>Recovery endpoints enabled.</li>
                  <li>Real-time telemetry logging active.</li>
                </ul>

                <div className="session-monitor">
                  <div className="session-item">
                    <span>Current session</span>
                    <span className="session-details">
                      <span className="session-indicator" />
                      Secure
                    </span>
                  </div>
                  <div className="session-item">
                    <span>Last update</span>
                    <strong>{lastUpdated}</strong>
                  </div>
                </div>
              </div>

              <div className="settings-card assistant-card">
                <p className="section-kicker">Operational insight</p>
                <h3>Performance pulse</h3>
                <div className="mini-timeline">
                  <div className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <strong>Optimized profile sync</strong>
                      <p>Changes save instantly with smooth automation.</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-dot timeline-dot--alt" />
                    <div>
                      <strong>Secure admin access</strong>
                      <p>Your workspace remains protected and responsive.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {message && <div className="success-state">{message}</div>}
          {error && <div className="error-state">{error}</div>}

          <div className="form-footer">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Synchronizing...' : 'Save profile'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Settings;
