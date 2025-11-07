import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationDetailModal } from "../../components/NotificationDetailModal";
import { Text } from "../../components/ui/Text";
import { useStatusBar } from "../../hooks/useStatusBar";
import { useNotificationStore } from "../../stores/notificationStore";
import { Notification } from "../../types";
import { COLORS } from "../../utils/constants";

// Helper function to get notification icon and color based on type
const getNotificationIcon = (
  title: string, 
  notificationId: string | null
): { icon: keyof typeof Ionicons.glyphMap; color: string; bgColor: string } => {
  const lowerTitle = title.toLowerCase();
  
  // Admin Notification (specific notificationId)
  if (notificationId === '907b5efccdd34ab789a3fb0e43a78485') {
    return { icon: 'megaphone', color: '#da3e3eff', bgColor: '#fce9e9ff' };
  }
  // Welcome after registration
  else if (lowerTitle.includes('welcome') || lowerTitle.includes('registration')) {
    return { icon: 'happy-outline', color: '#6BB86B', bgColor: '#F0F9F0' };
  }
  // Trip Start
  else if (lowerTitle.includes('trip') && lowerTitle.includes('start')) {
    return { icon: 'navigate-circle', color: '#5B9BD5', bgColor: '#EFF6FC' };
  }
  // Trip End
  else if (lowerTitle.includes('trip') && lowerTitle.includes('end')) {
    return { icon: 'checkmark-done-circle', color: '#70C17C', bgColor: '#F1F9F3' };
  }
  // Recharge
  else if (lowerTitle.includes('recharge') || lowerTitle.includes('top up') || lowerTitle.includes('balance added')) {
    return { icon: 'card-outline', color: '#9B7EBD', bgColor: '#F7F3FA' };
  }
  // Return
  else if (lowerTitle.includes('return') || lowerTitle.includes('refund')) {
    return { icon: 'arrow-undo-circle', color: '#D4A574', bgColor: '#FBF6F0' };
  }
  // Promo Used
  else if (lowerTitle.includes('promo') && (lowerTitle.includes('used') || lowerTitle.includes('applied') || lowerTitle.includes('redeemed'))) {
    return { icon: 'checkmark-circle-outline', color: '#D98FB6', bgColor: '#FCF5F9' };
  }
  // Promo Offer
  else if (lowerTitle.includes('promo') && (lowerTitle.includes('offer') || lowerTitle.includes('available') || lowerTitle.includes('new'))) {
    return { icon: 'ticket-outline', color: '#E8A25F', bgColor: '#FFF8F0' };
  }
  // Profile Update
  else if (lowerTitle.includes('profile') && lowerTitle.includes('update')) {
    return { icon: 'person-outline', color: '#6DBACD', bgColor: '#F0F9FB' };
  }
  // Default notification
  else {
    return { icon: 'notifications-outline', color: '#8C9BA5', bgColor: '#F5F7F9' };
  }
};

// Helper function to check if notification is new (within 24 hours)
const isNewNotification = (dateString: string): boolean => {
  const notificationDate = new Date(dateString);
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return notificationDate > twentyFourHoursAgo;
};

// Helper function to get grouped date label
const getDateLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notificationDate.getTime() === today.getTime()) {
    return "Today";
  } else if (notificationDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  } else if (notificationDate.getTime() === twoDaysAgo.getTime()) {
    return "2 days ago";
  } else if (notificationDate.getTime() === threeDaysAgo.getTime()) {
    return "3 days ago";
  } else {
    // Format as "Dec 5, 2024"
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }
};

// Helper function to format time
const getTimeLabel = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
};

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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Load initial notifications
  useEffect(() => {
    loadNotifications(1, true);
  }, []);

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  // Group notifications into "New" and older
  const newNotifications = filteredNotifications.filter(n => isNewNotification(n.createTime));
  const olderNotifications = filteredNotifications.filter(n => !isNewNotification(n.createTime));

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
    const iconData = getNotificationIcon(item.title, item.notificationId);

    // Use gray color for read notifications
    const displayBgColor = isUnread ? iconData.bgColor : '#F3F4F6';

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          { backgroundColor: displayBgColor }
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Left Icon */}
        <View style={[styles.iconCircle, { backgroundColor: iconData.color }]}>
          <Ionicons 
            name={iconData.icon} 
            size={20} 
            color="#FFFFFF" 
          />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text
            variant="body"
            style={[
              styles.notificationTitle,
              isUnread && styles.unreadTitle
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          {/* Message */}
          <Text
            variant="caption"
            color={COLORS.gray[600]}
            style={styles.notificationMessage}
            numberOfLines={2}
          >
            {item.message || ""}
          </Text>
        </View>

        {/* Unread Indicator */}
        {isUnread && (
          <View style={styles.unreadDot} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading && notifications.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.gray[400]} />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-outline" size={64} color={COLORS.gray[300]} />
        <Text variant="body" color={COLORS.gray[500]} style={styles.emptyText}>
          No notifications yet
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
        {/* Header */}
        {/* <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
          </TouchableOpacity>

          <Text variant="h2" style={styles.headerTitle}>
            Notification
          </Text>

          <TouchableOpacity 
            onPress={() => setShowFilterModal(true)}
            style={styles.filterButton}
          >
            <Ionicons name="options-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View> */}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              variant="body"
              style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}
            >
              All
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
            onPress={() => setActiveTab('unread')}
          >
            <Text
              variant="body"
              style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}
            >
              Unread
            </Text>
          </Pressable>
        </View>

        {/* Notification List */}
        <FlatList
          data={filteredNotifications}
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.gray[900],
  },
  filterButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    gap: 16,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "transparent",
  },
  activeTab: {
    backgroundColor: COLORS.primary + "15",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray[600],
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.gray[900],
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "400",
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: "700",
  },
  notificationMessage: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
    color: COLORS.gray[600],
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
