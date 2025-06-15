// services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Configuration with fallback URLs for different network scenarios
const API_CONFIGS = [
  {
    name: 'Android Emulator',
    baseURL: 'http://10.0.2.2:5000/api',
    description: 'Standard Android emulator host mapping'
  },
  {
    name: 'Local Network',
    baseURL: 'http://192.168.100.153:5000/api',
    description: 'Direct IP access via local network'
  },
  {
    name: 'Localhost',
    baseURL: 'http://127.0.0.1:5000/api',
    description: 'Localhost fallback'
  }
];

// Current API configuration
let currentConfig = API_CONFIGS[0];

// Authentication failure callback - will be set by AuthService
let onAuthenticationFailed: (() => Promise<void>) | null = null;

// Set authentication failure callback
const setAuthFailureCallback = (callback: () => Promise<void>) => {
  onAuthenticationFailed = callback;
};

// Log network configuration
console.log('=== API CONFIGURATION ===');
console.log('Platform:', Platform.OS);
console.log('API URL:', currentConfig.baseURL);
console.log('========================');

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL: currentConfig.baseURL,
  timeout: 20000, // Increased timeout to 20 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Enhanced request interceptor with detailed logging
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log(`🌐 Using: ${currentConfig.name} (${currentConfig.baseURL})`);
    if (config.data) {
      console.log('📤 Request Data:', config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with network diagnostics and improved auth handling
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error(`❌ API Error: ${JSON.stringify({
      code: error.code,
      message: error.message,
      method: originalRequest?.method,
      url: originalRequest?.url,
      status: error.response?.status,
      baseURL: originalRequest?.baseURL
    })}`);

    // Network error handling with automatic fallback
    if (error.code === 'ERR_NETWORK' && !originalRequest._retryAttempted) {
      console.log('🔄 Network error detected, attempting fallback configurations...');
      
      // Try next configuration
      const currentIndex = API_CONFIGS.findIndex(config => config.baseURL === currentConfig.baseURL);
      const nextIndex = (currentIndex + 1) % API_CONFIGS.length;
      
      if (nextIndex !== currentIndex) {
        currentConfig = API_CONFIGS[nextIndex];
        api.defaults.baseURL = currentConfig.baseURL;
        originalRequest.baseURL = currentConfig.baseURL;
        originalRequest._retryAttempted = true;
        
        console.log(`🔄 Retrying with: ${currentConfig.name} (${currentConfig.baseURL})`);
        
        try {
          return await api.request(originalRequest);
        } catch (retryError: any) {
          console.error('❌ Retry failed:', retryError.message);
        }
      }
    }

    // Enhanced error details for debugging
    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network Error Details:', {
        code: error.code,
        message: error.message,
        config: {
          baseURL: originalRequest?.baseURL,
          timeout: originalRequest?.timeout,
          url: originalRequest?.url
        }
      });
      
      throw new Error('Network error. Please check your connection and try again.');
    }

    // Handle 401 errors - Enhanced for immediate logout on auth failures
    if (error.response?.status === 401) {
      console.log('🚨 401 Unauthorized detected');
      
      // Only try to refresh if we haven't already tried and this isn't a refresh request
      if (!originalRequest._retry && !originalRequest.url?.includes('/auth/refresh')) {
        originalRequest._retry = true;
        
        try {
          console.log('🔄 Attempting token refresh...');
          
          // Try to refresh token
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          
          if (!refreshToken) {
            console.log('❌ No refresh token available - triggering immediate logout');
            throw new Error('No refresh token available');
          }
          
          const res = await axios.post(`${currentConfig.baseURL}/auth/refresh`, {}, {
            headers: {
              'Authorization': `Bearer ${refreshToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Store new token
          await AsyncStorage.setItem('accessToken', res.data.access_token);
          await AsyncStorage.setItem('tokenTimestamp', Date.now().toString());
          console.log('✅ Token refreshed successfully');
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${res.data.access_token}`;
          return api(originalRequest);
        } catch (refreshError: any) {
          console.error('❌ Token refresh failed:', refreshError.message);
          
          // Clear all tokens immediately
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('userId');
          await AsyncStorage.removeItem('userName');
          await AsyncStorage.removeItem('tokenTimestamp');
          
          // Trigger authentication failure callback immediately
          if (onAuthenticationFailed) {
            console.log('🔓 Triggering immediate logout due to auth failure');
            setTimeout(() => onAuthenticationFailed?.(), 100); // Small delay to ensure state updates
          }
          
          // Return specific error for auth failure
          return Promise.reject(new Error('Authentication expired. Please log in again.'));
        }
      } else {
        // This is either a retry or a refresh request that failed
        console.log('🚨 Authentication failure - no retry possible');
        
        // Clear all tokens
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('userId');
        await AsyncStorage.removeItem('userName');
        await AsyncStorage.removeItem('tokenTimestamp');
        
        // Trigger authentication failure callback
        if (onAuthenticationFailed) {
          console.log('🔓 Triggering immediate logout - no retry possible');
          setTimeout(() => onAuthenticationFailed?.(), 100);
        }
        
        return Promise.reject(new Error('Authentication expired. Please log in again.'));
      }
    }
    
    // Extract error message from response if available
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message || 
                        'An unknown error occurred';
    
    // Return error for other cases
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
export { setAuthFailureCallback };