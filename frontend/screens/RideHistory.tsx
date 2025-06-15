// screens/RideHistory.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useAppNavigation } from '../navigationUtils';
import { RideHistoryService, RideHistoryItem, RideHistoryFilterOptions } from '../services/rideHistory';
import Navbar from '../components/Navbar';

const RideHistory: React.FC = () => {
  const navigation = useAppNavigation();
  const [rides, setRides] = useState<RideHistoryItem[]>([]);
  const [filteredRides, setFilteredRides] = useState<RideHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<RideHistoryFilterOptions>({
    status: 'all',
    paymentMethod: 'all'
  });

  useEffect(() => {
    loadRideHistory();
  }, []);

  useEffect(() => {
    // Apply active tab as a filter
    if (activeTab === 'all') {
      setFilters({ ...filters, status: 'all' });
    } else {
      setFilters({ ...filters, status: activeTab });
    }
  }, [activeTab]);

  useEffect(() => {
    // Apply filters and search
    filterRides();
  }, [rides, searchText, filters]);

  const loadRideHistory = async () => {
    setIsLoading(true);
    try {
      const data = await RideHistoryService.getRideHistory(filters);
      setRides(data);
    } catch (error) {
      console.error('Error loading ride history:', error);
      Alert.alert('Error', 'Failed to load ride history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRideHistory();
    setIsRefreshing(false);
  };

  const filterRides = () => {
    let filtered = [...rides];

    // Apply status filter if not 'all'
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(ride => ride.status === filters.status);
    }

    // Apply payment method filter if not 'all'
    if (filters.paymentMethod && filters.paymentMethod !== 'all') {
      filtered = filtered.filter(ride => ride.payment_method === filters.paymentMethod);
    }

    // Apply search text filter
    if (searchText.trim()) {
      const lowerSearch = searchText.toLowerCase();
      filtered = filtered.filter(ride => 
        ride.pickup_location.address.toLowerCase().includes(lowerSearch) ||
        ride.dropoff_location.address.toLowerCase().includes(lowerSearch) ||
        ride.driver.name.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredRides(filtered);
  };

  const handleRidePress = (ride: RideHistoryItem) => {
    navigation.navigate('RideDetails', { rideId: ride.id });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#519e15'; // Green
      case 'cancelled':
        return '#c60000'; // Red
      case 'upcoming':
        return '#ff9020'; // Orange
      default:
        return '#666666'; // Gray
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    }
  };

  const renderRideItem = ({ item }: { item: RideHistoryItem }) => {
    const statusColor = getStatusColor(item.status);
    const formattedDate = formatDate(item.date);
    
    return (
      <TouchableOpacity 
        style={styles.rideCard}
        onPress={() => handleRidePress(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.locationInfo}>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
          <View style={[styles.statusChip, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.routeContainer}>
          <View style={styles.routeIcons}>
            <View style={styles.pickupDot} />
            <View style={styles.routeLine} />
            <View style={styles.dropoffDot} />
          </View>
          <View style={styles.routeInfo}>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.pickup_location.address}
            </Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.dropoff_location.address}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.driverInfo}>
            <Image
              source={require('../assets/images/Basic Icon.png')}
              style={styles.carIcon}
              resizeMode="contain"
            />
            <Text style={styles.driverText}>{item.driver.name}</Text>
          </View>
          
          <View style={styles.fareInfo}>
            {item.status !== 'cancelled' && (
              <Text style={styles.fareText}>{item.fare} Rs.</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'all' && styles.activeTab]}
        onPress={() => setActiveTab('all')}
      >
        <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
          All
        </Text>
      </TouchableOpacity>
      
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
          Completed
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'cancelled' && styles.activeTab]}
        onPress={() => setActiveTab('cancelled')}
      >
        <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>
          Cancelled
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require('../assets/images/White Ride History Icon.png')}
        style={[styles.emptyIcon, { tintColor: '#ccc' }]}
        resizeMode="contain"
      />
      <Text style={styles.emptyTitle}>No rides found</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'all' 
          ? 'You haven\'t taken any rides yet'
          : activeTab === 'upcoming'
            ? 'You don\'t have any upcoming rides'
            : activeTab === 'completed'
              ? 'You don\'t have any completed rides'
              : 'You don\'t have any cancelled rides'
        }
      </Text>
      <TouchableOpacity
        style={styles.findRideButton}
        onPress={() => navigation.navigate('JoinRide')}
      >
        <Text style={styles.findRideButtonText}>Find a Ride</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Image
              source={require('../assets/images/White Back icon.png')}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ride History</Text>
        </View>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Image
            source={require('../assets/images/Blue Search Icon.png')}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rides..."
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Image
            source={require('../assets/images/Blue Edit Icon.png')}
            style={styles.filterIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      
      {renderFilterTabs()}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
      ) : (
        <FlatList
          data={filteredRides}
          renderItem={renderRideItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}
      
      <Navbar currentRoute="RideList" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  header: {
    backgroundColor: '#113a78',
    paddingTop: Platform.OS === 'ios' ? 0 : 40,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 5,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    alignItems: 'center',
    height: 40,
    marginRight: 10,
  },
  searchIcon: {
    width: 16,
    height: 16,
    tintColor: '#113a78',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#333',
  },
  filterButton: {
    width: 40,
    height: 40,
    backgroundColor: '#e6effc',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    width: 16,
    height: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
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
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    fontWeight: '600',
    color: '#113a78',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
    paddingBottom: 120, // For navbar spacing
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationInfo: {
    flex: 1,
  },
  dateText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
  },
  routeContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  routeIcons: {
    width: 24,
    alignItems: 'center',
    marginRight: 10,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#519e15',
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ccc',
    marginVertical: 2,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#c60000',
  },
  routeInfo: {
    flex: 1,
    justifyContent: 'space-between',
    height: 44,
  },
  addressText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  driverText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
  },
  fareInfo: {},
  fareText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  findRideButton: {
    backgroundColor: '#113a78',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  findRideButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
});

export default RideHistory;