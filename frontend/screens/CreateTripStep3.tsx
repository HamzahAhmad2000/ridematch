// screens/CreateTripStep3.tsx
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/StackNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Navbar from '../components/Navbar';
import { WalletService } from '../services/wallet'; // Import WalletService to check balance

type CreateTripStep3NavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateTripStep3'
>;

// Define payment method type
type PaymentMethod = 'cash' | 'wallet';

const CreateTripStep3: React.FC = () => {
  const navigation = useNavigation<CreateTripStep3NavigationProp>();
  // Default to 'cash', update state type to PaymentMethod
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [promoCode, setPromoCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWalletLoading, setIsWalletLoading] = useState<boolean>(false); // State for loading wallet balance
  const [walletBalance, setWalletBalance] = useState<number | null>(null); // State for wallet balance

  // Fetch wallet balance when the component mounts or payment method changes to 'wallet'
  useEffect(() => {
    const fetchWalletBalance = async () => {
      setIsWalletLoading(true);
      try {
        const info = await WalletService.getWalletInfo();
        setWalletBalance(info.balance);
      } catch (error) {
        console.error("Failed to fetch wallet balance:", error);
        setWalletBalance(null); // Set to null on error
        // Optionally alert the user or disable wallet option
        Alert.alert("Error", "Could not fetch wallet balance. Wallet payment might be unavailable.");
        setSelectedPayment('cash'); // Default back to cash if wallet fetch fails
      } finally {
        setIsWalletLoading(false);
      }
    };

    // Fetch only if wallet is selected or balance is unknown
    if (selectedPayment === 'wallet' && walletBalance === null) {
       fetchWalletBalance();
    } else if (walletBalance === null) { // Fetch initially to show balance if needed
        fetchWalletBalance();
    }
  }, [selectedPayment]); // Re-run effect if selectedPayment changes

  const handleContinue = async () => {
    // Check if wallet balance is sufficient if 'wallet' is selected
    // Note: We don't know the ride cost here, so this is a basic check.
    // A real app would likely pass the estimated fare to this screen.
    if (selectedPayment === 'wallet') {
        if (walletBalance === null && !isWalletLoading) {
             Alert.alert("Wallet Error", "Cannot verify wallet balance. Please try selecting Wallet again or use Cash.");
             return;
        }
        if (walletBalance !== null && walletBalance <= 0) { // Basic check for non-positive balance
            Alert.alert("Insufficient Balance", "Your wallet balance is too low. Please top up or select Cash payment.",
             [
                { text: 'OK' },
                { text: 'Top Up Wallet', onPress: () => navigation.navigate('WalletTopUp' as never)}
             ]);
            return;
        }
    }


    setIsLoading(true);
    try {
      // Get existing trip data
      const tripFormData = await AsyncStorage.getItem('tripForm');

      if (!tripFormData) {
        throw new Error('Trip data not found. Please go back and restart the trip creation.');
      }

      // Parse the data and add payment information
      const tripData = JSON.parse(tripFormData);
      const updatedTripData = {
        ...tripData,
        paymentMethod: selectedPayment, // Store selected payment method ('cash' or 'wallet')
        promoCode: promoCode.trim(), // Store trimmed promo code
      };

      // Save updated trip data
      await AsyncStorage.setItem('tripForm', JSON.stringify(updatedTripData));
      console.log('Trip data updated with payment:', updatedTripData); // Log for debugging

      // Continue to next step
      navigation.navigate('CreateTripStep4');
    } catch (error) {
      console.error('Error saving payment data:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to save payment information.';
      Alert.alert('Error', `${errorMsg} Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate back to Step 2
  const handleBack = () => {
    navigation.navigate('CreateTripStep2');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Confirm Payment</Text>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, styles.completedStep]}>
              <Text style={styles.progressTextActive}>1</Text>
            </View>
            <View style={styles.line} />
            <View style={[styles.progressStep, styles.completedStep]}>
              <Text style={styles.progressTextActive}>2</Text>
            </View>
             <View style={styles.line} />
            <View style={[styles.progressStep, styles.currentStep]}>
              <Text style={styles.progressTextActive}>3</Text>
            </View>
             <View style={styles.lineInactive} />
            <View style={styles.progressStep}>
              <Text style={styles.progressTextInactive}>4</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>

          {/* Cash Payment Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'cash' && styles.selectedPaymentOption,
            ]}
            onPress={() => setSelectedPayment('cash')}
          >
            <Image
              style={styles.paymentIcon}
              source={require('../assets/images/Cash Payment Icon.png')} // Correct icon
              resizeMode="contain"
            />
            <View style={styles.paymentTextContainer}>
              <Text style={styles.paymentTitle}>Cash Payment</Text>
              <Text style={styles.paymentSubtitle}>Pay driver directly upon ride completion</Text>
            </View>
             {selectedPayment === 'cash' && <View style={styles.selectedIndicator} />}
          </TouchableOpacity>

          {/* Wallet Payment Option - Updated */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'wallet' && styles.selectedPaymentOption,
              (walletBalance === null || walletBalance <= 0) && styles.disabledPaymentOption // Visually disable if balance is low/unknown
            ]}
            onPress={() => {
                if (walletBalance !== null && walletBalance > 0) {
                    setSelectedPayment('wallet');
                } else if (walletBalance === 0) {
                    Alert.alert("Insufficient Balance", "Your wallet balance is zero. Please top up or select Cash payment.");
                } else {
                     Alert.alert("Wallet Unavailable", "Wallet balance could not be verified or is insufficient.");
                }
            }}
             disabled={isWalletLoading || walletBalance === null || walletBalance <= 0} // Disable button if loading or balance insufficient
          >
            <Image
              style={styles.paymentIcon}
              source={require('../assets/images/Money Icon.png')} // Use Money Icon for Wallet
              resizeMode="contain"
            />
            <View style={styles.paymentTextContainer}>
              <Text style={styles.paymentTitle}>Wallet Payment</Text>
              {isWalletLoading ? (
                 <ActivityIndicator size="small" color="#113a78" />
              ) : (
                 <Text style={styles.paymentSubtitle}>
                   Available: {walletBalance !== null ? `${walletBalance.toFixed(2)} Rs.` : 'Checking...'}
                </Text>
              )}
            </View>
            {selectedPayment === 'wallet' && <View style={styles.selectedIndicator} />}
          </TouchableOpacity>
        </View>

        {/* Promo Code Field */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Promo Code (Optional)</Text>
          <View style={styles.promoContainer}>
            <TextInput
              style={styles.promoInput}
              placeholder="Enter Promo Code" // More descriptive placeholder
              placeholderTextColor="#acadb9"
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters" // Promo codes are often uppercase
            />
          </View>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {isLoading ? (
            // Show loader covering both buttons when main action is loading
            <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
          ) : (
            <>
              {/* Back Button */}
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              {/* Continue Button */}
              <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Navbar */}
      <Navbar />
    </SafeAreaView>
  );
};

// --- Styles ---
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    flexGrow: 1,
    paddingBottom: 100, // Navbar + button space
  },
  header: {
    marginBottom: 30,
    alignItems: 'center', // Center header content
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 22, // Adjusted size
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 25, // More space below title
    textAlign: 'center',
  },
  // Updated progress bar style
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center the progress steps
    width: '90%', // Control overall width
    alignSelf: 'center',
  },
  progressStep: {
    width: 30, // Smaller circles
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e6effc', // Default inactive background
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d0e0f8' // Border for inactive steps
  },
  completedStep: {
    backgroundColor: '#ff9020', // Orange for completed
    borderColor: '#ff9020',
  },
  currentStep: {
    backgroundColor: '#113a78', // Blue for current
    borderColor: '#113a78',
  },
  progressTextActive: { // Text inside active/completed steps
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff', // White text
  },
  progressTextInactive: { // Text inside inactive steps
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#aab8c2', // Gray text
  },
  // Lines between steps
   line: {
    flex: 1, // Take up space between circles
    height: 2,
    backgroundColor: '#ff9020', // Orange line for completed segments
    marginHorizontal: 5,
  },
  lineInactive: {
    flex: 1,
    height: 2,
    backgroundColor: '#e6effc', // Gray line for inactive segments
    marginHorizontal: 5,
  },
  section: {
    marginBottom: 25, // Consistent spacing
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 15, // Space below title
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#f9f9f9', // Lighter background
    position: 'relative',
  },
  selectedPaymentOption: {
    borderWidth: 2,
    borderColor: '#113a78', // Blue border for selected
    backgroundColor: '#e6effc', // Light blue background for selected
  },
    disabledPaymentOption: {
    backgroundColor: '#f0f0f0', // Gray out disabled option
    opacity: 0.7,
  },
  paymentIcon: {
    width: 35, // Slightly smaller icon
    height: 35,
    marginRight: 15,
  },
  paymentTextContainer: {
      flex: 1, // Allow text to take space
  },
  paymentTitle: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#113a78',
    marginBottom: 3, // Space between title and subtitle
  },
  paymentSubtitle: {
    fontFamily: 'Inter',
    fontSize: 13, // Smaller subtitle
    color: '#5171a1', // Muted color
    flexWrap: 'wrap', // Allow subtitle to wrap
  },
  selectedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#113a78',
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{translateY: -6}],
  },
  promoContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff', // White background for input field
  },
  promoInput: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#113a78',
    paddingVertical: 12, // Adjust padding
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30, // More space above buttons
    paddingHorizontal: 5, // Slight horizontal padding for alignment
  },
  loader: {
    flex: 1, // Take full width of button container
    height: 50, // Give it a defined height
    alignSelf: 'center',
  },
  backButton: {
    flex: 1,
    backgroundColor: '#e0e0e0', // Lighter gray
    paddingVertical: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  backButtonText: { // Separate style for back button text
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#555', // Dark gray text
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#113a78', // Primary color
    paddingVertical: 15,
    borderRadius: 10,
    marginLeft: 10,
    alignItems: 'center',
  },
  continueButtonText: { // Separate style for continue button text
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff', // White text
  },
  // Removed buttonText style as it's split now
});

export default CreateTripStep3;