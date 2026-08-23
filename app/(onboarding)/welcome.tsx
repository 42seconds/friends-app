import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '../../src/context/OnboardingContext';

const { width } = Dimensions.get('window');

// Content for the 3 slides. Kept as plain data so the render logic
// below stays generic — add/remove slides here without touching JSX.
const SLIDES = [
  {
    title: 'Welcome to &FRIENDS',
    body: 'Discover events happening around Braamfontein, all in one place.',
  },
  {
    title: '&TALK  ·  &FUN  ·  &MUSIC  ·  &FOOD',
    body: 'Four sub-brands, one platform — talks, parties, live music, and food experiences.',
  },
  {
    title: 'Book. Pay. Scan In.',
    body: 'Reserve your spot, upload proof of payment, and get a QR code ticket once your booking is confirmed.',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { markOnboardingSeen } = useOnboarding();
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Tracks which slide is currently centered as the user swipes,
  // so the dot indicator and button label stay in sync with position.
  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  const isLastSlide = activeIndex === SLIDES.length - 1;

  // On the last slide, "Next" becomes "Get Started" — completing
  // onboarding sets the device flag then sends the user to Login.
  // On earlier slides, it just scrolls forward programmatically,
  // useful for anyone tapping instead of swiping.
  const handleNext = async () => {
    if (isLastSlide) {
      await markOnboardingSeen();
      router.replace('/(auth)/login');
    } else {
      scrollRef.current?.scrollTo({ x: width * (activeIndex + 1), animated: true });
    }
  };

  // Skip bypasses the rest of the slides entirely but still sets the
  // flag — someone who skips shouldn't see onboarding again either.
  const handleSkip = async () => {
    await markOnboardingSeen();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  skip: { position: 'absolute', top: 56, right: 24, zIndex: 1 },
  skipText: { color: '#888888', fontSize: 15, fontWeight: '600' },
  slide: {
    width,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eee',
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#C1502E', width: 20 },
  button: {
    backgroundColor: '#C1502E',
    marginHorizontal: 32,
    marginBottom: 40,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});