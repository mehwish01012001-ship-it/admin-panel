import React from 'react';
import './ProductTable.css';

const ProductTable = ({ products }) => (
  <div className="table-card">
    <table className="product-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => (
          <tr key={product.id}>
            <td>{product.name}</td>
            <td>{product.category}</td>
            <td>Rs. {Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
            <td>{product.stock}</td>
            <td>{product.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ProductTable;
