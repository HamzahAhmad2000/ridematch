// App.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import StackNavigator from './navigation/StackNavigator';
import { AuthService } from './services/auth';
import { setAuthFailureCallback } from './services/api';
import { navigationRef, navigateToLogin, navigateToHomepage } from './navigationUtils';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Handle automatic logout when authentication fails
  const handleAuthFailure = async () => {
    console.log('🔓 Authentication failed - logging out user and redirecting to login');
    
    try {
      // Clear authentication state
      setIsAuthenticated(false);
      
      // Clear all tokens using AuthService
      await AuthService.logout();
      
      // Navigate to login screen using global navigation
      navigateToLogin();
      
      // Show alert to user
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again.',
        [{ text: 'OK' }]
      );
      
      console.log('✅ User successfully logged out and redirected to login');
    } catch (error) {
      console.error('❌ Error during auth failure handling:', error);
    }
  };

  useEffect(() => {
    // Set up authentication failure callback
    setAuthFailureCallback(handleAuthFailure);
    AuthService.setTokenExpiredCallback(handleAuthFailure);

    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        setIsLoading(true);
        
        // Check if tokens exist and are valid
        const authStatus = await AuthService.isAuthenticated();
        console.log('🔍 Authentication status check:', authStatus);
        
        setIsAuthenticated(authStatus);
        
        if (authStatus) {
          console.log('✅ User is authenticated');
        } else {
          console.log('❌ User is not authenticated');
        }
      } catch (error) {
        console.error('❌ Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Handle navigation ready state
  const onNavigationReady = () => {
    console.log('🧭 Navigation container is ready');
    
    // Set initial route based on authentication status
    const initialRoute = isAuthenticated ? 'Homepage' : 'Login';
    console.log(`🧭 Setting initial route to: ${initialRoute}`);
    
    if (isAuthenticated) {
      navigateToHomepage();
    } else {
      navigateToLogin();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#113a78" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        onReady={onNavigationReady}
      >
        <StackNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});