import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GoBangladeshLogo } from '../components/GoBangladeshLogo';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Text } from '../components/ui/Text';
import { useAuthStore } from '../stores/authStore';
import { COLORS, SPACING } from '../utils/constants';

export default function WelcomeScreen() {
  const { isAuthenticated, loadUserFromStorage } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkExistingUser();
  }, []);

  // Also check when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 [WELCOME] User is authenticated, redirecting to tabs...');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated]);

  const checkExistingUser = async () => {
    setIsLoading(true);
    console.log('🔍 [WELCOME] Checking existing user...');
    
    try {
      await loadUserFromStorage();
      
      if (isAuthenticated) {
        console.log('✅ [WELCOME] User is authenticated, redirecting to tabs...');
        router.replace('/(tabs)');
      } else {
        console.log('ℹ️ [WELCOME] User is not authenticated, showing welcome screen');
      }
    } catch (error) {
      console.error('❌ [WELCOME] Error checking existing user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    router.push('/(auth)/passenger-login');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Animated.View entering={FadeInUp.duration(800)}>
            <Ionicons name="sync" size={32} color={COLORS.primary} />
            <Text variant="body" color={COLORS.gray[600]} style={styles.loadingText}>
              Loading...
            </Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.header}>
          <View style={styles.logoContainer}>
            <GoBangladeshLogo size={140} />
          </View>
          <Text variant="h1" color={COLORS.gray[900]} style={styles.title}>
            Go Bangladesh
          </Text>
          <Text variant="h6" color={COLORS.primary} style={styles.subtitle}>
            One step toward a better future
          </Text>
          <Text variant="body" color={COLORS.gray[600]} style={styles.description}>
            Your convenient way to pay for transport with RFID card technology
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.buttonContainer}>
          <Card variant="elevated" delay={0}>
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              variant="primary"
              size="large"
              icon="arrow-forward"
              fullWidth
            />
          </Card>
        </Animated.View>
        
        <Animated.View entering={FadeInUp.duration(800).delay(600)}>
          <Text variant="caption" color={COLORS.gray[500]} style={styles.note}>
            Safe • Secure • Friendly
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl * 2,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    padding: SPACING.md,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.xs,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  description: {
    textAlign: 'center',
    paddingHorizontal: SPACING.lg,
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: SPACING.xl,
  },
  note: {
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
