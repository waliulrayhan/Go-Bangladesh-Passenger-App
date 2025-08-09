import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
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
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [isExpired, setIsExpired] = useState(false);

  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      setIsExpired(true);
      showError("Password reset session has expired Please start over.");
      setTimeout(() => {
        router.replace("/(auth)/forgot-password");
      }, 2000);
      return;
    }

    const timer = setTimeout(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining]);

  // Prevent back navigation (hardware back button and gesture)
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Return true to prevent default back action
        return true;
      };

      // Add event listener for hardware back button
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long!";
    }
    return null;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleResetPassword = async () => {
    if (isExpired) {
      showError("Session has expired. Please start over.");
      return;
    }

    clearError();

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showError(passwordError);
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match!");
      return;
    }

    if (!mobile) {
      showError("Mobile number not found. Please start over!");
      return;
    }

    const success = await resetPassword(mobile, newPassword, confirmPassword);

    if (success) {
      showSuccess("Your password has been reset successfully. You can now login with your new password!");
      // Navigate to login after a short delay to allow user to see the success message
      setTimeout(() => {
        router.replace("/(auth)/passenger-login");
      }, 3000);
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
              
              {/* Timer Display */}
              <View style={styles.timerContainer}>
                <Ionicons 
                  name="time-outline" 
                  size={16} 
                  color={timeRemaining <= 60 ? COLORS.error : COLORS.warning} 
                />
                <Text style={[
                  styles.timerText,
                  { color: timeRemaining <= 60 ? COLORS.error : COLORS.warning }
                ]}>
                  Session expires in {formatTime(timeRemaining)}
                </Text>
              </View>
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
                    editable={!isExpired}
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
                    editable={!isExpired}
                  />

                  <View style={styles.passwordRequirements}>
                    <Text style={styles.requirementsTitle}>
                      Password requirements:
                    </Text>
                    <View style={styles.requirementsRow}>
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
                  </View>

                  <Button
                    title={isExpired ? "Session Expired" : "Reset Password"}
                    onPress={handleResetPassword}
                    loading={isLoading}
                    disabled={isExpired}
                    variant="primary"
                    size="medium"
                    fullWidth
                    icon={isExpired ? "time-outline" : "checkmark-outline"}
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
    paddingTop: SPACING.xl, // Reduced padding since no back button
    paddingBottom: SPACING.lg,
  },
  header: {
    paddingTop: SPACING["5xl"],
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
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  timerText: {
    fontSize: 14,
    fontFamily: FONT_WEIGHTS.medium,
    textAlign: "center",
  },
  formCard: {
    marginBottom: SPACING.md,
  },
  formContent: {
    gap: SPACING.sm,
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
  requirementsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flex: 1,
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
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.error + "10",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error + "30",
    marginBottom: SPACING.md,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.error,
    fontFamily: FONT_WEIGHTS.medium,
    textAlign: "center",
    flex: 1,
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
