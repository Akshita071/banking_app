import React, { createContext, useState, useContext, useMemo } from 'react';

// Create the context
const AuthContext = createContext(null);

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Initially not logged in
  const [user, setUser] = useState(null); // Store user info if needed

  // Function to call when login is successful
  const login = (userData) => {
    console.log("AuthContext: Logging in user", userData);
    setIsLoggedIn(true);
    setUser(userData);
    // Optionally store token/user info in localStorage/sessionStorage if needed
  };

  // Function to call when logging out
  const logout = () => {
    console.log("AuthContext: Logging out user");
    setIsLoggedIn(false);
    setUser(null);
    // Optionally clear localStorage/sessionStorage
    // TODO: Call backend logout endpoint via authService
  };

  // Use useMemo to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      isLoggedIn,
      user,
      login,
      logout,
    }),
    [isLoggedIn, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create a custom hook to use the auth context easily
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
