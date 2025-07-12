import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, SPACING } from '../../utils/constants';
import { FONT_WEIGHTS } from '../../utils/fonts';

export default function ForgotPassword() {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const { sendOTP, verifyOTP, isLoading, error, clearError } = useAuthStore();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Timer effect for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleGoBack = () => {
    router.back();
  };

  const validateMobile = (mobile: string) => {
    // Bangladesh mobile number format: 01xxxxxxxxx or +8801xxxxxxxxx
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    return phoneRegex.test(mobile);
  };

  const formatMobile = (mobile: string) => {
    // Remove +88 if present
    let formatted = mobile.replace(/^\+?88/, '');
    
    // Ensure it starts with 01 (only add if it doesn't already start with 01)
    if (!formatted.startsWith('01')) {
      if (formatted.startsWith('1')) {
        formatted = '0' + formatted; // Add missing 0 to make it 01xxxxxxxxx
      } else if (formatted.startsWith('0') && !formatted.startsWith('01')) {
        formatted = '01' + formatted.substring(1); // Replace 0x with 01x
      } else {
        formatted = '01' + formatted; // Add 01 prefix
      }
    }
    
    return formatted;
  };

  const handleSendOTP = async () => {
    clearError();
    
    if (!validateMobile(mobile)) {
      Alert.alert('Error', 'Please enter a valid Bangladesh mobile number (01xxxxxxxxx)');
      return;
    }

    const formattedMobile = formatMobile(mobile);
    const success = await sendOTP(formattedMobile);
    
    if (success) {
      setIsOtpSent(true);
      setTimer(60); // 60 seconds countdown
      Alert.alert(
        'OTP Sent',
        `A verification code has been sent to ${formattedMobile}`,
        [{ text: 'OK' }]
      );
    }
  };

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
      setTimeout(() => {
        handleVerifyOTP(newOtp.join(''));
      }, 100);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    clearError();
    
    const otpString = otpCode || otp.join('');
    if (!otpString || otpString.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    const formattedMobile = formatMobile(mobile);
    const success = await verifyOTP(formattedMobile, otpString);
    
    if (success) {
      // Navigate to password reset form with the verified mobile number
      router.push({
        pathname: '/(auth)/reset-password',
        params: { mobile: formattedMobile }
      });
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;
    
    clearError();
    const formattedMobile = formatMobile(mobile);
    const success = await sendOTP(formattedMobile);
    
    if (success) {
      setTimer(60);
      Alert.alert('OTP Sent', 'A new verification code has been sent to your mobile');
    }
  };

  const handleContactOrganization = () => {
    router.push('/(auth)/organization-contacts');
  };

  // OTP input state
  if (isOtpSent) {
    return (
      <>
        <StatusBar style="dark" backgroundColor={COLORS.brand.background} translucent={false} />
        <SafeAreaView style={styles.container}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.content}>
            <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
              <Text style={styles.title}>Enter Verification Code</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit verification code to {formatMobile(mobile)}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(800).delay(200)}>
              <Card variant="elevated" style={styles.formCard}>
                <View style={styles.formContent}>
                  <Text style={styles.otpLabel}>Enter Verification Code</Text>
                  
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
                  
                  {error && (
                    <Animated.View entering={FadeInDown.duration(300)} style={styles.errorContainer}>
                      <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                  )}

                  <View style={styles.resendContainer}>
                    {timer > 0 ? (
                      <Text style={styles.timerText}>
                        Resend code in {timer}s
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                        <Text style={[styles.resendText, isLoading && styles.resendTextDisabled]}>
                          Resend Code
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.helpText}>
                    Enter all 6 digits for automatic verification.
                  </Text>
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInUp.duration(800).delay(400)} style={styles.helpSection}>
              <TouchableOpacity onPress={handleContactOrganization} style={styles.organizationButton}>
                <Ionicons name="business" size={20} color={COLORS.primary} />
                <Text style={styles.organizationText}>Contact Your Organization</Text>
              </TouchableOpacity>
              
              <Text style={styles.helpNote}>
                If you're not receiving the code, contact your institution's admin for assistance.
              </Text>
            </Animated.View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Initial phone number input state
  return (
    <>
      <StatusBar style="dark" backgroundColor={COLORS.brand.background} translucent={false} />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.content}>
          <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your mobile number and we'll send you a verification code to reset your password.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <Card variant="elevated" style={styles.formCard}>
              <View style={styles.formContent}>
                <Input
                  label="Mobile Number"
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="Enter your mobile number (01xxxxxxxxx)"
                  keyboardType="phone-pad"
                  icon="call"
                  autoCapitalize="none"
                />
                
                {error && (
                  <Animated.View entering={FadeInDown.duration(300)} style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                  </Animated.View>
                )}

                <Button
                  title="Send Verification Code"
                  onPress={handleSendOTP}
                  loading={isLoading}
                  variant="primary"
                  size="medium"
                  fullWidth
                  icon="paper-plane"
                />
              </View>
            </Card>
          </Animated.View>

          <Animated.View entering={FadeInUp.duration(800).delay(400)} style={styles.helpSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>
            
            <TouchableOpacity onPress={handleContactOrganization} style={styles.organizationButton}>
              <Ionicons name="business" size={20} color={COLORS.primary} />
              <Text style={styles.organizationText}>Contact Your Organization</Text>
            </TouchableOpacity>
            
            <Text style={styles.helpNote}>
              If you're unable to reset your password, contact your institution's admin for assistance.
            </Text>
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: SPACING.md,
    zIndex: 1,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: FONT_WEIGHTS.semiBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    paddingTop: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 24,
    fontFamily: FONT_WEIGHTS.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
    fontFamily: FONT_WEIGHTS.regular,
  },
  formCard: {
    marginBottom: SPACING.md,
  },
  formContent: {
    gap: SPACING.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '10',
    padding: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
    fontFamily: FONT_WEIGHTS.medium,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontFamily: FONT_WEIGHTS.regular,
  },
  resendText: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: FONT_WEIGHTS.semiBold,
  },
  resendTextDisabled: {
    color: COLORS.gray[400],
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
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[900],
    backgroundColor: COLORS.white,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.brand.blue_subtle,
  },
  helpText: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  helpSection: {
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
    width: '100%',
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
    fontFamily: FONT_WEIGHTS.medium,
  },
  organizationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  organizationText: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: FONT_WEIGHTS.semiBold,
  },
  helpNote: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONT_WEIGHTS.regular,
  },
});
