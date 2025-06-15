// screens/JoinRideConfirm.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RideService } from '../services/ride';
import Navbar from '../components/Navbar';

type RootStackParamList = {
  JoinRideConfirm: { rideId: string };
};

type JoinRideConfirmRouteProp = RouteProp<RootStackParamList, 'JoinRideConfirm'>;
type JoinRideConfirmNavigationProp = StackNavigationProp<RootStackParamList, 'JoinRideConfirm'>;

const JoinRideConfirm: React.FC = () => {
  const navigation = useNavigation<JoinRideConfirmNavigationProp>();
  const route = useRoute<JoinRideConfirmRouteProp>();
  const { rideId } = route.params || { rideId: '' };

  const [pickupAddress, setPickupAddress] = useState<string>('');
  const [isGroup, setIsGroup] = useState<boolean>(false);
  const [seatCount, setSeatCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rideDetails, setRideDetails] = useState<any>(null);

  useEffect(() => {
    // Load ride details
    if (rideId) {
      loadRideDetails();
    } else {
      setIsLoading(false);
      Alert.alert('Error', 'Ride information not found');
      navigation.goBack();
    }
  }, [rideId]);

  const loadRideDetails = async () => {
    setIsLoading(true);
    try {
      const details = await RideService.getRideDetails(rideId);
      setRideDetails(details);
    } catch (error) {
      console.error('Error loading ride details:', error);
      Alert.alert('Error', 'Failed to load ride details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRide = async () => {
    if (!pickupAddress.trim()) {
      Alert.alert('Error', 'Please enter your pickup location');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, we would use a geocoding service here
      // to convert the address to coordinates
      const mockCoordinates = {
        latitude: 37.78825,
        longitude: -122.4324,
      };

      // Join the ride
      await RideService.joinRide({
        ride_id: rideId,
        pickup_location: {
          address: pickupAddress,
          coordinates: mockCoordinates,
        },
        group_join: isGroup,
        seat_count: seatCount,
      });

      // Show success message
      Alert.alert(
        'Success',
        'You have successfully joined the ride!',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Homepage' as never),
          },
        ]
      );
    } catch (error) {
      console.error('Error joining ride:', error);
      Alert.alert('Error', 'Failed to join ride. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
        <Navbar />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Join Ride</Text>
          <Text style={styles.subtitle}>Enter your pickup location</Text>
        </View>

        {rideDetails && (
          <View style={styles.rideInfoCard}>
            <Text style={styles.rideInfoTitle}>Ride Details</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Image
                  source={require('../assets/images/Blue time Icon.png')}
                  style={styles.infoIcon}
                  resizeMode="contain"
                />
                <Text style={styles.infoLabel}>Route</Text>
              </View>
              <Text style={styles.infoValue}>
                {rideDetails.pickup_location.address} → {rideDetails.dropoff_location.address}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.infoIcon}
                  resizeMode="contain"
                />
                <Text style={styles.infoLabel}>Distance</Text>
              </View>
              <Text style={styles.infoValue}>{rideDetails.distance} km</Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Image
                  source={require('../assets/images/Blue Fare Icon.png')}
                  style={styles.infoIcon}
                  resizeMode="contain"
                />
                <Text style={styles.infoLabel}>Fare</Text>
              </View>
              <Text style={styles.infoValue}>{rideDetails.fare} Rs.</Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Image
                  source={require('../assets/images/Basic Icon.png')}
                  style={styles.infoIcon}
                  resizeMode="contain"
                />
                <Text style={styles.infoLabel}>Car Type</Text>
              </View>
              <Text style={styles.infoValue}>{rideDetails.car_type}</Text>
            </View>
          </View>
        )}

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Your Pickup Location</Text>
          <View style={styles.inputContainer}>
            <Image
              source={require('../assets/images/Address Icon.png')}
              style={styles.inputIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.input}
              placeholder="Enter your pickup address"
              placeholderTextColor="#bac3d1"
              value={pickupAddress}
              onChangeText={setPickupAddress}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.currentLocationButton}
            onPress={() => Alert.alert('Coming Soon', 'Location detection feature coming soon')}
          >
            <Image
              source={require('../assets/images/Location Icon.png')}
              style={styles.locationIcon}
              resizeMode="contain"
            />
            <Text style={styles.currentLocationText}>Use current location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.groupSection}>
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, isGroup && styles.checkboxChecked]}
              onPress={() => setIsGroup(!isGroup)}
            >
              {isGroup && <View style={styles.checkboxInner} />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Group Join</Text>
          </View>
          
          {isGroup && (
            <View style={styles.seatCountContainer}>
              <Text style={styles.seatCountLabel}>Number of Seats:</Text>
              <View style={styles.seatButtonContainer}>
                {[1, 2, 3, 4].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.seatButton,
                      seatCount === num && styles.seatButtonSelected,
                    ]}
                    onPress={() => setSeatCount(num)}
                  >
                    <Text style={styles.seatButtonText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.joinButton, !pickupAddress.trim() && styles.disabledButton]} 
            onPress={handleJoinRide}
            disabled={!pickupAddress.trim()}
          >
            <Text style={styles.joinButtonText}>Join Ride</Text>
          </TouchableOpacity>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#113a78',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  rideInfoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  rideInfoTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  infoLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
    maxWidth: '60%',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#113a78',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#113a78',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
  },
  currentLocationText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#ff9020',
  },
  groupSection: {
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
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
    fontSize: 16,
    color: '#113a78',
  },
  seatCountContainer: {
    marginTop: 10,
  },
  seatCountLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  seatButtonContainer: {
    flexDirection: 'row',
  },
  seatButton: {
    width: 40,
    height: 40,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ffbf7f',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffbf7f',
    marginRight: 10,
  },
  seatButtonSelected: {
    backgroundColor: '#ff9020',
  },
  seatButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#cccccc',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#113a78',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledButton: {
    backgroundColor: '#a0a0a0',
  },
  joinButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});

export default JoinRideConfirm;