import axios from "axios";
import { API_URL } from "./constants";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        "API Error:",
        error.response.status,
        error.response.data,
      );
    } else if (error.request) {
      console.error("Network Error: No response from server");
    } else {
      console.error("Request Error:", error.message);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
