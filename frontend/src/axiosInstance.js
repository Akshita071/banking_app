import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // ✅ ENV based
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // ✅ IMPORTANT
});

// Optional interceptor (safe)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      "Axios error:",
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

export default axiosInstance;
