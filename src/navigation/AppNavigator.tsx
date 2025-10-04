import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import useAppStore from '../state/appStore';
import useAuthStore from '../state/authStore';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import BodyModelScreen from '../screens/BodyModelScreen';
import PainLogScreen from '../screens/PainLogScreen';
import ChatScreen from '../screens/ChatScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProviderDashboard from '../screens/ProviderDashboard';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ProviderDashboard: undefined;
  PainLog: { bodyPart?: string };
};

export type TabParamList = {
  Body: undefined;
  Chat: undefined;
  History: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { isDarkMode } = useAppStore();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Body') {
            iconName = focused ? 'body' : 'body-outline';
          } else if (route.name === 'Chat') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: isDarkMode ? '#9CA3AF' : '#6B7280',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#374151' : '#E5E7EB',
        },
        headerStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        },
        headerTitleStyle: {
          color: isDarkMode ? '#FFFFFF' : '#000000',
        },
      })}
    >
      <Tab.Screen 
        name="Body" 
        component={BodyModelScreen}
        options={{ title: 'Track Pain' }}
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{ title: 'AI Advice' }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ title: 'History' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { hasCompletedOnboarding, isDarkMode } = useAppStore();
  const { isAuthenticated, currentUser } = useAuthStore();

  const getInitialRouteName = () => {
    if (!hasCompletedOnboarding) return "Welcome";
    if (!isAuthenticated) return "Login";
    if (currentUser?.userType === 'provider') return "ProviderDashboard";
    return "MainTabs";
  };

  const initialRoute = getInitialRouteName();
  
  // Debug logging
  console.log("[AppNavigator] hasCompletedOnboarding:", hasCompletedOnboarding);
  console.log("[AppNavigator] isAuthenticated:", isAuthenticated);
  console.log("[AppNavigator] currentUser:", currentUser);
  console.log("[AppNavigator] initialRoute:", initialRoute);

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        },
        headerTitleStyle: {
          color: isDarkMode ? '#FFFFFF' : '#000000',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
        gestureEnabled: false, // Prevent swipe back to maintain auth flow
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Register" 
        component={RegisterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProviderDashboard" 
        component={ProviderDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PainLog" 
        component={PainLogScreen}
        options={{ 
          title: 'Log Pain',
          presentation: 'modal'
        }}
      />
    </Stack.Navigator>
  );
}