import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';

import store from './redux/store';
import AppRoutes from './routes/AppRoutes';
import Loader from './components/Loader/Loader';
import { authService } from './services/authService';
import { setUser, clearUser } from './redux/slices/authSlice';

import './App.css';
import 'react-toastify/dist/ReactToastify.css';

const AppContent = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      dispatch(clearUser());
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await authService.getProfile();
        const user = res.data.user || res.data;
        dispatch(setUser({ user, token }));
      } catch (err) {
        dispatch(clearUser());
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [dispatch]);

  if (loading) {
    return <Loader />;
  }

  return (
    <Router>
      <AppRoutes />
      <ToastContainer />
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
               