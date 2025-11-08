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
            <Text variant="h3" style={styles.headerTitle}>
              Notification Detail
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.gray[600]} />
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
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Content Section */}
            <View style={styles.textContent}>
              {/* Title */}
              <Text variant="h3" style={styles.title}>
                {notification.title}
              </Text>

              {/* Message */}
              <Text variant="body" color={COLORS.gray[700]} style={styles.message}>
                {notification.message}
              </Text>

              {/* Date and Time */}
              <Text variant="caption" color={COLORS.gray[500]} style={styles.date}>
                {DateFormatter.custom(DateTime.parseUTCToLocal(notification.createTime), { 
                  includeTime: true, 
                  use24Hour: false,
                  includeYear: true,
                  useShortMonth: false
                })}
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
    borderRadius: 20,
    width: "100%",
    maxWidth: 500,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray[900],
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flexGrow: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  bannerContainer: {
    width: "100%",
    backgroundColor: COLORS.gray[100],
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    aspectRatio: 2,
  },
  textContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 26,
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.gray[700],
    marginBottom: 12,
  },
  date: {
    fontSize: 13,
    fontWeight: "400",
  },
});
