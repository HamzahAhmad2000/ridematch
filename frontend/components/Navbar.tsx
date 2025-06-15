// components/Navbar.tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface NavbarProps {
  currentRoute?: string;
}

const Navbar: React.FC<NavbarProps> = ({ currentRoute }) => {
  const navigation = useNavigation();

  const handleHomePress = () => {
    navigation.navigate('Homepage' as never);
  };

  const handleSearchPress = () => {
    navigation.navigate('JoinRide' as never);
  };

  const handleMessagingPress = () => {
    navigation.navigate('Inbox' as never);
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile' as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.rideButton}>
        <TouchableOpacity onPress={() => navigation.navigate('CreateTripStep1' as never)}>
          <Image
            source={require('../assets/images/Blue Add Rider Nav Bar.png')}
            style={styles.rideButtonIcon}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.rectangle}>
        <View style={styles.frame}>
          <TouchableOpacity onPress={handleHomePress}>
            <Image
              source={currentRoute === 'Homepage' 
                ? require('../assets/images/icon.png')
                : require('../assets/images/icon.png')
              }
              style={styles.navIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSearchPress}>
            <Image
              source={currentRoute === 'JoinRide' 
                ? require('../assets/images/Blue Search Icon.png')
                : require('../assets/images/White Search Icon.png')
              }
              style={styles.navIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.frame2}>
          <TouchableOpacity onPress={handleMessagingPress}>
            <Image
              source={currentRoute === 'Inbox' || currentRoute === 'Chat'
                ? require('../assets/images/Blue Messaging Icon.png')
                : require('../assets/images/Grey Messaging Icon.png')
              }
              style={styles.navIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleProfilePress}>
            <Image
              source={currentRoute === 'Profile'
                ? require('../assets/images/Blue Profule icon.png')
                : require('../assets/images/Grey Profile Icon.png')
              }
              style={styles.navIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: 102,
    bottom: 0,
    left: 0,
    right: 0,
  },
  rideButton: {
    position: 'absolute',
    width: 79,
    height: 79,
    top: 14,
    left: '50%',
    marginLeft: -39.5,
    zIndex: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rideButtonIcon: {
    width: 78.83,
    height: 78.83,
  },
  rectangle: {
    position: 'absolute',
    width: '100%',
    height: '50%',
    top: '50%',
    backgroundColor: '#fefefe',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  frame: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 50,
    height: '100%',
  },
  frame2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 50,
    height: '100%',
  },
  navIcon: {
    width: 20,
    height: 20,
  }
});

export default Navbar;