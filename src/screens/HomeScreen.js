// src/screens/HomeScreen.js - Enhanced with lazy loading for browse section
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
import SupabaseBannerService from '../services/SupabaseBannerService';
import AutoDSService from '../services/AutoDSService';
import AnimatedBannerCarousel from '../components/AnimatedBannerCarousel';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [hotSales, setHotSales] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  
  // Separate state for different banner positions
  const [mainBanners, setMainBanners] = useState([]); // Top carousel banners
  const [middleBanners, setMiddleBanners] = useState([]); // Middle section banners
  const [bottomBanners, setBottomBanners] = useState([]); // Bottom section banners
  const [gridBanners, setGridBanners] = useState([]); // New: 2-column grid banners
  const [singleBanners, setSingleBanners] = useState({}); // Individual positioned banners
  
  const [browseProducts, setBrowseProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [bannerError, setBannerError] = useState(false);
  
  // New states for lazy loading
  const [shouldLoadBrowseProducts, setShouldLoadBrowseProducts] = useState(false);
  const [browseProductsLoaded, setBrowseProductsLoaded] = useState(false);
  
  const { getCartItemsCount } = useCart();
  const { unreadCount } = useNotifications();

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
      
      await Promise.all([
        loadBanners(isRefresh),
        loadMainProducts(isRefresh) // Load only main products initially
      ]);
      
    } catch (error) {
      console.error('❌ Error loading home data:', error);
      setDataLoaded(true);
      
      if (!isRefresh) {
        Alert.alert(
          'Connection Issue', 
          'Unable to load some content. Please check your internet connection and try again.',
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

  const loadBanners = async (isRefresh = false) => {
    try {
      console.log('🎨 Loading banners from Supabase...', { isRefresh });
      setBannerError(false);
      
      let bannersData;
      
      if (isRefresh) {
        bannersData = await SupabaseBannerService.refreshBanners();
      } else {
        bannersData = await SupabaseBannerService.getBanners();
      }
      
      if (bannersData && bannersData.length > 0) {
        // Organize banners by their intended position
        organizeBannersByPosition(bannersData);
        console.log(`✅ Successfully loaded ${bannersData.length} banners from Supabase`);
      } else {
        console.warn('⚠️ No banners found in Supabase');
        // Set empty arrays for all banner sections
        setMainBanners([]);
        setMiddleBanners([]);
        setBottomBanners([]);
        setGridBanners([]);
        setSingleBanners({});
        setBannerError(true);
      }
      
    } catch (error) {
      console.error('❌ Error loading banners:', error);
      setBannerError(true);
      
      // Set empty arrays for all banner sections on error
      setMainBanners([]);
      setMiddleBanners([]);
      setBottomBanners([]);
      setGridBanners([]);
      setSingleBanners({});
      console.log('📱 Set all banner sections to empty due to error');
    }
  };

  const organizeBannersByPosition = (banners) => {
    // Sort banners by display_order first
    const sortedBanners = banners.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    // Organize banners by position using display_order ranges:
    // 0-99: Main carousel (top)
    // 100-199: Middle section banners
    // 200-299: Bottom section banners
    // 300-399: Grid banners (2-column layout)
    // 1000+: Specific positioned banners
    
    const main = [];
    const middle = [];
    const bottom = [];
    const grid = [];
    const single = {};
    
    sortedBanners.forEach(banner => {
      const order = banner.display_order || 0;
      
      if (order >= 0 && order < 100) {
        // Main carousel banners (position 0-99)
        main.push(banner);
      } else if (order >= 100 && order < 200) {
        // Middle section banners (position 100-199)
        middle.push(banner);
      } else if (order >= 200 && order < 300) {
        // Bottom section banners (position 200-299)
        bottom.push(banner);
      } else if (order >= 300 && order < 400) {
        // Grid banners (position 300-399)
        grid.push(banner);
      } else if (order >= 1000) {
        // Specific positioned banners (1000+)
        // Use the exact order number as the key
        single[order] = banner;
      }
    });
    
    // If no grid banners from Supabase, set empty array
    const gridBannersToUse = grid;
    
    setMainBanners(main);
    setMiddleBanners(middle);
    setBottomBanners(bottom);
    setGridBanners(gridBannersToUse);
    setSingleBanners(single);
    
    console.log('📍 Banners organized by position:', {
      main: main.length,
      middle: middle.length,
      bottom: bottom.length,
      grid: gridBannersToUse.length,
      single: Object.keys(single).length
    });
  };

  // Load main products (featured, hot sales, recently viewed) - called on initial load
  const loadMainProducts = async (isRefresh = false) => {
    try {
      console.log('🔍 Loading main products from Supabase...');
      
      const [featuredData, hotSalesData, recentlyViewedData] = await Promise.allSettled([
        SupabaseProductService.getFeaturedProducts(10),
        SupabaseProductService.getHotSales(10),
        SupabaseProductService.getRecentlyViewed(10)
      ]);

      const featured = featuredData.status === 'fulfilled' ? featuredData.value : [];
      const hotSales = hotSalesData.status === 'fulfilled' ? hotSalesData.value : [];
      const recentViewed = recentlyViewedData.status === 'fulfilled' ? recentlyViewedData.value : [];

      console.log('✅ Main products received:', {
        featured: featured.length,
        hotSales: hotSales.length,
        recentViewed: recentViewed.length,
      });

      setFeaturedProducts(featured || []);
      setHotSales(hotSales || []);
      setRecentlyViewed(recentViewed || []);
      setDataLoaded(true);
      
    } catch (error) {
      console.error('❌ Main product loading failed:', error);
      setDataLoaded(true);
    }
  };

  // Load browse products - called when user scrolls to browse section
  const loadBrowseProducts = async (isInitial = true) => {
    if (!isInitial && (loadingMore || !hasMoreProducts)) return;
    
    try {
      if (isInitial) {
        setBrowseProductsLoaded(false);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      
      const page = isInitial ? 1 : currentPage + 1;
      console.log(`🔍 Loading browse products page ${page}...`);
      
      const browse = await SupabaseProductService.getProducts({ 
        page, 
        limit: 20 
      });

      console.log('✅ Browse products received:', {
        browse: browse.products?.length || 0,
        page: page,
        hasMore: browse.pagination?.hasMore || false
      });

      if (isInitial) {
        setBrowseProducts(browse.products || []);
        setBrowseProductsLoaded(true);
      } else {
        setBrowseProducts(prev => [...prev, ...browse.products]);
        setCurrentPage(page);
      }
      
      setHasMoreProducts(browse.pagination?.hasMore || false);
      
    } catch (error) {
      console.error('❌ Browse products loading failed:', error);
      if (isInitial) {
        setBrowseProductsLoaded(true);
      }
    } finally {
      if (!isInitial) {
        setLoadingMore(false);
      }
    }
  };

  // Handle scroll event to trigger browse products loading
  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const paddingToBottom = 1200; // Start loading when user is 1200px from bottom
    
    // Check if user scrolled close to bottom and browse products haven't been loaded yet
    if (contentOffset.y + layoutMeasurement.height + paddingToBottom >= contentSize.height) {
      if (!shouldLoadBrowseProducts && !browseProductsLoaded) {
        console.log('📜 User scrolled near browse section, loading products...');
        setShouldLoadBrowseProducts(true);
        loadBrowseProducts(true);
      }
    }
  };

  const loadMoreProducts = () => {
    if (browseProductsLoaded && hasMoreProducts && !loadingMore) {
      loadBrowseProducts(false);
    }
  };

  const onRefresh = useCallback(async () => {
    console.log('🔄 Manual refresh triggered...');
    setRefreshing(true);
    
    if (SupabaseProductService.clearCache) {
      SupabaseProductService.clearCache();
    }
    SupabaseBannerService.clearCache();
    
    // Reset browse products state
    setShouldLoadBrowseProducts(false);
    setBrowseProductsLoaded(false);
    setBrowseProducts([]);
    setCurrentPage(1);
    setHasMoreProducts(true);
    
    await loadHomeData(true);
  }, []);

  const handleBannerPress = async (banner) => {
    console.log('🎨 Banner pressed:', banner);
    
    try {
      if (SupabaseBannerService.addToRecentlyViewedBanners) {
        await SupabaseBannerService.addToRecentlyViewedBanners(banner);
      }
    } catch (error) {
      console.error('Error adding banner to recently viewed:', error);
    }
    
    try {
      if (banner.action_type === 'category') {
        navigation.navigate('Search', { query: banner.action_value });
      } else if (banner.action_type === 'product') {
        navigation.navigate('Product', { productId: banner.action_value });
      } else if (banner.action_type === 'url') {
        console.log('External URL:', banner.action_value);
      }
    } catch (navError) {
      console.error('Navigation error:', navError);
      Alert.alert('Navigation Error', 'Unable to navigate. Please try again.');
    }
  };

  const handleProductPress = async (product) => {
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

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery.trim() });
    }
  };

  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };

  // Render a single banner at specific position
  const renderSingleBanner = (position) => {
    const banner = singleBanners[position];
    if (!banner) return null;
    
    return (
      <View style={styles.singleBannerContainer}>
        <TouchableOpacity
          style={styles.singleBanner}
          onPress={() => handleBannerPress(banner)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: banner.image }}
            style={styles.singleBannerImage}
            contentFit="cover"
          />
          <View style={styles.singleBannerGradient} />
          <View style={styles.singleBannerTextContainer}>
            <Text style={[styles.singleBannerTitle, { color: banner.text_color || 'white' }]}>
              {banner.title}
            </Text>
            {banner.subtitle && (
              <Text style={[styles.singleBannerSubtitle, { color: banner.text_color || 'white' }]}>
                {banner.subtitle}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Render 2-column grid banner
  const renderGridBanner = ({ item: banner, index }) => (
    <TouchableOpacity
      style={[
        styles.gridBannerCard,
        index % 2 === 0 ? styles.gridBannerLeft : styles.gridBannerRight
      ]}
      onPress={() => handleBannerPress(banner)}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: banner.image }}
        style={styles.gridBannerImage}
        contentFit="cover"
      />
      <View style={styles.gridBannerGradient} />
      <View style={styles.gridBannerTextContainer}>
        <Text style={[styles.gridBannerTitle, { color: banner.text_color || 'white' }]}>
          {banner.title}
        </Text>
        {banner.subtitle && (
          <Text style={[styles.gridBannerSubtitle, { color: banner.text_color || 'white' }]}>
            {banner.subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

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

  // Render browse section with lazy loading
  const renderBrowseSection = () => {
    if (!shouldLoadBrowseProducts && !browseProductsLoaded) {
      // Show placeholder when not loaded yet
      return (
        <View style={styles.browseMoreSection}>
          <Text style={styles.browseMoreTitle}>Browse more products</Text>
          <View style={styles.browsePlaceholder}>
            <ActivityIndicator size="small" color="#E53E3E" />
            <Text style={styles.browsePlaceholderText}>Scroll to load more products...</Text>
          </View>
        </View>
      );
    }

    if (!browseProductsLoaded) {
      // Show loading state
      return (
        <View style={styles.browseMoreSection}>
          <Text style={styles.browseMoreTitle}>Browse more products</Text>
          <View style={styles.browseLoadingContainer}>
            <ActivityIndicator size="large" color="#E53E3E" />
            <Text style={styles.loadingMoreText}>Loading products...</Text>
          </View>
        </View>
      );
    }

    // Show products when loaded
    return (
      <View style={styles.browseMoreSection}>
        <Text style={styles.browseMoreTitle}>Browse more products</Text>
        
        <FlatList
          data={browseProducts}
          renderItem={renderBrowseProductCard}
          keyExtractor={(item, index) => `browse-${item.autods_id || item.id || index}-${item.title?.slice(0,10) || index}`}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.browseRow}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
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
    );
  };

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
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#E53E3E']}
            tintColor="#E53E3E"
          />
        }
      >
        {/* 1st Banner Position: Main Carousel (display_order 0-99) */}
        {mainBanners.length > 0 && (
          <View>
            <AnimatedBannerCarousel
              banners={mainBanners}
              onBannerPress={handleBannerPress}
              height={220}
              autoSlide={mainBanners.length > 1}
              slideInterval={4000}
              showPagination={mainBanners.length > 1}
              showGradient={true}
              borderRadius={12}
              style={styles.mainBannerSection}
            />
            {bannerError && (
              <View style={styles.bannerErrorContainer}>
                <Text style={styles.bannerErrorText}>
                  Banners may not be up to date. Pull to refresh for latest content.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Specific Banner Position 1001 */}
        {renderSingleBanner(1001)}

        {/* NEW: 2-Column Grid Banner Section (display_order 300-399) */}
        {gridBanners.length > 0 && (
          <View style={styles.gridBannerSection}>
            <View style={styles.gridBannerHeader}>
              <Text style={styles.gridBannerSectionTitle}>Shop by Category</Text>
            </View>
            
            <FlatList
              data={gridBanners}
              renderItem={renderGridBanner}
              keyExtractor={(item, index) => `grid-${item.id || item.autods_id || index}-${item.display_order || index}`}
              numColumns={2}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gridBannerContainer}
            />
          </View>
        )}

        {/* Hot Sales */}
        {hotSales.length > 0 && (
          <View style={styles.hotSalesSection}>
            <View style={styles.hotSalesHeader}>
              <Text style={styles.hotSalesTitle}>Hot sales</Text>
            </View>

            <FlatList
              data={hotSales}
              renderItem={renderProductCard}
              keyExtractor={(item, index) => `hot-${item.autods_id || item.id || index}-${Date.now()}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScrollContainer}
            />
          </View>
        )}

        {/* 2nd Banner Position: Middle Section (display_order 100-199) */}
        {middleBanners.length > 0 && (
          <View style={styles.middleBannerSection}>
            <AnimatedBannerCarousel
              banners={middleBanners}
              onBannerPress={handleBannerPress}
              height={180}
              autoSlide={true}
              slideInterval={5000}
              showPagination={middleBanners.length > 1}
              showGradient={true}
              borderRadius={12}
            />
          </View>
        )}

        {/* Specific Banner Position 1002 */}
        {renderSingleBanner(1002)}

        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <View style={styles.recentlyViewedSection}>
            <Text style={styles.recentlyViewedTitle}>Recently viewed</Text>
            
            <View style={styles.recentlyViewedContainer}>
              {recentlyViewed.slice(0, 2).map((item, index) => (
                <TouchableOpacity
                  key={`recent-${item.autods_id || item.id || index}-${item.title?.slice(0,5) || Math.random()}`}
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
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Specific Banner Position 1003 */}
        {renderSingleBanner(1003)}

        {/* Browse More Products - With Lazy Loading */}
        {renderBrowseSection()}

        {/* 3rd Banner Position: Bottom Section (display_order 200-299) */}
        {bottomBanners.length > 0 && (
          <View style={styles.bottomBannerSection}>
            <AnimatedBannerCarousel
              banners={bottomBanners}
              onBannerPress={handleBannerPress}
              height={160}
              autoSlide={true}
              slideInterval={6000}
              showPagination={bottomBanners.length > 1}
              showGradient={true}
              borderRadius={12}
            />
          </View>
        )}

        {/* Specific Banner Position 1004 */}
        {renderSingleBanner(1004)}

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
    marginTop: 16,
  },
  middleBannerSection: {
    marginVertical: 16,
  },
  bottomBannerSection: {
    marginVertical: 16,
  },
  singleBannerContainer: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  singleBanner: {
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  singleBannerImage: {
    width: '100%',
    height: '100%',
  },
  singleBannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  singleBannerTextContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  singleBannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  singleBannerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  // Grid Banner Styles
  gridBannerSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginVertical: 8,
  },
  gridBannerHeader: {
    marginBottom: 16,
  },
  gridBannerSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  gridBannerContainer: {
    paddingHorizontal: 0,
  },
  gridBannerCard: {
    height: 140,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  gridBannerLeft: {
    width: (width - 44) / 2,
    marginRight: 6,
  },
  gridBannerRight: {
    width: (width - 44) / 2,
    marginLeft: 6,
  },
  gridBannerImage: {
    width: '100%',
    height: '100%',
  },
  gridBannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  gridBannerTextContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  gridBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  gridBannerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bannerErrorContainer: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    borderRadius: 4,
    marginTop: -8,
  },
  bannerErrorText: {
    color: '#856404',
    fontSize: 12,
    textAlign: 'center',
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
  productsScrollContainer: {
    paddingHorizontal: 10,
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
  browsePlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  browsePlaceholderText: {
    color: '#666',
    fontSize: 16,
  },
  browseLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
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
  bottomSpacing: {
    height: 100,
  },