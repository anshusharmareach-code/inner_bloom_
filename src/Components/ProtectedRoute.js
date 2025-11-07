import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ 
  children, 
  isLoggedIn, 
  userRole, 
  requiredRole, 
  redirectTo = "/" 
}) => {

  if (!isLoggedIn) {
    console.log('🔍 ProtectedRoute: User not logged in, redirecting to', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }


  if (requiredRole && userRole !== requiredRole) {
    console.log('🔍 ProtectedRoute: User role mismatch', {
      userRole,
      requiredRole,
      redirecting: redirectTo
    });
    return <Navigate to={redirectTo} replace />;
  }

  console.log('🔍 ProtectedRoute: Access granted', {
    userRole,
    requiredRole: requiredRole || 'any'
  });

  return children;
};

export default ProtectedRoute;
