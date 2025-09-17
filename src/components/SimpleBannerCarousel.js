// src/components/SimpleBannerCarousel.js - Fallback banner component without dependencies
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';

const { width: screenWidth } = Dimensions.get('window');

const SimpleBannerCarousel = ({
  banners = [],
  onBannerPress = () => {},
  height = 200,
  autoSlide = true,
  slideInterval = 4000,
  showPagination = true,
  borderRadius = 12,
  style = {},
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (autoSlide && banners.length > 1) {
      startAutoSlide();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoSlide, banners.length]);

  const startAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const nextIndex = (currentIndex + 1) % banners.length;
      goToSlide(nextIndex);
    }, slideInterval);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * (screenWidth - 32),
        animated: true,
      });
    }
  };

  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (screenWidth - 32));
    if (index !== currentIndex && index >= 0 && index < banners.length) {
      setCurrentIndex(index);
    }
  };

  if (!banners.length) {
    return null;
  }

  return (
    <View style={[styles.container, { height }, style]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchStart={stopAutoSlide}
        onTouchEnd={() => {
          if (autoSlide) {
            setTimeout(startAutoSlide, 2000);
          }
        }}
      >
        {banners.map((banner, index) => (
          <TouchableOpacity
            key={banner.id || index}
            style={[styles.banner, { width: screenWidth - 32, borderRadius }]}
            onPress={() => onBannerPress(banner)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: banner.image }}
              style={[styles.bannerImage, { borderRadius }]}
              contentFit="cover"
            />
            
            <View style={[styles.gradient, { borderRadius }]} />
            
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.title,
                  { color: banner.text_color || 'white' }
                ]}
              >
                {banner.title}
              </Text>
              {banner.subtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    { color: banner.text_color || 'white' }
                  ]}
                >
                  {banner.subtitle}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {showPagination && banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot
              ]}
              onPress={() => {
                stopAutoSlide();
                goToSlide(index);
                if (autoSlide) setTimeout(startAutoSlide, 2000);
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  banner: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 0,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  textContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: 'white',
    width: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default SimpleBannerCarousel;