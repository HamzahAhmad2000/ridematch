// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { useNavigation } from '@react-navigation/native';
import InputField from '../components/InputField';
import Button from '../components/Button';
import { AuthService, LoginForm } from '../services/auth';

type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Login'
>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
    setErrorMessage(''); // Clear general error message when user types

    // Reset error message when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validate = () => {
    let valid = true;
    let newErrors = {
      email: '',
      password: '',
    };

    if (!form.email.trim()) {
      newErrors.email = 'Email or Phone is required';
      valid = false;
    } else {
      // Simple email regex or phone number check
      const emailRegex = /\S+@\S+\.\S+/;
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!emailRegex.test(form.email) && !phoneRegex.test(form.email)) {
        newErrors.email = 'Enter a valid email or phone number';
        valid = false;
      }
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleLogin = async () => {
    if (validate()) {
      setIsLoading(true);
      setErrorMessage('');
      
      try {
        // Call login API
        const result = await AuthService.login(form);
        
        // Navigate to Homepage on success
        navigation.navigate('Homepage');
      } catch (error) {
        // Handle login error
        const errorMsg = error instanceof Error ? error.message : 'Invalid credentials or server error';
        setErrorMessage(errorMsg);
        console.error('Login error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrorMessage('Please fix the form errors before proceeding.');
    }
  };

  const handleSignupNavigation = () => {
    navigation.navigate('Signup');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingView}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        contentInsetAdjustmentBehavior='automatic'
      >
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Login</Text>
            <Text style={styles.subtitle}>Continue your carpooling journey today.</Text>
          </View>

          <View style={styles.inputContainer}>
            <InputField
              label="Email or Phone"
              placeholder="Enter your email or phone number"
              keyboardType="email-address"
              value={form.email}
              onChangeText={(text) => handleChange('email', text)}
              error={errors.email}
            />

            <InputField
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={form.password}
              onChangeText={(text) => handleChange('password', text)}
              error={errors.password}
            />
          </View>

          {errorMessage ? (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          ) : null}

          {isLoading ? (
            <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
          ) : (
            <Button title="Log In" onPress={handleLogin} />
          )}

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account?</Text>
            <TouchableOpacity onPress={handleSignupNavigation}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  container: {
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#113a78',
    textAlign: 'center',
    marginTop: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  signupContainer: {
    flexDirection: 'row',
    marginTop: 10,
  },
  signupText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#1659c0',
  },
  signupLink: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#8fb6f3',
    textDecorationLine: 'underline',
    marginLeft: 5,
  },
  errorMessage: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default LoginScreen;