import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
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

  const handleOtpChange = (text: string) => {
    // Filter only digits and limit to 6 characters
    const filteredText = text.replace(/[^0-9]/g, '').slice(0, 6);
    setOtp(filteredText);
    setError(''); // Clear error when user types
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
      await onSendOTP(cardNumber.trim());
      setStep('otp-verification');
      setOtpTimer(60); // 60 seconds countdown
    } catch (error: any) {
      setError(error.message || 'Failed to send OTP');
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
      {/* Content */}
      <View style={styles.content}>
        {currentCardNumber && (
          <View style={styles.currentCardContainer}>
            <Text style={styles.currentCardLabel}>Current Card Number</Text>
            <Text style={styles.currentCardNumber}>{currentCardNumber}</Text>
          </View>
        )}

        <Input
          label="New Card Number"
          value={cardNumber}
          onChangeText={handleCardNumberChange}
          placeholder="Enter new card number (e.g. ABC123456)"
          keyboardType="default"
          icon="card"
          maxLength={16}
          autoCapitalize="characters"
          error={error}
        />

        <Text style={styles.helperText}>
          Enter the new card number printed on your Go Bangladesh transport card
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelText}>Cancel</Text>
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
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.otpInfoContainer}>
          <Text style={styles.otpInfoText}>
            We've sent a verification code to your mobile number
          </Text>
          <Text style={styles.mobileNumber}>{userMobile}</Text>
          <Text style={styles.otpSubText}>
            Enter the 6-digit code to update your card number
          </Text>
        </View>

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
            <Text style={styles.timerText}>Resend OTP in {otpTimer}s</Text>
          ) : (
            <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
          <Text style={styles.cancelText}>Back</Text>
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
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name="card" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.title}>
                {step === 'card-input' ? 'Update Card Number' : 'Verify OTP'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.gray[600]} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    paddingVertical: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  currentCardContainer: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  currentCardLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: 4,
    fontWeight: '500',
  },
  currentCardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    letterSpacing: 1,
  },
  helperText: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  updateButtonContainer: {
    flex: 1,
  },
  otpInfoContainer: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  otpInfoText: {
    fontSize: 14,
    color: COLORS.gray[700],
    textAlign: 'center',
    marginBottom: 4,
  },
  mobileNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  otpSubText: {
    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  otpTimer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  resendText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});
