// screens/Companions.tsx
import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MatchService, Companion } from '../services/match';
import Navbar from '../components/Navbar';
import { useAppNavigation } from '../navigationUtils';

const CompanionCard: React.FC<{
  companion: Companion;
  onPress: (companion: Companion) => void;
}> = ({ companion, onPress }) => {
  // Format similarity score as percentage
  const similarityPercentage = Math.round(companion.similarity_score * 100);
  
  return (
    <TouchableOpacity 
      style={styles.companionCard} 
      onPress={() => onPress(companion)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.profileImageContainer}>
          <Image
            source={require('../assets/images/Blue Profule icon.png')}
            style={styles.profileImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{companion.name}</Text>
          <Text style={styles.userUniversity}>{companion.university}</Text>
          <View style={styles.similarityContainer}>
            <Text style={styles.similarityText}>{similarityPercentage}% match</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.interestsContainer}>
        <Text style={styles.interestsTitle}>Common Interests</Text>
        <View style={styles.interestsTags}>
          {companion.common_interests && companion.common_interests.length > 0 ? (
            <>
              {companion.common_interests.slice(0, 5).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestTagText}>{interest}</Text>
                </View>
              ))}
              {companion.common_interests.length > 5 && (
                <Text style={styles.moreInterests}>+{companion.common_interests.length - 5} more</Text>
              )}
            </>
          ) : (
            <Text style={styles.noInterests}>No common interests found</Text>
          )}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.messageButton} onPress={() => onPress(companion)}>
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const Companions: React.FC = () => {
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [filteredCompanions, setFilteredCompanions] = useState<Companion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const navigation = useAppNavigation();

  const loadCompanions = useCallback(async () => {
    if (!isRefreshing) setIsLoading(true);
    setError(null);
    
    try {
      const data = await MatchService.getCompanions();
      setCompanions(data);
      setFilteredCompanions(data);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load companion recommendations.';
      setError(errorMsg);
      console.error('Error loading companions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  useEffect(() => {
    loadCompanions();
  }, [loadCompanions]);

  const onRefresh = () => {
    setIsRefreshing(true);
    loadCompanions();
  };

  const filterCompanions = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredCompanions(companions);
      return;
    }

    const filtered = companions.filter(
      (companion) =>
        companion.name.toLowerCase().includes(text.toLowerCase()) ||
        companion.university.toLowerCase().includes(text.toLowerCase()) ||
        (companion.common_interests && companion.common_interests.some(interest => 
          interest.toLowerCase().includes(text.toLowerCase())
        ))
    );
    setFilteredCompanions(filtered);
  };

  const handleCompanionPress = (companion: Companion) => {
    navigation.navigate('Chat', { 
      userId: companion.user_id, 
      name: companion.name 
    });
  };

  const renderEmptyState = () => {
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCompanions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (searchText) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No matches found for "{searchText}"</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No companion recommendations found</Text>
        <Text style={styles.emptySubtext}>We'll suggest more companions as we learn your preferences</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Companion Recommendations</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search companions..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={filterCompanions}
        />
        <TouchableOpacity style={styles.refreshButton} onPress={loadCompanions}>
          <Image
            source={require('../assets/images/White Ride Button.png')}
            style={styles.refreshIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
      ) : (
        <FlatList
          data={filteredCompanions}
          renderItem={({ item }) => (
            <CompanionCard 
              companion={item} 
              onPress={handleCompanionPress} 
            />
          )}
          keyExtractor={(item) => item.user_id}
          contentContainerStyle={[
            styles.companionList,
            filteredCompanions.length === 0 && styles.emptyList
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Navbar */}
      <Navbar />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  header: {
    padding: 15,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    fontFamily: 'Inter',
    marginRight: 10,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#113a78',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshIcon: {
    width: 20,
    height: 20,
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
  companionList: {
    padding: 15,
    paddingBottom: 120, // Add padding for navbar
  },
  emptyList: {
    flexGrow: 1,
  },
  companionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  profileImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileImage: {
    width: 35,
    height: 35,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#113a78',
  },
  userUniversity: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  similarityContainer: {
    marginTop: 5,
  },
  similarityText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#ff9020',
  },
  interestsContainer: {
    marginBottom: 15,
  },
  interestsTitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 10,
  },
  interestsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#e6effc',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  interestTagText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#113a78',
  },
  moreInterests: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666',
    alignSelf: 'center',
    marginLeft: 5,
  },
  noInterests: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#666',
  },
  buttonContainer: {
    alignItems: 'flex-end',
  },
  messageButton: {
    backgroundColor: '#113a78',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  messageButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});

export default Companions;