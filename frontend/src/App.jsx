import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage'; // Import DashboardPage
import ProtectedRoute from './components/ProtectedRoute'; // Import ProtectedRoute
import Header from './components/Header';
import Footer from './components/Footer';
import './App.css';

function App() {
  // Optional: Check login status from context if needed here
  // const { isLoggedIn } = useAuth();

  return (
    <>
    <Header/>
    <Router>
      {/* You might want a Navbar component outside <Routes> later */}
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LoginPage />} /> {/* Default to login */}

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}> {/* Wrap protected routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Add other protected routes here inside the wrapper */}
        </Route>
      </Routes>
    </Router>
    <Footer/>
  </>
  );
}

export default App;
