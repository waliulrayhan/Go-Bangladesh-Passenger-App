// React Native and Expo imports
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

// Reanimated imports for animations
import Animated, {
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// Custom components and utilities
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { Text } from "../../components/ui/Text";
import { Toast } from "../../components/ui/Toast";
import { useRealtimeTrip } from "../../hooks/useRealtimeTrip";
import { useToast } from "../../hooks/useToast";
import { useTokenRefresh } from "../../hooks/useTokenRefresh";
import { useAuthStore } from "../../stores/authStore";
import { useCardStore } from "../../stores/cardStore";
import { API_BASE_URL, COLORS } from "../../utils/constants";

// Dashboard configuration constants
const DASHBOARD_CONFIG = {
  ANIMATION_DELAYS: {
    HEADER: 800,
    TRIP_STATUS: 200,
    RFID_CARD: 300,
    RECENT_ACTIVITY: 600,
    PROFILE_MENU: 300,
  },
  POLLING_INTERVALS: {
    ACTIVE_TRIP: 15000,
    IDLE_TRIP: 30000,
  },
  BALANCE_AUTO_HIDE_DELAY: 4000,
  BALANCE_ANIMATION_DURATION: {
    SHOW: 500,
    HIDE: 300,
  },
  PULSE_ANIMATION_DURATION: 1500,
  LOADING_ANIMATION_DURATION: 1000,
  RECENT_TRANSACTIONS_LIMIT: 3,
} as const;

// UI text constants
const UI_TEXTS = {
  BRAND: {
    NAME: "Go Bangladesh",
    SLOGAN: "One step toward a better future",
  },
  CARD_LABELS: {
    AVAILABLE_BALANCE: "Available Balance",
    SHOW_BALANCE: "Show Balance",
    LOADING: "Loading...",
    CARD_TYPES: {
      PRIVATE: "PRIVATE CARD",
      PUBLIC: "PUBLIC CARD",
      NORMAL: "NORMAL CARD",
    },
  },
  TRIP_STATUS: {
    IN_PROGRESS: "Trip in Progress",
    TAP_OUT: "Tap Out",
    FORCE_TAP_OUT_TITLE: "Confirm Force Tap Out",
    FORCE_TAP_OUT_MESSAGE:
      "Are you sure you want to force tap out of this trip?",
    ROUTE_SEPARATOR: " ⇄ ",
  },
  ACTIVITY: {
    SECTION_TITLE: "Recent Activity",
    VIEW_ALL: "View All",
    BUS_FARE: "Bus Fare",
    TOP_UP: "Top Up",
    LOADING: "Loading activity...",
    LOADING_SUBTITLE: "Fetching your latest transactions",
    EMPTY_TITLE: "No recent activity",
    EMPTY_SUBTITLE:
      "Your transaction history will appear here once you start using your card",
    LABELS: {
      BUS: "BUS",
      ROUTE: "ROUTE",
      TRIP_STARTED: "TRIP STARTED",
    },
  },
  FALLBACKS: {
    NAME: "Not Provided",
    CARD_NUMBER: "Not Available",
    BALANCE: "N/A",
    BUS_NAME: "Bus Name Not Available!",
    GENERIC: "N/A",
  },
} as const;

// Utility functions
const formatDateString = (date: Date): string => {
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

const formatTimeString = (date: Date): string => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatBalanceDisplay = (balance: number | undefined): string => {
  return typeof balance === "number"
    ? `৳ ${balance.toFixed(2)}`
    : UI_TEXTS.FALLBACKS.BALANCE;
};

const getCardTypeLabel = (userType: string | undefined): string => {
  switch (userType) {
    case "private":
      return UI_TEXTS.CARD_LABELS.CARD_TYPES.PRIVATE;
    case "public":
      return UI_TEXTS.CARD_LABELS.CARD_TYPES.PUBLIC;
    default:
      return UI_TEXTS.CARD_LABELS.CARD_TYPES.NORMAL;
  }
};

const adjustTimeForTimezone = (dateString: string): Date => {
  return new Date(new Date(dateString).getTime() + 6 * 60 * 60 * 1000);
};

/**
 * Dashboard Component - Main passenger app screen
 * Displays RFID card, trip status, balance, and recent activity
 */
export default function Dashboard() {
  // Navigation and store hooks
  const router = useRouter();
  const { user, logout, justLoggedIn, clearJustLoggedIn } = useAuthStore();
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

  // Token refresh for maintaining session
  const { refreshAllData } = useTokenRefresh();

  // Toast hook for notifications
  const { toast, showSuccess, hideToast } = useToast();

  // Real-time trip monitoring with dynamic intervals
  const {
    checkNow: checkTripNow,
    restartPolling,
    stopPolling,
  } = useRealtimeTrip({
    interval:
      tripStatus === "active"
        ? DASHBOARD_CONFIG.POLLING_INTERVALS.ACTIVE_TRIP
        : DASHBOARD_CONFIG.POLLING_INTERVALS.IDLE_TRIP,
    enabled: true,
    onlyWhenActive: true,
    onTripStatusChange: (status, trip) => {
      if (status === "active" && trip) {
        console.log("🚌 [DASHBOARD] Trip started:", trip.busName);
      } else if (status === "idle") {
        console.log("🏁 [DASHBOARD] Trip ended");
      }
    },
  });

  // Component state management
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTapOutConfirmation, setShowTapOutConfirmation] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Animation shared values
  const pulseAnimation = useSharedValue(0); // For trip status pulse effect
  const balanceAnimation = useSharedValue(0); // For balance show/hide animation
  const loadingAnimation = useSharedValue(0); // For loading icon rotation

  // Handle login success message
  useEffect(() => {
    if (justLoggedIn) {
      showSuccess("Your login is successful!");
      clearJustLoggedIn();
    }
  }, [justLoggedIn, showSuccess, clearJustLoggedIn]);

  // Initialize loading animation when balance is being fetched
  useEffect(() => {
    if (isLoadingBalance) {
      loadingAnimation.value = withRepeat(
        withTiming(1, {
          duration: DASHBOARD_CONFIG.LOADING_ANIMATION_DURATION,
        }),
        -1,
        false
      );
    } else {
      loadingAnimation.value = 0;
    }
  }, [isLoadingBalance]);

  // Load initial data when user is available
  useEffect(() => {
    if (user && !hasLoadedData) {
      loadCardDetails();
      loadTripHistory(1, true);
      loadRechargeHistory(1, true);
      checkOngoingTrip();
      setHasLoadedData(true);
    }
  }, [user, hasLoadedData]);

  // Handle pulse animation for active trips
  useEffect(() => {
    if (tripStatus === "active") {
      pulseAnimation.value = withRepeat(
        withTiming(1, { duration: DASHBOARD_CONFIG.PULSE_ANIMATION_DURATION }),
        -1,
        true
      );
    } else {
      pulseAnimation.value = 0;
      setShowTapOutConfirmation(false);
    }
  }, [tripStatus]);

  // Handle balance visibility animation
  useEffect(() => {
    if (showBalance) {
      balanceAnimation.value = withTiming(1, {
        duration: DASHBOARD_CONFIG.BALANCE_ANIMATION_DURATION.SHOW,
      });
    } else {
      balanceAnimation.value = withTiming(0, {
        duration: DASHBOARD_CONFIG.BALANCE_ANIMATION_DURATION.HIDE,
      });
    }
  }, [showBalance]);

  // Pull-to-refresh handler (lightweight)
  const onRefresh = async () => {
    setRefreshing(true);

    // Temporarily pause realtime polling during refresh
    stopPolling();

    try {
      // Only refresh essential data - no redundant API calls
      await Promise.all([
        useAuthStore.getState().refreshBalance(), // Just balance
        checkOngoingTrip(), // Just ongoing trip status
      ]);

      setHasLoadedData(true);
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);

      // Resume realtime polling after refresh
      setTimeout(() => {
        restartPolling();
      }, 500);
    }
  };

  // Animated style definitions
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

  const balanceSlideStyle = useAnimatedStyle(() => {
    const opacity = interpolate(balanceAnimation.value, [0, 1], [0, 1]);
    const scale = interpolate(balanceAnimation.value, [0, 1], [0.9, 1]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const hiddenBalanceStyle = useAnimatedStyle(() => {
    const opacity = interpolate(balanceAnimation.value, [0, 1], [1, 0]);
    const scale = interpolate(balanceAnimation.value, [0, 1], [1, 0.9]);
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const loadingRotationStyle = useAnimatedStyle(() => {
    const rotation = interpolate(loadingAnimation.value, [0, 1], [0, 360]);
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  // Event handlers
  const handleProfileMenuToggle = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const navigateToProfile = () => {
    router.push("/(tabs)/profile");
  };

  const navigateToHistory = () => {
    router.push("/(tabs)/history");
  };

  const handleForceTapOut = () => {
    setShowTapOutConfirmation(true);
  };

  const confirmForceTapOut = () => {
    setShowTapOutConfirmation(false);
    forceTapOut();
  };

  const cancelForceTapOut = () => {
    setShowTapOutConfirmation(false);
  };

  const handleLogout = () => {
    logout();
  };

  // Balance visibility toggle with loading and auto-hide
  const toggleBalanceVisibility = async () => {
    if (!showBalance) {
      setIsLoadingBalance(true);

      // Temporarily pause realtime polling during balance fetch
      stopPolling();

      try {
        // Only refresh the balance - no excessive API calls
        await useAuthStore.getState().refreshBalance();
        setShowBalance(true);

        // Auto-hide balance after configured delay
        setTimeout(() => {
          setShowBalance(false);
        }, DASHBOARD_CONFIG.BALANCE_AUTO_HIDE_DELAY);
      } catch (error) {
        console.error("Error fetching fresh balance:", error);
      } finally {
        setIsLoadingBalance(false);

        // Resume realtime polling after a short delay
        setTimeout(() => {
          restartPolling();
        }, 1000);
      }
    } else {
      setShowBalance(false);
    }
  };

  // Render functions
  /**
   * Renders the main header with branding, logo, and profile access
   */
  const renderHeader = () => (
    <Animated.View
      entering={FadeInUp.duration(DASHBOARD_CONFIG.ANIMATION_DELAYS.HEADER)}
      style={styles.header}
    >
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
              {UI_TEXTS.BRAND.NAME}
            </Text>
            <Text
              variant="caption"
              color={COLORS.white}
              style={styles.brandSlogan}
            >
              {UI_TEXTS.BRAND.SLOGAN}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.profileSection}
          onPress={navigateToProfile}
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
          entering={FadeInDown.duration(
            DASHBOARD_CONFIG.ANIMATION_DELAYS.PROFILE_MENU
          )}
          style={styles.profileMenu}
        >
          <TouchableOpacity style={styles.menuItem} onPress={navigateToProfile}>
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
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
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

  /**
   * Renders the RFID card with balance visibility toggle
   */
  const renderRFIDCard = () => (
    <Animated.View
      entering={FadeInDown.duration(
        DASHBOARD_CONFIG.ANIMATION_DELAYS.RFID_CARD
      ).delay(DASHBOARD_CONFIG.ANIMATION_DELAYS.RFID_CARD)}
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
              {user?.name?.toUpperCase() || UI_TEXTS.FALLBACKS.NAME}
            </Text>
            <Text
              variant="caption"
              color={COLORS.white}
              style={styles.cardUserType}
            >
              {getCardTypeLabel(user?.userType)}
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
            {user?.cardNumber ||
              card?.cardNumber ||
              UI_TEXTS.FALLBACKS.CARD_NUMBER}
          </Text>
        </View>

        {/* Center Section - Available Balance */}
        <View style={styles.balanceSection}>
          <Text
            variant="caption"
            color={COLORS.white}
            style={styles.balanceLabel}
          >
            {UI_TEXTS.CARD_LABELS.AVAILABLE_BALANCE}
          </Text>

          <View style={styles.balanceContainer}>
            {!showBalance ? (
              // Show Balance Button
              <Animated.View
                style={[styles.showBalanceContainer, hiddenBalanceStyle]}
              >
                <TouchableOpacity
                  style={styles.showBalanceButton}
                  onPress={toggleBalanceVisibility}
                  activeOpacity={0.8}
                  disabled={isLoadingBalance}
                >
                  {isLoadingBalance ? (
                    <View style={styles.loadingContainer}>
                      <Animated.View style={loadingRotationStyle}>
                        <Ionicons
                          name="refresh"
                          size={18}
                          color={COLORS.white}
                        />
                      </Animated.View>
                      <Text variant="bodySmall" style={styles.showBalanceText}>
                        {UI_TEXTS.CARD_LABELS.LOADING}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons
                        name="eye-outline"
                        size={18}
                        color={COLORS.white}
                      />
                      <Text variant="bodySmall" style={styles.showBalanceText}>
                        {UI_TEXTS.CARD_LABELS.SHOW_BALANCE}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ) : (
              // Balance Display (No Hide Button)
              <Animated.View
                style={[styles.balanceDisplayContainer, balanceSlideStyle]}
              >
                <Text variant="h2" color={COLORS.white} style={styles.balance}>
                  {formatBalanceDisplay(user?.balance || card?.balance)}
                </Text>
              </Animated.View>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  /**
   * Renders trip status when user has an active trip
   */
  const renderTripStatus = () => {
    if (!currentTrip || tripStatus !== "active") {
      return null;
    }

    return (
      <Animated.View
        entering={FadeInDown.duration(
          DASHBOARD_CONFIG.ANIMATION_DELAYS.HEADER
        ).delay(DASHBOARD_CONFIG.ANIMATION_DELAYS.TRIP_STATUS)}
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
                {UI_TEXTS.TRIP_STATUS.IN_PROGRESS}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.tapOutButton}
              onPress={handleForceTapOut}
            >
              <Ionicons name="exit-outline" size={16} color={COLORS.white} />
              <Text variant="caption" style={styles.tapOutButtonText}>
                {UI_TEXTS.TRIP_STATUS.TAP_OUT}
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
                  {UI_TEXTS.ACTIVITY.LABELS.BUS}
                </Text>
              </View>
              <Text variant="h6" style={styles.busText} numberOfLines={1}>
                {currentTrip?.busNumber || UI_TEXTS.FALLBACKS.GENERIC}
              </Text>
              <Text
                variant="caption"
                style={styles.busNumber}
                numberOfLines={1}
              >
                {currentTrip?.busName || UI_TEXTS.FALLBACKS.BUS_NAME}
              </Text>
            </View>

            {/* Route & Time Info - Bottom Row */}
            <View style={styles.bottomDetailsRow}>
              <View style={styles.bottomDetailItem}>
                <Ionicons name="navigate" size={14} color={COLORS.primary} />
                <View style={styles.bottomDetailInfo}>
                  <Text variant="caption" style={styles.bottomDetailLabel}>
                    {UI_TEXTS.ACTIVITY.LABELS.ROUTE}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={styles.bottomDetailValue}
                    numberOfLines={2}
                  >
                    {currentTrip?.tripStartPlace || UI_TEXTS.FALLBACKS.GENERIC}
                    <Text style={styles.routeArrowSmall}>
                      {UI_TEXTS.TRIP_STATUS.ROUTE_SEPARATOR}
                    </Text>
                    {currentTrip?.tripEndPlace || UI_TEXTS.FALLBACKS.GENERIC}
                  </Text>
                </View>
              </View>

              <View style={styles.bottomDetailDivider} />

              <View style={styles.bottomDetailItem}>
                <Ionicons name="time" size={14} color={COLORS.success} />
                <View style={styles.bottomDetailInfo}>
                  <Text variant="caption" style={styles.bottomDetailLabel}>
                    {UI_TEXTS.ACTIVITY.LABELS.TRIP_STARTED}
                  </Text>
                  <Text variant="bodySmall" style={styles.bottomDetailValue}>
                    {currentTrip?.tripStartTime
                      ? (() => {
                          const adjustedDate = adjustTimeForTimezone(
                            currentTrip.tripStartTime
                          );
                          return `${formatTimeString(
                            adjustedDate
                          )} , ${adjustedDate.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}`;
                        })()
                      : UI_TEXTS.FALLBACKS.GENERIC}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Activity helper functions
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
    return transactionType === "BusFare"
      ? UI_TEXTS.ACTIVITY.BUS_FARE
      : UI_TEXTS.ACTIVITY.TOP_UP;
  };

  const getActivityAmount = (transactionType: string, amount: number) => {
    const prefix = transactionType === "BusFare" ? "-" : "+";
    return `${prefix}৳${amount.toFixed(2)}`;
  };

  const getActivityColor = (transactionType: string) => {
    return transactionType === "BusFare" ? COLORS.error : COLORS.success;
  };

  const getCombinedTransactions = () => {
    return [...tripTransactions, ...rechargeTransactions]
      .sort((a, b) => {
        const aDate = new Date(
          a.createTime || (a as any).trip?.tripStartTime || 0
        );
        const bDate = new Date(
          b.createTime || (b as any).trip?.tripStartTime || 0
        );
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, DASHBOARD_CONFIG.RECENT_TRANSACTIONS_LIMIT);
  };

  /**
   * Renders recent activity section with transactions history
   */
  const renderRecentActivity = () => {
    const allTransactions = getCombinedTransactions();

    return (
      <Animated.View
        entering={FadeInDown.duration(
          DASHBOARD_CONFIG.ANIMATION_DELAYS.HEADER
        ).delay(DASHBOARD_CONFIG.ANIMATION_DELAYS.RECENT_ACTIVITY)}
        style={styles.recentActivity}
      >
        <View style={styles.sectionHeader}>
          <Text
            variant="h5"
            color={COLORS.secondary}
            style={styles.sectionTitle}
          >
            {UI_TEXTS.ACTIVITY.SECTION_TITLE}
          </Text>
          <TouchableOpacity onPress={navigateToHistory}>
            <Text
              variant="bodySmall"
              color={COLORS.primary}
              style={styles.viewAllText}
            >
              {UI_TEXTS.ACTIVITY.VIEW_ALL}
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
                {UI_TEXTS.ACTIVITY.LOADING}
              </Text>
              <Text
                variant="caption"
                color={COLORS.gray[400]}
                style={styles.emptyActivitySubtitle}
              >
                {UI_TEXTS.ACTIVITY.LOADING_SUBTITLE}
              </Text>
            </View>
          ) : allTransactions.length > 0 ? (
            allTransactions.map((transaction: any, index: number) => {
              const iconInfo = getActivityIcon(transaction.transactionType);
              const transactionDate = new Date(transaction.createTime);

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
                      {formatDateString(transactionDate)},{" "}
                      {formatTimeString(transactionDate)}
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
                {UI_TEXTS.ACTIVITY.EMPTY_TITLE}
              </Text>
              <Text
                variant="caption"
                color={COLORS.gray[400]}
                style={styles.emptyActivitySubtitle}
              >
                {UI_TEXTS.ACTIVITY.EMPTY_SUBTITLE}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  // Main component render
  return (
    <>
      {/* Status bar configuration */}
      <StatusBar
        backgroundColor={COLORS.primary}
        barStyle="light-content"
        translucent={false}
      />

      <SafeAreaView style={styles.container}>
        {/* Background gradient overlay */}
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

        {/* Main scrollable content */}
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

        {/* Force tap out confirmation modal */}
        <ConfirmationModal
          visible={showTapOutConfirmation}
          title={UI_TEXTS.TRIP_STATUS.FORCE_TAP_OUT_TITLE}
          message={UI_TEXTS.TRIP_STATUS.FORCE_TAP_OUT_MESSAGE}
          confirmText={UI_TEXTS.TRIP_STATUS.TAP_OUT}
          cancelText="Cancel"
          confirmButtonColor={COLORS.error}
          icon="exit-outline"
          iconColor={COLORS.error}
          onConfirm={confirmForceTapOut}
          onCancel={cancelForceTapOut}
          showTripDetails={true}
          busNumber={currentTrip?.busNumber || currentTrip?.busName}
          route={
            currentTrip?.tripStartPlace && currentTrip?.tripEndPlace
              ? `${currentTrip.tripStartPlace}${UI_TEXTS.TRIP_STATUS.ROUTE_SEPARATOR}${currentTrip.tripEndPlace}`
              : undefined
          }
          penaltyAmount={currentTrip?.penaltyAmount || 0}
        />

        {/* Toast notification */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
          position="top"
        />
      </SafeAreaView>
    </>
  );
}

/**
 * Stylesheet definitions organized by component sections
 */
const styles = StyleSheet.create({
  // Container and background styles
  container: {
    flex: 1,
    backgroundColor: "transparent",
    position: "relative",
  },
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

  // Header styles
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
    minHeight: 60,
    justifyContent: "center",
  },
  balanceLabel: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: "600",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  balanceContainer: {
    width: "100%",
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  showBalanceContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  balanceDisplayContainer: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
  },
  balance: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 38,
    letterSpacing: -0.5,
    textAlign: "center",
  },
  showBalanceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  showBalanceText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  // Trip status styles
  tripContainer: {
    marginHorizontal: 16,
    marginBottom: 5,
    marginTop: 15,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
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

  // Recent activity styles
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

  // Empty state styles
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
