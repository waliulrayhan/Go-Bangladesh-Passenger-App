import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, SafeAreaView, StatusBar, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, STORAGE_KEYS } from '../../utils/constants';
import { storageService } from '../../utils/storage';

export default function PassengerLoginOTP() {
  const params = useLocalSearchParams<{
    identifier: string;
    mobileNumber: string;
  }>();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { login, sendOTP, isLoading } = useAuthStore();

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
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyLogin = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP.');
      return;
    }

    try {
      // Save user type as passenger
      await storageService.setItem(STORAGE_KEYS.USER_TYPE, 'passenger');

      const success = await login(params.mobileNumber, otpString, 'passenger');
      
      if (success) {
        // Direct navigation without popup
        router.replace('/(tabs)');
      } else {
        Alert.alert('Invalid OTP', 'The OTP you entered is incorrect. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    
    try {
      const sent = await sendOTP(params.mobileNumber);
      
      if (sent) {
        setOtp(['', '', '', '', '', '']);
        setCountdown(60);
        setCanResend(false);
        inputRefs.current[0]?.focus();
        Alert.alert('OTP Sent', 'A new OTP has been sent to your mobile number.');
      } else {
        Alert.alert('Error', 'Failed to resend OTP. Please try again.');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayIdentifier = () => {
    // If user entered phone number, show it's for card login attempt
    // If user entered card number, show it's for phone login attempt
    if (params.identifier.match(/^(\+?88)?01[3-9]\d{8}$/)) {
      // User entered phone number, so they're logging in with their card
      return `Card Number: ${params.identifier.replace(/^(\+?88)?/, '')}`;
    }
    // User entered card number, so they're logging in with their phone
    return `Phone Number: ${params.mobileNumber}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.gray[50]} />
      
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>Verify Login</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.mobileNumber}>{params.mobileNumber}</Text>
          </Text>
          
          <View style={styles.identifierInfo}>
            <Text style={styles.identifierLabel}>Login attempt for:</Text>
            <Text style={styles.identifierValue}>{displayIdentifier()}</Text>
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

              <Button
                title="Verify & Login"
                onPress={handleVerifyLogin}
                loading={isLoading}
                disabled={otp.join('').length !== 6}
                icon="log-in"
                size="medium"
                fullWidth
              />

              <Text style={styles.helpText}>
                Didn't receive the code?{'\n'}
                Check your SMS or try resending.
              </Text>
            </View>
          </Card>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 30,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  mobileNumber: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  identifierInfo: {
    backgroundColor: COLORS.primary + '08',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    alignItems: 'center',
  },
  identifierLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: 2,
  },
  identifierValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  otpContainer: {
    padding: 16,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 8,
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
    backgroundColor: COLORS.primary + '08',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
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
    marginTop: 12,
    lineHeight: 16,
  },
});
