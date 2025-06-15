// screens/Wallet.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Import useFocusEffect
import { WalletService, Transaction, WalletInfo } from '../services/wallet';
import Navbar from '../components/Navbar';

const Wallet: React.FC = () => {
  const navigation = useNavigation();
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null); // Add error state

  // Function to load wallet information
  const loadWalletInfo = useCallback(async (showLoadingIndicator = true) => {
    if (showLoadingIndicator && !isRefreshing) setIsLoading(true);
    setError(null); // Clear previous errors
    try {
      const info = await WalletService.getWalletInfo();
      // Sort transactions by timestamp descending (newest first)
      const sortedTransactions = info.transactions.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setWalletInfo({ ...info, transactions: sortedTransactions });
    } catch (err) {
      console.error('Error loading wallet info:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to load wallet information.';
      setError(errorMsg); // Set error message
      // Keep existing data if available, otherwise show error prominently
      if (!walletInfo) {
         Alert.alert('Error', `${errorMsg} Please try again.`);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing, walletInfo]); // Include walletInfo in dependency array if needed for error display logic

  // Load data when the screen mounts
  useEffect(() => {
    loadWalletInfo();
  }, []); // Run only once on mount

  // Use useFocusEffect to reload data when the screen comes into focus (e.g., after Top Up)
  useFocusEffect(
    useCallback(() => {
      // Don't show the main loader on focus, only fetch silently or show refresh indicator if pulling down
      loadWalletInfo(false);
    }, [loadWalletInfo])
  );


  // Handle pull-to-refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadWalletInfo(false); // Don't show main loader on refresh
  };

  // Navigate to the Top Up screen
  const handleTopUp = () => {
    navigation.navigate('WalletTopUp' as never);
  };

  // Render individual transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === 'topup' || item.type === 'refund';
    const date = new Date(item.timestamp);
    // Format date and time clearly
    const formattedDate = `${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;

    // Determine icon based on transaction type
    let iconSource;
    switch (item.type) {
      case 'topup':
        iconSource = require('../assets/images/Money Icon.png'); // As specified
        break;
      case 'payment':
        iconSource = require('../assets/images/Blue Fare Icon.png'); // As specified
        break;
      case 'refund':
        iconSource = require('../assets/images/Recieved Icon.png'); // As specified (assuming this means received money)
        break;
      default:
        iconSource = require('../assets/images/Money Icon.png'); // Default icon
    }

    return (
      <View style={styles.transactionItem}>
        {/* Transaction Icon */}
        <View style={[
            styles.transactionIconContainer,
            isCredit ? styles.creditIconBackground : styles.debitIconBackground // Different background color?
        ]}>
          <Image
            source={iconSource}
            style={styles.transactionIcon}
            resizeMode="contain"
          />
        </View>

        {/* Transaction Info */}
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {/* Use a more descriptive text if possible */}
            {item.description || (isCredit ? 'Wallet Credit' : 'Wallet Debit')}
          </Text>
          <Text style={styles.transactionDate}>{formattedDate}</Text>
        </View>

        {/* Transaction Amount */}
        <Text style={[
          styles.transactionAmount,
          isCredit ? styles.creditAmount : styles.debitAmount // Color coding
        ]}>
          {/* Show '+' for credit, '-' for debit */}
          {isCredit ? '+ ' : '- '}{Math.abs(item.amount)} Rs.
        </Text>
      </View>
    );
  };

  // Show loading indicator initially
  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
        <Navbar currentRoute="Wallet" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>{walletInfo?.balance?.toFixed(2) || '0.00'} Rs.</Text>
        {/* Top Up Button */}
        <TouchableOpacity style={styles.topUpButton} onPress={handleTopUp}>
          <Text style={styles.topUpButtonText}>Top Up Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Transaction History Section */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Transaction History</Text>

        {/* Handle Error State */}
        {error && !walletInfo?.transactions?.length ? (
          <View style={styles.emptyTransactions}>
             <Text style={styles.errorText}>{error}</Text>
             <TouchableOpacity style={styles.retryButton} onPress={() => loadWalletInfo()}>
                 <Text style={styles.retryButtonText}>Retry</Text>
             </TouchableOpacity>
          </View>
        ) : // Handle Empty State
        !walletInfo?.transactions || walletInfo.transactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          // Transaction List
          <FlatList
            data={walletInfo.transactions}
            keyExtractor={(item) => item.id.toString()} // Ensure key is a string
            renderItem={renderTransactionItem}
            // Pull-to-refresh control
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={["#113a78"]} // Spinner color
              />
            }
            contentContainerStyle={styles.transactionsList}
          />
        )}
      </View>

      {/* Navbar */}
      <Navbar currentRoute="Wallet"/>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Lighter background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#fff', // White header background
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 22, // Slightly smaller title
    fontWeight: '600',
    color: '#113a78', // Primary color title
  },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10, // Reduced bottom margin
    padding: 25, // Increased padding
    backgroundColor: '#113a78', // Primary color background
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5, // Increased elevation for more shadow
  },
  balanceLabel: {
    fontFamily: 'Inter',
    fontSize: 15, // Slightly larger label
    color: '#e6effc', // Lighter text color
    opacity: 0.9,
    marginBottom: 5, // Add space below label
  },
  balanceAmount: {
    fontFamily: 'Inter',
    fontSize: 34, // Slightly smaller amount
    fontWeight: '700',
    color: '#ffffff',
    marginVertical: 8, // Adjust vertical margin
  },
  topUpButton: {
    backgroundColor: '#ff9020', // Accent color button
    paddingVertical: 12, // Increase padding
    paddingHorizontal: 25, // Increase padding
    borderRadius: 25, // More rounded button
    marginTop: 15, // Increased margin top
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  topUpButtonText: {
    fontFamily: 'Inter',
    fontSize: 15, // Slightly larger text
    fontWeight: '600',
    color: '#ffffff',
  },
  transactionsSection: {
    flex: 1, // Take remaining space
    paddingHorizontal: 16,
    paddingTop: 15, // Add padding top
    paddingBottom: 80, // Ensure space above Navbar
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#333', // Darker title
    marginBottom: 15,
    paddingLeft: 4, // Align with list items
  },
  emptyTransactions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 50, // Adjust padding
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#888', // Lighter text for empty state
  },
    errorText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#113a78',
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  transactionsList: {
    paddingBottom: 16, // Padding at the end of the list
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff', // White background for items
    paddingVertical: 12, // Adjust padding
    paddingHorizontal: 16,
    marginBottom: 10, // Space between items
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee', // Subtle border
    // Removed shadow for a flatter look, uncomment if needed
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 2,
    // elevation: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20, // Perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  // Optional: different background colors for icons
  creditIconBackground: {
     backgroundColor: '#e6f5e0', // Light green for credit
  },
  debitIconBackground: {
      backgroundColor: '#fce8e8', // Light red for debit
  },
  transactionIcon: {
    width: 20,
    height: 20,
  },
  transactionInfo: {
    flex: 1, // Take available space
    marginRight: 10, // Space before amount
  },
  transactionDescription: {
    fontFamily: 'Inter',
    fontSize: 15, // Slightly larger description
    fontWeight: '500',
    color: '#333', // Darker text
    marginBottom: 3, // Space below description
  },
  transactionDate: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#888', // Lighter gray for date
  },
  transactionAmount: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  creditAmount: {
    color: '#28a745', // Green for credit
  },
  debitAmount: {
    color: '#dc3545', // Red for debit
  },
});

export default Wallet;