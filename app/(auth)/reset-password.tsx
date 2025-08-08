import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Text } from "../../components/ui/Text";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SPACING } from "../../utils/constants";
import { FONT_WEIGHTS } from "../../utils/fonts";

export default function ResetPassword() {
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();

  const handleGoBack = () => {
    router.back();
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return null;
  };

  const handleResetPassword = async () => {
    clearError();

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showError(passwordError);
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if (!mobile) {
      showError("Mobile number not found. Please start over.");
      return;
    }

    const success = await resetPassword(mobile, newPassword, confirmPassword);

    if (success) {
      showSuccess("Your password has been reset successfully. You can now login with your new password.");
      // Navigate to login after a short delay to allow user to see the success message
      setTimeout(() => {
        router.replace("/(auth)/passenger-login");
      }, 2000);
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
          <Text style={styles.backButtonText}>← Back</Text>
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
                <Ionicons name="lock-closed-outline" size={40} color={COLORS.primary} />
              </View>
              <Text variant="h3" style={styles.title}>
                Reset Password
              </Text>
              <Text style={styles.subtitle}>
                Create a new password for your account: {mobile}
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(800).delay(200)}>
              <Card variant="elevated" style={styles.formCard}>
                <View style={styles.formContent}>
                  <Input
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    secureTextEntry={!showPassword}
                    icon="lock-closed-outline"
                    rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                    autoCapitalize="none"
                  />

                  <Input
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirmPassword}
                    icon="lock-closed-outline"
                    rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    autoCapitalize="none"
                  />

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

                  <View style={styles.passwordRequirements}>
                    <Text style={styles.requirementsTitle}>
                      Password requirements:
                    </Text>
                    <View style={styles.requirement}>
                      <Ionicons
                        name={
                          newPassword.length >= 8
                            ? "checkmark-circle"
                            : "ellipse-outline"
                        }
                        size={16}
                        color={
                          newPassword.length >= 8
                            ? COLORS.success
                            : COLORS.gray[400]
                        }
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          newPassword.length >= 8 && styles.requirementMet,
                        ]}
                      >
                        At least 8 characters
                      </Text>
                    </View>
                    <View style={styles.requirement}>
                      <Ionicons
                        name={
                          newPassword === confirmPassword && newPassword
                            ? "checkmark-circle"
                            : "ellipse-outline"
                        }
                        size={16}
                        color={
                          newPassword === confirmPassword && newPassword
                            ? COLORS.success
                            : COLORS.gray[400]
                        }
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          newPassword === confirmPassword &&
                            newPassword &&
                            styles.requirementMet,
                        ]}
                      >
                        Passwords match
                      </Text>
                    </View>
                  </View>

                  <Button
                    title="Reset Password"
                    onPress={handleResetPassword}
                    loading={isLoading}
                    variant="primary"
                    size="medium"
                    fullWidth
                    icon="checkmark-outline"
                  />
                </View>
              </Card>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(800).delay(400)}
              style={styles.helpSection}
            >
              <Text style={styles.helpNote}>
                Make sure to remember your new password. You'll use it to login to
                your account.
              </Text>
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
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: 100, // Space for back button
    paddingBottom: SPACING.lg,
  },
  backButton: {
    position: "absolute",
    top: 62, // Increased for translucent status bar
    left: SPACING.md,
    zIndex: 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
    fontFamily: FONT_WEIGHTS.semiBold,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    justifyContent: "center",
    paddingTop: SPACING.lg,
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  title: {
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: SPACING.md,
  },
  formCard: {
    marginBottom: SPACING.md,
  },
  formContent: {
    gap: SPACING.sm,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.error + "10",
    padding: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    flex: 1,
    fontFamily: FONT_WEIGHTS.medium,
  },
  passwordRequirements: {
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.xs,
  },
  requirementsTitle: {
    fontSize: 14,
    fontFamily: FONT_WEIGHTS.semiBold,
    color: COLORS.gray[700],
    marginBottom: SPACING.xs,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: SPACING.xs / 2,
  },
  requirementText: {
    fontSize: 13,
    color: COLORS.gray[500],
    fontFamily: FONT_WEIGHTS.regular,
  },
  requirementMet: {
    color: COLORS.success,
    fontFamily: FONT_WEIGHTS.medium,
  },
  helpSection: {
    alignItems: "center",
    paddingTop: SPACING.md,
  },
  helpNote: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: "center",
    lineHeight: 20,
    fontFamily: FONT_WEIGHTS.regular,
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
