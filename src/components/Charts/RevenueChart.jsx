import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import './RevenueChart.css';

const RevenueChart = ({ data }) => (
  <div className="chart-card">
    <h3>Revenue</h3>
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="revenue" stroke="#111111" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default RevenueChart;
