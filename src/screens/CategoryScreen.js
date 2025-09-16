// src/screens/CategoryScreen.js
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
import { FlatGrid } from 'react-native-super-grid';
import { useFocusEffect } from '@react-navigation/native';

import DatabaseService from '../services/DatabaseService';
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
    sortBy: 'newest', // newest, price_low, price_high, rating
    priceRange: 'all', // all, under_1000, 1000_5000, above_5000
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
      
      let queryFilters = {};
      
      if (selectedCategory) {
        queryFilters.category_id = selectedCategory;
      }
      
      if (searchQuery.trim()) {
        queryFilters.search = searchQuery.trim();
      }

      let productsData = await DatabaseService.getProducts(queryFilters);
      
      // Apply additional filters
      productsData = applyFilters(productsData);
      
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
      let queryFilters = {};
      
      if (filterType === 'featured') {
        queryFilters.is_featured = true;
      } else if (filterType === 'on_sale') {
        queryFilters.is_on_sale = true;
      }

      const productsData = await DatabaseService.getProducts(queryFilters);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading filtered products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (productsData) => {
    let filtered = [...productsData];

    // Price range filter
    if (filters.priceRange !== 'all') {
      filtered = filtered.filter(product => {
        if (filters.priceRange === 'under_1000') return product.price < 1000;
        if (filters.priceRange === '1000_5000') return product.price >= 1000 && product.price <= 5000;
        if (filters.priceRange === 'above_5000') return product.price > 5000;
        return true;
      });
    }

    // Stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'newest':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery, filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await DatabaseService.clearCache();
    await loadCategories();
    await loadProducts();
    setRefreshing(false);
  };

  const handleCategoryPress = (categoryId) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleProductPress = (product) => {
    navigation.navigate('Product', { productId: product.id });
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
    if (!selectedCategory) return 'All Categories';
    const category = categories.find(c => c.id === selectedCategory);
    return category ? category.name : 'All Categories';
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
        
        {categories.map((category) => (
          <Chip
            key={category.id}
            selected={selectedCategory === category.id}
            onPress={() => handleCategoryPress(category.id)}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.selectedCategoryChip
            ]}
            textStyle={[
              styles.categoryChipText,
              selectedCategory === category.id && styles.selectedCategoryChipText
            ]}
          >
            {category.name}
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
            filters.sortBy === 'newest' && styles.activeFilterChip
          ]}
          onPress={() => toggleFilter('sortBy', 'newest')}
        >
          <Text style={[
            styles.filterChipText,
            filters.sortBy === 'newest' && styles.activeFilterChipText
          ]}>
            Newest
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.sortBy === 'price_low' && styles.activeFilterChip
          ]}
          onPress={() => toggleFilter('sortBy', 'price_low')}
        >
          <Text style={[
            styles.filterChipText,
            filters.sortBy === 'price_low' && styles.activeFilterChipText
          ]}>
            Price: Low to High
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterChip,
            filters.sortBy === 'price_high' && styles.activeFilterChip
          ]}
          onPress={() => toggleFilter('sortBy', 'price_high')}
        >
          <Text style={[
            styles.filterChipText,
            filters.sortBy === 'price_high' && styles.activeFilterChipText
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
              : 'No products available in this category'
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
          <ProductCard
            product={item}
            onPress={() => handleProductPress(item)}
            showDiscount
          />
        )}
        keyExtractor={(item) => item.id.toString()}
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