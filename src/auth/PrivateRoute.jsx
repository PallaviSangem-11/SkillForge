import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import Loader from '../components/Loader';

const PrivateRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user role
    const roleRoutes = {
      STUDENT: '/student',
      INSTRUCTOR: '/instructor',
      ADMIN: '/admin',
    };
    
    return <Navigate to={roleRoutes[user.role] || '/student'} replace />;
  }

  return children;
};

export default PrivateRoute;
