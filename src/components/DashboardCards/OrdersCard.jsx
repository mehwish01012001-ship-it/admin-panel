import React from 'react';
import StatsCard from './StatsCard';
import { FiShoppingBag } from 'react-icons/fi';

const OrdersCard = ({ orders }) => (
  <StatsCard
    title="Total Orders"
    value={orders.toLocaleString()}
    change="+8%"
    icon={<FiShoppingBag />}
  />
);

export default OrdersCard;
