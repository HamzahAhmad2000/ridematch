// navigationUtils.ts
import { useNavigation, NavigationProp, RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './navigation/StackNavigator';
import { createRef } from 'react';
import { NavigationContainerRef, CommonActions } from '@react-navigation/native';

/**
 * Type-safe navigation hook that provides proper typing for the navigation object
 * Use this instead of the regular useNavigation() to get TypeScript support
 */
export function useAppNavigation() {
  return useNavigation<NavigationProp<RootStackParamList>>();
}

/**
 * Type-safe route hook for accessing route params
 * Use this with a specific route name to get properly typed params
 * @example const route = useAppRoute<'RideDetails'>();
 */
export function useAppRoute<T extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, T>>();
}

// Create a ref that can be accessed globally
export const navigationRef = createRef<NavigationContainerRef<RootStackParamList>>();

// Navigate to any screen
export function navigate(name: keyof RootStackParamList, params?: any) {
  navigationRef.current?.navigate(name as never, params as never);
}

// Go back
export function goBack() {
  navigationRef.current?.goBack();
}

// Reset navigation stack
export function resetToScreen(screenName: keyof RootStackParamList) {
  navigationRef.current?.reset({
    index: 0,
    routes: [{ name: screenName }],
  });
}

// Logout navigation - resets to login screen
export function navigateToLogin() {
  console.log('🧭 Navigating to login screen');
  if (navigationRef.current) {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
    console.log('✅ Navigation reset to login successful');
  } else {
    console.error('❌ Navigation ref not available');
  }
}

// Login success navigation - resets to homepage
export function navigateToHomepage() {
  console.log('🧭 Navigating to homepage');
  if (navigationRef.current) {
    navigationRef.current.reset({
      index: 0,
      routes: [{ name: 'Homepage' }],
    });
    console.log('✅ Navigation reset to homepage successful');
  } else {
    console.error('❌ Navigation ref not available');
  }
}