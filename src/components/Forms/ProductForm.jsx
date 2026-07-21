import React from 'react';
import './ProductForm.css';

const ProductForm = ({ values, onChange, onSubmit }) => (
  <form className="admin-product-form" onSubmit={onSubmit}>
    <div className="admin-form-grid">
      <label>
        Product Name
        <input name="name" value={values.name} onChange={onChange} required />
      </label>
      <label>
        Category
        <input name="category" value={values.category} onChange={onChange} required />
      </label>
      <label>
        Price
        <input name="price" type="number" value={values.price} onChange={onChange} required />
      </label>
      <label>
        Stock
        <input name="stock" type="number" value={values.stock} onChange={onChange} required />
      </label>
    </div>
    <label className="full-width">
      Description
      <textarea name="description" value={values.description} onChange={onChange} rows="4" />
    </label>
    <button className="btn-submit">Save Product</button>
  </form>
);

export default ProductForm;
