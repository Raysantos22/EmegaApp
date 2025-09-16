// src/components/BannerCarousel.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;
const BANNER_HEIGHT = 180;

export default function BannerCarousel({ banners, onBannerPress, style }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const autoScrollRef = useRef(null);

  useEffect(() => {
    if (banners.length > 1) {
      startAutoScroll();
    }
    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, [banners.length]);

  const startAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
    }
    
    autoScrollRef.current = setInterval(() => {
      const nextIndex = (currentIndex + 1) % banners.length;
      setCurrentIndex(nextIndex);
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: nextIndex * (BANNER_WIDTH + 16),
          animated: true,
        });
      }
    }, 4000); // Auto scroll every 4 seconds
  };

  const handleScroll = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / (BANNER_WIDTH + 16));
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < banners.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleMomentumScrollEnd = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / (BANNER_WIDTH + 16));
    setCurrentIndex(newIndex);
    
    // Restart auto scroll after manual scroll
    if (banners.length > 1) {
      startAutoScroll();
    }
  };

  const renderBanner = (banner, index) => (
    <TouchableOpacity
      key={banner.id || index}
      style={styles.bannerContainer}
      onPress={() => onBannerPress(banner)}
      activeOpacity={0.9}
    >
      <View style={styles.banner}>
        <Image
          source={{ uri: banner.image }}
          style={styles.bannerImage}
          contentFit="cover"
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.bannerOverlay}
        />
        
        <View style={styles.bannerContent}>
          {banner.title && (
            <Text style={[styles.bannerTitle, { color: banner.text_color || 'white' }]}>
              {banner.title}
            </Text>
          )}
          
          {banner.subtitle && (
            <Text style={[styles.bannerSubtitle, { color: banner.text_color || 'white' }]}>
              {banner.subtitle}
            </Text>
          )}
          
          <View style={styles.bannerButton}>
            <Text style={styles.bannerButtonText}>Shop Now</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderIndicators = () => (
    <View style={styles.indicatorsContainer}>
      {banners.map((_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            index === currentIndex ? styles.activeIndicator : styles.inactiveIndicator,
          ]}
        />
      ))}
    </View>
  );

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH + 16}
        snapToAlignment="start"
      >
        {banners.map((banner, index) => renderBanner(banner, index))}
      </ScrollView>
      
      {banners.length > 1 && renderIndicators()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  bannerContainer: {
    width: BANNER_WIDTH,
  },
  banner: {
    height: BANNER_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#e53e3e',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerContent: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    justifyContent: 'space-between',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 'auto',
  },
  bannerButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  indicator: {
    height: 6,
    borderRadius: 3,
  },
  activeIndicator: {
    width: 20,
    backgroundColor: '#e53e3e',
  },
  inactiveIndicator: {
    width: 6,
    backgroundColor: '#ddd',
  },
});