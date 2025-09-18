// src/screens/NotificationScreen.js - Enhanced with iOS debug features
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../context/NotificationContext';

const { width, height } = Dimensions.get('window');

export default function NotificationScreen({ navigation }) {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    initialized,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    refreshNotifications,
    handleNotificationClick,
    sendTestNotification,
    testSupabaseBroadcast,
    sendTestRealtimeNotification,
    debugNotificationStatus
  } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [debugModalVisible, setDebugModalVisible] = useState(false);

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshNotifications]);

  // Handle notification press - show details modal
  const handleNotificationPress = useCallback(async (notification) => {
    try {
      // Mark as read when viewing details
      if (!notification.read_at) {
        await markAsRead(notification.id, notification.notification_id);
      }
      
      setSelectedNotification(notification);
      setDetailModalVisible(true);
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  }, [markAsRead]);

  // Handle action button in detail modal
  const handleNotificationAction = useCallback(async (notification) => {
    try {
      setDetailModalVisible(false);
      await handleNotificationClick(notification, navigation);
    } catch (error) {
      console.error('Error handling notification action:', error);
    }
  }, [handleNotificationClick, navigation]);

  // Clear all notifications with confirmation
  const handleClearAll = () => {
    if (notifications.length === 0) return;

    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearNotifications,
        },
      ]
    );
  };

  // Mark all as read with confirmation
  const handleMarkAllRead = () => {
    if (unreadCount === 0) return;

    Alert.alert(
      'Mark All as Read',
      `Mark all ${unreadCount} notifications as read?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All Read',
          onPress: markAllAsRead,
        },
      ]
    );
  };

  // Show debug options for development
  const showDebugOptions = () => {
    if (!__DEV__) return;

    Alert.alert(
      `${Platform.OS.toUpperCase()} Debug Options`,
      'Choose a test to run:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Debug Status', onPress: debugNotificationStatus },
        { text: 'Test Local Notification', onPress: sendTestNotification },
        { text: 'Test Supabase Broadcast', onPress: testSupabaseBroadcast },
        { text: 'Test Real-time Sim', onPress: sendTestRealtimeNotification },
      ]
    );
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'alert-circle';
      case 'promotional': return 'gift';
      case 'info': return 'information-circle';
      default: return 'notifications';
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return '#10B981';
      case 'warning': return '#F59E0B';
      case 'error': return '#EF4444';
      case 'promotional': return '#8B5CF6';
      case 'info': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Format full date for detail view
  const formatFullDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get action button text
  const getActionButtonText = (actionType) => {
    switch (actionType) {
      case 'product': return 'View Product';
      case 'category': return 'Browse Category';
      case 'screen': return 'Open';
      case 'url': return 'Open Link';
      default: return 'Take Action';
    }
  };

  // Render individual notification item
  const renderNotificationItem = ({ item }) => {
    const isUnread = !item.read_at;

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isUnread && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  style={styles.notificationImage}
                  onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                />
              ) : (
                <View style={[styles.iconCircle, { backgroundColor: getNotificationColor(item.type) }]}>
                  <Ionicons
                    name={getNotificationIcon(item.type)}
                    size={20}
                    color="white"
                  />
                </View>
              )}
            </View>
            
            <View style={styles.textContainer}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, isUnread && styles.unreadText]} numberOfLines={2}>
                  {item.title}
                </Text>
                {isUnread && <View style={styles.unreadDot} />}
              </View>
              
              <Text style={styles.message} numberOfLines={3}>
                {item.message}
              </Text>
              
              <View style={styles.metaRow}>
                <Text style={styles.timestamp}>
                  {formatDate(item.created_at)}
                </Text>
                <Text style={styles.typeLabel}>
                  {item.type?.toUpperCase() || 'INFO'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.actionIndicator}>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedNotification) return null;

    const notification = selectedNotification;
    const hasAction = notification.action_type && notification.action_type !== 'none';

    return (
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setDetailModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Notification Details</Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Notification Header */}
            <View style={styles.modalNotificationHeader}>
              <View style={styles.modalIconContainer}>
                {notification.image_url ? (
                  <Image
                    source={{ uri: notification.image_url }}
                    style={styles.modalNotificationImage}
                    onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
                  />
                ) : (
                  <View style={[styles.modalIconCircle, { backgroundColor: getNotificationColor(notification.type) }]}>
                    <Ionicons
                      name={getNotificationIcon(notification.type)}
                      size={32}
                      color="white"
                    />
                  </View>
                )}
              </View>

              <View style={styles.modalTypeContainer}>
                <Text style={[styles.modalTypeLabel, { color: getNotificationColor(notification.type) }]}>
                  {notification.type?.toUpperCase() || 'INFO'}
                </Text>
                {!notification.read_at && (
                  <View style={styles.modalUnreadDot} />
                )}
              </View>
            </View>

            {/* Title */}
            <Text style={styles.modalNotificationTitle}>
              {notification.title}
            </Text>

            {/* Message */}
            <Text style={styles.modalNotificationMessage}>
              {notification.message}
            </Text>

            {/* Metadata */}
            <View style={styles.modalMetadataContainer}>
              <View style={styles.modalMetadataRow}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.modalMetadataText}>
                  Received: {formatFullDate(notification.created_at)}
                </Text>
              </View>

              {notification.delivered_at && (
                <View style={styles.modalMetadataRow}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                  <Text style={styles.modalMetadataText}>
                    Delivered: {formatFullDate(notification.delivered_at)}
                  </Text>
                </View>
              )}

              {notification.read_at && (
                <View style={styles.modalMetadataRow}>
                  <Ionicons name="eye-outline" size={16} color="#3B82F6" />
                  <Text style={styles.modalMetadataText}>
                    Read: {formatFullDate(notification.read_at)}
                  </Text>
                </View>
              )}

              {notification.clicked_at && (
                <View style={styles.modalMetadataRow}>
                  <Ionicons name="hand-left-outline" size={16} color="#F59E0B" />
                  <Text style={styles.modalMetadataText}>
                    Clicked: {formatFullDate(notification.clicked_at)}
                  </Text>
                </View>
              )}

              {notification.notification_id && (
                <View style={styles.modalMetadataRow}>
                  <Ionicons name="finger-print-outline" size={16} color="#666" />
                  <Text style={styles.modalMetadataText}>
                    ID: {notification.notification_id}
                  </Text>
                </View>
              )}

              {/* Platform info for debugging */}
              <View style={styles.modalMetadataRow}>
                <Ionicons name="phone-portrait-outline" size={16} color="#666" />
                <Text style={styles.modalMetadataText}>
                  Platform: {Platform.OS.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Action Button */}
            {hasAction && (
              <TouchableOpacity
                style={[styles.modalActionButton, { backgroundColor: getNotificationColor(notification.type) }]}
                onPress={() => handleNotificationAction(notification)}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-forward" size={20} color="white" />
                <Text style={styles.modalActionButtonText}>
                  {getActionButtonText(notification.action_type)}
                </Text>
              </TouchableOpacity>
            )}

            {/* Debug Info (only in dev mode) */}
            {__DEV__ && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info ({Platform.OS})</Text>
                <Text style={styles.debugText}>
                  {JSON.stringify(notification, null, 2)}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // Show loading state
  if (!initialized || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EF4444" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
          <Text style={styles.platformText}>Platform: {Platform.OS}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
          
          {/* Debug button for development */}
          {__DEV__ && (
            <TouchableOpacity
              style={styles.testButton}
              onPress={showDebugOptions}
            >
              <Ionicons 
                name={Platform.OS === 'ios' ? 'logo-apple' : 'logo-android'} 
                size={20} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Platform indicator */}
      {__DEV__ && (
        <View style={styles.platformIndicator}>
          <Text style={styles.platformIndicatorText}>
            Running on {Platform.OS.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      {notifications.length > 0 && (
        <View style={styles.actionButtonsContainer}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAllRead}
            >
              <Ionicons name="checkmark-done" size={16} color="#059669" />
              <Text style={styles.actionButtonText}>Mark all read</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearAll}
          >
            <Ionicons name="trash-outline" size={16} color="#EF4444" />
            <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptySubtitle}>
            You'll see your {Platform.OS} notifications here when you receive them
          </Text>
          
          {/* Debug buttons for empty state */}
          {__DEV__ && (
            <View style={styles.debugButtonsContainer}>
              <TouchableOpacity
                style={styles.testNotificationButton}
                onPress={sendTestNotification}
              >
                <Text style={styles.testNotificationButtonText}>
                  Test {Platform.OS.toUpperCase()} Notification
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.testNotificationButton, styles.secondaryButton]}
                onPress={showDebugOptions}
              >
                <Text style={[styles.testNotificationButtonText, styles.secondaryButtonText]}>
                  Debug Options
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => `notification-${item.id}-${item.notification_id || ''}-${item.created_at}`}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#EF4444']}
              tintColor="#EF4444"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          removeClippedSubviews={true}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}

      {/* Detail Modal */}
      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  testButton: {
    padding: 8,
  },
  platformIndicator: {
    backgroundColor: Platform.OS === 'ios' ? '#007AFF' : '#34D399',
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'center',
    borderRadius: 12,
    marginTop: 8,
  },
  platformIndicatorText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  platformText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  debugButtonsContainer: {
    marginTop: 32,
    alignItems: 'center',
  },
  testNotificationButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  testNotificationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  secondaryButtonText: {
    color: '#EF4444',
  },
  listContainer: {
    paddingVertical: 8,
  },
  notificationItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    backgroundColor: '#FEFEFE',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    marginRight: 12,
  },
  notificationImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
    lineHeight: 22,
  },
  unreadText: {
    color: '#111827',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginLeft: 8,
    marginTop: 7,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  actionIndicator: {
    paddingLeft: 8,
    justifyContent: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
    width: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalNotificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    alignItems: 'flex-start',
  },
  modalNotificationImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTypeLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  modalUnreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
  },
  modalNotificationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 32,
  },
  modalNotificationMessage: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalMetadataContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  modalMetadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalMetadataText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalActionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  debugContainer: {
    marginTop: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});