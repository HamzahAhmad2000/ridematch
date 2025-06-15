import { useState, useEffect } from 'react';
import { AuthService } from '../services/auth';
import { Alert } from 'react-native';

interface UseAuthReturn {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  userId: string | null;
  userName: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated
      const authStatus = await AuthService.isAuthenticated();
      setIsAuthenticated(authStatus);
      
      if (authStatus) {
        // Get user info if authenticated
        const userInfo = await AuthService.getUserInfo();
        setUserId(userInfo.userId);
        setUserName(userInfo.userName);
      } else {
        // Clear user info if not authenticated
        setUserId(null);
        setUserName(null);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
      setUserId(null);
      setUserName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setIsAuthenticated(false);
      setUserId(null);
      setUserName(null);
      
      Alert.alert(
        'Logged Out',
        'You have been successfully logged out.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert(
        'Logout Error',
        'There was an error logging out. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    checkAuth,
    logout,
    userId,
    userName
  };
}; 