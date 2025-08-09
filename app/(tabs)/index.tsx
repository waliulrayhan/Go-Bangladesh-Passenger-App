import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Text } from "../../components/ui/Text";
import { useRealtimeTrip } from "../../hooks/useRealtimeTrip";
import { useTokenRefresh } from "../../hooks/useTokenRefresh";
import { useAuthStore } from "../../stores/authStore";
import { useCardStore } from "../../stores/cardStore";
import { API_BASE_URL, COLORS } from "../../utils/constants";

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    card,
    loadCardDetails,
    isLoading,
    tripStatus,
    currentTrip,
    tripTransactions,
    rechargeTransactions,
    loadTripHistory,
    loadRechargeHistory,
    checkOngoingTrip,
    forceTapOut,
    forceRefreshData,
  } = useCardStore();

  // Use token refresh hook to get fresh data
  const { refreshAllData } = useTokenRefresh();

  // Real-time trip monitoring
  const {
    isPolling,
    checkNow: checkTripNow,
    restartPolling
  } = useRealtimeTrip({
    interval: tripStatus === 'active' ? 15000 : 30000, // 15s active, 30s idle
    enabled: true,
    onlyWhenActive: true,
    onTripStatusChange: (status, trip) => {
      if (status === 'active' && trip) {
        console.log('🚌 [DASHBOARD] Trip started:', trip.busName);
      } else if (status === 'idle') {
        console.log('🏁 [DASHBOARD] Trip ended');
      }
    }
  });

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation for pulse effect - moved to top level
  const pulseAnimation = useSharedValue(0);

  // Track if data has been loaded to prevent unnecessary API calls
  const [hasLoadedData, setHasLoadedData] = useState(false);

  useEffect(() => {
    // Only load data if we have a user and haven't loaded data yet
    if (user && !hasLoadedData) {
      loadCardDetails();
      loadTripHistory(1, true); // Load recent transactions
      loadRechargeHistory(1, true);
      checkOngoingTrip();
      setHasLoadedData(true);
    }
  }, [user, hasLoadedData]);

  // Handle pull-to-refresh - only refresh when user explicitly pulls
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Use force refresh to ensure fresh data
      await forceRefreshData();
      await refreshAllData(true); // Force refresh regardless of timing
      
      // Force check trip status immediately after refresh
      await checkTripNow();
      
      // Restart real-time polling to ensure fresh intervals
      restartPolling();
      
      setHasLoadedData(true); // Mark as loaded after refresh
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Start pulse animation when trip is active
  useEffect(() => {
    if (tripStatus === "active") {
      pulseAnimation.value = withRepeat(
        withTiming(1, { duration: 1500 }),
        -1,
        true
      );
    } else {
      pulseAnimation.value = 0;
    }
  }, [tripStatus]);

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, 1.2]);
    const opacity = interpolate(pulseAnimation.value, [0, 1], [0.8, 0.3]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const dotPulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, 1.4]);
    const opacity = interpolate(pulseAnimation.value, [0, 1], [1, 0.6]);

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const handleProfilePress = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const formatDate = (date: Date) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleViewAllPress = () => {
    router.push("/(tabs)/history");
  };
  const renderHeader = () => (
    <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
      {/* Status Bar Area - Same color as header */}
      <View style={styles.statusBarArea} />

      {/* Main Header Content */}
      <View style={styles.headerContent}>
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <Image
                source={require("../../assets/images/appIconPng1024_lg.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>
          <View style={styles.brandTextContainer}>
            <Text variant="h6" color={COLORS.white} style={styles.brandName}>
              Go Bangladesh
            </Text>
            <Text
              variant="caption"
              color={COLORS.white}
              style={styles.brandSlogan}
            >
              One step toward a better future
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => router.push("/(tabs)/profile")}
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
      </View>

      {/* Profile Menu */}
      {showProfileMenu && (
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={styles.profileMenu}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            <Text
              variant="bodySmall"
              color={COLORS.primary}
              style={styles.menuText}
            >
              View Profile
            </Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            <Text
              variant="bodySmall"
              color={COLORS.error}
              style={styles.menuText}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );

  const renderRFIDCard = () => (
    <Animated.View
      entering={FadeInDown.duration(800).delay(300)}
      style={styles.cardContainer}
    >
      <LinearGradient
        colors={["#4A90E2", "#7BB3F0", "#FF8A00"]}
        locations={[0, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Top Section - Card holder name, user type & RFID icon */}
        <View style={styles.cardTopSection}>
          <View style={styles.cardHolderInfo}>
            <Text
              variant="bodySmall"
              color={COLORS.white}
              style={styles.cardHolderName}
              numberOfLines={1}
            >
              {user?.name?.toUpperCase() || "Not Provided"}
            </Text>
            <Text
              variant="caption"
              color={COLORS.white}
              style={styles.cardUserType}
            >
              {user?.userType?.toUpperCase() + " USER" || "N/A"}
            </Text>
          </View>
          <View style={styles.rfidIconContainer}>
            <Ionicons
              name="radio"
              size={18}
              color={COLORS.white}
              style={styles.rfidIcon}
            />
          </View>
        </View>

        {/* Middle Section - Card Number */}
        <View style={styles.cardNumberSection}>
          <Text variant="h4" color={COLORS.white} style={styles.cardNumber}>
            {user?.cardNumber || card?.cardNumber || "Not Available"}
          </Text>
        </View>

        {/* Center Section - Available Balance */}
        <View style={styles.balanceSection}>
          <Text
            variant="caption"
            color={COLORS.white}
            style={styles.balanceLabel}
          >
            Available Balance
          </Text>
          <Text variant="h2" color={COLORS.white} style={styles.balance}>
            {typeof user?.balance === "number"
              ? user.balance.toFixed(2) + " BDT"
              : card?.balance?.toFixed(2) + " BDT" || "N/A"}
            {/* ৳ */}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
  const renderTripStatus = () => {
    if (!currentTrip || tripStatus !== "active") {
      return null;
    }

    const handleForceTapOut = () => {
      const penaltyAmount = currentTrip?.penaltyAmount || 0;

      Alert.alert(
        "Force Tap Out",
        `Are you sure you want to force tap out? A penalty of ৳${penaltyAmount.toFixed(
          2
        )} will be charged.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Force Tap Out",
            style: "destructive",
            onPress: () => forceTapOut(),
          },
        ]
      );
    };

    return (
      <Animated.View
        entering={FadeInDown.duration(800).delay(200)}
        style={styles.tripContainer}
      >
        <View style={styles.tripCard}>
          {/* Pulse Animation Background */}
          <Animated.View style={[styles.pulseBackground, pulseStyle]} />

          {/* Compact Header */}
          <View style={styles.compactHeader}>
            <View style={styles.statusContainer}>
              <View style={styles.statusIndicator}>
                <Animated.View style={[styles.pulsingDot, dotPulseStyle]} />
              </View>
              <Text variant="bodySmall" style={styles.statusText}>
                Trip in Progress
              </Text>
            </View>
            <TouchableOpacity
              style={styles.tapOutButton}
              onPress={handleForceTapOut}
            >
              <Ionicons name="exit-outline" size={16} color={COLORS.white} />
              <Text variant="caption" style={styles.tapOutButtonText}>
                Tap Out
              </Text>
            </TouchableOpacity>
          </View>

          {/* Main Trip Content */}
          <View style={styles.tripContent}>
            {/* Bus - Prominent Display */}
            <View style={styles.busContainer}>
              <View style={styles.busHeader}>
                <Ionicons
                  name="bus"
                  size={16}
                  color={COLORS.brand.orange_light}
                />
                <Text variant="caption" style={styles.busLabel}>
                  BUS
                </Text>
              </View>
              <Text variant="h6" style={styles.busText} numberOfLines={1}>
                {currentTrip?.busNumber || "N/A"}
              </Text>
              <Text
                variant="caption"
                style={styles.busNumber}
                numberOfLines={1}
              >
                {currentTrip?.busName || "Bus Name Not Available!"}
              </Text>
            </View>

            {/* Route & Time Info - Bottom Row */}
            <View style={styles.bottomDetailsRow}>
              <View style={styles.bottomDetailItem}>
                <Ionicons name="navigate" size={14} color={COLORS.primary} />
                <View style={styles.bottomDetailInfo}>
                  <Text variant="caption" style={styles.bottomDetailLabel}>
                    ROUTE
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={styles.bottomDetailValue}
                    numberOfLines={2}
                  >
                    {currentTrip?.tripStartPlace || "N/A"}
                    <Text style={styles.routeArrowSmall}> ⇄ </Text>
                    {currentTrip?.tripEndPlace || "N/A"}
                  </Text>
                </View>
              </View>

              <View style={styles.bottomDetailDivider} />

              <View style={styles.bottomDetailItem}>
                <Ionicons name="time" size={14} color={COLORS.success} />
                <View style={styles.bottomDetailInfo}>
                  <Text variant="caption" style={styles.bottomDetailLabel}>
                    TRIP STARTED
                  </Text>
                  <Text variant="bodySmall" style={styles.bottomDetailValue}>
                    {currentTrip?.tripStartTime
                      ? new Date(
                          new Date(currentTrip.tripStartTime).getTime() +
                            6 * 60 * 60 * 1000
                        ).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        }) + " ,  " + new Date(
                          new Date(currentTrip.tripStartTime).getTime() +
                            6 * 60 * 60 * 1000
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderRecentActivity = () => {
    // Combine and sort both transaction types by date, then get the most recent 3
    const allTransactions = [...tripTransactions, ...rechargeTransactions]
      .sort((a, b) => {
        const aDate = new Date(
          a.createTime || (a as any).trip?.tripStartTime || 0
        );
        const bDate = new Date(
          b.createTime || (b as any).trip?.tripStartTime || 0
        );
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, 3);

    const getActivityIcon = (transactionType: string) => {
      if (transactionType === "BusFare") {
        return {
          icon: "arrow-up-outline" as const,
          color: COLORS.error,
          backgroundColor: COLORS.error + "20",
        };
      } else {
        return {
          icon: "arrow-down-outline" as const,
          color: COLORS.success,
          backgroundColor: COLORS.success + "20",
        };
      }
    };

    const getActivityTitle = (transactionType: string) => {
      return transactionType === "BusFare" ? "Bus Fare" : "Top Up";
    };

    const getActivityAmount = (transactionType: string, amount: number) => {
      const prefix = transactionType === "BusFare" ? "-" : "+";
      return `${prefix}৳${amount.toFixed(2)}`;
    };

    const getActivityColor = (transactionType: string) => {
      return transactionType === "BusFare" ? COLORS.error : COLORS.success;
    };

    return (
      <Animated.View
        entering={FadeInDown.duration(800).delay(600)}
        style={styles.recentActivity}
      >
        <View style={styles.sectionHeader}>
          <Text
            variant="h5"
            color={COLORS.secondary}
            style={styles.sectionTitle}
          >
            Recent Activity
          </Text>
          <TouchableOpacity onPress={handleViewAllPress}>
            <Text
              variant="bodySmall"
              color={COLORS.primary}
              style={styles.viewAllText}
            >
              View All
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {isLoading ? (
            // Show loading state while fetching data
            <View style={styles.emptyActivityContainer}>
              <View style={styles.emptyActivityIcon}>
                <Ionicons name="refresh" size={24} color={COLORS.gray[400]} />
              </View>
              <Text
                variant="body"
                color={COLORS.gray[500]}
                style={styles.emptyActivityTitle}
              >
                Loading activity...
              </Text>
              <Text
                variant="caption"
                color={COLORS.gray[400]}
                style={styles.emptyActivitySubtitle}
              >
                Fetching your latest transactions
              </Text>
            </View>
          ) : allTransactions.length > 0 ? (
            allTransactions.map((transaction: any, index: number) => {
              const iconInfo = getActivityIcon(transaction.transactionType);
              return (
                <View key={transaction.id} style={styles.activityItem}>
                  <View
                    style={[
                      styles.activityIcon,
                      { backgroundColor: iconInfo.backgroundColor },
                    ]}
                  >
                    <Ionicons
                      name={iconInfo.icon}
                      size={16}
                      color={iconInfo.color}
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text
                      variant="label"
                      color={COLORS.gray[900]}
                      style={styles.activityTitle}
                    >
                      {getActivityTitle(transaction.transactionType)}
                    </Text>
                    <Text
                      variant="caption"
                      color={COLORS.gray[500]}
                      style={styles.activityTime}
                    >
                      {formatDate(new Date(transaction.createTime))},{" "}
                      {new Date(transaction.createTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </Text>
                  </View>
                  <Text
                    variant="labelSmall"
                    color={getActivityColor(transaction.transactionType)}
                    style={styles.activityAmount}
                  >
                    {getActivityAmount(
                      transaction.transactionType,
                      transaction.amount
                    )}
                  </Text>
                </View>
              );
            })
          ) : (
            // Show empty state for new users (NO MOCK DATA)
            <View style={styles.emptyActivityContainer}>
              <View style={styles.emptyActivityIcon}>
                <Ionicons
                  name="receipt-outline"
                  size={24}
                  color={COLORS.gray[400]}
                />
              </View>
              <Text
                variant="body"
                color={COLORS.gray[500]}
                style={styles.emptyActivityTitle}
              >
                No recent activity
              </Text>
              <Text
                variant="caption"
                color={COLORS.gray[400]}
                style={styles.emptyActivitySubtitle}
              >
                Your transaction history will appear here once you start using
                your card
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };
  return (
    <>
      <StatusBar
        backgroundColor={COLORS.primary}
        barStyle="light-content"
        translucent={false}
      />
      <SafeAreaView style={styles.container}>
        {/* Dual Color Glow Background - Blue Top, Orange Bottom */}
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

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={() => setShowProfileMenu(false)}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderHeader()}
          {renderTripStatus()}
          {renderRFIDCard()}
          {renderRecentActivity()}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    position: "relative",
  },

  // Background Gradient Styles
  glowBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },

  content: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingBottom: 30,
  },

  // Header Styles - Modern Clean Design
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  statusBarArea: {
    height: 15, // iOS status bar height
    // backgroundColor: COLORS.primary, // Same color as header
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    marginRight: 12,
  },
  logoBackground: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: COLORS.white + "90",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 55,
    height: 55,
  },
  brandTextContainer: {
    flex: 1,
  },
  brandName: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  brandSlogan: {
    fontSize: 11,
    opacity: 0.85,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  profileSection: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
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

  // Profile Menu
  profileMenu: {
    position: "absolute",
    top: 75,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 140,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    marginLeft: 8,
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: 16,
    marginVertical: 4,
  },

  // Card Styles - VISA Style Blue Card
  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    minHeight: 180,
    elevation: 12,
    position: "relative",
    overflow: "hidden",
    marginTop: 16,
  },
  // Card styles for new layout
  cardTopSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardHolderInfo: {
    flex: 1,
  },
  cardHolderName: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 2,
    lineHeight: 16,
  },
  cardUserType: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.8,
    opacity: 0.8,
  },
  rfidIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    backgroundColor: COLORS.gray[900] + "15",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.white + "20",
  },
  rfidIcon: {
    opacity: 0.9,
  },
  cardNumberSection: {
    marginBottom: 24,
    alignItems: "center",
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: "400",
    letterSpacing: 2.5,
    fontFamily: "monospace",
    lineHeight: 24,
    textAlign: "center",
  },
  balanceSection: {
    alignItems: "center",
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 14,
    opacity: 0.85,
    marginBottom: 2,
    fontWeight: "600",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  balance: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 38,
    letterSpacing: -0.5,
    textAlign: "center",
  },

  // Trip Status Styles - Compact Design
  tripContainer: {
    marginHorizontal: 16,
    marginBottom: 5,
    marginTop: 15,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  tripCard: {
    padding: 12,
    position: "relative",
  },

  // Compact Header Styles
  compactHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success + "12",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.success + "20",
  },
  statusIndicator: {
    marginRight: 8,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.success,
  },
  tapOutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.error,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    elevation: 3,
    minHeight: 36,
  },
  tapOutButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // Trip Content Styles
  tripContent: {
    gap: 8,
  },

  // Bus Container - Prominent Display
  busContainer: {
    backgroundColor: COLORS.brand.orange_light + "08",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.brand.orange_light,
  },
  busHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  busLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.brand.orange_light,
    letterSpacing: 1,
  },
  busText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray[900],
    lineHeight: 20,
    marginBottom: 2,
  },
  busNumber: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.gray[600],
  },

  // Bottom Details Row - Route & Time
  bottomDetailsRow: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  bottomDetailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottomDetailInfo: {
    flex: 1,
  },
  bottomDetailDivider: {
    width: 1,
    height: 35,
    backgroundColor: COLORS.gray[200],
    marginHorizontal: 12,
  },
  bottomDetailLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.gray[600],
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bottomDetailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.gray[900],
    lineHeight: 16,
  },
  bottomDetailSubtext: {
    fontSize: 10,
    fontWeight: "500",
    color: COLORS.gray[500],
    marginTop: 1,
  },
  routeArrowSmall: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },

  // Pulse Animation Background - Improved
  pulseBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: COLORS.success + "08",
    zIndex: -1,
  },

  // Recent Activity Styles
  recentActivity: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: "600",
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 12,
  },
  activityList: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    opacity: 0.6,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Empty Activity State Styles
  emptyActivityContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyActivityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyActivityTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyActivitySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 240,
  },
});
