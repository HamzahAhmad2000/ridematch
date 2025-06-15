// screens/Signup2.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { useNavigation } from '@react-navigation/native';
import InputField from '../components/InputField';
import DropdownField from '../components/DropdownField';
import Button from '../components/Button';
import UploadButton from '../components/UploadButton';
import * as ImagePicker from 'expo-image-picker';
import { AuthService, ProfileForm, SignupForm } from '../services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Signup2ScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Signup2'
>;

const Signup2: React.FC = () => {
  const navigation = useNavigation<Signup2ScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [step1Data, setStep1Data] = useState<SignupForm | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    university: '',
    emergencyContact: '',
    genderPreference: '',
    likes: '',
    dislikes: '',
  });

  const [studentCard, setStudentCard] = useState<ImagePicker.ImagePickerResult | null>(null);

  const [errors, setErrors] = useState({
    university: '',
    emergencyContact: '',
    genderPreference: '',
    likes: '',
    dislikes: '',
    studentCard: '',
  });

  useEffect(() => {
    // Load the step 1 data from AsyncStorage
    const loadStep1Data = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('signupFormStep1');
        if (jsonValue) {
          setStep1Data(JSON.parse(jsonValue));
        } else {
          Alert.alert(
            'Error',
            'Previous form data not found. Please restart the signup process.',
            [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Signup')
              }
            ]
          );
        }
      } catch (error) {
        console.error('Error loading step 1 data:', error);
        Alert.alert('Error', 'Could not load previous data. Please restart signup.');
        navigation.navigate('Signup');
      }
    };

    loadStep1Data();
  }, [navigation]);

  const universities = [
    'Universiti Malaya (UM)',
    'Universiti Kebangsaan Malaysia (UKM)',
    'Universiti Sains Malaysia (USM)',
    'Universiti Putra Malaysia (UPM)',
    'Universiti Teknologi Malaysia (UTM)',
    'Universiti Teknologi MARA (UiTM)',
    'International Islamic University Malaysia (IIUM)',
    'Universiti Tunku Abdul Rahman (UTAR)',
    'Multimedia University (MMU)',
    'Sunway University',
    'Taylor\'s University',
    'Monash University Malaysia',
    'University of Nottingham Malaysia',
    'Heriot-Watt University Malaysia',
    'Curtin University Malaysia',
  ];

  const genderPreferences = [
    'Any',
    'Male',
    'Female',
    'Non-binary',
  ];

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm({ ...form, [field]: value });
    setErrorMessage(''); // Clear general error on typing

    // Reset error message when user starts typing/selecting
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleImageUpload = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Permission to access media library is required!');
      return;
    }

    // Launch image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setStudentCard(result);
      setErrors({ ...errors, studentCard: '' });
    }
  };

  const validate = () => {
    let valid = true;
    let newErrors = {
      university: '',
      emergencyContact: '',
      genderPreference: '',
      likes: '',
      dislikes: '',
      studentCard: '',
    };

    if (!form.university.trim()) {
      newErrors.university = 'University is required';
      valid = false;
    }

    if (!form.emergencyContact.trim()) {
      newErrors.emergencyContact = 'Emergency Contact is required';
      valid = false;
    } else {
      // Simple phone number regex
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(form.emergencyContact)) {
        newErrors.emergencyContact = 'Emergency Contact is invalid';
        valid = false;
      }
    }

    if (!form.genderPreference.trim()) {
      newErrors.genderPreference = 'Gender Preference is required';
      valid = false;
    }

    if (!form.likes.trim()) {
      newErrors.likes = 'Likes field is required';
      valid = false;
    }

    if (!form.dislikes.trim()) {
      newErrors.dislikes = 'Dislikes field is required';
      valid = false;
    }

    if (!studentCard) {
      newErrors.studentCard = 'Student Card is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const uploadImage = async () => {
    if (!studentCard || !studentCard.assets || !studentCard.assets[0]?.uri) {
      return null;
    }
    
    try {
      // In a real implementation, this would upload to your server and return a URL
      // For now, we'll simulate this with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return a mock URL - in a real app, this would be the URL from your server
      return `https://example.com/uploads/${Date.now()}_student_card.jpg`;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload student card image');
    }
  };

  const handleSignUp = async () => {
    if (!step1Data) {
      setErrorMessage('Missing signup information. Please restart the signup process.');
      return;
    }

    if (validate()) {
      setIsLoading(true);
      setErrorMessage('');
      
      try {
        // Upload student card image
        const imageUrl = await uploadImage();
        
        // First, register the user with step 1 data
        const { user_id } = await AuthService.register(step1Data);
        
        // Then create profile with step 2 data and image URL
        const profileData = {
          ...form,
          studentCardURL: imageUrl,
          user_id: user_id
        };
        
        await AuthService.registerProfile(profileData);
        
        // Note: Hobby processing is now handled automatically in the backend
        // during profile registration, so we don't need to call MatchService.processHobbies
        
        // Clear the stored step 1 data
        await AsyncStorage.removeItem('signupFormStep1');
        
        // Show success message and navigate to login
        Alert.alert(
          'Success',
          'You have successfully signed up! Please log in to continue.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } catch (error) {
        // Handle registration error
        const errorMsg = error instanceof Error ? error.message : 'Registration failed. Please try again.';
        setErrorMessage(errorMsg);
        console.error('Registration error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Add your preferences</Text>
        <Text style={styles.subtitle}>Find the best carpooling partners.</Text>

        <DropdownField
          label="University"
          value={form.university}
          onSelect={(item) => handleChange('university', item)}
          options={universities}
          error={errors.university}
        />

        <InputField
          label="Emergency Contact"
          placeholder="+1234567890"
          keyboardType="phone-pad"
          value={form.emergencyContact}
          onChangeText={(text) => handleChange('emergencyContact', text)}
          error={errors.emergencyContact}
        />

        <DropdownField
          label="Gender Preference"
          value={form.genderPreference}
          onSelect={(item) => handleChange('genderPreference', item)}
          options={genderPreferences}
          error={errors.genderPreference}
        />

        <InputField
          label="Likes"
          placeholder="e.g., Music, Sports"
          value={form.likes}
          onChangeText={(text) => handleChange('likes', text)}
          error={errors.likes}
        />

        <InputField
          label="Dislikes"
          placeholder="e.g., Smoking"
          value={form.dislikes}
          onChangeText={(text) => handleChange('dislikes', text)}
          error={errors.dislikes}
        />

        <UploadButton onPress={handleImageUpload} />
        {studentCard && studentCard.assets && studentCard.assets[0]?.uri && (
          <Image
            source={{ uri: studentCard.assets[0].uri }}
            style={styles.uploadedImage}
          />
        )}

        {errors.studentCard ? <Text style={styles.errorText}>{errors.studentCard}</Text> : null}
        
        {errorMessage ? (
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
        ) : (
          <Button title="Sign Up" onPress={handleSignUp} />
        )}

        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Previous</Text>
        </TouchableOpacity>
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
  uploadedImage: {
    width: 100,
    height: 100,
    marginBottom: 20,
    borderRadius: 8,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -15,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  errorMessage: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  backButton: {
    marginTop: 20,
  },
  backButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#1659c0',
    textDecorationLine: 'underline',
  },
});

export default Signup2;