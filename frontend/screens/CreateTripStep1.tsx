// screens/EnhancedCreateTripStep1.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TextInput, // Import TextInput
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Navbar from '../components/Navbar';
// Use CrossPlatformMapPicker instead of EnhancedLocationPicker
import CrossPlatformMapPicker from '../components/CrossPlatformMapPicker';
import EnhancedTimePicker from '../components/EnhancedTimePicker';
// Removed TextInput import from 'react-native' as it's already imported above

type CreateTripStep1NavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateTripStep1'
>;

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface LocationData {
  address: string;
  coordinates: LocationCoordinates;
}

export interface TripForm {
  pickup: string;
  pickupCoordinates: LocationCoordinates | null;
  dropOff: string;
  dropOffCoordinates: LocationCoordinates | null;
  matchSocial: boolean;
  selectedSeats: number;
  timeToReach: string; // Store the formatted string for display
  arrivalTime: Date; // Store the actual Date object
  sector?: string;
  distance?: number; // Store calculated distance
  fare?: number; // Store calculated fare
}

const CreateTripStep1: React.FC = () => {
  const navigation = useNavigation<CreateTripStep1NavigationProp>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(false);

  const [form, setForm] = useState<TripForm>({
    pickup: '',
    pickupCoordinates: null,
    dropOff: '',
    dropOffCoordinates: null,
    matchSocial: false,
    selectedSeats: 1,
    timeToReach: '', // Initialize as empty string
    arrivalTime: new Date(Date.now() + 60 * 60 * 1000), // Default to 1 hour from now
    sector: 'G8', // Default sector
  });

  const [errors, setErrors] = useState({
    pickup: '',
    dropOff: '',
    timeToReach: '', // Use arrivalTime for validation, this field is for display
  });

  // Location picker state
  const [isLocationPickerVisible, setIsLocationPickerVisible] = useState<boolean>(false);
  const [activeLocationField, setActiveLocationField] = useState<'pickup' | 'dropOff' | null>(null);

  // Time picker state
  const [isTimePickerVisible, setIsTimePickerVisible] = useState<boolean>(false);

  // Minimum arrival time (e.g., 1 hour from now)
  const minimumArrivalTime = new Date();
  minimumArrivalTime.setHours(minimumArrivalTime.getHours() + 1);

  useEffect(() => {
    // Check if there's already form data in AsyncStorage
    const checkFormData = async () => {
      try {
        const savedFormData = await AsyncStorage.getItem('tripForm');
        if (savedFormData) {
          const parsedData = JSON.parse(savedFormData) as TripForm;
          // Convert stored arrival time string back to Date object
          if (parsedData.arrivalTime && typeof parsedData.arrivalTime === 'string') {
            parsedData.arrivalTime = new Date(parsedData.arrivalTime);
          }
          // Ensure arrivalTime is a Date object, default if invalid
          if (!(parsedData.arrivalTime instanceof Date) || isNaN(parsedData.arrivalTime.getTime())) {
             parsedData.arrivalTime = new Date(Date.now() + 60 * 60 * 1000); // Default again
          }
          // Format timeToReach based on loaded arrivalTime
          if(parsedData.arrivalTime){
              parsedData.timeToReach = formatArrivalTime(parsedData.arrivalTime);
          }

          setForm(parsedData);
        } else {
          // If no saved data, try to get current location
          getCurrentLocation();
           // Set initial timeToReach string based on default arrivalTime
          setForm(prev => ({...prev, timeToReach: formatArrivalTime(prev.arrivalTime)}));
        }
      } catch (error) {
        console.error('Error checking form data:', error);
        // If error, still try to get current location
        getCurrentLocation();
        // Set initial timeToReach string based on default arrivalTime
        setForm(prev => ({...prev, timeToReach: formatArrivalTime(prev.arrivalTime)}));
      }
    };

    checkFormData();
  }, []); // Run only once on mount

  const getCurrentLocation = async () => {
    setIsLocationLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Try background permissions if foreground fails (might be needed for some scenarios)
        status = (await Location.requestBackgroundPermissionsAsync()).status;
      }

      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to automatically detect your pickup location.',
          [{ text: 'OK' }]
        );
        setIsLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // Balanced accuracy is usually sufficient and faster
      });

      if (location) {
        const { latitude, longitude } = location.coords;

        // Try to get a human-readable address
        const addressResponse = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

        let addressText = 'Current Location'; // Default

        if (addressResponse && addressResponse.length > 0) {
          const address = addressResponse[0];
          // Construct a more readable address format
          const parts = [
            address.name, // Often includes building name or POI
            address.streetNumber ? `${address.streetNumber} ${address.street}` : address.street,
            address.district, // e.g., Sector G-8
            address.city,
            address.postalCode,
            address.country
          ].filter(Boolean); // Remove null/undefined parts
          addressText = parts.slice(0, 3).join(', '); // Take the first few relevant parts
          if (!addressText || addressText.toLowerCase() === 'unnamed road') {
              addressText = `${address.city || 'Near'}, ${address.region || ''}`.trim().replace(/^,|,$/, ''); // Fallback if street name is bad
          }
        } else {
            addressText = `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`; // Fallback if geocoding fails
        }


        const sector = determineSector({ latitude, longitude });

        // Update form with current location data
        setForm(prevForm => ({
          ...prevForm,
          pickup: addressText,
          pickupCoordinates: { latitude, longitude },
          sector,
        }));
        // Clear pickup error if location is fetched successfully
        setErrors(prevErrors => ({ ...prevErrors, pickup: '' }));
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Could not determine your current location. Please enter it manually or try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLocationLoading(false);
    }
  };

  // Simplified sector determination based on coordinates (example)
  const determineSector = (coordinates: LocationCoordinates): string => {
    const { latitude, longitude } = coordinates;
    // Example mapping for Islamabad sectors (Adjust ranges as needed)
    if (latitude > 33.705 && latitude < 33.715 && longitude > 73.045 && longitude < 73.060) return 'G-8';
    if (latitude > 33.695 && latitude < 33.705 && longitude > 73.045 && longitude < 73.060) return 'G-9';
    if (latitude > 33.685 && latitude < 33.695 && longitude > 73.045 && longitude < 73.060) return 'G-10';
    if (latitude > 33.705 && latitude < 33.715 && longitude > 73.030 && longitude < 73.045) return 'F-8';
    return 'Unknown'; // Default if no match
  };

  const handleChange = (field: keyof TripForm, value: string | boolean | number | Date) => {
    setForm({ ...form, [field]: value });

    // Reset error for the field being changed
    if (field === 'pickup' && typeof value === 'string' && value.trim()) {
      setErrors({ ...errors, pickup: '' });
    }
    if (field === 'dropOff' && typeof value === 'string' && value.trim()) {
      setErrors({ ...errors, dropOff: '' });
    }
    if (field === 'arrivalTime' && value instanceof Date) {
        setErrors({ ...errors, timeToReach: '' });
        // Also update the display string when arrivalTime changes
        setForm(prev => ({ ...prev, timeToReach: formatArrivalTime(value as Date) }));
    }
  };

  // Format arrival time for display
    const formatArrivalTime = (date: Date | null | undefined): string => {
        if (!date || !(date instanceof Date)) {
            return 'Select arrival time...';
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let dateStr = '';
        if (date.toDateString() === today.toDateString()) {
            dateStr = 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            dateStr = 'Tomorrow';
        } else {
            dateStr = date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric'
            });
        }

        const timeStr = date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        return `${dateStr} at ${timeStr}`;
    };


  const validate = () => {
    let valid = true;
    const newErrors = { pickup: '', dropOff: '', timeToReach: '' };

    if (!form.pickup.trim()) {
      newErrors.pickup = 'Pickup location is required';
      valid = false;
    }
    if (!form.dropOff.trim()) {
      newErrors.dropOff = 'Drop-off location is required';
      valid = false;
    }
    // Validate using the arrivalTime Date object
    if (!form.arrivalTime || !(form.arrivalTime instanceof Date) || isNaN(form.arrivalTime.getTime())) {
      newErrors.timeToReach = 'Arrival time is required';
      valid = false;
    } else if (form.arrivalTime < minimumArrivalTime) {
      // Check if selected time is before the minimum allowed time
      newErrors.timeToReach = `Arrival time must be at least ${formatArrivalTime(minimumArrivalTime)}`;
      valid = false;
    }


    setErrors(newErrors);
    return valid;
  };

  const handleContinue = async () => {
    if (validate()) {
      setIsLoading(true);
      try {
        // Ensure coordinates exist, geocode if necessary (or use fallback)
        let formData = { ...form };

        // Geocode pickup if needed (e.g., if entered manually without map)
        if (formData.pickup && !formData.pickupCoordinates) {
            try {
                const geocodeResult = await Location.geocodeAsync(formData.pickup);
                if (geocodeResult.length > 0) {
                    formData.pickupCoordinates = { latitude: geocodeResult[0].latitude, longitude: geocodeResult[0].longitude };
                    formData.sector = determineSector(formData.pickupCoordinates); // Recalculate sector
                } else {
                     console.warn(`Could not geocode pickup address: ${formData.pickup}`);
                     // Maybe alert user or use a default? For now, proceed without coordinates.
                }
            } catch (geoError) {
                console.error('Geocoding error for pickup:', geoError);
            }
        }

        // Geocode dropoff if needed
         if (formData.dropOff && !formData.dropOffCoordinates) {
            try {
                const geocodeResult = await Location.geocodeAsync(formData.dropOff);
                if (geocodeResult.length > 0) {
                    formData.dropOffCoordinates = { latitude: geocodeResult[0].latitude, longitude: geocodeResult[0].longitude };
                } else {
                     console.warn(`Could not geocode dropoff address: ${formData.dropOff}`);
                     // Maybe alert user or use a default?
                }
            } catch (geoError) {
                console.error('Geocoding error for dropoff:', geoError);
            }
        }


        // Calculate distance and fare only if both coordinates are available
        if (formData.pickupCoordinates && formData.dropOffCoordinates) {
          const distanceKm = calculateDistance(
            formData.pickupCoordinates,
            formData.dropOffCoordinates
          );
          formData.distance = distanceKm;
          formData.fare = Math.max(50, Math.round(distanceKm * 25)); // Example: Rs. 25/km, min fare 50
        } else {
           // Handle case where coordinates are missing - maybe use estimate or default?
           formData.distance = undefined; // Or a default estimate like 10
           formData.fare = undefined; // Or a default estimate like 150
           console.warn("Cannot calculate distance/fare, coordinates missing.");
        }


        // Store the potentially updated form data
        // Convert Date object to string for storage
        const dataToStore = {
            ...formData,
            arrivalTime: formData.arrivalTime.toISOString(), // Store as ISO string
        };
        await AsyncStorage.setItem('tripForm', JSON.stringify(dataToStore));

        // Navigate to the next step
        navigation.navigate('CreateTripStep2');
      } catch (error) {
        console.error('Error saving form data:', error);
        Alert.alert('Error', 'Failed to save trip details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      Alert.alert('Missing Information', 'Please fill in all required fields and select a valid arrival time.');
    }
  };

  // Haversine formula for distance calculation
  const calculateDistance = (
    point1: LocationCoordinates | null,
    point2: LocationCoordinates | null
  ): number => {
    if (!point1 || !point2) {
      return 0; // Return 0 if coordinates are missing
    }

    const R = 6371; // Radius of the Earth in km
    const dLat = degreesToRadians(point2.latitude - point1.latitude);
    const dLon = degreesToRadians(point2.longitude - point1.longitude);
    const lat1Rad = degreesToRadians(point1.latitude);
    const lat2Rad = degreesToRadians(point2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const degreesToRadians = (degrees: number): number => {
    return degrees * (Math.PI / 180);
  };

  const handleCancel = () => {
    Alert.alert(
        "Cancel Trip Creation?",
        "Are you sure you want to discard this trip?",
        [
            { text: "Keep Editing", style: "cancel" },
            {
                text: "Discard",
                style: "destructive",
                onPress: async () => {
                    try {
                        await AsyncStorage.removeItem('tripForm');
                        navigation.navigate('Homepage');
                    } catch (error) {
                        console.error('Error clearing form data:', error);
                        navigation.navigate('Homepage'); // Navigate anyway
                    }
                }
            }
        ]
    );
  };

  // Handle location selection from the picker
  const handleLocationSelect = (address: string, coordinates: LocationCoordinates) => {
    if (activeLocationField === 'pickup') {
      const sector = determineSector(coordinates);
      setForm(prev => ({
        ...prev,
        pickup: address,
        pickupCoordinates: coordinates,
        sector
      }));
      setErrors(prev => ({ ...prev, pickup: '' })); // Clear error on selection
    } else if (activeLocationField === 'dropOff') {
      setForm(prev => ({
        ...prev,
        dropOff: address,
        dropOffCoordinates: coordinates
      }));
       setErrors(prev => ({ ...prev, dropOff: '' })); // Clear error on selection
    }

    // Reset active field and close the picker
    setActiveLocationField(null);
    setIsLocationPickerVisible(false);
  };

  // Handle time selection from the picker
  const handleTimeSelect = (time: Date) => {
    // Ensure the selected time is not before the minimum allowed time
    const validTime = time < minimumArrivalTime ? new Date(minimumArrivalTime) : time;

    setForm(prev => ({
      ...prev,
      arrivalTime: validTime,
      timeToReach: formatArrivalTime(validTime) // Update display string
    }));
    setErrors(prev => ({ ...prev, timeToReach: '' })); // Clear error
    setIsTimePickerVisible(false);
  };

  // Function to open the location picker
  const openLocationPicker = (field: 'pickup' | 'dropOff') => {
      setActiveLocationField(field);
      setIsLocationPickerVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} // Use 'height' for Android if needed
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} // Adjust offset if header is present
      >
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled" // Ensures taps work even when keyboard is up
        >
          {/* Title & Step Indicator */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Create Trip</Text>
            {/* Progress Indicator (Simplified) */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressStep, styles.currentStep]}>
                <Text style={styles.progressTextActive}>1</Text>
                </View>
                <View style={styles.lineInactive} />
                <View style={styles.progressStep}>
                <Text style={styles.progressTextInactive}>2</Text>
                </View>
                <View style={styles.lineInactive} />
                <View style={styles.progressStep}>
                <Text style={styles.progressTextInactive}>3</Text>
                </View>
                <View style={styles.lineInactive} />
                <View style={styles.progressStep}>
                <Text style={styles.progressTextInactive}>4</Text>
                </View>
            </View>
             <Text style={styles.stepInfo}>Step 1 of 4: Ride Details</Text>
          </View>

          {/* Pick Up Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pick Up Location</Text>
            <TouchableOpacity
              style={[styles.inputWithIcon, errors.pickup ? styles.inputErrorBorder : null]}
              onPress={() => openLocationPicker('pickup')}
              disabled={isLocationLoading}
            >
              <Image
                source={require('../assets/images/Address Icon.png')} // Replace with your icon path
                style={styles.inputIcon}
                resizeMode="contain"
              />
              {/* Use Text instead of non-editable TextInput for better display */}
              <Text
                  style={[styles.inputText, !form.pickup && styles.placeholderText]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
              >
                  {form.pickup || 'Enter pickup location'}
              </Text>
              {isLocationLoading && (
                <ActivityIndicator size="small" color="#113a78" style={styles.inputLoader} />
              )}
            </TouchableOpacity>
            {errors.pickup ? <Text style={styles.errorText}>{errors.pickup}</Text> : null}

            {/* Button to use current location */}
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={isLocationLoading}
            >
              <Image
                source={require('../assets/images/Location Icon.png')} // Replace with your icon path
                style={styles.locationIcon}
                resizeMode="contain"
              />
              <Text style={styles.locationButtonText}>Use current location</Text>
            </TouchableOpacity>
          </View>

          {/* Drop Off Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Drop Off Location</Text>
            <TouchableOpacity
              style={[styles.inputWithIcon, errors.dropOff ? styles.inputErrorBorder : null]}
              onPress={() => openLocationPicker('dropOff')}
            >
              <Image
                source={require('../assets/images/Address Icon.png')} // Replace with your icon path
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <Text
                  style={[styles.inputText, !form.dropOff && styles.placeholderText]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
              >
                  {form.dropOff || 'Enter drop-off location'}
              </Text>
            </TouchableOpacity>
            {errors.dropOff ? <Text style={styles.errorText}>{errors.dropOff}</Text> : null}
          </View>

          {/* Social Preferences Checkbox */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleChange('matchSocial', !form.matchSocial)}
              activeOpacity={0.7} // Provide feedback on press
            >
              <View style={[styles.checkbox, form.matchSocial && styles.checkboxChecked]}>
                {form.matchSocial && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.checkboxLabel}>Match with companions based on interests</Text>
            </TouchableOpacity>
          </View>

          {/* Number of Seats */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Number of Passengers</Text>
            <View style={styles.seatButtonContainer}>
              {[1, 2, 3, 4].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.seatButton,
                    form.selectedSeats === num && styles.seatButtonSelected,
                  ]}
                  onPress={() => handleChange('selectedSeats', num)}
                >
                  <Text style={[
                    styles.seatButtonText,
                    form.selectedSeats === num && styles.seatButtonTextSelected
                  ]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time to Reach */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Desired Arrival Time</Text>
            <TouchableOpacity
              style={[styles.timePickerButton, errors.timeToReach ? styles.inputErrorBorder : null]}
              onPress={() => setIsTimePickerVisible(true)}
            >
              <Image
                source={require('../assets/images/Blue time Icon.png')} // Replace with your icon path
                style={styles.timeIcon}
                resizeMode="contain"
              />
              <Text style={styles.timePickerText}>
                {form.timeToReach || 'Select arrival time...'}
              </Text>
            </TouchableOpacity>
            {errors.timeToReach ? <Text style={styles.errorText}>{errors.timeToReach}</Text> : null}
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    {/* Changed text to "Cancel" to match functionality */}
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Location Picker Modal */}
      <CrossPlatformMapPicker
        isVisible={isLocationPickerVisible}
        onClose={() => setIsLocationPickerVisible(false)}
        onLocationSelect={handleLocationSelect}
        // Pass initial location based on the active field
        initialLocation={activeLocationField === 'pickup' ? form.pickupCoordinates : form.dropOffCoordinates}
        initialAddress={activeLocationField === 'pickup' ? form.pickup : form.dropOff}
        placeholderText={`Search ${activeLocationField === 'pickup' ? 'pickup' : 'drop-off'} location...`}
      />

      {/* Time Picker Modal */}
      <EnhancedTimePicker
        isVisible={isTimePickerVisible}
        onClose={() => setIsTimePickerVisible(false)}
        onTimeSelect={handleTimeSelect}
        initialTime={form.arrivalTime}
        minimumTime={minimumArrivalTime} // Pass minimum time constraint
      />

      {/* Navbar */}
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Lighter background
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 100, // Space for Navbar + buttons
    flexGrow: 1, // Ensure ScrollView content can grow
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 30, // More space below title/progress
  },
  titleText: {
    fontSize: 24, // Slightly larger title
    fontWeight: '600',
    color: '#113a78',
    fontFamily: 'Inter', // Use Inter font if available
    marginBottom: 20, // Space below title
  },
  // --- Progress Bar Styles ---
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%', // Control overall width
    marginBottom: 10, // Space below progress bar
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e6effc', // Default inactive background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0e0f8', // Border for inactive steps
  },
  currentStep: {
    backgroundColor: '#113a78', // Blue for current step
    borderColor: '#113a78',
  },
  progressTextActive: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff', // White text
  },
  progressTextInactive: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#aab8c2', // Gray text
  },
  lineInactive: {
    flex: 1, // Take up space between circles
    height: 2,
    backgroundColor: '#e6effc', // Gray line for inactive segments
    marginHorizontal: 5,
  },
  // --- End Progress Bar ---
  stepInfo: {
    fontSize: 16, // Larger step info
    color: '#5a87c9', // Use secondary blue color
    fontFamily: 'Inter',
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 20, // Consistent spacing
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500', // Medium weight label
    color: '#113a78',
    marginBottom: 8, // Space below label
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8, // Slightly more rounded corners
    paddingHorizontal: 12,
    backgroundColor: '#fff', // White background for input area
    minHeight: 50, // Ensure consistent height
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12, // More space after icon
    tintColor: '#5a87c9', // Tint icon color
  },
  // Style for Text used as input display
  inputText: {
    flex: 1,
    paddingVertical: 14, // Adjust padding for text
    fontSize: 16, // Match input text size
    fontFamily: 'Inter',
    color: '#333', // Standard text color
  },
  placeholderText: {
      color: '#a0a0a0', // Placeholder color
  },
  // Remove pointerEvents style here, apply conditionally if needed elsewhere
  // input: {
  //   flex: 1,
  //   paddingVertical: 12, // Consistent padding
  //   fontSize: 16,
  //   fontFamily: 'Inter',
  //   color: '#113a78',
  // },
  inputErrorBorder: {
      borderColor: '#d9534f', // Red border for errors
  },
  errorText: {
    color: '#d9534f', // Error red color
    fontSize: 13, // Slightly larger error text
    fontFamily: 'Inter',
    marginTop: 5, // Space above error message
    marginLeft: 2, // Align slightly with input
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10, // Space above button
    alignSelf: 'flex-start', // Align to left
    paddingVertical: 5, // Add padding for better tap area
  },
  locationIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
    tintColor: '#ff9020', // Use accent color
  },
  locationButtonText: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#ff9020', // Accent color text
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10, // Add padding
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4, // Slightly rounded checkbox
    borderWidth: 2, // Thicker border
    borderColor: '#113a78',
    marginRight: 12, // More space
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Ensure white background
  },
  checkboxChecked: {
    backgroundColor: '#113a78',
    borderColor: '#113a78',
  },
  checkboxInner: { // Checkmark style
    width: 12,
    height: 12,
    backgroundColor: '#ffffff', // White checkmark
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 15, // Slightly larger label
    fontFamily: 'Inter',
    color: '#333', // Darker text color
    flex: 1, // Allow label to wrap
  },
  seatButtonContainer: {
    flexDirection: 'row',
    marginTop: 5,
    justifyContent: 'space-between', // Distribute buttons evenly
  },
  seatButton: {
    width: 60, // Wider buttons
    height: 45, // Taller buttons
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginRight: 10, // Keep some margin
  },
  seatButtonSelected: {
    backgroundColor: '#ff9020', // Accent color for selected
    borderColor: '#ff9020',
  },
  seatButtonText: {
    fontSize: 18, // Larger number
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#113a78',
  },
  seatButtonTextSelected: {
    color: '#ffffff',
  },
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14, // Consistent padding
    backgroundColor: '#fff',
    minHeight: 50,
  },
  timeIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#5a87c9',
  },
  timePickerText: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#333',
    flex: 1, // Allow text to take space
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Keep space between
    marginTop: 30, // Space above buttons
    paddingHorizontal: 5, // Slight padding to align with content edges
  },
  loader: {
    flex: 1,
    height: 50, // Ensure loader takes button space
    alignSelf: 'center',
  },
  cancelButton: {
    flex: 1, // Take half space
    backgroundColor: '#e0e0e0', // Lighter gray
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10, // Space between buttons
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#555', // Dark gray text
  },
  continueButton: {
    flex: 1, // Take half space
    backgroundColor: '#113a78', // Primary blue
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10, // Space between buttons
  },
  continueButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
    inputLoader: {
    marginLeft: 10, // Space loader from text
  },
});

export default CreateTripStep1;