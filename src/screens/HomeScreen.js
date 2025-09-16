// src/screens/HomeScreen.js
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { typography  } from '../constants/typography';

import { useFocusEffect } from '@react-navigation/native';

import DatabaseService from '../services/DatabaseService';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import BannerCarousel from '../components/BannerCarousel';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [hotSales, setHotSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { getCartItemsCount } = useCart(); // Add this line
  const { unreadCount, markAllAsRead, clearNotifications } = useNotifications();


  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [])
  );

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      const [bannersData, categoriesData, featuredData, salesData] = await Promise.all([
        DatabaseService.getBanners(),
        DatabaseService.getCategories(),
        DatabaseService.getProducts({ is_featured: true, limit: 10 }),
        DatabaseService.getProducts({ is_on_sale: true, limit: 10 })
      ]);

      setBanners(bannersData);
      setCategories(categoriesData);
      setFeaturedProducts(featuredData);
      setHotSales(salesData);
    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await DatabaseService.clearCache();
    await loadHomeData();
    setRefreshing(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Search', { query: searchQuery.trim() });
    }
  };

  const handleBannerPress = (banner) => {
    if (banner.action_type === 'category' && banner.action_value) {
      navigation.navigate('CategoryTab', {
        screen: 'Categories',
        params: { categoryId: parseInt(banner.action_value) }
      });
    } else if (banner.action_type === 'product' && banner.action_value) {
      navigation.navigate('Product', { productId: parseInt(banner.action_value) });
    }
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('CategoryTab', {
      screen: 'Categories',
      params: { categoryId: category.id }
    });
  };

  const handleProductPress = (product) => {
    navigation.navigate('Product', { productId: product.id });
  };

 // Replace the handleNotificationPress function with this:
  const handleNotificationPress = () => {
    navigation.navigate('Notifications');
  };
  // Mock data matching the exact design
  const mockCategories = [
    { name: 'Technology', color: '#666' },
    { name: 'Fashion', color: '#666' },
    { name: 'Sports', color: '#666' },
    { name: 'Supermarket', color: '#666' },
  ];

  // const mockProducts = [
  //   {
  //     id: 1,
  //     name: 'Macbook Air M1',
  //     price: 29999,
  //     image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop',
  //     freeShipping: true
  //   },
  //   {
  //     id: 2,
  //     name: 'Sony WH/1000XM5',
  //     price: 4999,
  //     image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop',
  //     freeShipping: true
  //   },
  //   {
  //     id: 3,
  //     name: 'FreeBuds Huawei',
  //     price: 1999,
  //     image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=300&fit=crop',
  //     freeShipping: true
  //   }
  // ];

  const mockRecentlyViewed = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop'
    }
  ];

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
                  <Text style={styles.cartBadgeText}>
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
                  <Text style={styles.cartBadgeText}>{getCartItemsCount()}</Text>
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Banner Carousel */}
        {banners.length > 0 && (
          <BannerCarousel
            banners={banners}
            onBannerPress={handleBannerPress}
            style={styles.bannerSection}
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
              onPress={() => handleCategoryPress(category)}
            >
              <Text style={styles.categoryText}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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

  <ScrollView 
    horizontal 
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.productsScrollContainer}
  >
    {hotSales.map((product, index) => (
      <TouchableOpacity
        key={product.id}
        style={styles.productCard}
        onPress={() => handleProductPress(product)}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{ 
              uri: product.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'
            }}
            style={styles.productCardImage}
            contentFit="cover"
          />
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productPrice}>$ {product.price.toLocaleString()}</Text>
          <Text style={styles.freeShippingText}>Free shipping</Text>
        </View>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>

        {/* Recently Viewed */}
        <View style={styles.recentlyViewedSection}>
          <Text style={styles.recentlyViewedTitle}>Recently viewed</Text>
          
          <View style={styles.recentlyViewedContainer}>
            {mockRecentlyViewed.map((item, index) => (
              <View key={item.id} style={styles.recentlyViewedCard}>
                <TouchableOpacity style={styles.heartButton}>
                  <Ionicons name="heart-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
                <Image
                  source={{ uri: item.image }}
                  style={styles.recentlyViewedImage}
                  contentFit="cover"
                />
              </View>
            ))}
          </View>
        </View>
        {/* Browse More Products */}
        <View style={styles.browseMoreSection}>
          <Text style={styles.browseMoreTitle}>Browse more products</Text>
          
          <View style={styles.browseMoreGrid}>
            {/* Use actual products from database instead of mockProducts */}
            {[...hotSales, ...featuredProducts].concat(
              // Add more sample products to reach 20 items
              Array(17).fill(null).map((_, index) => ({
                id: index + 100,
                name: `Product ${index + 4}`,
                price: Math.floor(Math.random() * 50000) + 5000,
                images: [`https://images.unsplash.com/photo-${1541807084000 + index}?w=400&h=300&fit=crop`],
                freeShipping: Math.random() > 0.3
              }))
            ).slice(0, 20).map((product, index) => (
              <TouchableOpacity
                key={`browse-${product.id}`}
                style={styles.browseProductCard}
                onPress={() => handleProductPress(product)}
              >
                <View style={styles.browseProductImageContainer}>
                  <Image
                    source={{ 
                      uri: product.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'
                    }}
                    style={styles.browseProductImage}
                    contentFit="cover"
                  />
                </View>
                
                <View style={styles.browseProductInfo}>
                  <Text style={styles.browseProductName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.browseProductPrice}>
                    $ {product.price.toLocaleString()}
                  </Text>
                  {product.freeShipping && (
                    <Text style={styles.browseFreeShipping}>Free shipping</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.bottomSpacing} />
        
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
 container: {
  flex: 1,
  backgroundColor: '#F7F7F7',
  fontFamily: 'Arial', // Works on both platforms
  // or remove fontFamily entirely to use system default
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
  browseMoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  browseProductCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: (width - 56) / 2,
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
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E53E3E',
  },
    logoImage: {
    width: width * 0.25,  // 25% of screen width
    height: 40,           // Fixed height that looks good
    maxWidth: 120,        // Don't let it get too big
    minWidth: 80,         // Don't let it get too small
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
  width: width * 0.45,  // 45% of screen width
  height: 50,
  maxWidth: 250,        // Don't let it get too big
  minWidth: 180,        // Don't let it get too small
},
cartButton: {
  position: 'relative',
  padding: 4,
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
cartBadgeText: {
  color: 'white',
  fontSize: 11,
  fontWeight: 'bold',
  textAlign: 'center',
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
  notificationBadge: {
  position: 'absolute',
  top: -2,
  right: -2,
  backgroundColor: '#FF6B6B',
  borderRadius: 10,
  minWidth: 18,
  height: 18,
  Textcolor: 'white',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 4,
   

},
NotificationbadgeText: {
  color: '#E0E0E0',
  background: '#E0E0E0',
  fontSize: 10,
  fontWeight: 'bold',
  textAlign: 'center',
},
  scrollView: {
    flex: 1,
  },
  bannerSection: {
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  hotSalesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    gap: 16,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: (width - 64) / 3,
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
  bottomSpacing: {
    height: 100,
  },
});