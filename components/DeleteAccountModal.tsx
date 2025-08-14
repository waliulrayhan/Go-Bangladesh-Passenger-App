import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { useToast } from "../hooks/useToast";
import { apiService } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { COLORS } from "../utils/constants";
import { Text } from "./ui/Text";

interface DeleteAccountModalProps {
  visible: boolean;
  userName: string;
  userBalance: number;
  onClose: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  userName,
  userBalance,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const { user } = useAuthStore();
  const { showError, showSuccess } = useToast();

  // Reset form when modal is closed
  React.useEffect(() => {
    if (!visible) {
      setIsChecked(false);
      setIsLoading(false);
    }
  }, [visible]);

  const handleConfirmDelete = async () => {
    if (!user?.mobileNumber && !user?.mobile) {
      showError("Mobile number not found. Please update your profile.");
      return;
    }

    setIsLoading(true);

    try {
      const mobileNumber = user.mobileNumber || user.mobile;
      console.log("🔄 Sending OTP for account deletion to:", mobileNumber);

      // Send OTP for account deletion verification
      await apiService.sendOTP(mobileNumber);

      console.log("✅ OTP sent successfully for account deletion");
      showSuccess("OTP sent to your mobile number for verification.");

      // Close the modal and navigate to OTP verification page
      onClose();

      // Navigate to OTP verification page with required parameters
      router.push({
        pathname: "/(auth)/verify-account-deletion",
        params: {
          phone: mobileNumber,
          userName: userName,
        },
      });
    } catch (error: any) {
      console.error("❌ Error sending OTP for account deletion:", error);

      const errorMessage =
        error.message ||
        error.response?.data?.data?.message ||
        "Failed to send OTP. Please try again.";
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              entering={SlideInUp.duration(300)}
              style={styles.modalContainer}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Header */}
                <Animated.View
                  entering={FadeIn.delay(100)}
                  style={styles.header}
                >
                  <View style={styles.warningIconContainer}>
                    <Ionicons name="warning" size={24} color={COLORS.white} />
                  </View>
                  <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Delete Account</Text>
                    <Text style={styles.headerSubtitle}>
                      Permanently remove your account
                    </Text>
                  </View>
                </Animated.View>

                {/* Important Information */}
                <Animated.View
                  entering={FadeIn.delay(200)}
                  style={styles.infoSection}
                >
                  <Text style={styles.infoTitle}>Important Information</Text>

                  <View style={styles.bulletPoint}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>
                      Account will be permanently deleted after 7 days.
                    </Text>
                  </View>

                  <View style={styles.bulletPoint}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>
                      Login within 7 days to cancel deletion.
                    </Text>
                  </View>

                  <View style={styles.bulletPoint}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>
                      Card balance will be lost permanently.
                    </Text>
                  </View>

                  <View style={styles.bulletPoint}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>
                      Withdraw your balance before deletion.
                    </Text>
                  </View>
                </Animated.View>

                {/* User Confirmation */}
                <Animated.View
                  entering={FadeIn.delay(300)}
                  style={styles.confirmationSection}
                >
                  <View style={styles.checkboxContainer}>
                    <TouchableOpacity
                      style={[
                        styles.checkbox,
                        isChecked && styles.checkboxChecked,
                      ]}
                      onPress={() => setIsChecked(!isChecked)}
                      activeOpacity={0.7}
                    >
                      {isChecked && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={COLORS.white}
                        />
                      )}
                    </TouchableOpacity>
                    <Text style={styles.confirmationText}>
                      I, <Text style={styles.userName}>{userName}</Text>,
                      confirm deletion of my account. My balance of{" "}
                      <Text style={styles.balanceAmount}>
                        ৳{userBalance.toFixed(2)}
                      </Text>{" "}
                      and all data will be permanently lost after 7 days.
                    </Text>
                  </View>
                </Animated.View>

                {/* Note */}
                <Animated.View
                  entering={FadeIn.delay(400)}
                  style={styles.noteSection}
                >
                  <View style={styles.noteIcon}>
                    <Ionicons
                      name="information-circle"
                      size={16}
                      color={COLORS.info}
                    />
                  </View>
                  <Text style={styles.noteText}>
                    OTP will be sent to your mobile number for verification.
                  </Text>
                </Animated.View>

                {/* Action Buttons */}
                <Animated.View
                  entering={FadeIn.delay(500)}
                  style={styles.actionContainer}
                >
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={onClose}
                    disabled={isLoading}
                  >
                    {/* <Ionicons name="close" size={16} color={COLORS.gray[600]} /> */}
                    <Text style={styles.backButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.deleteButton,
                      (isLoading || !isChecked) && styles.deleteButtonDisabled,
                    ]}
                    onPress={handleConfirmDelete}
                    disabled={isLoading || !isChecked}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <>
                        <Ionicons name="trash" size={16} color={COLORS.white} />
                        <Text style={styles.deleteButtonText}>
                          Confirm Delete Account
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    maxHeight: "90%",
    width: "100%",
    maxWidth: 400,
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    backgroundColor: COLORS.error,
    marginHorizontal: -20,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  warningIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "400",
  },
  infoSection: {
    backgroundColor: COLORS.error + "08",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.error,
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  bullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.error,
    marginTop: 8,
    marginRight: 8,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray[700],
    flex: 1,
  },
  confirmationSection: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    paddingRight: 10,
    paddingLeft: 4,
    marginBottom: 10,
    borderLeftColor: COLORS.warning,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.gray[400],
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  confirmationText: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray[700],
    textAlign: "justify",
    flex: 1,
  },
  userName: {
    fontWeight: "600",
    fontSize: 15,
    color: COLORS.primary,
  },
  balanceAmount: {
    fontWeight: "600",
    fontSize: 15,
    color: COLORS.error,
  },
  noteSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.info + "08",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  noteIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  noteText: {
    fontSize: 13,
    color: COLORS.info,
    flex: 1,
    lineHeight: 18,
  },
  actionContainer: {
    flexDirection: "column",
    gap: 12,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray[600],
    marginLeft: 6,
  },
  deleteButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.error,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    marginLeft: 6,
  },
});
