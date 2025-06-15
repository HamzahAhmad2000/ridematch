// screens/CreateTripStep2.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform, // Import Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navbar from '../components/Navbar';
// Use CrossPlatformMapPicker for location editing
import CrossPlatformMapPicker from '../components/CrossPlatformMapPicker';
import * as Location from 'expo-location'; // Import expo-location for geocoding/distance

// Get device dimensions for responsive scaling
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CreateTripStep2NavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateTripStep2'
>;

// Define car type interface
interface Car {
    id: string;
    title: string;
    description: string;
    image: any; // Adjust type if using remote images
    fareMultiplier: number; // Add fare multiplier
}

// Car data with fare multipliers
const cars: Car[] = [
  {
    id: 'basic',
    title: 'Basic',
    description: 'Easy ride, no A/C', // Shortened description
    image: require('../assets/images/Basic Icon.png'),
    fareMultiplier: 1.0,
  },
  {
    id: 'premium',
    title: 'Premium',
    description: 'Comfortable ride with A/C',
    image: require('../assets/images/Premium Icon.png'),
    fareMultiplier: 1.3, // 30% higher fare
  },
  {
    id: 'premium_plus',
    title: 'Premium +',
    description: 'Luxury ride with A/C',
    image: require('../assets/images/Premium Plus Icon.png'),
    fareMultiplier: 1.6, // 60% higher fare
  },
];

// Component for selecting a car type
const SelectCar = ({
  selectedCarId,
  onSelect,
  baseFare, // Pass base fare to calculate car-specific fare
}: {
  selectedCarId: string | null;
  onSelect: (car: Car) => void; // Pass the whole car object
  baseFare: number;
}) => {
  return (
    <View style={styles.carOptionsContainer}>
      {cars.map((car) => {
        const calculatedFare = Math.round(baseFare * car.fareMultiplier);
        return (
            <TouchableOpacity
                key={car.id}
                style={[
                styles.carOption,
                selectedCarId === car.id && styles.selectedCarOption,
                ]}
                onPress={() => onSelect(car)} // Pass the car object
                activeOpacity={0.7}
            >
                <Image source={car.image} style={styles.carImage} resizeMode="contain" />
                <Text style={styles.carTitle}>{car.title}</Text>
                <Text style={styles.carDescription}>{car.description}</Text>
                {/* Display calculated fare for this car type */}
                <Text style={styles.carFare}>~{calculatedFare} Rs.</Text>
            </TouchableOpacity>
        );
       })}
    </View>
  );
};

// Component for displaying ride info (distance, time, fare)
const RideInfoItem = ({
  icon,
  label,
  value, // Add value prop
}: {
  icon: any;
  label: string;
  value: string; // Value to display
}) => (
  <View style={styles.rideInfoItem}>
    <Image source={icon} style={styles.infoIcon} resizeMode="contain" />
    <View>
         <Text style={styles.infoLabel}>{label}</Text>
         <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

// Component for displaying location information
const LocationItem = ({
  type,
  address,
  onEdit,
}: {
  type: 'Pick Up' | 'Drop Off'; // Changed 'Pick' to 'Pick Up'
  address: string;
  onEdit: () => void;
}) => (
  <View style={styles.locationRow}>
    {/* <Image
        source={type === 'Pick Up' ? require('../assets/images/PickUp Icon.png') : require('../assets/images/DropOff Icon.png')} // Use specific icons
        style={styles.locationMarkerIcon}
        resizeMode="contain"
    /> */}
    <View style={styles.locationTextContainer}>
      <Text style={styles.locationType}>{type}</Text>
      <Text style={styles.locationAddress} numberOfLines={1} ellipsizeMode="tail">{address}</Text>
    </View>
    <TouchableOpacity style={styles.editIconContainer} onPress={onEdit}>
      <Image
        source={require('../assets/images/Blue Edit Icon.png')}
        style={styles.editIcon}
        resizeMode="contain"
      />
    </TouchableOpacity>
  </View>
);

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

// Update TripForm interface to match Step 1
interface TripForm {
  pickup: string;
  pickupCoordinates: LocationCoordinates | null;
  dropOff: string;
  dropOffCoordinates: LocationCoordinates | null;
  matchSocial: boolean;
  selectedSeats: number;
  timeToReach: string;
  arrivalTime: Date; // Add arrivalTime back
  sector?: string;
  distance?: number;
  fare?: number; // This will be the base fare
  carType?: string; // Add carType
}


const CreateTripStep2: React.FC = () => {
  const navigation = useNavigation<CreateTripStep2NavigationProp>();
  const [selectedCar, setSelectedCar] = useState<Car | null>(null); // Store the whole car object
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading true
  const [tripData, setTripData] = useState<TripForm | null>(null); // Initialize as null

  // Map modal state
  const [isMapModalVisible, setIsMapModalVisible] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<'pickup' | 'dropOff' | null>(null);

  // State for displayed ride details
  const [rideDetails, setRideDetails] = useState({
    distance: '0 km',
    time: '0 min',
    baseFare: '0 Rs.', // Base fare before car multiplier
  });

  // Haversine distance calculation (moved inside component or import from utils)
    const calculateDistance = (
        point1: LocationCoordinates,
        point2: LocationCoordinates
    ): number => {
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

    // Estimate travel time based on distance (simplified)
    const estimateTravelTime = (distance: number): string => {
        // Simple formula: ~3.5 minutes per km average + 5 min base
        const timeInMinutes = Math.round(distance * 3.5) + 5;
        if (timeInMinutes < 60) {
        return `${timeInMinutes} min`;
        } else {
        const hours = Math.floor(timeInMinutes / 60);
        const mins = timeInMinutes % 60;
        return `${hours} hr ${mins} min`;
        }
    };

    // Calculate base fare (example: Rs. 25/km + Rs. 50 base)
    const calculateBaseFare = (distance: number): number => {
        const baseFare = 50;
        const perKmRate = 25;
        return Math.max(baseFare, Math.round(baseFare + distance * perKmRate));
    };

    // Function to update trip details (distance, time, fare)
    const updateRideDetails = (data: TripForm) => {
        if (data.pickupCoordinates && data.dropOffCoordinates) {
            const distanceKm = calculateDistance(
                data.pickupCoordinates,
                data.dropOffCoordinates
            );
            const timeEst = estimateTravelTime(distanceKm);
            const baseFare = calculateBaseFare(distanceKm);

            setRideDetails({
                distance: `${distanceKm} km`,
                time: timeEst,
                baseFare: `${baseFare} Rs.`,
            });

            // Update tripData state with calculated distance and baseFare
            setTripData(prevData => prevData ? ({
                ...prevData,
                distance: distanceKm,
                fare: baseFare, // Store the calculated base fare
            }) : null);

             // Recalculate fare if a car is already selected
            if (selectedCar) {
                const finalFare = Math.round(baseFare * selectedCar.fareMultiplier);
                // Optionally update a separate state for final fare display if needed
                // setFinalFareDisplay(`${finalFare} Rs.`);
            }


        } else {
            // Reset if coordinates are missing
            setRideDetails({ distance: 'N/A', time: 'N/A', baseFare: 'N/A' });
             setTripData(prevData => prevData ? ({
                ...prevData,
                distance: undefined,
                fare: undefined,
            }) : null);
        }
    };


  useEffect(() => {
    // Load trip data from previous step
    const loadTripData = async () => {
      setIsLoading(true);
      try {
        const storedData = await AsyncStorage.getItem('tripForm');
        if (storedData) {
          const parsedData = JSON.parse(storedData) as TripForm;
           // Ensure arrivalTime is converted back to Date object
           if (parsedData.arrivalTime && typeof parsedData.arrivalTime === 'string') {
               parsedData.arrivalTime = new Date(parsedData.arrivalTime);
           }

          setTripData(parsedData);
          updateRideDetails(parsedData); // Calculate details based on loaded data

          // Pre-select car if it was saved previously
          if (parsedData.carType) {
              const previouslySelectedCar = cars.find(c => c.id === parsedData.carType);
              if (previouslySelectedCar) {
                  setSelectedCar(previouslySelectedCar);
              }
          }

        } else {
          // Handle case where no data is found (e.g., navigate back or show error)
          Alert.alert('Error', 'Trip details not found. Please go back and start again.', [
              { text: 'Go Back', onPress: () => navigation.navigate('CreateTripStep1') }
          ]);
        }
      } catch (error) {
        console.error('Error loading trip data:', error);
        Alert.alert('Error', 'Failed to load trip information.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTripData();
  }, []); // Load only once on mount

  // Handle location selection from map
  const handleLocationSelect = async (address: string, coordinates: LocationCoordinates) => {
    if (!tripData) return; // Guard clause

    let updatedTripData = { ...tripData };

    if (activeField === 'pickup') {
      updatedTripData = {
        ...updatedTripData,
        pickup: address,
        pickupCoordinates: coordinates,
      };
    } else if (activeField === 'dropOff') {
      updatedTripData = {
        ...updatedTripData,
        dropOff: address,
        dropOffCoordinates: coordinates,
      };
    }

    setTripData(updatedTripData); // Update local state immediately
    updateRideDetails(updatedTripData); // Recalculate distance, time, fare

    // Save updated data to AsyncStorage
    try {
        // Convert Date back to string for storage
       const dataToStore = {
           ...updatedTripData,
           arrivalTime: updatedTripData.arrivalTime.toISOString(),
       };
      await AsyncStorage.setItem('tripForm', JSON.stringify(dataToStore));
    } catch (error) {
      console.error('Error saving updated trip data:', error);
      Alert.alert("Save Error", "Could not update location details.");
    }

    // Reset active field
    setActiveField(null);
  };

  // Handle car selection
  const handleCarSelect = (car: Car) => {
      setSelectedCar(car);
      // If trip data and base fare exist, update the stored fare
      if (tripData && tripData.fare) {
          const baseFare = tripData.fare;
          const finalFare = Math.round(baseFare * car.fareMultiplier);
           // Note: We might want to store both base fare and final fare,
           // but for simplicity, let's update the 'fare' field in TripForm
           // to reflect the chosen car's fare for the next step.
           // Or, add a new field like 'finalFare'. Let's update 'fare'.
           // setTripData(prev => prev ? {...prev, fare: finalFare, carType: car.id} : null);
           // Let's keep tripData.fare as the BASE fare, and add carType
           setTripData(prev => prev ? {...prev, carType: car.id} : null);
      }
  };

  const handleContinue = async () => {
    if (!selectedCar) {
      Alert.alert('Selection Required', 'Please select a car type to continue.');
      return;
    }
    if (!tripData) {
         Alert.alert('Error', 'Trip data is missing.');
         return;
    }


    setIsLoading(true);
    try {
      // Update trip data with the selected car ID
      const updatedTripData = {
        ...tripData,
        carType: selectedCar.id,
        // Ensure fare reflects the selected car multiplier for final confirmation
        // If tripData.fare currently holds the base fare:
        fare: Math.round((tripData.fare || 0) * selectedCar.fareMultiplier),
      };

      // Convert Date to string before saving
        const dataToStore = {
            ...updatedTripData,
            arrivalTime: updatedTripData.arrivalTime.toISOString(),
        };
      await AsyncStorage.setItem('tripForm', JSON.stringify(dataToStore));

      // Navigate to next step
      navigation.navigate('CreateTripStep3');
    } catch (error) {
      console.error('Error saving car selection:', error);
      Alert.alert('Error', 'Failed to save car selection. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  // Open map for location editing
  const openMapForEdit = (field: 'pickup' | 'dropOff') => {
    setActiveField(field);
    setIsMapModalVisible(true);
  };

  // Render loading or main content
  if (isLoading || !tripData) {
      return (
          <SafeAreaView style={styles.container}>
              <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#113a78" />
                  <Text style={styles.loadingText}>Loading Ride Details...</Text>
              </View>
              <Navbar />
          </SafeAreaView>
      );
  }

  // Get base fare number for calculation
  const baseFareNumber = tripData.fare || 0;


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with step indicator */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Your Ride</Text>
            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressStep, styles.completedStep]}>
                <Text style={styles.progressTextActive}>1</Text>
                </View>
                <View style={styles.line} />
                <View style={[styles.progressStep, styles.currentStep]}>
                <Text style={styles.progressTextActive}>2</Text>
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
        </View>

        {/* Main content */}
        <View style={styles.contentContainer}>
          {/* Location section */}
          <View style={styles.locationContainer}>
              <LocationItem
                  type="Pick Up"
                  address={tripData.pickup}
                  onEdit={() => openMapForEdit('pickup')}
              />
              {/* Dotted line separator */}
              <View style={styles.dottedLine} />
              <LocationItem
                  type="Drop Off"
                  address={tripData.dropOff}
                  onEdit={() => openMapForEdit('dropOff')}
              />
          </View>

           {/* Ride details: distance, time, BASE fare */}
           <View style={styles.rideInfoContainer}>
            <RideInfoItem
              icon={require('../assets/images/icon.png')} // Distance Icon
              label="Distance"
              value={rideDetails.distance}
            />
             <View style={styles.infoSeparator} />
            <RideInfoItem
              icon={require('../assets/images/Blue time Icon.png')} // Time Icon
              label="Est. Time"
              value={rideDetails.time}
            />
             <View style={styles.infoSeparator} />
            <RideInfoItem
              icon={require('../assets/images/Blue Fare Icon.png')} // Fare Icon
              label="Base Fare"
              value={rideDetails.baseFare}
            />
          </View>


          <Text style={styles.sectionTitle}>Select Car Type</Text>
           <SelectCar
                selectedCarId={selectedCar?.id || null}
                onSelect={handleCarSelect}
                baseFare={baseFareNumber} // Pass base fare
            />

          {/* Navigation buttons */}
          <View style={styles.buttonContainer}>
            {isLoading ? ( // Use the main isLoading state
              <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.continueButton, !selectedCar && styles.disabledButton]}
                  onPress={handleContinue}
                  disabled={!selectedCar}
                >
                  <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Map Modal for Location Selection */}
      <CrossPlatformMapPicker
        isVisible={isMapModalVisible}
        onClose={() => setIsMapModalVisible(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={activeField === 'pickup' ? tripData.pickupCoordinates : tripData.dropOffCoordinates}
        initialAddress={activeField === 'pickup' ? tripData.pickup : tripData.dropOff}
        placeholderText={`Search ${activeField === 'pickup' ? 'pickup' : 'drop-off'} location...`}
      />

      {/* Navbar */}
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Light background
  },
   loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#113a78',
      fontFamily: 'Inter',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Space for Navbar + buttons
  },
  header: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 30, // Adjust top padding
    paddingBottom: 20,
    backgroundColor: '#fff', // White header background
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 22, // Adjusted size
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 20, // Space below title
  },
   // --- Progress Bar Styles (Copied from Step 1 for consistency) ---
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0e0f8',
  },
  completedStep: {
    backgroundColor: '#ff9020', // Orange for completed
    borderColor: '#ff9020',
  },
  currentStep: {
    backgroundColor: '#113a78', // Blue for current
    borderColor: '#113a78',
  },
  progressTextActive: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressTextInactive: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#aab8c2',
  },
  line: { // Active line
    flex: 1,
    height: 2,
    backgroundColor: '#ff9020', // Orange line for completed segments
    marginHorizontal: 5,
  },
  lineInactive: {
    flex: 1,
    height: 2,
    backgroundColor: '#e6effc',
    marginHorizontal: 5,
  },
  // --- End Progress Bar ---
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20, // Add padding top
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 15, // Space below title
    marginTop: 25, // Space above title
  },
  carOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Adjust spacing
    marginBottom: 30,
    flexWrap: 'wrap', // Allow wrapping if needed
  },
  carOption: {
    width: SCREEN_WIDTH * 0.28, // Adjust width based on screen size
    minHeight: 140, // Ensure consistent height
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute content vertically
    borderWidth: 1,
    borderColor: '#e0e0e0', // Lighter border
    borderRadius: 10,
    backgroundColor: '#ffffff',
    marginBottom: 10, // Add margin bottom for wrapped items
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCarOption: {
    borderWidth: 2,
    borderColor: '#113a78',
    backgroundColor: '#e6effc', // Light blue background
    elevation: 4,
  },
  carImage: {
    width: 55, // Slightly smaller image
    height: 35, // Adjusted height
    marginBottom: 8,
  },
  carTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600', // Bolder title
    color: '#113a78',
    textAlign: 'center',
    marginBottom: 3,
  },
  carDescription: {
    fontFamily: 'Inter',
    fontSize: 11, // Smaller description
    fontWeight: '400',
    color: '#5a87c9', // Muted blue color
    textAlign: 'center',
    marginBottom: 5, // Space before fare
    minHeight: 28, // Ensure space for 2 lines
  },
  carFare: {
      fontFamily: 'Inter',
      fontSize: 13,
      fontWeight: '600',
      color: '#113a78',
      textAlign: 'center',
      marginTop: 'auto', // Push fare to bottom
  },
  rideInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center', // Align items vertically
    marginVertical: 20,
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff', // White background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rideInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow items to take space
    justifyContent: 'center', // Center content within item
  },
  infoIcon: {
    width: 24, // Larger icons
    height: 24,
    marginRight: 8,
    tintColor: '#5a87c9', // Tint icons
  },
  infoLabel: {
      fontFamily: 'Inter',
      fontSize: 12, // Smaller label
      fontWeight: '500',
      color: '#666', // Gray label text
      marginBottom: 2,
  },
  infoValue: {
    fontFamily: 'Inter',
    fontSize: 14, // Value text size
    fontWeight: '600', // Bold value
    color: '#113a78', // Primary color value
  },
  infoSeparator: {
      width: 1,
      height: '60%', // Separator height
      backgroundColor: '#e0e0e0', // Light gray separator
      marginHorizontal: 5, // Space around separator
  },
  locationContainer: {
    marginBottom: 20, // Space below location section
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#eee',
     shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
   locationMarkerIcon: {
      width: 20,
      height: 20,
      marginRight: 10,
      // No tint needed if using specific icons
  },
  dottedLine: {
      height: 1,
      borderStyle: 'dashed',
      borderWidth: 0.5,
      borderColor: '#ccc',
      marginVertical: 0, // Remove vertical margin
      marginLeft: 30, // Indent line from icon
  },
  locationTextContainer: {
    flex: 1, // Take available space
    marginRight: 10, // Space before edit icon
  },
  locationType: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#888', // Lighter type label
    marginBottom: 2,
  },
  locationAddress: {
    fontFamily: 'Inter',
    fontSize: 15, // Slightly larger address
    fontWeight: '500',
    color: '#113a78',
  },
  editIconContainer: {
    padding: 8, // Larger tap area
  },
  editIcon: {
    width: 18, // Slightly smaller edit icon
    height: 18,
    tintColor: '#113a78' // Match primary color
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20, // Reduced margin top
    marginBottom: 20, // Add margin bottom
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50, // Match button height
  },
  backButton: {
    flex: 1, // Take half space
    backgroundColor: '#e0e0e0', // Lighter gray
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10, // Space between buttons
  },
  backButtonText: {
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
  disabledButton: {
    backgroundColor: '#aab8c2', // Muted color for disabled
    opacity: 0.7,
  },
  continueButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default CreateTripStep2;