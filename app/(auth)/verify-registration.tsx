import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
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
import { apiService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { useCardStore } from "../../stores/cardStore";
import { COLORS, SPACING } from "../../utils/constants";
import { storageService } from "../../utils/storage";

export default function VerifyRegistration() {
  const params = useLocalSearchParams<{
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
  }>();

  const { login } = useAuthStore();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    // Start countdown timer
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

  useEffect(() => {
    // Handle back button on Android
    const backAction = () => {
      router.back();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (isLoading) return; // Prevent changes while loading
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 6 digits are entered
    if (newOtp.every((digit) => digit !== "") && newOtp.length === 6) {
      // Small delay to ensure UI updates first
      setTimeout(() => {
        handleVerify(newOtp.join(""));
      }, 100);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const otpString = otpCode || otp.join("");

    if (otpString.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the complete 6-digit OTP.");
      return;
    }

    setIsLoading(true);

    try {
      console.log("🔐 Verifying OTP for:", params.phone);

      // Verify OTP with API
      const verificationResult = await apiService.verifyOTP(
        params.phone,
        otpString
      );

      if (verificationResult) {
        console.log("✅ OTP verification successful");

        // Retrieve stored registration data
        const tempData = await storageService.getItem<any>(
          "temp_registration_data"
        );
        console.log("🔍 Retrieved temp data:", tempData);

        if (!tempData) {
          console.error("❌ No stored registration data found");
          setIsLoading(false);

          Alert.alert(
            "Registration Error",
            "Registration data not found. Please start the registration process again.",
            [
              {
                text: "Go to Registration",
                onPress: () => {
                  router.replace("/(auth)/passenger-registration");
                },
              },
            ]
          );
          return;
        }

        // Now call the registration API after successful OTP verification
        console.log("🔑 Calling registration API after OTP verification...");

        try {
          // Register the passenger using the stored registration data
          await apiService.registerPassenger(tempData.registrationData);

          console.log("✅ Registration API call successful");

          // Clean up temporary storage after successful registration
          await storageService.removeItem("temp_registration_data");

          // Use loginWithPassword with the stored password
          const { loginWithPassword } = useAuthStore.getState();
          const loginSuccess = await loginWithPassword(
            tempData.phone,
            tempData.password
          );

          if (loginSuccess) {
            // Load card data using the store's loadCardDetails method
            try {
              await useCardStore.getState().loadCardDetails();
            } catch (cardError) {
              console.log("ℹ️ Card data loading failed:", cardError);
            }

            setIsLoading(false);

            Alert.alert(
              "Registration Successful!",
              "Your account has been created successfully. Welcome to Go Bangladesh!",
              [
                {
                  text: "Continue",
                  onPress: () => {
                    router.replace("/(tabs)");
                  },
                },
              ]
            );
          } else {
            // If login fails, still show success message but redirect to login
            setIsLoading(false);

            Alert.alert(
              "Registration Complete",
              "Your account has been created successfully. Please log in to continue.",
              [
                {
                  text: "Go to Login",
                  onPress: () => {
                    router.replace("/(auth)/passenger-login");
                  },
                },
              ]
            );
          }
        } catch (registrationError: any) {
          console.error("❌ Registration API error:", registrationError);
          setIsLoading(false);

          // Clean up temporary storage even on failure
          await storageService.removeItem("temp_registration_data");

          let errorMessage =
            "Registration failed after OTP verification. Please try again.";

          if (registrationError.message) {
            errorMessage = registrationError.message;
          } else if (registrationError.response?.data?.data?.message) {
            errorMessage = registrationError.response.data.data.message;
          }

          Alert.alert("Registration Error", errorMessage, [
            {
              text: "Try Again",
              onPress: () => {
                router.replace("/(auth)/passenger-registration");
              },
            },
          ]);
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error("❌ OTP verification error:", error);

      // Clear OTP form on error
      setOtp(["", "", "", "", "", ""]);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }

      let errorMessage = "Invalid OTP. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      }

      Alert.alert("Verification Failed", errorMessage);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);

    try {
      console.log("🔄 Resending OTP to:", params.phone);

      // Resend OTP using API
      await apiService.sendOTP(params.phone);

      console.log("✅ OTP resent successfully");

      setIsResending(false);
      setOtp(["", "", "", "", "", ""]);
      setCountdown(60);
      setCanResend(false);
      inputRefs.current[0]?.focus();

      Alert.alert("OTP Sent", "A new OTP has been sent to your mobile number.");
    } catch (error: any) {
      setIsResending(false);
      console.error("❌ Resend OTP error:", error);

      // Clear OTP form when resending
      setOtp(["", "", "", "", "", ""]);

      let errorMessage = "Failed to resend OTP. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      }

      Alert.alert("Error", errorMessage);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
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
              <View style={styles.iconContainer}>
                <Ionicons
                  name="shield-checkmark"
                  size={32}
                  color={COLORS.primary}
                />
              </View>

              <Text variant="h3" color={COLORS.secondary} style={styles.title}>
                Verify Your Mobile Number
              </Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to{"\n"}
                <Text style={styles.phoneNumber}>{params.phone}</Text>
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(800).delay(200)}>
              <Card variant="elevated">
                <View style={styles.otpContainer}>
                  <Text style={styles.otpLabel}>Enter OTP</Text>

                  {isLoading && (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.loadingText}>Verifying...</Text>
                    </View>
                  )}

                  <View style={styles.otpInputContainer}>
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
                        maxLength={1}
                        autoFocus={index === 0}
                        selectTextOnFocus
                        editable={!isLoading}
                      />
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
                    Enter all 6 digits for automatic verification.{"\n"}
                    Didn't receive the code? Check your SMS or try resending.
                  </Text>
                </View>
              </Card>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
    paddingTop: SPACING.xl + 80, // Extra padding for status bar
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
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
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
