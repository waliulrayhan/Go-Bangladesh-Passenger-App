import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Animated, Image, Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL, COLORS } from "../../utils/constants";
import { logger } from "../../utils/logger";
import { GoBangladeshLogo } from "../GoBangladeshLogo";
import { Text } from "./Text";

interface User {
  name?: string;
  imageUrl?: string;
  profileImage?: string;
}

interface CustomHeaderProps {
  title?: string;
  subtitle?: string;
  user?: User;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  unreadCount?: number;
  showNotificationBell?: boolean;
}
export const CustomHeader: React.FC<CustomHeaderProps> = React.memo(({
  title = "Go Bangladesh",
  subtitle = "One step toward a better future",
  user,
  onProfilePress,
  onNotificationPress,
  unreadCount = 0,
  showNotificationBell = false,
}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate proper padding for status bar on iOS
  const getStatusBarHeight = () => {
    if (Platform.OS === 'ios') {
      // Use safe area insets if available, fallback to estimated status bar height
      const statusBarHeight = insets.top > 0 ? insets.top : 44; // 44 is typical iOS status bar height
      return statusBarHeight;
    }
    return 0; // Android handles this via system UI
  };

  // Input validation and sanitization
  const sanitizedTitle = useMemo(() => {
    try {
      return typeof title === 'string' ? title.trim().slice(0, 50) : "Go Bangladesh";
    } catch (error) {
      logger.warn('Invalid title provided to CustomHeader', 'CustomHeader', String(error));
      return "Go Bangladesh";
    }
  }, [title]);
  const sanitizedSubtitle = useMemo(() => {
    try {
      return typeof subtitle === 'string' ? subtitle.trim().slice(0, 100) : "One step toward a better future";
    } catch (error) {
      logger.warn('Invalid subtitle provided to CustomHeader', 'CustomHeader', String(error));
      return "One step toward a better future";
    }
  }, [subtitle]);
  return (
    <View style={[styles.headerContainer, { paddingTop: getStatusBarHeight() + 12 }]}>
      <View style={styles.leftSection}>
        <Animated.View style={styles.logoContainer}>
          <View style={styles.bubbleBackground}>
            <GoBangladeshLogo
              size={42}
              style={styles.logo}
              color1={COLORS.brand.orange}
              color2={COLORS.brand.blue}
            />
          </View>
        </Animated.View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{sanitizedTitle}</Text>
          <Text style={styles.subtitleText}>{sanitizedSubtitle}</Text>
        </View>
      </View>

      {/* Right Section - Notification Bell and Profile */}
      <View style={styles.rightSection}>
        {/* Notification Bell */}
        {showNotificationBell && onNotificationPress && (
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={onNotificationPress}
          >
            <Ionicons name="notifications" size={24} color={COLORS.white} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text variant="caption" color={COLORS.white} style={styles.badgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Profile Section */}
        {user && onProfilePress && (
          <TouchableOpacity
            style={styles.profileSection}
            onPress={onProfilePress}
          >
            <View style={styles.avatar}>
              {user?.imageUrl ? (
                <Image
                  source={{ uri: `${API_BASE_URL}/${user.imageUrl}` }}
                  style={styles.avatarImage}
                />
              ) : user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text
                    variant="bodyLarge"
                    color={COLORS.primary}
                    style={styles.avatarText}
                  >
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});
const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.brand.blue,
    paddingHorizontal: 16,
    paddingBottom: 12, // Only bottom padding, top padding handled dynamically
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    marginRight: 12,
  },
  bubbleBackground: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ecececec",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    // Additional logo styling if needed
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    color: COLORS.white,
    fontSize: 18,
  },
  subtitleText: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
    lineHeight: 16,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 14,
  },
  profileSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: COLORS.gray[100] + "80",
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

