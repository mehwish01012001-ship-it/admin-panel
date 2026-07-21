import React from 'react';
import './OrderTable.css';

const OrderTable = ({ orders }) => (
  <div className="table-card">
    <table className="order-table">
      <thead>
        <tr>
          <th>Order ID</th>
          <th>Customer</th>
          <th>Total</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.id}>
            <td>{order.id}</td>
            <td>{order.customer}</td>
            <td>${order.total}</td>
            <td>{order.status}</td>
            <td>{order.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default OrderTable;
