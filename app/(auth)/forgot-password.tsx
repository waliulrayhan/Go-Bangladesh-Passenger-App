import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
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
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SPACING } from "../../utils/constants";

const { width } = Dimensions.get("window");

export default function ForgotPassword() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [showVerifyingText, setShowVerifyingText] = useState(false); // Separate state for UI display

  const { sendOTPForForgotPassword, verifyOTP, isLoading, error, clearError } =
    useAuthStore();
  const { toast, showError, showSuccess, showInfo, hideToast } = useToast();
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const isHandlingAutofill = useRef(false);
  const lastOtpInputTime = useRef(0);
  const autofillDigits = useRef<string[]>([]);
  const autofillTimeout = useRef<NodeJS.Timeout | null>(null);

  // Get indicator color based on validation state for mobile
  const getIndicatorColor = () => {
    if (mobile.length === 11 && validateMobile(mobile)) {
      return COLORS.success;
    } else if (mobile.length > 11) {
      return COLORS.error;
    }
    return COLORS.primary;
  };

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

  // Clear OTP when entering OTP state for better auto-fill detection
  useEffect(() => {
    if (isOtpSent) {
      setOtp(["", "", "", "", "", ""]);
      setIsAutoVerifying(false);
      setShowVerifyingText(false); // Reset verifying text display
      // Reset autofill flag when entering OTP state
      isHandlingAutofill.current = false;
      lastOtpInputTime.current = 0;
      autofillDigits.current = [];
      if (autofillTimeout.current) {
        clearTimeout(autofillTimeout.current);
        autofillTimeout.current = null;
      }
    }
  }, [isOtpSent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autofillTimeout.current) {
        clearTimeout(autofillTimeout.current);
      }
    };
  }, []);

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
    let formatted = mobile.replace(/^\+?88/, "");

    // Ensure it starts with 01 (only add if it doesn't already start with 01)
    if (!formatted.startsWith("01")) {
      if (formatted.startsWith("1")) {
        formatted = "0" + formatted; // Add missing 0 to make it 01xxxxxxxxx
      } else if (formatted.startsWith("0") && !formatted.startsWith("01")) {
        formatted = "01" + formatted.substring(1); // Replace 0x with 01x
      } else {
        formatted = "01" + formatted; // Add 01 prefix
      }
    }

    return formatted;
  };

  const handleSendOTP = async () => {
    clearError();

    if (!validateMobile(mobile)) {
      showError("Please enter a valid Bangladesh mobile number (01xxxxxxxxx)");
      return;
    }

    const formattedMobile = formatMobile(mobile);
    const success = await sendOTPForForgotPassword(formattedMobile);

    if (success) {
      setIsOtpSent(true);
      setTimer(60); // 60 seconds countdown
      showSuccess(`A verification code has been sent to ${formattedMobile}`);
    } else {
      // Get the current error from the store after the OTP send attempt
      const currentError = useAuthStore.getState().error;
      if (currentError) {
        if (currentError.includes("not found")) {
          showError("This mobile number is not registered!");
        } else {
          showError(currentError);
        }
      } else {
        showError("Failed to send OTP. Please try again!");
      }
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isLoading || isAutoVerifying) return; // Prevent changes while loading or auto-verifying

    // Handle pasted OTP (auto-fill from SMS) - can happen on any input
    if (value.length > 1) {
      const pastedOtp = value.replace(/\D/g, "").slice(0, 6); // Extract only digits, max 6

      if (pastedOtp.length >= 6) {
        // Set flag to prevent interference from subsequent events
        isHandlingAutofill.current = true;
        setIsAutoVerifying(true);
        setShowVerifyingText(true); // Show verifying text immediately

        // Create new OTP array with all 6 digits
        const newOtp = pastedOtp.split("").slice(0, 6);

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
          handleVerifyOTP(pastedOtp);
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
        const validDigits = collectedDigits.filter(
          (d: string) => d && d !== ""
        );

        if (validDigits.length >= 5) {
          // Changed from 6 to 5 to handle the missing first digit
          // If we're missing the first digit, let's try to get it from the current state
          if (!collectedDigits[0] && otp[0]) {
            collectedDigits[0] = otp[0];
          }

          // Smooth UI update - set OTP
          setOtp(collectedDigits);

          // Auto-verify if we have all 6 digits
          const finalValidDigits = collectedDigits.filter(
            (d: string) => d && d !== ""
          );
          if (finalValidDigits.length === 6) {
            // Remove focus from all inputs to prevent shaking
            inputRefs.current.forEach((ref) => ref?.blur());

            setTimeout(() => {
              handleVerifyOTP(collectedDigits.join(""));
            }, 200); // Slightly longer delay for smoother transition
          }
        } else if (validDigits.length > 0) {
          // Even if we don't have enough, set what we have (but don't show loading)
          setOtp(collectedDigits);
        }

        // Cleanup
        autofillDigits.current = [];
        isHandlingAutofill.current = false;
        // Don't reset setIsAutoVerifying here to prevent flickering
        // It will be reset in handleVerifyOTP
      }, 150); // Timeout to ensure we capture all digits

      return; // Don't process as manual input
    }

    // Special handling for the first input when it might be part of an autofill sequence
    // If this is index 0 and OTP is empty, delay processing to see if more inputs come rapidly
    if (index === 0 && otp.every((digit) => digit === "")) {
      // Don't show verifying UI immediately - wait to see if it's autofill or manual
      isHandlingAutofill.current = true;
      autofillDigits.current = new Array(6).fill("");
      autofillDigits.current[0] = value.slice(-1);

      // Wait a short time to see if more inputs come rapidly (indicating autofill)
      setTimeout(() => {
        if (isHandlingAutofill.current) {
          // Check if we collected more digits
          const collectedCount = autofillDigits.current.filter(
            (d: string) => d && d !== ""
          ).length;

          if (collectedCount === 1) {
            // Only one digit collected in 50ms, treat as manual input
            isHandlingAutofill.current = false;
            autofillDigits.current = [];

            setOtp((prevOtp) => {
              const newOtp = [...prevOtp];
              newOtp[0] = value.slice(-1);

              // Auto-focus next input for manual typing
              if (value) {
                setTimeout(() => {
                  inputRefs.current[1]?.focus();
                }, 10);
              }

              return newOtp;
            });
          } else if (collectedCount > 1) {
            // Multiple digits collected rapidly, this is autofill
            setIsAutoVerifying(true);
            setShowVerifyingText(true);
            // The autofill timeout will handle the rest
          }
        }
      }, 50); // Short delay to detect rapid sequence

      return;
    }

    // Handle single character input (manual typing)
    if (value.length <= 1) {
      // Use functional update to ensure we have the latest state
      setOtp((prevOtp) => {
        const newOtp = [...prevOtp];
        newOtp[index] = value.slice(-1);

        // Auto-verify when all 6 digits are entered manually
        if (newOtp.every((digit) => digit !== "") && newOtp.length === 6) {
          setIsAutoVerifying(true);
          setShowVerifyingText(true); // Show verifying text for manual completion
          setTimeout(() => {
            handleVerifyOTP(newOtp.join(""));
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
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    if (isLoading) return; // Prevent multiple submissions

    const otpString = otpCode || otp.join("");
    
    if (!otpString || otpString.length !== 6) {
      showError("Please enter a valid 6-digit OTP");
      setIsAutoVerifying(false); // Reset auto-verifying state
      return;
    }

    const formattedMobile = formatMobile(mobile);
    const success = await verifyOTP(formattedMobile, otpString);

    if (success) {
      // Navigate to password reset form with the verified mobile number
      router.push({
        pathname: "/(auth)/reset-password",
        params: { mobile: formattedMobile },
      });
    } else {
      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", ""]);
      setIsAutoVerifying(false);
      setShowVerifyingText(false); // Reset verifying text display

      // Hide any existing toast first
      hideToast();

      // Get the current error from the store after the OTP verification attempt
      const currentError = useAuthStore.getState().error;
      
      // Show error after ensuring previous toast is hidden
      setTimeout(() => {
        if (currentError) {
          showError(currentError);
        } else {
          showError("The OTP you entered is incorrect. Please try again!");
        }
      }, 300);

      // Refocus first input after a short delay
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 400);
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;

    clearError();
    const formattedMobile = formatMobile(mobile);
    const success = await sendOTPForForgotPassword(formattedMobile);

    if (success) {
      setTimer(60);
      showSuccess("A new verification code has been sent to your mobile!");
    } else {
      // Get the current error from the store after the OTP send attempt
      const currentError = useAuthStore.getState().error;
      if (currentError) {
        if (currentError.includes("not found")) {
          showError("This mobile number is not registered!");
        } else {
          showError(currentError);
        }
      } else {
        showError("Failed to send OTP. Please try again!");
      }
    }
  };

  const handleContactOrganization = () => {
    showInfo(
      "If you're having trouble with your account, please contact us at info@thegobd.com"
    );
  };

  // OTP input state
  if (isOtpSent) {
    return (
      <>
        <StatusBar
          style="light"
          backgroundColor="transparent"
          translucent={true}
        />
        <SafeAreaView style={styles.container}>
          <LinearGradient
            colors={[
              "rgba(74, 144, 226, 0.5)", // Blue at top
              "rgba(74, 144, 226, 0.2)",
              "transparent",
              "rgba(255, 138, 0, 0.2)", // Orange transition
              "rgba(255, 138, 0, 0.4)", // Orange at bottom
            ]}
            locations={[0, 0.2, 0.5, 0.8, 1]}
            style={styles.glowBackground}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />

          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>

          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
            >
              <Animated.View
                entering={FadeInUp.duration(800)}
                style={styles.header}
              >
                <View style={styles.logoContainer}>
                  <GoBangladeshLogo size={70} />
                </View>

                <Text variant="h3" style={styles.title}>
                  Enter Verification Code
                </Text>
                <Text style={styles.subtitle}>
                  We've sent a 6-digit verification code to{" "}
                  {formatMobile(mobile)}
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(800).delay(200)}>
                <Card variant="elevated" style={styles.otpCard}>
                  <View style={styles.otpContent}>
                    {!showVerifyingText && (
                      <Animated.View
                        entering={FadeInDown.duration(300)}
                        exiting={FadeInUp.duration(200)}
                      >
                        <Text style={styles.otpLabel}>Verification Code</Text>
                      </Animated.View>
                    )}

                    <View
                      style={styles.otpInputContainer}
                      key={`otp-container-${isOtpSent}`}
                    >
                      {showVerifyingText && (
                        <Animated.View
                          style={styles.loadingContainer}
                          entering={FadeInDown.duration(300)}
                          exiting={FadeInUp.duration(200)}
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
                              (isLoading || isAutoVerifying) &&
                                styles.otpInputDisabled,
                            ]}
                            value={digit}
                            onChangeText={(value) =>
                              !isAutoVerifying && handleOtpChange(value, index)
                            } // Prevent input during auto-verify
                            onKeyPress={(e) =>
                              !isAutoVerifying && handleKeyPress(e, index)
                            }
                            keyboardType="numeric"
                            maxLength={index === 0 ? 6 : 1} // Allow pasting full OTP in first input only
                            autoFocus={index === 0 && !isAutoVerifying}
                            selectTextOnFocus={true}
                            editable={!isLoading && !isAutoVerifying} // Disable during auto-verify
                            textContentType={
                              index === 0 ? "oneTimeCode" : "none"
                            } // SMS auto-fill for first input only
                            autoComplete={index === 0 ? "sms-otp" : "off"} // Android SMS auto-fill for first input only
                            importantForAutofill={index === 0 ? "yes" : "no"} // Android autofill priority
                            blurOnSubmit={false}
                            // Prevent other inputs from interfering with autofill
                            contextMenuHidden={index !== 0}
                          />
                        </Animated.View>
                      ))}
                    </View>

                    <View style={styles.resendContainer}>
                      {timer > 0 ? (
                        <Text style={styles.timerText}>
                          Resend code in {timer}s
                        </Text>
                      ) : (
                        <TouchableOpacity
                          onPress={handleResendOTP}
                          disabled={isLoading}
                        >
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
                        : "The OTP will auto-fill from SMS when available."}
                    </Text>
                  </View>
                </Card>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.duration(800).delay(400)}
                style={styles.bottomSection}
              >
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
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>

        {/* Toast notification for OTP form */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
          position="top"
        />
      </>
    );
  }

  // Initial phone number input state
  return (
    <>
      <StatusBar
        style="light"
        backgroundColor="transparent"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        {/* Teal Left + Warm Orange Bottom Dual Glow */}
        <LinearGradient
          colors={[
            "rgba(74, 144, 226, 0.5)", // Blue at top
            "rgba(74, 144, 226, 0.2)",
            "transparent",
            "rgba(255, 138, 0, 0.2)", // Orange transition
            "rgba(255, 138, 0, 0.4)", // Orange at bottom
          ]}
          locations={[0, 0.2, 0.5, 0.8, 1]}
          style={styles.glowBackground}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>

        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            <Animated.View
              entering={FadeInUp.duration(800)}
              style={styles.header}
            >
              <View style={styles.logoContainer}>
                <GoBangladeshLogo size={70} />
              </View>

              <Text variant="h3" color={COLORS.secondary}>
                Forgot Password?
              </Text>
              <Text style={styles.subtitle}>
                Enter your mobile number and we'll send you a verification code
                to reset your password.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(800).delay(200)}>
              <Card variant="elevated" style={styles.loginCard}>
                <View style={styles.loginContent}>
                  <Input
                    label="Mobile Number"
                    value={mobile}
                    onChangeText={setMobile}
                    placeholder="(e.g. 01XXXXXXXXXX)"
                    keyboardType="phone-pad"
                    icon="call-outline"
                    autoCapitalize="none"
                  />

                  {mobile.trim() && (
                    <View
                      style={[
                        styles.inputTypeIndicator,
                        {
                          borderColor: getIndicatorColor() + "50",
                          backgroundColor: getIndicatorColor() + "10",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.inputTypeText,
                          { color: getIndicatorColor() },
                        ]}
                      >
                        Mobile
                      </Text>
                    </View>
                  )}

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

            <Animated.View
              entering={FadeInDown.duration(800).delay(400)}
              style={styles.bottomSection}
            >
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={styles.organizationButton}
                onPress={handleContactOrganization}
              >
                <Text style={styles.organizationText}>
                  Need help with your account?
                </Text>
                <Text style={styles.organizationEmail}>info@thegobd.com</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Toast notification - moved outside SafeAreaView to ensure visibility */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
        position="top"
      />
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
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: 80, // Space for back button
    paddingBottom: SPACING.lg,
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
  loginCard: {
    marginBottom: SPACING.md,
  },
  loginContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
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
  otpCard: {
    marginBottom: SPACING.md,
  },
  otpContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
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
    // Wrapper for individual input animations
    paddingTop: SPACING["xl"],
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
  helpText: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: "center",
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
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
  glowBackgroundRight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    zIndex: 0,
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
