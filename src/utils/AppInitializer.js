// src/utils/AppInitializer.js
import DatabaseService from '../services/DatabaseService';
import AutoDSService from '../services/AutoDSService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class AppInitializer {
  
  static async initialize() {
    try {
      console.log('Starting app initialization...');
      
      // Initialize database
      await DatabaseService.initDatabase();
      
      // Initialize sample data if needed (only on first run)
      const isFirstRun = await AsyncStorage.getItem('app_first_run');
      if (!isFirstRun) {
        console.log('First run detected, initializing sample data...');
        await DatabaseService.initSampleData();
        await AsyncStorage.setItem('app_first_run', 'false');
      }
      
      // Check if AutoDS sync is needed
      const syncStatus = await AutoDSService.getSyncStatus();
      if (syncStatus.needsSync) {
        console.log('AutoDS sync needed, scheduling background sync...');
        // Don't await this - let it run in background
        AutoDSService.scheduleSync().catch(error => {
          console.error('Background sync failed:', error);
        });
      }
      
      console.log('App initialization completed successfully');
      return { success: true };
      
    } catch (error) {
      console.error('App initialization failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Call this when user manually wants to sync
  static async syncNow() {
    try {
      const result = await AutoDSService.forceSyncProducts();
      return result;
    } catch (error) {
      console.error('Manual sync failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Check sync status
  static async getSyncInfo() {
    try {
      return await AutoDSService.getSyncStatus();
    } catch (error) {
      console.error('Failed to get sync info:', error);
      return { lastSyncTime: null, needsSync: true };
    }
  }
}

export default AppInitializer;