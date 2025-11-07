import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationDetailModal } from "../../components/NotificationDetailModal";
import { Text } from "../../components/ui/Text";
import { useStatusBar } from "../../hooks/useStatusBar";
import { useNotificationStore } from "../../stores/notificationStore";
import { Notification } from "../../types";
import { API_BASE_URL, COLORS } from "../../utils/constants";
import { DateTimeUtils } from "../../utils/dateTime";

export default function NotificationsPage() {
  // Status bar configuration
  useStatusBar({
    backgroundColor: COLORS.brand.blue,
    barStyle: "light-content",
    translucent: false,
    hidden: false,
  });

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    notifications,
    isLoading,
    isRefreshing,
    hasMore,
    loadNotifications,
    loadMoreNotifications,
    markAsRead,
    refreshNotifications,
  } = useNotificationStore();

  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load initial notifications
  useEffect(() => {
    loadNotifications(1, true);
  }, []);

  const handleRefresh = async () => {
    await refreshNotifications();
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadMoreNotifications();
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);

    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedNotification(null);
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const isUnread = !item.isRead;

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isUnread && styles.unreadNotificationItem]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Left Icon/Image */}
        <View style={styles.notificationIcon}>
          {item.bannerUrl ? (
            <Image
              source={{ uri: `${API_BASE_URL}/${item.bannerUrl}` }}
              style={styles.bannerThumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.iconPlaceholder}>
              <Ionicons
                name="notifications"
                size={20}
                color={isUnread ? COLORS.primary : COLORS.gray[600]}
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text
              variant="body"
              style={[styles.notificationTitle, isUnread && styles.unreadText]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>

          <Text
            variant="bodySmall"
            color={COLORS.gray[700]}
            style={styles.notificationMessage}
            numberOfLines={2}
          >
            {item.message}
          </Text>

          <View style={styles.notificationFooter}>
            <Ionicons name="time-outline" size={12} color={COLORS.gray[500]} />
            <Text variant="caption" color={COLORS.gray[500]} style={styles.notificationTime}>
              {DateTimeUtils.relative(item.createTime)}
            </Text>
          </View>
        </View>

        {/* Chevron */}
        <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading && notifications.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text variant="bodyLarge" color={COLORS.gray[600]} style={styles.emptyText}>
            Loading notifications...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Ionicons name="notifications-off-outline" size={48} color={COLORS.gray[400]} />
        </View>
        <Text variant="h3" style={styles.emptyTitle}>
          No Notifications
        </Text>
        <Text variant="body" color={COLORS.gray[600]} style={styles.emptySubtitle}>
          You're all caught up! New notifications will appear here.
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoading || notifications.length === 0) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Notification List */}
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Detail Modal */}
      <NotificationDetailModal
        visible={showDetailModal}
        notification={selectedNotification}
        onClose={handleCloseDetail}
      />
    </>
  );
}

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
    paddingVertical: 16,
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontWeight: "600",
  },
  placeholder: {
    width: 32,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    gap: 12,
  },
  unreadNotificationItem: {
    backgroundColor: COLORS.primary + "08",
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: "hidden",
  },
  bannerThumbnail: {
    width: "100%",
    height: "100%",
  },
  iconPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.gray[100],
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notificationTitle: {
    flex: 1,
    fontWeight: "600",
  },
  unreadText: {
    color: COLORS.primary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
  },
  notificationMessage: {
    lineHeight: 18,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  notificationTime: {
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: "center",
    lineHeight: 20,
  },
  emptyText: {
    marginTop: 12,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
