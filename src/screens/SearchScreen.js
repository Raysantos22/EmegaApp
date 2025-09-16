// src/screens/SearchScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import SupabaseProductService from '../services/SupabaseProductService';

const { width } = Dimensions.get('window');

export default function SearchScreen({ route, navigation }) {
  const { query: initialQuery = '' } = route.params || {};
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search filters
  const [sortBy, setSortBy] = useState('modified_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 });
  const [showFilters, setShowFilters] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (initialQuery) {
        performSearch(initialQuery, true);
      }
    }, [initialQuery])
  );

  const performSearch = async (query, resetPage = false) => {
    if (!query.trim()) {
      setProducts([]);
      setTotalResults(0);
      return;
    }

    try {
      if (resetPage) {
        setLoading(true);
        setCurrentPage(1);
        setProducts([]);
      } else {
        setLoadingMore(true);
      }

      const page = resetPage ? 1 : currentPage;
      const result = await SupabaseProductService.getProducts({
        page,
        limit: 20,
        search: query,
        sortBy,
        sortOrder,
        minPrice: priceRange.min,
        maxPrice: priceRange.max,
      });

      if (resetPage) {
        setProducts(result.products);
      } else {
        setProducts(prev => [...prev, ...result.products]);
      }

      setTotalResults(result.pagination.total);
      setHasMore(result.pagination.hasMore);
      setCurrentPage(page);
      setShowSuggestions(false);

    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && searchQuery.trim()) {
      setCurrentPage(prev => {
        const nextPage = prev + 1;
        performSearch(searchQuery, false);
        return nextPage;
      });
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim(), true);
    }
  };

  const handleSearchChange = async (text) => {
    setSearchQuery(text);
    
    // Get suggestions
    if (text.length >= 2) {
      try {
        const suggestionList = await SupabaseProductService.getSearchSuggestions(text, 5);
        setSuggestions(suggestionList);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error getting suggestions:', error);
      }
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    performSearch(suggestion, true);
  };

  const applySortFilter = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setShowFilters(false);
    if (searchQuery.trim()) {
      performSearch(searchQuery, true);
    }
  };

  const renderProduct = ({ item: product, index }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('Product', { 
        productId: product.autods_id,
        product 
      })}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{ 
            uri: product.main_picture_url || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop' 
          }}
          style={styles.productImage}
          contentFit="cover"
        />
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.productPrice}>
          ${parseFloat(product.price).toLocaleString()}
        </Text>
        {product.shipping_price === 0 && (
          <Text style={styles.freeShipping}>Free shipping</Text>
        )}
        <View style={styles.productMeta}>
          <Text style={styles.stockText}>
            {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
          </Text>
          {product.sold_count > 0 && (
            <Text style={styles.soldText}>{product.sold_count} sold</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSuggestion = ({ item }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
    >
      <Ionicons name="search" size={16} color="#666" />
      <Text style={styles.suggestionText} numberOfLines={1}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {searchQuery && totalResults > 0 && (
        <Text style={styles.resultsText}>
          {totalResults.toLocaleString()} results for "{searchQuery}"
        </Text>
      )}
      
      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={18} color="#666" />
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'price' && sortOrder === 'asc' && styles.activeSortButton
            ]}
            onPress={() => applySortFilter('price', 'asc')}
          >
            <Text style={[
              styles.sortText,
              sortBy === 'price' && sortOrder === 'asc' && styles.activeSortText
            ]}>
              Price: Low to High
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'price' && sortOrder === 'desc' && styles.activeSortButton
            ]}
            onPress={() => applySortFilter('price', 'desc')}
          >
            <Text style={[
              styles.sortText,
              sortBy === 'price' && sortOrder === 'desc' && styles.activeSortText
            ]}>
              Price: High to Low
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'sold_count' && sortOrder === 'desc' && styles.activeSortButton
            ]}
            onPress={() => applySortFilter('sold_count', 'desc')}
          >
            <Text style={[
              styles.sortText,
              sortBy === 'sold_count' && sortOrder === 'desc' && styles.activeSortText
            ]}>
              Most Popular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'modified_at' && sortOrder === 'desc' && styles.activeSortButton
            ]}
            onPress={() => applySortFilter('modified_at', 'desc')}
          >
            <Text style={[
              styles.sortText,
              sortBy === 'modified_at' && sortOrder === 'desc' && styles.activeSortText
            ]}>
              Newest
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#E53E3E" />
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>
          {searchQuery ? 'No products found' : 'Search for products'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {searchQuery 
            ? `No results found for "${searchQuery}". Try different keywords.`
            : 'Enter keywords to find products from our collection'
          }
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            autoFocus={!initialQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                setProducts([]);
                setShowSuggestions(false);
                setTotalResults(0);
              }}
            >
              <Ionicons name="close" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `suggestion_${index}`}
            style={styles.suggestionsList}
          />
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E53E3E" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={item => item.autods_id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  suggestionsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    maxHeight: 200,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 20,
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
    marginBottom: 12,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginRight: 8,
  },
  activeSortButton: {
    backgroundColor: '#E53E3E',
  },
  sortText: {
    fontSize: 14,
    color: '#666',
  },
  activeSortText: {
    color: 'white',
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: (width - 44) / 2,
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
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 11,
    color: '#666',
  },
  soldText: {
    fontSize: 11,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
});