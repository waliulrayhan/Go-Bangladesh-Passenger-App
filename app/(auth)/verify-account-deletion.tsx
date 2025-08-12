import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { apiService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SPACING } from "../../utils/constants";

const ANIMATION_DELAYS = {
  HEADER: 800,
  FORM: 1000,
} as const;

const OTP_CONSTRAINTS = {
  LENGTH: 6,
  TIMER_DURATION: 60,
  AUTO_FILL_TIMEOUT: 100,
  RAPID_INPUT_THRESHOLD: 100,
  VERIFICATION_DELAY: 200,
  FOCUS_DELAY: 50,
  FIRST_INPUT_DELAY: 30,
} as const;

const MESSAGES = {
  COMPLETE_OTP: "Please enter the complete 6-digit OTP!",
  VERIFICATION_SUCCESS: "Your account deletion has been processed successfully.",
  VERIFICATION_FAILED: "OTP verification failed. Please check the code and try again.",
  INVALID_OTP: "Invalid OTP. Please try again.",
  RESEND_SUCCESS: "A new OTP has been sent to your mobile number.",
  RESEND_FAILED: "Failed to resend OTP. Please try again.",
  DEACTIVATION_FAILED: "Failed to deactivate account. Please try again.",
} as const;

type AccountDeletionParams = {
  phone: string;
  userName: string;
};

/**
 * Custom hook for managing countdown timer
 */
const useCountdownTimer = () => {
  const [countdown, setCountdown] = useState<number>(OTP_CONSTRAINTS.TIMER_DURATION);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
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

  const resetTimer = () => {
    setCountdown(OTP_CONSTRAINTS.TIMER_DURATION);
    setCanResend(false);
  };

  return { countdown, canResend, resetTimer };
};

/**
 * VerifyAccountDeletion Component
 * 
 * Handles OTP verification for account deletion with:
 * - SMS autofill support for better UX
 * - Countdown timer for resend functionality
 * - Complete account deactivation flow after verification
 * - Automatic logout and navigation to login after successful deletion
 */
export default function VerifyAccountDeletion() {
  const params = useLocalSearchParams<AccountDeletionParams>();

  // State management
  const [otp, setOtp] = useState<string[]>(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [showVerifyingText, setShowVerifyingText] = useState(false);
  const [isOtpReady, setIsOtpReady] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Custom hooks
  const { countdown, canResend, resetTimer } = useCountdownTimer();

  // External hooks and stores
  const { user, logout } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  // Refs
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Helper functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const navigateBack = () => {
    // Dismiss keyboard before navigation to prevent UI issues
    Keyboard.dismiss();
    // Small delay to ensure keyboard is fully dismissed
    setTimeout(() => {
      router.back();
    }, 100);
  };

  // Effects
  useEffect(() => {
    // Trigger OTP ready state for autofill
    const timer = setTimeout(() => {
      setIsOtpReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOtpReady) {
      setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
    }
  }, [isOtpReady]);

  useEffect(() => {
    const backAction = () => {
      navigateBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  // Keyboard event listeners to handle Android keyboard behavior
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      // Pre-emptively set keyboard height to 0 for smoother transition
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  const handlePastedOTP = (pastedOtp: string): boolean => {
    const cleanOtp = pastedOtp.replace(/\D/g, "");
    
    if (cleanOtp.length >= OTP_CONSTRAINTS.LENGTH) {
      setIsAutoVerifying(true);
      setShowVerifyingText(true);

      const newOtp = cleanOtp.slice(0, OTP_CONSTRAINTS.LENGTH).split("");
      setOtp(newOtp);

      setTimeout(() => {
        inputRefs.current[OTP_CONSTRAINTS.LENGTH - 1]?.focus();
        inputRefs.current[OTP_CONSTRAINTS.LENGTH - 1]?.blur();
      }, 100);

      setTimeout(() => {
        handleVerify(newOtp.join(""));
      }, OTP_CONSTRAINTS.VERIFICATION_DELAY);

      return true;
    }
    return false;
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isLoading || isAutoVerifying) return;

    // Handle pasted OTP (multiple characters at once)
    if (value.length > 1) {
      const pastedOtp = value.replace(/\D/g, "").slice(0, OTP_CONSTRAINTS.LENGTH);
      if (handlePastedOTP(pastedOtp)) return;
    }

    // For first input, handle SMS autofill specially
    if (index === 0) {
      const cleanValue = value.replace(/\D/g, "");
      
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
      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        newOtp[index] = value.slice(-1);

        // Auto-verify when all digits are filled
        if (newOtp.every((digit) => digit !== "") && newOtp.length === OTP_CONSTRAINTS.LENGTH) {
          setIsAutoVerifying(true);
          setShowVerifyingText(true);
          setTimeout(() => {
            handleVerify(newOtp.join(""));
          }, 100);
        }

        return newOtp;
      });

      // Auto-focus next input
      if (value && index < OTP_CONSTRAINTS.LENGTH - 1 && !isAutoVerifying) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 10);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const otpString = otpCode || otp.join("");

    if (otpString.length !== OTP_CONSTRAINTS.LENGTH) {
      showError(MESSAGES.COMPLETE_OTP);
      return;
    }

    setIsLoading(true);

    try {
      console.log("🔐 Verifying OTP for account deletion:", params.phone);

      const verificationResult = await apiService.verifyOTP(params.phone, otpString);

      if (verificationResult) {
        console.log("✅ OTP verification successful, proceeding with account deactivation");
        await handleAccountDeactivation();
      } else {
        handleVerificationFailure();
      }
    } catch (error: any) {
      handleVerificationError(error);
    }
  };

  const handleAccountDeactivation = async () => {
    try {
      if (!user?.id) {
        throw new Error("User ID not found");
      }

      console.log("🔑 Calling account deactivation API...");
      const result = await apiService.deactivateAccount(user.id.toString());
      
      if (result.isSuccess) {
        console.log("✅ Account deactivation successful");
        showSuccess(MESSAGES.VERIFICATION_SUCCESS);
        
        // Clear all user data and logout
        setTimeout(async () => {
          await handleLogoutAndRedirect();
        }, 2000);
      } else {
        throw new Error(result.message || "Account deactivation failed");
      }
    } catch (deactivationError: any) {
      console.error("❌ Account deactivation error:", deactivationError);
      setIsLoading(false);
      
      const errorMessage = deactivationError.message || 
        deactivationError.response?.data?.data?.message || 
        MESSAGES.DEACTIVATION_FAILED;
      showError(errorMessage);
      
      // Reset OTP form to allow retry
      resetOTPForm();
    }
  };

  const handleLogoutAndRedirect = async () => {
    try {
      // Perform logout to clear all user data
      await logout();
      
      console.log('✅ [ACCOUNT_DELETION] User data cleared successfully');
    } catch (logoutError) {
      console.error("❌ Logout error during account deletion:", logoutError);
      // The logout function now handles navigation internally,
      // so we don't need manual navigation here
    }
  };

  const handleVerificationFailure = () => {
    setIsLoading(false);
    resetOTPForm();
    showError(MESSAGES.VERIFICATION_FAILED);
  };

  const handleVerificationError = (error: any) => {
    setIsLoading(false);
    console.error("❌ OTP verification error:", error);
    resetOTPForm();
    
    const errorMessage = error.message || 
      error.response?.data?.data?.message || 
      MESSAGES.INVALID_OTP;
    showError(errorMessage);
  };

  const resetOTPForm = () => {
    // Dismiss keyboard first to prevent UI issues
    Keyboard.dismiss();
    setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
    setIsAutoVerifying(false);
    setShowVerifyingText(false);
    // Focus after keyboard is dismissed
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
  };

  const handleResendOTP = async () => {
    setIsResending(true);

    try {
      console.log("🔄 Resending OTP to:", params.phone);

      await apiService.sendOTP(params.phone);
      console.log("✅ OTP resent successfully");

      setIsResending(false);
      setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
      resetTimer();
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, OTP_CONSTRAINTS.FOCUS_DELAY);

      showSuccess(MESSAGES.RESEND_SUCCESS);
    } catch (error: any) {
      setIsResending(false);
      console.error("❌ Resend OTP error:", error);

      // Dismiss keyboard on error to prevent UI issues
      Keyboard.dismiss();
      setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
      setIsAutoVerifying(false);
      setShowVerifyingText(false);

      const errorMessage = error.message || 
        error.response?.data?.data?.message || 
        MESSAGES.RESEND_FAILED;
      showError(errorMessage);
    }
  };

  // Render functions
  const renderHeader = () => (
    <Animated.View entering={FadeInUp.duration(ANIMATION_DELAYS.HEADER)} style={styles.header}>
      <View style={styles.iconContainer}>
        <Ionicons name="trash" size={32} color={COLORS.error} />
      </View>

      <Text variant="h3" color={COLORS.secondary} style={styles.title}>
        Verify Account Deletion
      </Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to{"\n"}
        <Text style={styles.phoneNumber}>{params.phone}</Text>
      </Text>
      <Text style={styles.warningText}>
        This action will permanently delete your account for{"\n"}
        <Text style={styles.userName}>{params.userName}</Text>
      </Text>
    </Animated.View>
  );

  const renderOTPForm = () => (
    <Animated.View entering={FadeInDown.duration(ANIMATION_DELAYS.FORM).delay(200)}>
      <Card variant="elevated">
        <View style={styles.otpContainer}>
          {!showVerifyingText && (
            <Text style={styles.otpLabel}>Enter Verification Code</Text>
          )}

          <View style={styles.otpInputContainer} key={`otp-container-${isOtpReady}`}>
            {showVerifyingText && (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Verifying & Deleting Account...</Text>
              </View>
            )}

            {Array.from({ length: OTP_CONSTRAINTS.LENGTH }).map((_, index) => (
              <View key={index} style={styles.otpInputWrapper}>
                <TextInput
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    otp[index] && styles.otpInputFilled,
                    (isLoading || isAutoVerifying) && styles.otpInputDisabled,
                  ]}
                  value={otp[index]}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onBlur={() => {
                    // Handle blur event to prevent UI issues on Android
                    if (Platform.OS === "android") {
                      // Small delay to ensure proper cleanup
                      setTimeout(() => {
                        setKeyboardHeight(0);
                      }, 100);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={index === 0 ? OTP_CONSTRAINTS.LENGTH : 1}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                  editable={!isLoading && !isAutoVerifying}
                  selectTextOnFocus
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    // Handle submit to dismiss keyboard properly
                    Keyboard.dismiss();
                  }}
                />
              </View>
            ))}
          </View>

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity 
                style={styles.resendButton} 
                onPress={handleResendOTP}
                disabled={isResending || isLoading}
              >
                <Text style={styles.resendText}>
                  {isResending ? "Sending..." : "Resend Code"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.countdownText}>
                Resend code in {formatTime(countdown)}
              </Text>
            )}
          </View>

          <Text style={styles.helpText}>
            Didn't receive the code? Check your SMS messages or try resending.
          </Text>
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <>
      <StatusBar style="light" backgroundColor="transparent" translucent={true} />
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[
            "rgba(220, 53, 69, 0.5)",
            "rgba(220, 53, 69, 0.2)",
            "transparent",
            "rgba(255, 138, 0, 0.2)",
            "rgba(255, 138, 0, 0.4)",
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          style={styles.glowBackground}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            enabled={Platform.OS === "ios"}
          >
            <View style={[styles.content, Platform.OS === "android" && keyboardHeight > 0 && {
              paddingBottom: keyboardHeight * 0.1, // Minimal adjustment for Android
            }]}>
              {renderHeader()}
              {renderOTPForm()}
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
          position="top"
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
    zIndex: 1,
    // Prevent layout shifts on Android
    minHeight: Platform.OS === "android" ? "100%" : undefined,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  backButton: {
    position: "absolute",
    left: SPACING.md,
    top: 60,
    padding: SPACING.sm,
    zIndex: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.error + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  title: {
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.gray[600],
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  phoneNumber: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.error,
    textAlign: "center",
    lineHeight: 18,
    backgroundColor: COLORS.error + "08",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  userName: {
    fontWeight: "600",
    color: COLORS.error,
  },
  otpContainer: {
    padding: SPACING.md,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  otpInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray[900],
    backgroundColor: COLORS.white,
  },
  otpInputFilled: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + "08",
  },
  otpInputDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    paddingTop: 5,
    position: "absolute",
    top: -30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.error,
    fontWeight: "600",
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  resendButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },
  countdownText: {
    color: COLORS.gray[600],
    fontSize: 14,
  },
  helpText: {
    textAlign: "center",
    color: COLORS.gray[600],
    fontSize: 12,
    marginTop: SPACING.sm,
    lineHeight: 16,
  },
  glowBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    zIndex: 0,
  },
});
