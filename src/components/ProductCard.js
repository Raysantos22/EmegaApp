// src/components/ProductCard.js
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
  const discountPercentage = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const primaryImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://via.placeholder.com/300x300?text=No+Image';

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
          source={{ uri: primaryImage }}
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

        {/* Featured Badge */}
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
        {product.stock <= 5 && product.stock > 0 && (
          <View style={styles.lowStockBadge}>
            <Text style={styles.lowStockText}>Only {product.stock} left</Text>
          </View>
        )}

        {product.stock === 0 && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
      </View>

      <View style={[styles.content, compact ? styles.compactContent : null]}>
        <Text style={[styles.name, compact ? styles.compactName : null]} numberOfLines={2}>
          {product.name}
        </Text>

        {!compact && product.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        )}

        <View style={styles.priceContainer}>
          <Text style={[styles.price, compact ? styles.compactPrice : null]}>
            {formatPrice(product.price)}
          </Text>
          
          {product.original_price && product.original_price > product.price && (
            <Text style={[styles.originalPrice, compact ? styles.compactOriginalPrice : null]}>
              {formatPrice(product.original_price)}
            </Text>
          )}
        </View>

        {!compact && (
          <>
            {/* Rating */}
            {product.rating > 0 && (
              <View style={styles.ratingContainer}>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= product.rating ? "star" : "star-outline"}
                      size={12}
                      color="#ffc107"
                    />
                  ))}
                </View>
                <Text style={styles.reviewsCount}>
                  ({product.reviews_count || 0})
                </Text>
              </View>
            )}

            {/* Free Shipping */}
            <View style={styles.shippingContainer}>
              <Text style={styles.freeShipping}>Free shipping</Text>
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