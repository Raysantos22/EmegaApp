// src/components/AnimatedBannerCarousel.js - Fixed version
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';

const { width: screenWidth } = Dimensions.get('window');

const AnimatedBannerCarousel = ({
  banners = [],
  onBannerPress = () => {},
  height = 200,
  autoSlide = true,
  slideInterval = 4000,
  showPagination = true,
  showGradient = true,
  borderRadius = 12,
  style = {},
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);

  useEffect(() => {
    // console.log('Banner component mounted with:', {
    //   bannerCount: banners.length,
    //   autoSlide,
    //   currentIndex
    // });
    
    if (autoSlide && banners.length > 1) {
      // console.log('Starting auto-slide with interval:', slideInterval);
      startAutoSlide();
    } else {
      console.log('Auto-slide not started:', { autoSlide, bannerCount: banners.length });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        // console.log('Cleared auto-slide interval');
      }
    };
  }, [autoSlide, banners.length, currentIndex]);

  const startAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      goToNext();
    }, slideInterval);
  };

  const stopAutoSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const goToNext = () => {
    const nextIndex = (currentIndex + 1) % banners.length;
    // console.log('Going to next slide:', { currentIndex, nextIndex });
    goToSlide(nextIndex);
  };

  const goToPrevious = () => {
    const prevIndex = currentIndex === 0 ? banners.length - 1 : currentIndex - 1;
    goToSlide(prevIndex);
  };

  const goToSlide = (index) => {
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Change slide
      setCurrentIndex(index);
      
      // Slide animation
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: index > currentIndex ? -50 : 50,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
  };

  const handleBannerPress = (banner) => {
    console.log('Banner carousel - banner pressed:', banner);
    try {
      onBannerPress(banner);
    } catch (error) {
      console.error('Error in banner press handler:', error);
    }
  };

  if (!banners.length) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <View style={[styles.container, { height }, style]}>
      <Animated.View
        style={[
          styles.bannerContainer,
          {
            transform: [{ translateX: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.banner, { borderRadius }]}
          onPress={() => handleBannerPress(currentBanner)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: currentBanner.image }}
            style={[styles.bannerImage, { borderRadius }]}
            contentFit="cover"
            transition={300}
          />
          
          {showGradient && (
            <View style={[styles.gradient, { borderRadius }]} />
          )}
          
          <View style={styles.textContainer}>
            <Text
              style={[
                styles.title,
                { color: currentBanner.text_color || 'white' }
              ]}
            >
              {currentBanner.title}
            </Text>
            {currentBanner.subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  { color: currentBanner.text_color || 'white' }
                ]}
              >
                {currentBanner.subtitle}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>

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
                if (autoSlide) setTimeout(startAutoSlide, 1000);
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
  bannerContainer: {
    flex: 1,
  },
  banner: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
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

export default AnimatedBannerCarousel;