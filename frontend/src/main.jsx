import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

const googleClientId = "827846725211-tietoq6sbpfg5uvfgcm0lkhs6j7o862b.apps.googleusercontent.com";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider> {}
        <App />
      </AuthProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
