// screens/RideList.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { RideHistoryService, RideHistoryItem } from '../services/rideHistory';
import Navbar from '../components/Navbar';
import { useAppNavigation } from '../navigationUtils';

const RideList: React.FC = () => {
  const navigation = useAppNavigation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled' | 'all'>('upcoming');

  useEffect(() => {
    loadRides();
  }, [activeTab]);

  const loadRides = async () => {
    setIsLoading(true);
    try {
      // Call the service to get ride history with appropriate filter
      const rideHistoryFilter: RideHistoryFilterOptions = {
        status: activeTab // This is now properly typed
      };
      
      const rideData = await RideHistoryService.getRideHistory(rideHistoryFilter);
      setRides(rideData);
    } catch (error) {
      console.error('Error loading rides:', error);
      Alert.alert('Error', 'Failed to load ride history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRidePress = (ride: RideHistoryItem) => {
    if (ride.status === 'upcoming') {
      // Navigate to active ride screen for upcoming rides
      navigation.navigate('RideStarted', { 
        rideId: ride.id 
      });
    } else {
      // Navigate to ride details for completed rides
      navigation.navigate('RideDetails', { 
        rideId: ride.id 
      });
    }
  };

  const renderRideItem = ({ item }: { item: RideHistoryItem }) => (
    <TouchableOpacity 
      style={styles.rideCard}
      onPress={() => handleRidePress(item)}
    >
      <View style={styles.rideHeader}>
        <Text style={styles.rideDate}>
          {new Date(item.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
        <View style={[
          styles.statusBadge,
          item.status === 'completed' ? styles.completedBadge :
          item.status === 'cancelled' ? styles.cancelledBadge : 
          styles.upcomingBadge
        ]}>
          <Text style={styles.statusText}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.routeContainer}>
        <View style={styles.locationContainer}>
          <View style={styles.locationIconContainer}>
            <View style={styles.originDot} />
            <View style={styles.routeLine} />
            <View style={styles.destinationDot} />
          </View>
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationText} numberOfLines={1}>{item.pickup_location.address}</Text>
            <Text style={styles.locationText} numberOfLines={1}>{item.dropoff_location.address}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.driverContainer}>
          <Image
            source={require('../assets/images/Blue Profule icon.png')}
            style={styles.driverIcon}
            resizeMode="contain"
          />
          <Text style={styles.driverText}>{item.driver.name}</Text>
        </View>
        <View style={styles.fareContainer}>
          <Image
            source={require('../assets/images/Blue Fare Icon.png')}
            style={styles.fareIcon}
            resizeMode="contain"
          />
          <Text style={styles.fareText}>{item.fare} Rs.</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Rides</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
      ) : rides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No {activeTab} rides found</Text>
          {activeTab === 'upcoming' && (
            <TouchableOpacity
              style={styles.createRideButton}
              onPress={() => navigation.navigate('CreateTripStep1')}
            >
              <Text style={styles.createRideButtonText}>Create a Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={rides}
          renderItem={renderRideItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ridesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Navbar */}
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  header: {
    padding: 15,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#113a78',
  },
  tabText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    fontWeight: '600',
    color: '#113a78',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  createRideButton: {
    backgroundColor: '#113a78',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createRideButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  ridesList: {
    padding: 15,
    paddingBottom: 120, // Add padding for navbar
  },
  rideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  rideDate: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  upcomingBadge: {
    backgroundColor: '#e0f7e0',
  },
  completedBadge: {
    backgroundColor: '#e6effc',
  },
  cancelledBadge: {
    backgroundColor: '#ffe0e0',
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#113a78',
  },
  routeContainer: {
    marginBottom: 15,
  },
  locationContainer: {
    flexDirection: 'row',
  },
  locationIconContainer: {
    width: 20,
    alignItems: 'center',
    marginRight: 10,
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#519e15',
  },
  routeLine: {
    width: 2,
    height: 25,
    backgroundColor: '#ccc',
    marginVertical: 2,
  },
  destinationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#c60000',
  },
  locationTextContainer: {
    flex: 1,
    height: 50,
    justifyContent: 'space-between',
  },
  locationText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#333',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverIcon: {
    width: 18,
    height: 18,
    marginRight: 5,
  },
  driverText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
  },
  fareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fareIcon: {
    width: 18,
    height: 18,
    marginRight: 5,
  },
  fareText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
    fontWeight: '500',
  },
});

export default RideList;