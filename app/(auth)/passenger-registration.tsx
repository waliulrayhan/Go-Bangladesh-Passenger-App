import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      
      // Check if card content exists
      if (!validationResponse.content) {
        Alert.alert(
          'Card Not Found', 
          'Card not found. Please check your card number and try again.'
        );
        setIsLoading(false);
        return;
      }
      
      // Check if card is available based on the message
      if (validationResponse.message !== 'This card is available!') {
        Alert.alert(
          'Card Not Available', 
          'This card is not available for registration. Please contact support if this is your card.'
        );
        setIsLoading(false);
        return;
      }
      
      // If card is available, proceed to personal info page
      console.log('✅ Card is available for registration');
      console.log('🏢 Organization Type:', validationResponse.content.organization.organizationType);
      console.log('📋 Card Status:', validationResponse.content.status);
      console.log('💬 Message:', validationResponse.message);
      
      router.push({
        pathname: '/(auth)/registration-personal-info',
        params: { 
          cardNumber: cardNumber.trim(),
          organizationType: validationResponse.content.organization.organizationType,
          organizationId: validationResponse.content.organizationId,
          organizationName: validationResponse.content.organization.name
        }
      });
      
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
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.container}>
        {/* Dreamy Sky Pink + Cool Blue Dual Glow */}
        <LinearGradient
          colors={[
            'rgba(173, 216, 230, 0.35)',  // Light Blue at top
            'rgba(173, 216, 230, 0.2)', 
            'transparent',
            'rgba(255, 182, 193, 0.2)',   // Light Pink transition  
            'rgba(255, 182, 193, 0.4)'    // Light Pink at bottom
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          style={styles.glowBackground}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 0.7, y: 1 }}
        />
        
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
      
        <View style={styles.content}>
          <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
            <View style={styles.logoContainer}>
              <GoBangladeshLogo size={60} />
            </View>
            
            <Text variant="h3" color={COLORS.white} style={styles.title}>User Registration</Text>
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
                    placeholder="(e.g. ABCD1234)"
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
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.md,
    top: 60, // Increased for translucent status bar
    padding: SPACING.sm,
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: SPACING.sm,
  },
  title: {
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
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    zIndex: 0,
  },
});
