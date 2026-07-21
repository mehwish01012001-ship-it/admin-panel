import React from 'react';
import StatsCard from './StatsCard';
import { FiPackage } from 'react-icons/fi';

const ProductsCard = ({ products }) => (
  <StatsCard
    title="Total Products"
    value={products.toLocaleString()}
    change="+3 new"
    icon={<FiPackage />}
  />
);

export default ProductsCard;
