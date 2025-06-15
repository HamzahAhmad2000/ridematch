// components/CrossPlatformMapPicker.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'react-native';
import * as Location from 'expo-location';

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

interface MapLocationPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onLocationSelect: (address: string, coordinates: LocationCoordinates) => void;
  initialLocation?: LocationCoordinates | null;
  initialAddress?: string;
  placeholderText?: string;
}

// This is our cross-platform map picker that works differently on web vs native
const CrossPlatformMapPicker: React.FC<MapLocationPickerProps> = ({
  isVisible,
  onClose,
  onLocationSelect,
  initialLocation,
  initialAddress,
  placeholderText = 'Search location...',
}) => {
  const [location, setLocation] = useState<LocationCoordinates | null>(initialLocation || null);
  const [address, setAddress] = useState<string>(initialAddress || '');
  const [searchText, setSearchText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && !location) {
      getCurrentLocation();
    }
  }, [isVisible]);

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission not granted');
        setIsLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      
      setLocation(newLocation);
      await reverseGeocode(newLocation);
    } catch (err) {
      setError('Failed to get current location');
      console.error('Error getting location:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const reverseGeocode = async (coordinates: LocationCoordinates) => {
    try {
      const result = await Location.reverseGeocodeAsync({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
      
      if (result.length > 0) {
        const loc = result[0];
        const addressComponents = [
          loc.name,
          loc.street,
          loc.city,
          loc.region,
          loc.country,
        ].filter(Boolean);
        
        const formattedAddress = addressComponents.join(', ');
        setAddress(formattedAddress);
      }
    } catch (err) {
      console.error('Error reverse geocoding:', err);
    }
  };

  const searchLocation = async () => {
    if (!searchText.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await Location.geocodeAsync(searchText);
      
      if (result.length > 0) {
        const newLocation = {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        };
        
        setLocation(newLocation);
        await reverseGeocode(newLocation);
      } else {
        setError('Location not found');
      }
    } catch (err) {
      setError('Failed to search location');
      console.error('Error searching location:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLocation = () => {
    if (location && address) {
      onLocationSelect(address, location);
      onClose();
    }
  };

  // Simpler location search UI that works everywhere
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Location</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={placeholderText}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={searchLocation}
            returnKeyType="search"
          />
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={searchLocation}
            disabled={isLoading}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.mapPlaceholder}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#113a78" />
          ) : (
            <>
              <Text style={styles.placeholderText}>
                {location ? 
                  `Selected location (${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)})` : 
                  'Search for a location to select it'}
              </Text>
              {location && (
                <View style={styles.locationMarker}>
                  <Text style={styles.markerText}>📍</Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.addressText} numberOfLines={2}>
            {address || 'Search for a location above'}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.currentLocationButton} 
              onPress={getCurrentLocation}
              disabled={isLoading}
            >
              <Text style={styles.currentLocationText}>📱 Current Location</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.selectButton, (!location || !address) && styles.disabledButton]} 
              onPress={handleSelectLocation}
              disabled={!location || !address}
            >
              <Text style={styles.selectButtonText}>Select This Location</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: '#113a78',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 5,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter',
    fontWeight: '600',
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    fontFamily: 'Inter',
  },
  searchButton: {
    backgroundColor: '#113a78',
    paddingHorizontal: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    padding: 10,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  placeholderText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#113a78',
    textAlign: 'center',
    padding: 20,
  },
  locationMarker: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerText: {
    fontSize: 40,
  },
  footer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
  },
  addressText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  currentLocationText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#ff9020',
  },
  selectButton: {
    backgroundColor: '#113a78',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  selectButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default CrossPlatformMapPicker;