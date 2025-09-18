// src/context/NotificationContext.js - iOS Enhanced Version
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import NotificationService from '../services/NotificationService';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        loading: false,
      };
    case 'SET_UNREAD_COUNT':
      return {
        ...state,
        unreadCount: action.payload,
      };
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ 
          ...n, 
          read_at: n.read_at || new Date().toISOString() 
        })),
        unreadCount: 0,
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'SET_INITIALIZED':
      return {
        ...state,
        initialized: action.payload,
      };
    default:
      return state;
  }
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    initialized: false,
  });

  // Initialize notification service
  const initializeNotifications = useCallback(async (userId = 'guest') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      console.log('Initializing notification service for user:', userId);
      
      // Initialize the notification service
      const initialized = await NotificationService.initialize(userId);
      
      if (initialized) {
        // Load initial notifications
        await loadNotifications();
        await loadUnreadCount();
        
        // Set up notification callbacks
        setupNotificationCallbacks();
        
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        console.log('Notification service initialized successfully');
      } else {
        throw new Error('Failed to initialize notification service');
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      // Even if initialization fails, mark as "initialized" so UI doesn't get stuck
      dispatch({ type: 'SET_INITIALIZED', payload: true });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Load notifications from service
  const loadNotifications = useCallback(async () => {
    try {
      const userNotifications = await NotificationService.getUserNotifications(50, 0);
      
      // Transform notifications to match the context format
      const transformedNotifications = userNotifications.map(item => {
        // Handle both direct notification objects and user_notification objects
        if (item.notifications) {
          // This is a user_notification object with nested notification
          return {
            id: item.id,
            notification_id: item.notification_id,
            title: item.notifications.title || 'Notification',
            message: item.notifications.message || '',
            type: item.notifications.type || 'info',
            image_url: item.notifications.image_url,
            action_type: item.notifications.action_type,
            action_value: item.notifications.action_value,
            read_at: item.read_at,
            created_at: item.created_at,
            delivered_at: item.delivered_at,
            clicked_at: item.clicked_at,
          };
        } else {
          // This is a direct notification object
          return {
            id: item.id,
            notification_id: item.notification_id || item.id,
            title: item.title || 'Notification',
            message: item.message || '',
            type: item.type || 'info',
            image_url: item.image_url,
            action_type: item.action_type,
            action_value: item.action_value,
            read_at: item.read_at,
            created_at: item.created_at,
            delivered_at: item.delivered_at,
            clicked_at: item.clicked_at,
          };
        }
      });
      
      dispatch({ type: 'SET_NOTIFICATIONS', payload: transformedNotifications });
    } catch (error) {
      console.error('Error loading notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load notifications' });
      // Don't fail completely, just show empty list
      dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
    }
  }, []);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      dispatch({ type: 'SET_UNREAD_COUNT', payload: count });
    } catch (error) {
      console.error('Error loading unread count:', error);
      // Default to 0 if we can't get the count
      dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 });
    }
  }, []);

  // Set up notification callbacks
  const setupNotificationCallbacks = useCallback(() => {
    // Handle new notifications received in real-time
    const handleNewNotification = (notification) => {
      console.log('New notification received in context:', notification);
      
      try {
        // Transform the notification to match expected format
        const newNotification = {
          id: notification.id || Date.now(),
          notification_id: notification.notification_id || notification.id,
          title: notification.title || notification.notifications?.title || 'Notification',
          message: notification.message || notification.notifications?.message || '',
          type: notification.type || notification.notifications?.type || 'info',
          image_url: notification.image_url || notification.notifications?.image_url,
          action_type: notification.action_type || notification.notifications?.action_type,
          action_value: notification.action_value || notification.notifications?.action_value,
          read_at: notification.read_at || null,
          created_at: notification.created_at || new Date().toISOString(),
          delivered_at: notification.delivered_at || new Date().toISOString(),
        };
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
      } catch (error) {
        console.error('Error handling new notification:', error);
      }
    };

    // Handle notification actions (when user taps notification)
    const handleNotificationAction = (actionData) => {
      console.log('Notification action triggered:', actionData);
      // This can be handled by individual screens/components
    };

    // Set up callbacks with error handling
    try {
      NotificationService.setNotificationCallback('received', handleNewNotification);
      NotificationService.setNotificationCallback('action', handleNotificationAction);

      return () => {
        // Cleanup callbacks
        try {
          NotificationService.removeNotificationCallback('received', handleNewNotification);
          NotificationService.removeNotificationCallback('action', handleNotificationAction);
        } catch (error) {
          console.error('Error removing notification callbacks:', error);
        }
      };
    } catch (error) {
      console.error('Error setting up notification callbacks:', error);
      return () => {}; // Return empty cleanup function
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId, notification_id) => {
    try {
      // Mark as read in the service
      if (notification_id) {
        await NotificationService.markNotificationAsRead(notification_id);
      }
      
      // Update local state
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
      
      // Reload unread count
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [loadUnreadCount]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = state.notifications.filter(n => !n.read_at);
      
      for (const notification of unreadNotifications) {
        if (notification.notification_id) {
          await NotificationService.markNotificationAsRead(notification.notification_id);
        }
      }
      
      dispatch({ type: 'MARK_ALL_READ' });
      dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [state.notifications]);

  // Clear all notifications
  const clearNotifications = useCallback(async () => {
    try {
      await NotificationService.clearAllNotifications();
      dispatch({ type: 'CLEAR_ALL' });
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      await loadNotifications();
      await loadUnreadCount();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to refresh notifications' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [loadNotifications, loadUnreadCount]);

  // Handle notification click (for navigation)
  const handleNotificationClick = useCallback(async (notification, navigation) => {
    try {
      // Mark as clicked in the service
      if (notification.notification_id) {
        await NotificationService.markNotificationAsClicked(notification.notification_id);
      }
      
      // Mark as read if not already read
      if (!notification.read_at) {
        await markAsRead(notification.id, notification.notification_id);
      }
      
      // Handle navigation based on action
      if (notification.action_type && notification.action_value && navigation) {
        switch (notification.action_type) {
          case 'screen':
            navigation.navigate(notification.action_value);
            break;
          case 'product':
            navigation.navigate('Product', { productId: notification.action_value });
            break;
          case 'category':
            navigation.navigate('Search', { query: notification.action_value });
            break;
          case 'url':
            // Handle URL opening (could integrate with Linking API)
            console.log('Open URL:', notification.action_value);
            break;
          default:
            break;
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  }, [markAsRead]);

  // Test notification function (for development)
  const sendTestNotification = useCallback(async () => {
    try {
      await NotificationService.testNotification();
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, []);

  // Test real-time notification function (for development)
  const testSupabaseBroadcast = useCallback(async () => {
    try {
      console.log('Testing Supabase broadcast from context...');
      await NotificationService.testSupabaseBroadcast();
    } catch (error) {
      console.error('Error testing Supabase broadcast:', error);
    }
  }, []);

  // Test real-time simulation
  const sendTestRealtimeNotification = useCallback(async () => {
    try {
      await NotificationService.testRealtimeNotification();
    } catch (error) {
      console.error('Error sending test real-time notification:', error);
    }
  }, []);

  // Debug notification status
  const debugNotificationStatus = useCallback(async () => {
    try {
      await NotificationService.debugNotificationStatus();
    } catch (error) {
      console.error('Error getting debug status:', error);
    }
  }, []);

  // Check for pending notification action (when app opens from notification)
  const checkPendingAction = useCallback(() => {
    try {
      return NotificationService.getPendingAction();
    } catch (error) {
      console.error('Error checking pending action:', error);
      return null;
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      // State
      notifications: state.notifications,
      unreadCount: state.unreadCount,
      loading: state.loading,
      error: state.error,
      initialized: state.initialized,
      
      // Actions
      initializeNotifications,
      loadNotifications,
      loadUnreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      refreshNotifications,
      handleNotificationClick,
      sendTestNotification,
      testSupabaseBroadcast, // Updated name for clarity
      sendTestRealtimeNotification,
      debugNotificationStatus, // Added debug function
      checkPendingAction,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};