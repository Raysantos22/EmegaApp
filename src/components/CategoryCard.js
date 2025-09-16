// src/components/CategoryCard.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function CategoryCard({ category, onPress, style }) {
  const getGradientColors = (baseColor) => {
    // Create a gradient effect from the base color
    const lightColor = baseColor + '20'; // Add transparency
    const darkColor = baseColor + 'DD'; // Darker version
    return [lightColor, darkColor];
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={getGradientColors(category.color || '#e53e3e')}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={category.icon || 'grid-outline'}
            size={24}
            color="white"
          />
        </View>
        
        <Text style={styles.categoryName} numberOfLines={2}>
          {category.name}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  iconContainer: {
    marginBottom: 4,
  },
  categoryName: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 13,
  },
});