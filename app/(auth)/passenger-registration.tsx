import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Dimensions, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GoBangladeshLogo } from '../../components/GoBangladeshLogo';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { COLORS, SPACING } from '../../utils/constants';

const { width } = Dimensions.get('window');

export default function PassengerRegistration() {
  const [cardNumber, setCardNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = () => {
    router.back();
  };

  const validateCardNumber = (input: string) => {
    // Basic validation for card number (at least 6 digits)
    const cardRegex = /^\d{6,}$/;
    return cardRegex.test(input.trim());
  };

  const handleProceed = async () => {
    if (!validateCardNumber(cardNumber)) {
      Alert.alert('Invalid Card Number', 'Please enter a valid card number (at least 6 digits)');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call to check if card exists
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to personal info page with card number
      router.push({
        pathname: '/(auth)/registration-personal-info',
        params: { cardNumber: cardNumber.trim() }
      });
    }, 1000);
  };

  const handleLogin = () => {
    router.push('/(auth)/passenger-login');
  };

  return (
    <>
      <StatusBar style="dark" backgroundColor={COLORS.brand.background} translucent={false} />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      
        <View style={styles.content}>
          <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
            <View style={styles.logoContainer}>
              <GoBangladeshLogo size={60} />
            </View>
            
            <Text style={styles.title}>Student Registration</Text>
            <Text style={styles.subtitle}>
              Enter your card number to get started
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <Card variant="elevated" style={styles.cardContainer}>
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="card" size={32} color={COLORS.primary} />
                </View>
                
                <Input
                  label="Card Number"
                  value={cardNumber}
                  onChangeText={setCardNumber}
                  placeholder="Enter your card number"
                  keyboardType="numeric"
                  icon="card"
                  maxLength={16}
                />

                <Text style={styles.helperText}>
                  Enter the card number printed on your student/transport card
                </Text>

                <Button
                  title="Proceed"
                  onPress={handleProceed}
                  loading={isLoading}
                  disabled={!cardNumber.trim()}
                  icon="arrow-forward"
                  size="medium"
                  fullWidth
                />
              </View>
            </Card>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.duration(800).delay(400)} 
            style={styles.bottomSection}
          >
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginText}>
                Already have an account?
              </Text>
              <Text style={styles.loginLink}>
                Sign In
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.md,
    top: 48,
    padding: SPACING.sm,
    zIndex: 1,
  },
  logoContainer: {
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: COLORS.gray[600],
    paddingHorizontal: SPACING.md,
    lineHeight: 20,
  },
  cardContainer: {
    marginBottom: SPACING.md,
  },
  cardContent: {
    padding: SPACING.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.brand.blue_subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  helperText: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginVertical: SPACING.xs,
    lineHeight: 18,
  },
  bottomSection: {
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[300],
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    fontSize: 14,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  loginButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  loginLink: {
    fontSize: 16,
    textAlign: 'center',
    color: COLORS.primary,
    fontWeight: '600',
  },
});
