import React from 'react';
import './CustomerTable.css';

const CustomerTable = ({ customers }) => (
  <div className="table-card">
    <table className="customer-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Orders</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {customers.map((customer) => (
          <tr key={customer.id}>
            <td>{customer.name}</td>
            <td>{customer.email}</td>
            <td>{customer.orders}</td>
            <td>{customer.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CustomerTable;
