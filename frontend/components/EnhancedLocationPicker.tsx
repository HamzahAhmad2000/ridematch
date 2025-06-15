// components/EnhancedLocationPicker.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  FlatList,
  KeyboardAvoidingView,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// Interface for location data
export interface LocationData {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

interface EnhancedLocationPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onLocationSelect: (locationData: LocationData) => void;
  initialLocation?: { latitude: number; longitude: number } | null;
  initialAddress?: string;
  placeholderText?: string;
  locationType: 'pickup' | 'dropoff';
}

// Mock API call for location search (replace with actual API integration)
const searchLocations = async (query: string) => {
  if (!query || query.length < 3) return [];
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock data - in a real app, this would call Google Places API or similar
  return [
    {
      id: '1',
      address: `${query} Street, Islamabad`,
      coordinates: { latitude: 33.6844, longitude: 73.0479 }
    },
    {
      id: '2',
      address: `${query} Avenue, Rawalpindi`,
      coordinates: { latitude: 33.5651, longitude: 73.0169 }
    },
    {
      id: '3',
      address: `${query} Road, Blue Area`,
      coordinates: { latitude: 33.7294, longitude: 73.0931 }
    }
  ];
};

// Recent locations storage
const getRecentLocations = async () => {
  // In a real app, this would retrieve from AsyncStorage
  return [
    {
      id: 'recent1',
      address: 'Home, G-8 Sector, Islamabad',
      coordinates: { latitude: 33.7088, longitude: 73.0513 }
    },
    {
      id: 'recent2',
      address: 'Office, Blue Area, Islamabad',
      coordinates: { latitude: 33.7167, longitude: 73.0693 }
    }
  ];
};

const EnhancedLocationPicker: React.FC<EnhancedLocationPickerProps> = ({
  isVisible,
  onClose,
  onLocationSelect,
  initialLocation,
  initialAddress,
  placeholderText = 'Search for a location...',
  locationType
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentLocations, setRecentLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentRegion, setCurrentRegion] = useState({
    latitude: initialLocation?.latitude || 33.6844,
    longitude: initialLocation?.longitude || 73.0479,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedAddress, setSelectedAddress] = useState(initialAddress || '');
  const [markerPosition, setMarkerPosition] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialLocation || null);
  
  const mapRef = useRef<MapView>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      // Load recent locations when modal opens
      const loadRecentLocations = async () => {
        try {
          const locations = await getRecentLocations();
          setRecentLocations(locations);
        } catch (error) {
          console.error('Failed to load recent locations:', error);
        }
      };
      
      loadRecentLocations();
      
      // Reset search results when modal opens
      setSearchResults([]);
      
      // Set initial values if provided
      if (initialLocation) {
        setMarkerPosition(initialLocation);
        setCurrentRegion({
          ...currentRegion,
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
        });
      }
      
      if (initialAddress) {
        setSelectedAddress(initialAddress);
      }
    }
  }, [isVisible, initialLocation, initialAddress]);

  // Handle search text changes with debounce
  const handleSearchChange = (text: string) => {
    setSearchText(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      if (text.length >= 3) {
        setLoading(true);
        try {
          const results = await searchLocations(text);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);
  };

  // Handle selecting a location from search results or recent locations
  const handleSelectLocation = (item: any) => {
    const { address, coordinates } = item;
    
    setSelectedAddress(address);
    setMarkerPosition(coordinates);
    
    // Animate map to the selected location
    mapRef.current?.animateToRegion({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 500);
  };

  // Handle map press to get location
  const handleMapPress = async (event: any) => {
    const { coordinate } = event.nativeEvent;
    setMarkerPosition(coordinate);
    
    // Reverse geocoding to get address
    setLoading(true);
    try {
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });
      
      if (addressResponse && addressResponse.length > 0) {
        const address = addressResponse[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
        ].filter(Boolean).join(', ');
        
        setSelectedAddress(formattedAddress);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setSelectedAddress(`Location at ${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  };

  // Get current location
  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      
      // Update marker and map region
      setMarkerPosition({ latitude, longitude });
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
      
      // Get address from coordinates
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (addressResponse && addressResponse.length > 0) {
        const address = addressResponse[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
        ].filter(Boolean).join(', ');
        
        setSelectedAddress(formattedAddress);
      } else {
        setSelectedAddress(`Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Failed to get current location. Please try again or enter location manually.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm location selection
  const handleConfirmLocation = () => {
    if (!markerPosition || !selectedAddress) {
      alert('Please select a location first');
      return;
    }
    
    onLocationSelect({
      address: selectedAddress,
      coordinates: markerPosition,
    });
    
    onClose();
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#113a78" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {locationType === 'pickup' ? 'Select Pickup Location' : 'Select Drop-off Location'}
          </Text>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholderText}
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={handleSearchChange}
              autoCapitalize="none"
            />
            {searchText.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  setSearchText('');
                  setSearchResults([]);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* Current Location Button */}
          <TouchableOpacity 
            style={styles.currentLocationButton}
            onPress={handleGetCurrentLocation}
          >
            <Ionicons name="locate" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Search Results */}
        {(searchResults.length > 0 || recentLocations.length > 0) && searchText.length > 0 && (
          <View style={styles.resultsContainer}>
            {loading ? (
              <ActivityIndicator size="small" color="#113a78" style={styles.loader} />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.resultItem}
                    onPress={() => handleSelectLocation(item)}
                  >
                    <Ionicons name="location" size={20} color="#113a78" style={styles.resultIcon} />
                    <Text style={styles.resultText}>{item.address}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  searchText.length > 2 ? (
                    <Text style={styles.noResultsText}>No results found</Text>
                  ) : null
                }
              />
            )}
          </View>
        )}
        
        {/* Recent Locations (shown only when not searching) */}
        {searchText.length === 0 && recentLocations.length > 0 && (
          <View style={styles.recentLocationsContainer}>
            <Text style={styles.recentTitle}>Recent Locations</Text>
            {recentLocations.map((item) => (
              <TouchableOpacity 
                key={item.id}
                style={styles.recentItem}
                onPress={() => handleSelectLocation(item)}
              >
                <Ionicons name="time" size={20} color="#666" style={styles.resultIcon} />
                <Text style={styles.recentText}>{item.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Map View */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={currentRegion}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {markerPosition && (
              <Marker
                coordinate={markerPosition}
                pinColor={locationType === 'pickup' ? '#519e15' : '#c60000'}
                draggable
                onDragEnd={(e) => handleMapPress(e)}
              />
            )}
          </MapView>
          
          {loading && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="large" color="#113a78" />
            </View>
          )}
        </View>
        
        {/* Selected Location Bar */}
        {selectedAddress && (
          <View style={styles.selectedLocationContainer}>
            <View style={styles.selectedAddressContainer}>
              <MaterialIcons 
                name={locationType === 'pickup' ? 'trip-origin' : 'place'}
                size={24} 
                color={locationType === 'pickup' ? '#519e15' : '#c60000'} 
                style={styles.selectedLocationIcon}
              />
              <Text 
                style={styles.selectedLocationText}
                numberOfLines={2}
              >
                {selectedAddress}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirmLocation}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginLeft: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  currentLocationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#113a78',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    maxHeight: height * 0.3,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultIcon: {
    marginRight: 10,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  recentLocationsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 10,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
    marginLeft: 5,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recentText: {
    fontSize: 16,
    color: '#333',
  },
  loader: {
    padding: 20,
  },
  noResultsText: {
    padding: 20,
    textAlign: 'center',
    color: '#666',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectedAddressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLocationIcon: {
    marginRight: 10,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  confirmButton: {
    backgroundColor: '#113a78',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EnhancedLocationPicker;