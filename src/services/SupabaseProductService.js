// src/services/SupabaseProductService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://msbqgxjbsxztcnkxziju.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYnFneGpic3h6dGNua3h6aWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzA5ODgsImV4cCI6MjA3MzYwNjk4OH0.JkMIH03-rWdllFLTTuTzbGk_m-v9C47kNqUZLOA2VdI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

class SupabaseProductService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  // Get products with pagination and smart filtering
  async getProducts(params = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      sortBy = 'modified_at',
      sortOrder = 'desc',
      minPrice = 0,
      maxPrice = 1000000,
      hasStock = true
    } = params;

    const cacheKey = `products_${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
    //   console.log('Querying Supabase products table directly...');
      
      // Query the main products table instead of mobile_products view
      let query = supabase
        .from('products')
        .select(`
          autods_id,
          sku,
          title,
          main_picture_url,
          price,
          shipping_price,
          quantity,
          tags,
          status,
          sold_count,
          modified_at
        `, { count: 'exact' })
        .eq('status', 2); // Only active products

      // Apply search filter
      if (search.trim()) {
        query = query.or(`title.ilike.%${search}%,sku.ilike.%${search}%`);
      }

      // Apply price filters
      if (minPrice > 0) {
        query = query.gte('price', minPrice);
      }
      if (maxPrice < 1000000) {
        query = query.lte('price', maxPrice);
      }

      // Apply stock filter
      if (hasStock) {
        query = query.gt('quantity', 0);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        throw error;
      }

    //   console.log(`Found ${data?.length || 0} products out of ${count} total`);

      // Transform the data to ensure proper format
      const transformedData = (data || []).map(product => ({
        ...product,
        // Parse JSON fields safely
        images: this.safeJsonParse(product.images, []),
        tags: this.safeJsonParse(product.tags, []),
        // Ensure numeric fields
        price: parseFloat(product.price) || 0,
        shipping_price: parseFloat(product.shipping_price) || 0,
        quantity: parseInt(product.quantity) || 0,
        sold_count: parseInt(product.sold_count) || 0
      }));

      const result = {
        products: transformedData,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
          hasMore: (page * limit) < (count || 0)
        }
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        products: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0, hasMore: false }
      };
    }
  }

  // Get featured/popular products for home screen
  async getFeaturedProducts(limit = 10) {
    const cacheKey = `featured_products_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      console.log('Fetching featured products - trying without filters first...');
      
      // Try without any filters first to see if we get ANY data
      const { data, error } = await supabase
        .from('products')
        .select(`
          autods_id,
          sku,
          title,
          main_picture_url,
          price,
          shipping_price,
          quantity,
          tags,
          status,
          sold_count,
          modified_at
        `)
        .limit(limit);

      if (error) {
        console.error('Featured products error:', error);
        throw error;
      }

      // console.log(`Raw featured products data:`, data);

      const products = (data || []).map(product => ({
        ...product,
        images: this.safeJsonParse(product.images, []),
        tags: this.safeJsonParse(product.tags, []),
        price: parseFloat(product.price) || 0,
        shipping_price: parseFloat(product.shipping_price) || 0,
        quantity: parseInt(product.quantity) || 0,
        sold_count: parseInt(product.sold_count) || 0
      }));
      
      console.log(`Processed ${products.length} featured products`);
      
      // Cache for 10 minutes
      this.cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      return products;

    } catch (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }
  }

  // Get hot sales (products with good profit margins)
  async getHotSales(limit = 10) {
    const cacheKey = `hot_sales_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      console.log('Fetching hot sales from main products table...');
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          autods_id,
          sku,
          title,
          main_picture_url,
          price,
          shipping_price,
          quantity,
          tags,
          sold_count,
          total_profit,
          modified_at
        `)
        .eq('status', 2) // Active products
        .gt('quantity', 0) // In stock
        .gt('total_profit', 0) // Has profit
        .order('total_profit', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Hot sales error:', error);
        throw error;
      }

      const products = (data || []).map(product => ({
        ...product,
        images: this.safeJsonParse(product.images, []),
        tags: this.safeJsonParse(product.tags, []),
        price: parseFloat(product.price) || 0,
        shipping_price: parseFloat(product.shipping_price) || 0,
        quantity: parseInt(product.quantity) || 0,
        sold_count: parseInt(product.sold_count) || 0,
        total_profit: parseFloat(product.total_profit) || 0
      }));
      
      console.log(`Found ${products.length} hot sales products`);
      
      // Cache for 10 minutes
      this.cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      return products;

    } catch (error) {
      console.error('Error fetching hot sales:', error);
      return [];
    }
  }

  // Get product details by autods_id
  async getProductDetails(autodsId) {
    const cacheKey = `product_${autodsId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('autods_id', autodsId)
        .eq('status', 2) // Active only
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Product not found
        }
        throw error;
      }

      // Parse JSON fields
      const product = {
        ...data,
        images: data.images || [],
        tags: data.tags || [],
        item_specifics: data.item_specifics || {}
      };

      // Cache for 15 minutes
      this.cache.set(cacheKey, {
        data: product,
        timestamp: Date.now()
      });

      return product;

    } catch (error) {
      console.error('Error fetching product details:', error);
      return null;
    }
  }

  // Search products with autocomplete suggestions
  async searchProducts(query, limit = 20) {
    if (!query.trim()) return [];

    const cacheKey = `search_${query}_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('mobile_products')
        .select('*')
        .or(`title.ilike.%${query}%,sku.ilike.%${query}%`)
        .gt('quantity', 0) // In stock
        .order('sold_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const products = data || [];
      
      // Cache search results for 2 minutes
      this.cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      return products;

    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  // Get search suggestions (product titles)
  async getSearchSuggestions(query, limit = 5) {
    if (!query.trim() || query.length < 2) return [];

    try {
      const { data, error } = await supabase
        .from('mobile_products')
        .select('title')
        .ilike('title', `%${query}%`)
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => item.title);

    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  }

  // Get products by category (using tags)
  async getProductsByTag(tag, limit = 20) {
    const cacheKey = `tag_${tag}_${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          autods_id,
          sku,
          title,
          main_picture_url,
          price,
          shipping_price,
          quantity,
          tags,
          sold_count,
          modified_at
        `)
        .eq('status', 2)
        .contains('tags', [tag])
        .gt('quantity', 0)
        .order('sold_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const products = data || [];
      
      // Cache for 10 minutes
      this.cache.set(cacheKey, {
        data: products,
        timestamp: Date.now()
      });

      return products;

    } catch (error) {
      console.error('Error fetching products by tag:', error);
      return [];
    }
  }

  // Get product statistics for dashboard
  async getProductStats() {
    const cacheKey = 'product_stats';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < (30 * 60 * 1000)) { // 30 min cache
      return cached.data;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_product_stats'); // You'll need to create this RPC function

      if (error) throw error;

      const stats = data || {
        total_products: 0,
        active_products: 0,
        in_stock_products: 0,
        avg_price: 0
      };

      this.cache.set(cacheKey, {
        data: stats,
        timestamp: Date.now()
      });

      return stats;

    } catch (error) {
      console.error('Error fetching product stats:', error);
      return {
        total_products: 0,
        active_products: 0,
        in_stock_products: 0,
        avg_price: 0
      };
    }
  }

  // Store recently viewed products locally
  async addToRecentlyViewed(product) {
    try {
      const recentKey = 'recently_viewed_products';
      const existing = await AsyncStorage.getItem(recentKey);
      let recentProducts = existing ? JSON.parse(existing) : [];

      // Remove if already exists
      recentProducts = recentProducts.filter(p => p.autods_id !== product.autods_id);

      // Add to beginning
      recentProducts.unshift({
        autods_id: product.autods_id,
        title: product.title,
        main_picture_url: product.main_picture_url,
        price: product.price,
        viewed_at: new Date().toISOString()
      });

      // Keep only last 20
      recentProducts = recentProducts.slice(0, 20);

      await AsyncStorage.setItem(recentKey, JSON.stringify(recentProducts));
    } catch (error) {
      console.error('Error adding to recently viewed:', error);
    }
  }

  // Get recently viewed products
  async getRecentlyViewed(limit = 10) {
    try {
      const recentKey = 'recently_viewed_products';
      const existing = await AsyncStorage.getItem(recentKey);
      const recentProducts = existing ? JSON.parse(existing) : [];
      
      return recentProducts.slice(0, limit);
    } catch (error) {
      console.error('Error getting recently viewed:', error);
      return [];
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Clear specific cache entry
  clearCacheEntry(key) {
    this.cache.delete(key);
  }

  // Safe JSON parsing helper
  safeJsonParse(jsonString, defaultValue) {
    try {
      if (!jsonString) return defaultValue;
      if (typeof jsonString === 'object') return jsonString; // Already parsed
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn('JSON parse error:', error);
      return defaultValue;
    }
  }
}

const productServiceInstance = new SupabaseProductService();
export default productServiceInstance;


// -- Enable RLS
// ALTER TABLE products ENABLE ROW LEVEL SECURITY;

// -- Create policy to allow anonymous read access
// CREATE POLICY "Allow anonymous read access" ON products
// FOR SELECT
// TO anon
// USING (true);

// -- Create policy for authenticated users  
// CREATE POLICY "Allow authenticated read access" ON products
// FOR SELECT  
// TO authenticated
// USING (true);