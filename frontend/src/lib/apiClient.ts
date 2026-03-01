import axios from 'axios';
import { API_URL } from './constants';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔹 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('❌ API Error Response:', error.response.status, error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('❌ API No Response:', error.message);
      console.error('Check if backend server is running on:', API_URL);
    } else {
      // Something else went wrong
      console.error('❌ API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
