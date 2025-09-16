// src/services/SupabaseService.js
import { createClient } from '@supabase/supabase-js';
import DatabaseService from './DatabaseService';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

class SupabaseService {
  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.isInitialized = false;
  }

  async init() {
    if (!this.isInitialized) {
      console.log('Initializing Supabase service...');
      this.isInitialized = true;
    }
  }

  // Categories
  async syncCategories() {
    try {
      const { data, error } = await this.supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;

      // Clear local cache and update local database
      await DatabaseService.clearCache('categories');
      
      // Update local SQLite database
      for (const category of data) {
        await this.upsertLocalCategory(category);
      }

      return data;
    } catch (error) {
      console.error('Sync categories error:', error);
      // Fallback to local data
      return await DatabaseService.getCategories();
    }
  }

  async upsertLocalCategory(category) {
    try {
      // Check if category exists locally
      const existing = await DatabaseService.db.getFirstAsync(
        'SELECT id FROM categories WHERE id = ?',
        [category.id]
      );

      if (existing) {
        // Update existing
        await DatabaseService.db.runAsync(
          'UPDATE categories SET name = ?, image = ?, icon = ?, color = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [category.name, category.image, category.icon, category.color, category.order_index, category.id]
        );
      } else {
        // Insert new
        await DatabaseService.db.runAsync(
          'INSERT INTO categories (id, name, image, icon, color, order_index) VALUES (?, ?, ?, ?, ?, ?)',
          [category.id, category.name, category.image, category.icon, category.color, category.order_index]
        );
      }
    } catch (error) {
      console.error('Upsert local category error:', error);
    }
  }

  // Products
  async syncProducts(categoryId = null, limit = 50) {
    try {
      let query = this.supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Update local SQLite database
      for (const product of data) {
        await this.upsertLocalProduct(product);
      }

      return data;
    } catch (error) {
      console.error('Sync products error:', error);
      // Fallback to local data
      return await DatabaseService.getProducts({ category_id: categoryId, limit });
    }
  }

  async upsertLocalProduct(product) {
    try {
      const existing = await DatabaseService.db.getFirstAsync(
        'SELECT id FROM products WHERE id = ?',
        [product.id]
      );

      if (existing) {
        // Update existing
        await DatabaseService.db.runAsync(`
          UPDATE products SET 
            name = ?, description = ?, price = ?, original_price = ?, 
            category_id = ?, images = ?, stock = ?, sku = ?, brand = ?, 
            rating = ?, reviews_count = ?, tags = ?, is_featured = ?, 
            is_on_sale = ?, autods_id = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [
          product.name, product.description, product.price, product.original_price,
          product.category_id, JSON.stringify(product.images), product.stock, 
          product.sku, product.brand, product.rating, product.reviews_count,
          JSON.stringify(product.tags), product.is_featured, product.is_on_sale,
          product.autods_id, product.id
        ]);
      } else {
        // Insert new
        await DatabaseService.db.runAsync(`
          INSERT INTO products (
            id, name, description, price, original_price, category_id, images, 
            stock, sku, brand, rating, reviews_count, tags, is_featured, 
            is_on_sale, autods_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          product.id, product.name, product.description, product.price, 
          product.original_price, product.category_id, JSON.stringify(product.images),
          product.stock, product.sku, product.brand, product.rating, 
          product.reviews_count, JSON.stringify(product.tags), product.is_featured,
          product.is_on_sale, product.autods_id
        ]);
      }
    } catch (error) {
      console.error('Upsert local product error:', error);
    }
  }

  // Banners
  async syncBanners() {
    try {
      const { data, error } = await this.supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;

      await DatabaseService.clearCache('banners');

      for (const banner of data) {
        await this.upsertLocalBanner(banner);
      }

      return data;
    } catch (error) {
      console.error('Sync banners error:', error);
      return await DatabaseService.getBanners();
    }
  }

  async upsertLocalBanner(banner) {
    try {
      const existing = await DatabaseService.db.getFirstAsync(
        'SELECT id FROM banners WHERE id = ?',
        [banner.id]
      );

      if (existing) {
        await DatabaseService.db.runAsync(
          'UPDATE banners SET title = ?, subtitle = ?, image = ?, action_type = ?, action_value = ?, background_color = ?, text_color = ?, order_index = ? WHERE id = ?',
          [banner.title, banner.subtitle, banner.image, banner.action_type, banner.action_value, banner.background_color, banner.text_color, banner.order_index, banner.id]
        );
      } else {
        await DatabaseService.db.runAsync(
          'INSERT INTO banners (id, title, subtitle, image, action_type, action_value, background_color, text_color, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [banner.id, banner.title, banner.subtitle, banner.image, banner.action_type, banner.action_value, banner.background_color, banner.text_color, banner.order_index]
        );
      }
    } catch (error) {
      console.error('Upsert local banner error:', error);
    }
  }

  // Orders
  async createOrder(orderData) {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .insert([orderData])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error) {
      console.error('Create order error:', error);
      return { success: false, error: error.message };
    }
  }

  // User Authentication
  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  // Real-time subscriptions
  subscribeToProducts(callback) {
    return this.supabase
      .channel('products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, callback)
      .subscribe();
  }

  subscribeToCategories(callback) {
    return this.supabase
      .channel('categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, callback)
      .subscribe();
  }

  // Periodic sync
  async performFullSync() {
    try {
      console.log('Starting full sync...');
      
      await Promise.all([
        this.syncCategories(),
        this.syncBanners(),
        this.syncProducts(),
      ]);

      console.log('Full sync completed');
      return { success: true };
    } catch (error) {
      console.error('Full sync error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new SupabaseService();