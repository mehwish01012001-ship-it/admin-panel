import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, label }) => (
  <div className="stat-card-panel">
    <div>
      <p className="stat-card-label">{title}</p>
      <h3 className="stat-card-value">{value}</h3>
    </div>
    {label && <span className="stat-card-tag">{label}</span>}
  </div>
);

export default StatCard;
