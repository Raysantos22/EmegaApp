// src/screens/NotificationDebugScreen.js - Debug screen for testing notifications
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NotificationService from '../services/NotificationService';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationDebugScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const {
    notifications,
    unreadCount,
    initialized,
    sendTestNotification,
    refreshNotifications
  } = useNotifications();

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [{
      id: Date.now(),
      timestamp,
      message,
      type
    }, ...prev.slice(0, 19)]); // Keep last 20 logs
  };

  useEffect(() => {
    addLog('Debug screen loaded', 'success');
  }, []);

  const testLocalNotification = async () => {
    setLoading(true);
    addLog('Testing local notification...', 'info');
    
    try {
      const success = await NotificationService.testNotification();
      if (success) {
        addLog('Local notification sent successfully!', 'success');
      } else {
        addLog('Failed to send local notification', 'error');
      }
    } catch (error) {
      addLog(`Local notification error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testContextNotification = async () => {
    setLoading(true);
    addLog('Testing notification context...', 'info');
    
    try {
      await sendTestNotification();
      addLog('Context test notification triggered!', 'success');
    } catch (error) {
      addLog(`Context notification error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const testRealTimeConnection = async () => {
    setLoading(true);
    addLog('Testing real-time connection...', 'info');
    
    try {
      // Test callback setup
      const testCallback = (notification) => {
        addLog(`Received real-time notification: ${notification.title}`, 'success');
      };
      
      NotificationService.setNotificationCallback('received', testCallback);
      addLog('Real-time callback registered', 'success');
      
      // Clean up after 5 seconds
      setTimeout(() => {
        NotificationService.removeNotificationCallback('received', testCallback);
        addLog('Real-time callback removed', 'info');
      }, 5000);
      
    } catch (error) {
      addLog(`Real-time connection error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationData = async () => {
    setLoading(true);
    addLog('Loading notification data...', 'info');
    
    try {
      const userNotifications = await NotificationService.getUserNotifications(5, 0);
      addLog(`Loaded ${userNotifications.length} notifications`, 'success');
      
      const unreadCount = await NotificationService.getUnreadCount();
      addLog(`Unread count: ${unreadCount}`, 'info');
      
    } catch (error) {
      addLog(`Load data error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'This will clear all cached and database notifications. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            addLog('Clearing all notifications...', 'info');
            
            try {
              await NotificationService.clearAllNotifications();
              addLog('All notifications cleared!', 'success');
              await refreshNotifications();
            } catch (error) {
              addLog(`Clear notifications error: ${error.message}`, 'error');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared', 'info');
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return '#10B981';
      case 'error': return '#EF4444';
      case 'warning': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'alert-circle';
      case 'warning': return 'warning';
      default: return 'information-circle';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Debug</Text>
        <TouchableOpacity onPress={clearLogs} style={styles.clearLogsButton}>
          <Text style={styles.clearLogsText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Initialized:</Text>
              <Text style={[styles.statusValue, { color: initialized ? '#10B981' : '#EF4444' }]}>
                {initialized ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Notifications:</Text>
              <Text style={styles.statusValue}>{notifications.length}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Unread:</Text>
              <Text style={styles.statusValue}>{unreadCount}</Text>
            </View>
          </View>
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests</Text>
          <TouchableOpacity
            style={[styles.testButton, loading && styles.disabledButton]}
            onPress={testLocalNotification}
            disabled={loading}
          >
            <Ionicons name="notifications" size={20} color="white" />
            <Text style={styles.testButtonText}>Test Local Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, loading && styles.disabledButton]}
            onPress={testContextNotification}
            disabled={loading}
          >
            <Ionicons name="layers" size={20} color="white" />
            <Text style={styles.testButtonText}>Test Context Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, loading && styles.disabledButton]}
            onPress={testRealTimeConnection}
            disabled={loading}
          >
            <Ionicons name="wifi" size={20} color="white" />
            <Text style={styles.testButtonText}>Test Real-Time Connection</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, loading && styles.disabledButton]}
            onPress={loadNotificationData}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.testButtonText}>Load Notification Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dangerButton, loading && styles.disabledButton]}
            onPress={clearAllNotifications}
            disabled={loading}
          >
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.testButtonText}>Clear All Notifications</Text>
          </TouchableOpacity>
        </View>

        {/* Logs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Logs</Text>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#EF4444" />
              <Text style={styles.loadingText}>Running test...</Text>
            </View>
          )}
          
          {logs.length === 0 ? (
            <Text style={styles.noLogsText}>No logs yet. Run some tests to see output.</Text>
          ) : (
            logs.map(log => (
              <View key={log.id} style={styles.logItem}>
                <Ionicons 
                  name={getLogIcon(log.type)} 
                  size={16} 
                  color={getLogColor(log.type)} 
                />
                <View style={styles.logContent}>
                  <Text style={styles.logMessage}>{log.message}</Text>
                  <Text style={styles.logTimestamp}>{log.timestamp}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  clearLogsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearLogsText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statusContainer: {
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  noLogsText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logContent: {
    flex: 1,
    marginLeft: 8,
  },
  logMessage: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});