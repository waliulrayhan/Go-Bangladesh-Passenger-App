import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  determineInputType,
  getIconForInput,
  getKeyboardTypeForInput,
  getPlaceholderForInput,
  getValidationErrorMessage,
  validateInput,
} from "../../utils/inputTypeDetector";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { GoBangladeshLogo } from "../../components/GoBangladeshLogo";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Text } from "../../components/ui/Text";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SPACING } from "../../utils/constants";

const { width } = Dimensions.get("window");

export default function PassengerLogin() {
  const [identifier, setIdentifier] = useState(""); // Email or Mobile
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { loginWithPassword, isLoading, error, clearError } = useAuthStore();

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  const handleGoBack = () => {
    router.back();
  };

  // Real-time input type detection
  const inputType = determineInputType(identifier);
  const dynamicKeyboardType = getKeyboardTypeForInput(identifier);
  const dynamicPlaceholder = getPlaceholderForInput(identifier);
  const dynamicIcon = getIconForInput(identifier);

  // Get indicator color based on validation state
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

  // Handle input change with mobile number filtering
  const handleIdentifierChange = (text: string) => {
    // If current input type is mobile, only allow digits
    if (determineInputType(identifier) === "mobile" && text.length > 0) {
      // Remove non-digit characters for mobile input
      const numericOnly = text.replace(/\D/g, "");
      setIdentifier(numericOnly);
    } else {
      setIdentifier(text);
    }
  };

  const handleLogin = async () => {
    clearError();

    if (!validateInput(identifier)) {
      Alert.alert("Error", getValidationErrorMessage(identifier));
      return;
    }

    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    const success = await loginWithPassword(identifier, password);

    if (success) {
      router.replace("/(tabs)");
    }
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

        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Animated.View
            entering={FadeInUp.duration(800)}
            style={styles.header}
          >
            <View style={styles.logoContainer}>
              <GoBangladeshLogo size={60} />
            </View>

            <Text variant="h3" style={styles.title}>
              Welcome Back!
            </Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <Card variant="elevated" style={styles.loginCard}>
              <View style={styles.loginContent}>
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
                    {/* <Ionicons
                      name={inputType === "email" ? "mail" : "call"}
                      size={12}
                      color={getIndicatorColor()}
                    /> */}
                    <Text
                      style={[
                        styles.inputTypeText,
                        { color: getIndicatorColor() },
                      ]}
                    >
                      {inputType === "email" ? "Email" : `Mobile`}
                    </Text>
                  </View>
                )}

                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  icon="lock-closed"
                  rightIcon={showPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                />

                <Button
                  title="Sign In"
                  onPress={handleLogin}
                  loading={isLoading}
                  disabled={!identifier.trim() || !password.trim()}
                  icon="arrow-forward"
                  size="medium"
                  fullWidth
                />

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

          <Animated.View
            entering={FadeInDown.duration(800).delay(400)}
            style={styles.bottomSection}
          >
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={handleForgotPassword}
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
              onPress={() => router.push("/(auth)/passenger-registration")}
            >
              <Text style={styles.createAccountText}>
                Don't have an account?{" "}
                <Text style={styles.createAccountLink}>Register Now</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.organizationButton}>
              <Text style={styles.organizationText}>
                Need help?{" "}
                <Text style={styles.organizationEmail}>info@thegobd.com</Text>
              </Text>
            </TouchableOpacity>
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
    top: 60, // Increased to account for translucent status bar
    padding: SPACING.sm,
    zIndex: 2,
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
  loginCard: {
    marginBottom: SPACING.lg,
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
    fontSize: 15,
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
