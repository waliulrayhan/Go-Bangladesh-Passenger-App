import { useFonts } from 'expo-font';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GoBangladeshLogo } from '../components/GoBangladeshLogo';
import { BubbleAnimation } from '../components/ui/BubbleAnimation';
import { Button } from '../components/ui/Button';
import { GradientBackground } from '../components/ui/GradientBackground';
import { Text } from '../components/ui/Text';
import { useAuthStore } from '../stores/authStore';
import { COLORS, SPACING } from '../utils/constants';
import { plusJakartaSansFonts } from '../utils/fonts';

export default function WelcomeScreen() {
  const { isAuthenticated, loadUserFromStorage } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fontsLoaded] = useFonts(plusJakartaSansFonts);

  useEffect(() => {
    initializeApp();
  }, []);

  // Only redirect after initialization is complete
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      console.log('🔄 [WELCOME] User is authenticated, redirecting to tabs...');
      router.replace('/(tabs)');
    }
  }, [isInitialized, isAuthenticated]);

  // Log font loading status
  useEffect(() => {
    if (fontsLoaded) {
      console.log('🎨 [WELCOME] Plus Jakarta Sans fonts are ready');
    }
  }, [fontsLoaded]);

  const initializeApp = async () => {
    setIsLoading(true);
    console.log('� [WELCOME] Initializing app and checking authentication...');
    
    try {
      await loadUserFromStorage();
      console.log('✅ [WELCOME] Authentication check completed');
    } catch (error) {
      console.error('❌ [WELCOME] Error during app initialization:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const handleGetStarted = () => {
    router.push('/(auth)/passenger-login');
  };

  if (isLoading || !isInitialized || !fontsLoaded) {
    return (
      <GradientBackground variant="subtle">
        <SafeAreaView style={styles.container}>
          <BubbleAnimation bubbleCount={10} />
          <View style={styles.loadingContainer}>
            <Animated.View entering={FadeInUp.duration(800)}>
              <GoBangladeshLogo size={80} />
            </Animated.View>
            <Animated.View entering={FadeInDown.duration(800).delay(200)}>
              <Text variant="body" color={COLORS.gray[600]} style={styles.loadingText}>
                {!fontsLoaded ? 'Loading fonts...' : 'Loading...'}
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  // Only show welcome screen if user is definitely not authenticated
  if (isInitialized && !isAuthenticated) {
    return (
      <GradientBackground variant="primary">
        <SafeAreaView style={styles.container}>
          <BubbleAnimation bubbleCount={15} />
          <View style={styles.content}>
          <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.header}>
            <View style={styles.logoContainer}>
              <GoBangladeshLogo size={120} />
            </View>
            <Text 
              variant="h1" 
              color={COLORS.white} 
              style={[
                styles.title, 
                { 
                  fontFamily: 'PlusJakartaSans_700Bold',
                  fontWeight: undefined,  // Clear any fontWeight conflicts
                  lineHeight: 42,  // Increased from default to prevent cutoff
                  paddingVertical: 4,  // Add padding to ensure descenders show
                }
              ]}
            >
              Go Bangladesh
            </Text>
            <Text variant="h6" color={COLORS.white} style={[styles.subtitle, { fontFamily: 'PlusJakartaSans_500Medium' }]}>
              One step toward a better future
            </Text>
            <Text variant="body" color={COLORS.gray[600]} style={styles.description}>
              Your convenient way to pay for transport with RFID card technology
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.buttonContainer}>
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              variant="primary"
              size="large"
              icon="arrow-forward"
              fullWidth
            />
          </Animated.View>
          
          <Animated.View entering={FadeInUp.duration(800).delay(600)}>
            <Text variant="caption" color={COLORS.gray[500]} style={styles.note}>
              Safe • Secure • Friendly
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
      </GradientBackground>
    );
  }

  // Return null if user is authenticated (will redirect to tabs)
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING.sm,
    backgroundColor: COLORS.white + '99',
    borderRadius: 60,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.xs,
    textShadowColor: COLORS.white + '40',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: SPACING.sm,
    textShadowColor: COLORS.white + '30',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: SPACING.sm,
    lineHeight: 24,
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  buttonContainer: {
    marginBottom: SPACING['4xl'],
  },
  note: {
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    fontStyle: 'italic',
    padding: SPACING.sm,
    borderRadius: 20,
    alignSelf: 'center',
  },
});
