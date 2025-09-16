// src/screens/ProductDetailsScreen.js - Using original design with Supabase data
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Button, Divider, Chip } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import SupabaseProductService from '../services/SupabaseProductService';
import { useCart } from '../context/CartContext';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.4;

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId, product: initialProduct } = route.params;
  const [product, setProduct] = useState(initialProduct || null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(!initialProduct);
  const [isFavorite, setIsFavorite] = useState(false);

  const { addToCart, isInCart, getCartItemQuantity } = useCart();

  console.log('ProductDetailsScreen mounted:', { productId, hasInitialProduct: !!initialProduct });

  useEffect(() => {
    if (!initialProduct) {
      loadProduct();
    } else {
      console.log('Using initial product data:', initialProduct.title);
      loadRelatedProducts();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      console.log('Loading product details for ID:', productId);
      
      const productData = await SupabaseProductService.getProductDetails(productId);
      
      if (productData) {
        console.log('Product loaded successfully:', productData.title);
        setProduct(productData);
        await SupabaseProductService.addToRecentlyViewed(productData);
        loadRelatedProducts();
      } else {
        console.log('Product not found for ID:', productId);
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading product details:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedProducts = async () => {
    try {
      const hotSales = await SupabaseProductService.getHotSales(10);
      setRelatedProducts(hotSales);
    } catch (error) {
      console.error('Error loading related products:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    if (product.quantity < 1) {
      Alert.alert('Out of Stock', 'This product is currently out of stock');
      return;
    }

    try {
      const cartItem = {
        id: product.autods_id,
        name: product.title,
        price: parseFloat(product.price),
        image: product.main_picture_url || (product.images && product.images[0]),
        quantity: quantity,
        maxQuantity: product.quantity,
        shippingPrice: parseFloat(product.shipping_price || 0)
      };

      await addToCart(cartItem);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Product added to cart!');
    } catch (error) {
      console.error('Add to cart error:', error);
      Alert.alert('Error', 'Failed to add product to cart');
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigation.navigate('Cart');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing product: ${product.title}`,
        title: product.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Haptics.selectionAsync();
  };

  const updateQuantity = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= (product?.quantity || 1)) {
      setQuantity(newQuantity);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(parseFloat(price) || 0);
  };

  const renderImageCarousel = () => {
    // Use main_picture_url first, then images array, then fallback
    const images = product.main_picture_url 
      ? [product.main_picture_url]
      : product.images && product.images.length > 0 
      ? product.images 
      : ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&h=600&fit=crop'];

    return (
      <View style={styles.imageCarousel}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
          scrollEventThrottle={16}
        >
          {images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.productImage}
              contentFit="cover"
            />
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  index === currentImageIndex && styles.activeIndicator,
                ]}
              />
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? "#e53e3e" : "white"}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderProductInfo = () => {
    if (!product) return null;

    // Calculate discount using supplier_price as original price
    const originalPrice = product.supplier_price;
    const currentPrice = parseFloat(product.price);
    const discountPercentage = originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : 0;

    return (
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{product.title}</Text>
          {product.supplier_title && (
            <Text style={styles.productBrand}>by {product.supplier_title}</Text>
          )}
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.currentPrice}>
            {formatPrice(product.price)}
          </Text>
          
          {originalPrice && originalPrice > currentPrice && (
            <View style={styles.discountContainer}>
              <Text style={styles.originalPrice}>
                {formatPrice(originalPrice)}
              </Text>
              <Chip style={styles.discountChip} textStyle={styles.discountChipText}>
                -{discountPercentage}%
              </Chip>
            </View>
          )}
        </View>

        {product.sold_count > 0 && (
          <View style={styles.ratingSection}>
            <View style={styles.stars}>
              <Ionicons name="trending-up" size={16} color="#4CAF50" />
            </View>
            <Text style={styles.ratingText}>
              {product.sold_count} sold
            </Text>
          </View>
        )}

        <View style={styles.stockSection}>
          {product.quantity > 0 ? (
            <View style={styles.stockInfo}>
              <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
              <Text style={styles.inStockText}>
                In Stock ({product.quantity} available)
              </Text>
            </View>
          ) : (
            <View style={styles.stockInfo}>
              <Ionicons name="close-circle" size={16} color="#f44336" />
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          
          <Text style={styles.freeShipping}>
            {parseFloat(product.shipping_price || 0) === 0 ? 'Free shipping' : `Shipping: ${formatPrice(product.shipping_price)}`}
          </Text>
        </View>

        <Divider style={styles.divider} />

        {product.description && (
          <>
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        {product.tags && product.tags.length > 0 && (
          <>
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.tagsContainer}>
                {product.tags.map((tag, index) => (
                  <Chip key={index} style={styles.tag} textStyle={styles.tagText}>
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
            <Divider style={styles.divider} />
          </>
        )}
      </View>
    );
  };

  const renderQuantitySelector = () => {
    if (!product || product.quantity === 0) return null;

    return (
      <View style={styles.quantitySection}>
        <Text style={styles.quantityLabel}>Quantity</Text>
        <View style={styles.quantityControls}>
          <TouchableOpacity
            style={[styles.quantityButton, quantity <= 1 && styles.disabledButton]}
            onPress={() => updateQuantity(-1)}
            disabled={quantity <= 1}
          >
            <Ionicons name="remove" size={20} color={quantity <= 1 ? "#ccc" : "#333"} />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{quantity}</Text>
          
          <TouchableOpacity
            style={[styles.quantityButton, quantity >= product.quantity && styles.disabledButton]}
            onPress={() => updateQuantity(1)}
            disabled={quantity >= product.quantity}
          >
            <Ionicons name="add" size={20} color={quantity >= product.quantity ? "#ccc" : "#333"} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => {
    if (!product) return null;

    const isInCartAlready = isInCart(product.autods_id);
    const cartQuantity = getCartItemQuantity(product.autods_id);

    return (
      <View style={styles.actionButtons}>
        {product.quantity > 0 ? (
          <>
            <TouchableOpacity
              style={[styles.addToCartButton, isInCartAlready && styles.inCartButton]}
              onPress={handleAddToCart}
            >
              <Ionicons 
                name={isInCartAlready ? "checkmark" : "bag-add-outline"} 
                size={20} 
                color="white" 
              />
              <Text style={styles.addToCartText}>
                {isInCartAlready ? `In Cart (${cartQuantity})` : 'Add to Cart'}
              </Text>
            </TouchableOpacity>

            <Button
              mode="contained"
              onPress={handleBuyNow}
              style={styles.buyNowButton}
              labelStyle={styles.buyNowText}
            >
              Buy Now
            </Button>
          </>
        ) : (
          <Button
            mode="outlined"
            disabled
            style={styles.outOfStockButton}
            labelStyle={styles.outOfStockButtonText}
          >
            Out of Stock
          </Button>
        )}
      </View>
    );
  };

  const renderRelatedProducts = () => {
    if (relatedProducts.length === 0) return null;

    return (
      <View style={styles.relatedSection}>
        <Text style={styles.relatedTitle}>You might also like</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedProducts}
        >
          {relatedProducts.map((relatedProduct) => (
            <TouchableOpacity
              key={relatedProduct.autods_id}
              style={styles.relatedProductCard}
              onPress={() => navigation.push('Product', { 
                productId: relatedProduct.autods_id,
                product: relatedProduct
              })}
            >
              <Image
                source={{ 
                  uri: relatedProduct.main_picture_url || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=200&h=200&fit=crop' 
                }}
                style={styles.relatedProductImage}
                contentFit="cover"
              />
              <View style={styles.relatedProductInfo}>
                <Text style={styles.relatedProductName} numberOfLines={2}>
                  {relatedProduct.title}
                </Text>
                <Text style={styles.relatedProductPrice}>
                  {formatPrice(relatedProduct.price)}
                </Text>
                {parseFloat(relatedProduct.shipping_price || 0) === 0 && (
                  <Text style={styles.relatedFreeShipping}>Free shipping</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e53e3e" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity 
          style={styles.goBackButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderImageCarousel()}
        {renderProductInfo()}
        {renderRelatedProducts()}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <View style={styles.bottomContainer}>
        {renderQuantitySelector()}
        {renderActionButtons()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  goBackButton: {
    backgroundColor: '#e53e3e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  goBackText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageCarousel: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  productImage: {
    width,
    height: IMAGE_HEIGHT,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  activeIndicator: {
    backgroundColor: 'white',
    width: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 50,
    right: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 16,
  },
  productHeader: {
    marginBottom: 12,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 30,
  },
  productBrand: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  priceSection: {
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginBottom: 4,
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountChip: {
    backgroundColor: '#e53e3e',
  },
  discountChipText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
  },
  stockSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inStockText: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '500',
  },
  outOfStockText: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '500',
  },
  freeShipping: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
  },
  divider: {
    marginVertical: 16,
    backgroundColor: '#e0e0e0',
  },
  descriptionSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f5f5f5',
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  relatedSection: {
    padding: 16,
    backgroundColor: '#fafafa',
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  relatedProducts: {
    gap: 12,
    paddingRight: 16,
  },
  relatedProductCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  relatedProductImage: {
    width: '100%',
    height: 120,
  },
  relatedProductInfo: {
    padding: 12,
  },
  relatedProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  relatedProductPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginBottom: 4,
  },
  relatedFreeShipping: {
    fontSize: 11,
    color: '#4caf50',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 100,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#e53e3e',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  inCartButton: {
    backgroundColor: '#4caf50',
  },
  addToCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#ff9800',
  },
  buyNowText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  outOfStockButton: {
    flex: 1,
    borderColor: '#ccc',
  },
  outOfStockButtonText: {
    color: '#999',
    fontSize: 16,
  },
});