// components/MapLocationPicker.tsx
import React, { useState, useEffect, useRef } from 'react';
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Image } from 'react-native';

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

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
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
  
  const mapRef = useRef<MapView>(null);

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
        
        // Move map to the location
        mapRef.current?.animateToRegion({
          ...newLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
        
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

  const handleMapPress = async (e: any) => {
    const coordinates = e.nativeEvent.coordinate;
    setLocation(coordinates);
    await reverseGeocode(coordinates);
  };

  const handleSelectLocation = () => {
    if (location && address) {
      onLocationSelect(address, location);
      onClose();
    }
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Image
              source={require('../assets/images/White Back icon.png')}
              style={styles.backIcon}
              resizeMode="contain"
            />
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

        {isLoading && !location ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#113a78" />
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={location ? {
              ...location,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            } : undefined}
            onPress={handleMapPress}
            showsUserLocation
          >
            {location && (
              <Marker
                coordinate={location}
                title="Selected Location"
                description={address}
              />
            )}
          </MapView>
        )}

        <View style={styles.footer}>
          <Text style={styles.addressText} numberOfLines={2}>
            {address || 'Drop a pin or search for a location'}
          </Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.currentLocationButton} 
              onPress={getCurrentLocation}
              disabled={isLoading}
            >
              <Image
                source={require('../assets/images/Location Icon.png')}
                style={styles.locationIcon}
                resizeMode="contain"
              />
              <Text style={styles.currentLocationText}>Current Location</Text>
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
  backIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
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

export default MapLocationPicker;