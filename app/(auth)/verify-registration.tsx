import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
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
  const { toast, showError, showSuccess, hideToast } = useToast();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoVerifying, setIsAutoVerifying] = useState(false);
  const [showVerifyingText, setShowVerifyingText] = useState(false); // Separate state for UI display
  const [isOtpReady, setIsOtpReady] = useState(false); // Similar to isOtpSent in forgot-password

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const isHandlingAutofill = useRef(false);
  const lastOtpInputTime = useRef(0);
  const autofillDigits = useRef<string[]>([]);
  const autofillTimeout = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<View>(null); // Add container ref for autofill focus

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

  // Simulate isOtpSent behavior - trigger OTP ready state for autofill
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOtpReady(true);
    }, 100); // Small delay to trigger component remount for autofill

    return () => clearTimeout(timer);
  }, []);

  // Reset OTP when OTP becomes ready (similar to forgot-password isOtpSent effect)
  useEffect(() => {
    if (isOtpReady) {
      setOtp(["", "", "", "", "", ""]);
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      // Reset autofill flags when entering OTP state
      isHandlingAutofill.current = false;
      lastOtpInputTime.current = 0;
      autofillDigits.current = [];
      if (autofillTimeout.current) {
        clearTimeout(autofillTimeout.current);
        autofillTimeout.current = null;
      }
    }
  }, [isOtpReady]);

  // Reset OTP when component mounts to ensure clean state for autofill
  useEffect(() => {
    console.log("🔄 Initializing OTP state for autofill");
    setOtp(["", "", "", "", "", ""]);
    setIsAutoVerifying(false);
    setShowVerifyingText(false);
    // Reset autofill flags
    isHandlingAutofill.current = false;
    lastOtpInputTime.current = 0;
    autofillDigits.current = [];
    if (autofillTimeout.current) {
      clearTimeout(autofillTimeout.current);
      autofillTimeout.current = null;
    }
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autofillTimeout.current) {
        clearTimeout(autofillTimeout.current);
      }
    };
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (isLoading || isAutoVerifying) return; // Prevent changes while loading or auto-verifying
    
    // Handle pasted OTP (auto-fill from SMS) - can happen on any input
    if (value.length > 1) {
      const pastedOtp = value.replace(/\D/g, '').slice(0, 6); // Extract only digits, max 6
      
      if (pastedOtp.length >= 6) {
        // Set flag to prevent interference from subsequent events
        isHandlingAutofill.current = true;
        setIsAutoVerifying(true);
        setShowVerifyingText(true); // Show verifying text immediately
        
        // Create new OTP array with all 6 digits
        const newOtp = pastedOtp.split('').slice(0, 6);
        
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
          handleVerify(pastedOtp);
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
        const validDigits = collectedDigits.filter((d: string) => d && d !== "");
        
        if (validDigits.length >= 5) { // Changed from 6 to 5 to handle the missing first digit
          // If we're missing the first digit, let's try to get it from the current state
          if (!collectedDigits[0] && otp[0]) {
            collectedDigits[0] = otp[0];
          }
          
          // Smooth UI update - set OTP
          setOtp(collectedDigits);
          
          // Auto-verify if we have all 6 digits
          const finalValidDigits = collectedDigits.filter((d: string) => d && d !== "");
          if (finalValidDigits.length === 6) {
            // Remove focus from all inputs to prevent shaking
            inputRefs.current.forEach(ref => ref?.blur());
            
            setTimeout(() => {
              handleVerify(collectedDigits.join(""));
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
        // It will be reset in handleVerify
      }, 100); // Balanced timeout for autofill capture and responsiveness
      
      return; // Don't process as manual input
    }

    // Special handling for the first input when it might be part of an autofill sequence
    // If this is index 0 and OTP is empty, delay processing to see if more inputs come rapidly
    if (index === 0 && otp.every(digit => digit === "")) {
      // Don't show verifying UI immediately - wait to see if it's autofill or manual
      isHandlingAutofill.current = true;
      autofillDigits.current = new Array(6).fill("");
      autofillDigits.current[0] = value.slice(-1);
      
      // Wait a short time to see if more inputs come rapidly (indicating autofill)
      setTimeout(() => {
        if (isHandlingAutofill.current) {
          // Check if we collected more digits
          const collectedCount = autofillDigits.current.filter((d: string) => d && d !== "").length;
          
          if (collectedCount === 1) {
            // Only one digit collected in 30ms, treat as manual input
            isHandlingAutofill.current = false;
            autofillDigits.current = [];
            
            setOtp(prevOtp => {
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
      }, 30); // Balanced delay for autofill detection
      
      return;
    }

    // Handle single character input (manual typing)
    if (value.length <= 1) {
      // Use functional update to ensure we have the latest state
      setOtp(prevOtp => {
        const newOtp = [...prevOtp];
        newOtp[index] = value.slice(-1);
        
        // Auto-verify when all 6 digits are entered manually
        if (newOtp.every((digit) => digit !== "") && newOtp.length === 6) {
          setIsAutoVerifying(true);
          setShowVerifyingText(true); // Show verifying text for manual completion
          setTimeout(() => {
            handleVerify(newOtp.join(""));
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

  const handleVerify = async (otpCode?: string) => {
    const otpString = otpCode || otp.join("");

    if (otpString.length !== 6) {
      showError("Please enter the complete 6-digit OTP!");
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

          showError("Registration data not found. Please start the registration process again!");
          
          // Navigate to registration after a short delay
          setTimeout(() => {
            router.replace("/(auth)/passenger-registration");
          }, 2000);
          
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

            showSuccess("Your account has been created successfully. Welcome to Go Bangladesh!");
            
            // Navigate to main app after a short delay
            setTimeout(() => {
              router.replace("/(tabs)");
            }, 2000);
          } else {
            // If login fails after registration, get the current error and show it
            setIsLoading(false);
            
            const currentError = useAuthStore.getState().error;
            if (currentError) {
              showError(`Registration successful, but login failed: ${currentError}`);
            } else {
              showError("Registration successful, but automatic login failed. Please log in manually.");
            }
            
            // Navigate to login after a short delay
            setTimeout(() => {
              router.replace("/(auth)/passenger-login");
            }, 3000);
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

          showError(errorMessage);
          
          // Navigate to registration after a short delay
          setTimeout(() => {
            router.replace("/(auth)/passenger-registration");
          }, 3000);
        }
      } else {
        // Handle case where verificationResult is falsy but no exception was thrown
        setIsLoading(false);
        
        // Clear OTP form on verification failure
        setOtp(["", "", "", "", "", ""]);
        setIsAutoVerifying(false);
        setShowVerifyingText(false);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
        
        showError("OTP verification failed. Please check the code and try again.");
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error("❌ OTP verification error:", error);

      // Clear OTP form on error
      setOtp(["", "", "", "", "", ""]);
      setIsAutoVerifying(false);
      setShowVerifyingText(false); // Reset verifying text display
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
      
      let errorMessage = "Invalid OTP. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      }

      showError(errorMessage);
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
      setIsAutoVerifying(false);
      setShowVerifyingText(false);
      
      // Simple focus like forgot-password
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 50); // Reduced from 100ms to 50ms

      showSuccess("A new OTP has been sent to your mobile number.");
    } catch (error: any) {
      setIsResending(false);
      console.error("❌ Resend OTP error:", error);

      // Clear OTP form when resending
      setOtp(["", "", "", "", "", ""]);
      setIsAutoVerifying(false);
      setShowVerifyingText(false); // Reset verifying text display

      let errorMessage = "Failed to resend OTP. Please try again.";

      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.data?.message) {
        errorMessage = error.response.data.data.message;
      }

      showError(errorMessage);
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
                <View 
                  style={styles.otpContainer}
                  ref={containerRef}
                >
                  {!showVerifyingText && (
                    <Animated.View
                      entering={FadeInDown.duration(300)}
                      exiting={FadeInUp.duration(200)}
                    >
                      <Text style={styles.otpLabel}>Enter OTP</Text>
                    </Animated.View>
                  )}

                  <View 
                    style={styles.otpInputContainer}
                    key={`otp-container-${isOtpReady}`}
                  >
                    {showVerifyingText && (
                      <Animated.View 
                        style={styles.loadingContainer}
                        entering={FadeInDown.duration(300)}
                        exiting={FadeInUp.duration(200)}
                      >
                        <Text style={styles.loadingText}>
                          Verifying...
                        </Text>
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
                          onChangeText={(value) => !isAutoVerifying && handleOtpChange(value, index)} // Prevent input during auto-verify
                          onKeyPress={(e) => !isAutoVerifying && handleKeyPress(e, index)}
                          keyboardType="numeric"
                          maxLength={index === 0 ? 6 : 1} // Allow pasting full OTP in first input only
                          autoFocus={index === 0 && !isAutoVerifying}
                          selectTextOnFocus={true}
                          editable={!isLoading && !isAutoVerifying} // Disable during auto-verify
                          textContentType={index === 0 ? "oneTimeCode" : "none"} // SMS auto-fill for first input only
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
                    {Platform.OS === 'ios' 
                      ? 'Tap the SMS suggestion to auto-fill all 6 digits, or enter them manually for automatic verification.'
                      : 'The OTP will auto-fill from SMS when available. Enter all 6 digits for automatic verification.'
                    }
                  </Text>
                </View>
              </Card>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Toast notification */}
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
