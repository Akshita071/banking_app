import axiosInstance from '../axiosInstance'; // <<< Import from the parent directory
/**
 * Sends the Google ID token to the backend for verification and login.
 * @param {string} idToken - The Google ID token obtained from frontend sign-in.
 * @returns {Promise<object>} - Promise resolving with backend response data (e.g., user info).
 */
const loginWithGoogleToken = async (idToken) => {
  try {
    console.log('authService: Sending token to backend...');
    const response = await axiosInstance.post('/auth/google_signin', {
      token: idToken, // Send token in the request body under the key 'token'
    });
    console.log('authService: Backend response:', response.data);
    return response.data; // Return the data from the backend (e.g., user object)
  } catch (error) {
    console.error('authService: Error calling backend login:', error.response?.data || error.message);
    // Re-throw the error or return a specific error structure
    throw error.response?.data || new Error('Backend login failed');
  }
};

/**
 * Calls the backend logout endpoint.
 */
const logout = async () => {
  try {
    console.log('authService: Calling backend logout...');
    // For logout and other authenticated requests, ensure cookies are sent
    // If using axios instance, set withCredentials globally or per-request
    const response = await axiosInstance.post('/auth/logout', {}, { withCredentials: true });
    console.log('authService: Logout response:', response.data);
    return response.data;
  } catch (error) {
    console.error('authService: Error calling backend logout:', error.response?.data || error.message);
    throw error.response?.data || new Error('Backend logout failed');
  }
};


// Export the functions
export const authService = {
  loginWithGoogleToken,
  logout,
};
