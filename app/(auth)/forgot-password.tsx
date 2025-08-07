import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
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
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SPACING } from "../../utils/constants";

const { width } = Dimensions.get("window");

export default function ForgotPassword() {
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const { sendOTPForForgotPassword, verifyOTP, isLoading, error, clearError } = useAuthStore();
  const inputRefs = useRef<(TextInput | null)[]>([]);

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
    }
  }, [isOtpSent]);

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
      Alert.alert(
        "Error",
        "Please enter a valid Bangladesh mobile number (01xxxxxxxxx)"
      );
      return;
    }

    const formattedMobile = formatMobile(mobile);
    const success = await sendOTPForForgotPassword(formattedMobile);

    if (success) {
      setIsOtpSent(true);
      setTimer(60); // 60 seconds countdown
      Alert.alert(
        "OTP Sent",
        `A verification code has been sent to ${formattedMobile}`,
        [{ text: "OK" }]
      );
    } else {
      // Check if the error is about mobile number not found
      if (error && error.includes('not found')) {
        Alert.alert(
          "Mobile Number Not Found",
          "This mobile number is not registered with us. Please check your number or create a new account.",
          [
            { text: "Try Again" },
            { 
              text: "Register", 
              onPress: () => router.push("/(auth)/passenger-registration")
            }
          ]
        );
      }
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    if (isLoading) return; // Prevent changes while loading
    
    // Handle pasted OTP (auto-fill from SMS)
    if (value.length > 1) {
      const pastedOtp = value.replace(/\D/g, '').slice(0, 6); // Extract only digits, max 6
      if (pastedOtp.length > 0) {
        const newOtp = [...otp];
        
        // Fill the OTP digits starting from current index
        for (let i = 0; i < pastedOtp.length && (index + i) < 6; i++) {
          newOtp[index + i] = pastedOtp[i];
        }
        
        setOtp(newOtp);
        
        // Focus the last filled input or verify if complete
        if (pastedOtp.length === 6) {
          // Auto-verify when 6 digits are pasted
          setTimeout(() => {
            handleVerifyOTP(pastedOtp);
          }, 100);
        } else {
          // Focus next empty input
          const lastFilledIndex = Math.min(index + pastedOtp.length - 1, 5);
          const nextEmptyIndex = newOtp.findIndex((digit, i) => i > lastFilledIndex && digit === "");
          if (nextEmptyIndex !== -1) {
            inputRefs.current[nextEmptyIndex]?.focus();
          }
        }
        return;
      }
    }

    // Handle single character input
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every((digit) => digit !== "") && newOtp.length === 6) {
      setTimeout(() => {
        handleVerifyOTP(newOtp.join(""));
      }, 100);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async (otpCode?: string) => {
    if (isLoading) return; // Prevent multiple submissions

    clearError();

    const otpString = otpCode || otp.join("");
    if (!otpString || otpString.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    try {
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

        // Show error alert
        Alert.alert(
          "Verification Failed",
          "The OTP you entered is incorrect. Please try again.",
          [
            {
              text: "OK",
              onPress: () => {
                // Refocus first input after alert is dismissed
                setTimeout(() => {
                  inputRefs.current[0]?.focus();
                }, 100);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("[ForgotPassword] OTP verification failed:", error);

      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", ""]);

      // Show error alert
      Alert.alert(
        "Verification Failed",
        "Failed to verify OTP. Please try again.",
        [
          {
            text: "OK",
            onPress: () => {
              // Refocus first input after alert is dismissed
              setTimeout(() => {
                inputRefs.current[0]?.focus();
              }, 100);
            },
          },
        ]
      );
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;

    clearError();
    const formattedMobile = formatMobile(mobile);
    const success = await sendOTPForForgotPassword(formattedMobile);

    if (success) {
      setTimer(60);
      Alert.alert(
        "OTP Sent",
        "A new verification code has been sent to your mobile"
      );
    } else {
      // Check if the error is about mobile number not found
      if (error && error.includes('not found')) {
        Alert.alert(
          "Mobile Number Not Found",
          "This mobile number is not registered with us. Please check your number or create a new account.",
          [
            { text: "Try Again" },
            { 
              text: "Register", 
              onPress: () => router.push("/(auth)/passenger-registration")
            }
          ]
        );
      }
    }
  };

  const handleContactOrganization = () => {
    Alert.alert(
      "Need Help?",
      "If you're having trouble with your account, please contact us:",
      [
        {
          text: "Call Support",
          onPress: () => {
            // You can implement phone call functionality here
            Alert.alert("Contact Support", "Please call: +88-02-XXXXXXXX");
          }
        },
        {
          text: "Email Support",
          onPress: () => {
            // You can implement email functionality here
            Alert.alert("Email Support", "Please email: info@thegobd.com");
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
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
                  We've sent a 6-digit verification code to {formatMobile(mobile)}
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.duration(800).delay(200)}>
                <Card variant="elevated" style={styles.otpCard}>
                  <View style={styles.otpContent}>
                    <Text style={styles.otpLabel}>Verification Code</Text>

                    <View style={styles.otpInputContainer}>
                      {isLoading && (
                        <View style={styles.loadingContainer}>
                          <Text style={styles.loadingText}>Verifying...</Text>
                        </View>
                      )}
                      {otp.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => {
                            inputRefs.current[index] = ref;
                          }}
                          style={[
                            styles.otpInput,
                            digit && styles.otpInputFilled,
                            isLoading && styles.otpInputDisabled,
                          ]}
                          value={digit}
                          onChangeText={(value) => handleOtpChange(value, index)}
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          keyboardType="numeric"
                          maxLength={index === 0 ? 6 : 1} // Allow pasting full OTP in first input
                          autoFocus={index === 0}
                          selectTextOnFocus
                          editable={!isLoading}
                          textContentType={index === 0 ? "oneTimeCode" : "none"} // SMS auto-fill for first input
                          autoComplete={index === 0 ? "sms-otp" : "off"} // Android SMS auto-fill
                          importantForAutofill={index === 0 ? "yes" : "no"} // Android autofill priority
                          blurOnSubmit={false}
                        />
                      ))}
                    </View>

                    {error && (
                      <Animated.View
                        entering={FadeInDown.duration(300)}
                        style={styles.errorContainer}
                      >
                        <Ionicons
                          name="alert-circle"
                          size={16}
                          color={COLORS.error}
                        />
                        <Text style={styles.errorText}>{error}</Text>
                      </Animated.View>
                    )}

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
                      {Platform.OS === 'ios' 
                        ? 'The code will auto-fill from SMS. You can also enter all 6 digits for automatic verification.'
                        : 'Enter all 6 digits for automatic verification. The code may auto-fill from SMS.'
                      }
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
                Enter your mobile number and we'll send you a verification code to
                reset your password.
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

                  {error && (
                    <Animated.View
                      entering={FadeInDown.duration(300)}
                      style={styles.errorContainer}
                    >
                      <Ionicons
                        name="alert-circle"
                        size={16}
                        color={COLORS.error}
                      />
                      <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
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
    minHeight: "100%",
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
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.sm,
    backgroundColor: COLORS.error + "10",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error + "30",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: SPACING.sm,
    flex: 1,
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
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.sm,
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
    top: -20,
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
