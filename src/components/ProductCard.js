// src/components/ProductCard.js - Fixed for Supabase data
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function ProductCard({ 
  product, 
  onPress, 
  style, 
  showDiscount = false,
  compact = false 
}) {
  // Handle both original_price and price fields for discount calculation
  const originalPrice = product.original_price || product.supplier_price;
  const currentPrice = parseFloat(product.price) || 0;
  const discountPercentage = originalPrice && originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  const formatPrice = (price) => {
    const numPrice = parseFloat(price) || 0;
    return `$${numPrice.toFixed(2)}`;
  };

  // Handle different image field structures
  const getProductImage = () => {
    // First try main_picture_url (Supabase field)
    if (product.main_picture_url) {
      return product.main_picture_url;
    }
    
    // Then try images array
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    
    // Fallback
    return 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=300&fit=crop';
  };

  // Get product stock (quantity in Supabase)
  const stockCount = parseInt(product.quantity || product.stock) || 0;
  
  // Get product name (title in Supabase)
  const productName = product.title || product.name || 'Unnamed Product';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        compact ? styles.compactContainer : null,
        style
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.imageContainer, compact ? styles.compactImageContainer : null]}>
        <Image
          source={{ uri: getProductImage() }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        
        {/* Discount Badge */}
        {showDiscount && discountPercentage > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercentage}%</Text>
          </View>
        )}

        {/* Featured Badge - check if product is featured */}
        {product.is_featured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color="white" />
          </View>
        )}

        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={18} color="#666" />
        </TouchableOpacity>

        {/* Stock Status */}
        {stockCount <= 5 && stockCount > 0 && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>Only {stockCount} left</Text>
          </View>
        )}

        {stockCount === 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={[styles.content, compact ? styles.compactContent : null]}>
        <Text style={[styles.name, compact ? styles.compactName : null]} numberOfLines={2}>
          {productName}
        </Text>

        {!compact && product.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        )}

        <View style={styles.priceContainer}>
          <Text style={[styles.price, compact ? styles.compactPrice : null]}>
            {formatPrice(currentPrice)}
          </Text>
          
          {originalPrice && originalPrice > currentPrice && (
            <Text style={[styles.originalPrice, compact ? styles.compactOriginalPrice : null]}>
              {formatPrice(originalPrice)}
            </Text>
          )}
        </View>

        {!compact && (
          <>
            {/* Rating - use sold_count as popularity indicator */}
            {product.sold_count > 0 && (
              <View style={styles.ratingContainer}>
                <Ionicons name="trending-up" size={12} color="#4CAF50" />
                <Text style={styles.reviewsCount}>
                  {product.sold_count} sold
                </Text>
              </View>
            )}

            {/* Shipping */}
            <View style={styles.shippingContainer}>
              <Text style={styles.freeShipping}>
                {parseFloat(product.shipping_price || 0) === 0 ? 'Free shipping' : `Shipping: ${formatPrice(product.shipping_price)}`}
              </Text>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: CARD_WIDTH,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  compactContainer: {
    width: CARD_WIDTH * 0.8,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  compactImageContainer: {
    height: 140,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#e53e3e',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff9800',
    padding: 4,
    borderRadius: 6,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    padding: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  lowStockBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#ff9800',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lowStockText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  outOfStockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  compactContent: {
    padding: 8,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  compactName: {
    fontSize: 13,
    marginBottom: 2,
  },
  brand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginRight: 6,
  },
  compactPrice: {
    fontSize: 14,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  compactOriginalPrice: {
    fontSize: 11,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 4,
  },
  reviewsCount: {
    fontSize: 11,
    color: '#666',
    marginLeft: 4,
  },
  shippingContainer: {
    marginTop: 4,
  },
  freeShipping: {
    fontSize: 11,
    color: '#4caf50',
    fontWeight: '600',
  },
});