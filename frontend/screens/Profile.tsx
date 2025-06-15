// screens/Profile.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { UserService, UserProfile } from '../services/user';
import { AuthService } from '../services/auth';
import Navbar from '../components/Navbar';

const Profile: React.FC = () => {
  const navigation = useNavigation();
  const [userProfile, setUserProfile] = useState<Partial<UserProfile> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    if (!isRefreshing) setIsLoading(true);
    setError(null);
    
    try {
      const profile = await UserService.getProfile();
      setUserProfile(profile);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load profile information.';
      setError(errorMsg);
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadUserProfile();
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            setIsLoading(true);
            try {
              await AuthService.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' as never }],
              });
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : 'Failed to log out. Please try again.';
              Alert.alert('Error', errorMsg);
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCompanions = () => {
    navigation.navigate('Companions' as never);
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    // This would be implemented in a real app
    Alert.alert('Edit Profile', 'This feature will be available soon!');
  };

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#113a78" />
        </View>
        <Navbar currentRoute="Profile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.headerSection}>
              <Text style={styles.headerTitle}>Profile</Text>
              <View style={styles.profileImageContainer}>
                <Image
                  source={require('../assets/images/icon.png')}
                  style={styles.profileImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.userName}>{userProfile?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{userProfile?.email || 'No email available'}</Text>
              
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoSection}>
              <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>University</Text>
                  <Text style={styles.infoValue}>{userProfile?.university || 'Not specified'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Gender</Text>
                  <Text style={styles.infoValue}>{userProfile?.gender || 'Not specified'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Gender Preference</Text>
                  <Text style={styles.infoValue}>{userProfile?.gender_preference || 'Not specified'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Emergency Contact</Text>
                  <Text style={styles.infoValue}>{userProfile?.emergency_contact || 'Not specified'}</Text>
                </View>
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.sectionTitle}>Preferences</Text>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Likes</Text>
                  <Text style={styles.infoValue}>{userProfile?.likes || 'Not specified'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Dislikes</Text>
                  <Text style={styles.infoValue}>{userProfile?.dislikes || 'Not specified'}</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionsSection}>
              <TouchableOpacity style={styles.actionButton} onPress={handleCompanions}>
                <Text style={styles.actionButtonText}>View Companions</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
      
      {/* Navbar */}
      <Navbar currentRoute="Profile" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 120, // Add padding for navbar
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
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
  headerSection: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#e6effc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#113a78',
  },
  profileImage: {
    width: 60,
    height: 60,
  },
  userName: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    color: '#113a78',
  },
  userEmail: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  editButton: {
    marginTop: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#e6effc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#113a78',
  },
  editButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
    fontWeight: '600',
  },
  infoSection: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '600',
    color: '#113a78',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  infoLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#113a78',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  actionsSection: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#113a78',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  logoutButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cccccc',
  },
  logoutButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#ff3b30',
  },
});

export default Profile;