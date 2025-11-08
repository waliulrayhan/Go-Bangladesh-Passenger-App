import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Notification } from "../types";
import { API_BASE_URL, COLORS } from "../utils/constants";
import { DateFormatter, DateTime } from "../utils/dateTime";
import { Text } from "./ui/Text";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface NotificationDetailModalProps {
  visible: boolean;
  notification: Notification | null;
  onClose: () => void;
}

export const NotificationDetailModal: React.FC<NotificationDetailModalProps> = ({
  visible,
  notification,
  onClose,
}) => {
  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-circle" size={32} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Banner Image */}
            {notification.bannerUrl && (
              <View style={styles.bannerContainer}>
                <Image
                  source={{ uri: `${API_BASE_URL}/${notification.bannerUrl}` }}
                  style={styles.bannerImage}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* Content Section */}
            <View style={styles.textContent}>
              {/* Date and Time */}
              <Text variant="caption" color={COLORS.gray[500]} style={styles.date}>
                {DateFormatter.custom(DateTime.parseUTCToLocal(notification.createTime), { 
                  includeTime: true, 
                  use24Hour: false,
                  includeYear: true,
                  useShortMonth: false
                })}
              </Text>

              {/* Title */}
              <Text variant="h3" style={styles.title}>
                {notification.title}
              </Text>

              {/* Message */}
              <Text variant="body" color={COLORS.gray[700]} style={styles.message}>
                {notification.message}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: "100%",
    maxWidth: 500,
    maxHeight: SCREEN_HEIGHT * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: COLORS.white,
    alignItems: "flex-end",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  bannerContainer: {
    width: "100%",
    backgroundColor: COLORS.gray[50],
  },
  bannerImage: {
    width: "100%",
    aspectRatio: 2,
  },
  textContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  date: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 24,
    color: COLORS.gray[700],
  },
});
