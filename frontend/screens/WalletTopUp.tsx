// screens/WalletTopUp.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { WalletService, TopUpRequest } from '../services/wallet';
import Navbar from '../components/Navbar';

interface PresetAmount {
  value: number;
  label: string;
}

// Preset amounts as specified
const presetAmounts: PresetAmount[] = [
  { value: 500, label: '500 Rs.' },
  { value: 1000, label: '1000 Rs.' },
  { value: 2000, label: '2000 Rs.' },
  { value: 5000, label: '5000 Rs.' },
];

// Define the possible payment methods
type PaymentMethod = 'card' | 'bank';

const WalletTopUp: React.FC = () => {
  const navigation = useNavigation();
  const [amount, setAmount] = useState<string>('');
  // Use selectedPreset to track which preset button is active
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  // State for selected payment method, defaulting to 'card'
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // State to hold card details
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    nameOnCard: '',
  });

  // Handle selection of a preset amount
  const handlePresetSelect = (presetAmount: PresetAmount) => {
    setSelectedPreset(presetAmount.value); // Store the selected preset value
    setAmount(presetAmount.value.toString()); // Update the main amount input
  };

  // Handle manual amount input changes
  const handleAmountChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, ''); // Allow only numbers
    setAmount(numericValue);
    setSelectedPreset(null); // Deselect any preset button if amount is manually changed
  };

  // Handle the top-up process
  const handleTopUp = async () => {
    const parsedAmount = parseInt(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter or select a valid amount to add.');
      return;
    }

    // Validate card details only if 'card' payment method is selected
    if (selectedPaymentMethod === 'card') {
      const cleanedCardNumber = cardDetails.cardNumber.replace(/\s+/g, ''); // Remove spaces for validation
      if (!cleanedCardNumber || cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) { // Basic card length check
        Alert.alert('Invalid Card', 'Please enter a valid card number.');
        return;
      }
      if (!cardDetails.expiryDate || !/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) { // Basic MM/YY check
        Alert.alert('Invalid Expiry Date', 'Please enter a valid expiry date (MM/YY).');
        return;
      }
      if (!cardDetails.cvv || cardDetails.cvv.length < 3 || cardDetails.cvv.length > 4) { // Basic CVV length check
        Alert.alert('Invalid CVV', 'Please enter a valid CVV code.');
        return;
      }
      if (!cardDetails.nameOnCard.trim()) {
        Alert.alert('Invalid Name', 'Please enter the name on the card.');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Prepare the data for the API call
      const topupData: TopUpRequest = {
        amount: parsedAmount,
        payment_method: selectedPaymentMethod,
      };

      // Add card details if payment method is 'card'
      if (selectedPaymentMethod === 'card') {
        const [month, year] = cardDetails.expiryDate.split('/');
        topupData.card_details = {
          card_number: cardDetails.cardNumber.replace(/\s+/g, ''), // Send cleaned number
          expiry: `${month.trim()}/${year.trim()}`,
          cvv: cardDetails.cvv,
          name_on_card: cardDetails.nameOnCard.trim(),
        };
      }

      // Call the WalletService to top up
      const result = await WalletService.topUpWallet(topupData);

      if (result.success) {
        const successMessage = selectedPaymentMethod === 'bank'
          ? `Bank transfer initiated for ${amount} Rs. Your balance will update once confirmed.`
          : `Your wallet has been topped up with ${amount} Rs.`;

        Alert.alert(
          'Success',
          successMessage,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Wallet' as never), // Navigate back to Wallet screen
            },
          ]
        );
      } else {
        Alert.alert('Top Up Failed', result.message || 'Failed to process your request. Please try again.');
      }
    } catch (error) {
      console.error('Error topping up wallet:', error);
      const errorMsg = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again later.';
      Alert.alert('Error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Format card number input with spaces
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s+/g, '').replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  // Format expiry date input as MM/YY
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 4) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
    }
    if (cleaned.length >= 2) {
      return `${cleaned.substring(0, 2)}/${cleaned.substring(2)}`;
    }
    return cleaned;
  };

  // Format CVV input (limit length)
  const formatCvv = (text: string) => {
      return text.replace(/\D/g, '').substring(0, 4); // Allow up to 4 digits for Amex
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Image
                source={require('../assets/images/White Back icon.png')} // Assuming white icon for dark background
                style={styles.backIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <Text style={styles.title}>Top Up Wallet</Text>
          </View>

          {/* Amount Section */}
          <View style={styles.amountSection}>
            <Text style={styles.sectionTitle}>Enter Amount</Text>
            {/* Amount Input */}
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>Rs.</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#aaa"
              />
            </View>
            {/* Preset Amount Buttons */}
            <View style={styles.presetAmountsContainer}>
              {presetAmounts.map((preset) => (
                <TouchableOpacity
                  key={preset.value}
                  style={[
                    styles.presetButton,
                    selectedPreset === preset.value && styles.selectedPresetButton, // Highlight if selected
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                >
                  <Text
                    style={[
                      styles.presetButtonText,
                      selectedPreset === preset.value && styles.selectedPresetButtonText,
                    ]}
                  >
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Method Section */}
          <View style={styles.paymentMethodSection}>
            <Text style={styles.sectionTitle}>Select Payment Method</Text>
            <View style={styles.paymentOptions}>
              {/* Credit/Debit Card Option */}
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'card' && styles.selectedPaymentOption,
                ]}
                onPress={() => setSelectedPaymentMethod('card')}
              >
                <Image
                  source={require('../assets/images/Master Card Icon.png')} // Use provided icon
                  style={styles.paymentOptionIcon}
                  resizeMode="contain"
                />
                <Text style={styles.paymentOptionText}>Pay with Credit/Debit Card</Text>
                {/* Simple checkmark or indicator for selection */}
                {selectedPaymentMethod === 'card' && <View style={styles.selectedIndicator} />}
              </TouchableOpacity>

              {/* Bank Transfer Option */}
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  selectedPaymentMethod === 'bank' && styles.selectedPaymentOption,
                ]}
                onPress={() => setSelectedPaymentMethod('bank')}
              >
                <Image
                  source={require('../assets/images/Money Icon.png')} // Use provided icon (or a bank icon if available)
                  style={styles.paymentOptionIcon}
                  resizeMode="contain"
                />
                <Text style={styles.paymentOptionText}>Bank Transfer</Text>
                 {/* Simple checkmark or indicator for selection */}
                {selectedPaymentMethod === 'bank' && <View style={styles.selectedIndicator} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Card Details Section (Conditional) */}
          {selectedPaymentMethod === 'card' && (
            <View style={styles.cardDetailsSection}>
              <Text style={styles.sectionTitle}>Card Details</Text>
              {/* Card Number Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  value={cardDetails.cardNumber}
                  onChangeText={(text) => setCardDetails({
                    ...cardDetails,
                    // Apply formatting and limit length
                    cardNumber: formatCardNumber(text).substring(0, 19), // Max 16 digits + 3 spaces
                  })}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                  maxLength={19} // Limit input length visually
                />
              </View>
              {/* Expiry Date and CVV Inputs */}
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    value={cardDetails.expiryDate}
                    onChangeText={(text) => setCardDetails({
                      ...cardDetails,
                      expiryDate: formatExpiryDate(text), // Apply MM/YY formatting
                    })}
                    placeholder="MM/YY"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    maxLength={5} // MM/YY
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.inputLabel}>CVV</Text>
                  <TextInput
                    style={styles.input}
                    value={cardDetails.cvv}
                    onChangeText={(text) => setCardDetails({
                      ...cardDetails,
                      cvv: formatCvv(text), // Format and limit CVV
                    })}
                    placeholder="123"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    secureTextEntry // Hide CVV input
                    maxLength={4} // Max CVV length
                  />
                </View>
              </View>
              {/* Name on Card Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name on Card</Text>
                <TextInput
                  style={styles.input}
                  value={cardDetails.nameOnCard}
                  onChangeText={(text) => setCardDetails({
                    ...cardDetails,
                    nameOnCard: text,
                  })}
                  placeholder="John Doe"
                  placeholderTextColor="#aaa"
                  autoCapitalize="words" // Capitalize names automatically
                />
              </View>
            </View>
          )}

          {/* Bank Transfer Instructions Section (Conditional) */}
          {selectedPaymentMethod === 'bank' && (
            <View style={styles.bankInstructionsSection}>
              <Text style={styles.sectionTitle}>Bank Transfer Instructions</Text>
              <Text style={styles.instructionText}>
                1. Open your banking app and transfer the desired amount ({amount ? `${amount} Rs.` : 'selected amount'}) to the following account:
              </Text>
              {/* Bank Account Details */}
              <View style={styles.bankDetails}>
                <Text style={styles.bankDetailText}><Text style={styles.boldText}>Account Name:</Text> RideMatch Wallet</Text>
                <Text style={styles.bankDetailText}><Text style={styles.boldText}>Account Number:</Text> 1234-5678-9012-3456</Text>
                <Text style={styles.bankDetailText}><Text style={styles.boldText}>Bank Name:</Text> XYZ Bank</Text> {/* Updated bank name */}
                <Text style={styles.bankDetailText}><Text style={styles.boldText}>IBAN:</Text> PK00EXMB0000123456789012</Text>
              </View>
              <Text style={styles.instructionText}>
                2. IMPORTANT: Use your registered phone number as the transaction reference/description.
              </Text>
              <Text style={styles.instructionText}>
                3. After completing the transfer, tap the "Process Top Up" button below.
              </Text>
              <Text style={styles.noteText}>
                Note: Bank transfers may take some time to reflect in your wallet balance depending on bank processing times.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#113a78" style={styles.loader} />
            ) : (
              <>
                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => navigation.goBack()} // Navigate back
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                {/* Pay Now / Process Top Up Button */}
                <TouchableOpacity
                  style={[
                    styles.topUpButton,
                    // Disable button if amount is invalid
                    (!amount || parseInt(amount) <= 0) && styles.disabledButton,
                  ]}
                  onPress={handleTopUp}
                  disabled={!amount || parseInt(amount) <= 0 || isLoading} // Disable if no amount or loading
                >
                  <Text style={styles.topUpButtonText}>
                    {/* Dynamic button text based on payment method */}
                    {selectedPaymentMethod === 'card' ? 'Pay Now' : 'Process Top Up'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Navbar />
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe', // Slightly off-white background
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Ensure space for Navbar and buttons
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center title
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#113a78', // Primary color header
    position: 'relative', // Needed for absolute positioning of back button
  },
  backButton: {
    position: 'absolute',
    left: 15, // Position back button to the left
    padding: 5, // Add padding for easier tapping
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: '#fff', // White icon
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff', // White title text
  },
  amountSection: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78', // Primary color for titles
    marginBottom: 15,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff', // White background for input
  },
  currencySymbol: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '500',
    color: '#113a78',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '500', // Make input amount bold
    color: '#113a78',
    paddingVertical: 15,
  },
  presetAmountsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    width: '48%', // Two buttons per row with space
    backgroundColor: '#e6effc', // Light blue background
    paddingVertical: 12,
    paddingHorizontal: 10, // Adjust padding
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d0e0f8', // Slightly darker border
  },
  selectedPresetButton: {
    backgroundColor: '#113a78', // Dark blue for selected
    borderColor: '#113a78',
  },
  presetButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#113a78', // Dark blue text
    fontWeight: '500',
  },
  selectedPresetButtonText: {
    color: '#ffffff', // White text for selected
    fontWeight: '600',
  },
  paymentMethodSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 8, // Separator line
    borderTopColor: '#f0f0f0', // Light gray separator
  },
  paymentOptions: {
    marginTop: 0, // Remove extra margin
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f9f9f9', // Very light gray background
    position: 'relative', // For the checkmark/indicator
  },
  selectedPaymentOption: {
    borderColor: '#113a78', // Highlight selected option
    backgroundColor: '#e6effc', // Light blue background for selected
  },
  paymentOptionIcon: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  paymentOptionText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#113a78',
    flex: 1, // Take remaining space
  },
  // Simple checkmark style indicator
  selectedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#113a78', // Dark blue indicator
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{translateY: -6}], // Center vertically
  },
  cardDetailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 8,
    borderTopColor: '#f0f0f0',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500', // Slightly bolder label
    color: '#333', // Darker gray label
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#333', // Standard input text color
    backgroundColor: '#fff', // White background for input
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bankInstructionsSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 8,
    borderTopColor: '#f0f0f0',
  },
  instructionText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#333',
    lineHeight: 20, // Improve readability
    marginBottom: 12,
  },
  bankDetails: {
    backgroundColor: '#f0f6ff', // Very light blue background for details
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#d0e0f8',
  },
  bankDetailText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
    marginBottom: 8, // Space between lines
    lineHeight: 18,
  },
  boldText: {
      fontWeight: '600', // Make labels bold
  },
  noteText: {
    fontFamily: 'Inter',
    fontSize: 13, // Slightly larger note text
    fontStyle: 'italic',
    color: '#555', // Darker gray for note
    marginTop: 15,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20, // Add padding top
    paddingBottom: 20, // Ensure padding at the bottom
    marginTop: 20, // Add margin from content above
    borderTopWidth: 1,
    borderTopColor: '#eee', // Light border separator
    backgroundColor: '#fff', // White background for button area
  },
  loader: {
    flex: 1, // Takes full width when loading
    alignSelf: 'center',
  },
  cancelButton: {
    flex: 1, // Take half the space
    backgroundColor: '#e0e0e0', // Lighter gray for cancel
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10, // Space between buttons
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600', // Bolder text
    color: '#555', // Dark gray text
  },
  topUpButton: {
    flex: 1, // Take half the space
    backgroundColor: '#113a78', // Primary color
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10, // Space between buttons
  },
  disabledButton: {
    backgroundColor: '#aab8c2', // Disabled color
    opacity: 0.7,
  },
  topUpButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600', // Bolder text
    color: '#ffffff',
  },
});

export default WalletTopUp;