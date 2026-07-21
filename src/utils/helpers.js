export const groupBy = (items, key) =>
  items.reduce((result, item) => {
    const groupKey = item[key] || 'unknown';
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});

export const getStatusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'delivered':
    case 'published':
    case 'active':
      return 'status-badge active';
    case 'processing':
    case 'draft':
      return 'status-badge pending';
    case 'pending':
      return 'status-badge pending';
    case 'cancelled':
    case 'inactive':
      return 'status-badge inactive';
    default:
      return 'status-badge';
  }
};
