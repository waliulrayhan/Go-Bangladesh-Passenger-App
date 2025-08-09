import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
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

import { GoBangladeshLogo } from "../../components/GoBangladeshLogo";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Text } from "../../components/ui/Text";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { useForgotPasswordStore } from "../../stores/forgotPasswordStore";
import { COLORS, SPACING } from "../../utils/constants";

const ANIMATION_DELAYS = {
  HEADER: 800,
  FORM: 1000,
  BOTTOM: 1200,
} as const;

const MOBILE_CONSTRAINTS = {
  MAX_LENGTH: 11,
  MIN_LENGTH: 11,
} as const;

const OTP_CONSTRAINTS = {
  LENGTH: 6,
  TIMER_DURATION: 60,
  AUTO_FILL_TIMEOUT: 150,
  RAPID_INPUT_THRESHOLD: 100,
  FIRST_INPUT_DELAY: 50,
  VERIFICATION_DELAY: 200,
  FOCUS_DELAY: 300,
} as const;

const MESSAGES = {
  INVALID_MOBILE: "Please enter a valid Bangladesh mobile number (01xxxxxxxxx)",
  INVALID_OTP: "Please enter a valid 6-digit OTP",
  NOT_REGISTERED: "This mobile number is not registered!",
  SEND_FAILED: "Failed to send verification code. Please try again.",
  VERIFY_SUCCESS: "OTP verified successfully!",
  VERIFY_FAILED: "The OTP you entered is incorrect. Please try again!",
  VERIFY_ERROR: "Failed to verify OTP. Please try again!",
  RESEND_SUCCESS: "A new verification code has been sent to your mobile!",
  RESEND_FAILED: "Failed to resend verification code. Please try again.",
  HELP_INFO: "If you're having trouble with your account, please contact us at info@thegobd.com",
} as const;

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
 * Custom hook for managing OTP timer
 */
const useOTPTimer = () => {
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const startTimer = () => setTimer(OTP_CONSTRAINTS.TIMER_DURATION);

  return { timer, startTimer };
};

/**
 * ForgotPassword Component
 * 
 * Handles password recovery with:
 * - Mobile number validation and formatting
 * - OTP sending and verification with SMS autofill support
 * - Resend functionality with countdown timer
 * - Clean separation of concerns with custom hooks
 */
export default function ForgotPassword() {
  // State management
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [showVerifyingText, setShowVerifyingText] = useState(false);

  // Custom hooks
  const { timer, startTimer } = useOTPTimer();
  const otpAutofill = useOTPAutofill();

  // External hooks and stores
  const { sendOTPForForgotPassword, verifyOTP, resetPassword, isLoading, clearError } = useForgotPasswordStore();
  const { toast, showError, showSuccess, showInfo, hideToast } = useToast();
  
  // Refs
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const navigateBack = () => router.back();

  const validateMobile = (mobile: string): boolean => {
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    return phoneRegex.test(mobile);
  };

  const formatMobile = (mobile: string): string => {
    let formatted = mobile.replace(/^\+?88/, "");
    
    if (!formatted.startsWith("01")) {
      if (formatted.startsWith("1")) {
        formatted = "0" + formatted;
      } else if (formatted.startsWith("0") && !formatted.startsWith("01")) {
        formatted = "01" + formatted.substring(1);
      } else {
        formatted = "01" + formatted;
      }
    }
    
    return formatted;
  };

  const getIndicatorColor = () => {
    if (mobile.length === MOBILE_CONSTRAINTS.MAX_LENGTH && validateMobile(mobile)) {
      return COLORS.success;
    }
    if (mobile.length > MOBILE_CONSTRAINTS.MAX_LENGTH) {
      return COLORS.error;
    }
    return COLORS.primary;
  };

  // Effects
  useEffect(() => {
    if (isOtpSent) {
      setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      otpAutofill.resetAutofill();
      
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, OTP_CONSTRAINTS.FOCUS_DELAY);
    }
  }, [isOtpSent]);

  useEffect(() => {
    return () => {
      otpAutofill.cleanup();
    };
  }, []);

  // Monitor for autofill patterns that might miss the first digit
  useEffect(() => {
    const filledCount = otp.filter(digit => digit !== "").length;
    const firstEmpty = otp[0] === "";
    const restFilled = otp.slice(1).every(digit => digit !== "");
    
    // If we have exactly 5 digits filled, all in positions 2-6, and first is empty
    // This is likely the autofill bug where first digit was missed
    if (filledCount === 5 && firstEmpty && restFilled && !isAutoVerifying) {
      console.log("Detected potential autofill bug: 5 digits filled but first is empty");
      console.log("Current OTP state:", otp);
      
      // We could attempt to fix this by prompting user or making first field more prominent
      // For now, just log it for debugging
    }
  }, [otp, isAutoVerifying]);

  // Event handlers
  const handleSendOTP = async () => {
    clearError();

    if (!validateMobile(mobile)) {
      showError(MESSAGES.INVALID_MOBILE);
      return;
    }

    const formattedMobile = formatMobile(mobile);
    const success = await sendOTPForForgotPassword(formattedMobile);

    if (success) {
      setIsOtpSent(true);
      startTimer();
      showSuccess(`A verification code has been sent to ${formattedMobile}`);
    } else {
      const currentError = useForgotPasswordStore.getState().error;
      if (currentError) {
        if (currentError.includes("not found")) {
          showError(MESSAGES.NOT_REGISTERED);
        } else {
          showError(currentError);
        }
      } else {
        showError(MESSAGES.SEND_FAILED);
      }
    }
  };

  const handlePastedOTP = (pastedOtp: string): boolean => {
    // Clean the input to only contain digits
    const cleanOtp = pastedOtp.replace(/\D/g, "");
    console.log("handlePastedOTP called with:", pastedOtp, "cleaned:", cleanOtp, "length:", cleanOtp.length);
    
    if (cleanOtp.length >= OTP_CONSTRAINTS.LENGTH) {
      console.log("Processing full OTP with all 6 digits:", cleanOtp);
      otpAutofill.isHandlingAutofill.current = true;
      setIsAutoVerifying(true);
      setShowVerifyingText(true);

      // Take exactly 6 digits and split them
      const newOtp = cleanOtp.slice(0, OTP_CONSTRAINTS.LENGTH).split("");
      
      console.log("Setting complete OTP array:", newOtp);
      setOtp(newOtp);

      // Clear autofill handling after a delay
      setTimeout(() => {
        otpAutofill.isHandlingAutofill.current = false;
        setIsAutoVerifying(false);
        setShowVerifyingText(false);
      }, 500);

      // Blur all inputs
      setTimeout(() => {
        inputRefs.current.forEach((ref) => ref?.blur());
      }, 100);

      // Verify the OTP
      setTimeout(() => {
        handleVerifyOTP(newOtp.join(""));
      }, OTP_CONSTRAINTS.VERIFICATION_DELAY);

      return true;
    } else if (cleanOtp.length >= 4) {
      // Handle partial OTP (fallback for when not all digits come through)
      console.log("Processing partial OTP with", cleanOtp.length, "digits:", cleanOtp);
      const newOtp = [...otp];
      
      // Fill in the digits we have
      for (let i = 0; i < cleanOtp.length && i < OTP_CONSTRAINTS.LENGTH; i++) {
        newOtp[i] = cleanOtp[i];
      }
      
      setOtp(newOtp);
      
      // Focus on the next empty input
      const nextEmptyIndex = newOtp.findIndex(digit => digit === "");
      if (nextEmptyIndex !== -1 && nextEmptyIndex < OTP_CONSTRAINTS.LENGTH) {
        setTimeout(() => {
          inputRefs.current[nextEmptyIndex]?.focus();
        }, 100);
      }
      
      return true;
    }
    
    return false;
  };

  const handleAutofillSequence = (value: string, index: number): boolean => {
    const now = Date.now();
    const timeDiff = now - otpAutofill.lastOtpInputTime.current;
    otpAutofill.lastOtpInputTime.current = now;

    // Extract only digits from the value
    const cleanValue = value.replace(/\D/g, "");
    const isRapidInput = timeDiff < OTP_CONSTRAINTS.RAPID_INPUT_THRESHOLD && timeDiff > 0;

    // Special handling for first input with full OTP
    if (index === 0 && cleanValue.length >= OTP_CONSTRAINTS.LENGTH) {
      return handlePastedOTP(cleanValue);
    }

    if (isRapidInput || otpAutofill.isHandlingAutofill.current) {
      if (!otpAutofill.isHandlingAutofill.current) {
        otpAutofill.isHandlingAutofill.current = true;
        setIsAutoVerifying(true);
        setShowVerifyingText(true);
        otpAutofill.autofillDigits.current = new Array(OTP_CONSTRAINTS.LENGTH).fill("");
      }

      // Store the digit in the correct position
      otpAutofill.autofillDigits.current[index] = cleanValue.slice(-1);

      if (otpAutofill.autofillTimeout.current) clearTimeout(otpAutofill.autofillTimeout.current);
      otpAutofill.autofillTimeout.current = setTimeout(() => {
        const collectedDigits = [...otpAutofill.autofillDigits.current];
        const validDigits = collectedDigits.filter((d: string) => d && d !== "");

        // Lower threshold to 3 to catch more autofill scenarios
        if (validDigits.length >= 3) {
          // Fill in any missing digits from current OTP state
          for (let i = 0; i < OTP_CONSTRAINTS.LENGTH; i++) {
            if (!collectedDigits[i] && otp[i]) {
              collectedDigits[i] = otp[i];
            }
          }

          setOtp(collectedDigits);

          const finalValidDigits = collectedDigits.filter((d: string) => d && d !== "");
          if (finalValidDigits.length >= OTP_CONSTRAINTS.LENGTH) {
            inputRefs.current.forEach((ref) => ref?.blur());
            setTimeout(() => {
              handleVerifyOTP(collectedDigits.join(""));
            }, OTP_CONSTRAINTS.VERIFICATION_DELAY);
          }
        } else if (validDigits.length > 0) {
          setOtp(collectedDigits);
        }

        otpAutofill.autofillDigits.current = [];
        otpAutofill.isHandlingAutofill.current = false;
      }, OTP_CONSTRAINTS.AUTO_FILL_TIMEOUT);

      return true;
    }
    
    if (index === 0 && !otpAutofill.isHandlingAutofill.current) {
      setTimeout(() => {
        if (!otpAutofill.isHandlingAutofill.current) {
          handleManualOTPInput(cleanValue, index);
        }
      }, OTP_CONSTRAINTS.FIRST_INPUT_DELAY);
      return true;
    }
    
    return false;
  };

  const handleManualOTPInput = (value: string, index: number) => {
    if (value.length <= 1) {
      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        newOtp[index] = value.slice(-1);

        // Check if we have 5 consecutive digits (missing first digit scenario)
        const filledDigits = newOtp.filter(digit => digit !== "").length;
        const consecutiveDigits = newOtp.slice(1).filter(digit => digit !== "").length;
        
        if (filledDigits === 5 && consecutiveDigits === 5 && newOtp[0] === "") {
          console.log("Detected 5 digits with missing first digit - likely autofill issue");
          // This might be the autofill bug - let user know or handle gracefully
        }

        if (newOtp.every((digit) => digit !== "") && newOtp.length === OTP_CONSTRAINTS.LENGTH) {
          setIsAutoVerifying(true);
          setShowVerifyingText(true);
          setTimeout(() => {
            handleVerifyOTP(newOtp.join(""));
          }, 100);
        }

        return newOtp;
      });

      if (value && index < OTP_CONSTRAINTS.LENGTH - 1 && !isAutoVerifying) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 10);
      }
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isLoading || isAutoVerifying) return;

    console.log(`handleOtpChange called - index: ${index}, value: "${value}", length: ${value.length}`);

    // Handle pasted OTP (multiple characters at once)
    if (value.length > 1) {
      const pastedOtp = value.replace(/\D/g, "");
      console.log(`Multi-character input detected - cleaned: "${pastedOtp}"`);
      if (handlePastedOTP(pastedOtp)) return;
    }

    // For first input, handle SMS autofill specially
    if (index === 0) {
      // Extract the clean digit(s)
      const cleanValue = value.replace(/\D/g, "");
      console.log(`First input - original: "${value}", cleaned: "${cleanValue}"`);
      
      // If we get 6 digits in first input (SMS autofill), handle as complete OTP
      if (cleanValue.length === OTP_CONSTRAINTS.LENGTH) {
        console.log("Full 6-digit OTP detected in first input - handling as complete autofill");
        if (handlePastedOTP(cleanValue)) return;
      }
      
      // If we get multiple digits (but not exactly 6), handle as paste
      if (cleanValue.length > 1 && cleanValue.length < OTP_CONSTRAINTS.LENGTH) {
        console.log("Partial multi-digit input detected");
        if (handlePastedOTP(cleanValue)) return;
      }
      
      // Store the first digit immediately (single digit input)
      if (cleanValue.length === 1) {
        setOtp((prevOtp) => {
          const newOtp = [...prevOtp];
          newOtp[0] = cleanValue;
          return newOtp;
        });
        
        // Focus next input for manual entry
        if (!isAutoVerifying) {
          setTimeout(() => {
            inputRefs.current[1]?.focus();
          }, 10);
        }
      }
      return;
    }

    // For other inputs, handle normally
    handleManualOTPInput(value, index);
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    if (isLoading) return;

    clearError();

    const otpString = otpCode || otp.join("");
    if (!otpString || otpString.length !== OTP_CONSTRAINTS.LENGTH) {
      showError(MESSAGES.INVALID_OTP);
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      return;
    }

    try {
      const formattedMobile = formatMobile(mobile);
      const success = await verifyOTP(formattedMobile, otpString);

      if (success) {
        showSuccess(MESSAGES.VERIFY_SUCCESS);
        router.push({
          pathname: "/(auth)/reset-password",
          params: { mobile: formattedMobile },
        });
      } else {
        const currentError = useForgotPasswordStore.getState().error;
        
        setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
        setIsAutoVerifying(false);
        setShowVerifyingText(false);

        if (currentError) {
          showError(currentError);
        } else {
          showError(MESSAGES.VERIFY_FAILED);
        }

        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (error) {
      setOtp(Array(OTP_CONSTRAINTS.LENGTH).fill(""));
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      showError(MESSAGES.VERIFY_ERROR);

      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;

    clearError();
    const formattedMobile = formatMobile(mobile);
    const success = await sendOTPForForgotPassword(formattedMobile);

    if (success) {
      startTimer();
      showSuccess(MESSAGES.RESEND_SUCCESS);
    } else {
      const currentError = useForgotPasswordStore.getState().error;
      if (currentError) {
        if (currentError.includes("not found")) {
          showError(MESSAGES.NOT_REGISTERED);
          setTimeout(() => {
            router.push("/(auth)/passenger-registration");
          }, 3000);
        } else {
          showError(currentError);
        }
      } else {
        showError(MESSAGES.RESEND_FAILED);
      }
    }
  };

  const handleContactOrganization = () => {
    showInfo(MESSAGES.HELP_INFO);
  };

  // Render functions
  const renderHeader = () => (
    <Animated.View
      entering={FadeInUp.duration(ANIMATION_DELAYS.HEADER)}
      style={styles.header}
    >
      <View style={styles.logoContainer}>
        <GoBangladeshLogo size={70} />
      </View>
      <Text variant="h3" style={styles.title}>
        {isOtpSent ? "Enter Verification Code" : "Forgot Password?"}
      </Text>
      <Text style={styles.subtitle}>
        {isOtpSent
          ? `We've sent a 6-digit verification code to ${formatMobile(mobile)}`
          : "Enter your mobile number and we'll send you a verification code to reset your password."
        }
      </Text>
    </Animated.View>
  );

  const renderInputIndicator = () => {
    if (!mobile.trim()) return null;

    const indicatorColor = getIndicatorColor();
    
    return (
      <View
        style={[
          styles.inputTypeIndicator,
          {
            borderColor: indicatorColor + "50",
            backgroundColor: indicatorColor + "10",
          },
        ]}
      >
        <Text
          style={[
            styles.inputTypeText,
            { color: indicatorColor },
          ]}
        >
          Mobile
        </Text>
      </View>
    );
  };

  const renderMobileInput = () => (
    <Animated.View entering={FadeInDown.duration(ANIMATION_DELAYS.FORM)}>
      <Card variant="elevated" style={styles.formCard}>
        <View style={styles.formContent}>
          <Input
            label="Mobile Number"
            value={mobile}
            onChangeText={setMobile}
            placeholder="(e.g. 01XXXXXXXXXX)"
            keyboardType="phone-pad"
            icon="call-outline"
            autoCapitalize="none"
          />

          {renderInputIndicator()}

          <Button
            title="Send Verification Code"
            onPress={handleSendOTP}
            loading={isLoading}
            disabled={!mobile.trim()}
            icon="paper-plane-outline"
            size="medium"
            fullWidth
          />
        </View>
      </Card>
    </Animated.View>
  );

  const renderOTPInput = () => (
    <Animated.View entering={FadeInDown.duration(ANIMATION_DELAYS.FORM)}>
      <Card variant="elevated" style={styles.formCard}>
        <View style={styles.formContent}>
          {!showVerifyingText && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <Text style={styles.otpLabel}>Verification Code</Text>
            </Animated.View>
          )}

          <View style={styles.otpInputContainer}>
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
                key={`otp-input-wrapper-${index}-${isOtpSent}`}
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
                  onChangeText={(value) =>
                    !isAutoVerifying && handleOtpChange(value, index)
                  }
                  onKeyPress={(e) =>
                    !isAutoVerifying && handleKeyPress(e, index)
                  }
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
                  // Enhanced autofill handling
                  onSelectionChange={index === 0 ? (event) => {
                    // Monitor selection changes that might indicate autofill
                    const { selection } = event.nativeEvent;
                    if (selection.end > 1) {
                      console.log("Selection change detected in first input, might be autofill");
                    }
                  } : undefined}
                />
              </Animated.View>
            ))}
          </View>

          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>Resend code in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                <Text
                  style={[
                    styles.resendText,
                    isLoading && styles.resendTextDisabled,
                  ]}
                >
                  Resend Code
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.helpText}>
            {Platform.OS === "ios"
              ? "Tap the SMS suggestion to auto-fill all 6 digits, or enter them manually for automatic verification."
              : "The OTP will auto-fill from SMS when available."
            }
          </Text>
        </View>
      </Card>
    </Animated.View>
  );

  const renderBottomSection = () => (
    <Animated.View
      entering={FadeInDown.duration(ANIMATION_DELAYS.BOTTOM)}
      style={styles.bottomSection}
    >
      {!isOtpSent && (
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>
      )}

      <TouchableOpacity
        onPress={handleContactOrganization}
        style={styles.organizationButton}
      >
        <Text style={styles.organizationText}>
          Need help with your account?
        </Text>
        <Text style={styles.organizationEmail}>info@thegobd.com</Text>
      </TouchableOpacity>
    </Animated.View>
  );

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
            {isOtpSent ? renderOTPInput() : renderMobileInput()}
            {renderBottomSection()}
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
  // Main container
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
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

  // Navigation
  backButton: {
    position: "absolute",
    left: SPACING.md,
    top: 60,
    padding: SPACING.sm,
    zIndex: 2,
  },

  // Layout
  keyboardAvoidingView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: 80,
    paddingBottom: SPACING.lg,
    justifyContent: "center",
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  logoContainer: {
    marginBottom: SPACING.sm,
  },
  title: {
    textAlign: "center",
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 15,
    paddingTop: SPACING.md,
    textAlign: "center",
    color: COLORS.gray[600],
    paddingHorizontal: SPACING.md,
    lineHeight: 20,
  },

  // Form
  formCard: {
    marginBottom: SPACING.md,
  },
  formContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },

  // Input type indicator
  inputTypeIndicator: {
    position: "absolute",
    right: 20,
    top: 49,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  inputTypeText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },

  // OTP Input
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
    paddingHorizontal: SPACING.sm,
  },
  otpInputWrapper: {
    paddingTop: SPACING.xl,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.gray[900],
    backgroundColor: COLORS.white,
  },
  otpInputFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.brand.blue_subtle,
  },
  otpInputDisabled: {
    backgroundColor: COLORS.gray[100],
    borderColor: COLORS.gray[200],
    color: COLORS.gray[400],
  },
  loadingContainer: {
    position: "absolute",
    top: -10,
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

  // Resend
  resendContainer: {
    alignItems: "center",
    marginTop: SPACING.sm,
  },
  timerText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  resendText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  resendTextDisabled: {
    color: COLORS.gray[400],
  },
  helpText: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: "center",
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  // Bottom section
  bottomSection: {
    alignItems: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
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
    fontWeight: "500",
  },
  organizationButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
  },
  organizationText: {
    fontSize: 14,
    textAlign: "center",
    color: COLORS.gray[500],
    lineHeight: 18,
  },
  organizationEmail: {
    fontSize: 16,
    textAlign: "center",
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 4,
  },
});
