import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { apiService } from '../services/api';
import { COLORS, SPACING } from '../utils/constants';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Text } from './ui/Text';

interface UpdateCardModalProps {
  visible: boolean;
  currentCardNumber?: string;
  userMobile?: string;
  onClose: () => void;
  onUpdate: (newCardNumber: string, otp: string) => Promise<void>;
  onSendOTP: (cardNumber: string) => Promise<void>;
}

type Step = 'card-input' | 'otp-verification';

export const UpdateCardModal: React.FC<UpdateCardModalProps> = ({
  visible,
  currentCardNumber,
  userMobile,
  onClose,
  onUpdate,
  onSendOTP
}) => {
  const [step, setStep] = useState<Step>('card-input');
  const [cardNumber, setCardNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setStep('card-input');
      setCardNumber('');
      setOtp('');
      setError('');
      setOtpTimer(0);
    }
  }, [visible]);

  // OTP Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const validateCardNumber = (input: string) => {
    // Validation for card number (at least 8 characters, only capital letters and numbers)
    const cardRegex = /^[A-Z0-9]{8,}$/;
    return cardRegex.test(input.trim());
  };

  const validateOTP = (input: string) => {
    // Validate OTP (6 digits)
    const otpRegex = /^\d{6}$/;
    return otpRegex.test(input.trim());
  };

  const handleCardNumberChange = (text: string) => {
    // Convert to uppercase and filter only letters and numbers
    const filteredText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCardNumber(filteredText);
    setError(''); // Clear error when user types
  };

  const handleOtpChange = (value: string) => {
    if (isLoading) return; // Prevent changes while loading
    setOtp(value);
    setError(''); // Clear error when user types
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOTP = async () => {
    if (!validateCardNumber(cardNumber)) {
      setError('Please enter a valid card number (at least 8 characters, letters and numbers only)');
      return;
    }

    if (cardNumber.trim() === currentCardNumber) {
      setError('Please enter a different card number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First check if the card is valid and available
      const cardValidationResponse = await apiService.checkCardValidity(cardNumber.trim());
      
      if (!cardValidationResponse.isSuccess) {
        setError(cardValidationResponse.message || 'Card is not valid or not available');
        return;
      }

      // If card is valid, proceed to send OTP
      await onSendOTP(cardNumber.trim());
      setStep('otp-verification');
      setOtpTimer(60); // 60 seconds countdown
    } catch (error: any) {
      // Handle specific error messages from card validation
      if (error.response?.data?.data?.message) {
        setError(error.response.data.data.message);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message || 'Failed to validate card or send OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndUpdate = async () => {
    if (!validateOTP(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onUpdate(cardNumber.trim(), otp.trim());
      setCardNumber('');
      setOtp('');
      setStep('card-input');
      onClose();
    } catch (error: any) {
      setError(error.message || 'Failed to update card number');
      // Clear OTP form on error
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      await onSendOTP(cardNumber.trim());
      setOtpTimer(60); // Reset countdown
    } catch (error: any) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('card-input');
    setOtp('');
    setError('');
  };

  const handleClose = () => {
    setCardNumber('');
    setOtp('');
    setError('');
    setStep('card-input');
    onClose();
  };

  const renderCardInputStep = () => (
    <>
      {/* Card Information Section */}
      <View style={styles.sectionContainer}>
        
        {currentCardNumber && (
          <View style={styles.currentCardContainer}>
            <Text variant="caption" style={styles.currentCardLabel}>Current Card Number</Text>
            <Text variant="body" style={styles.currentCardNumber}>{currentCardNumber}</Text>
          </View>
        )}
      </View>

      {/* Update Section */}
      <View style={styles.sectionContainer}>
        {/* <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="card-outline" size={18} color={COLORS.primary} />
          </View>
          <Text variant="body" style={styles.sectionTitle}>New Card Details</Text>
        </View> */}

        <Input
          label="New Card Number"
          value={cardNumber}
          onChangeText={handleCardNumberChange}
          placeholder="(e.g. ABCD1234)"
          keyboardType="default"
          icon="card"
          maxLength={16}
          autoCapitalize="characters"
          error={error}
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
      {/* Verification Information Section */}
      <View style={styles.sectionContainer}>
        {/* <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
          </View>
          <Text variant="body" style={styles.sectionTitle}>Verification Required</Text>
        </View> */}
        
        <View style={styles.otpInfoContainer}>
          <Text variant="body" style={styles.otpInfoText}>
            We've sent a verification code to your mobile number
          </Text>
          <Text variant="body" style={styles.mobileNumber}>{userMobile}</Text>
          <Text variant="caption" style={styles.otpSubText}>
            Enter the 6-digit code to update your card number
          </Text>
        </View>
      </View>

      {/* OTP Input Section */}
      <View style={styles.sectionContainer}>
        {/* <View style={styles.sectionHeader}>
          <View style={styles.sectionIconContainer}>
            <Ionicons name="keypad" size={18} color={COLORS.primary} />
          </View>
          <Text variant="body" style={styles.sectionTitle}>Enter Code</Text>
        </View> */}

        <Input
          label="Verification Code"
          value={otp}
          onChangeText={handleOtpChange}
          placeholder="Enter 6-digit OTP"
          keyboardType="numeric"
          icon="lock-closed"
          maxLength={6}
          error={error}
        />

        <View style={styles.otpTimer}>
          {otpTimer > 0 ? (
            <Text variant="caption" style={styles.timerText}>Resend OTP in {otpTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
              <Text variant="button" style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
          <Text variant="button" style={styles.cancelText}>Back</Text>
        </TouchableOpacity>
        
        <View style={styles.updateButtonContainer}>
          <Button
            title="Update Card"
            onPress={handleVerifyAndUpdate}
            loading={isLoading}
            disabled={!otp.trim() || isLoading}
            size="medium"
            fullWidth
          />
        </View>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="card" size={22} color={COLORS.primary} />
              </View>
              <Text variant="h5" style={styles.title}>
                {step === 'card-input' ? 'Update Card Number' : 'Verify OTP'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={26} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          {step === 'card-input' ? renderCardInputStep() : renderOTPVerificationStep()}
        </View>
      </View>
    </Modal>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
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
    paddingHorizontal: SPACING.xl,
  },
  helperText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginLeft: SPACING.xs,
    lineHeight: 20,
    flex: 1,
  },
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
    borderRadius: 10,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  updateButtonContainer: {
    flex: 1,
  },
  otpInfoContainer: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  otpInfoText: {
    fontSize: 14,
    color: COLORS.gray[700],
    textAlign: 'center',
    marginBottom: 6,
  },
  mobileNumber: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  otpSubText: {
    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  otpTimer: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.gray[600],
    backgroundColor: COLORS.gray[50],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
});
