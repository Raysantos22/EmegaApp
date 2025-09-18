// src/services/NotificationService.js - iOS Fixed Version
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

const supabaseUrl = 'https://msbqgxjbsxztcnkxziju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYnFneGpic3h6dGNua3h6aWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzA5ODgsImV4cCI6MjA3MzYwNjk4OH0.JkMIH03-rWdllFLTTuTzbGk_m-v9C47kNqUZLOA2VdI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// iOS-specific notification channel setup
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
    sound: 'default',
    enableVibrate: true,
    enableLights: true,
    bypassDnd: false,
  });
}

// iOS-optimized notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('🍎 iOS Notification Handler Called:', {
      title: notification.request.content.title,
      body: notification.request.content.body,
      data: notification.request.content.data,
    });
    
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      // iOS specific - ensure foreground notifications are shown
      shouldShowAlert: Platform.OS === 'ios' ? true : false,
    };
  },
});

class NotificationService {
  constructor() {
    this.userId = 'guest';
    this.notificationListener = null;
    this.responseListener = null;
    this.realtimeChannels = [];
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes
    this.callbacks = {};
    this.isExpoGo = true;
    this.expoPushToken = null;
  }

  async initialize(userId = 'guest') {
    try {
      this.userId = userId;
      
      console.log(`🚀 Initializing notification service for user: ${userId} on ${Platform.OS}`);
      
      // Request permissions first
      const hasPermission = await this.requestNotificationPermissions();
      if (!hasPermission) {
        console.warn('⚠️  Notification permissions denied');
      }
      
      // Get Expo push token (works for both development and production)
      await this.getExpoPushToken();
      
      // Register device
      await this.registerDeviceForExpoGo();
      
      // Set up multiple real-time channels for better reliability
      await this.setupRealtimeListeners();
      
      // Set up local notification listeners
      this.setupNotificationListeners();
      
      // Load cached notifications
      await this.loadCachedNotifications();
      
      console.log('✅ Notification service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      return false;
    }
  }

  async requestNotificationPermissions() {
    try {
      console.log('🔐 Requesting notification permissions...');
      
      if (!Device.isDevice) {
        console.warn('⚠️  Must use physical device for notifications');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📋 Current permission status:', existingStatus);
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        console.log('🔑 Requesting new permissions...');
        
        const permissionRequest = {
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: false,
            allowProvisional: false,
            allowAnnouncements: false,
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        };
        
        const { status } = await Notifications.requestPermissionsAsync(permissionRequest);
        finalStatus = status;
        console.log('🔐 New permission status:', finalStatus);
      }
      
      if (finalStatus !== 'granted') {
        console.warn('❌ Push notification permission not granted');
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive important updates.',
          [{ text: 'OK' }]
        );
        return false;
      }
      
      console.log('✅ Push notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  async getExpoPushToken() {
    try {
      console.log('📱 Getting Expo push token...');
      
      // This works in both Expo Go and standalone apps
      const { data: token } = await Notifications.getExpoPushTokenAsync({
        experienceId: Constants.expoConfig?.extra?.eas?.projectId || '@anonymous/eMegaApplication',
      });
      
      console.log('✅ Expo Push Token:', token);
      this.expoPushToken = token;
      
      return token;
    } catch (error) {
      console.warn('⚠️  Could not get Expo push token:', error.message);
      return null;
    }
  }

  async registerDeviceForExpoGo() {
    try {
      const deviceId = this.expoPushToken || `expo-go-${this.userId}-${Platform.OS}-${Date.now()}`;
      
      const deviceInfo = {
        brand: Device.brand,
        manufacturer: Device.manufacturer,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        platform: Platform.OS,
        isExpoGo: true,
        userId: this.userId,
        expoPushToken: this.expoPushToken,
        deviceType: Device.deviceType,
      };

      console.log('📝 Registering device with info:', deviceInfo);

      try {
        const { data, error } = await supabase
          .from('user_devices')
          .upsert({
            user_id: this.userId,
            device_token: deviceId,
            platform: Platform.OS,
            device_info: deviceInfo,
            is_active: true,
            last_seen_at: new Date().toISOString()
          }, { 
            onConflict: 'device_token'
          })
          .select();

        if (error) {
          console.warn('⚠️  Could not register device in database:', error.message);
        } else {
          console.log('✅ Device registered successfully:', deviceId);
        }
      } catch (dbError) {
        console.warn('⚠️  Database registration failed, continuing:', dbError.message);
      }
      
      await AsyncStorage.setItem('device_id', deviceId);
      return deviceId;
    } catch (error) {
      console.error('❌ Error registering device:', error);
      return null;
    }
  }

  async setupRealtimeListeners() {
    try {
      console.log('📡 Setting up real-time listeners for user:', this.userId);
      
      // Clean up existing channels
      if (this.realtimeChannels.length > 0) {
        console.log('🧹 Cleaning up existing channels:', this.realtimeChannels.length);
        for (const channel of this.realtimeChannels) {
          await supabase.removeChannel(channel);
        }
        this.realtimeChannels = [];
      }

      const channels = [];
      
      // Channel 1: Generic notifications channel (for backend broadcasts)
      const genericChannel = supabase
        .channel('notifications', {
          config: {
            broadcast: { self: true }
          }
        })
        .on('broadcast', { event: 'new_notification' }, (payload) => {
          console.log('🔔 NOTIFICATION FROM GENERIC CHANNEL:');
          console.log('📦 Payload:', JSON.stringify(payload, null, 2));
          this.handleRealtimeNotification(payload);
        })
        .subscribe((status, err) => {
          console.log(`📡 Generic channel status: ${status}`);
          if (err) console.error('Generic channel error:', err);
        });

      channels.push(genericChannel);

      // Channel 2: User-specific channel  
      const userChannel = supabase
        .channel(`user-${this.userId}`, {
          config: {
            broadcast: { self: true }
          }
        })
        .on('broadcast', { event: 'new_notification' }, (payload) => {
          console.log('🔔 NOTIFICATION FROM USER CHANNEL:');
          console.log('📦 Payload:', JSON.stringify(payload, null, 2));
          this.handleRealtimeNotification(payload);
        })
        .subscribe((status, err) => {
          console.log(`📡 User channel status: ${status}`);
          if (err) console.error('User channel error:', err);
        });

      channels.push(userChannel);

      // Channel 3: Timestamped channel
      const timestampedChannel = supabase
        .channel(`notifications-${this.userId}-${Date.now()}`, {
          config: {
            broadcast: { self: true },
            presence: { key: this.userId }
          }
        })
        .on('broadcast', { event: 'new_notification' }, (payload) => {
          console.log('🔔 NOTIFICATION FROM TIMESTAMPED CHANNEL:');
          console.log('📦 Payload:', JSON.stringify(payload, null, 2));
          this.handleRealtimeNotification(payload);
        })
        .subscribe((status, err) => {
          console.log(`📡 Timestamped channel status: ${status}`);
          if (err) console.error('Timestamped channel error:', err);
        });

      channels.push(timestampedChannel);

      this.realtimeChannels = channels;

      console.log('📡 Created', channels.length, 'real-time channels');

      // Test connections after setup
      setTimeout(() => {
        this.testAllChannels();
      }, 3000);

      console.log('✅ Real-time listener setup completed');
    } catch (error) {
      console.error('❌ Error setting up real-time listeners:', error);
      setTimeout(() => this.setupRealtimeListeners(), 5000);
    }
  }

  async testAllChannels() {
    console.log('🔍 Testing all channels...');
    
    for (let i = 0; i < this.realtimeChannels.length; i++) {
      const channel = this.realtimeChannels[i];
      console.log(`Testing channel ${i+1}:`, channel.topic);
      
      try {
        const result = await channel.send({
          type: 'broadcast',
          event: 'connection_test',
          payload: { test: true, channel: i+1, timestamp: new Date().toISOString() }
        });
        console.log(`Channel ${i+1} test result:`, result);
      } catch (error) {
        console.error(`Channel ${i+1} test failed:`, error);
      }
    }
  }

  async handleRealtimeNotification(payload) {
    try {
      console.log('🔄 PROCESSING REAL-TIME NOTIFICATION:');
      console.log('📋 Step 1: Extracting notification data...');
      
      const notification = payload.payload;
      console.log('📦 Notification object:', JSON.stringify(notification, null, 2));

      // Check if this notification is for this user
      console.log('👤 Step 2: Checking user targeting...');
      if (notification.target_users && 
          notification.target_users.length > 0 && 
          !notification.target_users.includes(this.userId)) {
        console.log('❌ Notification not for this user, skipping');
        return;
      }

      // Prevent duplicate processing
      console.log('🔍 Step 3: Checking for duplicates...');
      const notificationKey = `processed_${notification.id}`;
      const lastProcessed = await AsyncStorage.getItem(notificationKey);
      if (lastProcessed) {
        console.log('⚠️  Notification already processed, skipping');
        return;
      }

      // Mark as processed
      await AsyncStorage.setItem(notificationKey, new Date().toISOString());

      // Show local notification with iOS-specific handling
      console.log('🔔 Step 4: Showing local notification...');
      await this.showLocalNotification(notification, true);
      
      // Try to mark as delivered
      try {
        await this.markNotificationAsDelivered(notification.id);
      } catch (deliveryError) {
        console.warn('⚠️  Could not mark as delivered:', deliveryError.message);
      }
      
      // Cache the notification
      const userNotification = {
        id: Date.now(),
        notification_id: notification.id,
        user_id: this.userId,
        delivered_at: new Date().toISOString(),
        read_at: null,
        created_at: notification.sent_at || new Date().toISOString(),
        notifications: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          image_url: notification.image_url,
          action_type: notification.action_type,
          action_value: notification.action_value,
          created_at: notification.created_at || notification.sent_at
        }
      };
      
      await this.cacheUserNotification(userNotification);
      
      // Trigger callbacks
      this.triggerNotificationCallbacks('received', userNotification);
      
      console.log('✅ Real-time notification processing completed');
      
    } catch (error) {
      console.error('❌ Error in real-time notification processing:', error);
    }
  }

  async showLocalNotification(notification, shouldAlert = false) {
    try {
      console.log(`🔔 SHOWING LOCAL NOTIFICATION ON ${Platform.OS}:`);
      console.log('Title:', notification.title);
      console.log('Message:', notification.message);
      
      const notificationContent = {
        title: notification.title,
        body: notification.message,
        data: {
          id: notification.id,
          type: notification.type,
          action_type: notification.action_type,
          action_value: notification.action_value,
          image_url: notification.image_url,
          sent_at: notification.sent_at
        },
        sound: 'default',
        badge: 1,
      };

      // Platform-specific configurations
      if (Platform.OS === 'android') {
        notificationContent.priority = Notifications.AndroidNotificationPriority.HIGH;
        notificationContent.vibrate = [0, 250, 250, 250];
        notificationContent.channelId = 'default';
        notificationContent.sticky = false;
      }

      if (Platform.OS === 'ios') {
        // iOS specific settings for better visibility
        notificationContent.sound = 'default';
        notificationContent.categoryIdentifier = 'default';
        
        // For iOS 15+
        if (parseFloat(Device.osVersion || '0') >= 15.0) {
          notificationContent.interruptionLevel = 'active';
          notificationContent.relevanceScore = 1.0;
        }
        
        // Ensure subtitle is used for better display
        if (notification.type) {
          notificationContent.subtitle = notification.type.toUpperCase();
        }
      }

      const notificationRequest = {
        content: notificationContent,
        trigger: null, // Show immediately
      };

      console.log('📋 Notification request for', Platform.OS + ':', JSON.stringify(notificationRequest, null, 2));

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync(notificationRequest);
      console.log('✅ Notification scheduled with ID:', notificationId);

      // iOS: Show additional alert for critical notifications
      if (Platform.OS === 'ios' && shouldAlert && notification.title && notification.message) {
        console.log('🍎 Showing iOS Alert...');
        
        setTimeout(() => {
          Alert.alert(
            notification.title,
            notification.message,
            [
              { text: 'OK', onPress: () => console.log('iOS Alert dismissed') },
              notification.action_type && notification.action_type !== 'none' ? {
                text: this.getActionButtonText(notification.action_type),
                onPress: () => {
                  console.log('iOS Alert action pressed:', notification.action_type);
                  this.handleNotificationAction(notification.action_type, notification.action_value);
                }
              } : null
            ].filter(Boolean),
            { cancelable: true }
          );
        }, 500); // Shorter delay for iOS
      }

      console.log('✅ Local notification display completed');
    } catch (error) {
      console.error('❌ Error showing local notification:', error);
    }
  }

  getActionButtonText(actionType) {
    switch (actionType) {
      case 'product': return 'View Product';
      case 'category': return 'Browse Category';
      case 'screen': return 'Open';
      case 'url': return 'Open Link';
      default: return 'Take Action';
    }
  }

  setupNotificationListeners() {
    console.log('🎧 Setting up local notification listeners...');
    
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log(`📨 LOCAL NOTIFICATION RECEIVED ON ${Platform.OS}:`);
      console.log('Title:', notification.request.content.title);
      console.log('Body:', notification.request.content.body);
      console.log('Data:', notification.request.content.data);
      
      // iOS specific handling
      if (Platform.OS === 'ios') {
        console.log('🍎 iOS notification received in foreground');
        // On iOS, we can handle foreground notifications differently
      }
      
      this.triggerNotificationCallbacks('received_local', notification.request.content.data);
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(`👆 NOTIFICATION RESPONSE ON ${Platform.OS}:`);
      console.log('Action identifier:', response.actionIdentifier);
      console.log('User text:', response.userText);
      
      this.handleNotificationResponse(response);
    });
    
    console.log('✅ Local notification listeners set up');
  }

  async handleNotificationResponse(response) {
    try {
      const notificationData = response.notification.request.content.data;
      
      if (notificationData && notificationData.id) {
        await this.markNotificationAsClicked(notificationData.id);
        this.triggerNotificationCallbacks('clicked', notificationData);
        
        if (notificationData.action_type && notificationData.action_value) {
          this.handleNotificationAction(notificationData.action_type, notificationData.action_value);
        }
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  }

  handleNotificationAction(actionType, actionValue) {
    try {
      const actionData = {
        type: actionType,
        value: actionValue,
        timestamp: new Date().toISOString()
      };

      this.pendingAction = actionData;
      this.triggerNotificationCallbacks('action', actionData);
      
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  }

  getPendingAction() {
    const action = this.pendingAction;
    this.pendingAction = null;
    return action;
  }

  async markNotificationAsDelivered(notificationId) {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({
          delivered_at: new Date().toISOString()
        })
        .eq('notification_id', notificationId)
        .eq('user_id', this.userId);

      if (error) {
        console.warn('Could not mark as delivered:', error.message);
      }
    } catch (error) {
      console.warn('Error in markNotificationAsDelivered:', error.message);
    }
  }

  async markNotificationAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({
          read_at: new Date().toISOString()
        })
        .eq('notification_id', notificationId)
        .eq('user_id', this.userId);

      if (error) {
        console.warn('Could not mark as read:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Error in markNotificationAsRead:', error.message);
      return false;
    }
  }

  async markNotificationAsClicked(notificationId) {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({
          clicked_at: new Date().toISOString()
        })
        .eq('notification_id', notificationId)
        .eq('user_id', this.userId);

      if (error) {
        console.warn('Could not mark as clicked:', error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Error in markNotificationAsClicked:', error.message);
      return false;
    }
  }

  async getUserNotifications(limit = 20, offset = 0) {
    const cacheKey = `user_notifications_${this.userId}_${limit}_${offset}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select(`
          *,
          notifications (
            id,
            title,
            message,
            type,
            image_url,
            action_type,
            action_value,
            created_at,
            expires_at
          )
        `)
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.warn('Could not fetch user notifications:', error.message);
        const cachedNotifications = await this.loadCachedUserNotifications();
        return cachedNotifications.slice(offset, offset + limit);
      }

      const now = new Date();
      const validNotifications = (data || []).filter(item => {
        if (item.notifications?.expires_at) {
          return new Date(item.notifications.expires_at) > now;
        }
        return true;
      });

      this.cache.set(cacheKey, {
        data: validNotifications,
        timestamp: Date.now()
      });

      return validNotifications;
    } catch (error) {
      console.warn('Error in getUserNotifications:', error.message);
      const cachedNotifications = await this.loadCachedUserNotifications();
      return cachedNotifications.slice(offset, offset + limit);
    }
  }

  async getUnreadCount() {
    try {
      const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .is('read_at', null);

      if (error) {
        console.warn('Could not get unread count:', error.message);
        const cached = await this.loadCachedUserNotifications();
        return cached.filter(n => !n.read_at).length;
      }

      return count || 0;
    } catch (error) {
      console.warn('Error in getUnreadCount:', error.message);
      return 0;
    }
  }

  async loadCachedNotifications() {
    try {
      console.log('Loading cached notifications...');
      const cached = await this.loadCachedUserNotifications();
      console.log(`Loaded ${cached.length} cached notifications`);
      return cached;
    } catch (error) {
      console.error('Error loading cached notifications:', error);
      return [];
    }
  }

  async cacheUserNotification(userNotification) {
    try {
      const cacheKey = 'cached_user_notifications';
      const existing = await AsyncStorage.getItem(cacheKey);
      let notifications = existing ? JSON.parse(existing) : [];

      notifications = notifications.filter(n => n.notification_id !== userNotification.notification_id);
      notifications.unshift({
        ...userNotification,
        cached_at: new Date().toISOString()
      });

      notifications = notifications.slice(0, 100);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(notifications));
      console.log('User notification cached successfully');
    } catch (error) {
      console.error('Error caching user notification:', error);
    }
  }

  async loadCachedUserNotifications() {
    try {
      const cacheKey = 'cached_user_notifications';
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (cached) {
        const notifications = JSON.parse(cached);
        console.log(`Loaded ${notifications.length} cached user notifications`);
        return notifications;
      }
      
      return [];
    } catch (error) {
      console.error('Error loading cached user notifications:', error);
      return [];
    }
  }

  async clearAllNotifications() {
    try {
      await AsyncStorage.removeItem('cached_user_notifications');
      
      try {
        const { error } = await supabase
          .from('user_notifications')
          .update({
            dismissed_at: new Date().toISOString()
          })
          .eq('user_id', this.userId)
          .is('dismissed_at', null);

        if (error) {
          console.warn('Could not clear notifications in database:', error.message);
        }
      } catch (dbError) {
        console.warn('Database clear failed:', dbError.message);
      }

      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error in clearAllNotifications:', error);
      return false;
    }
  }

  setNotificationCallback(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  removeNotificationCallback(event, callback) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  triggerNotificationCallbacks(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in notification callback:', error);
        }
      });
    }
  }

  clearCache() {
    this.cache.clear();
  }

  async debugNotificationStatus() {
    console.log('🔍 NOTIFICATION DEBUG STATUS:');
    console.log('==========================================');
    console.log('Platform:', Platform.OS);
    console.log('Device:', Device.modelName);
    console.log('OS Version:', Device.osVersion);
    console.log('User ID:', this.userId);
    console.log('Expo Push Token:', this.expoPushToken);
    console.log('Service initialized:', !!this.userId);
    console.log('Real-time channels:', this.realtimeChannels.length);
    console.log('Active listeners:', {
      notification: !!this.notificationListener,
      response: !!this.responseListener
    });
    
    try {
      const permissions = await Notifications.getPermissionsAsync();
      console.log('Notification permissions:', permissions);
      
      const cachedNotifications = await this.loadCachedUserNotifications();
      console.log('Cached notifications count:', cachedNotifications.length);
      
      if (cachedNotifications.length > 0) {
        console.log('Latest cached notification:', cachedNotifications[0]);
      }
      
    } catch (error) {
      console.error('Error getting debug status:', error);
    }
    
    console.log('==========================================');
  }

  async testNotification() {
    try {
      console.log('🧪 STARTING TEST NOTIFICATION FOR', Platform.OS);
      await this.debugNotificationStatus();
      
      const testNotification = {
        id: 'test_' + Date.now(),
        title: Platform.OS === 'ios' ? 'iOS Test Notification' : 'Android Test Notification',
        message: `This is a test notification for ${Platform.OS.toUpperCase()}! Tap to interact.`,
        type: 'info',
        action_type: 'screen',
        action_value: 'Home',
        sent_at: new Date().toISOString()
      };

      console.log('Test notification data:', testNotification);
      
      // Show as alert notification for testing
      await this.showLocalNotification(testNotification, true);
      console.log('✅ Test notification sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      return false;
    }
  }

  async testSupabaseBroadcast() {
    try {
      console.log('🧪 TESTING SUPABASE BROADCAST FOR', Platform.OS);
      console.log('Channel count:', this.realtimeChannels.length);
      
      if (this.realtimeChannels.length === 0) {
        console.error('❌ No real-time channels available');
        return false;
      }

      const channel = this.realtimeChannels[0];
      console.log('📡 Using channel for broadcast test');

      const testPayload = {
        id: 'backend_test_' + Date.now(),
        title: `${Platform.OS.toUpperCase()} Backend Test`, 
        message: `Backend broadcast test for ${Platform.OS}! This simulates your server sending notifications.`,
        type: 'promotional',
        action_type: 'screen',
        action_value: 'Home',
        sent_at: new Date().toISOString(),
        target_users: [this.userId],
        created_at: new Date().toISOString()
      };

      console.log('📤 Broadcasting test payload:', JSON.stringify(testPayload, null, 2));

      const result = await channel.send({
        type: 'broadcast',
        event: 'new_notification',
        payload: testPayload
      });

      console.log('📡 Broadcast result:', result);
      console.log('✅ Supabase broadcast test completed');
      return true;
    } catch (error) {
      console.error('❌ Error in Supabase broadcast test:', error);
      return false;
    }
  }

  async testRealtimeNotification() {
    try {
      const testPayload = {
        payload: {
          id: 'realtime_test_' + Date.now(),
          title: `${Platform.OS.toUpperCase()} Real-time Test`,
          message: `Real-time notification test for ${Platform.OS}! This should show immediately.`,
          type: 'success',
          action_type: 'product',
          action_value: '123',
          sent_at: new Date().toISOString(),
          target_users: [this.userId]
        }
      };

      console.log('Simulating real-time notification for', Platform.OS, ':', testPayload);
      await this.handleRealtimeNotification(testPayload);
      return true;
    } catch (error) {
      console.error('Error sending test real-time notification:', error);
      return false;
    }
  }

  async cleanup() {
    try {
      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener);
      }
      
      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener);
      }

      if (this.realtimeChannels.length > 0) {
        for (const channel of this.realtimeChannels) {
          await supabase.removeChannel(channel);
        }
        this.realtimeChannels = [];
      }

      console.log('Notification service cleaned up');
    } catch (error) {
      console.error('Error cleaning up notification service:', error);
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();
export default notificationService;