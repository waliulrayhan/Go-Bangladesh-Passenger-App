import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

// Custom components
import { GoBangladeshLogo } from "../../components/GoBangladeshLogo";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Text } from "../../components/ui/Text";
import { Toast } from "../../components/ui/Toast";

// Hooks
import { useToast } from "../../hooks/useToast";

// Stores
import { useAuthStore } from "../../stores/authStore";

// Utils
import { COLORS, SPACING } from "../../utils/constants";
import {
  determineInputType,
  getIconForInput,
  getKeyboardTypeForInput,
  getPlaceholderForInput,
  getValidationErrorMessage,
  validateInput,
} from "../../utils/inputTypeDetector";

/**
 * PassengerLogin Component
 *
 * Handles user authentication for passengers with dynamic input type detection
 * Supports both email and mobile number login with real-time validation
 */
export default function PassengerLogin() {
  // State variables
  const [identifier, setIdentifier] = useState(""); // Email or Mobile number
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Auth store hook
  const { loginWithPassword, isLoading, error, clearError } = useAuthStore();

  // Toast hook
  const { toast, showError, hideToast } = useToast();

  /**
   * Navigation handlers
   */
  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  const handleGoBack = () => {
    router.back();
  };

  /**
   * Dynamic input type detection for email/mobile
   */
  const inputType = determineInputType(identifier);
  const dynamicKeyboardType = getKeyboardTypeForInput(identifier);
  const dynamicPlaceholder = getPlaceholderForInput(identifier);
  const dynamicIcon = getIconForInput(identifier);

  /**
   * Get indicator color based on validation state
   * Returns appropriate color for input type indicator
   */
  const getIndicatorColor = () => {
    if (inputType === "email") {
      return validateInput(identifier) ? COLORS.success : COLORS.primary;
    } else if (inputType === "mobile") {
      if (identifier.length === 11 && validateInput(identifier)) {
        return COLORS.success;
      } else if (identifier.length > 11) {
        return COLORS.error;
      }
      return COLORS.primary;
    }
    return COLORS.primary;
  };

  /**
   * Handle identifier input change with mobile number filtering
   * Ensures only numeric characters for mobile input
   */
  const handleIdentifierChange = (text: string) => {
    if (determineInputType(identifier) === "mobile" && text.length > 0) {
      // Remove non-digit characters for mobile input
      const numericOnly = text.replace(/\D/g, "");
      setIdentifier(numericOnly);
    } else {
      setIdentifier(text);
    }
  };

  /**
   * Handle login process with validation
   * Validates input and password before attempting login
   */
  const handleLogin = async () => {
    clearError();

    // Validate identifier input
    if (!validateInput(identifier)) {
      showError(getValidationErrorMessage(identifier));
      return;
    }

    // Validate password input
    if (!password || password.length < 8) {
      showError("Please enter a valid password (min. 8 characters)");
      return;
    }

    // Attempt login
    const success = await loginWithPassword(identifier, password);

    if (success) {
      router.replace("/(tabs)");
    }
  };

  return (
    <>
      {/* Status bar configuration */}
      <StatusBar
        style="light"
        backgroundColor="transparent"
        translucent={true}
      />

      <SafeAreaView style={styles.container}>
        {/* Background gradient */}
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

        {/* Back button */}
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
            {/* Header section with logo and title */}
            <Animated.View
              entering={FadeInUp.duration(800)}
              style={styles.header}
            >
              <View style={styles.logoContainer}>
                <GoBangladeshLogo size={70} />
              </View>

              <Text variant="h3" style={styles.title}>
                Welcome Back!
              </Text>
              <Text style={styles.subtitle}>Sign in to your account</Text>
            </Animated.View>

            {/* Login form card */}
            <Animated.View entering={FadeInDown.duration(800).delay(200)}>
              <Card variant="elevated" style={styles.loginCard}>
                <View style={styles.loginContent}>
                  {/* Email/Phone input with dynamic detection */}
                  <Input
                    label="Email or Phone Number"
                    value={identifier}
                    onChangeText={handleIdentifierChange}
                    placeholder={dynamicPlaceholder}
                    keyboardType={dynamicKeyboardType}
                    autoCapitalize="none"
                    autoCorrect={false}
                    icon={dynamicIcon}
                    maxLength={inputType === "mobile" ? 11 : undefined}
                  />

                  {/* Input type indicator */}
                  {identifier.trim() && (
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
                        {inputType === "email" ? "Email" : "Mobile"}
                      </Text>
                    </View>
                  )}

                  {/* Password input */}
                  <Input
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    secureTextEntry={!showPassword}
                    icon="lock-closed-outline"
                    rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                  />

                  {/* Login button */}
                  <Button
                    title="Sign In"
                    onPress={handleLogin}
                    loading={isLoading}
                    disabled={!identifier.trim() || !password.trim()}
                    icon="arrow-forward"
                    size="medium"
                    fullWidth
                  />

                  {/* Error message display */}
                  {error && (
                    <View style={styles.errorContainer}>
                      <Ionicons
                        name="alert-circle"
                        size={16}
                        color={COLORS.error}
                      />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}
                </View>
              </Card>
            </Animated.View>

            {/* Bottom section with additional options */}
            <Animated.View
              entering={FadeInDown.duration(800).delay(400)}
              style={styles.bottomSection}
            >
              {/* Forgot password link */}
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={handleForgotPassword}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Registration link */}
              <TouchableOpacity
                style={styles.createAccountButton}
                onPress={() => router.push("/(auth)/passenger-registration")}
              >
                <Text style={styles.createAccountText}>
                  Don't have an account?{" "}
                  <Text style={styles.createAccountLink}>Register Now</Text>
                </Text>
              </TouchableOpacity>

              {/* Help contact information */}
              <TouchableOpacity style={styles.organizationButton}>
                <Text style={styles.organizationText}>Need help?</Text>
                <Text style={styles.organizationEmail}>info@thegobd.com</Text>
              </TouchableOpacity>
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

/**
 * StyleSheet for PassengerLogin component
 * Organized by component sections for better maintainability
 */
const styles = StyleSheet.create({
  // Main container styles
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
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
    zIndex: 1,
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

  // Navigation styles
  backButton: {
    position: "absolute",
    left: SPACING.md,
    top: 60, // Accounts for translucent status bar
    padding: SPACING.sm,
    zIndex: 2,
  },

  // Header section styles
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
  },
  logoContainer: {
    marginBottom: SPACING.sm,
  },
  title: {
    textAlign: "center",
    color: COLORS.secondary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    color: COLORS.gray[600],
    paddingHorizontal: SPACING.md,
    lineHeight: 20,
  },

  // Login form styles
  loginCard: {
    marginBottom: SPACING.lg,
  },
  loginContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },

  // Input type indicator styles
  inputTypeIndicator: {
    position: "absolute",
    right: 20,
    top: 49,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  inputTypeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Error display styles
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

  // Bottom section styles
  bottomSection: {
    alignItems: "center",
  },
  forgotPasswordButton: {
    paddingVertical: SPACING.xs,
  },
  forgotPasswordText: {
    paddingTop: SPACING.lg,
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },

  // Divider styles
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[300],
  },
  dividerText: {
    marginHorizontal: SPACING.sm,
    fontSize: 14,
    color: COLORS.gray[500],
    fontWeight: "500",
  },

  // Registration and help styles
  createAccountButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
  },
  createAccountText: {
    fontSize: 15,
    textAlign: "center",
    color: COLORS.gray[600],
  },
  createAccountLink: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: "600",
  },
  organizationButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  organizationText: {
    paddingTop: SPACING.xl,
    fontSize: 13,
    textAlign: "center",
    color: COLORS.gray[500],
    lineHeight: 16,
  },
  organizationEmail: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
