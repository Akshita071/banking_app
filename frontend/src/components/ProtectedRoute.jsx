import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Import your auth hook

const ProtectedRoute = () => {
  const { isLoggedIn } = useAuth(); // Get login status from context

  console.log("ProtectedRoute Check: isLoggedIn =", isLoggedIn); // For debugging

  if (!isLoggedIn) {
    // If not logged in, redirect to the login page
    // Replace '/login' if your login route is different
    return <Navigate to="/login" replace />;
  }

  // If logged in, render the child route component (e.g., DashboardPage)
  // Outlet is used by react-router-dom v6 to render nested routes
  return <Outlet />;
};

export default ProtectedRoute;
