// src/axiosInstance.js (or wherever you prefer)
import axios from 'axios';

const API_BASE_URL = 'https://banking-backend-bap6.onrender.com/'; // Or process.env.REACT_APP_API_URL

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // <-- The crucial setting for all requests
});

// Optional: Add interceptors for error handling, token refresh, etc. here
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error:', error.response || error.message);
    // Add global error handling if needed (e.g., redirect on 401)
    // if (error.response && error.response.status === 401) {
    //   // Handle logout or redirect to login
    // }
    return Promise.reject(error);
  }
);

export default axiosInstance;
