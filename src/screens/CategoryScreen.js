// src/screens/CategoryScreen.js - Fixed with clean navigation like SearchScreen
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
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import DatabaseService from '../services/DatabaseService';
import SupabaseProductService from '../services/SupabaseProductService';

const { width } = Dimensions.get('window');

// Mock categories with images for grid display
const mockCategories = [
  { 
    id: 1, 
    name: 'Beauty & Grooming', 
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop',
    color: '#FF69B4'
  },
  { 
    id: 2, 
    name: 'Skincare', 
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
    color: '#FFB6C1'
  },
  { 
    id: 3, 
    name: 'Hair Care', 
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop',
    color: '#87CEEB'
  },
  { 
    id: 4, 
    name: 'Electronics', 
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop',
    color: '#4169E1'
  },
  { 
    id: 5, 
    name: 'Fragrances', 
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=300&fit=crop',
    color: '#8A2BE2'
  },
  { 
    id: 6, 
    name: 'Oral Care', 
    image: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=400&h=300&fit=crop',
    color: '#20B2AA'
  },
  { 
    id: 7, 
    name: 'Outdoor', 
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    color: '#228B22'
  },
  { 
    id: 8, 
    name: 'Accessories', 
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop',
    color: '#FFD700'
  },
  { 
    id: 9, 
    name: 'Monitors', 
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop',
    color: '#696969'
  }
];

export default function CategoryScreen({ navigation, route }) {
  const [categories, setCategories] = useState(mockCategories);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [filters, setFilters] = useState({
    sortBy: 'modified_at',
    sortOrder: 'desc',
    priceRange: 'all',
    inStock: false,
  });

  // Handle route params
  const { categoryId, filter, category } = route.params || {};

  useFocusEffect(
    useCallback(() => {
      // Reset to category view when navigating back
      if (!categoryId && !filter && !category) {
        setShowProducts(false);
        setSelectedCategory(null);
        setSearchQuery('');
      } else {
        if (categoryId) {
          setSelectedCategory(categoryId);
          setShowProducts(true);
          loadProducts();
        }
        if (filter) {
          setShowProducts(true);
          loadProductsByFilter(filter);
        }
        if (category) {
          setSearchQuery(category);
          setShowProducts(true);
          loadProducts();
        }
      }
    }, [categoryId, filter, category])
  );

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      const result = await SupabaseProductService.getProducts({
        page: 1,
        limit: 100,
        search: searchQuery.trim() || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        hasStock: filters.inStock
      });

      let productsData = result.products || [];
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
    if (showProducts) {
      loadProducts();
    }
  }, [searchQuery, filters, showProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (SupabaseProductService.clearCache) {
      SupabaseProductService.clearCache();
    }
    if (showProducts) {
      await loadProducts();
    }
    setRefreshing(false);
  };

  const handleCategoryPress = (category) => {
    setSelectedCategory(category.id);
    setSearchQuery(category.name);
    setShowProducts(true);
  };

  const handleBackToCategories = () => {
    setShowProducts(false);
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const handleProductPress = (product) => {
    navigation.navigate('Product', { 
      productId: product.autods_id,
      product: product
    });
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      setShowProducts(true);
    }
  };

  const toggleFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return 'Products';
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : 'Products';
  };

  const renderCategoryGrid = () => (
    <View style={styles.categoriesGrid}>
      {categories.map((category, index) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryCard,
            index % 2 === 0 ? styles.categoryCardLeft : styles.categoryCardRight
          ]}
          onPress={() => handleCategoryPress(category)}
        >
          <View style={styles.categoryImageContainer}>
            <Image
              source={{ uri: category.image }}
              style={styles.categoryImage}
              contentFit="cover"
            />
            <View style={[styles.categoryOverlay, { backgroundColor: category.color + '80' }]} />
          </View>
          
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Ionicons name="arrow-forward" size={16} color="#666" />
          </View>
        </TouchableOpacity>
      ))}
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
          onPress={() => {
            toggleFilter('sortBy', 'modified_at');
            toggleFilter('sortOrder', 'desc');
          }}
        >
          <Text style={[
            styles.filterChipText,
            filters.sortBy === 'modified_at' && filters.sortOrder === 'desc' && styles.activeFilterChipText
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
          <ActivityIndicator size="large" color="#E53E3E" />
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
          <TouchableOpacity 
            style={styles.backToCategoriesButton}
            onPress={handleBackToCategories}
          >
            <Text style={styles.backToCategoriesText}>Browse Categories</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.productsGrid}>
        {products.map((item, index) => (
          <TouchableOpacity
            key={item.autods_id || `product-${index}`}
            style={[
              styles.productCard,
              index % 2 === 0 ? styles.productCardLeft : styles.productCardRight
            ]}
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
        ))}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {searchQuery && products.length > 0 && (
        <Text style={styles.resultsText}>
          {products.length} product{products.length !== 1 ? 's' : ''} found for "{searchQuery}"
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Clean like SearchScreen */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            if (showProducts) {
              handleBackToCategories();
            } else {
              navigation.goBack();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder={showProducts ? `Search in ${getSelectedCategoryName()}...` : "Search categories..."}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                if (showProducts) {
                  setShowProducts(false);
                  setSelectedCategory(null);
                }
              }}
            >
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {showProducts && (
          <TouchableOpacity 
            style={styles.gridButton}
            onPress={handleBackToCategories}
          >
            <Ionicons name="grid-outline" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {showProducts && renderFilters()}
        {showProducts && renderHeader()}
        {showProducts ? renderProducts() : renderCategoryGrid()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  gridButton: {
    padding: 4,
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  categoriesGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  categoryCardLeft: {
    width: (width - 44) / 2,
    marginRight: 6,
  },
  categoryCardRight: {
    width: (width - 44) / 2,
    marginLeft: 6,
  },
  categoryImageContainer: {
    height: 100,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  categoryInfo: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  filtersSection: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activeFilterChip: {
    backgroundColor: '#E53E3E',
    borderColor: '#E53E3E',
  },
  filterChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: 'white',
  },
  productsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productCardLeft: {
    width: (width - 44) / 2,
    marginRight: 6,
  },
  productCardRight: {
    width: (width - 44) / 2,
    marginLeft: 6,
  },
  productImageContainer: {
    height: 340,
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
    marginBottom: 24,
  },
  backToCategoriesButton: {
    backgroundColor: '#E53E3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToCategoriesText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 80,
  },
});