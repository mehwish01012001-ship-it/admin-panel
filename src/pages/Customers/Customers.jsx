import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { FiSearch, FiStar, FiShield, FiUserPlus, FiX, FiUser } from 'react-icons/fi';
import { customerService } from '../../services/customerService';
import './Customers.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('joinedDesc');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchCustomers = async () => {
      try {
        const response = await customerService.getAllCustomers();
        if (isMounted) {
          setCustomers(response?.data?.customers || []);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('Unable to fetch customer records.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  const customerCounts = useMemo(() => {
    let active = 0;
    let recent = 0;
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      if (customer.isActive) active++;
      
      if (customer.createdAt) {
        const created = new Date(customer.createdAt).getTime();
        if (now - created <= sevenDaysMs) recent++;
      }
    }

    return {
      active,
      inactive: customers.length - active,
      recent,
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim().toLowerCase();
        const email = (customer.email || '').toLowerCase();
        
        const matchesQuery = !query || fullName.includes(query) || email.includes(query);
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && customer.isActive) ||
          (statusFilter === 'inactive' && !customer.isActive);

        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return sortOrder === 'joinedAsc' ? dateA - dateB : dateB - dateA;
      });
  }, [customers, searchQuery, statusFilter, sortOrder]);

  const handleRowClick = useCallback((customer) => {
    setSelectedCustomer(customer);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'Rs. 0';
    return `Rs. ${Number(amount).toLocaleString('en-PK')}`;
  };

  return (
    <div className="customer-directory-wrapper">
      <div className="directory-container">
        
        <header className="directory-header">
          <div className="header-titles">
            <span className="header-badge">Management</span>
            <h1>Customer Directory</h1>
          </div>
        </header>

        <section className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-box active-box">
              <FiStar />
            </div>
            <div className="metric-details">
              <span className="metric-label">Active Customers</span>
              <h2 className="metric-value">{customerCounts.active}</h2>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box inactive-box">
              <FiShield />
            </div>
            <div className="metric-details">
              <span className="metric-label">Inactive Accounts</span>
              <h2 className="metric-value">{customerCounts.inactive}</h2>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box new-box">
              <FiUserPlus />
            </div>
            <div className="metric-details">
              <span className="metric-label">Joined (7 Days)</span>
              <h2 className="metric-value">{customerCounts.recent}</h2>
            </div>
          </div>
        </section>

        <section className="directory-content-panel">
          <div className="panel-toolbar">
            <div className="search-bar-group">
              <FiSearch className="search-icon" />
              <input
                type="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select-dropdown"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="select-dropdown"
              >
                <option value="joinedDesc">Newest First</option>
                <option value="joinedAsc">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            {loading ? (
              <div className="feedback-container">
                <span className="loading-spinner"></span>
                <p>Loading records...</p>
              </div>
            ) : error ? (
              <div className="feedback-container error-state">
                <p>{error}</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="feedback-container empty-state">
                <p>No customer records match your filters.</p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <table className="directory-table desktop-only">
                  <thead>
                    <tr>
                      <th>Account Holder</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined Date</th>
                      <th>Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => {
                      const id = customer._id || customer.id;
                      const joinedDate = customer.createdAt 
                        ? new Date(customer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) 
                        : '—';
                      const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unnamed User';
                      const isSelected = selectedCustomer && (selectedCustomer._id || selectedCustomer.id) === id;

                      return (
                        <tr
                          key={id}
                          className={`table-row ${isSelected ? 'row-selected' : ''}`}
                          onClick={() => handleRowClick(customer)}
                        >
                          <td className="cell-bold">{fullName}</td>
                          <td className="cell-subtle">{customer.email || '—'}</td>
                          <td>
                            <span className="role-pill">{customer.role ? customer.role.toUpperCase() : 'USER'}</span>
                          </td>
                          <td>
                            <span className={`status-pill ${customer.isActive ? 'status-active' : 'status-inactive'}`}>
                              {customer.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="cell-subtle">{joinedDate}</td>
                          <td className="cell-bold">{formatCurrency(customer.totalSpent || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Mobile View Card List */}
                <div className="mobile-cards-list mobile-only">
                  {filteredCustomers.map((customer) => {
                    const id = customer._id || customer.id;
                    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unnamed User';
                    
                    return (
                      <div 
                        key={id} 
                        className="mobile-customer-card"
                        onClick={() => handleRowClick(customer)}
                      >
                        <div className="card-top">
                          <div className="user-avatar-placeholder">
                            <FiUser />
                          </div>
                          <div className="user-main-info">
                            <h4>{fullName}</h4>
                            <p>{customer.email || '—'}</p>
                          </div>
                          <span className={`status-pill ${customer.isActive ? 'status-active' : 'status-inactive'}`}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="card-bottom">
                          <span>Role: {customer.role ? customer.role.toUpperCase() : 'USER'}</span>
                          <strong>{formatCurrency(customer.totalSpent || 0)}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {selectedCustomer && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="modal-eyebrow">Customer Details</span>
                  <h3>
                    {`${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || 'Unnamed User'}
                  </h3>
                </div>
                <button className="modal-close-btn" onClick={closeModal} aria-label="Close modal">
                  <FiX />
                </button>
              </div>

              <div className="modal-body-grid">
                <div className="modal-data-row">
                  <span>Name</span>
                  <strong>
                    {`${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || 'Unnamed User'}
                  </strong>
                </div>
                <div className="modal-data-row">
                  <span>Email</span>
                  <strong>{selectedCustomer.email || '—'}</strong>
                </div>
                <div className="modal-data-row">
                  <span>Access Level</span>
                  <strong>{selectedCustomer.role ? selectedCustomer.role.toUpperCase() : 'USER'}</strong>
                </div>
                <div className="modal-data-row">
                  <span>Account Status</span>
                  <strong>{selectedCustomer.isActive ? 'Active' : 'Inactive'}</strong>
                </div>
                <div className="modal-data-row">
                  <span>Total Spent</span>
                  <strong>{formatCurrency(selectedCustomer.totalSpent || 0)}</strong>
                </div>
                <div className="modal-data-row">
                  <span>Joined Date</span>
                  <strong>
                    {selectedCustomer.createdAt
                      ? new Date(selectedCustomer.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </strong>
                </div>
                <div className="modal-data-row">
                  <span>Address</span>
                  <strong>{selectedCustomer.address || '—'}</strong>
                </div>
                <div className="modal-data-row">
                  <span>Phone</span>
                  <strong>{selectedCustomer.phone || selectedCustomer.mobileNumber || '—'}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Customers;