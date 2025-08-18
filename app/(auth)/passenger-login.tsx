import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
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
import {
  determineInputType,
  getIconForInput,
  getPlaceholderForInput,
  getValidationErrorMessage,
  validateInput,
} from "../../utils/inputTypeDetector";

const ANIMATION_DELAYS = {
  HEADER: 600,
  FORM: 750,
  BOTTOM: 900,
} as const;

const INPUT_CONSTRAINTS = {
  MOBILE_MAX_LENGTH: 11,
  PASSWORD_MIN_LENGTH: 8,
} as const;

/**
 * PassengerLogin Component
 *
 * Provides authentication interface for passengers with:
 * - Dynamic input type detection (email/mobile)
 * - Real-time validation and visual feedback
 * - Smooth animations and user-friendly UX
 */
export default function PassengerLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, clearError } = useAuthStore();
  const { toast, showError, hideToast } = useToast();

  const inputType = determineInputType(identifier);

  // Clear form when the screen comes into focus (user navigates back)
  useFocusEffect(
    useCallback(() => {
      // Clear any existing error state and toast when screen is focused
      clearError();
      hideToast();
      
      return () => {
        // Cleanup: Clear form when navigating away
        setIdentifier("");
        setPassword("");
        setShowPassword(false);
      };
    }, []) // Empty dependencies to prevent infinite loops
  );

  const navigateToForgotPassword = () => {
    // Clear form before navigation to prevent UI shake
    setIdentifier("");
    setPassword("");
    setShowPassword(false);
    clearError();
    hideToast();
    router.push("/(auth)/forgot-password");
  };

  const navigateBack = () => router.back();

  const navigateToRegistration = () => {
    // Clear form before navigation to prevent UI shake
    setIdentifier("");
    setPassword("");
    setShowPassword(false);
    clearError();
    hideToast();
    router.push("/(auth)/passenger-registration");
  };

  const handleEmailPress = () => {
    const email = 'info@thegobd.com';
    Linking.openURL(`mailto:${email}`).catch(() => {
      showError('Unable to open email client');
    });
  };

  const getIndicatorColor = () => {
    if (inputType === "email") {
      return validateInput(identifier) ? COLORS.success : COLORS.primary;
    }

    if (inputType === "mobile") {
      const isValid =
        identifier.length === INPUT_CONSTRAINTS.MOBILE_MAX_LENGTH &&
        validateInput(identifier);
      const isTooLong = identifier.length > INPUT_CONSTRAINTS.MOBILE_MAX_LENGTH;

      if (isValid) return COLORS.success;
      if (isTooLong) return COLORS.error;
    }

    return COLORS.primary;
  };

  const handleIdentifierChange = (text: string) => {
    if (inputType === "mobile" && text.length > 0) {
      const numericOnly = text.replace(/\D/g, "");
      setIdentifier(numericOnly);
    } else {
      setIdentifier(text);
    }
  };

  const validateInputs = () => {
    if (!validateInput(identifier)) {
      showError(getValidationErrorMessage(identifier));
      return false;
    }

    if (!password || password.length < INPUT_CONSTRAINTS.PASSWORD_MIN_LENGTH) {
      showError(
        `Password must be at least ${INPUT_CONSTRAINTS.PASSWORD_MIN_LENGTH} characters`
      );
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    clearError();

    if (!validateInputs()) return;

    try {
      const success = await login(identifier, password);

      if (success) {
        router.replace("/(tabs)");
      } else {
        const currentError = useAuthStore.getState().error;
        showError(
          currentError ||
            "Login failed. Please check your credentials and try again."
        );
      }
    } catch (error) {
      showError("An unexpected error occurred. Please try again.");
    }
  };

  const isFormValid = identifier.trim() && password.trim();

  const renderHeader = () => (
    <Animated.View
      entering={FadeInUp.duration(ANIMATION_DELAYS.HEADER)}
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
  );

  const renderInputTypeIndicator = () => {
    if (!identifier.trim()) return null;

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
        <Text style={[styles.inputTypeText, { color: indicatorColor }]}>
          {inputType === "email" ? "Email" : "Mobile"}
        </Text>
      </View>
    );
  };

  const renderLoginForm = () => (
    <Animated.View entering={FadeInDown.duration(ANIMATION_DELAYS.FORM)}>
      <Card variant="elevated" style={styles.loginCard}>
        <View style={styles.loginContent}>
          <Input
            label="Email or Phone Number"
            value={identifier}
            onChangeText={handleIdentifierChange}
            placeholder={getPlaceholderForInput(identifier)}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            icon={getIconForInput(identifier)}
            maxLength={
              inputType === "mobile"
                ? INPUT_CONSTRAINTS.MOBILE_MAX_LENGTH
                : undefined
            }
          />

          {renderInputTypeIndicator()}

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            keyboardType="default"
            autoCorrect={false}
            autoComplete="password"
            icon="lock-closed-outline"
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={isLoading}
            disabled={!isFormValid}
            icon="arrow-forward"
            size="medium"
            fullWidth
          />
        </View>
      </Card>
    </Animated.View>
  );

  const renderBottomSection = () => (
    <Animated.View
      entering={FadeInDown.duration(ANIMATION_DELAYS.BOTTOM)}
      style={styles.bottomSection}
    >
      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={navigateToForgotPassword}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.createAccountButton}
        onPress={navigateToRegistration}
      >
        <Text style={styles.createAccountText}>
          Don't have an account?
        </Text>
        <Text style={styles.createAccountLink}>Register Now</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.organizationButton}
        onPress={handleEmailPress}
      >
        <Text style={styles.organizationText}>Need help?</Text>
        <Text style={styles.organizationEmail}>info@thegobd.com</Text>
      </TouchableOpacity>
    </Animated.View>
  );

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
            {renderLoginForm()}
            {renderBottomSection()}
          </ScrollView>
        </KeyboardAvoidingView>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
          position="bottom"
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
    paddingTop: 70,
    paddingBottom: SPACING.xl,
    justifyContent: "center",
  },

  // Header
  header: {
    alignItems: "center",
    marginBottom: SPACING.xl,
    marginTop: SPACING.xl,
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

  // Login form
  loginCard: {
    // marginBottom: SPACING.lg,
  },
  loginContent: {
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

  // Bottom section
  bottomSection: {
    alignItems: "center",
  },
  forgotPasswordButton: {
    paddingVertical: SPACING.xs,
  },
  forgotPasswordText: {
    // paddingTop: SPACING.lg,
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },

  // Divider
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

  // Registration and help
  createAccountButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
  },
  createAccountText: {
    fontSize: 16,
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
    paddingTop: SPACING.xs,
    fontSize: 14,
    textAlign: "center",
    color: COLORS.gray[600],
    lineHeight: 16,
  },
  organizationEmail: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
