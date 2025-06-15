import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DriverService, DriverApplicationForm, DriverApplicationStatus } from '../services/driver';

const DriverApplicationScreen: React.FC = () => {
  const navigation = useNavigation();
  const [applicationStatus, setApplicationStatus] = useState<DriverApplicationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<DriverApplicationForm>({
    license_number: '',
    license_expiry: '',
    license_image_url: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: 2020,
    license_plate: '',
    vehicle_reg_url: '',
  });

  useEffect(() => {
    checkApplicationStatus();
  }, []);

  const checkApplicationStatus = async () => {
    try {
      setLoading(true);
      const status = await DriverService.getApplicationStatus();
      setApplicationStatus(status);
    } catch (error: any) {
      console.error('Error checking application status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate form
      if (!form.license_number || !form.license_expiry || !form.vehicle_make || 
          !form.vehicle_model || !form.license_plate) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(form.license_expiry)) {
        Alert.alert('Error', 'Please enter license expiry in YYYY-MM-DD format');
        return;
      }

      // For demo purposes, using placeholder URLs for images
      const submissionData = {
        ...form,
        license_image_url: form.license_image_url || 'https://example.com/license.jpg',
        vehicle_reg_url: form.vehicle_reg_url || 'https://example.com/registration.jpg',
      };

      setLoading(true);
      await DriverService.submitApplication(submissionData);
      
      Alert.alert(
        'Success', 
        'Your driver application has been submitted successfully! We will review it and notify you once it\'s processed.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const renderApplicationStatus = () => {
    if (!applicationStatus || applicationStatus.status === 'not_submitted') {
      return null;
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return '#FFA500';
        case 'approved': return '#4CAF50';
        case 'rejected': return '#F44336';
        default: return '#666';
      }
    };

    const getStatusText = (status: string) => {
      switch (status) {
        case 'pending': return 'Under Review';
        case 'approved': return 'Approved';
        case 'rejected': return 'Rejected';
        default: return status;
      }
    };

    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>Application Status</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(applicationStatus.status) }]}>
          <Text style={styles.statusText}>{getStatusText(applicationStatus.status)}</Text>
        </View>
        {applicationStatus.submitted_at && (
          <Text style={styles.statusDate}>
            Submitted: {new Date(applicationStatus.submitted_at).toLocaleDateString()}
          </Text>
        )}
        {applicationStatus.reviewed_at && (
          <Text style={styles.statusDate}>
            Reviewed: {new Date(applicationStatus.reviewed_at).toLocaleDateString()}
          </Text>
        )}
        {applicationStatus.admin_notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>Admin Notes:</Text>
            <Text style={styles.notesText}>{applicationStatus.admin_notes}</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (applicationStatus && applicationStatus.status !== 'not_submitted') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Driver Application</Text>
        </View>
        {renderApplicationStatus()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Driver Application</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>License Information</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>License Number *</Text>
              <TextInput
                style={styles.input}
                value={form.license_number}
                onChangeText={(text) => setForm({...form, license_number: text})}
                placeholder="Enter your license number"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>License Expiry Date * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={form.license_expiry}
                onChangeText={(text) => setForm({...form, license_expiry: text})}
                placeholder="2025-12-31"
                placeholderTextColor="#999"
              />
            </View>

            <Text style={styles.sectionTitle}>Vehicle Information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehicle Make *</Text>
              <TextInput
                style={styles.input}
                value={form.vehicle_make}
                onChangeText={(text) => setForm({...form, vehicle_make: text})}
                placeholder="e.g., Toyota"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehicle Model *</Text>
              <TextInput
                style={styles.input}
                value={form.vehicle_model}
                onChangeText={(text) => setForm({...form, vehicle_model: text})}
                placeholder="e.g., Camry"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vehicle Year</Text>
              <TextInput
                style={styles.input}
                value={form.vehicle_year.toString()}
                onChangeText={(text) => setForm({...form, vehicle_year: parseInt(text) || 2020})}
                placeholder="2020"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>License Plate *</Text>
              <TextInput
                style={styles.input}
                value={form.license_plate}
                onChangeText={(text) => setForm({...form, license_plate: text})}
                placeholder="Enter your license plate"
                placeholderTextColor="#999"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                * Required fields. Document uploads will be available in future updates.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Submitting...' : 'Submit Application'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  noteContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
});

export default DriverApplicationScreen; 