import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authService } from '../../services/authService';
import { setUser } from '../../redux/slices/authSlice';
import './AdminLogin.css';

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData);
      
      if (response?.data?.user?.role !== 'admin') {
        setError('Admin access required.');
      } else {
        dispatch(
          setUser({
            token: response.data.token,
            user: response.data.user
          })
        );
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="rq-admin-login-wrapper">
      <div className="rq-admin-login-card">
        <h1 className="rq-admin-login-title">Login</h1>

        {error && <div className="rq-admin-error-box">{error}</div>}

        <form onSubmit={handleSubmit} className="rq-admin-form">
          <div className="rq-admin-input-group">
            <label htmlFor="email">Username</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email"
              required
              autoComplete="email"
            />
          </div>

          <div className="rq-admin-input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="rq-admin-submit-btn"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </main>
  );
};

export default AdminLogin;