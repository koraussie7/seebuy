import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// NOTE: Uses the production tunnel domain. For local development on physical device, 
// replace with your computer's local IPv4 address (e.g., http://192.168.1.x:4000/api)
const API_URL = 'https://api.golive.wiki/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically inject the JWT
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // SecureStore safely pulls the token from the device's encrypted storage
      const token = await SecureStore.getItemAsync('jwt');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from SecureStore:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;