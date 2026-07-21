import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout/AdminLayout';
import PrivateRoutes from './PrivateRoutes';
import routeConfig from './routeConfig';
import AdminLogin from '../pages/AdminLogin/AdminLogin';
import NotFound from '../pages/NotFound/NotFound';

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<AdminLogin />} />

    {routeConfig.map((route) => (
      <Route
        key={route.path}
        path={route.path}
        element={
          <PrivateRoutes requiredRole={route.requiredRole}>
            <AdminLayout>
              <route.element />
            </AdminLayout>
          </PrivateRoutes>
        }
      />
    ))}

    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
