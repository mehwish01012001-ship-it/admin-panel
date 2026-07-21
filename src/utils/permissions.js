export const hasAdminAccess = (user) => user?.role === 'admin';

export const canEditProduct = (user) => hasAdminAccess(user);
export const canManageOrders = (user) => hasAdminAccess(user);
