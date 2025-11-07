import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { Notification } from "../types";
import { API_BASE_URL, COLORS } from "../utils/constants";
import { DateFormatter, DateTimeUtils } from "../utils/dateTime";
import { Text } from "./ui/Text";

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

  const formatDate = (dateString: string) => {
    return DateTimeUtils.relative(dateString);
  };

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return DateFormatter.custom(date, { 
      includeTime: true, 
      use24Hour: false,
      includeYear: true,
      useShortMonth: false
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.gray[700]} />
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
            {/* Date */}
            <Text variant="caption" color={COLORS.gray[500]} style={styles.date}>
              {formatFullDate(notification.createTime)}
            </Text>

            {/* Title */}
            <Text variant="h2" style={styles.title}>
              {notification.title}
            </Text>

            {/* Message */}
            <Text variant="body" color={COLORS.gray[700]} style={styles.message}>
              {notification.message}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: COLORS.white,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  bannerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.gray[100],
    marginBottom: 24,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  textContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  date: {
    fontSize: 13,
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    color: COLORS.gray[900],
  },
  message: {
    fontSize: 16,
    lineHeight: 26,
  },
});
