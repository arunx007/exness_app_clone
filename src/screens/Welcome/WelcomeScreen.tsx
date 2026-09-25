import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GoogleLogo } from '../../components/common/GoogleLogo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Slide {
  id: string;
  image: any;
  title: string;
  subtitle: string;
  hasInfoIcon?: boolean;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    image: require('../../assets/images/slide1_gen_feathered.png'),
    title: 'Instant and fee-free\nwithdrawals',
    subtitle: 'Over 2 million withdrawals a month—98%\nprocessed automatically.',
    hasInfoIcon: true,
  },
  {
    id: '2',
    image: require('../../assets/images/slide2_gen_feathered.png'),
    title: 'The best spreads on gold,\noil, and bitcoin',
    subtitle: 'Trade key assets with the tightest spreads in\nthe market.',
    hasInfoIcon: true,
  },
  {
    id: '3',
    image: require('../../assets/images/slide3_gen_feathered.png'),
    title: 'Leverage on Crypto up to\n1:400',
    subtitle: 'Enjoy low spreads, swap-free trading, and\nflexible leverage on popular cryptocurrencies.',
    hasInfoIcon: false,
  },
];

interface WelcomeScreenProps {
  onRegister: () => void;
  onSignIn: () => void;
  onExploreDemo: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onRegister,
  onSignIn,
  onExploreDemo,
}) => {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // 2 second auto-scroll loop
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % SLIDES.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const handleScroll = (event: any) => {
    const scrollOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollOffset / SCREEN_WIDTH);
    if (index !== activeIndex && index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    return (
      <View style={[styles.slideContainer, { width: SCREEN_WIDTH }]}>
        {/* Seamless 3D Visual Artwork */}
        <View style={styles.imageContainer}>
          <Image
            source={item.image}
            style={styles.slideImage}
            resizeMode="contain"
          />
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title}</Text>
            {item.hasInfoIcon && (
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#6B7280"
                style={styles.infoIcon}
              />
            )}
          </View>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F5F7" />

      {/* Top Bar with Help Question Icon */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity activeOpacity={0.7} style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={26} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Swipeable Carousel */}
      <View style={styles.carouselWrapper}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
        />
      </View>

      {/* Pagination Dot Indicators (Exact 3 dots) */}
      <View style={styles.paginationRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* Bottom Action Buttons */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
        {/* Google Continue Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onExploreDemo}
          style={styles.googleButton}
        >
          <GoogleLogo size={20} />
          <Text style={styles.googleButtonText}>Google</Text>
        </TouchableOpacity>

        {/* Yellow Register Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onRegister}
          style={styles.registerButton}
        >
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>

        {/* Divider "or" */}
        <View style={styles.orDividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onSignIn}
          style={styles.signInButton}
        >
          <Text style={styles.signInButtonText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure clean white matching the transparent feathered background
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  helpButton: {
    padding: 4,
  },
  carouselWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    width: SCREEN_WIDTH * 0.82,
    height: SCREEN_WIDTH * 0.76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  textContent: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#111827',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  infoIcon: {
    marginLeft: 6,
    marginTop: 18,
  },
  subtitle: {
    color: '#374151',
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    fontWeight: '400',
    marginTop: 8,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#9CA3AF',
  },
  inactiveDot: {
    backgroundColor: '#E5E7EB',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    width: '100%',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 52,
    borderRadius: 8,
    marginBottom: 10,
  },
  googleButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 10,
  },
  registerButton: {
    backgroundColor: '#FFD200', // Signature vibrant Exness Yellow
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  orText: {
    color: '#6B7280',
    fontSize: 13,
    marginHorizontal: 12,
  },
  signInButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
});
