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
import { apiService } from '../../services/api';
import { COLORS, SPACING } from '../../utils/constants';

const { width } = Dimensions.get('window');

export default function PassengerRegistration() {
  const [cardNumber, setCardNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = () => {
    router.back();
  };

  const validateCardNumber = (input: string) => {
    // Validation for card number (at least 8 characters, only capital letters and numbers)
    const cardRegex = /^[A-Z0-9]{8,}$/;
    return cardRegex.test(input.trim());
  };

  const handleCardNumberChange = (text: string) => {
    // Convert to uppercase and filter only letters and numbers
    const filteredText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCardNumber(filteredText);
  };

  const handleProceed = async () => {
    if (!validateCardNumber(cardNumber)) {
      Alert.alert('Invalid Card Number', 'Please enter a valid card number (at least 8 characters, letters and numbers only)');
      return;
    }

    setIsLoading(true);
    
    try {
      // Check card validity using API
      console.log('🔍 Checking card validity for:', cardNumber);
      const validationResponse = await apiService.checkCardValidity(cardNumber.trim());
      
      if (!validationResponse.isSuccess) {
        Alert.alert(
          'Card Issue', 
          validationResponse.message || 'This card is not available for registration'
        );
        setIsLoading(false);
        return;
      }
      
      // Check if the card is available (not already in use)
      if (validationResponse.message.includes('already in use')) {
        Alert.alert(
          'Card Already In Use', 
          'This card is already registered to another user. Please contact support if this is your card.'
        );
        setIsLoading(false);
        return;
      }
      
      if (validationResponse.message.includes('not available')) {
        Alert.alert(
          'Card Not Available', 
          'This card is not available for registration. Please check your card number or contact support.'
        );
        setIsLoading(false);
        return;
      }
      
      // If card is available, proceed to personal info page
      if (validationResponse.message.includes('available')) {
        console.log('✅ Card is available for registration');
        router.push({
          pathname: '/(auth)/registration-personal-info',
          params: { cardNumber: cardNumber.trim() }
        });
      }
      
    } catch (error: any) {
      console.error('❌ Card validation error:', error);
      Alert.alert(
        'Connection Error', 
        'Unable to verify card. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
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
            
            <Text style={styles.title}>Registration</Text>
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
                
                <View style={styles.inputContainer}>
                  <Input
                    label="Card Number"
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                    placeholder="Enter your card number (e.g. ABC123456)"
                    keyboardType="default"
                    icon="card"
                    maxLength={16}
                    autoCapitalize="characters"
                  />
                </View>

                <Text style={styles.helperText}>
                  Enter the card number printed on your Go Bangladesh transport card
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
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.md,
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
  inputContainer: {
    width: '100%',
    alignSelf: 'stretch',
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
