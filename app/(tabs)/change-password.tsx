import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
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

const { width } = Dimensions.get("window");

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { changePassword, isLoading, error, clearError } = useAuthStore();
  const { toast, showError, showSuccess, hideToast } = useToast();

  // Clear form when screen comes into focus (user navigates back)
  useFocusEffect(
    useCallback(() => {
      // Clear any existing error state and toast when screen is focused
      clearError();
      hideToast();
      
      return () => {
        // Cleanup: Clear form when navigating away
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setShowOldPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      };
    }, []) // Empty dependencies to prevent infinite loops
  );

  const handleGoBack = () => {
    router.replace('/(tabs)/profile');
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long!";
    }
    return null;
  };

  const handleChangePassword = async () => {
    clearError();

    // Validate inputs
    if (!oldPassword.trim()) {
      showError("Please enter your current password!");
      return;
    }

    if (!newPassword.trim()) {
      showError("Please enter a new password!");
      return;
    }

    if (!confirmNewPassword.trim()) {
      showError("Please confirm your new password!");
      return;
    }

    // Validate new password
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      showError(passwordError);
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmNewPassword) {
      showError("New passwords do not match!");
      return;
    }

    // Check if old and new password are the same
    if (oldPassword === newPassword) {
      showError("New password must be different from your current password!");
      return;
    }

    const result = await changePassword(
      oldPassword,
      newPassword,
      confirmNewPassword
    );

    if (result.success) { 
      showSuccess("Your password has been updated successfully!");
      // Navigate back after a short delay to allow user to see the success message
      setTimeout(() => {
        router.replace('/(tabs)/profile');
      }, 2000);
    } else {
      showError(result.message);
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
            <Animated.View
              entering={FadeInUp.duration(800)}
              style={styles.header}
            >
              <View style={styles.logoContainer}>
                <GoBangladeshLogo size={50} />
              </View>

              <Text variant="h3" style={styles.title}>
                Change Password
              </Text>
              <Text style={styles.subtitle}>
                Update your account password for better security
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(800).delay(200)}>
              <Card variant="elevated" style={styles.formCard}>
                <View style={styles.formContent}>
                  <Input
                    label="Current Password"
                    value={oldPassword}
                    onChangeText={setOldPassword}
                    placeholder="Enter current password"
                    secureTextEntry={!showOldPassword}
                    icon="lock-closed-outline"
                    rightIcon={showOldPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() => setShowOldPassword(!showOldPassword)}
                  />

                  <Input
                    label="New Password"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    secureTextEntry={!showNewPassword}
                    icon="lock-closed-outline"
                    rightIcon={showNewPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() => setShowNewPassword(!showNewPassword)}
                  />

                  <Input
                    label="Confirm New Password"
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    placeholder="Confirm new password"
                    secureTextEntry={!showConfirmPassword}
                    icon="lock-closed-outline"
                    rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                  />

                  <View style={styles.passwordRequirements}>
                    <Text style={styles.requirementsTitle}>
                      Password Requirements:
                    </Text>
                    <View style={styles.requirementsRow}>
                      <View style={styles.requirement}>
                        <Ionicons
                          name={
                            newPassword.length >= 8
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={14}
                          color={
                            newPassword.length >= 8
                              ? COLORS.success
                              : COLORS.gray[400]
                          }
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            {
                              color:
                                newPassword.length >= 8
                                  ? COLORS.success
                                  : COLORS.gray[600],
                            },
                          ]}
                        >
                          At least 8 characters
                        </Text>
                      </View>
                      {/* <View style={styles.requirement}>
                        <Ionicons
                          name={
                            newPassword === confirmNewPassword && newPassword
                              ? "checkmark-circle"
                              : "ellipse-outline"
                          }
                          size={14}
                          color={
                            newPassword === confirmNewPassword && newPassword
                              ? COLORS.success
                              : COLORS.gray[400]
                          }
                        />
                        <Text
                          style={[
                            styles.requirementText,
                            {
                              color:
                                newPassword === confirmNewPassword && newPassword
                                  ? COLORS.success
                                  : COLORS.gray[600],
                            },
                          ]}
                        >
                          Passwords match
                        </Text>
                      </View> */}
                    </View>
                  </View>

                  <Button
                    title="Change Password"
                    onPress={handleChangePassword}
                    loading={isLoading}
                    // disabled={
                    //   !oldPassword ||
                    //   !newPassword ||
                    //   !confirmNewPassword ||
                    //   newPassword !== confirmNewPassword ||
                    //   newPassword.length < 8
                    // }
                    icon="checkmark-outline"
                    size="medium"
                    fullWidth
                  />
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
          position="bottom"
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
    paddingTop: 80, // Space for back button
    paddingBottom: SPACING.lg,
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
    marginTop: SPACING.xl,
  },
  backButton: {
    position: "absolute",
    left: SPACING.md,
    top: 60, // Increased for translucent status bar
    padding: SPACING.sm,
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: SPACING.xs,
  },
  title: {
    textAlign: "center",
    color: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: COLORS.gray[600],
    paddingHorizontal: SPACING.md,
    lineHeight: 18,
  },
  formCard: {
    marginBottom: SPACING.sm,
  },
  formContent: {
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  passwordRequirements: {
    backgroundColor: COLORS.gray[50],
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    minHeight: 70, // Fixed height to prevent layout shifts
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  requirementsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
    height: 20, // Fixed height to prevent shifting
  },
  requirementText: {
    fontSize: 12,
    marginLeft: SPACING.xs,
    fontWeight: "500",
  },
  bottomSection: {
    alignItems: "center",
  },
  helpSection: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  helpText: {
    fontSize: 13,
    textAlign: "center",
    color: COLORS.gray[500],
    lineHeight: 16,
  },
  helpEmail: {
    fontSize: 14,
    textAlign: "center",
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 2,
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
