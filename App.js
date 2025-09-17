// App.js - Fixed navigation structure to hide bottom tabs on cart screen
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, Text, Alert, TouchableOpacity } from 'react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import LoginScreen from './src/screens/LoginScreen';

// Services
import DatabaseService from './src/services/DatabaseService';
import { CartProvider } from './src/context/CartContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#e53e3e',
    primaryContainer: '#ffebee',
    secondary: '#ff9800',
    background: '#fafafa',
    surface: '#ffffff',
  },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
    </Stack.Navigator>
  );
}

function CategoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Categories" component={CategoryScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CategoryTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack}
        options={{
          tabBarLabel: '',
        }}
      />
      <Tab.Screen 
        name="CategoryTab" 
        component={CategoryStack}
        options={{
          tabBarLabel: '',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: '',
        }}
      />
    </Tab.Navigator>
  );
}

// Main stack navigator that contains both auth and main app
function AppNavigator() {
  const { user, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.colors.background 
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ 
          marginTop: 16, 
          fontSize: 16, 
          color: '#666',
          fontWeight: '500' 
        }}>
          Loading...
        </Text>
      </View>
    );
  }

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        presentation: 'card'
      }}
    >
      {user ? (
        // User is signed in - show main app
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen 
            name="Product" 
            component={ProductDetailsScreen}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen 
            name="Cart" 
            component={CartScreen}
            options={{
              presentation: 'card',
            }}
          />
        </>
      ) : (
        // User is not signed in - show login
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Initializing app...');

      // Initialize local database
      await DatabaseService.initDatabase();
      console.log('Database initialized successfully');

      // Initialize sample data for development
      await DatabaseService.initSampleData();
      console.log('Sample data initialized');

      // App is ready
      setIsLoading(false);
      console.log('App initialization complete');

    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsLoading(false);
      setInitError(error.message);
      
      // Show error alert
      Alert.alert(
        'Initialization Error',
        'Failed to initialize the app. Please restart the application.',
        [
          { text: 'Retry', onPress: retryInitialization },
          { text: 'OK', style: 'cancel' }
        ]
      );
    }
  };

  const retryInitialization = () => {
    setIsLoading(true);
    setInitError(null);
    initializeApp();
  };

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.colors.background 
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ 
          marginTop: 16, 
          fontSize: 16, 
          color: '#666',
          fontWeight: '500' 
        }}>
          Initializing app...
        </Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: 32
      }}>
        <Text style={{ 
          fontSize: 18, 
          color: '#333',
          fontWeight: 'bold',
          marginBottom: 16,
          textAlign: 'center'
        }}>
          Initialization Failed
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: '#666',
          textAlign: 'center',
          marginBottom: 24
        }}>
          {initError}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8
          }}
          onPress={retryInitialization}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>
            Retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <AppNavigator />
            </NavigationContainer>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </PaperProvider>
  );
}