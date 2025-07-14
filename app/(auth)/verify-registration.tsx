import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Card } from '../../components/ui/Card';
import { Text } from '../../components/ui/Text';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useCardStore } from '../../stores/cardStore';
import { COLORS, SPACING } from '../../utils/constants';
import { storageService } from '../../utils/storage';

export default function VerifyRegistration() {
  const params = useLocalSearchParams<{
    cardNumber: string;
    name: string;
    phone: string;
    email?: string;
    gender: 'male' | 'female';
    address: string;
    dateOfBirth: string;
  }>();

  const { login } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Handle back button on Android
    const backAction = () => {
      router.back();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.length === 6) {
      // Small delay to ensure UI updates first
      setTimeout(() => {
        handleVerify(newOtp.join(''));
      }, 100);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const otpString = otpCode || otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Verifying OTP for:', params.phone);
      
      // Verify OTP with API
      const verificationResult = await apiService.verifyOTP(params.phone, otpString);
      
      if (verificationResult) {
        console.log('✅ OTP verification successful');
        
        // After successful OTP verification, login using the user's actual password
        console.log('🔑 Logging in user with stored credentials...');
        
        // Retrieve stored registration data
        const tempData = await storageService.getItem<any>('temp_registration_data');
        console.log('🔍 Retrieved temp data:', tempData);
        
        if (!tempData) {
          console.error('❌ No stored registration data found');
          setIsLoading(false);
          
          Alert.alert(
            'Registration Complete',
            'Your account has been created successfully. Please log in with your credentials.',
            [
              {
                text: 'Go to Login',
                onPress: () => {
                  router.replace('/(auth)/passenger-login');
                }
              }
            ]
          );
          return;
        }
        
        // Clean up temporary storage immediately
        await storageService.removeItem('temp_registration_data');
        
        // Use loginWithPassword with the stored password
        const { loginWithPassword } = useAuthStore.getState();
        const loginSuccess = await loginWithPassword(tempData.phone, tempData.password);
        
        if (loginSuccess) {
          // Load card data using the store's loadCardDetails method
          try {
            await useCardStore.getState().loadCardDetails();
          } catch (cardError) {
            console.log('ℹ️ Card data loading failed:', cardError);
          }
          
          setIsLoading(false);
          
          Alert.alert(
            'Registration Successful!',
            'Your account has been created successfully. Welcome to Go Bangladesh!',
            [
              {
                text: 'Continue',
                onPress: () => {
                  router.replace('/(tabs)');
                }
              }
            ]
          );
        } else {
          // If login fails, still show success message but redirect to login
          setIsLoading(false);
          
          Alert.alert(
            'Registration Complete',
            'Your account has been created successfully. Please log in to continue.',
            [
              {
                text: 'Go to Login',
                onPress: () => {
                  router.replace('/(auth)/passenger-login');
                }
              }
            ]
          );
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('❌ OTP verification error:', error);
      
      let errorMessage = 'Invalid OTP. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      }
      
      Alert.alert('Verification Failed', errorMessage);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    
    try {
      console.log('🔄 Resending OTP to:', params.phone);
      
      // Resend OTP using API
      await apiService.sendOTP(params.phone);
      
      console.log('✅ OTP resent successfully');
      
      setIsResending(false);
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();
      
      Alert.alert('OTP Sent', 'A new OTP has been sent to your mobile number.');
    } catch (error: any) {
      setIsResending(false);
      console.error('❌ Resend OTP error:', error);
      
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <StatusBar style="dark" backgroundColor={COLORS.brand.background} translucent={false} />
      <SafeAreaView style={styles.container}>
        {/* Orange Soft Glow Background */}
        <LinearGradient
          colors={['#FF7112', 'transparent']}
          locations={[0, 1]}
          style={[styles.glowBackground, { opacity: 0.3, mixBlendMode: 'multiply' }]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
        
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
            </View>
            
            <Text variant="h1" color={COLORS.white} style={styles.title}>Verify Your Mobile Number</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.phoneNumber}>{params.phone}</Text>
            </Text>

            <View style={styles.userInfo}>
              <Text style={styles.infoLabel}>Registering:</Text>
              <Text style={styles.infoValue}>{params.name}</Text>
              <Text style={styles.cardInfo}>Card: {params.cardNumber}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <Card variant="elevated">
              <View style={styles.otpContainer}>
                <Text style={styles.otpLabel}>Enter OTP</Text>
                
                <View style={styles.otpInputContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      style={[
                        styles.otpInput,
                        digit && styles.otpInputFilled
                      ]}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      autoFocus={index === 0}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                <View style={styles.resendContainer}>
                  {canResend ? (
                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={handleResendOTP}
                      disabled={isResending}
                    >
                      <Text style={styles.resendText}>
                        {isResending ? 'Sending...' : 'Resend OTP'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.countdownText}>
                      Resend OTP in {formatTime(countdown)}
                    </Text>
                  )}
                </View>

                <Text style={styles.helpText}>
                  Enter all 6 digits for automatic verification.{'\n'}
                  Didn't receive the code? Check your SMS or try resending.
                </Text>
              </View>
            </Card>
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
    top: 48,
    padding: SPACING.sm,
    zIndex: 2,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  phoneNumber: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  userInfo: {
    backgroundColor: COLORS.brand.orange_subtle,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.gray[900],
    fontWeight: '600',
  },
  cardInfo: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  otpContainer: {
    padding: SPACING.md,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  otpInput: {
    width: 40,
    height: 48,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    backgroundColor: COLORS.white,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.brand.blue_subtle,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  resendButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  countdownText: {
    color: COLORS.gray[600],
    fontSize: 14,
  },
  helpText: {
    textAlign: 'center',
    color: COLORS.gray[600],
    fontSize: 12,
    marginTop: SPACING.sm,
    lineHeight: 16,
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
