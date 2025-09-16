import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import ProductScreen from './src/screens/ProductScreen';
import CartScreen from './src/screens/CartScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';

// Services
import DatabaseService from './src/services/DatabaseService';
import { CartProvider } from './src/context/CartContext';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import NotificationScreen from './src/screens/NotificationScreen';

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

// Add import

// Update HomeStack to include NotificationScreen
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Product" component={ProductScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Notifications" component={NotificationScreen} />
    </Stack.Navigator>
  );
}

function CategoryStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Categories" component={CategoryScreen} />
      <Stack.Screen name="Product" component={ProductScreen} />
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
        options={{ tabBarLabel: '' }}
      />
      <Tab.Screen 
        name="CategoryTab" 
        component={CategoryStack}
        options={{ tabBarLabel: '' }}
      />
        
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: '' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  // In App.js, update initializeApp:
const initializeApp = async () => {
  try {
    await DatabaseService.initDatabase();
    
    // Check if we need to sync products
    const products = await DatabaseService.getProducts({ limit: 1 });
    if (products.length === 0) {
      // First time - sync from AutoDS
      console.log('Syncing products from AutoDS...');
      await AutoDSService.syncProducts();
    }
    
    await DatabaseService.initSampleData();
    setIsLoading(false);
  } catch (error) {
    console.error('Failed to initialize app:', error);
    setIsLoading(false);
  }
};

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
            <TabNavigator />
          </NavigationContainer>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
  </PaperProvider>
);
}