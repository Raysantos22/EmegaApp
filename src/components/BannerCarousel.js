// src/components/BannerCarousel.js - Enhanced with better auto-scroll
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
  const isScrollingManually = useRef(false);

  useEffect(() => {
    if (banners && banners.length > 1) {
      startAutoScroll();
    }
    return () => {
      stopAutoScroll();
    };
  }, [banners]);

  useEffect(() => {
    // Update auto scroll when currentIndex changes
    if (banners && banners.length > 1 && !isScrollingManually.current) {
      startAutoScroll();
    }
  }, [currentIndex]);

  const startAutoScroll = () => {
    stopAutoScroll();
    
    autoScrollRef.current = setInterval(() => {
      if (!isScrollingManually.current && banners && banners.length > 1) {
        const nextIndex = (currentIndex + 1) % banners.length;
        setCurrentIndex(nextIndex);
        
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            x: nextIndex * (BANNER_WIDTH + 16),
            animated: true,
          });
        }
      }
    }, 4000); // Auto scroll every 4 seconds
  };

  const stopAutoScroll = () => {
    if (autoScrollRef.current) {
      clearInterval(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };

  const handleScrollBeginDrag = () => {
    isScrollingManually.current = true;
    stopAutoScroll();
  };

  const handleScrollEndDrag = () => {
    // Small delay before restarting auto scroll
    setTimeout(() => {
      isScrollingManually.current = false;
      if (banners && banners.length > 1) {
        startAutoScroll();
      }
    }, 1000);
  };

  const handleMomentumScrollEnd = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / (BANNER_WIDTH + 16));
    
    if (newIndex >= 0 && newIndex < banners.length && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
    
    isScrollingManually.current = false;
  };

  const handleBannerPress = (banner) => {
    stopAutoScroll();
    if (onBannerPress) {
      onBannerPress(banner);
    }
    // Restart auto scroll after a delay
    setTimeout(() => {
      if (banners && banners.length > 1) {
        startAutoScroll();
      }
    }, 2000);
  };

  const renderBanner = (banner, index) => (
    <TouchableOpacity
      key={banner.id || index}
      style={styles.bannerContainer}
      onPress={() => handleBannerPress(banner)}
      activeOpacity={0.9}
    >
      <View style={styles.banner}>
        <Image
          source={{ uri: banner.image }}
          style={styles.bannerImage}
          contentFit="cover"
          placeholder={{ uri: 'https://via.placeholder.com/800x400/e53e3e/ffffff?text=Loading...' }}
          transition={300}
        />
        
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
          style={styles.bannerOverlay}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        
        <View style={styles.bannerContent}>
          <View style={styles.textContainer}>
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
          </View>
          
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
        <TouchableOpacity
          key={index}
          onPress={() => {
            setCurrentIndex(index);
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollTo({
                x: index * (BANNER_WIDTH + 16),
                animated: true,
              });
            }
          }}
        >
          <View
            style={[
              styles.indicator,
              index === currentIndex ? styles.activeIndicator : styles.inactiveIndicator,
            ]}
          />
        </TouchableOpacity>
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
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 8,
    lineHeight: 32,
  },
  bannerSubtitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    lineHeight: 20,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
  },
  activeIndicator: {
    width: 24,
    backgroundColor: '#e53e3e',
  },
  inactiveIndicator: {
    width: 8,
    backgroundColor: '#ddd',
  },
});