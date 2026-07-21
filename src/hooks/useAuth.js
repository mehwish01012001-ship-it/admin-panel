import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const useAuth = (requiredRole = null) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, user, navigate, requiredRole]);

  return { isAuthenticated, user };
};

export default useAuth;
