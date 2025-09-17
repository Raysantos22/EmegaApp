// src/screens/CartScreen.js - Fixed navigation and product ID issues
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Button, Divider, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useCart } from '../context/CartContext';

export default function CartScreen({ navigation }) {
  const {
    items,
    loading,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    loadCartItems,
  } = useCart();

  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCartItems();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCartItems();
    setRefreshing(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleQuantityChange = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    const success = await updateQuantity(itemId, newQuantity);
    if (success) {
      Haptics.selectionAsync();
    } else {
      Alert.alert('Error', 'Failed to update quantity');
    }
  };

  const handleRemoveItem = (itemId) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await removeFromCart(itemId);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Alert.alert('Error', 'Failed to remove item');
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    if (items.length === 0) return;

    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const success = await clearCart();
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Alert.alert('Error', 'Failed to clear cart');
            }
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add some items to your cart first');
      return;
    }

    // TODO: Implement checkout flow
    Alert.alert(
      'Checkout',
      'Checkout functionality will be implemented soon!',
      [{ text: 'OK' }]
    );
  };

  const handleContinueShopping = () => {
    // Navigate to HomeTab instead of just Home
    navigation.navigate('MainTabs', { 
      screen: 'HomeTab',
      params: { screen: 'Home' }
    });
  };

  const handleProductPress = (item) => {
    console.log('Cart item pressed:', {
      autods_id: item.autods_id,
      product_id: item.product_id,
      id: item.id,
      name: item.name
    });

    // Use the correct product ID - try autods_id first, then product_id, then id
    const productId = item.autods_id || item.product_id || item.id;
    
    if (productId) {
      navigation.navigate('Product', { 
        productId: productId,
        product: item
      });
    } else {
      console.error('No valid product ID found for cart item:', item);
      Alert.alert('Error', 'Unable to view product details');
    }
  };

  const renderCartItem = ({ item }) => {
    const itemTotal = item.price * item.quantity;
    const primaryImage = item.images && item.images.length > 0 
      ? item.images[0] 
      : item.image_url || item.main_picture_url || 'https://via.placeholder.com/100x100?text=No+Image';

    return (
      <View style={styles.cartItem}>
        <TouchableOpacity
          style={styles.productInfo}
          onPress={() => handleProductPress(item)}
        >
          <Image
            source={{ uri: primaryImage }}
            style={styles.productImage}
            contentFit="cover"
          />
          
          <View style={styles.productDetails}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name || item.title || item.product_name }
            </Text>
            
            <Text style={styles.productPrice}>
              {formatPrice(item.price)}
            </Text>
            
            {item.stock <= 5 && item.stock > 0 && (
              <Text style={styles.lowStockWarning}>
                Only {item.stock} left in stock
              </Text>
            )}
            
            {item.stock === 0 && (
              <Text style={styles.outOfStockWarning}>
                Out of stock
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.quantitySection}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.quantityButton, item.quantity <= 1 && styles.disabledButton]}
              onPress={() => handleQuantityChange(item.id, item.quantity, -1)}
            >
              <Ionicons 
                name="remove" 
                size={16} 
                color={item.quantity <= 1 ? "#ccc" : "#333"} 
              />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity
              style={[
                styles.quantityButton, 
                item.quantity >= item.stock && styles.disabledButton
              ]}
              onPress={() => handleQuantityChange(item.id, item.quantity, 1)}
              disabled={item.quantity >= item.stock}
            >
              <Ionicons 
                name="add" 
                size={16} 
                color={item.quantity >= item.stock ? "#ccc" : "#333"} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#f44336" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemTotal}>
          <Text style={styles.itemTotalText}>
            {formatPrice(itemTotal)}
          </Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.headerContent}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Shopping Cart</Text>
          {items.length > 0 && (
            <TouchableOpacity onPress={handleClearCart}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {items.length > 0 && (
          <Text style={styles.itemCount}>
            {getCartItemsCount()} item{getCartItemsCount() !== 1 ? 's' : ''} in your cart
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bag-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Looks like you haven't added anything to your cart yet
      </Text>
      <Button
        mode="contained"
        onPress={handleContinueShopping}
        style={styles.continueShoppingButton}
        labelStyle={styles.continueShoppingText}
      >
        Continue Shopping
      </Button>
    </View>
  );

  const renderCartSummary = () => {
    if (items.length === 0) return null;

    const subtotal = getCartTotal();
    const shipping = 0; // Free shipping
    const tax = subtotal * 0.12; // 12% VAT
    const total = subtotal + shipping + tax;

    return (
      <View style={styles.cartSummary}>
        <Divider style={styles.summaryDivider} />
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={[styles.summaryValue, styles.freeText]}>FREE</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax (12%)</Text>
          <Text style={styles.summaryValue}>{formatPrice(tax)}</Text>
        </View>
        
        <Divider style={styles.summaryDivider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(total)}</Text>
        </View>

        <Button
          mode="contained"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          labelStyle={styles.checkoutButtonText}
          disabled={items.some(item => item.stock === 0)}
        >
          Proceed to Checkout
        </Button>

        <TouchableOpacity
          style={styles.continueShoppingLink}
          onPress={handleContinueShopping}
        >
          <Text style={styles.continueShoppingLinkText}>
            Continue Shopping
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e53e3e" />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {items.length === 0 ? (
        renderEmptyCart()
      ) : (
        <FlatList
          data={items}
          renderItem={renderCartItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.cartList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ItemSeparatorComponent={() => <Divider style={styles.itemSeparator} />}
          ListFooterComponent={renderCartSummary}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
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
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  clearAllText: {
    fontSize: 14,
    color: '#e53e3e',
    fontWeight: '600',
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  cartList: {
    flex: 1,
  },
  cartItem: {
    backgroundColor: 'white',
    padding: 16,
  },
  productInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e53e3e',
    marginTop: 4,
  },
  lowStockWarning: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '500',
    marginTop: 4,
  },
  outOfStockWarning: {
    fontSize: 12,
    color: '#f44336',
    fontWeight: '500',
    marginTop: 4,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#f0f0f0',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    padding: 8,
  },
  itemTotal: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemSeparator: {
    backgroundColor: '#e0e0e0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  continueShoppingButton: {
    backgroundColor: '#e53e3e',
    paddingHorizontal: 32,
  },
  continueShoppingText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartSummary: {
    backgroundColor: 'white',
    padding: 16,
    marginTop: 8,
  },
  summaryDivider: {
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  freeText: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e53e3e',
  },
  checkoutButton: {
    backgroundColor: '#e53e3e',
    marginTop: 16,
    paddingVertical: 4,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueShoppingLink: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  continueShoppingLinkText: {
    fontSize: 14,
    color: '#e53e3e',
    fontWeight: '600',
  },
});