import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { COLORS, SPACING } from '../utils/constants';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Text } from './ui/Text';
import { Toast } from './ui/Toast';

interface UpdateCardModalProps {
  visible: boolean;
  currentCardNumber?: string;
  userMobile?: string;
  onClose: () => void;
  onUpdate: (newCardNumber: string, otp: string) => Promise<void>;
  onSendOTP: (cardNumber: string) => Promise<void>;
}

type Step = 'card-input' | 'otp-verification';

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// Constants
const OTP_LENGTH = 6;
const OTP_RESEND_TIMER = 60;
const CARD_NUMBER_MIN_LENGTH = 8;
const CARD_NUMBER_MAX_LENGTH = 16;

export const UpdateCardModal: React.FC<UpdateCardModalProps> = ({
  visible,
  currentCardNumber,
  userMobile,
  onClose,
  onUpdate,
  onSendOTP
}) => {
  // State management
  const [step, setStep] = useState<Step>('card-input');
  const [cardNumber, setCardNumber] = useState('');
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  
  // Refs
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Toast hook
  const { toast, showSuccess, showError, showWarning, hideToast } = useToast();

  // Reset state when modal visibility changes
  useEffect(() => {
    if (visible) {
      resetModalState();
    }
  }, [visible]);

  // OTP Timer countdown effect
  useEffect(() => {
    if (otpTimer > 0) {
      timerRef.current = setTimeout(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [otpTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Utility functions
  const resetModalState = useCallback(() => {
    setStep('card-input');
    setCardNumber('');
    setOtp(new Array(OTP_LENGTH).fill(''));
    setOtpTimer(0);
    hideToast();
  }, [hideToast]);

  const validateCardNumber = useCallback((input: string): ValidationResult => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      return { isValid: false, message: 'Card number is required' };
    }
    
    if (trimmedInput.length < CARD_NUMBER_MIN_LENGTH) {
      return { 
        isValid: false, 
        message: `Card number must be at least ${CARD_NUMBER_MIN_LENGTH} characters` 
      };
    }
    
    const cardRegex = /^[A-Z0-9]+$/;
    if (!cardRegex.test(trimmedInput)) {
      return { 
        isValid: false, 
        message: 'Card number should only contain letters and numbers' 
      };
    }
    
    if (trimmedInput === currentCardNumber) {
      return { 
        isValid: false, 
        message: 'Please enter a different card number' 
      };
    }
    
    return { isValid: true };
  }, [currentCardNumber]);

  const validateOTP = useCallback((otpArray: string[]): ValidationResult => {
    const otpString = otpArray.join('');
    
    if (otpString.length !== OTP_LENGTH) {
      return { 
        isValid: false, 
        message: `Please enter the complete ${OTP_LENGTH}-digit OTP` 
      };
    }
    
    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(otpString)) {
      return { 
        isValid: false, 
        message: 'OTP should only contain numbers' 
      };
    }
    
    return { isValid: true };
  }, []);

  // Event handlers
  const handleCardNumberChange = useCallback((text: string) => {
    const filteredText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCardNumber(filteredText);
    hideToast(); // Hide any existing toast when user types
  }, [hideToast]);

  const handleOtpChange = useCallback((value: string, index: number) => {
    if (isLoading) return;
    
    const newOtp = [...otp];
    
    // Handle paste operation (autofill from SMS)
    if (value.length > 1) {
      const pastedValue = value.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
      const pastedArray = pastedValue.split('');
      
      for (let i = 0; i < OTP_LENGTH; i++) {
        newOtp[i] = pastedArray[i] || '';
      }
      
      setOtp(newOtp);
      
      // Focus on the last input and blur to complete autofill
      setTimeout(() => {
        otpInputRefs.current[OTP_LENGTH - 1]?.focus();
        otpInputRefs.current[OTP_LENGTH - 1]?.blur();
      }, 100);
      
      // Auto-verify when complete OTP is pasted
      if (pastedArray.length === OTP_LENGTH) {
        setTimeout(() => {
          handleVerifyAndUpdate(newOtp);
        }, 200);
      }
      
      return;
    }
    
    // Handle single character input
    if (value.length <= 1 && /^[0-9]*$/.test(value)) {
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < OTP_LENGTH - 1) {
        setTimeout(() => {
          otpInputRefs.current[index + 1]?.focus();
        }, 10);
      }
      
      // Auto-verify when all digits are filled manually
      if (newOtp.every(digit => digit !== '') && newOtp.length === OTP_LENGTH) {
        setTimeout(() => {
          handleVerifyAndUpdate(newOtp);
        }, 200);
      }
    }
  }, [otp, isLoading]);

  const handleOtpKeyPress = useCallback((e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Focus previous input on backspace if current is empty
        setTimeout(() => {
          otpInputRefs.current[index - 1]?.focus();
        }, 0);
      }
    }
  }, [otp]);

  const handleSendOTP = useCallback(async () => {
    const cardValidation = validateCardNumber(cardNumber);
    
    if (!cardValidation.isValid) {
      // Force toast to show by hiding first, then showing error
      hideToast();
      setTimeout(() => {
        showError(cardValidation.message || 'Invalid card number');
      }, 100);
      return;
    }

    setIsLoading(true);

    try {
      // Validate card availability
      const cardValidationResponse = await apiService.checkCardValidity(cardNumber.trim());
      
      if (!cardValidationResponse.isSuccess) {
        hideToast();
        setTimeout(() => {
          showError(cardValidationResponse.message || 'Card is not valid or not available');
        }, 100);
        return;
      }

      // Send OTP
      await onSendOTP(cardNumber.trim());
      
      hideToast();
      setTimeout(() => {
        showSuccess('OTP sent successfully to your registered mobile number');
      }, 100);
      
      setStep('otp-verification');
      setOtpTimer(OTP_RESEND_TIMER);
      
      // Focus first OTP input after a short delay
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 300);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.data?.message || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to send OTP';
      hideToast();
      setTimeout(() => {
        showError(errorMessage);
      }, 100);
    } finally {
      setIsLoading(false);
    }
  }, [cardNumber, validateCardNumber, onSendOTP, showError, showSuccess, hideToast]);

  const handleVerifyAndUpdate = useCallback(async (otpArray?: string[]) => {
    const currentOtp = otpArray || otp;
    const otpValidation = validateOTP(currentOtp);
    
    if (!otpValidation.isValid) {
      showError(otpValidation.message || 'Invalid OTP');
      // Clear OTP on error and refocus first input
      setOtp(new Array(OTP_LENGTH).fill(''));
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
      return;
    }

    setIsLoading(true);

    try {
      const otpString = currentOtp.join('');
      await onUpdate(cardNumber.trim(), otpString);
      
      showSuccess('Card number updated successfully!');
      
      // Close modal and navigate back to profile after a short delay
      setTimeout(() => {
        resetModalState();
        onClose();
        router.push('/(tabs)/profile');
      }, 1500);
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update card number';
      showError(errorMessage);
      
      // Clear OTP on error
      setOtp(new Array(OTP_LENGTH).fill(''));
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  }, [otp, cardNumber, validateOTP, onUpdate, showError, showSuccess, resetModalState, onClose]);

  const handleResendOTP = useCallback(async () => {
    setIsLoading(true);

    try {
      await onSendOTP(cardNumber.trim());
      setOtpTimer(OTP_RESEND_TIMER);
      
      hideToast();
      setTimeout(() => {
        showSuccess('OTP resent successfully');
      }, 100);
      
      // Clear current OTP and focus first input
      setOtp(new Array(OTP_LENGTH).fill(''));
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
      
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to resend OTP';
      hideToast();
      setTimeout(() => {
        showError(errorMessage);
      }, 100);
    } finally {
      setIsLoading(false);
    }
  }, [cardNumber, onSendOTP, showError, showSuccess, hideToast]);

  const handleClose = useCallback(() => {
    resetModalState();
    onClose();
  }, [resetModalState, onClose]);

  // Render functions
  const renderCardInputStep = () => (
    <>
      {/* Current Card Information */}
      {currentCardNumber && (
        <View style={styles.sectionContainer}>
          <View style={styles.currentCardContainer}>
            <Text variant="caption" style={styles.currentCardLabel}>Current Card Number</Text>
            <Text variant="body" style={styles.currentCardNumber}>{currentCardNumber}</Text>
          </View>
        </View>
      )}

      {/* New Card Input */}
      <View style={styles.sectionContainer}>
        <Input
          label="New Card Number"
          value={cardNumber}
          onChangeText={handleCardNumberChange}
          placeholder="(e.g. ABCD1234)"
          keyboardType="default"
          icon="card-outline"
          maxLength={CARD_NUMBER_MAX_LENGTH}
          autoCapitalize="characters"
        />

        <View style={styles.helperContainer}>
          <Ionicons name="help-circle-outline" size={16} color={COLORS.gray[500]} />
          <Text variant="caption" style={styles.helperText}>
            Enter the new card number printed on your Go Bangladesh transport card
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text variant="button" style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        
        <View style={styles.updateButtonContainer}>
          <Button
            title="Send OTP"
            onPress={handleSendOTP}
            loading={isLoading}
            disabled={!cardNumber.trim() || isLoading}
            size="medium"
            fullWidth
          />
        </View>
      </View>
    </>
  );

  const renderOTPVerificationStep = () => (
    <>
      {/* OTP Information */}
      <View style={styles.sectionContainer}>
        <View style={styles.otpInfoContainer}>
          <View style={styles.otpIconContainer}>
            <Ionicons name="shield-checkmark" size={32} color={COLORS.primary} />
          </View>
          <Text variant="body" style={styles.otpInfoText}>
            We've sent a verification code to
          </Text>
          <Text variant="body" style={styles.mobileNumber}>{userMobile}</Text>
          <Text variant="caption" style={styles.otpSubText}>
            Enter the {OTP_LENGTH}-digit code to update your card number
          </Text>
        </View>
      </View>

      {/* OTP Input */}
      <View style={styles.sectionContainer}>
        <Text variant="body" style={styles.otpLabel}>Verification Code</Text>
        
        {/* Loading indicator for auto-verification */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text variant="caption" style={styles.loadingText}>
              Verifying...
            </Text>
          </View>
        )}
        
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                otpInputRefs.current[index] = ref;
              }}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                isLoading && styles.otpInputDisabled,
              ]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={(e) => handleOtpKeyPress(e, index)}
              keyboardType="numeric"
              maxLength={index === 0 ? OTP_LENGTH : 1} // Allow paste on first input
              textAlign="center"
              selectTextOnFocus
              editable={!isLoading}
            />
          ))}
        </View>

        {/* OTP Timer/Resend */}
        <View style={styles.otpTimer}>
          {otpTimer > 0 ? (
            <View style={styles.timerContainer}>
              <Ionicons name="time-outline" size={16} color={COLORS.gray[500]} />
              <Text variant="caption" style={styles.timerText}>
                Resend OTP in {otpTimer}s
              </Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.resendButton} 
              onPress={handleResendOTP} 
              disabled={isLoading}
            >
              <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
              <Text variant="button" style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Help text */}
        <Text variant="caption" style={styles.helpText}>
          Didn't receive the code? Check your SMS or try resending.
        </Text>
      </View>
    </>
  );

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <View style={styles.overlay}>
          {/* Toast Component - Positioned above modal content */}
          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onHide={hideToast}
            duration={3000}
            position="top"
          />
          
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <Ionicons name="card-outline" size={22} color={COLORS.primary} />
                </View>
                <Text variant="h5" style={styles.title}>
                  {step === 'card-input' ? 'Update Card Number' : 'Verify OTP'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Ionicons name="close-outline" size={26} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            {step === 'card-input' ? renderCardInputStep() : renderOTPVerificationStep()}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    paddingVertical: SPACING.lg,
    shadowColor: COLORS.gray[900],
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
    paddingBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  closeButton: {
    padding: SPACING.xs,
  },
  sectionContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  currentCardContainer: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  currentCardLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: 4,
    fontWeight: '500',
  },
  currentCardNumber: {
    fontSize: 16,
    color: COLORS.gray[800],
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  helperText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: SPACING.xs,
    lineHeight: 20,
    flex: 1,
  },
  // OTP Styles
  otpInfoContainer: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 16,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  otpIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  otpInfoText: {
    fontSize: 15,
    color: COLORS.gray[700],
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  mobileNumber: {
    fontSize: 17,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  otpSubText: {
    fontSize: 13,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 18,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.sm,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    backgroundColor: COLORS.white,
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    shadowColor: COLORS.gray[400],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  otpInputDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  otpTimer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: SPACING.xs,
    fontWeight: '500',
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  resendText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  helpText: {
    textAlign: 'center',
    color: COLORS.gray[600],
    fontSize: 12,
    marginTop: SPACING.sm,
    lineHeight: 16,
  },
  // Action Styles
  actions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  updateButtonContainer: {
    flex: 1,
  },
});
