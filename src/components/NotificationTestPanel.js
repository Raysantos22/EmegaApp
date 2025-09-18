// src/components/NotificationTestPanel.js - Easy component for testing phone notifications
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationBroadcaster from '../services/NotificationBroadcaster';

const { width } = Dimensions.get('window');

export default function NotificationTestPanel({ userId = 'guest', style = {} }) {
  const [broadcasterInitialized, setBroadcasterInitialized] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const initBroadcaster = async () => {
      if (!broadcasterInitialized) {
        const initialized = await NotificationBroadcaster.initialize();
        setBroadcasterInitialized(initialized);
        console.log('📡 Notification broadcaster status:', initialized);
      }
    };
    
    initBroadcaster();
  }, [broadcasterInitialized]);

  const sendTestNotification = async (type) => {
    if (sending) return;
    
    try {
      setSending(true);
      console.log(`🚀 Sending ${type} notification to phone...`);
      
      let result;
      switch (type) {
        case 'welcome':
          result = await NotificationBroadcaster.sendTestWelcomeNotification(userId);
          break;
        case 'product':
          result = await NotificationBroadcaster.sendTestProductNotification(userId);
          break;
        case 'order':
          result = await NotificationBroadcaster.sendTestOrderNotification(userId);
          break;
        case 'error':
          result = await NotificationBroadcaster.sendTestErrorNotification(userId);
          break;
        case 'broadcast':
          result = await NotificationBroadcaster.sendBroadcastNotification();
          break;
        case 'simple':
          result = await NotificationBroadcaster.sendNotification({
            title: 'Test Phone Popup 📱',
            message: 'This notification should popup on your phone even when the app is closed or minimized!',
            type: 'info',
            targetUsers: [userId]
          });
          break;
        default:
          result = await NotificationBroadcaster.sendNotification({
            title: 'Custom Test Notification',
            message: 'Testing phone popup functionality with enhanced features!',
            type: 'info',
            targetUsers: [userId]
          });
      }
      
      console.log('✅ Phone notification sent successfully:', result.id);
      Alert.alert(
        'Phone Notification Sent! 📱', 
        `Check your phone for the popup notification!\n\nType: ${type}\nID: ${result.id}\n\nIt should appear even if the app is closed.`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Error sending phone notification:', error);
      Alert.alert('Error', `Failed to send notification: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  if (!__DEV__ || !broadcasterInitialized) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Ionicons name="phone-portrait" size={20} color="#fff" />
        <Text style={styles.title}>Test Phone Notifications</Text>
      </View>
      
      <Text style={styles.subtitle}>
        Send real notifications that will popup on your phone (even when app is closed)
      </Text>
      
      <View style={styles.buttonGrid}>
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#10B981' }, sending && styles.disabled]}
          onPress={() => sendTestNotification('simple')}
          disabled={sending}
        >
          <Ionicons name="phone-portrait" size={16} color="white" />
          <Text style={styles.buttonText}>Simple Test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#8B5CF6' }, sending && styles.disabled]}
          onPress={() => sendTestNotification('product')}
          disabled={sending}
        >
          <Ionicons name="pricetag" size={16} color="white" />
          <Text style={styles.buttonText}>Product Deal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#3B82F6' }, sending && styles.disabled]}
          onPress={() => sendTestNotification('order')}
          disabled={sending}
        >
          <Ionicons name="cube" size={16} color="white" />
          <Text style={styles.buttonText}>Order Update</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#EF4444' }, sending && styles.disabled]}
          onPress={() => sendTestNotification('error')}
          disabled={sending}
        >
          <Ionicons name="warning" size={16} color="white" />
          <Text style={styles.buttonText}>Error Alert</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#F59E0B' }, sending && styles.disabled]}
          onPress={() => sendTestNotification('broadcast')}
          disabled={sending}
        >
          <Ionicons name="megaphone" size={16} color="white" />
          <Text style={styles.buttonText}>Broadcast</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.testButton, { backgroundColor: '#10B981' }, sending && styles.disabled]}
          onPress={() => sendTestNotification('welcome')}
          disabled={sending}
        >
          <Ionicons name="hand-right" size={16} color="white" />
          <Text style={styles.buttonText}>Welcome</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.instructions}>
        {sending ? 'Sending notification...' : 'Tap any button to test phone popups. Close or minimize the app to see them work!'}
      </Text>
      
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
        <Text style={styles.statusText}>Real-time connection active</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  subtitle: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: (width - 80) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  instructions: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
});