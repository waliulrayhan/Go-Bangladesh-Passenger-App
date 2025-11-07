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
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text variant="h3" color={COLORS.white} style={styles.headerTitle}>
            Notification
          </Text>
          <View style={styles.placeholder} />
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

          {/* Title and Date */}
          <View style={styles.titleSection}>
            <Text variant="h2" style={styles.title}>
              {notification.title}
            </Text>
            <View style={styles.metaInfo}>
              <Ionicons
                name="time-outline"
                size={16}
                color={COLORS.gray[600]}
              />
              <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.date}>
                {formatFullDate(notification.createTime)}
              </Text>
            </View>
          </View>

          {/* Message */}
          <View style={styles.messageSection}>
            <Text variant="bodyLarge" style={styles.message}>
              {notification.message}
            </Text>
          </View>

          {/* Read Status */}
          {notification.isRead && notification.readAt && (
            <View style={styles.readStatusSection}>
              <View style={styles.readStatusBadge}>
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color={COLORS.success}
                />
                <Text variant="bodySmall" color={COLORS.success} style={styles.readStatusText}>
                  Read {formatDate(notification.readAt)}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontWeight: "600",
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  bannerContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.gray[200],
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontWeight: "700",
    marginBottom: 12,
    lineHeight: 28,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  date: {
    fontWeight: "500",
  },
  messageSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  message: {
    lineHeight: 24,
    color: COLORS.gray[800],
  },
  readStatusSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  readStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.success + "10",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.success + "30",
  },
  readStatusText: {
    fontWeight: "600",
  },
});
