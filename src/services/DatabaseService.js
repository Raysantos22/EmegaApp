// src/services/DatabaseService.js
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

class DatabaseService {
  constructor() {
    this.db = null;
  }

  async initDatabase() {
    try {
      this.db = await SQLite.openDatabaseAsync('emega.db');
      
      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  async createTables() {
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

    // Products table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        original_price REAL,
        category_id INTEGER,
        images TEXT, -- JSON array of image URLs
        stock INTEGER DEFAULT 0,
        sku TEXT,
        brand TEXT,
        rating REAL DEFAULT 0,
        reviews_count INTEGER DEFAULT 0,
        tags TEXT, -- JSON array
        is_featured BOOLEAN DEFAULT 0,
        is_on_sale BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        autods_id TEXT, -- AutoDS product ID
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
        action_type TEXT DEFAULT 'category', -- category, product, url
        action_value TEXT, -- category_id, product_id, or URL
        background_color TEXT DEFAULT '#e53e3e',
        text_color TEXT DEFAULT '#ffffff',
        order_index INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        start_date DATETIME,
        end_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Cart table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        selected_variant TEXT, -- JSON for product variants
        user_id TEXT DEFAULT 'guest',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
    `);

    // Favorites table
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        user_id TEXT DEFAULT 'guest',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
    `);

    // Cache table for API responses
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
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
      const cached = await this.getCachedData('categories');
      if (cached) return cached;

      const categories = await this.db.getAllAsync(
        'SELECT * FROM categories WHERE is_active = 1 ORDER BY order_index, name'
      );
      
      await this.setCachedData('categories', categories, 12);
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
      
      // Clear cache
      await this.clearCache('categories');
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Create category error:', error);
      throw error;
    }
  }

  // Products
  async getProducts(filters = {}) {
    try {
      let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1';
      let params = [];

      if (filters.category_id) {
        query += ' AND p.category_id = ?';
        params.push(filters.category_id);
      }

      if (filters.is_featured) {
        query += ' AND p.is_featured = 1';
      }

      if (filters.is_on_sale) {
        query += ' AND p.is_on_sale = 1';
      }

      if (filters.search) {
        query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      query += ' ORDER BY p.created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const products = await this.db.getAllAsync(query, params);
      
      // Parse JSON fields
      return products.map(product => ({
        ...product,
        images: product.images ? JSON.parse(product.images) : [],
        tags: product.tags ? JSON.parse(product.tags) : []
      }));
    } catch (error) {
      console.error('Get products error:', error);
      return [];
    }
  }

  async getProductById(id) {
    try {
      const product = await this.db.getFirstAsync(
        'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
        [id]
      );
      
      if (product) {
        return {
          ...product,
          images: product.images ? JSON.parse(product.images) : [],
          tags: product.tags ? JSON.parse(product.tags) : []
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
          name, description, price, original_price, category_id, images, 
          stock, sku, brand, is_featured, is_on_sale, tags, autods_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.name,
        product.description,
        product.price,
        product.original_price || product.price,
        product.category_id,
        JSON.stringify(product.images || []),
        product.stock || 0,
        product.sku,
        product.brand,
        product.is_featured ? 1 : 0,
        product.is_on_sale ? 1 : 0,
        JSON.stringify(product.tags || []),
        product.autods_id
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
      const cached = await this.getCachedData('banners');
      if (cached) return cached;

      const banners = await this.db.getAllAsync(
        'SELECT * FROM banners WHERE is_active = 1 AND (start_date IS NULL OR start_date <= CURRENT_TIMESTAMP) AND (end_date IS NULL OR end_date >= CURRENT_TIMESTAMP) ORDER BY order_index'
      );
      
      await this.setCachedData('banners', banners, 6);
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
      
      await this.clearCache('banners');
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Create banner error:', error);
      throw error;
    }
  }

  // Cart operations
  async addToCart(productId, quantity = 1, userId = 'guest') {
    try {
      // Check if item already exists
      const existing = await this.db.getFirstAsync(
        'SELECT * FROM cart_items WHERE product_id = ? AND user_id = ?',
        [productId, userId]
      );

      if (existing) {
        // Update quantity
        await this.db.runAsync(
          'UPDATE cart_items SET quantity = quantity + ? WHERE id = ?',
          [quantity, existing.id]
        );
      } else {
        // Insert new item
        await this.db.runAsync(
          'INSERT INTO cart_items (product_id, quantity, user_id) VALUES (?, ?, ?)',
          [productId, quantity, userId]
        );
      }
    } catch (error) {
      console.error('Add to cart error:', error);
      throw error;
    }
  }

  async getCartItems(userId = 'guest') {
    try {
      const items = await this.db.getAllAsync(`
        SELECT ci.*, p.name, p.price, p.images, p.stock 
        FROM cart_items ci 
        JOIN products p ON ci.product_id = p.id 
        WHERE ci.user_id = ?
      `, [userId]);
      
      return items.map(item => ({
        ...item,
        images: item.images ? JSON.parse(item.images) : []
      }));
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
async updateProductFromAutoDS(autodsProduct, transformedProduct) {
  try {
    const existing = await this.db.getFirstAsync(
      'SELECT id FROM products WHERE autods_id = ?',
      [autodsProduct.id]
    );

    if (existing) {
      await this.db.runAsync(`
        UPDATE products SET 
          name = ?, price = ?, stock = ?, images = ?, 
          updated_at = CURRENT_TIMESTAMP
        WHERE autods_id = ?
      `, [
        transformedProduct.name,
        transformedProduct.price,
        transformedProduct.stock,
        JSON.stringify(transformedProduct.images),
        autodsProduct.id
      ]);
    } else {
      await this.createProduct(transformedProduct);
    }
  } catch (error) {
    console.error('Error updating product from AutoDS:', error);
    throw error;
  }
}
async upsertAutodsProduct(product) {
  try {
    // Check if product exists by autods_id
    const existing = await this.db.getFirstAsync(
      'SELECT id FROM products WHERE autods_id = ?',
      [product.autods_id]
    );

    if (existing) {
      // Update existing product
      await this.db.runAsync(`
        UPDATE products SET 
          name = ?, price = ?, stock = ?, images = ?, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE autods_id = ?
      `, [
        product.name,
        product.price,
        product.stock,
        JSON.stringify(product.images),
        product.autods_id
      ]);
      return existing.id;
    } else {
      // Create new product
      return await this.createProduct(product);
    }
  } catch (error) {
    console.error('Upsert AutoDS product error:', error);
    throw error;
  }
}
  // Initialize sample data (for development)
  async initSampleData() {
    try {
      // Check if data already exists
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

      // Sample banners
      const banners = [
        {
          title: 'CYBER LINIO',
          subtitle: '40% DSCNT in technology',
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
          action_type: 'category',
          action_value: '1',
          background_color: '#8E24AA'
        }
      ];

      for (let banner of banners) {
        await this.createBanner(banner);
      }

      // Sample products
      const products = [
        {
          name: 'MacBook Air M1',
          description: 'Apple MacBook Air 13-inch with M1 chip',
          price: 29999,
          category_id: 1,
          images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600'],
          stock: 10,
          brand: 'Apple',
          is_featured: true
        },
        {
          name: 'Sony WH/1000XM5',
          description: 'Premium wireless noise canceling headphones',
          price: 4999,
          category_id: 1,
          images: ['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600'],
          stock: 25,
          brand: 'Sony'
        },
        {
          name: 'FreeBuds Huawei',
          description: 'Wireless earbuds with active noise cancellation',
          price: 1999,
          category_id: 1,
          images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600'],
          stock: 50,
          brand: 'Huawei'
        }
      ];

     for (let product of products) {
        await this.createProduct(product);
      }

    } catch (error) {
      console.error('Init sample data error:', error);
    }
  } // ADD THIS CLOSING BRACE

  // Add pagination method AFTER the closing brace
  async getProductsPaginated(page = 1, limit = 20, filters = {}) {
    const offset = (page - 1) * limit;
    
    let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1';
    let params = [];

    if (filters.category_id) {
      query += ' AND p.category_id = ?';
      params.push(filters.category_id);
    }

    if (filters.search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const products = await this.db.getAllAsync(query, params);
    
    return products.map(product => ({
      ...product,
      images: product.images ? JSON.parse(product.images) : [],
      tags: product.tags ? JSON.parse(product.tags) : []
    }));
  }
}

export default new DatabaseService();