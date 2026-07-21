import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="notfound-page">
      <div className="notfound-card">
        <h1>404</h1>
        <p>Oops! The page you're looking for doesn't exist.</p>
        <Link to="/dashboard" className="btn-primary">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
