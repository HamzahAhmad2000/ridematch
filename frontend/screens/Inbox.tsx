// screens/Inbox.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
  RefreshControl,
  TextInput, // Added TextInput for search
} from 'react-native';
import { useAppNavigation } from '../navigationUtils';
import Navbar from '../components/Navbar';
import { MessagingService, Conversation } from '../services/messaging';

const Inbox: React.FC = () => {
  const navigation = useAppNavigation();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]); // State for filtered list
  const [searchText, setSearchText] = useState<string>(''); // State for search query
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    if (!isRefreshing) setIsLoading(true);
    setError(null);

    try {
      const data = await MessagingService.getConversations();
      setConversations(data);
      // Initially, filtered list is the same as the full list
      // Apply current search text if any exists (e.g., after refresh)
      filterConversations(searchText, data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load conversations.';
      setError(errorMsg);
      console.error('Error loading conversations:', error);
      setConversations([]); // Clear conversations on error
      setFilteredConversations([]); // Clear filtered conversations on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing, searchText]); // Added searchText dependency

  useEffect(() => {
    loadConversations();
  }, [loadConversations]); // loadConversations dependency includes searchText now

  const onRefresh = () => {
    setIsRefreshing(true);
    setSearchText(''); // Optionally clear search on refresh
    loadConversations();
  };

  // Function to filter conversations based on search text
  const filterConversations = (text: string, sourceData: Conversation[]) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredConversations(sourceData); // Show all if search is empty
    } else {
      const filtered = sourceData.filter((conv) =>
        conv.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  };

  // Handler for search input changes
  const handleSearchChange = (text: string) => {
    filterConversations(text, conversations); // Filter the original list
  };

  const handleChatPress = (conversation: Conversation) => {
    navigation.navigate('Chat', {
      userId: conversation.user_id,
      name: conversation.name,
    }); // Removed 'as any' by ensuring params match RootStackParamList definition
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleChatPress(item)}
    >
      <View style={styles.profileImageContainer}>
        <Image
          source={require('../assets/images/Blue Profule icon.png')} // Placeholder profile icon
          style={styles.profileImage}
          resizeMode="contain"
        />
        {item.unread && <View style={styles.unreadIndicator} />}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.name}</Text>
          {/* Consider formatting the timestamp more friendly e.g., using a library like date-fns */}
          <Text style={styles.timestamp}>
             {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text
          style={[styles.lastMessage, item.unread && styles.unreadMessage]}
          numberOfLines={1}
        >
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isLoading && !isRefreshing) return null; // Don't show empty state while initially loading

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadConversations}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // If searching and no results
    if (searchText && filteredConversations.length === 0) {
       return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No results found for "{searchText}"</Text>
          <Text style={styles.emptySubtext}>Try searching for a different name.</Text>
        </View>
      );
    }

    // If no conversations at all
    if (!searchText && conversations.length === 0) {
        return (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No conversations yet</Text>
            <Text style={styles.emptySubtext}>Your messages with carpool companions will appear here</Text>
        </View>
        );
    }

    return null; // Should not happen if logic is correct, but prevents rendering issues
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={handleSearchChange} // Use the handler
        />
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations} // Use filtered data
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.conversationList,
            // Adjust emptyList style application if needed
            filteredConversations.length === 0 && styles.emptyList
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState} // Render the appropriate empty state
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Navbar */}
      <Navbar currentRoute="Inbox" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  header: {
    paddingTop: 15,
    paddingBottom: 5, // Reduced bottom padding
    alignItems: 'center',
    // Removed borderBottom here, maybe add to search container if needed
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1, // Added border here
    borderBottomColor: '#e6e6e6',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontFamily: 'Inter',
    fontSize: 14,
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
    paddingHorizontal: 30,
    marginTop: 50, // Add some margin from the top
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  conversationList: {
    paddingTop: 10, // Add padding top to separate from search
    paddingBottom: 120, // Add padding for navbar
  },
  emptyList: {
    flexGrow: 1, // Ensure empty container takes space
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 15, // Use horizontal padding
    paddingVertical: 12,   // Use vertical padding
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    alignItems: 'center', // Align items vertically
  },
  profileImageContainer: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileImage: {
    width: 30,
    height: 30,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff9020',
    borderWidth: 2,
    borderColor: '#fefefe',
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Align name and timestamp
    marginBottom: 5,
  },
  userName: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
  },
  timestamp: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666',
    marginLeft: 8, // Add space between name and timestamp
  },
  lastMessage: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
  },
  unreadMessage: {
    fontWeight: '500', // Use 500 for semi-bold
    color: '#333', // Darker color for unread
  },
});

export default Inbox;