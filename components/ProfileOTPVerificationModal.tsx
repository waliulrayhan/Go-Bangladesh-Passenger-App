import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { apiService } from '../services/api';
import { COLORS, SPACING } from '../utils/constants';
import { Card } from './ui/Card';
import { Text } from './ui/Text';

interface ProfileOTPVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerificationSuccess: () => Promise<void>;
  mobileNumber: string;
  userData: {
    name: string;
    cardNumber?: string;
  };
}

export function ProfileOTPVerificationModal({
  visible,
  onClose,
  onVerificationSuccess,
  mobileNumber,
  userData,
}: ProfileOTPVerificationModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [showVerifyingText, setShowVerifyingText] = useState(false); // Separate state for UI display
  
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const isHandlingAutofill = useRef(false);
  const lastOtpInputTime = useRef(0);
  const autofillDigits = useRef<string[]>([]);
  const autofillTimeout = useRef<NodeJS.Timeout | null>(null);
  const hasInitialized = useRef(false);
  const initializedForMobile = useRef<string | null>(null);

  const handleSendInitialOTP = useCallback(async () => {
    try {
      console.log('📱 [PROFILE OTP] Sending initial OTP to:', mobileNumber);
      await apiService.sendOTP(mobileNumber);
      console.log('✅ [PROFILE OTP] Initial OTP sent successfully');
    } catch (error: any) {
      console.error('❌ [PROFILE OTP] Failed to send initial OTP:', error);
      Alert.alert(
        'Error',
        'Failed to send OTP. Please try again.',
        [
          {
            text: 'Retry',
            onPress: () => handleSendInitialOTP()
          },
          {
            text: 'Cancel',
            onPress: onClose
          }
        ]
      );
    }
  }, [mobileNumber, onClose]);

  useEffect(() => {
    if (visible && (!hasInitialized.current || initializedForMobile.current !== mobileNumber)) {
      // Reset state when modal opens for the first time or mobile number changes
      setOtp(['', '', '', '', '', '']);
      setIsResending(false);
      setCountdown(60);
      setCanResend(false);
      setIsLoading(false);
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      
      // Reset autofill flags when entering OTP state
      isHandlingAutofill.current = false;
      lastOtpInputTime.current = 0;
      autofillDigits.current = [];
      if (autofillTimeout.current) {
        clearTimeout(autofillTimeout.current);
        autofillTimeout.current = null;
      }
      
      hasInitialized.current = true;
      initializedForMobile.current = mobileNumber;
      
      // Send OTP when modal opens
      handleSendInitialOTP();
    } else if (!visible) {
      // Reset initialization flag when modal closes
      hasInitialized.current = false;
      initializedForMobile.current = null;
    }
  }, [visible, mobileNumber, handleSendInitialOTP]);

  // Separate useEffect for countdown timer
  useEffect(() => {
    if (!visible || canResend) return;
    
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
  }, [visible, canResend]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autofillTimeout.current) {
        clearTimeout(autofillTimeout.current);
      }
    };
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (isLoading || isAutoVerifying) return; // Prevent changes while loading or auto-verifying
    
    // Handle pasted OTP (auto-fill from SMS) - can happen on any input
    if (value.length > 1) {
      const pastedOtp = value.replace(/\D/g, '').slice(0, 6); // Extract only digits, max 6
      
      if (pastedOtp.length >= 6) {
        // Set flag to prevent interference from subsequent events
        isHandlingAutofill.current = true;
        setIsAutoVerifying(true);
        setShowVerifyingText(true); // Show verifying text immediately
        
        // Create new OTP array with all 6 digits
        const newOtp = pastedOtp.split('').slice(0, 6);
        
        setOtp(newOtp);
        
        // Clear the flag after state update completes
        setTimeout(() => {
          isHandlingAutofill.current = false;
        }, 500);
        
        // Focus the last input to show completion
        setTimeout(() => {
          inputRefs.current[5]?.focus();
          inputRefs.current[5]?.blur();
        }, 100);
        
        // Auto-verify when 6 digits are pasted
        setTimeout(() => {
          handleVerify(pastedOtp);
        }, 200);
        
        return;
      }
    }

    // Check if this is part of a rapid sequence (likely autofill)
    const now = Date.now();
    const timeDiff = now - lastOtpInputTime.current;
    lastOtpInputTime.current = now;
    
    // If inputs are coming very rapidly (< 100ms apart), it's likely autofill
    const isRapidInput = timeDiff < 100 && timeDiff > 0;
    
    // Check if we're already in autofill mode or this is a rapid input
    if (isRapidInput || isHandlingAutofill.current) {
      if (!isHandlingAutofill.current) {
        isHandlingAutofill.current = true;
        setIsAutoVerifying(true);
        setShowVerifyingText(true); // Show verifying text when autofill starts
        // Initialize the digits array
        autofillDigits.current = new Array(6).fill("");
      }
      
      // Collect the digit for this position
      autofillDigits.current[index] = value.slice(-1);
      
      // Reset the timeout each time we get a new digit
      if (autofillTimeout.current) clearTimeout(autofillTimeout.current);
      autofillTimeout.current = setTimeout(() => {
        const collectedDigits = [...autofillDigits.current];
        const validDigits = collectedDigits.filter((d: string) => d && d !== "");
        
        if (validDigits.length >= 5) { // Changed from 6 to 5 to handle the missing first digit
          // If we're missing the first digit, let's try to get it from the current state
          if (!collectedDigits[0] && otp[0]) {
            collectedDigits[0] = otp[0];
          }
          
          // Smooth UI update - set OTP
          setOtp(collectedDigits);
          
          // Auto-verify if we have all 6 digits
          const finalValidDigits = collectedDigits.filter((d: string) => d && d !== "");
          if (finalValidDigits.length === 6) {
            setTimeout(() => {
              handleVerify(collectedDigits.join(''));
            }, 100);
          }
        } else if (validDigits.length > 0) {
          // Even if we don't have enough, set what we have (but don't show loading)
          setOtp(collectedDigits);
        }
        
        // Cleanup
        autofillDigits.current = [];
        isHandlingAutofill.current = false;
        // Don't reset setIsAutoVerifying here to prevent flickering
        // It will be reset in handleVerify
      }, 150); // Timeout to ensure we capture all digits
      
      return; // Don't process as manual input
    }

    // Special handling for the first input when it might be part of an autofill sequence
    // If this is index 0 and OTP is empty, delay processing to see if more inputs come rapidly
    if (index === 0 && otp.every(digit => digit === "")) {
      // Don't show verifying UI immediately - wait to see if it's autofill or manual
      isHandlingAutofill.current = true;
      autofillDigits.current = new Array(6).fill("");
      autofillDigits.current[0] = value.slice(-1);
      
      // Wait a short time to see if more inputs come rapidly (indicating autofill)
      setTimeout(() => {
        if (isHandlingAutofill.current) {
          // Check if we collected more digits
          const collectedCount = autofillDigits.current.filter((d: string) => d && d !== "").length;
          
          if (collectedCount === 1) {
            // Only one digit, treat as manual input
            setOtp(prevOtp => {
              const newOtp = [...prevOtp];
              newOtp[0] = autofillDigits.current[0];
              return newOtp;
            });
            autofillDigits.current = [];
            isHandlingAutofill.current = false;
            
            // Focus next input for manual typing
            setTimeout(() => {
              inputRefs.current[1]?.focus();
            }, 10);
          } else if (collectedCount > 1) {
            // Multiple digits collected rapidly - handle as autofill
            setIsAutoVerifying(true);
            setShowVerifyingText(true);
            setOtp(autofillDigits.current);
            
            const validDigits = autofillDigits.current.filter((d: string) => d && d !== "");
            if (validDigits.length === 6) {
              setTimeout(() => {
                handleVerify(autofillDigits.current.join(''));
              }, 100);
            }
            
            autofillDigits.current = [];
            isHandlingAutofill.current = false;
          }
        }
      }, 50); // Short delay to detect rapid sequence
      
      return;
    }

    // Handle single character input (manual typing)
    if (value.length <= 1) {
      // Use functional update to ensure we have the latest state
      setOtp(prevOtp => {
        const newOtp = [...prevOtp];
        newOtp[index] = value.slice(-1);
        
        // Auto-verify when all 6 digits are entered manually
        if (newOtp.every((digit) => digit !== "") && newOtp.length === 6) {
          setIsAutoVerifying(true);
          setShowVerifyingText(true); // Show verifying text for manual completion
          setTimeout(() => {
            handleVerify(newOtp.join(''));
          }, 100);
        }
        
        return newOtp;
      });

      // Auto-focus next input (but not during auto-verify)
      if (value && index < 5 && !isAutoVerifying) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 10);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    if (isLoading) return; // Prevent multiple submissions

    const otpString = otpCode || otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the complete 6-digit OTP.');
      setIsAutoVerifying(false); // Reset auto-verifying state
      setShowVerifyingText(false); // Reset verifying text display
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 [PROFILE OTP] Verifying OTP for:', mobileNumber);
      
      // Verify OTP with API
      const verificationResult = await apiService.verifyOTP(mobileNumber, otpString);
      
      if (verificationResult) {
        console.log('✅ [PROFILE OTP] OTP verification successful');
        
        try {
          // Call the profile update function
          await onVerificationSuccess();
          
          setIsLoading(false);
          setIsAutoVerifying(false);
          setShowVerifyingText(false);
          onClose(); // Close the OTP modal
          
          Alert.alert(
            'Profile Updated!',
            'Your profile has been updated successfully.',
            [
              {
                text: 'OK',
                onPress: () => {}
              }
            ]
          );
        } catch (updateError: any) {
          console.error('❌ [PROFILE OTP] Profile update error:', updateError);
          setIsLoading(false);
          setIsAutoVerifying(false);
          setShowVerifyingText(false);
          
          let errorMessage = 'Failed to update profile. Please try again.';
          
          if (updateError.message) {
            errorMessage = updateError.message;
          } else if (updateError.response?.data?.data?.message) {
            errorMessage = updateError.response.data.data.message;
          }
          
          Alert.alert('Update Failed', errorMessage);
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error('❌ [PROFILE OTP] OTP verification error:', error);
      
      // Clear OTP form on error
      setOtp(['', '', '', '', '', '']);
      setIsAutoVerifying(false);
      setShowVerifyingText(false); // Reset verifying text display
      
      // Refocus first input after a short delay
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
      
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
      console.log('🔄 [PROFILE OTP] Resending OTP to:', mobileNumber);
      
      // Resend OTP using API
      await apiService.sendOTP(mobileNumber);
      
      console.log('✅ [PROFILE OTP] OTP resent successfully');
      
      setIsResending(false);
      setOtp(['', '', '', '', '', '']);
      setCountdown(60);
      setCanResend(false);
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      
      // Reset autofill flags when resending
      isHandlingAutofill.current = false;
      lastOtpInputTime.current = 0;
      autofillDigits.current = [];
      if (autofillTimeout.current) {
        clearTimeout(autofillTimeout.current);
        autofillTimeout.current = null;
      }
      
      inputRefs.current[0]?.focus();
      
      Alert.alert('OTP Sent', 'A new OTP has been sent to your mobile number.');
    } catch (error: any) {
      setIsResending(false);
      console.error('❌ [PROFILE OTP] Resend OTP error:', error);
      
      // Clear OTP form when resending
      setOtp(['', '', '', '', '', '']);
      setIsAutoVerifying(false);
      setShowVerifyingText(false); // Reset verifying text display
      
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const modalProps = useMemo(() => ({
    visible,
    animationType: "slide" as const,
    presentationStyle: "fullScreen" as const,
    onRequestClose: onClose,
  }), [visible, onClose]);

  return (
    <Modal {...modalProps}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.container}>
        {/* Orange Soft + Purple Bottom Dual Glow */}
        <LinearGradient
          colors={[
            'rgba(255, 113, 18, 0.3)',   // Orange Soft at top
            'rgba(255, 113, 18, 0.2)', 
            'transparent',
            'rgba(173, 109, 244, 0.2)',  // Purple transition
            'rgba(173, 109, 244, 0.4)'   // Purple at bottom
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          style={styles.glowBackground}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
        
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
            </View>
            
            <Text variant="h3" color={COLORS.white} style={styles.title}>Verify Mobile Number</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}
              <Text style={styles.phoneNumber}>{mobileNumber}</Text>
            </Text>

            <View style={styles.userInfo}>
              <Text style={styles.infoLabel}>Updating Profile for:</Text>
              <Text style={styles.infoValue}>{userData.name}</Text>
              {userData.cardNumber && (
                <Text style={styles.cardInfo}>Card: {userData.cardNumber}</Text>
              )}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <Card variant="elevated">
              <View style={styles.otpContainer}>
                <Text style={styles.otpLabel}>Enter OTP</Text>
                
                {(isLoading || showVerifyingText) && (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Verifying...</Text>
                  </View>
                )}
                
                <View style={styles.otpInputContainer}>
                  {otp.map((digit, index) => (
                    <View key={index} style={styles.otpInputWrapper}>
                      <TextInput
                        ref={(ref) => { inputRefs.current[index] = ref; }}
                        style={[
                          styles.otpInput,
                          digit && styles.otpInputFilled,
                          (isLoading || isAutoVerifying) && styles.otpInputDisabled
                        ]}
                        value={digit}
                        onChangeText={(value) => handleOtpChange(value, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="numeric"
                        maxLength={index === 0 ? 6 : 1} // Allow pasting full OTP in first input only
                        autoFocus={index === 0}
                        selectTextOnFocus
                        editable={!isLoading && !isAutoVerifying}
                        textContentType={index === 0 ? "oneTimeCode" : "none"} // SMS auto-fill for first input
                        autoComplete={index === 0 ? "sms-otp" : "off"} // Android SMS auto-fill
                        importantForAutofill={index === 0 ? "yes" : "no"} // Android autofill priority
                        blurOnSubmit={false}
                      />
                    </View>
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
    </Modal>
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
    top: 30, // Increased for translucent status bar
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
  otpInputWrapper: {
    // Wrapper for individual input animations
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
  otpInputDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
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
