import React from 'react';
import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../providers/AuthProvider';

const UserRouteProtection = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated and is NOT an admin
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admins away from user interface
  if (user.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default UserRouteProtection;
