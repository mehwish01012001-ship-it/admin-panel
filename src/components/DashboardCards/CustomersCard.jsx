import React from 'react';
import StatsCard from './StatsCard';
import { FiUsers } from 'react-icons/fi';

const CustomersCard = ({ customers }) => (
  <StatsCard
    title="Total Customers"
    value={customers.toLocaleString()}
    change="+5%"
    icon={<FiUsers />}
  />
);

export default CustomersCard;
