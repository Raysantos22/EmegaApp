// src/context/CartContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import DatabaseService from '../services/DatabaseService';

const CartContext = createContext();

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART_ITEMS':
      return {
        ...state,
        items: action.payload,
        loading: false,
      };
    
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? { ...item, ...action.payload } : item
        ),
      };
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    
    default:
      return state;
  }
};

const initialState = {
  items: [],
  loading: true,
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    loadCartItems();
  }, []);

  const loadCartItems = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const items = await DatabaseService.getCartItems();
      dispatch({ type: 'SET_CART_ITEMS', payload: items });
    } catch (error) {
      console.error('Failed to load cart items:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await DatabaseService.addToCart(productId, quantity);
      await loadCartItems(); // Refresh cart
      return true;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await DatabaseService.updateCartItemQuantity(itemId, quantity);
      
      if (quantity <= 0) {
        dispatch({ type: 'REMOVE_ITEM', payload: itemId });
      } else {
        dispatch({ type: 'UPDATE_ITEM', payload: { id: itemId, quantity } });
      }
      return true;
    } catch (error) {
      console.error('Failed to update quantity:', error);
      return false;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await DatabaseService.updateCartItemQuantity(itemId, 0);
      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
      return true;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      return false;
    }
  };

  const clearCart = async () => {
    try {
      await DatabaseService.clearCart();
      dispatch({ type: 'CLEAR_CART' });
      return true;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      return false;
    }
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const isInCart = (productId) => {
    return state.items.some(item => item.product_id === productId);
  };

  const getCartItemQuantity = (productId) => {
    const item = state.items.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    ...state,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    isInCart,
    getCartItemQuantity,
    loadCartItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};