import Dashboard from '../pages/Dashboard/Dashboard';
import Products from '../pages/Products/Products';
import Categories from '../pages/Categories/Categories';

import Orders from '../pages/Orders/Orders';
import Customers from '../pages/Customers/Customers';
import AddProduct from '../pages/AddProduct/AddProduct';
import EditProduct from '../pages/EditProduct/EditProduct';
import Inventory from '../pages/Inventory/Inventory';
import SalesReports from '../pages/SalesReports/SalesReports';
import Settings from '../pages/Settings/Settings';
import AdminProfile from '../pages/AdminProfile/AdminProfile';
import HeroSliderManager from '../pages/HeroSliderManager/HeroSliderManager';

const routeConfig = [
  { path: '/', element: Dashboard, requiredRole: 'admin' },
  { path: '/dashboard', element: Dashboard, requiredRole: 'admin' },
  { path: '/products', element: Products, requiredRole: 'admin' },
  { path: '/products/create', element: AddProduct, requiredRole: 'admin' },
  { path: '/products/edit/:id', element: EditProduct, requiredRole: 'admin' },
  { path: '/categories', element: Categories, requiredRole: 'admin' },
  { path: '/orders', element: Orders, requiredRole: 'admin' },
  { path: '/customers', element: Customers, requiredRole: 'admin' },
  { path: '/inventory', element: Inventory, requiredRole: 'admin' },
  { path: '/sales-reports', element: SalesReports, requiredRole: 'admin' },
  { path: '/settings', element: Settings, requiredRole: 'admin' },
  { path: '/profile', element: AdminProfile, requiredRole: 'admin' },
  { path: '/hero-slider', element: HeroSliderManager, requiredRole: 'admin' },
];

export default routeConfig;
