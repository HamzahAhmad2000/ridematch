// services/auth.ts
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigateToLogin } from '../navigationUtils';

export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  password: string;
  phone?: string;
}

export interface ProfileForm {
  university: string;
  emergencyContact: string;
  genderPreference: string;
  likes: string;
  dislikes: string;
  studentCardURL?: string | null;
  user_id?: string;
}

export interface RegisterResponse {
  message: string;
  user_id: string;
}

export interface ProfileResponse {
  message: string;
  profile_id: string;
}

// Token expiration callback - will be set by App.tsx
let onTokenExpired: (() => void) | null = null;

export const AuthService = {
  // Set callback for token expiration
  setTokenExpiredCallback(callback: () => void) {
    onTokenExpired = callback;
  },

  async login(data: LoginForm) {
    try {
      const response = await api.post('/auth/login', data);
      const { access_token, refresh_token, user_id, name } = response.data;
      
      // Store tokens with timestamp
      const tokenTimestamp = Date.now();
      await AsyncStorage.setItem('accessToken', access_token);
      await AsyncStorage.setItem('refreshToken', refresh_token);
      await AsyncStorage.setItem('userId', user_id);
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('tokenTimestamp', tokenTimestamp.toString());
      
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Login error details:', err.response?.data || err);
      
      // Extract meaningful error message
      const errorMessage = err.response?.data?.error || err.message || 'Login failed';
      throw new Error(errorMessage);
    }
  },
  
  async register(data: SignupForm): Promise<RegisterResponse> {
    try {
      console.log('Sending registration data:', JSON.stringify(data));
      
      // Format the data to match backend expectations
      const formattedData = {
        name: data.name,
        email: data.email,
        password: data.password,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth, // Backend expects this field name
        phone: data.phone || ''
      };
      
      const response = await api.post('/auth/register', formattedData);
      console.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Register error details:', err.response?.data || err);
      
      // Extract meaningful error message
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  },
  
  async registerProfile(data: ProfileForm): Promise<ProfileResponse> {
    try {
      console.log('Sending profile data:', JSON.stringify(data));
      
      // Format the data to match backend expectations
      const formattedData = {
        user_id: data.user_id,
        university: data.university,
        emergencyContact: data.emergencyContact,
        genderPreference: data.genderPreference,
        likes: data.likes,
        dislikes: data.dislikes,
        studentCardURL: data.studentCardURL || ''
      };
      
      const response = await api.post('/auth/register-profile', formattedData);
      console.log('Profile registration response:', response.data);
      return response.data;
    } catch (error) {
      const err = error as any;
      console.error('Profile registration error details:', err.response?.data || err);
      
      // Extract meaningful error message
      const errorMessage = err.response?.data?.error || err.message || 'Profile registration failed';
      throw new Error(errorMessage);
    }
  },
  
  async logout() {
    // Clear stored tokens
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('tokenTimestamp');
    console.log('✅ User logged out - all tokens cleared');
  },

  // Force logout when token expires (called by API interceptor)
  async forceLogout() {
    console.log('🔓 Force logout due to token expiration');
    await this.logout();
    
    // Navigate to login using global navigation
    navigateToLogin();
    
    // Call the callback to update UI
    if (onTokenExpired) {
      onTokenExpired();
    }
  },
  
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!token || !refreshToken) {
        return false;
      }
      
      // Check if token is still valid (basic check)
      const isValid = await this.validateToken();
      return isValid;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  },

  // Validate token by making a test API call
  async validateToken(): Promise<boolean> {
    try {
      // First check if we have tokens
      const accessToken = await AsyncStorage.getItem('accessToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (!accessToken || !refreshToken) {
        console.log('❌ No tokens found - triggering logout');
        await this.forceLogout();
        return false;
      }
      
      // Check client-side expiration first
      const isExpired = await this.isTokenExpired();
      if (isExpired) {
        console.log('❌ Token expired (client-side check) - triggering logout');
        await this.forceLogout();
        return false;
      }
      
      // Test token with API call
      const response = await api.get('/users/profile');
      console.log('✅ Token validation successful');
      return response.status === 200;
    } catch (error: any) {
      console.error('❌ Token validation failed:', error.message);
      
      // If we get 401 or authentication expired error, force logout
      if (error.message?.includes('Authentication expired') || 
          error.message?.includes('401') ||
          error.response?.status === 401) {
        console.log('❌ Token validation failed with auth error - triggering logout');
        await this.forceLogout();
        return false;
      }
      
      // For network errors, assume token might still be valid
      if (error.message?.includes('Network error')) {
        console.warn('⚠️ Network error during token validation - assuming valid for now');
        return true;
      }
      
      // For other errors, trigger logout to be safe
      console.log('❌ Unknown error during token validation - triggering logout');
      await this.forceLogout();
      return false;
    }
  },

  // Check token expiration based on timestamp (client-side check)
  async isTokenExpired(): Promise<boolean> {
    try {
      const tokenTimestamp = await AsyncStorage.getItem('tokenTimestamp');
      
      if (!tokenTimestamp) {
        return true; // No timestamp means expired
      }
      
      const tokenTime = parseInt(tokenTimestamp);
      const now = Date.now();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      return (now - tokenTime) > thirtyDaysInMs;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true; // Assume expired on error
    }
  },
  
  async getUserInfo() {
    const userId = await AsyncStorage.getItem('userId');
    const userName = await AsyncStorage.getItem('userName');
    
    return {
      userId,
      userName
    };
  }
};