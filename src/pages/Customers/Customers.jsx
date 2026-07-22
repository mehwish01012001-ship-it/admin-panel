import React, { useEffect, useMemo, useState } from 'react';
import { FiSearch, FiStar, FiShield, FiUserPlus } from 'react-icons/fi';
import { customerService } from '../../services/customerService';
import './Customers.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('joinedDesc');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await customerService.getAllCustomers();
        setCustomers(response?.data?.customers || []);
      } catch (err) {
        console.error(err);
        setError('Unable to sync customer records.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const customerCounts = useMemo(() => {
    const active = customers.filter((c) => c.isActive).length;
    const inactive = customers.length - active;
    const recent = customers.filter((c) => {
      if (!c.createdAt) return false;
      const created = new Date(c.createdAt);
      const diff = Date.now() - created.getTime();
      return diff / (1000 * 60 * 60 * 24) <= 7;
    }).length;

    return { active, inactive, recent };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return customers
      .filter((customer) => {
        const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim().toLowerCase();
        const email = (customer.email || '').toLowerCase();
        
        const matchesQuery =
          normalizedQuery === '' ||
          fullName.includes(normalizedQuery) ||
          email.includes(normalizedQuery);

        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && customer.isActive) ||
          (statusFilter === 'inactive' && !customer.isActive);

        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return sortOrder === 'joinedAsc' ? dateA - dateB : dateB - dateA;
      });
  }, [customers, searchQuery, statusFilter, sortOrder]);

  return (
    <div className="cust-dir-wrapper">
      <div className="cust-dir-container">
        
        <header className="cust-dir-header">
          <h1>Customer Directory</h1>
        </header>

        <section className="cust-dir-metrics">
          <div className="cust-dir-card">
            <div className="cust-dir-icon theme-active">
              <FiStar />
            </div>
            <div>
              <span className="cust-dir-caption">Active</span>
              <h2 className="cust-dir-val">{customerCounts.active}</h2>
            </div>
          </div>

          <div className="cust-dir-card">
            <div className="cust-dir-icon theme-dormant">
              <FiShield />
            </div>
            <div>
              <span className="cust-dir-caption">Dormant</span>
              <h2 className="cust-dir-val">{customerCounts.inactive}</h2>
            </div>
          </div>

          <div className="cust-dir-card">
            <div className="cust-dir-icon theme-new">
              <FiUserPlus />
            </div>
            <div>
              <span className="cust-dir-caption">New (7 Days)</span>
              <h2 className="cust-dir-val">{customerCounts.recent}</h2>
            </div>
          </div>
        </section>

        <section className="cust-dir-panel">
          <div className="cust-dir-toolbar">
            <div className="cust-dir-search">
              <FiSearch className="cust-dir-search-icon" />
              <input
                type="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="cust-dir-filters">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>

              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                <option value="joinedDesc">Newest First</option>
                <option value="joinedAsc">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="cust-dir-table-wrap">
            {loading ? (
              <div className="cust-dir-empty cust-dir-loader">
                <span className="cust-dir-spinner"></span>
                <p>Loading customer data...</p>
              </div>
            ) : error ? (
              <div className="cust-dir-empty">
                <p>{error}</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="cust-dir-empty">
                <p>No customer records match your filters.</p>
              </div>
            ) : (
              <table className="cust-dir-table">
                <thead>
                  <tr>
                    <th>Account Holder</th>
                    <th>Email</th>
                    <th>Access Scope</th>
                    <th>Status</th>
                    <th>Total Spend</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const joinedDate = customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—';
                    const fullName =
                      `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Anonymous User';
                    const statusClass = customer.isActive ? 'status-active' : 'status-inactive';
                    const isNewUser = customer.createdAt
                      ? (Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 1
                      : false;
                    const isSelected =
                      selectedCustomer &&
                      (selectedCustomer._id || selectedCustomer.id) === (customer._id || customer.id);
                    
                    const rowClass = `cust-dir-row${isNewUser ? ' row-new' : ''}${isSelected ? ' row-selected' : ''}`;
                    const formattedSpend = customer.totalSpend ? `Rs. ${customer.totalSpend.toLocaleString()}` : 'Rs. 0';

                    return (
                      <tr
                        key={customer._id || customer.id}
                        className={rowClass}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <td className="cust-dir-cell-main">{fullName}</td>
                        <td className="cust-dir-cell-sub">{customer.email || '—'}</td>
                        <td>
                          <span className="cust-dir-tag">
                            {customer.role ? customer.role.toUpperCase() : 'USER'}
                          </span>
                        </td>
                        <td>
                          <span className={`cust-dir-status ${statusClass}`}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="cust-dir-cell-main">{formattedSpend}</td>
                        <td className="cust-dir-cell-sub">{joinedDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {selectedCustomer && (
          <div className="cust-dir-modal-backdrop" onClick={() => setSelectedCustomer(null)}>
            <div className="cust-dir-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cust-dir-modal-top">
                <div>
                  <span className="cust-dir-caption">Customer Details</span>
                  <h3>
                    {`${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || 'Anonymous User'}
                  </h3>
                </div>
                <button className="cust-dir-modal-close" onClick={() => setSelectedCustomer(null)}>
                  ×
                </button>
              </div>

              <div className="cust-dir-modal-body">
                <div className="cust-dir-modal-field">
                  <label>Email</label>
                  <span>{selectedCustomer.email || '—'}</span>
                </div>
                <div className="cust-dir-modal-field">
                  <label>Access Scope</label>
                  <span>{selectedCustomer.role ? selectedCustomer.role.toUpperCase() : 'USER'}</span>
                </div>
                <div className="cust-dir-modal-field">
                  <label>Status</label>
                  <span>{selectedCustomer.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="cust-dir-modal-field">
                  <label>Total Spend</label>
                  <span>{selectedCustomer.totalSpend ? `Rs. ${selectedCustomer.totalSpend.toLocaleString()}` : 'Rs. 0'}</span>
                </div>
                <div className="cust-dir-modal-field">
                  <label>Registration Date</label>
                  <span>
                    {selectedCustomer.createdAt
                      ? new Date(selectedCustomer.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </span>
                </div>
                <div className="cust-dir-modal-field">
                  <label>Address</label>
                  <span>{selectedCustomer.address || '—'}</span>
                </div>
                <div className="cust-dir-modal-field">
                  <label>Mobile Number</label>
                  <span>{selectedCustomer.phone || selectedCustomer.mobileNumber || '—'}</span>
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