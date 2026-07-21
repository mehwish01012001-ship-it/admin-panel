import React from 'react';
import './StatsCard.css';

const StatsCard = ({ title, value, change, icon }) => (
  <div className="stats-card">
    <div className="stats-card-icon">{icon}</div>
    <div>
      <p className="stats-card-title">{title}</p>
      <h3 className="stats-card-value">{value}</h3>
      <p className="stats-card-change">{change}</p>
    </div>
  </div>
);

export default StatsCard;
