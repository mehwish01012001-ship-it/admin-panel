import { useMemo } from 'react';

const usePagination = (items, currentPage, pageSize) => {
  return useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const pagedItems = items.slice(startIndex, startIndex + pageSize);
    const totalPages = Math.ceil(items.length / pageSize);

    return { pagedItems, totalPages };
  }, [items, currentPage, pageSize]);
};

export default usePagination;
