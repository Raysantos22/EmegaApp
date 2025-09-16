// src/services/SupabaseService.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://msbqgxjbsxztcnkxziju.supabase.co'
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zYnFneGpic3h6dGNua3h6aWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMzA5ODgsImV4cCI6MjA3MzYwNjk4OH0.JkMIH03-rWdllFLTTuTzbGk_m-v9C47kNqUZLOA2VdI'

class SupabaseService {
  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey)
  }

  // Transform Supabase product to match your mobile app format
  transformProduct(supabaseProduct) {
    return {
      id: supabaseProduct.autods_id, // Using autods_id as main ID for consistency
      autods_id: supabaseProduct.autods_id,
      name: supabaseProduct.title,
      title: supabaseProduct.title,
      description: supabaseProduct.description,
      price: parseFloat(supabaseProduct.price) || 0,
      original_price: parseFloat(supabaseProduct.price) || 0,
      shipping_price: parseFloat(supabaseProduct.shipping_price) || 0,
      stock: supabaseProduct.quantity || 0,
      quantity: supabaseProduct.quantity || 0,
      sku: supabaseProduct.sku,
      status: supabaseProduct.status,
      site_id: supabaseProduct.site_id,
      
      // Images handling
      images: Array.isArray(supabaseProduct.images) ? supabaseProduct.images : [],
      main_picture_url: supabaseProduct.main_picture_url,
      
      // Sales data
      sold_count: supabaseProduct.sold_count || 0,
      total_profit: parseFloat(supabaseProduct.total_profit) || 0,
      
      // Supplier info
      supplier_url: supabaseProduct.supplier_url,
      supplier_title: supabaseProduct.supplier_title,
      supplier_price: parseFloat(supabaseProduct.supplier_price) || 0,
      
      // Categories and tags
      tags: Array.isArray(supabaseProduct.tags) ? supabaseProduct.tags : [],
      item_specifics: supabaseProduct.item_specifics || {},
      
      // Dates
      created_at: supabaseProduct.created_date,
      modified_at: supabaseProduct.modified_at,
      updated_at: supabaseProduct.modified_at,
      
      // App-specific fields
      is_featured: Math.random() > 0.8, // Randomly mark some as featured
      is_on_sale: supabaseProduct.total_profit > 0,
      rating: 4 + Math.random(), // Random rating between 4-5
      reviews_count: Math.floor(Math.random() * 100),
      freeShipping: supabaseProduct.shipping_price === 0
    }
  }

  // Get products with filters and pagination
  async getProducts(filters = {}) {
    try {
      let query = this.supabase
        .from('products')
        .select('*')
        .eq('status', 2) // Only active products

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters.site_id) {
        query = query.eq('site_id', filters.site_id)
      }

      if (filters.min_price) {
        query = query.gte('price', filters.min_price)
      }

      if (filters.max_price) {
        query = query.lte('price', filters.max_price)
      }

      // Sorting
      const sortBy = filters.sort_by || 'modified_at'
      const sortOrder = filters.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      // Pagination
      if (filters.page && filters.limit) {
        const from = (filters.page - 1) * filters.limit
        const to = from + filters.limit - 1
        query = query.range(from, to)
      } else if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      const transformedProducts = data ? data.map(product => this.transformProduct(product)) : []

      return {
        products: transformedProducts,
        count: count,
        page: filters.page || 1,
        limit: filters.limit || data?.length || 0
      }

    } catch (error) {
      console.error('Error fetching products from Supabase:', error)
      throw new Error(`Failed to fetch products: ${error.message}`)
    }
  }

  // Get single product by AutoDS ID
  async getProductById(autodsId) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('autods_id', autodsId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Product not found
        }
        throw error
      }

      return this.transformProduct(data)

    } catch (error) {
      console.error('Error fetching product by ID:', error)
      throw new Error(`Failed to fetch product: ${error.message}`)
    }
  }

  // Get featured products
  async getFeaturedProducts(limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('status', 2)
        .gt('total_profit', 0) // Products with profit as "featured"
        .order('total_profit', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data ? data.map(product => this.transformProduct(product)) : []

    } catch (error) {
      console.error('Error fetching featured products:', error)
      return []
    }
  }

  // Get products on sale (with profit)
  async getSaleProducts(limit = 10) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('status', 2)
        .gt('total_profit', 5) // Products with good profit margin
        .order('total_profit', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data ? data.map(product => this.transformProduct(product)) : []

    } catch (error) {
      console.error('Error fetching sale products:', error)
      return []
    }
  }

  // Get recently added products
  async getRecentProducts(limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('status', 2)
        .order('modified_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data ? data.map(product => this.transformProduct(product)) : []

    } catch (error) {
      console.error('Error fetching recent products:', error)
      return []
    }
  }

  // Search products
  async searchProducts(query, filters = {}) {
    const searchFilters = {
      ...filters,
      search: query,
      limit: filters.limit || 50
    }

    return this.getProducts(searchFilters)
  }

  // Get product statistics
  async getProductStats() {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('status')

      if (error) throw error

      const stats = {
        total: data.length,
        active: data.filter(p => p.status === 2).length,
        inactive: data.filter(p => p.status !== 2).length
      }

      return stats

    } catch (error) {
      console.error('Error fetching product stats:', error)
      return { total: 0, active: 0, inactive: 0 }
    }
  }

  // Check connection to Supabase
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('count')
        .limit(1)

      return !error
    } catch (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }
  }
}

export default new SupabaseService()