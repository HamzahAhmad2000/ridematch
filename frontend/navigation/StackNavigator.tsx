// navigation/StackNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// Import all screens
import LoginScreen from '../screens/LoginScreen';
import Signup from '../screens/Signup';
import Signup2 from '../screens/Signup2';
import Homepage from '../screens/Homepage';
import CreateTripStep1 from '../screens/CreateTripStep1';
import CreateTripStep2 from '../screens/CreateTripStep2';
import CreateTripStep3 from '../screens/CreateTripStep3';
import CreateTripStep4 from '../screens/CreateTripStep4';
import JoinRide from '../screens/JoinRide';
import JoinRideConfirm from '../screens/JoinRideConfirm';
import ReportScreen from '../screens/ReportScreen';
import Inbox from '../screens/Inbox';
import ChatScreen from '../screens/ChatScreen';
import RideStarted from '../screens/RideStarted';
import Profile from '../screens/Profile';
import Companions from '../screens/Companions';
import RideList from '../screens/RideList';
import RideHistory from '../screens/RideHistory';
import RideDetails from '../screens/RideDetails';
import Wallet from '../screens/Wallet';
import WalletTopUp from '../screens/WalletTopUp';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Signup2: { 
    signupData?: {
      name?: string;
      dateOfBirth?: string;
      gender?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    }
  } | undefined;
  Homepage: undefined;
  CreateTripStep1: undefined;
  CreateTripStep2: undefined;
  CreateTripStep3: undefined;
  CreateTripStep4: undefined;
  JoinRide: undefined;
  JoinRideConfirm: { rideId: string };
  Report: undefined;
  Inbox: undefined;
  Chat: { userId?: string; name?: string };
  RideStarted: { rideId: string };
  Profile: undefined;
  Companions: undefined;
  RideList: undefined;
  RideHistory: undefined;
  RideDetails: { rideId: string };
  Wallet: undefined;
  WalletTopUp: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const StackNavigator: React.FC = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen 
        name="Signup2" 
        component={Signup2} 
        initialParams={{}} 
      />
      <Stack.Screen name="Homepage" component={Homepage} />
      <Stack.Screen name="CreateTripStep1" component={CreateTripStep1} />
      <Stack.Screen name="CreateTripStep2" component={CreateTripStep2} />
      <Stack.Screen name="CreateTripStep3" component={CreateTripStep3} />
      <Stack.Screen name="CreateTripStep4" component={CreateTripStep4} />
      <Stack.Screen name="JoinRide" component={JoinRide} />
      <Stack.Screen name="JoinRideConfirm" component={JoinRideConfirm} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="Inbox" component={Inbox} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="RideStarted" component={RideStarted} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Companions" component={Companions} />
      <Stack.Screen name="RideList" component={RideList} />
      <Stack.Screen name="RideHistory" component={RideHistory} />
      <Stack.Screen name="RideDetails" component={RideDetails} />
      <Stack.Screen name="Wallet" component={Wallet} />
      <Stack.Screen name="WalletTopUp" component={WalletTopUp} />
    </Stack.Navigator>
  );
};

export default StackNavigator;