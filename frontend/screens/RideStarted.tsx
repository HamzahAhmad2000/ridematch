// screens/RideStarted.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import { RideService } from '../services/ride';

type RideStartedRouteProp = RouteProp<RootStackParamList, 'RideStarted'>;
type RideStartedNavigationProp = StackNavigationProp<RootStackParamList, 'RideStarted'>;

interface Passenger {
  id: string;
  name: string;
  pickupLocation: string;
  hasArrived: boolean;
}

interface RideStatus {
  status: 'preparing' | 'picking_up' | 'in_progress' | 'completed';
  driver: {
    name: string;
    rating: number;
    carType: string;
  };
  pickupTime: string;
  dropoffTime: string;
  currentLocation: string;
  passengers: Passenger[];
  fare: number;
  distance: number;
  isDriver: boolean;
}

const RideStarted: React.FC = () => {
  const navigation = useNavigation<RideStartedNavigationProp>();
  const route = useRoute<RideStartedRouteProp>();
  const { rideId } = route.params || { rideId: '' };
  
  const [rideStatus, setRideStatus] = useState<RideStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load ride status
    loadRideStatus();
    
    // Set up a timer to periodically refresh the ride status
    const refreshInterval = setInterval(loadRideStatus, 10000); // Refresh every 10 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [rideId]);

  const loadRideStatus = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would fetch real data from a backend API
      // For demo purposes, we'll create mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockRideStatus: RideStatus = {
        status: 'in_progress',
        driver: {
          name: 'Ahmed Khan',
          rating: 4.8,
          carType: 'Premium',
        },
        pickupTime: '09:30 AM',
        dropoffTime: '10:15 AM',
        currentLocation: 'G-8 Sector, Islamabad',
        passengers: [
          {
            id: '1',
            name: 'Sarah Ali',
            pickupLocation: 'Blue Area, Islamabad',
            hasArrived: true,
          },
          {
            id: '2',
            name: 'Muhammad Bilal',
            pickupLocation: 'F-8 Markaz, Islamabad',
            hasArrived: false,
          },
          {
            id: '3',
            name: 'Ayesha Tariq',
            pickupLocation: 'G-9 Sector, Islamabad',
            hasArrived: false,
          },
        ],
        fare: 600,
        distance: 15,
        isDriver: false, // Set to true if the current user is the driver
      };
      
      setRideStatus(mockRideStatus);
    } catch (error) {
      console.error('Error loading ride status:', error);
      Alert.alert('Error', 'Failed to load ride status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImHere = async () => {
    try {
      setIsLoading(true);
      
      // In a real app, this would notify the backend that the user has arrived
      await RideService.setArrivalStatus(rideId, true);
      
      // Update local state to reflect this change
      if (rideStatus) {
        const updatedPassengers = rideStatus.passengers.map(passenger => {
          if (passenger.id === '2') { // Assume '2' is the current user's ID for demo
            return { ...passenger, hasArrived: true };
          }
          return passenger;
        });
        
        setRideStatus({
          ...rideStatus,
          passengers: updatedPassengers,
        });
      }
      
      Alert.alert('Success', 'Your arrival has been confirmed!');
    } catch (error) {
      console.error('Error setting arrival status:', error);
      Alert.alert('Error', 'Failed to update arrival status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactDriver = () => {
    if (!rideStatus) return;
    
    navigation.navigate('Chat', {
      userId: 'driver-id', // In a real app, this would be the actual driver ID
      name: rideStatus.driver.name,
    } as any);
  };

  const handleEmergency = () => {
    Alert.alert(
      'Emergency',
      'Do you want to report an emergency?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Report Emergency',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would trigger an emergency protocol
            Alert.alert('Emergency Reported', 'Emergency contacts have been notified.');
          },
        },
      ]
    );
  };

  const handleEndRide = () => {
    Alert.alert(
      'End Ride',
      'Are you sure you want to end this ride?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End Ride',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // In a real app, this would update the ride status on the backend
              await RideService.updateRideStatus(rideId, 'completed');
              
              // Navigate back to homepage
              navigation.reset({
                index: 0,
                routes: [{ name: 'Homepage' as never }],
              });
            } catch (error) {
              console.error('Error ending ride:', error);
              Alert.alert('Error', 'Failed to end ride. Please try again.');
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading && !rideStatus) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#113a78" />
      </SafeAreaView>
    );
  }

  if (!rideStatus) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Ride information not found</Text>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Homepage' as never)}
        >
          <Text style={styles.homeButtonText}>Go to Homepage</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>
            {rideStatus.status === 'preparing' ? 'Preparing to start' :
              rideStatus.status === 'picking_up' ? 'Picking up passengers' :
              rideStatus.status === 'in_progress' ? 'Ride in progress' :
              'Ride completed'}
          </Text>
        </View>

        {/* Driver/Ride Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.driverInfo}>
            <View style={styles.driverImageContainer}>
              <Image
                source={require('../assets/images/Blue Profule icon.png')}
                style={styles.driverImage}
                resizeMode="contain"
              />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{rideStatus.driver.name}</Text>
              <View style={styles.ratingContainer}>
                <Image
                  source={require('../assets/images/Yellow Star Icon.png')}
                  style={styles.starIcon}
                  resizeMode="contain"
                />
                <Text style={styles.ratingText}>{rideStatus.driver.rating}</Text>
              </View>
              <Text style={styles.carType}>{rideStatus.driver.carType}</Text>
            </View>
          </View>

          <View style={styles.rideDetailsCard}>
            <View style={styles.rideDetailRow}>
              <View style={styles.rideDetailIconContainer}>
                <Image
                  source={require('../assets/images/Blue time Icon.png')}
                  style={styles.rideDetailIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.rideDetailTextContainer}>
                <Text style={styles.rideDetailLabel}>Pickup Time</Text>
                <Text style={styles.rideDetailValue}>{rideStatus.pickupTime}</Text>
              </View>
            </View>

            <View style={styles.rideDetailRow}>
              <View style={styles.rideDetailIconContainer}>
                <Image
                  source={require('../assets/images/Blue time Icon.png')}
                  style={styles.rideDetailIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.rideDetailTextContainer}>
                <Text style={styles.rideDetailLabel}>Dropoff Time (Est.)</Text>
                <Text style={styles.rideDetailValue}>{rideStatus.dropoffTime}</Text>
              </View>
            </View>

            <View style={styles.rideDetailRow}>
              <View style={styles.rideDetailIconContainer}>
                <Image
                  source={require('../assets/images/Location Icon.png')}
                  style={styles.rideDetailIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.rideDetailTextContainer}>
                <Text style={styles.rideDetailLabel}>Current Location</Text>
                <Text style={styles.rideDetailValue}>{rideStatus.currentLocation}</Text>
              </View>
            </View>

            <View style={styles.rideDetailRow}>
              <View style={styles.rideDetailIconContainer}>
                <Image
                  source={require('../assets/images/Blue Fare Icon.png')}
                  style={styles.rideDetailIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.rideDetailTextContainer}>
                <Text style={styles.rideDetailLabel}>Fare</Text>
                <Text style={styles.rideDetailValue}>{rideStatus.fare} Rs.</Text>
              </View>
            </View>

            <View style={styles.rideDetailRow}>
              <View style={styles.rideDetailIconContainer}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.rideDetailIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.rideDetailTextContainer}>
                <Text style={styles.rideDetailLabel}>Distance</Text>
                <Text style={styles.rideDetailValue}>{rideStatus.distance} km</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Passengers Section */}
        <View style={styles.passengersSection}>
          <Text style={styles.sectionTitle}>Passengers</Text>
          {rideStatus.passengers.map((passenger) => (
            <View key={passenger.id} style={styles.passengerCard}>
              <View style={styles.passengerInfo}>
                <View style={styles.passengerImageContainer}>
                  <Image
                    source={require('../assets/images/Blue Profule icon.png')}
                    style={styles.passengerImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.passengerDetails}>
                  <Text style={styles.passengerName}>{passenger.name}</Text>
                  <Text style={styles.passengerLocation}>{passenger.pickupLocation}</Text>
                </View>
              </View>
              <View style={styles.passengerStatus}>
                <Text style={[
                  styles.passengerStatusText,
                  passenger.hasArrived ? styles.arrivedText : styles.pendingText
                ]}>
                  {passenger.hasArrived ? 'Arrived' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!rideStatus.isDriver && (
            <TouchableOpacity
              style={styles.imHereButton}
              onPress={handleImHere}
              disabled={isLoading}
            >
              <Text style={styles.imHereButtonText}>I'm Here</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactDriver}
            disabled={isLoading}
          >
            <Text style={styles.contactButtonText}>
              {rideStatus.isDriver ? 'Contact Passengers' : 'Contact Driver'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={handleEmergency}
            disabled={isLoading}
          >
            <Text style={styles.emergencyButtonText}>Emergency</Text>
          </TouchableOpacity>

          {rideStatus.isDriver && (
            <TouchableOpacity
              style={styles.endRideButton}
              onPress={handleEndRide}
              disabled={isLoading}
            >
              <Text style={styles.endRideButtonText}>End Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fefefe',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fefefe',
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '500',
    color: '#c60000',
    marginBottom: 20,
    textAlign: 'center',
  },
  homeButton: {
    backgroundColor: '#113a78',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  homeButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  statusBar: {
    backgroundColor: '#113a78',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoCard: {
    backgroundColor: '#f0f6ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  driverImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverImage: {
    width: 30,
    height: 30,
  },
  driverDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  driverName: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 4,
  },
  ratingText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
  },
  carType: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#5a87c9',
  },
  rideDetailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
  },
  rideDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  rideDetailIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rideDetailIcon: {
    width: 20,
    height: 20,
  },
  rideDetailTextContainer: {
    flex: 1,
  },
  rideDetailLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666',
  },
  rideDetailValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  passengersSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 12,
  },
  passengerCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  passengerInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  passengerImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  passengerImage: {
    width: 20,
    height: 20,
  },
  passengerDetails: {
    justifyContent: 'center',
    flex: 1,
  },
  passengerName: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  passengerLocation: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666',
  },
  passengerStatus: {
    paddingHorizontal: 8,
  },
  passengerStatusText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  arrivedText: {
    backgroundColor: '#e0f7e0',
    color: '#519e15',
  },
  pendingText: {
    backgroundColor: '#fff0e0',
    color: '#ff9020',
  },
  actionButtons: {
    marginBottom: 24,
  },
  imHereButton: {
    backgroundColor: '#519e15',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  imHereButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  contactButton: {
    backgroundColor: '#113a78',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  contactButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  emergencyButton: {
    backgroundColor: '#c60000',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  emergencyButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  endRideButton: {
    backgroundColor: '#ff9020',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  endRideButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RideStarted;