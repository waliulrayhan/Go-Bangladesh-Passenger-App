import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { apiService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { useCardStore } from "../../stores/cardStore";
import { COLORS, SPACING } from "../../utils/constants";
import { storageService } from "../../utils/storage";

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
  REGISTRATION_DATA_MISSING: "Registration data not found. Please start the registration process again!",
  REGISTRATION_SUCCESS: "Your account has been created successfully. Welcome to Go Bangladesh!",
  LOGIN_FAILED: "Registration successful, but automatic login failed. Please log in manually.",
  REGISTRATION_FAILED: "Registration failed after OTP verification. Please try again.",
  VERIFICATION_FAILED: "OTP verification failed. Please check the code and try again.",
  INVALID_OTP: "Invalid OTP. Please try again.",
  RESEND_SUCCESS: "A new OTP has been sent to your mobile number.",
  RESEND_FAILED: "Failed to resend OTP. Please try again.",
} as const;

type RegistrationParams = {
  cardNumber: string;
  name: string;
  phone: string;
  email?: string;
  gender: "male" | "female";
  address: string;
  dateOfBirth: string;
  passengerId?: string;
  organizationType: string;
  organizationId: string;
  organizationName?: string;
};

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
 * VerifyRegistration Component
 * 
 * Handles OTP verification for new user registration with:
 * - SMS autofill support for better UX
 * - Countdown timer for resend functionality
 * - Complete registration flow after verification
 * - Automatic login after successful registration
 */
export default function VerifyRegistration() {
  const params = useLocalSearchParams<RegistrationParams>();

  // State management
  const [otp, setOtp] = useState<string[]>(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
  const [isResending, setIsResending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [showVerifyingText, setShowVerifyingText] = useState(false);
  const [isOtpReady, setIsOtpReady] = useState(false);

  // Custom hooks
  const { countdown, canResend, resetTimer } = useCountdownTimer();
  const otpAutofill = useOTPAutofill();

  // External hooks and stores
  const { login } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  // Refs
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const containerRef = useRef<View>(null);

  // Clear form when screen comes into focus (user navigates back)
  useFocusEffect(
    useCallback(() => {
      // Clear any existing error state and toast when screen is focused
      hideToast();
      
      return () => {
        // Cleanup: Clear form when navigating away
        setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
        setIsResending(false);
        setIsLoading(false);
        setIsAutoVerifying(false);
        setShowVerifyingText(false);
        setIsOtpReady(false);
      };
    }, []) // Empty dependencies to prevent infinite loops
  );

  // Helper functions
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const navigateBack = () => router.back();

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
      otpAutofill.resetAutofill();
    }
  }, [isOtpReady]);

  useEffect(() => {
    // Initialize clean state for autofill
    setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
    setIsAutoVerifying(false);
    setShowVerifyingText(false);
    otpAutofill.resetAutofill();
  }, []);

  useEffect(() => {
    const backAction = () => {
      navigateBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    return () => otpAutofill.cleanup();
  }, []);

  const handlePastedOTP = (pastedOtp: string): boolean => {
    const cleanOtp = pastedOtp.replace(/\D/g, "");
    
    if (cleanOtp.length >= OTP_CONSTRAINTS.LENGTH) {
      otpAutofill.isHandlingAutofill.current = true;
      setIsAutoVerifying(true);
      setShowVerifyingText(true);

      const newOtp = cleanOtp.slice(0, OTP_CONSTRAINTS.LENGTH).split("");
      setOtp(newOtp);

      setTimeout(() => {
        otpAutofill.isHandlingAutofill.current = false;
      }, 500);

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
      console.log("🔐 Verifying OTP for:", params.phone);

      const verificationResult = await apiService.verifyOTP(params.phone, otpString);

      if (verificationResult) {
        console.log("✅ OTP verification successful");
        await handleRegistrationFlow();
      } else {
        handleVerificationFailure();
      }
    } catch (error: any) {
      handleVerificationError(error);
    }
  };

  const handleRegistrationFlow = async () => {
    try {
      const tempData = await storageService.getItem<any>("temp_registration_data");
      console.log("🔍 Retrieved temp data:", tempData);

      if (!tempData) {
        console.error("❌ No stored registration data found");
        setIsLoading(false);
        showError(MESSAGES.REGISTRATION_DATA_MISSING);
        
        setTimeout(() => {
          router.replace("/(auth)/passenger-registration");
        }, 2000);
        return;
      }

      console.log("🔑 Calling registration API after OTP verification...");
      await apiService.registerPassenger(tempData.registrationData);
      console.log("✅ Registration API call successful");

      await storageService.removeItem("temp_registration_data");
      await handleAutoLogin(tempData);
      
    } catch (registrationError: any) {
      console.error("❌ Registration API error:", registrationError);
      setIsLoading(false);
      await storageService.removeItem("temp_registration_data");

      const errorMessage = registrationError.message || 
        registrationError.response?.data?.data?.message || 
        MESSAGES.REGISTRATION_FAILED;
      showError(errorMessage);
      
      setTimeout(() => {
        router.replace("/(auth)/passenger-registration");
      }, 3000);
    }
  };

  const handleAutoLogin = async (tempData: any) => {
    try {
      const { login } = useAuthStore.getState();
      const loginSuccess = await login(tempData.phone, tempData.password);

      if (loginSuccess) {
        try {
          await useCardStore.getState().loadCardDetails();
        } catch (cardError) {
          console.log("ℹ️ Card data loading failed:", cardError);
        }

        setIsLoading(false);
        showSuccess(MESSAGES.REGISTRATION_SUCCESS);
        
        setTimeout(() => {
          // Use dismissAll to clear navigation stack before going to tabs
          router.dismissAll();
          router.replace("/(tabs)");
        }, 2000);
      } else {
        setIsLoading(false);
        const currentError = useAuthStore.getState().error;
        const errorMessage = currentError 
          ? `Registration successful, but login failed: ${currentError}`
          : MESSAGES.LOGIN_FAILED;
        showError(errorMessage);
        
        setTimeout(() => {
          router.dismissAll();
          router.replace("/(auth)/passenger-login");
        }, 3000);
      }
    } catch (loginError) {
      setIsLoading(false);
      showError(MESSAGES.LOGIN_FAILED);
      setTimeout(() => {
        router.dismissAll();
        router.replace("/(auth)/passenger-login");
      }, 3000);
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
    setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
    setIsAutoVerifying(false);
    setShowVerifyingText(false);
    inputRefs.current[0]?.focus();
  };

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
        Enter the 6-digit code sent to{"\n"}
        <Text style={styles.phoneNumber}>{params.phone}</Text>
      </Text>
    </Animated.View>
  );

  const renderOTPForm = () => (
    <Animated.View entering={FadeInDown.duration(ANIMATION_DELAYS.FORM).delay(200)}>
      <Card variant="elevated">
        <View style={styles.otpContainer} ref={containerRef}>
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
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    digit && styles.otpInputFilled,
                    (isLoading || isAutoVerifying) && styles.otpInputDisabled,
                  ]}
                  value={digit}
                  onChangeText={(value) => !isAutoVerifying && handleOtpChange(value, index)}
                  onKeyPress={(e) => !isAutoVerifying && handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={index === 0 ? OTP_CONSTRAINTS.LENGTH : 1}
                  autoFocus={index === 0 && !isAutoVerifying}
                  selectTextOnFocus={true}
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

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOTP}
                disabled={isResending}
              >
                <Text style={styles.resendText}>
                  {isResending ? "Sending..." : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.countdownText}>
                Resend OTP in {formatTime(countdown)}
              </Text>
            )}
          </View>

            <Text style={styles.helpText}>
            {Platform.OS === "ios"
              ? "Didn't receive the code?\nCheck your SMS or try resending."
              : "Didn't receive the code?\nCheck your SMS or try resending."
            }
            </Text>
        </View>
      </Card>
    </Animated.View>
  );

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

      setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
      setIsAutoVerifying(false);
      setShowVerifyingText(false);

      // Try to get more specific error from the auth store if available
      const currentError = useAuthStore.getState().error;
      let errorMessage: string = MESSAGES.RESEND_FAILED;
      
      if (currentError) {
        errorMessage = currentError;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      }
      
      showError(errorMessage);
    }
  };

  return (
    <>
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

        <TouchableOpacity style={styles.backButton} onPress={navigateBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
            scrollEventThrottle={16}
            removeClippedSubviews={false}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 0,
            }}
            automaticallyAdjustContentInsets={false}
            contentInsetAdjustmentBehavior="never"
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  backButton: {
    position: "absolute",
    left: SPACING.md,
    top: 60, // Increased for translucent status bar
    padding: SPACING.sm,
    zIndex: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.brand.blue_subtle,
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
  userInfo: {
    backgroundColor: COLORS.brand.orange_subtle,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: "center",
    gap: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.gray[900],
    fontWeight: "600",
  },
  cardInfo: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "500",
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
    borderColor: COLORS.primary,
    backgroundColor: COLORS.brand.blue_subtle,
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
    color: COLORS.primary,
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
