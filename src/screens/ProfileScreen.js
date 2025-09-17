// src/screens/ProfileScreen.js - Updated with horizontal layout
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, userProfile, loading, signOut } = useAuth();

  // Show login prompt for guest users
  const LoginPrompt = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.guestContainer}>
        <View style={styles.guestIcon}>
          <Text style={styles.guestIconText}>👤</Text>
        </View>
        
        <Text style={styles.guestTitle}>Welcome to EMEGA!</Text>
        <Text style={styles.guestSubtitle}>
          Sign in to access your profile, orders, wishlist and more
        </Text>

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>

        {/* Guest menu items - limited functionality */}
        <View style={styles.guestMenuSection}>
          <Text style={styles.sectionTitle}>Browse as Guest</Text>
          
          <TouchableOpacity style={styles.guestMenuItem} onPress={() => navigation.navigate('HomeTab')}>
            <Text style={styles.menuIcon}>🏠</Text>
            <Text style={styles.menuTitle}>Browse Products</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestMenuItem} onPress={() => navigation.navigate('CategoryTab')}>
            <Text style={styles.menuIcon}>📂</Text>
            <Text style={styles.menuTitle}>Categories</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.guestMenuItem} 
            onPress={() => {
              Alert.alert(
                'Sign In Required',
                'Please sign in to view your cart',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign In', onPress: () => navigation.navigate('Login') }
                ]
              );
            }}
          >
            <Text style={styles.menuIcon}>🛒</Text>
            <Text style={styles.menuTitle}>Cart</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.guestMenuItem}
            onPress={() => Alert.alert('Info', 'Contact: support@emega.com')}
          >
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuTitle}>Help & Support</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  // Show authenticated user profile
  const AuthenticatedProfile = () => {
    const handleLogout = () => {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Logout', 
            onPress: async () => {
              try {
                await signOut();
                // Navigation will be handled by auth state change
              } catch (error) {
                Alert.alert('Error', 'Failed to logout');
              }
            }, 
            style: 'destructive' 
          },
        ]
      );
    };

    const menuItems = [
      { 
        icon: '👤', 
        title: 'Edit Profile', 
        onPress: () => navigation.navigate('EditProfile', { user, userProfile }) 
      },
      { 
        icon: '📦', 
        title: 'Order History', 
        onPress: () => navigation.navigate('OrderHistory') 
      },
      { 
        icon: '❤️', 
        title: 'Wishlist', 
        onPress: () => navigation.navigate('Wishlist') 
      },
      { 
        icon: '📍', 
        title: 'Addresses', 
        onPress: () => navigation.navigate('Addresses') 
      },
      { 
        icon: '💳', 
        title: 'Payment Methods', 
        onPress: () => navigation.navigate('PaymentMethods') 
      },
      { 
        icon: '🔔', 
        title: 'Notifications', 
        onPress: () => navigation.navigate('NotificationSettings') 
      },
      { 
        icon: '❓', 
        title: 'Help & Support', 
        onPress: () => navigation.navigate('Support') 
      },
      { 
        icon: '⚙️', 
        title: 'Settings', 
        onPress: () => navigation.navigate('Settings') 
      },
    ];

    const displayName = userProfile?.full_name || user?.user_metadata?.full_name || 'User';
    const displayEmail = user?.email || 'No email';
    const avatarUrl = userProfile?.avatar_url || user?.user_metadata?.avatar_url;
    const isVerified = user?.email_confirmed_at ? true : false;

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.profileContainer}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            
            <View style={styles.profileDetails}>
              <Text style={styles.userName}>{displayName}</Text>
              <View style={styles.emailContainer}>
                <Text style={styles.userEmail}>{displayEmail}</Text>
                {isVerified && <Text style={styles.verifiedBadge}>✓ Verified</Text>}
              </View>
              
              {userProfile?.role && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{userProfile.role.toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>🚪</Text>
            <Text style={styles.logoutTitle}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* User Info Section */}
        <View style={styles.userInfoSection}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>User ID:</Text>
            <Text style={styles.infoValue}>{user.id.substring(0, 8)}...</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Member since:</Text>
            <Text style={styles.infoValue}>
              {new Date(user.created_at).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Last login:</Text>
            <Text style={styles.infoValue}>
              {userProfile?.last_login 
                ? new Date(userProfile.last_login).toLocaleDateString()
                : 'Recently'
              }
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Show login prompt if not authenticated, otherwise show full profile
  return user ? <AuthenticatedProfile /> : <LoginPrompt />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  
  // Guest user styles
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  guestIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestIconText: {
    fontSize: 32,
    color: '#999',
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  guestSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 40,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestMenuSection: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  guestMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  
  // Authenticated user styles - Updated for horizontal layout
  profileSection: {
    backgroundColor: 'white',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  emailContainer: {
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  verifiedBadge: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  roleBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400E',
  },
  menuSection: {
    backgroundColor: 'white',
    paddingVertical: 8,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  menuArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
    backgroundColor: '#FEF2F2',
  },
  logoutIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  logoutTitle: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '500',
  },
  userInfoSection: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
});