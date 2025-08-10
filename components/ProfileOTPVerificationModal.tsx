import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { COLORS, SPACING } from '../utils/constants';
import { Card } from './ui/Card';
import { Text } from './ui/Text';
import { Toast } from './ui/Toast';

// Constants
const OTP_CONSTRAINTS = {
  LENGTH: 6,
  TIMER_DURATION: 60,
  AUTO_FILL_TIMEOUT: 100,
  RAPID_INPUT_THRESHOLD: 100,
  VERIFICATION_DELAY: 200,
  FOCUS_DELAY: 50,
  FIRST_INPUT_DELAY: 30,
  SUCCESS_CLOSE_DELAY: 1500,
} as const;

const ANIMATION_DELAYS = {
  HEADER: 300,
  FORM: 500,
} as const;

const MESSAGES = {
  COMPLETE_OTP: "Please enter the complete 6-digit OTP.",
  VERIFICATION_FAILED: "OTP verification failed. Please check the code and try again.",
  INVALID_OTP: "Invalid OTP. Please try again.",
  RESEND_SUCCESS: "A new OTP has been sent to your mobile number.",
  RESEND_FAILED: "Failed to resend OTP. Please try again.",
  UPDATE_SUCCESS: "Your profile has been updated successfully.",
  UPDATE_FAILED: "Failed to update profile. Please try again.",
} as const;

// Types
interface ProfileOTPVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onVerificationSuccess: () => Promise<{ success: boolean } | void>;
  mobileNumber: string;
  userData: {
    name: string;
    cardNumber?: string;
  };
}

/**
 * Custom hook for managing OTP autofill logic
 */
const useOTPAutofill = () => {
  const isHandlingAutofill = useRef(false);
  const lastOtpInputTime = useRef(0);
  const autofillDigits = useRef<string[]>([]);
  const autofillTimeout = useRef<NodeJS.Timeout | null>(null);

  const resetAutofill = () => {
    isHandlingAutofill.current = false;
    lastOtpInputTime.current = 0;
    autofillDigits.current = [];
    if (autofillTimeout.current) {
      clearTimeout(autofillTimeout.current);
      autofillTimeout.current = null;
    }
  };

  const cleanup = () => {
    if (autofillTimeout.current) {
      clearTimeout(autofillTimeout.current);
    }
  };

  return {
    isHandlingAutofill,
    lastOtpInputTime,
    autofillDigits,
    autofillTimeout,
    resetAutofill,
    cleanup,
  };
};

/**
 * Custom hook for managing countdown timer
 */
const useCountdownTimer = (visible: boolean) => {
  const [countdown, setCountdown] = useState<number>(OTP_CONSTRAINTS.TIMER_DURATION);
  const [canResend, setCanResend] = useState(false);

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

  const resetTimer = () => {
    setCountdown(OTP_CONSTRAINTS.TIMER_DURATION);
    setCanResend(false);
  };

  return { countdown, canResend, resetTimer };
};

export function ProfileOTPVerificationModal({
  visible,
  onClose,
  onVerificationSuccess,
  mobileNumber,
  userData,
}: ProfileOTPVerificationModalProps) {
  // External hooks and stores
  const { toast, showError, showSuccess, hideToast } = useToast();
  const { refreshUserData } = useAuthStore();
  
  // State management
  const [otp, setOtp] = useState<string[]>(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [showVerifyingText, setShowVerifyingText] = useState(false);
  const [isProcessingOTP, setIsProcessingOTP] = useState(false);
  const [isOtpReady, setIsOtpReady] = useState(false);
  const [isResending, setIsResending] = useState(false);
  
  // Custom hooks
  const { countdown, canResend, resetTimer } = useCountdownTimer(visible);
  const otpAutofill = useOTPAutofill();
  
  // Refs for input management
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const hasInitialized = useRef(false);
  const initializedForMobile = useRef<string | null>(null);
  const isInitialOTPSending = useRef(false);

  // Helper functions
  const resetState = useCallback(() => {
    setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
    setIsResending(false);
    setIsLoading(false);
    setIsAutoVerifying(false);
    setShowVerifyingText(false);
    setIsProcessingOTP(false);
    resetTimer();
  }, [resetTimer]);

  const resetAutofillFlags = useCallback(() => {
    otpAutofill.resetAutofill();
  }, []);

  const resetOTPForm = useCallback(() => {
    setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
    setIsAutoVerifying(false);
    setShowVerifyingText(false);
    otpAutofill.resetAutofill();
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, []);

  const handleSendInitialOTP = useCallback(async () => {
    // Prevent duplicate sends
    if (isInitialOTPSending.current) {
      console.log('🚫 [PROFILE OTP] Initial OTP send already in progress, skipping');
      return;
    }
    
    isInitialOTPSending.current = true;
    
    try {
      console.log('📱 [PROFILE OTP] Sending initial OTP to:', mobileNumber);
      await apiService.sendOTP(mobileNumber);
      console.log('✅ [PROFILE OTP] Initial OTP sent successfully');
    } catch (error: any) {
      console.error('❌ [PROFILE OTP] Failed to send initial OTP:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send OTP';
      showError(errorMessage);
    } finally {
      // Reset the flag after a delay to allow legitimate re-sends
      setTimeout(() => {
        isInitialOTPSending.current = false;
      }, 2000);
    }
  }, [mobileNumber, showError]);

  const handleVerify = useCallback(async (otpCode?: string) => {
    if (isLoading) return;

    const otpString = otpCode || otp.join('');
    
    if (otpString.length !== OTP_CONSTRAINTS.LENGTH) {
      showError(MESSAGES.COMPLETE_OTP);
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      return;
    }

    setIsLoading(true);
    setIsProcessingOTP(true);

    try {
      console.log('🔐 [PROFILE OTP] Verifying OTP for:', mobileNumber);
      
      const verificationResult = await apiService.verifyOTP(mobileNumber, otpString);
      
      if (verificationResult) {
        console.log('✅ [PROFILE OTP] OTP verification successful');
        
        try {
          console.log('🔄 [PROFILE OTP] Executing profile update...');
          await onVerificationSuccess();
          
          console.log('⏳ [PROFILE OTP] Waiting for API to process update...');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('🔄 [PROFILE OTP] Refreshing user data...');
          try {
            await refreshUserData();
            console.log('✅ [PROFILE OTP] User data refreshed successfully');
          } catch (refreshError) {
            console.error('⚠️ [PROFILE OTP] Failed to refresh user data:', refreshError);
            // Retry once more
            try {
              console.log('🔄 [PROFILE OTP] Retrying user data refresh...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              await refreshUserData();
              console.log('✅ [PROFILE OTP] User data refreshed on retry');
            } catch (retryError) {
              console.error('❌ [PROFILE OTP] Final retry failed:', retryError);
            }
          }
          
          setIsLoading(false);
          setIsAutoVerifying(false);
          setShowVerifyingText(false);
          
          showSuccess(MESSAGES.UPDATE_SUCCESS);
          
          setTimeout(() => {
            console.log('🚪 [PROFILE OTP] Closing modal after successful update');
            onClose();
          }, OTP_CONSTRAINTS.SUCCESS_CLOSE_DELAY);
        } catch (updateError: any) {
          console.error('❌ [PROFILE OTP] Profile update error:', updateError);
          setIsLoading(false);
          setIsAutoVerifying(false);
          setShowVerifyingText(false);
          setIsProcessingOTP(false);
          
          const errorMessage = updateError.message || 
            updateError.response?.data?.data?.message || 
            MESSAGES.UPDATE_FAILED;
          
          showError(errorMessage);
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      setIsProcessingOTP(false);
      console.error('❌ [PROFILE OTP] OTP verification error:', error);
      
      resetOTPForm();
      
      const errorMessage = error.message || 
        error.response?.data?.data?.message || 
        MESSAGES.INVALID_OTP;
      
      showError(errorMessage);
    }
  }, [isLoading, otp, mobileNumber, onVerificationSuccess, refreshUserData, showSuccess, showError, onClose]);

  useEffect(() => {
    console.log('🔍 [PROFILE OTP MODAL] Visibility changed:', visible);
    
    if (visible && (!hasInitialized.current || initializedForMobile.current !== mobileNumber)) {
      console.log('🚀 [PROFILE OTP MODAL] Initializing modal for:', mobileNumber);
      
      // Reset all state when modal opens
      resetState();
      resetAutofillFlags();
      
      hasInitialized.current = true;
      initializedForMobile.current = mobileNumber;
      
      // Send initial OTP with a small delay to prevent race conditions
      const sendTimer = setTimeout(() => {
        if (hasInitialized.current && initializedForMobile.current === mobileNumber) {
          handleSendInitialOTP();
        }
      }, 50);
      
      return () => clearTimeout(sendTimer);
    } else if (!visible) {
      console.log('🔒 [PROFILE OTP MODAL] Modal closed, resetting flags');
      hasInitialized.current = false;
      initializedForMobile.current = null;
      isInitialOTPSending.current = false; // Reset sending flag
    }
  }, [visible, mobileNumber]);

  // OTP ready state for autofill
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setIsOtpReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsOtpReady(false);
    }
  }, [visible]);

  useEffect(() => {
    if (isOtpReady && visible) {
      // Only clear OTP if not already initialized to prevent triggering main effect
      setOtp(prev => prev.every(digit => digit === '') ? prev : Array(OTP_CONSTRAINTS.LENGTH).fill(""));
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      otpAutofill.resetAutofill();
    }
  }, [isOtpReady, visible]);

  // Cleanup effect
  useEffect(() => {
    return () => otpAutofill.cleanup();
  }, []);

  // Helper functions for OTP handling
  const handlePastedOTP = useCallback((pastedOtp: string): boolean => {
    const cleanOtp = pastedOtp.replace(/\D/g, '');
    
    if (cleanOtp.length >= OTP_CONSTRAINTS.LENGTH) {
      setIsAutoVerifying(true);
      setShowVerifyingText(true);

      const newOtp = cleanOtp.slice(0, OTP_CONSTRAINTS.LENGTH).split('');
      setOtp(newOtp);

      setTimeout(() => {
        inputRefs.current[OTP_CONSTRAINTS.LENGTH - 1]?.focus();
        inputRefs.current[OTP_CONSTRAINTS.LENGTH - 1]?.blur();
      }, 100);

      setTimeout(() => {
        handleVerify(newOtp.join(''));
      }, OTP_CONSTRAINTS.VERIFICATION_DELAY);

      return true;
    }
    return false;
  }, [handleVerify]);

  const handleOtpChange = (value: string, index: number) => {
    if (isLoading || isAutoVerifying) return;
    
    // Handle pasted OTP (multiple characters at once)
    if (value.length > 1) {
      const pastedOtp = value.replace(/\D/g, '').slice(0, OTP_CONSTRAINTS.LENGTH);
      if (handlePastedOTP(pastedOtp)) return;
    }

    // For first input, handle SMS autofill specially
    if (index === 0) {
      const cleanValue = value.replace(/\D/g, '');
      
      // If we get multiple digits in first input (SMS autofill), handle as paste
      if (cleanValue.length > 1) {
        if (handlePastedOTP(cleanValue)) return;
      }
      
      // Store the first digit immediately
      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        newOtp[0] = cleanValue.slice(-1);
        return newOtp;
      });
      
      // Focus next input for manual entry
      if (cleanValue && !isAutoVerifying) {
        setTimeout(() => {
          inputRefs.current[1]?.focus();
        }, 10);
      }
      return;
    }

    // Handle single character input (manual typing)
    if (value.length <= 1) {
      setOtp(prevOtp => {
        const newOtp = [...prevOtp];
        newOtp[index] = value.slice(-1);
        
        // Auto-verify when all digits are entered manually
        if (newOtp.every((digit) => digit !== "") && newOtp.length === OTP_CONSTRAINTS.LENGTH) {
          setIsAutoVerifying(true);
          setShowVerifyingText(true);
          setTimeout(() => {
            handleVerify(newOtp.join(''));
          }, OTP_CONSTRAINTS.VERIFICATION_DELAY);
        }
        
        return newOtp;
      });

      // Auto-focus next input
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

  const handleResendOTP = useCallback(async () => {
    if (isResending) {
      console.log('🚫 [PROFILE OTP] Resend already in progress, skipping');
      return;
    }
    
    setIsResending(true);
    
    try {
      console.log('🔄 [PROFILE OTP] Resending OTP to:', mobileNumber);
      await apiService.sendOTP(mobileNumber);
      console.log('✅ [PROFILE OTP] OTP resent successfully');
      
      // Reset state using helper functions
      resetState();
      resetAutofillFlags();
      
      inputRefs.current[0]?.focus();
      showSuccess(MESSAGES.RESEND_SUCCESS);
    } catch (error: any) {
      console.error('❌ [PROFILE OTP] Resend OTP error:', error);
      
      resetOTPForm();
      
      const errorMessage = error.message || 
        error.response?.data?.data?.message || 
        MESSAGES.RESEND_FAILED;
      
      showError(errorMessage);
    } finally {
      setIsResending(false);
    }
  }, [mobileNumber, resetState, resetAutofillFlags, showSuccess, showError, isResending]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Modal configuration
  const modalProps = useMemo(() => ({
    visible,
    animationType: "slide" as const,
    presentationStyle: "fullScreen" as const,
    onRequestClose: () => {
      console.log('🚪 [PROFILE OTP MODAL] onRequestClose called, isProcessingOTP:', isProcessingOTP);
      if (!isProcessingOTP) {
        onClose();
      }
    },
    statusBarTranslucent: true,
  }), [visible, onClose, isProcessingOTP]);

  // Render functions
  const renderHeader = () => (
    <Animated.View entering={FadeInUp.duration(ANIMATION_DELAYS.HEADER)} style={styles.header}>
      <View style={styles.iconContainer}>
        <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
      </View>
      
      <Text variant="h3" color={COLORS.secondary} style={styles.title}>
        Verify Your Mobile Number
      </Text>
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
  );

  const renderResendSection = () => (
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
  );

  const renderOTPForm = () => (
    <Animated.View entering={FadeInDown.duration(ANIMATION_DELAYS.FORM).delay(200)}>
      <Card variant="elevated">
        <View style={styles.otpContainer}>
          {!showVerifyingText && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text style={styles.otpLabel}>Enter OTP</Text>
            </Animated.View>
          )}

          <View style={styles.otpInputContainer} key={`otp-container-${isOtpReady}`}>
            {showVerifyingText && (
              <Animated.View 
                style={styles.loadingContainer}
                entering={FadeInDown.duration(300)}
              >
                <Text style={styles.loadingText}>Verifying...</Text>
              </Animated.View>
            )}
            
            {otp.map((digit, index) => (
              <Animated.View
                key={`otp-input-wrapper-${index}-${isOtpReady}`}
                style={styles.otpInputWrapper}
              >
                <TextInput
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                    (isLoading || isAutoVerifying) && styles.otpInputDisabled
                  ]}
                  value={digit}
                  onChangeText={(value) => !isAutoVerifying && handleOtpChange(value, index)}
                  onKeyPress={(e) => !isAutoVerifying && handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={index === 0 ? OTP_CONSTRAINTS.LENGTH : 1}
                  autoFocus={index === 0 && !isAutoVerifying}
                  selectTextOnFocus
                  editable={!isLoading && !isAutoVerifying}
                  textContentType={index === 0 ? "oneTimeCode" : "none"}
                  autoComplete={index === 0 ? "sms-otp" : "off"}
                  importantForAutofill={index === 0 ? "yes" : "no"}
                  blurOnSubmit={false}
                  contextMenuHidden={index !== 0}
                  autoCorrect={false}
                  spellCheck={false}
                />
              </Animated.View>
            ))}
          </View>
          {renderResendSection()}

          <Text style={styles.helpText}>
            {Platform.OS === "ios"
              ? "Didn't receive the code? Check your SMS or try resending."
              : "Didn't receive the code? Check your SMS or try resending."
            }
          </Text>
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <Modal {...modalProps}>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[
            "rgba(74, 144, 226, 0.5)",
            "rgba(74, 144, 226, 0.2)",
            "transparent",
            "rgba(255, 138, 0, 0.2)",
            "rgba(255, 138, 0, 0.4)",
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          style={styles.glowBackground}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            console.log('⬅️ [PROFILE OTP MODAL] Back button pressed, isProcessingOTP:', isProcessingOTP);
            if (!isProcessingOTP) {
              onClose();
            }
          }}
          disabled={isProcessingOTP}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>
        
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            {renderHeader()}
            {renderOTPForm()}
          </ScrollView>
        </KeyboardAvoidingView>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
          position="top"
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
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
  
  // Layout styles
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
    paddingTop: SPACING.xl + 40,
    minHeight: '100%',
  },
  
  // Header styles
  backButton: {
    position: 'absolute',
    left: SPACING.md,
    top: 60,
    padding: SPACING.sm,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
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
    marginBottom: SPACING.xs,
    textAlign: "center",
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
  
  // User info styles
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
  
  // Card and form styles
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
  
  // OTP input styles
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
  
  // Resend section styles
  resendContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
    minHeight: 32,
    justifyContent: 'center',
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
  
  // Help text styles
  helpText: {
    textAlign: 'center',
    color: COLORS.gray[600],
    fontSize: 12,
    marginTop: SPACING.sm,
    lineHeight: 16,
  },
  
  // Loading styles for verifying text
  loadingContainer: {
    paddingTop: 5,
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
