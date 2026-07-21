import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';

import store from './redux/store';
import AppRoutes from './routes/AppRoutes';

import './App.css';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AppRoutes />
        <ToastContainer />
      </Router>
    </Provider>
  );
}

export default App;
               