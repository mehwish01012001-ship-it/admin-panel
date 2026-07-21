import React from 'react';
import './FormSection.css';

const FormSection = ({ title, description, children }) => (
  <section className="form-section-panel">
    <div className="form-section-header">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
    <div className="form-section-body">{children}</div>
  </section>
);

export default FormSection;
