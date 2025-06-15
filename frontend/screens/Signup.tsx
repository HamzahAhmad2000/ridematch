// screens/Signup.tsx
import React, { useState } from 'react';
import { Platform, TextInput } from 'react-native';
import BasicDatePicker from '../components/BasicDatePicker';
import { Button as RNButton } from 'react-native';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import InputField from '../components/InputField';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { useNavigation } from '@react-navigation/native';
import { SignupForm } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SignupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Signup'
>;

const Signup: React.FC = () => {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [form, setForm] = useState<SignupForm>({
    name: '',
    dateOfBirth: new Date().toISOString().slice(0, 10),
    gender: '',
    email: '',
    password: '',
  });
  const [open, setOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);  
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [errors, setErrors] = useState({
    name: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    // If this is the date field, ensure it's in the correct format
    setForm({ ...form, [field]: value });
    
    setErrorMessage(''); // Clear general error on typing

    // Reset error message when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
       setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
          const iso = selectedDate.toISOString().slice(0,10);
          setForm({ ...form, dateOfBirth: iso });
          if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
        }
      };


  const validateDateFormat = (dateString: string): boolean => {
    // Check if the format is YYYY-MM-DD
    const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateFormatRegex.test(dateString)) {
      return false;
    }

    // Check if it's a valid date
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
    const day = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    
    return (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    );
  };

  const validate = () => {
    let valid = true;
    let newErrors = {
      name: '',
      dateOfBirth: '',
      gender: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
      valid = false;
    }

    if (!form.dateOfBirth.trim()) {
      newErrors.dateOfBirth = 'Date of Birth is required';
      valid = false;
    } else if (!validateDateFormat(form.dateOfBirth)) {
      newErrors.dateOfBirth = 'Use format YYYY-MM-DD (e.g., 2000-01-31)';
      valid = false;
    }

    if (!form.gender.trim()) {
      newErrors.gender = 'Gender is required';
      valid = false;
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(form.email)) {
        newErrors.email = 'Email is invalid';
        valid = false;
      }
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      valid = false;
    } else if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and numbers';
      valid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm Password is required';
      valid = false;
    } else if (form.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };



  const handleNext = async () => {
    if (validate()) {
      try {
        // Ensure date is in YYYY-MM-DD format as a string
        const formData = {
          ...form,
          dateOfBirth: form.dateOfBirth.trim() // Ensure it's just a string, no parsing
        };
        
        // Log for debugging
        console.log('Saving form data:', JSON.stringify(formData));
        
        // Store form data in AsyncStorage
        await AsyncStorage.setItem('signupFormStep1', JSON.stringify(formData));
        
        // Navigate to next step without making API call
        navigation.navigate('Signup2');
      } catch (error) {
        setErrorMessage('Error saving form data. Please try again.');
        console.error('Error storing form data:', error);
      }
    } else {
      setErrorMessage('Please fix the form errors before proceeding.');
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      contentInsetAdjustmentBehavior='automatic'
    >
      <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>
        <Text style={styles.subtitle}>Begin your carpooling journey today.</Text>

        <InputField
          label="Name"
          placeholder="Enter your name"
          value={form.name}
          onChangeText={(text) => handleChange('name', text)}
          error={errors.name}
        />

        
            <View style={{ width: '100%', marginBottom: 20 }}>
              <Text style={styles.label}>Date of Birth</Text>
              
              {Platform.OS === 'web' ? (
                <TextInput
                  style={[styles.input, { paddingVertical: 12 }]}
                  value={form.dateOfBirth}
                  onChangeText={(text) => {
                    setForm({ ...form, dateOfBirth: text });
                    if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
                  }}
                  placeholder="YYYY‑MM‑DD"
                  keyboardType="numeric"
                />
              ) : (
                <BasicDatePicker
                  label="Date of Birth"
                  value={form.dateOfBirth}
                  onChange={(date) => handleChange('dateOfBirth', date)}
                  error={errors.dateOfBirth}
                />
              )}
              
              {errors.dateOfBirth ? (
                <Text style={styles.errorMessage}>{errors.dateOfBirth}</Text>
              ) : null}
            </View>
        <InputField
          label="Gender"
          placeholder="Enter your gender"
          value={form.gender}
          onChangeText={(text) => handleChange('gender', text)}
          error={errors.gender}
        />

        <InputField
          label="Email"
          placeholder="Enter your email"
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

        <InputField
          label="Confirm Password"
          placeholder="Confirm your password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={(text) => setConfirmPassword(text)}
          error={errors.confirmPassword}
        />

        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>

        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already a member?</Text>
          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  container: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#113a78',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    color: '#113a78',
    marginBottom: 5,
  },
  nextButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#0b2854',
    borderRadius: 21.276,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  nextButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loader: {
    marginVertical: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  loginText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#1659c0',
  },
  loginLink: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#8fb6f3',
    textDecorationLine: 'underline',
  },
  errorMessage: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: Platform.OS === 'web' ? 8 : 10,
    marginBottom: 10,
  },
});

export default Signup;