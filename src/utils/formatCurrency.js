export const formatCurrency = (value) => {
  if (typeof value !== 'number') return value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};
