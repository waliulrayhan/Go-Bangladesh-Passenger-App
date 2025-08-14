import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { COLORS } from "../utils/constants";
import { Text } from "./ui/Text";

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
  // Additional props for trip details
  busNumber?: string;
  route?: string;
  penaltyAmount?: number;
  showTripDetails?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonColor = COLORS.error,
  icon = "alert-circle",
  iconColor = COLORS.error,
  onConfirm,
  onCancel,
  busNumber,
  route,
  penaltyAmount,
  showTripDetails = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              entering={SlideInUp.duration(300).springify()}
              style={styles.modalContainer}
            >
              {/* Header with close button */}
              <View style={styles.modalHeader}>
                <Text variant="h5" style={styles.modalTitle}>
                  {title}
                </Text>
                <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={COLORS.gray[500]} />
                </TouchableOpacity>
              </View>

              {/* Icon Section */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: iconColor + "20" },
                ]}
              >
                <Ionicons name={icon} size={28} color={iconColor} />
              </View>

              {/* Main Message */}
              <Text variant="body" style={styles.mainMessage}>
                {message}
              </Text>

              {/* Trip Details Section (if enabled) */}
              {showTripDetails && (
                <View style={styles.tripDetailsContainer}>
                  {busNumber && (
                    <View style={styles.detailRow}>
                      <Text variant="bodySmall" style={styles.detailLabel}>
                        Bus Number:
                      </Text>
                      <Text variant="bodySmall" style={styles.detailValue}>
                        {busNumber}
                      </Text>
                    </View>
                  )}

                  {route && (
                    <View style={styles.detailRow}>
                      <Text variant="bodySmall" style={styles.detailLabel}>
                        Route:
                      </Text>
                      <Text variant="bodySmall" style={styles.detailValue}>
                        {route}
                      </Text>
                    </View>
                  )}

                  {penaltyAmount !== undefined && (
                    <>
                      <View style={styles.detailRow}>
                        <Text variant="bodySmall" style={styles.detailLabel}>
                          Penalty Amount:
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={[styles.detailValue, styles.penaltyAmount]}
                        >
                          ৳ {penaltyAmount.toFixed(2)}
                        </Text>
                      </View>

                      <View style={styles.penaltyNotice}>
                        <Text
                          variant="caption"
                          style={styles.penaltyNoticeText}
                        >
                          This penalty amount will be deducted from your
                          balance.
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              {/* Button Section */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    { backgroundColor: confirmButtonColor },
                  ]}
                  onPress={onConfirm}
                >
                  <Ionicons
                    name="exit-outline"
                    size={16}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text variant="label" style={styles.confirmButtonText}>
                    {confirmText}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onCancel}
                >
                  <Text variant="label" style={styles.cancelButtonText}>
                    {cancelText}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
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
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    maxWidth: 380,
    width: "100%",
    elevation: 10,
    shadowColor: COLORS.gray[900],
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.gray[900],
  },
  closeButton: {
    padding: 4,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  mainMessage: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  tripDetailsContainer: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.gray[900],
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  penaltyAmount: {
    color: COLORS.error,
  },
  penaltyNotice: {
    backgroundColor: COLORS.error + "10",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.error,
  },
  penaltyNoticeText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: "500",
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
  },
  button: {
    width: "100%",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    flexDirection: "row",
  },
  cancelButton: {
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  confirmButton: {
    elevation: 2,
    shadowColor: COLORS.gray[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray[700],
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
  },
  buttonIcon: {
    marginRight: 8,
  },
});
