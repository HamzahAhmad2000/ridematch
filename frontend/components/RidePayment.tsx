// components/RidePayment.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WalletService } from '../services/wallet';

interface RidePaymentProps {
  rideId: string;
  amount: number;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

const RidePayment: React.FC<RidePaymentProps> = ({
  rideId,
  amount,
  onPaymentComplete,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'wallet' | 'cash' | 'card'>('wallet');

  useEffect(() => {
    // Load wallet balance on component mount
    loadWalletBalance();
  }, []);

  const loadWalletBalance = async () => {
    setIsLoading(true);
    try {
      const info = await WalletService.getWalletInfo();
      setWalletBalance(info.balance);
      
      // If wallet balance is insufficient, default to cash
      if (info.balance < amount) {
        setSelectedMethod('cash');
      }
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      setWalletBalance(0);
      setSelectedMethod('cash');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    setIsLoading(true);
    
    try {
      if (selectedMethod === 'wallet') {
        // Process wallet payment
        const result = await WalletService.payForRide(rideId, amount);
        
        if (result.success) {
          Alert.alert('Payment Successful', 'Payment completed using your wallet balance.');
          onPaymentComplete();
        } else {
          Alert.alert('Payment Failed', result.message || 'There was an error processing your payment.');
        }
      } else if (selectedMethod === 'card') {
        // In a real app, this would open a card payment flow
        // For demo, we'll just simulate a successful payment
        await new Promise(resolve => setTimeout(resolve, 1500));
        Alert.alert('Payment Successful', 'Card payment completed successfully.');
        onPaymentComplete();
      } else {
        // Cash payment - no processing needed
        Alert.alert('Cash Payment', 'Please pay the driver in cash when the ride is complete.');
        onPaymentComplete();
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && walletBalance === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#113a78" />
      </View>
    );
  }

  const insufficientWalletBalance = walletBalance !== null && walletBalance < amount;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payment Method</Text>
      
      <TouchableOpacity
        style={[
          styles.paymentOption,
          selectedMethod === 'wallet' && styles.selectedPaymentOption,
          insufficientWalletBalance && styles.disabledPaymentOption,
        ]}
        onPress={() => !insufficientWalletBalance && setSelectedMethod('wallet')}
        disabled={insufficientWalletBalance}
      >
        <Image
          source={require('../assets/images/White Wallet Icon.png')}
          style={[styles.paymentIcon, { tintColor: '#113a78' }]}
          resizeMode="contain"
        />
        <View style={styles.paymentDetails}>
          <Text style={styles.paymentMethod}>Wallet</Text>
          <Text style={styles.paymentBalance}>
            Balance: {walletBalance !== null ? `${walletBalance} Rs.` : 'Loading...'}
          </Text>
          {insufficientWalletBalance && (
            <Text style={styles.insufficientText}>Insufficient balance</Text>
          )}
        </View>
        {selectedMethod === 'wallet' && <View style={styles.selectedIndicator} />}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.paymentOption,
          selectedMethod === 'cash' && styles.selectedPaymentOption,
        ]}
        onPress={() => setSelectedMethod('cash')}
      >
        <Image
          source={require('../assets/images/Cash Payment Icon.png')}
          style={styles.paymentIcon}
          resizeMode="contain"
        />
        <View style={styles.paymentDetails}>
          <Text style={styles.paymentMethod}>Cash</Text>
          <Text style={styles.paymentDescription}>Pay with cash directly to driver</Text>
        </View>
        {selectedMethod === 'cash' && <View style={styles.selectedIndicator} />}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.paymentOption,
          selectedMethod === 'card' && styles.selectedPaymentOption,
        ]}
        onPress={() => setSelectedMethod('card')}
      >
        <Image
          source={require('../assets/images/Master Card Icon.png')}
          style={styles.paymentIcon}
          resizeMode="contain"
        />
        <View style={styles.paymentDetails}>
          <Text style={styles.paymentMethod}>Card</Text>
          <Text style={styles.paymentDescription}>Pay with credit or debit card</Text>
        </View>
        {selectedMethod === 'card' && <View style={styles.selectedIndicator} />}
      </TouchableOpacity>
      
      <View style={styles.totalSection}>
        <Text style={styles.totalLabel}>Total Amount:</Text>
        <Text style={styles.totalAmount}>{amount} Rs.</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#113a78" />
        ) : (
          <>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.payButton}
              onPress={handlePayment}
            >
              <Text style={styles.payButtonText}>
                {selectedMethod === 'cash' ? 'Pay with Cash' : 'Pay Now'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 20,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  selectedPaymentOption: {
    borderColor: '#113a78',
    backgroundColor: '#e6effc',
  },
  disabledPaymentOption: {
    opacity: 0.5,
  },
  paymentIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentMethod: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#113a78',
  },
  paymentDescription: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  paymentBalance: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#519e15',
    marginTop: 2,
  },
  insufficientText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#c60000',
    marginTop: 2,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#113a78',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
  },
  totalLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#333',
  },
  totalAmount: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#113a78',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  payButton: {
    flex: 2,
    backgroundColor: '#113a78',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  payButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default RidePayment;