// screens/ReportScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { ReportService, ReportSubmission } from '../services/report';
import Navbar from '../components/Navbar';

const categories = [
  'Harassment',
  'Safety Issue',
  'Vehicle Problem',
  'Payment Issue',
  'App Issue',
  'Other',
];

const ReportScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<ReportSubmission>({
    category: '',
    description: '',
    anonymous: false,
    evidenceUrl: null,
  });
  
  const [evidence, setEvidence] = useState<ImagePicker.ImagePickerResult | null>(null);
  
  const [errors, setErrors] = useState({
    category: '',
    description: '',
  });

  const handleChange = (field: keyof ReportSubmission, value: string | boolean) => {
    setForm({ ...form, [field]: value });
    setError(null);
    
    // Clear error when field is modified
    if (field !== 'anonymous' && field !== 'evidenceUrl' && errors[field as 'category' | 'description']) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleCategorySelect = (category: string) => {
    handleChange('category', category);
  };

  const handleImageUpload = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access media library is required!');
        return;
      }

      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setEvidence(result);
        
        // Upload evidence to server immediately
        if (result.assets && result.assets.length > 0) {
          setIsUploading(true);
          try {
            const imageUrl = await ReportService.uploadEvidence(result.assets[0].uri);
            setForm(prevForm => ({
              ...prevForm,
              evidenceUrl: imageUrl
            }));
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Failed to upload image';
            Alert.alert('Upload Error', errorMsg);
          } finally {
            setIsUploading(false);
          }
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      Alert.alert('Error', errorMsg);
    }
  };

  const validate = () => {
    let valid = true;
    const newErrors = {
      category: '',
      description: '',
    };

    if (!form.category) {
      newErrors.category = 'Please select a category';
      valid = false;
    }

    if (!form.description.trim()) {
      newErrors.description = 'Please provide a description of the issue';
      valid = false;
    } else if (form.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await ReportService.submitReport(form);
      
      if (response.success) {
        Alert.alert(
          'Report Submitted',
          'Thank you for your report. We will investigate and take appropriate action.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Homepage' as never),
            },
          ]
        );
      } else {
        setError(response.message || 'Failed to submit report');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMsg);
      console.error('Error submitting report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Submit a Report</Text>
          <Text style={styles.subtitle}>
            We are sorry you had to go through this. Can you tell us what happened?
          </Text>
        </View>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Category</Text>
          {errors.category ? (
            <Text style={styles.errorText}>{errors.category}</Text>
          ) : null}
          
          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  form.category === category && styles.selectedCategoryButton,
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    form.category === category && styles.selectedCategoryButtonText,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Please describe what happened, including any relevant details."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={form.description}
            onChangeText={(text) => handleChange('description', text)}
          />
          {errors.description ? (
            <Text style={styles.errorText}>{errors.description}</Text>
          ) : null}
          
          <Text style={styles.sectionTitle}>Evidence (Optional)</Text>
          <TouchableOpacity 
            style={styles.uploadButton} 
            onPress={handleImageUpload}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#113a78" />
            ) : (
              <>
                <Image
                  source={require('../assets/images/Blue Upload Icon.png')}
                  style={styles.uploadIcon}
                  resizeMode="contain"
                />
                <Text style={styles.uploadButtonText}>Upload Image</Text>
              </>
            )}
          </TouchableOpacity>
          
          {evidence && evidence.assets && evidence.assets[0]?.uri ? (
            <View style={styles.evidencePreviewContainer}>
              <Image
                source={{ uri: evidence.assets[0].uri }}
                style={styles.evidencePreview}
                resizeMode="cover"
              />
              {form.evidenceUrl && (
                <View style={styles.uploadedBadge}>
                  <Text style={styles.uploadedText}>Uploaded</Text>
                </View>
              )}
            </View>
          ) : null}
          
          <View style={styles.anonymousContainer}>
            <TouchableOpacity
              style={[styles.checkbox, form.anonymous && styles.checkboxChecked]}
              onPress={() => handleChange('anonymous', !form.anonymous)}
            >
              {form.anonymous && <View style={styles.checkboxInner} />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Submit Anonymously</Text>
          </View>
        </View>
        
        <View style={styles.buttonsContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#c60000" style={styles.loader} />
          ) : (
            <>
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSubmit}
                disabled={isUploading}
              >
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => navigation.navigate('Homepage' as never)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
      
      {/* Navbar */}
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 120, // Add padding for navbar
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#c60000', // Red color
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffeeee',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  formSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
    marginTop: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#e6effc',
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedCategoryButton: {
    backgroundColor: '#113a78',
  },
  categoryButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
  },
  selectedCategoryButtonText: {
    color: '#ffffff',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
    backgroundColor: '#f8f9fa',
    height: 120,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#c60000',
    marginBottom: 5,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6effc',
    borderRadius: 8,
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  uploadButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
  },
  evidencePreviewContainer: {
    marginTop: 15,
    alignItems: 'center',
    position: 'relative',
  },
  evidencePreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  uploadedBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#519e15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  uploadedText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#113a78',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#113a78',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
  },
  checkboxLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
  },
  buttonsContainer: {
    marginTop: 30,
  },
  loader: {
    marginVertical: 20,
  },
  submitButton: {
    backgroundColor: '#c60000',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  submitButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#666',
  },
});

export default ReportScreen;