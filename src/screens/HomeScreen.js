// src/screens/HomeScreen.js - Fixed infinite loading and added animated banner
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';

import SupabaseProductService from '../services/SupabaseProductService';
import DatabaseService from '../services/DatabaseService';
import AutoDSService from '../services/AutoDSService';
import BannerCarousel from '../components/BannerCarousel';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [hotSales, setHotSales] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [banners, setBanners] = useState([]);
  const [browseProducts, setBrowseProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  const { getCartItemsCount } = useCart();
  const { unreadCount } = useNotifications();

  // Sample banner data - replace with your actual data
  const sampleBanners = [
    {
      id: 1,
      title: "Flash Sale",
      subtitle: "Up to 70% OFF",
      image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop",
      text_color: "white",
      action_type: "category",
      action_value: "electronics"
    },
    {
      id: 2,
      title: "New Arrivals",
      subtitle: "Discover Latest Fashion",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
      text_color: "white",
      action_type: "category",
      action_value: "fashion"
    },
    {
      id: 3,
      title: "Best Deals",
      subtitle: "Limited Time Offer",
      image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
      text_color: "white",
      action_type: "category",
      action_value: "home"
    }
  ];

  // Use useFocusEffect to reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 Screen focused, loading data...');
      loadHomeData();
    }, [])
  );

  const loadHomeData = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      
      console.log('📊 Starting data load...', { isRefresh });
      
      // Always load banners first since they're quick
      await loadBanners();
      
      // Try to load from Supabase
      try {
        console.log('🔍 Attempting to load from Supabase...');
        
        const [featuredData, hotSalesData, recentlyViewedData, browseData] = await Promise.allSettled([
          SupabaseProductService.getFeaturedProducts(10),
          SupabaseProductService.getHotSales(10),
          SupabaseProductService.getRecentlyViewed(10),
          SupabaseProductService.getProducts({ page: 1, limit: 20 })
        ]);

        // Handle fulfilled promises
        const featured = featuredData.status === 'fulfilled' ? featuredData.value : [];
        const hotSales = hotSalesData.status === 'fulfilled' ? hotSalesData.value : [];
        const recentViewed = recentlyViewedData.status === 'fulfilled' ? recentlyViewedData.value : [];
        const browse = browseData.status === 'fulfilled' ? browseData.value : { products: [], pagination: { hasMore: false } };

        console.log('✅ Supabase data received:', {
          featured: featured.length,
          hotSales: hotSales.length,
          recentViewed: recentViewed.length,
          browse: browse.products?.length || 0,
          browsePagination: browse.pagination
        });

        // Set the data even if some are empty
        setFeaturedProducts(featured || []);
        setHotSales(hotSales || []);
        setRecentlyViewed(recentViewed || []);
        setBrowseProducts(browse.products || []);
        setHasMoreProducts(browse.pagination?.hasMore || false);
        setCurrentPage(1);
        setDataLoaded(true);
        
        console.log('✅ Data successfully loaded from Supabase');
        
      } catch (supabaseError) {
        console.error('❌ Supabase connection failed:', supabaseError);
        
        // Try fallback to local data or AutoDS
        try {
          console.log('🔄 Trying fallback data sources...');
          
          // Try AutoDS as fallback
          const fallbackData = await AutoDSService.getProducts({ page: 1, limit: 20 });
          if (fallbackData && fallbackData.length > 0) {
            console.log('📱 Using AutoDS fallback data');
            setBrowseProducts(fallbackData);
            setFeaturedProducts(fallbackData.slice(0, 10));
            setHotSales(fallbackData.slice(5, 15));
            setDataLoaded(true);
          } else {
            console.log('📱 No fallback data available');
            // Set empty arrays but mark as loaded to show empty state
            setFeaturedProducts([]);
            setHotSales([]);
            setBrowseProducts([]);
            setRecentlyViewed([]);
            setDataLoaded(true);
          }
        } catch (fallbackError) {
          console.error('❌ Fallback data loading failed:', fallbackError);
          setDataLoaded(true);
        }
      }
      
    } catch (error) {
      console.error('❌ Error loading home data:', error);
      setDataLoaded(true);
      
      if (!isRefresh) {
        Alert.alert(
          'Connection Issue', 
          'Unable to load products. Please check your internet connection and try again.',
          [
            { text: 'Retry', onPress: () => loadHomeData() },
            { text: 'OK', style: 'cancel' }
          ]
        );
      }
    } finally {
      setLoading(false);
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  const loadBanners = async () => {
    try {
      console.log('🎨 Loading banners...');
      const localBanners = await DatabaseService.getBanners();
      if (localBanners && localBanners.length > 0) {
        setBanners(localBanners);
        console.log(`✅ Loaded ${localBanners.length} banners from database`);
      } else {
        setBanners(sampleBanners);
        console.log('✅ Using sample banners');
      }
    } catch (bannerError) {
      console.error('❌ Banner loading error:', bannerError);
      setBanners(sampleBanners);
      console.log('✅ Using sample banners due to error');
    }
  };
  
  const loadMoreProducts = async () => {
    // Add better checks to prevent aggressive loading
    if (loadingMore || !hasMoreProducts || !dataLoaded) {
      console.log('🚫 Skipping load more:', { loadingMore, hasMoreProducts, dataLoaded });
      return;
    }
    
    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      console.log(`📄 Loading page ${nextPage}...`);
      
      const moreData = await SupabaseProductService.getProducts({ 
        page: nextPage, 
        limit: 20 
      });
      
      if (moreData.products && moreData.products.length > 0) {
        setBrowseProducts(prev => [...prev, ...moreData.products]);
        setHasMoreProducts(moreData.pagination.hasMore);
        setCurrentPage(nextPage);
        console.log(`✅ Loaded ${moreData.products.length} more products`);
      } else {
        setHasMoreProducts(false);
        console.log('📄 No more products available');
      }
      
    } catch (error) {
      console.error('❌ Error loading more products:', error);
      setHasMoreProducts(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered...');
    setRefreshing(true);
    
    // Clear any cached data
    if (SupabaseProductService.clearCache) {
      SupabaseProductService.clearCache();
    }
    
    // Reset pagination
    setCurrentPage(1);
    setHasMoreProducts(true);
    
    // Reload all data
    await loadHomeData(true);
  }, []);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery.trim() });
    }
  };

  const handleProductPress = async (product) => {
    console.log('🔍 Product pressed:', {
      autods_id: product.autods_id,
      id: product.id,
      title: product.title,
      price: product.price,
      hasImages: !!product.main_picture_url
    });

    // Add to recently viewed
    try {
      await SupabaseProductService.addToRecentlyViewed(product);
    } catch (error) {
      console.error('Error adding to recently viewed:', error);
    }
    
    navigation.navigate('Product', { 
      productId: product.autods_id || product.id,
      product: product
    });
  };

  const handleBannerPress = (banner) => {
    console.log('🎨 Banner pressed:', banner);
    if (banner.action_type === 'category') {
      navigation.navigate('Search', { category: banner.action_value });
    } else if (banner.action_type === 'product') {
      navigation.navigate('Product', { productId: banner.action_value });
    } else if (banner.action_type === 'url') {
      console.log('External URL:', banner.action_value);
    }
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };

  // Mock categories
  const mockCategories = [
    { name: 'Technology', color: '#666' },
    { name: 'Fashion', color: '#666' },
    { name: 'Sports', color: '#666' },
    { name: 'Supermarket', color: '#666' },
  ];

  const renderProductCard = ({ item: product, index }) => (
    <TouchableOpacity
      style={[
        styles.productCard,
        index === 0 && { marginLeft: 16 },
        index === featuredProducts.length - 1 && { marginRight: 16 }
      ]}
      onPress={() => handleProductPress(product)}
    >
      <View style={styles.productImageContainer}>
        <Image
          source={{ 
            uri: product.main_picture_url || product.image_url || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop' 
          }}
          style={styles.productCardImage}
          contentFit="cover"
          placeholder={{ uri: 'https://via.placeholder.com/400x300/f0f0f0/999999?text=Loading...' }}
        />
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.title || product.name || 'Product Name'}
        </Text>
        <Text style={styles.productPrice}>
          $ {parseFloat(product.price || 0).toLocaleString()}
        </Text>
        <Text style={styles.freeShippingText}>
          {(product.shipping_price === 0 || !product.shipping_price) ? 'Free shipping' : `Shipping: $${product.shipping_price}`}
        </Text>
        {product.quantity > 0 && (
          <Text style={styles.stockText}>
            {product.quantity} in stock
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderBrowseProductCard = ({ item: product, index }) => (
    <TouchableOpacity
      style={styles.browseProductCard}
      onPress={() => handleProductPress(product)}
    >
      <View style={styles.browseProductImageContainer}>
        <Image
          source={{ 
            uri: product.main_picture_url || product.image_url || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop' 
          }}
          style={styles.browseProductImage}
          contentFit="cover"
          placeholder={{ uri: 'https://via.placeholder.com/400x300/f0f0f0/999999?text=Loading...' }}
        />
      </View>
      
      <View style={styles.browseProductInfo}>
        <Text style={styles.browseProductName} numberOfLines={2}>
          {product.title || product.name || 'Product Name'}
        </Text>
        <Text style={styles.browseProductPrice}>
          $ {parseFloat(product.price || 0).toLocaleString()}
        </Text>
        {(product.shipping_price === 0 || !product.shipping_price) && (
          <Text style={styles.browseFreeShipping}>Free shipping</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="cube-outline" size={64} color="#ccc" />
      <Text style={styles.emptyStateTitle}>No Products Available</Text>
      <Text style={styles.emptyStateMessage}>
        We're having trouble loading products right now. Please try refreshing or check back later.
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => loadHomeData()}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !dataLoaded) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#E53E3E" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            contentFit="contain"
          />
          <View style={styles.rightColumn}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products"
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
              />
            </View>
            
            {/* Notification */}
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={handleNotificationPress}
            >
              <Ionicons name="notifications-outline" size={24} color="#666" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            {/* Cart */}
            <TouchableOpacity 
              style={styles.cartButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name="bag-outline" size={24} color="#666" />
              {getCartItemsCount() > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.badgeText}>{getCartItemsCount()}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#E53E3E']}
            tintColor="#E53E3E"
          />
        }
      >
        {/* Main Banner Carousel */}
        {banners.length > 0 && (
          <BannerCarousel
            banners={banners}
            onBannerPress={handleBannerPress}
            style={styles.mainBannerSection}
            autoSlide={true}
            slideInterval={4000}
          />
        )}

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {mockCategories.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={styles.categoryPill}
              onPress={() => {/* Handle category press */}}
            >
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Check if we have any data to show */}
        {dataLoaded && featuredProducts.length === 0 && hotSales.length === 0 && browseProducts.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Hot Sales */}
            {hotSales.length > 0 && (
              <View style={styles.hotSalesSection}>
                <View style={styles.hotSalesHeader}>
                  <Text style={styles.hotSalesTitle}>Hot sales</Text>
                  <View style={styles.pagination}>
                    <View style={[styles.paginationDot, styles.activeDot]} />
                    <View style={styles.paginationDot} />
                    <View style={styles.paginationDot} />
                    <View style={styles.paginationDot} />
                  </View>
                </View>

                <FlatList
                  data={hotSales}
                  renderItem={renderProductCard}
                  keyExtractor={(item, index) => item.autods_id || item.id || `hot-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.productsScrollContainer}
                />
              </View>
            )}

            {/* Animated Banner above Recently Viewed */}
            {recentlyViewed.length > 0 && banners.length > 1 && (
              <View style={styles.animatedBannerSection}>
                <BannerCarousel
                  banners={banners.slice(1)} // Use remaining banners
                  onBannerPress={handleBannerPress}
                  style={styles.animatedBannerStyle}
                  autoSlide={true}
                  slideInterval={3000}
                  showPagination={true}
                />
              </View>
            )}

            {/* Recently Viewed Section */}
            {recentlyViewed.length > 0 && (
              <View style={styles.recentlyViewedSection}>
                <Text style={styles.recentlyViewedTitle}>Recently viewed</Text>
                
                <View style={styles.recentlyViewedContainer}>
                  {recentlyViewed.slice(0, 2).map((item, index) => (
                    <TouchableOpacity
                      key={item.autods_id || item.id || `recent-${index}`}
                      style={styles.recentlyViewedCard}
                      onPress={() => handleProductPress(item)}
                    >
                      <TouchableOpacity style={styles.heartButton}>
                        <Ionicons name="heart-outline" size={20} color="#FF6B6B" />
                      </TouchableOpacity>
                      <Image
                        source={{ 
                          uri: item.main_picture_url || item.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop' 
                        }}
                        style={styles.recentlyViewedImage}
                        contentFit="cover"
                        placeholder={{ uri: 'https://via.placeholder.com/400x300/f0f0f0/999999?text=Loading...' }}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Browse More Products */}
            {browseProducts.length > 0 && (
              <View style={styles.browseMoreSection}>
                <Text style={styles.browseMoreTitle}>Browse more products</Text>
                
                <FlatList
                  data={browseProducts}
                  renderItem={renderBrowseProductCard}
                  keyExtractor={(item, index) => item.autods_id || item.id || `browse-${index}`}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={styles.browseRow}
                  onEndReached={loadMoreProducts}
                  onEndReachedThreshold={0.5} // Changed from 0.1 to 0.5 to be less aggressive
                  ListFooterComponent={() => 
                    loadingMore && hasMoreProducts ? (
                      <View style={styles.loadingMoreContainer}>
                        <ActivityIndicator size="small" color="#E53E3E" />
                        <Text style={styles.loadingMoreText}>Loading more...</Text>
                      </View>
                    ) : null
                  }
                />
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 70,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoImage: {
    width: width * 0.25,
    height: 40,
    maxWidth: 120,
    minWidth: 80,
  },
  rightColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: width * 0.45,
    height: 50,
    maxWidth: 250,
    minWidth: 180,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  cartButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  mainBannerSection: {
    marginVertical: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  hotSalesSection: {
    paddingVertical: 8,
  },
  hotSalesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  hotSalesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  pagination: {
    flexDirection: 'row',
    gap: 6,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  activeDot: {
    backgroundColor: '#FF9800',
    width: 20,
  },
  productsScrollContainer: {
    paddingHorizontal: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: 180,
    marginRight: 16,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImageContainer: {
    height: 120,
    backgroundColor: '#F8F8F8',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  productCardImage: {
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
    color: '#333',
    marginBottom: 4,
  },
  freeShippingText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
    marginBottom: 2,
  },
  stockText: {
    fontSize: 10,
    color: '#999',
  },
  animatedBannerSection: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  animatedBannerStyle: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  recentlyViewedSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  recentlyViewedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  recentlyViewedContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  recentlyViewedCard: {
    width: (width - 44) / 2,
    height: 120,
    backgroundColor: 'white',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  recentlyViewedImage: {
    width: '100%',
    height: '100%',
  },
  browseMoreSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  browseMoreTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  browseRow: {
    justifyContent: 'space-between',
  },
  browseProductCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: (width - 44) / 2,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  browseProductImageContainer: {
    height: 140,
    backgroundColor: '#F8F8F8',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  browseProductImage: {
    width: '100%',
    height: '100%',
  },
  browseProductInfo: {
    padding: 12,
  },
  browseProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    lineHeight: 18,
  },
  browseProductPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  browseFreeShipping: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
  },
  loadingMoreText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#E53E3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
});