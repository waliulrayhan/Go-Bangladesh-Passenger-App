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

import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { COLORS, SPACING } from '../utils/constants';
import { Card } from './ui/Card';
import { Text } from './ui/Text';
import { Toast } from './ui/Toast';

// Constants
const TIMING_CONFIG = {
  OTP_LENGTH: 6,
  COUNTDOWN_DURATION: 60,
  AUTO_VERIFY_DELAY: 100,
  SUCCESS_CLOSE_DELAY: 1500,
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

export function ProfileOTPVerificationModal({
  visible,
  onClose,
  onVerificationSuccess,
  mobileNumber,
  userData,
}: ProfileOTPVerificationModalProps) {
  const { toast, showError, showSuccess, hideToast } = useToast();
  const { refreshUserData } = useAuthStore();
  
  // Form state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [showVerifyingText, setShowVerifyingText] = useState(false);
  const [isProcessingOTP, setIsProcessingOTP] = useState(false);
  
  // Resend OTP state
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState<number>(TIMING_CONFIG.COUNTDOWN_DURATION);
  const [canResend, setCanResend] = useState(false);
  
  // Refs for input management
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const hasInitialized = useRef(false);
  const initializedForMobile = useRef<string | null>(null);

  // Helper functions
  const resetState = useCallback(() => {
    setOtp(['', '', '', '', '', '']);
    setIsResending(false);
    setCountdown(TIMING_CONFIG.COUNTDOWN_DURATION);
    setCanResend(false);
    setIsLoading(false);
    setIsAutoVerifying(false);
    setShowVerifyingText(false);
    setIsProcessingOTP(false);
  }, []);

  const resetAutofillFlags = useCallback(() => {
    // No autofill flags to reset in simplified implementation
  }, []);

  const handleSendInitialOTP = useCallback(async () => {
    try {
      console.log('📱 [PROFILE OTP] Sending initial OTP to:', mobileNumber);
      await apiService.sendOTP(mobileNumber);
      console.log('✅ [PROFILE OTP] Initial OTP sent successfully');
    } catch (error: any) {
      console.error('❌ [PROFILE OTP] Failed to send initial OTP:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send OTP';
      showError(errorMessage);
    }
  }, [mobileNumber, showError]);

  const handleVerify = useCallback(async (otpCode?: string) => {
    if (isLoading) return;

    const otpString = otpCode || otp.join('');
    
    if (otpString.length !== TIMING_CONFIG.OTP_LENGTH) {
      showError('Please enter the complete 6-digit OTP.');
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
          
          showSuccess('Your profile has been updated successfully.');
          
          setTimeout(() => {
            console.log('🚪 [PROFILE OTP] Closing modal after successful update');
            onClose();
          }, TIMING_CONFIG.SUCCESS_CLOSE_DELAY);
        } catch (updateError: any) {
          console.error('❌ [PROFILE OTP] Profile update error:', updateError);
          setIsLoading(false);
          setIsAutoVerifying(false);
          setShowVerifyingText(false);
          setIsProcessingOTP(false);
          
          const errorMessage = updateError.message || 
            updateError.response?.data?.data?.message || 
            'Failed to update profile. Please try again.';
          
          showError(errorMessage);
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      setIsProcessingOTP(false);
      console.error('❌ [PROFILE OTP] OTP verification error:', error);
      
      setOtp(['', '', '', '', '', '']);
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      setIsProcessingOTP(false);
      
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      
      const errorMessage = error.message || 
        error.response?.data?.data?.message || 
        'Invalid OTP. Please try again.';
      
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
      
      // Send initial OTP
      handleSendInitialOTP();
    } else if (!visible) {
      console.log('🔒 [PROFILE OTP MODAL] Modal closed, resetting flags');
      hasInitialized.current = false;
      initializedForMobile.current = null;
    }
  }, [visible, mobileNumber, handleSendInitialOTP, resetState, resetAutofillFlags]);

  // Countdown timer effect
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

  // Helper functions for OTP handling
  const handlePastedOTP = useCallback((pastedOtp: string): boolean => {
    const cleanOtp = pastedOtp.replace(/\D/g, '');
    
    if (cleanOtp.length >= TIMING_CONFIG.OTP_LENGTH) {
      setIsAutoVerifying(true);
      setShowVerifyingText(true);

      const newOtp = cleanOtp.slice(0, TIMING_CONFIG.OTP_LENGTH).split('');
      setOtp(newOtp);

      setTimeout(() => {
        inputRefs.current[TIMING_CONFIG.OTP_LENGTH - 1]?.focus();
        inputRefs.current[TIMING_CONFIG.OTP_LENGTH - 1]?.blur();
      }, 100);

      setTimeout(() => {
        handleVerify(newOtp.join(''));
      }, TIMING_CONFIG.AUTO_VERIFY_DELAY);

      return true;
    }
    return false;
  }, [handleVerify]);

  const handleOtpChange = (value: string, index: number) => {
    if (isLoading || isAutoVerifying) return;
    
    // Handle pasted OTP (multiple characters at once)
    if (value.length > 1) {
      const pastedOtp = value.replace(/\D/g, '').slice(0, TIMING_CONFIG.OTP_LENGTH);
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
        if (newOtp.every((digit) => digit !== "") && newOtp.length === TIMING_CONFIG.OTP_LENGTH) {
          setIsAutoVerifying(true);
          setShowVerifyingText(true);
          setTimeout(() => {
            handleVerify(newOtp.join(''));
          }, TIMING_CONFIG.AUTO_VERIFY_DELAY);
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
    setIsResending(true);
    
    try {
      console.log('🔄 [PROFILE OTP] Resending OTP to:', mobileNumber);
      await apiService.sendOTP(mobileNumber);
      console.log('✅ [PROFILE OTP] OTP resent successfully');
      
      // Reset state using helper functions
      resetState();
      resetAutofillFlags();
      
      inputRefs.current[0]?.focus();
      showSuccess('A new OTP has been sent to your mobile number.');
    } catch (error: any) {
      setIsResending(false);
      console.error('❌ [PROFILE OTP] Resend OTP error:', error);
      
      // Clear form and reset flags
      setOtp(['', '', '', '', '', '']);
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      setIsProcessingOTP(false);
      
      const errorMessage = error.message || 
        error.response?.data?.data?.message || 
        'Failed to resend OTP. Please try again.';
      
      showError(errorMessage);
    }
  }, [mobileNumber, resetState, resetAutofillFlags, showSuccess, showError]);

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
    <View style={styles.header}>
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
    </View>
  );

  const renderOTPInputs = () => (
    <View style={styles.otpInputContainer}>
      {otp.map((digit, index) => (
        <TouchableOpacity
          key={`otp-input-wrapper-${index}`}
          style={styles.otpInputWrapper}
          onPress={() => {
            inputRefs.current[index]?.focus();
          }}
        >
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
            maxLength={index === 0 ? TIMING_CONFIG.OTP_LENGTH : 1}
            autoFocus={index === 0}
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
        </TouchableOpacity>
      ))}
    </View>
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
    <View style={styles.cardWrapper}>
      <Card variant="elevated">
        <View style={styles.otpContainer}>
          <View style={styles.otpLabelContainer}>
            <Text style={styles.otpLabel}>
              {showVerifyingText ? 'Verifying...' : 'Enter OTP'}
            </Text>
          </View>
          
          {renderOTPInputs()}
          {renderResendSection()}

          <Text style={styles.helpText}>
            {Platform.OS === 'ios' 
              ? 'Tap the SMS suggestion to auto-fill all 6 digits, or enter them manually for automatic verification.'
              : 'The OTP will auto-fill from SMS when available. Enter all 6 digits for automatic verification.'
            }
          </Text>
        </View>
      </Card>
    </View>
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
  cardWrapper: {
    width: '100%',
    minHeight: 300,
  },
  otpContainer: {
    padding: SPACING.md,
  },
  otpLabelContainer: {
    height: 24,
    marginBottom: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  
  // OTP input styles
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
    minHeight: 48,
  },
  otpInputWrapper: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
});
