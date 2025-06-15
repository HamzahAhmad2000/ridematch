// screens/RideDetails.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { useAppNavigation, useAppRoute } from '../navigationUtils';
import { RideHistoryService } from '../services/rideHistory';
import { MessagingService } from '../services/messaging';
import RatingComponent from '../components/RatingComponent';
import Navbar from '../components/Navbar';

interface RateRideParams {
  rating: number;
  feedback?: string;
}

const RideDetails: React.FC = () => {
  const navigation = useAppNavigation();
  const route = useAppRoute<'RideDetails'>();
  const { rideId } = route.params;
  
  const [ride, setRide] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRideDetails = useCallback(async () => {
    if (!rideId) {
      setError('Ride ID not provided');
      setIsLoading(false);
      return;
    }
    
    try {
      const data = await RideHistoryService.getRideDetails(rideId);
      setRide(data);
      setError(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load ride details';
      setError(errorMsg);
      console.error('Error loading ride details:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [rideId]);

  useEffect(() => {
    loadRideDetails();
  }, [loadRideDetails]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadRideDetails();
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch (error) {
      return { date: 'Invalid date', time: 'Invalid time' };
    }
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'wallet':
        return require('../assets/images/White Wallet Icon.png');
      case 'cash':
        return require('../assets/images/Cash Payment Icon.png');
      case 'card':
        return require('../assets/images/Master Card Icon.png');
      default:
        return require('../assets/images/Cash Payment Icon.png');
    }
  };

  const handleMessageDriver = async () => {
    if (!ride) return;
    
    try {
      // Check if conversation exists or start a new one
      navigation.navigate('Chat', {
        userId: ride.driver.id,
        name: ride.driver.name
      });
    } catch (error) {
      console.error('Error navigating to chat:', error);
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    }
  };

  const handleRateRide = () => {
    setShowRatingModal(true);
  };

  const handleSubmitRating = async ({ rating, feedback }: RateRideParams) => {
    if (!ride) return;
    
    setIsSubmittingRating(true);
    try {
      const success = await RideHistoryService.rateRide({
        ride_id: ride.id,
        rating,
        feedback
      });
      
      if (success) {
        Alert.alert('Thank You', 'Your rating has been submitted successfully.');
        setShowRatingModal(false);
        
        // Refresh ride details to show the updated rating
        await loadRideDetails();
      } else {
        Alert.alert('Error', 'Failed to submit rating. Please try again.');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Error submitting rating:', error);
      Alert.alert('Error', errorMsg);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const renderPaymentStatusChip = () => {
    if (!ride) return null;
    
    let color, text;
    switch (ride.payment_status) {
      case 'paid':
        color = '#519e15';
        text = 'Paid';
        break;
      case 'pending':
        color = '#ff9020';
        text = 'Pending';
        break;
      case 'failed':
        color = '#c60000';
        text = 'Failed';
        break;
      default:
        color = '#666666';
        text = 'Unknown';
    }
    
    return (
      <View style={[styles.statusChip, { backgroundColor: `${color}20` }]}>
        <Text style={[styles.statusText, { color }]}>{text}</Text>
      </View>
    );
  };

  const renderRatingStars = () => {
    if (!ride || !ride.rating) return null;
    
    return (
      <View style={styles.ratingStars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Image
            key={star}
            source={require('../assets/images/Yellow Star Icon.png')}
            style={[
              styles.ratingStarIcon,
              star > ride.rating! && { tintColor: '#ccc' }
            ]}
            resizeMode="contain"
          />
        ))}
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
        <Navbar />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.backToHistoryButton}
            onPress={() => navigation.navigate('RideHistory')}
          >
            <Text style={styles.backToHistoryButtonText}>Back to History</Text>
          </TouchableOpacity>
        </View>
        <Navbar />
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ride details not found</Text>
          <TouchableOpacity
            style={styles.backToHistoryButton}
            onPress={() => navigation.navigate('RideHistory')}
          >
            <Text style={styles.backToHistoryButtonText}>Back to History</Text>
          </TouchableOpacity>
        </View>
        <Navbar />
      </SafeAreaView>
    );
  }

  const { date, time } = formatDateTime(ride.date);
  const statusColor = getStatusColor(ride.status);

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
          <Text style={styles.headerTitle}>Ride Details</Text>
        </View>
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statusSection}>
          <View style={[styles.statusCard, { borderLeftColor: statusColor }]}>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={[styles.statusValue, { color: statusColor }]}>
              {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
            </Text>
          </View>
          
          <View style={styles.dateTimeCard}>
            <View style={styles.dateTimeItem}>
              <Text style={styles.dateTimeLabel}>Date</Text>
              <Text style={styles.dateTimeValue}>{date}</Text>
            </View>
            <View style={styles.dateTimeItem}>
              <Text style={styles.dateTimeLabel}>Time</Text>
              <Text style={styles.dateTimeValue}>{time}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.routeSection}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <View style={styles.routeCard}>
            <View style={styles.routeItem}>
              <View style={styles.routeIconContainer}>
                <View style={styles.pickupDot} />
                <View style={styles.routeLine} />
              </View>
              <View style={styles.routeDetails}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeAddress}>{ride.pickup_location.address}</Text>
              </View>
            </View>
            
            <View style={styles.routeItem}>
              <View style={styles.routeIconContainer}>
                <View style={styles.dropoffDot} />
              </View>
              <View style={styles.routeDetails}>
                <Text style={styles.routeLabel}>Dropoff</Text>
                <Text style={styles.routeAddress}>{ride.dropoff_location.address}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.fareSection}>
          <Text style={styles.sectionTitle}>Fare Details</Text>
          <View style={styles.fareCard}>
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Base Fare</Text>
              <Text style={styles.fareValue}>{ride.fare * 0.8} Rs.</Text>
            </View>
            
            <View style={styles.fareItem}>
              <Text style={styles.fareLabel}>Service Fee</Text>
              <Text style={styles.fareValue}>{ride.fare * 0.2} Rs.</Text>
            </View>
            
            {ride.status === 'cancelled' ? (
              <View style={styles.fareItem}>
                <Text style={styles.fareLabel}>Cancellation Fee</Text>
                <Text style={styles.fareValue}>0 Rs.</Text>
              </View>
            ) : null}
            
            <View style={[styles.fareItem, styles.totalFareItem]}>
              <Text style={styles.totalFareLabel}>Total</Text>
              <Text style={styles.totalFareValue}>{ride.fare} Rs.</Text>
            </View>
            
            <View style={styles.paymentDetailsContainer}>
              <View style={styles.paymentMethodItem}>
                <Image
                  source={getPaymentMethodIcon(ride.payment_method)}
                  style={styles.paymentMethodIcon}
                  resizeMode="contain"
                />
                <Text style={styles.paymentMethodText}>
                  {ride.payment_method.charAt(0).toUpperCase() + ride.payment_method.slice(1)}
                </Text>
              </View>
              
              {renderPaymentStatusChip()}
            </View>
          </View>
        </View>
        
        <View style={styles.driverSection}>
          <Text style={styles.sectionTitle}>Driver Details</Text>
          <View style={styles.driverCard}>
            <View style={styles.driverInfo}>
              <View style={styles.driverImageContainer}>
                <Image
                  source={require('../assets/images/Blue Profule icon.png')}
                  style={styles.driverImage}
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{ride.driver.name}</Text>
                <View style={styles.driverRating}>
                  <Image
                    source={require('../assets/images/Yellow Star Icon.png')}
                    style={styles.starIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.ratingText}>{ride.driver.rating}</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.messageButton}
              onPress={handleMessageDriver}
            >
              <Image
                source={require('../assets/images/Blue Messaging Icon.png')}
                style={styles.messageIcon}
                resizeMode="contain"
              />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {ride.status === 'completed' && !ride.rating && (
          <TouchableOpacity
            style={styles.rateRideButton}
            onPress={handleRateRide}
          >
            <Image
              source={require('../assets/images/Yellow Star Icon.png')}
              style={styles.rateIcon}
              resizeMode="contain"
            />
            <Text style={styles.rateButtonText}>Rate this Ride</Text>
          </TouchableOpacity>
        )}
        
        {ride.status === 'completed' && ride.rating && (
          <View style={styles.yourRatingSection}>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            <View style={styles.ratingCard}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Image
                    key={star}
                    source={require('../assets/images/Yellow Star Icon.png')}
                    style={[
                      styles.ratingStarIcon,
                      star > (ride.rating || 0) && { tintColor: '#ccc' }
                    ]}
                    resizeMode="contain"
                  />
                ))}
              </View>
              
              {ride.user_feedback ? (
                <View style={styles.feedbackContainer}>
                  <Text style={styles.feedbackLabel}>Your Feedback:</Text>
                  <Text style={styles.feedbackText}>"{ride.user_feedback}"</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}
      </ScrollView>
      
      {showRatingModal && (
        <RatingComponent
          onSubmit={handleSubmitRating}
          onClose={() => setShowRatingModal(false)}
          isLoading={isSubmittingRating}
        />
      )}
      
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 18,
    color: '#c60000',
    marginBottom: 20,
    textAlign: 'center',
  },
  backToHistoryButton: {
    backgroundColor: '#113a78',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backToHistoryButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
  scrollContent: {
    padding: 15,
    paddingBottom: 120, // For navbar spacing
  },
  statusSection: {
    marginBottom: 20,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statusLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
  },
  dateTimeCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dateTimeItem: {
    flex: 1,
  },
  dateTimeLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  dateTimeValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
  },
  routeSection: {
    marginBottom: 20,
  },
  routeCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  routeItem: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  routeIconContainer: {
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
    backgroundColor: '#ccc',
    flex: 1,
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 4,
  },
  dropoffDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#c60000',
  },
  routeDetails: {
    flex: 1,
  },
  routeLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  routeAddress: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  fareSection: {
    marginBottom: 20,
  },
  fareCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  fareItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fareLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
  },
  fareValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#333',
  },
  totalFareItem: {
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
    paddingTop: 10,
    marginBottom: 0,
  },
  totalFareLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
  },
  totalFareValue: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
  },
  paymentDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  paymentMethodText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
  },
  driverSection: {
    marginBottom: 20,
  },
  driverCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  driverImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  driverImage: {
    width: 30,
    height: 30,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 5,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: 16,
    height: 16,
    marginRight: 5,
  },
  ratingText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e6effc',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  messageIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  messageButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#113a78',
  },
  rateRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#113a78',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  rateIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
  },
  rateButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  yourRatingSection: {
    marginBottom: 20,
  },
  ratingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  ratingStarIcon: {
    width: 30,
    height: 30,
    marginHorizontal: 5,
  },
  feedbackContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  feedbackLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  feedbackText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontStyle: 'italic',
    color: '#333',
  },
});

export default RideDetails;