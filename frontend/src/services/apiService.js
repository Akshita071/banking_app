// src/services/apiService.js
import axiosInstance from '../axiosInstance'; // <<< Import from the parent directory

const getProfile = async () => {
  try {
    console.log('apiService: Fetching profile via shared instance...');
    // Use the imported shared instance
    const response = await axiosInstance.get('/api/profile');
    console.log('apiService: Profile response:', response.data);
    return response.data;
  } catch (error) {
    console.error('apiService: Error fetching profile:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch profile');
  }
};

const getAccountData = async () => {
  try {
    console.log('apiService: Fetching account data via shared instance...');
    // Use the imported shared instance
    const response = await axiosInstance.get('/api/account');
    console.log('apiService: Account response:', response.data);
    return response.data;
  } catch (error) {
    console.error('apiService: Error fetching account data:', error.response?.data || error.message);
    throw error.response?.data || new Error('Failed to fetch account data');
  }
};

export const apiService = {
  getProfile,
  getAccountData,
};
