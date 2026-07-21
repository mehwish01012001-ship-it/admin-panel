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
        setError('Unable to securely sync customer records.');
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
    <div className="premium-crm-view">
      <div className="crm-workspace">
        
        <header className="crm-hero-header">
          <div className="hero-meta">
         
            <h1>Customer Directory</h1>

          </div>
        </header>

        <section className="metric-strip">
          <div className="metric-tile">
            <div className="tile-icon-wrapper active-gradient">
              <FiStar />
            </div>
            <div className="tile-body">
              <span className="tile-caption">Active</span>
              <h2 className="tile-num">{customerCounts.active}</h2>
            </div>
          </div>

          <div className="metric-tile">
            <div className="tile-icon-wrapper inactive-gradient">
              <FiShield />
            </div>
            <div className="tile-body">
              <span className="tile-caption">Dormant Nodes</span>
              <h2 className="tile-num">{customerCounts.inactive}</h2>
            </div>
          </div>

          <div className="metric-tile">
            <div className="tile-icon-wrapper new-gradient">
              <FiUserPlus />
            </div>
            <div className="tile-body">
              <span className="tile-caption">Onboarded (7 Days)</span>
              <h2 className="tile-num">{customerCounts.recent}</h2>
            </div>
          </div>
        </section>

        <section className="datatable-panel">
          <div className="panel-control-bar">
            <div className="panel-intent">
           

            </div>
            
            <div className="toolbar-actions">
              <div className="premium-searchbox">
                <FiSearch className="search-lens" />
                <input
                  type="search"
                  placeholder="Query identity or communications match..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-dropdowns">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">Filter: All Statuses</option>
                  <option value="active">Filter: Active Active</option>
                  <option value="inactive">Filter: Inactive</option>
                </select>

               
              </div>
            </div>
          </div>

          <div className="table-viewport-wrapper">
            {loading ? (
              <div className="feedback-state loading-spin">
                <span className="spinner-indicator"></span>
                <p>Establishing encrypted pipeline to workspace datastore...</p>
              </div>
            ) : error ? (
              <div className="feedback-state failure-alert">
                <p>{error}</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="feedback-state clear-alert">
                <p>Zero records evaluate valid against active query params.</p>
              </div>
            ) : (
              <table className="workspace-table">
                <thead>
                  <tr>
                    <th>Account Holder</th>
                    <th>Email</th>
                    <th>Access Scope</th>
                    <th>Lifecycle State</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const joinedDate = customer.createdAt ? new Date(customer.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
                    const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Anonymous Node';
                    const pillStatus = customer.isActive ? 'state-badge live' : 'state-badge asleep';
                    const isNewUser = customer.createdAt
                      ? (Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 1
                      : false;
                    const isSelected = selectedCustomer && (selectedCustomer._id || selectedCustomer.id) === (customer._id || customer.id);
                    const rowClassName = `row-interactive${isNewUser ? ' new-user-row' : ''}${isSelected ? ' selected-row' : ''}`;
                    
                    return (
                      <tr
                        key={customer._id || customer.id}
                        className={rowClassName}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <td className="cell-primary">{fullName}</td>
                        <td className="cell-secondary">{customer.email || '—'}</td>
                        <td className="cell-tag">
                          <span className="scope-tag">{customer.role ? customer.role.toUpperCase() : 'USER'}</span>
                        </td>
                        <td>
                          <span className={pillStatus}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="cell-date">{joinedDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {selectedCustomer && (
          <div className="customer-modal-backdrop" onClick={() => setSelectedCustomer(null)}>
            <div className="customer-modal-card" onClick={(event) => event.stopPropagation()}>
              <div className="customer-modal-header">
                <div>
                  <p className="customer-modal-eyebrow">Customer Detail</p>
                  <h3>
                    {`${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || 'Anonymous Node'}
                  </h3>
                </div>
                <button className="customer-modal-close" onClick={() => setSelectedCustomer(null)}>
                  ×
                </button>
              </div>

              <div className="customer-modal-grid">
                <div className="customer-modal-item">
                  <span>Account Holder</span>
                  <strong>
                    {`${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`.trim() || 'Anonymous Node'}
                  </strong>
                </div>
                <div className="customer-modal-item">
                  <span>Email</span>
                  <strong>{selectedCustomer.email || '—'}</strong>
                </div>
                <div className="customer-modal-item">
                  <span>Access Scope</span>
                  <strong>{selectedCustomer.role ? selectedCustomer.role.toUpperCase() : 'USER'}</strong>
                </div>
                <div className="customer-modal-item">
                  <span>Lifecycle State</span>
                  <strong>{selectedCustomer.isActive ? 'Active' : 'Inactive'}</strong>
                </div>
                <div className="customer-modal-item">
                  <span>Registration Date</span>
                  <strong>
                    {selectedCustomer.createdAt
                      ? new Date(selectedCustomer.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </strong>
                </div>
                <div className="customer-modal-item">
                  <span>Address</span>
                  <strong>{selectedCustomer.address || '—'}</strong>
                </div>
                <div className="customer-modal-item">
                  <span>Mobile Number</span>
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