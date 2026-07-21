import React from 'react';
import StatsCard from './StatsCard';
import { FiTrendingUp } from 'react-icons/fi';

const RevenueCard = ({ revenue }) => (
  <StatsCard
    title="Total Revenue"
    value={`Rs. ${revenue.toLocaleString()}`}
    change="+12%"
    icon={<FiTrendingUp />}
  />
);

export default RevenueCard;
