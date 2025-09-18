// src/screens/AuthenticatedProfileScreen.js - Updated Profile using Auth Context
import React from 'react';
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
import { useAuth } from './AuthContext';

export default function AuthenticatedProfileScreen({ navigation }) {
  const { user, userProfile, loading, signOut, fetchUserProfile } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', 'Failed to logout');
            } else {
              navigation.replace('Login');
            }
          }, 
          style: 'destructive' 
        },
      ]
    );
  };

  const handleRefresh = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  const menuItems = [
    { 
      icon: '👤', 
      title: 'Edit Profile', 
      onPress: () => navigation.navigate('EditProfile') 
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DC2626" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const displayName = userProfile?.full_name || user?.user_metadata?.full_name || 'User';
  const displayEmail = user?.email || 'No email';
  const avatarUrl = userProfile?.avatar_url || user?.user_metadata?.avatar_url;
  const isVerified = user?.email_confirmed_at ? true : false;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
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
}

// Styles remain the same as the previous ProfileScreen
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshButton: {
    padding: 8,
  },
  refreshText: {
    fontSize: 20,
    color: '#DC2626',
  },
  profileSection: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
});