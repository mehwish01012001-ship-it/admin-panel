import React from 'react';
import ProductForm from '../ProductForm/ProductForm';
import './EditProduct.css';

const EditProduct = () => (
  <div className="edit-product-page">
    <div className="page-header">
      <h1>Edit Product</h1>
      <p>Update product details and inventory settings.</p>
    </div>
    <ProductForm />
  </div>
);

export default EditProduct;
