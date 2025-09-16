// src/services/DatabaseService.js - With migration support
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbVersion = 2; // Increment this when you change schema
  }

  async initDatabase() {
    try {
      this.db = await SQLite.openDatabaseAsync('emega.db');
      
      // Check if we need to migrate/reset database
      await this.handleDatabaseMigration();
      
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  async handleDatabaseMigration() {
    try {
      const currentVersion = await AsyncStorage.getItem('database_version');
      
      if (currentVersion === null || parseInt(currentVersion) < this.dbVersion) {
        console.log('Database schema outdated, resetting database...');
        
        // Drop all existing tables
        await this.resetDatabase();
        
        // Update version
        await AsyncStorage.setItem('database_version', this.dbVersion.toString());
        console.log(`Database reset to version ${this.dbVersion}`);
      }
    } catch (error) {
      console.error('Migration error:', error);
      // If migration fails, try to reset completely
      await this.resetDatabase();
      await AsyncStorage.setItem('database_version', this.dbVersion.toString());
    }
  }

  async resetDatabase() {
    try {
      // Drop all tables if they exist
      const tables = ['products', 'categories', 'banners', 'cart_items', 'favorites', 'cache'];
      
      for (const table of tables) {
        await this.db.execAsync(`DROP TABLE IF EXISTS ${table}`);
      }
      
      console.log('All tables dropped successfully');
    } catch (error) {
      console.error('Reset database error:', error);
    }
  }

  async createTables() {
    try {
      // Categories table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          image TEXT,
          icon TEXT,
          color TEXT DEFAULT '#e53e3e',
          order_index INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Products table - Comprehensive schema
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          autods_id TEXT UNIQUE,
          sku TEXT,
          title TEXT NOT NULL,
          description TEXT,
          price REAL DEFAULT 0,
          original_price REAL,
          shipping_price REAL DEFAULT 0,
          quantity INTEGER DEFAULT 0,
          main_picture_url TEXT,
          images TEXT DEFAULT '[]',
          tags TEXT DEFAULT '[]',
          status INTEGER DEFAULT 2,
          sold_count INTEGER DEFAULT 0,
          total_profit REAL DEFAULT 0,
          supplier_title TEXT,
          supplier_url TEXT,
          supplier_price REAL DEFAULT 0,
          item_specifics TEXT DEFAULT '{}',
          created_date DATETIME,
          modified_at DATETIME,
          synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          raw_data TEXT,
          category_id INTEGER,
          brand TEXT,
          rating REAL DEFAULT 0,
          reviews_count INTEGER DEFAULT 0,
          is_featured BOOLEAN DEFAULT 0,
          is_on_sale BOOLEAN DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        );
      `);

      // Banners table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS banners (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT,
          subtitle TEXT,
          image TEXT NOT NULL,
          action_type TEXT DEFAULT 'category',
          action_value TEXT,
          background_color TEXT DEFAULT '#e53e3e',
          text_color TEXT DEFAULT '#ffffff',
          order_index INTEGER DEFAULT 0,
          is_active BOOLEAN DEFAULT 1,
          start_date DATETIME,
          end_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Cart table - Fixed schema
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS cart_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          autods_id TEXT NOT NULL,
          product_name TEXT NOT NULL,
          price REAL NOT NULL,
          shipping_price REAL DEFAULT 0,
          image_url TEXT,
          quantity INTEGER NOT NULL DEFAULT 1,
          max_quantity INTEGER DEFAULT 999,
          selected_variant TEXT,
          user_id TEXT DEFAULT 'guest',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Favorites table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          autods_id TEXT NOT NULL,
          product_name TEXT,
          user_id TEXT DEFAULT 'guest',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Cache table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS cache (
          key TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_products_autods_id ON products(autods_id);
        CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
        CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
        CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
        CREATE INDEX IF NOT EXISTS idx_products_sale ON products(is_on_sale);
        CREATE INDEX IF NOT EXISTS idx_cart_autods_id ON cart_items(autods_id);
        CREATE INDEX IF NOT EXISTS idx_favorites_autods_id ON favorites(autods_id);
      `);

      console.log('All tables created successfully');
    } catch (error) {
      console.error('Create tables error:', error);
      throw error;
    }
  }

  // Cache management
  async getCachedData(key) {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT data FROM cache WHERE key = ? AND expires_at > CURRENT_TIMESTAMP',
        [key]
      );
      return result ? JSON.parse(result.data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setCachedData(key, data, expirationHours = 24) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expirationHours);
      
      await this.db.runAsync(
        'INSERT OR REPLACE INTO cache (key, data, expires_at) VALUES (?, ?, ?)',
        [key, JSON.stringify(data), expiresAt.toISOString()]
      );
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Categories
  async getCategories() {
    try {
      const categories = await this.db.getAllAsync(
        'SELECT * FROM categories WHERE is_active = 1 ORDER BY order_index, name'
      );
      
      return categories;
    } catch (error) {
      console.error('Get categories error:', error);
      return [];
    }
  }

  async createCategory(category) {
    try {
      const result = await this.db.runAsync(
        'INSERT INTO categories (name, image, icon, color, order_index) VALUES (?, ?, ?, ?, ?)',
        [category.name, category.image, category.icon, category.color, category.order_index || 0]
      );
      
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  }

  // Products
  async getProducts(filters = {}) {
    try {
      let query = 'SELECT * FROM products WHERE is_active = 1';
      let params = [];

      if (filters.category_id) {
        query += ' AND category_id = ?';
        params.push(filters.category_id);
      }

      if (filters.is_featured) {
        query += ' AND is_featured = 1';
      }

      if (filters.is_on_sale) {
        query += ' AND is_on_sale = 1';
      }

      if (filters.search) {
        query += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const products = await this.db.getAllAsync(query, params);
      
      // Parse JSON fields safely
      return products.map(product => ({
        ...product,
        images: this.safeJsonParse(product.images, []),
        tags: this.safeJsonParse(product.tags, []),
        item_specifics: this.safeJsonParse(product.item_specifics, {})
      }));
    } catch (error) {
      console.error('Get products error:', error);
      return [];
    }
  }

  async getProductById(id) {
    try {
      const product = await this.db.getFirstAsync(
        'SELECT * FROM products WHERE autods_id = ? OR id = ?',
        [id, id]
      );
      
      if (product) {
        return {
          ...product,
          images: this.safeJsonParse(product.images, []),
          tags: this.safeJsonParse(product.tags, []),
          item_specifics: this.safeJsonParse(product.item_specifics, {})
        };
      }
      return null;
    } catch (error) {
      console.error('Get product by ID error:', error);
      return null;
    }
  }

  async createProduct(product) {
    try {
      const result = await this.db.runAsync(`
        INSERT INTO products (
          autods_id, title, description, price, original_price, category_id, 
          images, quantity, sku, brand, is_featured, is_on_sale, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.autods_id,
        product.title || product.name,
        product.description,
        product.price,
        product.original_price || product.price,
        product.category_id,
        JSON.stringify(product.images || []),
        product.quantity || 0,
        product.sku,
        product.brand,
        product.is_featured ? 1 : 0,
        product.is_on_sale ? 1 : 0,
        JSON.stringify(product.tags || [])
      ]);
      
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Create product error:', error);
      throw error;
    }
  }

  // Banners
  async getBanners() {
    try {
      const banners = await this.db.getAllAsync(
        'SELECT * FROM banners WHERE is_active = 1 ORDER BY order_index'
      );
      
      return banners;
    } catch (error) {
      console.error('Get banners error:', error);
      return [];
    }
  }

  async createBanner(banner) {
    try {
      const result = await this.db.runAsync(
        'INSERT INTO banners (title, subtitle, image, action_type, action_value, background_color, text_color, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          banner.title,
          banner.subtitle,
          banner.image,
          banner.action_type || 'category',
          banner.action_value,
          banner.background_color || '#e53e3e',
          banner.text_color || '#ffffff',
          banner.order_index || 0
        ]
      );
      
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Create banner error:', error);
      throw error;
    }
  }

  // Cart operations
  async addToCart(item) {
    try {
      const { id: autods_id, name, price, image, quantity, maxQuantity, shippingPrice } = item;

      const existing = await this.db.getFirstAsync(
        'SELECT * FROM cart_items WHERE autods_id = ? AND user_id = ?',
        [autods_id, 'guest']
      );

      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantity, maxQuantity || 999);
        await this.db.runAsync(
          'UPDATE cart_items SET quantity = ? WHERE id = ?',
          [newQuantity, existing.id]
        );
      } else {
        await this.db.runAsync(`
          INSERT INTO cart_items (
            autods_id, product_name, price, shipping_price, 
            image_url, quantity, max_quantity, user_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          autods_id, name, price, shippingPrice || 0, 
          image, quantity, maxQuantity || 999, 'guest'
        ]);
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  }

  async getCartItems(userId = 'guest') {
    try {
      const items = await this.db.getAllAsync(`
        SELECT * FROM cart_items WHERE user_id = ?
      `, [userId]);
      
      return items;
    } catch (error) {
      console.error('Get cart items error:', error);
      return [];
    }
  }

  async updateCartItemQuantity(itemId, quantity) {
    try {
      if (quantity <= 0) {
        await this.db.runAsync('DELETE FROM cart_items WHERE id = ?', [itemId]);
      } else {
        await this.db.runAsync(
          'UPDATE cart_items SET quantity = ? WHERE id = ?',
          [quantity, itemId]
        );
      }
    } catch (error) {
      console.error('Update cart item error:', error);
      throw error;
    }
  }

  async clearCart(userId = 'guest') {
    try {
      await this.db.runAsync('DELETE FROM cart_items WHERE user_id = ?', [userId]);
    } catch (error) {
      console.error('Clear cart error:', error);
      throw error;
    }
  }

  // Utility methods
  safeJsonParse(jsonString, defaultValue) {
    try {
      return jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  async clearCache(key = null) {
    try {
      if (key) {
        await this.db.runAsync('DELETE FROM cache WHERE key = ?', [key]);
      } else {
        await this.db.runAsync('DELETE FROM cache WHERE expires_at < CURRENT_TIMESTAMP');
      }
    } catch (error) {
      console.error('Clear cache error:', error);
    }
  }

  // Sync products from external source
  async upsertProductFromSupabase(productData) {
    try {
      const existing = await this.db.getFirstAsync(
        'SELECT id FROM products WHERE autods_id = ?',
        [productData.autods_id]
      );

      const values = [
        productData.autods_id,
        productData.sku,
        productData.title,
        productData.description,
        parseFloat(productData.price) || 0,
        parseFloat(productData.original_price || productData.price) || 0,
        parseFloat(productData.shipping_price) || 0,
        parseInt(productData.quantity) || 0,
        productData.main_picture_url,
        JSON.stringify(productData.images || []),
        JSON.stringify(productData.tags || []),
        parseInt(productData.status) || 2,
        parseInt(productData.sold_count) || 0,
        parseFloat(productData.total_profit) || 0,
        productData.supplier_title,
        productData.supplier_url,
        parseFloat(productData.supplier_price) || 0,
        JSON.stringify(productData.item_specifics || {}),
        productData.created_date,
        productData.modified_at,
        JSON.stringify(productData.raw_data || productData),
        productData.category_id || 1,
        productData.brand,
        parseFloat(productData.rating) || 0,
        parseInt(productData.reviews_count) || 0,
        productData.is_featured ? 1 : 0,
        productData.is_on_sale ? 1 : 0
      ];

      if (existing) {
        await this.db.runAsync(`
          UPDATE products SET 
            sku = ?, title = ?, description = ?, price = ?, original_price = ?,
            shipping_price = ?, quantity = ?, main_picture_url = ?, images = ?, 
            tags = ?, status = ?, sold_count = ?, total_profit = ?, 
            supplier_title = ?, supplier_url = ?, supplier_price = ?, 
            item_specifics = ?, created_date = ?, modified_at = ?, raw_data = ?,
            category_id = ?, brand = ?, rating = ?, reviews_count = ?,
            is_featured = ?, is_on_sale = ?, updated_at = CURRENT_TIMESTAMP
          WHERE autods_id = ?
        `, [...values.slice(1), productData.autods_id]);
        
        return existing.id;
      } else {
        const result = await this.db.runAsync(`
          INSERT INTO products (
            autods_id, sku, title, description, price, original_price,
            shipping_price, quantity, main_picture_url, images, tags, status,
            sold_count, total_profit, supplier_title, supplier_url, 
            supplier_price, item_specifics, created_date, modified_at, raw_data,
            category_id, brand, rating, reviews_count, is_featured, is_on_sale
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, values);
        
        return result.lastInsertRowId;
      }
    } catch (error) {
      console.error('Upsert product error:', error);
      throw error;
    }
  }

  // Initialize sample data
  async initSampleData() {
    try {
      const existingCategories = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM categories');
      if (existingCategories.count > 0) return;

      // Sample categories
      const categories = [
        { name: 'Technology', icon: 'laptop-outline', color: '#2196F3' },
        { name: 'Fashion', icon: 'shirt-outline', color: '#E91E63' },
        { name: 'Sports', icon: 'basketball-outline', color: '#FF9800' },
        { name: 'Supermarket', icon: 'storefront-outline', color: '#4CAF50' }
      ];

      for (let i = 0; i < categories.length; i++) {
        await this.createCategory({ ...categories[i], order_index: i });
      }

      // Sample banner
      await this.createBanner({
        title: 'CYBER SALE',
        subtitle: '40% OFF Technology',
        image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        action_type: 'category',
        action_value: '1',
        background_color: '#8E24AA'
      });

      // Sample products
      const products = [
        {
          autods_id: '1',
          title: 'MacBook Air M1',
          description: 'Apple MacBook Air 13-inch with M1 chip',
          price: 29999,
          category_id: 1,
          images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600'],
          quantity: 10,
          brand: 'Apple',
          is_featured: true
        },
        {
          autods_id: '2',
          title: 'Sony WH-1000XM5',
          description: 'Premium wireless noise canceling headphones',
          price: 4999,
          category_id: 1,
          images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600'],
          quantity: 25,
          brand: 'Sony'
        },
        {
          autods_id: '3',
          title: 'FreeBuds Huawei',
          description: 'Wireless earbuds with active noise cancellation',
          price: 1999,
          category_id: 1,
          images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'],
          quantity: 50,
          brand: 'Huawei'
        }
      ];

      for (let product of products) {
        await this.createProduct(product);
      }

      console.log('Sample data initialized');
    } catch (error) {
      console.error('Init sample data error:', error);
    }
  }
}

export default new DatabaseService();