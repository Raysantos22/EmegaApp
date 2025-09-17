// src/services/SupabaseBannerService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://msbqgxjbsxztcnkxziju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYnFneGpic3h6dGNua3h6aWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzA5ODgsImV4cCI6MjA3MzYwNjk4OH0.JkMIH03-rWdllFLTTuTzbGk_m-v9C47kNqUZLOA2VdI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class SupabaseBannerService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 30 * 60 * 1000; // 30 minutes cache
  }

  // Get banners with caching
  async getBanners() {
    const cacheKey = 'active_banners';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log('Using cached banners');
      return cached.data;
    }

    try {
      console.log('Fetching banners from Supabase...');
      
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase banner query error:', error);
        throw error;
      }

      console.log(`Raw banners data from Supabase:`, data);

      // Transform and filter banners
      const transformedBanners = this.transformBanners(data || []);
      const activeBanners = this.filterByDateRange(transformedBanners);

      console.log(`Processed ${activeBanners.length} active banners`);

      // Cache the result
      this.cache.set(cacheKey, {
        data: activeBanners,
        timestamp: Date.now()
      });

      return activeBanners;

    } catch (error) {
      console.error('Error fetching banners from Supabase:', error);
      
      // Try to get cached data even if expired
      const expiredCache = this.cache.get(cacheKey);
      if (expiredCache) {
        console.log('Using expired cache due to error');
        return expiredCache.data;
      }
      
      // Return fallback banners if no cache available
      return this.getFallbackBanners();
    }
  }

  // Transform Supabase banner data to match mobile app format
  transformBanners(banners) {
    return banners.map(banner => ({
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle,
      image: banner.image_url, // Transform image_url to image for mobile
      text_color: banner.text_color || 'white',
      action_type: banner.action_type || 'category',
      action_value: banner.action_value,
      display_order: banner.display_order || 0,
      is_active: banner.is_active,
      start_date: banner.start_date,
      end_date: banner.end_date,
      created_at: banner.created_at,
      updated_at: banner.updated_at
    }));
  }

  // Filter banners by date range
  filterByDateRange(banners) {
    const now = new Date();
    
    return banners.filter(banner => {
      // Check if banner is active
      if (!banner.is_active) return false;

      // Check start date
      if (banner.start_date) {
        const startDate = new Date(banner.start_date);
        if (now < startDate) {
          console.log(`Banner "${banner.title}" not yet active (starts ${startDate})`);
          return false;
        }
      }
      
      // Check end date
      if (banner.end_date) {
        const endDate = new Date(banner.end_date);
        if (now > endDate) {
          console.log(`Banner "${banner.title}" expired (ended ${endDate})`);
          return false;
        }
      }
      
      return true;
    });
  }

  // Get all banners (including inactive) for admin purposes
  async getAllBanners() {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      return this.transformBanners(data || []);

    } catch (error) {
      console.error('Error fetching all banners:', error);
      return [];
    }
  }

  // Get banner by ID
  async getBannerById(bannerId) {
    const cacheKey = `banner_${bannerId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('id', bannerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Banner not found
        }
        throw error;
      }

      const transformedBanner = this.transformBanners([data])[0];

      // Cache for 15 minutes
      this.cache.set(cacheKey, {
        data: transformedBanner,
        timestamp: Date.now()
      });

      return transformedBanner;

    } catch (error) {
      console.error('Error fetching banner by ID:', error);
      return null;
    }
  }

  // Refresh banner cache (force fetch from Supabase)
  async refreshBanners() {
    try {
      console.log('Refreshing banner cache...');
      
      // Clear existing cache
      this.clearCache();
      
      // Fetch fresh data
      const banners = await this.getBanners();
      
      return banners;
    } catch (error) {
      console.error('Error refreshing banners:', error);
      return this.getFallbackBanners();
    }
  }

  // Add banner to local recently viewed cache
  async addToRecentlyViewedBanners(banner) {
    try {
      const recentKey = 'recently_viewed_banners';
      const existing = await AsyncStorage.getItem(recentKey);
      let recentBanners = existing ? JSON.parse(existing) : [];

      // Remove if already exists
      recentBanners = recentBanners.filter(b => b.id !== banner.id);

      // Add to beginning
      recentBanners.unshift({
        id: banner.id,
        title: banner.title,
        image: banner.image,
        action_type: banner.action_type,
        action_value: banner.action_value,
        viewed_at: new Date().toISOString()
      });

      // Keep only last 10
      recentBanners = recentBanners.slice(0, 10);

      await AsyncStorage.setItem(recentKey, JSON.stringify(recentBanners));
    } catch (error) {
      console.error('Error adding to recently viewed banners:', error);
    }
  }

  // Get recently viewed banners
  async getRecentlyViewedBanners(limit = 5) {
    try {
      const recentKey = 'recently_viewed_banners';
      const existing = await AsyncStorage.getItem(recentKey);
      const recentBanners = existing ? JSON.parse(existing) : [];
      
      return recentBanners.slice(0, limit);
    } catch (error) {
      console.error('Error getting recently viewed banners:', error);
      return [];
    }
  }

  // Get banner statistics
  async getBannerStats() {
    const cacheKey = 'banner_stats';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < (30 * 60 * 1000)) { // 30 min cache
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('banners')
        .select('id, is_active, start_date, end_date');

      if (error) throw error;

      const now = new Date();
      const stats = {
        total: data.length,
        active: data.filter(b => b.is_active).length,
        inactive: data.filter(b => !b.is_active).length,
        scheduled: data.filter(b => b.start_date || b.end_date).length,
        expired: data.filter(b => b.end_date && new Date(b.end_date) < now).length,
        future: data.filter(b => b.start_date && new Date(b.start_date) > now).length
      };

      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;

    } catch (error) {
      console.error('Error fetching banner stats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        scheduled: 0,
        expired: 0,
        future: 0
      };
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    console.log('Banner cache cleared');
  }

  // Clear specific cache entry
  clearCacheEntry(key) {
    this.cache.delete(key);
  }

  // Test Supabase connection
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('count')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Supabase banner connection test failed:', error);
      return false;
    }
  }

  // Fallback banners if Supabase is unavailable
  // getFallbackBanners() {
  //   console.log('Using fallback banners');
  //   return [
  //     {
  //       id: 1,
  //       title: "Flash Sale",
  //       subtitle: "Up to 70% OFF",
  //       image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop",
  //       text_color: "white",
  //       action_type: "category",
  //       action_value: "electronics",
  //       display_order: 1,
  //       is_active: true
  //     },
  //     {
  //       id: 2,
  //       title: "New Arrivals",
  //       subtitle: "Discover Latest Fashion",
  //       image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
  //       text_color: "white",
  //       action_type: "category",
  //       action_value: "fashion",
  //       display_order: 2,
  //       is_active: true
  //     },
  //     {
  //       id: 3,
  //       title: "Best Deals",
  //       subtitle: "Limited Time Offer",
  //       image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
  //       text_color: "white",
  //       action_type: "category",
  //       action_value: "home",
  //       display_order: 3,
  //       is_active: true
  //     },
  //     {
  //       id: 4,
  //       title: "Weekend Special",
  //       subtitle: "Free Shipping on All Orders",
  //       image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=400&fit=crop",
  //       text_color: "white",
  //       action_type: "category",
  //       action_value: "special",
  //       display_order: 4,
  //       is_active: true
  //     }
  //   ];
  // }

  // Search banners by title or action_value
  async searchBanners(query, limit = 10) {
    if (!query.trim()) return [];

    const cacheKey = `banner_search_${query}_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .or(`title.ilike.%${query}%,subtitle.ilike.%${query}%,action_value.ilike.%${query}%`)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(limit);

      if (error) throw error;

      const banners = this.transformBanners(data || []);
      const activeBanners = this.filterByDateRange(banners);
      
      // Cache search results for 5 minutes
      this.cache.set(cacheKey, {
        data: activeBanners,
        timestamp: Date.now()
      });

      return activeBanners;

    } catch (error) {
      console.error('Error searching banners:', error);
      return [];
    }
  }

  // Get banners by action type
  async getBannersByActionType(actionType, limit = 10) {
    const cacheKey = `banners_action_${actionType}_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('action_type', actionType)
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(limit);

      if (error) throw error;

      const banners = this.transformBanners(data || []);
      const activeBanners = this.filterByDateRange(banners);
      
      // Cache for 10 minutes
      this.cache.set(cacheKey, {
        data: activeBanners,
        timestamp: Date.now()
      });

      return activeBanners;

    } catch (error) {
      console.error('Error fetching banners by action type:', error);
      return [];
    }
  }
}

const bannerServiceInstance = new SupabaseBannerService();
export default bannerServiceInstance;