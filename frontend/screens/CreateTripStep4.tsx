// screens/CreateTripStep4.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RideService, CreateRideForm } from '../services/ride';
import Navbar from '../components/Navbar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type CreateTripStep4NavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateTripStep4'
>;

const CreateTripStep4: React.FC = () => {
  const navigation = useNavigation<CreateTripStep4NavigationProp>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tripData, setTripData] = useState<any>({
    pickup: '',
    dropOff: '',
    carType: '',
    paymentMethod: '',
    promoCode: '',
    selectedSeats: 1,
    matchSocial: false,
    timeToReach: '',
    distance: '0 km',
    fare: '0 Rs.',
  });

  useEffect(() => {
    // Load all trip data
    const loadTripData = async () => {
      try {
        const storedData = await AsyncStorage.getItem('tripForm');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          setTripData(parsedData);
        }
      } catch (error) {
        console.error('Error loading trip data:', error);
        Alert.alert('Error', 'Failed to load trip details.');
      }
    };

    loadTripData();
  }, []);

  const handleBack = () => {
    navigation.navigate('CreateTripStep3');
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // Debug log the trip data
      console.log('🚗 Creating ride with trip data:', JSON.stringify(tripData, null, 2));
      
      // Format data for API call
      const rideData: CreateRideForm = {
        pickup_location: {
          address: tripData.pickup,
          coordinates: tripData.pickupCoordinates || { latitude: 0, longitude: 0 },
        },
        dropoff_location: {
          address: tripData.dropOff,
          coordinates: tripData.dropOffCoordinates || { latitude: 0, longitude: 0 },
        },
        car_type: tripData.carType || 'basic',
        passenger_slots: tripData.selectedSeats || 1,
        match_social: tripData.matchSocial || false,
        time_to_reach: tripData.timeToReach || '',
        payment_method: tripData.paymentMethod || 'cash',
        promo_code: tripData.promoCode || '',
        group_join: false,
        fare: (() => {
          if (typeof tripData.fare === 'number') {
            return tripData.fare;
          } else if (typeof tripData.fare === 'string') {
            return parseFloat(tripData.fare.replace(/[^0-9.]/g, '') || '0');
          } else {
            return 0; // Default fare if undefined
          }
        })(),
        distance: (() => {
          if (typeof tripData.distance === 'number') {
            return tripData.distance;
          } else if (typeof tripData.distance === 'string') {
            return parseFloat(tripData.distance.replace(/[^0-9.]/g, '') || '0');
          } else {
            return 0; // Default distance if undefined
          }
        })(),
        sector: 'G8', // Default sector - in a real app this would be derived from the location
      };

      // Debug log the formatted ride data
      console.log('📤 Sending ride data to API:', JSON.stringify(rideData, null, 2));

      // Create the ride
      const response = await RideService.createRide(rideData);
      console.log('✅ Ride created successfully:', response);

      // Clear trip form data
      await AsyncStorage.removeItem('tripForm');

      // Show success message
      Alert.alert(
        'Success',
        'Your ride has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Homepage'),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error creating ride:', error);
      
      // More detailed error logging
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      Alert.alert('Error', 'Failed to create ride. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format text and icons for different data types
  const getPaymentMethodText = () => {
    if (tripData.paymentMethod === 'card') {
      return 'MasterCard **** 2311'; // This would be dynamic in a real app
    }
    return 'Cash Payment';
  };

  const getPaymentIcon = () => {
    if (tripData.paymentMethod === 'card') {
      return require('../assets/images/Master Card Icon.png');
    }
    return require('../assets/images/Cash Payment Icon.png');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Ride Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.headerTitle}>Ride Confirmation</Text>

          <View style={styles.detailsContainer}>
            {/* Distance */}
            <View style={styles.detailRow}>
              <View style={styles.iconLabel}>
                <Image source={require('../assets/images/icon.png')} style={styles.detailIcon} resizeMode="contain" />
                <Text style={styles.detailLabel}>Distance</Text>
              </View>
              <Text style={styles.detailValue}>{tripData.distance || '0 km'}</Text>
            </View>

            {/* Fare */}
            <View style={styles.detailRow}>
              <View style={styles.iconLabel}>
                <Image source={require('../assets/images/Blue Fare Icon.png')} style={styles.detailIcon} resizeMode="contain" />
                <Text style={styles.detailLabel}>Fare</Text>
              </View>
              <Text style={styles.detailValue}>{tripData.fare || '0 Rs.'}</Text>
            </View>

            {/* Time */}
            <View style={styles.detailRow}>
              <View style={styles.iconLabel}>
                <Image source={require('../assets/images/Blue time Icon.png')} style={styles.detailIcon} resizeMode="contain" />
                <Text style={styles.detailLabel}>Time</Text>
              </View>
              <Text style={styles.detailValue}>{tripData.timeToReach || 'Not specified'}</Text>
            </View>

            {/* Address */}
            <View style={styles.detailRow}>
              <View style={styles.iconLabel}>
                <Image source={require('../assets/images/Address Icon.png')} style={styles.detailIcon} resizeMode="contain" />
                <Text style={styles.detailLabel}>Pickup</Text>
              </View>
              <Text style={styles.detailValue}>{tripData.pickup}</Text>
            </View>

            {/* Dropoff */}
            <View style={styles.detailRow}>
              <View style={styles.iconLabel}>
                <Image source={require('../assets/images/Address Icon.png')} style={styles.detailIcon} resizeMode="contain" />
                <Text style={styles.detailLabel}>Dropoff</Text>
              </View>
              <Text style={styles.detailValue}>{tripData.dropOff}</Text>
            </View>

            {/* Payment Method */}
            <View style={styles.detailRow}>
              <View style={styles.iconLabel}>
                <Image source={getPaymentIcon()} style={styles.detailIcon} resizeMode="contain" />
                <Text style={styles.detailLabel}>Payment</Text>
              </View>
              <Text style={styles.detailValue}>{getPaymentMethodText()}</Text>
            </View>

            {/* Carpool Mates */}
            <View style={styles.detailRow}>
              <View style={styles.iconLabel}>
                <Image source={require('../assets/images/Peers.png')} style={styles.detailIcon} resizeMode="contain" />
                <Text style={styles.detailLabel}>Carpool Mates</Text>
              </View>
              <Text style={styles.detailValue}>x{tripData.selectedSeats}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Text style={styles.buttonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                  <Text style={styles.buttonText}>Confirm Ride</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Add padding for navbar
  },
  detailsSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#fefefe',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailsContainer: {
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#e6e6e6',
    borderBottomWidth: 1,
  },
  iconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  detailLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#555',
  },
  detailValue: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#113a78',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#e6e6e6',
    paddingVertical: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#113a78',
    paddingVertical: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CreateTripStep4;