// src/pages/LoginPage.jsx
import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService'; // Import the service
import { useNavigate } from 'react-router-dom';      // Import useNavigate

function LoginPage() {
  const { login } = useAuth(); // Get login function from context
  const navigate = useNavigate(); // Hook for navigation

  const handleGoogleSuccess = async (credentialResponse) => { // Make function async
    console.log("Google Sign-In Success (Frontend):", credentialResponse);
    const idToken = credentialResponse.credential;
    console.log("ID Token:", idToken);

    // --- Send the token to the backend ---
    try {
      const backendResponse = await authService.loginWithGoogleToken(idToken);
      // Assuming backend responds with { message: "...", user: {...} } on success
      if (backendResponse && backendResponse.user) {
        login(backendResponse.user); // Update global auth state via context
        navigate('/dashboard');     // Navigate to the dashboard page
      } else {
         // Handle cases where backend responds ok but without user data?
        console.error("Backend login response missing user data:", backendResponse);
        alert('Login failed: Invalid response from server.');
      }
    } catch (error) {
      console.error("Backend login failed:", error);
      // Handle login failure (show message to user)
      alert(`Login failed: ${error.message || 'Could not connect to server.'}`);
    }
    // --- End backend call ---
  };

  const handleGoogleError = (error) => { // Can receive error object
    console.error('Google Sign-In Error:', error);
    alert('Google Sign-In Failed. Please try again.');
  };

  return (
    <div className="login-page-container">

      {/* Apply the .login-box class to this div */}
      <div className="login-box">
        <h2>Login</h2>
        <p>Please sign in with your Google Account.</p>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />
      </div>

    </div>
  );
}

export default LoginPage;
