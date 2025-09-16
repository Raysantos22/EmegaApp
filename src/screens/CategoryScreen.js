// src/screens/CategoryScreen.js - Updated to use Supabase
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { Searchbar, Chip, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { FlatGrid } from 'react-native-super-grid';
import { useFocusEffect } from '@react-navigation/native';

import DatabaseService from '../services/DatabaseService';
import SupabaseProductService from '../services/SupabaseProductService';
import ProductCard from '../components/ProductCard';

const { width } = Dimensions.get('window');

export default function CategoryScreen({ navigation, route }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'modified_at',
    sortOrder: 'desc',
    priceRange: 'all',
    inStock: false,
  });

  // Handle route params
  const { categoryId, filter } = route.params || {};

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      if (categoryId) {
        setSelectedCategory(categoryId);
      }
      if (filter) {
        loadProductsByFilter(filter);
      } else {
        loadProducts();
      }
    }, [categoryId, filter])
  );

  const loadCategories = async () => {
    try {
      const categoriesData = await DatabaseService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Use SupabaseProductService instead of DatabaseService
      const result = await SupabaseProductService.getProducts({
        page: 1,
        limit: 100, // Load more items for categories
        search: searchQuery.trim() || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        hasStock: filters.inStock
      });

      let productsData = result.products || [];
      
      // Apply local filters that aren't handled by Supabase
      productsData = applyLocalFilters(productsData);
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadProductsByFilter = async (filterType) => {
    try {
      setLoading(true);
      let products = [];
      
      if (filterType === 'featured') {
        products = await SupabaseProductService.getFeaturedProducts(50);
      } else if (filterType === 'on_sale') {
        products = await SupabaseProductService.getHotSales(50);
      } else {
        const result = await SupabaseProductService.getProducts({ 
          page: 1, 
          limit: 100 
        });
        products = result.products || [];
      }

      setProducts(products);
    } catch (error) {
      console.error('Error loading filtered products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyLocalFilters = (productsData) => {
    let filtered = [...productsData];

    // Price range filter (only if not 'all')
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(product => {
        const price = parseFloat(product.price) || 0;
        if (filters.priceRange === 'under_1000') return price < 1000;
        if (filters.priceRange === '1000_5000') return price >= 1000 && price <= 5000;
        if (filters.priceRange === 'above_5000') return price > 5000;
        return true;
      });
    }

    return filtered;
  };

  useEffect(() => {
    loadProducts();
  }, [searchQuery, filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    SupabaseProductService.clearCache();
    await DatabaseService.clearCache();
    await loadCategories();
    await loadProducts();
    setRefreshing(false);
  };

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
    // Note: For now, category filtering is disabled since Supabase products 
    // don't have traditional category_id mapping. You can implement tag-based 
    // filtering here if needed.
  };

  const handleProductPress = (product) => {
    navigation.navigate('Product', { 
      productId: product.autods_id, // Use autods_id for Supabase products
      product: product // Pass product data for immediate display
    });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return 'All Products';
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : 'All Products';
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>
          {getSelectedCategoryName()}
        </Text>
        
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <Searchbar
        placeholder="Search products..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
        iconColor="#666"
      />
    </View>
  );

  const renderCategories = () => (
    <View style={styles.categoriesSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        <Chip
          selected={!selectedCategory}
          onPress={() => handleCategoryPress(null)}
          style={[
            styles.categoryChip,
            !selectedCategory && styles.selectedCategoryChip
          ]}
          textStyle={[
            styles.categoryChipText,
            !selectedCategory && styles.selectedCategoryChipText
          ]}
        >
          All
        </Chip>
        
        {/* For now, show basic category chips. You can implement tag-based filtering later */}
        {['Technology', 'Monitors', 'Computers', 'Accessories'].map((categoryName, index) => (
          <Chip
            key={index}
            selected={false}
            onPress={() => {
              // Implement tag-based search
              setSearchQuery(categoryName);
            }}
            style={styles.categoryChip}
            textStyle={styles.categoryChipText}
          >
            {categoryName}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.sortBy === 'modified_at' && filters.sortOrder === 'desc' && styles.activeFilterChip
          ]}
          onPress={() => toggleFilter('sortBy', 'modified_at')}
        >
          <Text style={[
            styles.filterChipText,
            filters.sortBy === 'modified_at' && styles.activeFilterChipText
          ]}>
            Newest
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.sortBy === 'price' && filters.sortOrder === 'asc' && styles.activeFilterChip
          ]}
          onPress={() => {
            toggleFilter('sortBy', 'price');
            toggleFilter('sortOrder', 'asc');
          }}
        >
          <Text style={[
            styles.filterChipText,
            filters.sortBy === 'price' && filters.sortOrder === 'asc' && styles.activeFilterChipText
          ]}>
            Price: Low to High
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.sortBy === 'price' && filters.sortOrder === 'desc' && styles.activeFilterChip
          ]}
          onPress={() => {
            toggleFilter('sortBy', 'price');
            toggleFilter('sortOrder', 'desc');
          }}
        >
          <Text style={[
            styles.filterChipText,
            filters.sortBy === 'price' && filters.sortOrder === 'desc' && styles.activeFilterChipText
          ]}>
            Price: High to Low
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.inStock && styles.activeFilterChip
          ]}
          onPress={() => toggleFilter('inStock', !filters.inStock)}
        >
          <Text style={[
            styles.filterChipText,
            filters.inStock && styles.activeFilterChipText
          ]}>
            In Stock
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderProducts = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e53e3e" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      );
    }

    if (products.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery 
              ? `No products found for "${searchQuery}"`
              : 'No products available'
            }
          </Text>
        </View>
      );
    }

    return (
      <FlatGrid
        itemDimension={(width - 48) / 2}
        data={products}
        style={styles.productGrid}
        spacing={12}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => handleProductPress(item)}
          >
            <View style={styles.productImageContainer}>
              <Image
                source={{ 
                  uri: item.main_picture_url || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop' 
                }}
                style={styles.productImage}
                contentFit="cover"
              />
            </View>
            
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.productPrice}>
                ${parseFloat(item.price || 0).toLocaleString()}
              </Text>
              {item.shipping_price === 0 && (
                <Text style={styles.freeShipping}>Free shipping</Text>
              )}
              <Text style={styles.stockText}>
                {item.quantity > 0 ? `${item.quantity} in stock` : 'Out of stock'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.autods_id}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        stickyHeaderIndices={[0, 1]}
      >
        {renderCategories()}
        {renderFilters()}
        
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </Text>
        </View>
        
        {renderProducts()}
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchBar: {
    backgroundColor: '#f5f5f5',
    elevation: 0,
    borderRadius: 25,
  },
  content: {
    flex: 1,
  },
  categoriesSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#f5f5f5',
    borderWidth: 0,
  },
  selectedCategoryChip: {
    backgroundColor: '#e53e3e',
  },
  categoryChipText: {
    color: '#666',
    fontSize: 14,
  },
  selectedCategoryChipText: {
    color: 'white',
  },
  filtersSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterChip: {
    backgroundColor: '#e53e3e',
    borderColor: '#e53e3e',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: 'white',
  },
  resultsHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  productGrid: {
    padding: 16,
    backgroundColor: '#fafafa',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    height: 140,
    backgroundColor: '#F8F8F8',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53E3E',
    marginBottom: 4,
  },
  freeShipping: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 2,
  },
  stockText: {
    fontSize: 11,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 80,
  },
});