// React Native and Expo imports
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  FlatList,
  Linking,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// Custom components and utilities
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { RechargeTransaction, TripTransaction } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { useCardStore } from "../../stores/cardStore";
import { COLORS, SPACING } from "../../utils/constants";
import { formatDate, TimeFormatter } from "../../utils/dateTime";
import { TYPOGRAPHY } from "../../utils/fonts";

// UI text constants
const UI_TEXTS = {
  TABS: {
    TRIPS: "Trip History",
    WALLET: "Wallet History",
  },
  SEARCH: {
    TRIPS_PLACEHOLDER: "Search trips...",
    WALLET_PLACEHOLDER: "Search wallet history...",
  },
  TRANSACTION_TYPES: {
    RECHARGE: "Recharge",
    RETURN: "Return",
    BUS_FARE: "Bus Fare",
  },
  BUTTONS: {
    RETRY: "Retry",
    LOAD_MORE_TRIPS: "Load More Trips",
    LOAD_MORE_TRANSACTIONS: "Load More Transactions",
  },
  LOADING_STATES: {
    LOADING_HISTORY: "Loading history...",
    LOADING_MORE_TRIPS: "Loading more trips...",
    LOADING_MORE_TRANSACTIONS: "Loading more transactions...",
  },
  EMPTY_STATES: {
    NO_TRIP_HISTORY: "No trip history found",
    NO_WALLET_HISTORY: "No wallet history found",
    NO_RESULTS_FOR: "No results found for",
    BUS_TRIPS_WILL_APPEAR: "Your bus trips will appear here",
    WALLET_HISTORY_WILL_APPEAR: "Your wallet history will appear here",
  },
  TOAST_MESSAGES: {
    REFRESH_FAILED: "Failed to refresh data. Please try again.",
    LOAD_MORE_FAILED: "Failed to load more data. Please try again.",
    TRANSACTION_ID_COPIED: "Transaction ID copied to clipboard",
    COPY_FAILED: "Failed to copy transaction ID",
  },
  TAP_TYPES: {
    CARD: "Card",
    TIME_OUT: "Time-Out",
    STAFF: "Staff",
    SESSION_OUT: "Session-Out",
    MOBILE_APP: "Mobile App",
    PENALTY: "Penalty",
  },
  FALLBACKS: {
    NOT_AVAILABLE: "N/A",
    UNKNOWN_AGENT: "Unknown Agent",
    ORGANIZATION_INFO: "Organization Info",
  },
  LABELS: {
    TAP_IN: "Tap In",
    TAP_OUT: "Tap Out",
    DISTANCE: "Distance",
    TAP_IN_BY: "Tap In By",
    TAP_OUT_BY: "Tap Out By",
    BY: "by",
  },
} as const;

const openMapLocation = (latitude: number, longitude: number): void => {
  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  Linking.openURL(url);
};

const openRouteMap = (
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): void => {
  const url = `https://www.google.com/maps/dir/${startLat},${startLng}/${endLat},${endLng}`;
  Linking.openURL(url);
};

const getTapTypeColor = (tapType: string): string => {
  switch (tapType) {
    case UI_TEXTS.TAP_TYPES.CARD:
      return "#1976D2";
    case UI_TEXTS.TAP_TYPES.TIME_OUT:
      return "#F57C00";
    case UI_TEXTS.TAP_TYPES.STAFF:
      return "#388E3C";
    case UI_TEXTS.TAP_TYPES.SESSION_OUT:
      return "#D32F2F";
    case UI_TEXTS.TAP_TYPES.MOBILE_APP:
      return "#7B1FA2";
    case UI_TEXTS.TAP_TYPES.PENALTY:
      return "#E65100";
    default:
      return COLORS.gray[500];
  }
};

const getTapTypeIcon = (tapType: string): any => {
  switch (tapType) {
    case UI_TEXTS.TAP_TYPES.CARD:
      return "card-outline";
    case UI_TEXTS.TAP_TYPES.TIME_OUT:
      return "time-outline";
    case UI_TEXTS.TAP_TYPES.STAFF:
      return "person-circle-outline";
    case UI_TEXTS.TAP_TYPES.SESSION_OUT:
      return "exit-outline";
    case UI_TEXTS.TAP_TYPES.MOBILE_APP:
      return "phone-portrait-outline";
    case UI_TEXTS.TAP_TYPES.PENALTY:
      return "warning-outline";
    default:
      return "help-circle-outline";
  }
};

// Type definitions
type HistoryTab = "trips" | "recharge";

/**
 * History Component - Displays trip and wallet transaction history
 * with filtering, searching, and pagination capabilities
 */
export default function History() {
  // Selective store subscriptions to prevent unnecessary re-renders
  const tripTransactions = useCardStore((state) => state.tripTransactions);
  const rechargeTransactions = useCardStore(
    (state) => state.rechargeTransactions
  );
  const tripPagination = useCardStore((state) => state.tripPagination);
  const rechargePagination = useCardStore((state) => state.rechargePagination);
  const isLoading = useCardStore((state) => state.isLoading);
  const isRefreshing = useCardStore((state) => state.isRefreshing);
  const error = useCardStore((state) => state.error);

  // Store actions (these are stable and won't cause re-renders)
  const loadAllHistory = useCardStore((state) => state.loadAllHistory);
  const loadMoreTripHistory = useCardStore(
    (state) => state.loadMoreTripHistory
  );
  const loadMoreRechargeHistory = useCardStore(
    (state) => state.loadMoreRechargeHistory
  );

  // Custom hooks
  const { toast, showToast, hideToast } = useToast();

  // Get auth state to ensure user is authenticated before loading data
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Component state management
  const [activeTab, setActiveTab] = useState<HistoryTab>("trips");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and sort data whenever dependencies change
  // Using useMemo to prevent unnecessary recalculations
  const filteredData = useMemo(() => {
    let data: (TripTransaction | RechargeTransaction)[] =
      activeTab === "trips" ? tripTransactions : rechargeTransactions;

    // Apply search filter
    if (searchQuery.trim()) {
      data = data.filter((item) => {
        const searchLower = searchQuery.toLowerCase();
        const amount = item.amount.toString();

        if (activeTab === "trips") {
          const tripItem = item as TripTransaction;
          const busName = tripItem.trip?.session?.bus?.busName || "";
          const busNumber = tripItem.trip?.session?.bus?.busNumber || "";
          const sessionCode = tripItem.trip?.session?.sessionCode || "";

          return (
            busName.toLowerCase().includes(searchLower) ||
            busNumber.toLowerCase().includes(searchLower) ||
            sessionCode.toLowerCase().includes(searchLower) ||
            amount.includes(searchQuery)
          );
        } else {
          const rechargeItem = item as RechargeTransaction;
          const agentName = rechargeItem.agent?.name || "";
          const orgName = rechargeItem.agent?.organization?.name || "";

          return (
            agentName.toLowerCase().includes(searchLower) ||
            orgName.toLowerCase().includes(searchLower) ||
            amount.includes(searchQuery)
          );
        }
      });
    }

    // Apply default sorting (newest first)
    data.sort((a, b) => {
      const aDateString =
        activeTab === "trips"
          ? (a as TripTransaction).trip?.tripStartTime
          : a.createTime;
      const bDateString =
        activeTab === "trips"
          ? (b as TripTransaction).trip?.tripStartTime
          : b.createTime;
      if (!aDateString || !bDateString) return 0;

      const aDate = new Date(aDateString);
      const bDate = new Date(bDateString);

      return bDate.getTime() - aDate.getTime();
    });

    return data;
  }, [tripTransactions, rechargeTransactions, activeTab, searchQuery]);

  // Effects

  // Load data when tab comes into focus and user is authenticated
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        // Use the unified load function for better state management
        loadAllHistory(true);
      }
    }, [isAuthenticated, loadAllHistory])
  );

  // Event handlers

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    try {
      await loadAllHistory(true);
    } catch (error) {
      showToast(UI_TEXTS.TOAST_MESSAGES.REFRESH_FAILED, "error");
    }
  }, [loadAllHistory, showToast]);

  // Handle tab switching
  const handleTabChange = (tab: HistoryTab) => {
    setActiveTab(tab);
  };

  // Load more data with error handling
  const onLoadMore = useCallback(async () => {
    const currentPagination =
      activeTab === "trips" ? tripPagination : rechargePagination;
    const loadMoreFunction =
      activeTab === "trips" ? loadMoreTripHistory : loadMoreRechargeHistory;

    if (currentPagination.hasMore && !currentPagination.isLoadingMore) {
      try {
        await loadMoreFunction();
      } catch (error) {
        showToast(UI_TEXTS.TOAST_MESSAGES.LOAD_MORE_FAILED, "error");
      }
    }
  }, [
    activeTab,
    tripPagination.hasMore,
    tripPagination.isLoadingMore,
    rechargePagination.hasMore,
    rechargePagination.isLoadingMore,
    loadMoreTripHistory,
    loadMoreRechargeHistory,
    showToast,
  ]);

  // Copy transaction ID to clipboard with toast feedback
  const copyTransactionId = async (transactionId: string): Promise<void> => {
    try {
      await Clipboard.setString(transactionId);
      showToast(UI_TEXTS.TOAST_MESSAGES.TRANSACTION_ID_COPIED, "success");
    } catch (error) {
      showToast(UI_TEXTS.TOAST_MESSAGES.COPY_FAILED, "error");
    }
  };

  // Render individual trip transaction item
  const renderTripItem = ({ item }: { item: TripTransaction }) => {
    const trip = item.trip;
    const transactionId = item.transactionId;

    if (!trip) return null;

    // Safety checks for required data
    const busName = trip.session?.bus?.busName || "";
    const busNumber = trip.session?.bus?.busNumber || "N/A";
    const organization = trip.session?.bus?.organization;
    const sessionCode = trip.session?.sessionCode || "N/A";
    const tripAmount = item.amount || 0;
    const tripStartTime = trip.tripStartTime;
    const tripEndTime = trip.tripEndTime;
    const distance = trip.distance || 0;
    const tapInType = trip.tapInType;
    const tapOutStatus = trip.tapOutStatus;

    return (
      <Card variant="elevated" style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.busInfoContainer}>
            <View style={styles.busIconContainer}>
              <Ionicons name="bus" size={20} color={COLORS.white} />
            </View>
            <View style={styles.busDetailsContainer}>
              <Text
                variant="label"
                color={COLORS.gray[900]}
                style={styles.cardTitle}
              >
                {busNumber}
              </Text>
              <TouchableOpacity
                style={styles.transactionIdItem}
                onPress={() => copyTransactionId(transactionId)}
                activeOpacity={0.7}
              >
                <Text
                  variant="bodySmall"
                  color={COLORS.gray[600]}
                  style={styles.detailText}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  TrxID: {transactionId}
                </Text>
                <Ionicons
                  name="copy-outline"
                  size={12}
                  color={COLORS.gray[400]}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.amountDateContainer}>
            <Text variant="h6" color={COLORS.error} style={styles.fareAmount}>
              -৳{tripAmount.toFixed(2)}
            </Text>
            <Text
              variant="caption"
              color={COLORS.gray[500]}
              style={styles.cardDateTrip}
            >
              {tripStartTime
                ? formatDate(new Date(tripStartTime))
                : UI_TEXTS.FALLBACKS.NOT_AVAILABLE}
            </Text>
          </View>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.singleRowContainer}>
            <View style={styles.singleRowItem}>
              <Text
                variant="caption"
                color={COLORS.gray[600]}
                style={styles.timeLabel}
              >
                {UI_TEXTS.LABELS.TAP_IN}
              </Text>
              <TouchableOpacity
                style={styles.tapInButton}
                onPress={() => {
                  if (trip.startingLatitude && trip.startingLongitude) {
                    openMapLocation(
                      +trip.startingLatitude,
                      +trip.startingLongitude
                    );
                  }
                }}
                disabled={!trip.startingLatitude || !trip.startingLongitude}
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={COLORS.success}
                />
                <Text
                  variant="bodySmall"
                  color={COLORS.white}
                  style={styles.timeText}
                >
                  {tripStartTime
                    ? TimeFormatter.forHistory(tripStartTime)
                    : UI_TEXTS.FALLBACKS.NOT_AVAILABLE}
                </Text>
                {trip.startingLatitude && trip.startingLongitude && (
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={COLORS.success}
                  />
                )}
              </TouchableOpacity>
            </View>

            {tripEndTime && (
              <View style={styles.singleRowItem}>
                <Text
                  variant="caption"
                  color={COLORS.gray[600]}
                  style={styles.timeLabel}
                >
                  {UI_TEXTS.LABELS.TAP_OUT}
                </Text>
                <TouchableOpacity
                  style={styles.tapOutButton}
                  onPress={() => {
                    if (trip.endingLatitude && trip.endingLongitude) {
                      openMapLocation(
                        +trip.endingLatitude,
                        +trip.endingLongitude
                      );
                    }
                  }}
                  disabled={!trip.endingLatitude || !trip.endingLongitude}
                >
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={COLORS.error}
                  />
                  <Text
                    variant="bodySmall"
                    color={COLORS.white}
                    style={styles.timeText}
                  >
                    {TimeFormatter.forHistory(tripEndTime)}
                  </Text>
                  {trip.endingLatitude && trip.endingLongitude && (
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color={COLORS.error}
                    />
                  )}
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.singleRowItem}>
              <Text
                variant="caption"
                color={COLORS.gray[600]}
                style={styles.timeLabel}
              >
                {UI_TEXTS.LABELS.DISTANCE}
              </Text>
              <TouchableOpacity
                style={styles.distanceButton}
                onPress={() => {
                  if (
                    distance > 0 &&
                    trip.startingLatitude &&
                    trip.startingLongitude &&
                    trip.endingLatitude &&
                    trip.endingLongitude
                  ) {
                    openRouteMap(
                      +trip.startingLatitude,
                      +trip.startingLongitude,
                      +trip.endingLatitude,
                      +trip.endingLongitude
                    );
                  }
                }}
                disabled={
                  distance === 0 ||
                  !trip.startingLatitude ||
                  !trip.startingLongitude ||
                  !trip.endingLatitude ||
                  !trip.endingLongitude
                }
              >
                <Ionicons
                  name="map-outline"
                  size={14}
                  color={
                    distance > 0 &&
                    trip.startingLatitude &&
                    trip.startingLongitude &&
                    trip.endingLatitude &&
                    trip.endingLongitude
                      ? COLORS.primary
                      : COLORS.primary
                  }
                />
                <Text
                  variant="bodySmall"
                  color={COLORS.white}
                  style={styles.distanceText}
                >
                  {distance.toFixed(2)} km
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tap In By and Tap Out By Section */}
          <View style={styles.singleRowContainer}>
            <View style={styles.singleRowItem}>
              <Text
                variant="caption"
                color={COLORS.gray[600]}
                style={styles.timeLabel}
              >
                {UI_TEXTS.LABELS.TAP_IN_BY}
              </Text>
              <View
                style={[
                  styles.tapInByButton,
                  tapInType === "Card" && styles.tapCardButton,
                  tapInType === "Time-Out" && styles.tapTimeOutButton,
                  tapInType === "Staff" && styles.tapStaffButton,
                  tapInType === "Session-Out" && styles.tapSessionOutButton,
                  tapInType === "Mobile App" && styles.tapMobileAppButton,
                  tapInType === "Penalty" && styles.tapPenaltyButton,
                ]}
              >
                <Ionicons
                  name={getTapTypeIcon(tapInType || "")}
                  size={14}
                  color={getTapTypeColor(tapInType || "")}
                />
                <Text
                  variant="bodySmall"
                  color={getTapTypeColor(tapInType || "")}
                  style={styles.tapByText}
                >
                  {tapInType || UI_TEXTS.FALLBACKS.NOT_AVAILABLE}
                </Text>
              </View>
            </View>

            {tripEndTime && (
              <View style={styles.singleRowItem}>
                <Text
                  variant="caption"
                  color={COLORS.gray[600]}
                  style={styles.timeLabel}
                >
                  {UI_TEXTS.LABELS.TAP_OUT_BY}
                </Text>
                <View
                  style={[
                    styles.tapOutByButton,
                    tapOutStatus === "Card" && styles.tapCardButton,
                    tapOutStatus === "Time-Out" && styles.tapTimeOutButton,
                    tapOutStatus === "Staff" && styles.tapStaffButton,
                    tapOutStatus === "Session-Out" &&
                      styles.tapSessionOutButton,
                    tapOutStatus === "Mobile App" && styles.tapMobileAppButton,
                    tapOutStatus === "Penalty" && styles.tapPenaltyButton,
                  ]}
                >
                  <Ionicons
                    name={getTapTypeIcon(tapOutStatus || "")}
                    size={14}
                    color={getTapTypeColor(tapOutStatus || "")}
                  />
                  <Text
                    variant="bodySmall"
                    color={getTapTypeColor(tapOutStatus || "")}
                    style={styles.tapByText}
                  >
                    {tapOutStatus || UI_TEXTS.FALLBACKS.NOT_AVAILABLE}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  const renderRechargeItem = ({ item }: { item: RechargeTransaction }) => {
    const transactionId = item.transactionId;
    const agent = item.agent;
    const organization = agent?.organization;
    const isRecharge = item.transactionType === "Recharge";
    const isReturn = item.transactionType === "Return";
    const amount = item.amount || 0;
    const displayAmount = Math.abs(amount);

    return (
      <Card variant="elevated" style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[
                isRecharge
                  ? styles.rechargeIconContainer
                  : styles.returnIconContainer,
              ]}
            >
              <Ionicons
                name={isRecharge ? "add-circle" : "remove-circle"}
                size={20}
                color={COLORS.white}
              />
            </View>
            <View>
              <Text
                variant="label"
                color={COLORS.gray[900]}
                style={styles.cardTitle}
              >
                {isRecharge
                  ? UI_TEXTS.TRANSACTION_TYPES.RECHARGE
                  : UI_TEXTS.TRANSACTION_TYPES.RETURN}
              </Text>
              <Text
                variant="caption"
                color={COLORS.gray[600]}
                style={styles.cardSubtitle}
              >
                {UI_TEXTS.LABELS.BY}{" "}
                {agent?.name || UI_TEXTS.FALLBACKS.UNKNOWN_AGENT}
              </Text>
              {organization && (
                <Text
                  variant="caption"
                  color={COLORS.gray[500]}
                  style={styles.cardSubtitle}
                >
                  {organization.name || UI_TEXTS.FALLBACKS.ORGANIZATION_INFO}
                </Text>
              )}
            </View>
          </View>
          <Text
            variant="h6"
            color={isRecharge ? COLORS.success : COLORS.error}
            style={[isRecharge ? styles.rechargeAmount : styles.returnAmount]}
          >
            {isRecharge ? "+" : "-"}৳{displayAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.rechargeDetails}>
          <View style={styles.singleRowDetails}>
            <TouchableOpacity
              style={styles.transactionIdItem}
              onPress={() => copyTransactionId(transactionId)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="receipt-outline"
                size={14}
                color={COLORS.gray[500]}
              />
              <Text
                variant="bodySmall"
                color={COLORS.gray[600]}
                style={styles.detailText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {transactionId}
              </Text>
              <Ionicons
                name="copy-outline"
                size={12}
                color={COLORS.gray[400]}
              />
            </TouchableOpacity>
            <View style={styles.dateItem}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={COLORS.gray[500]}
              />
              <Text
                variant="bodySmall"
                color={COLORS.gray[600]}
                style={styles.detailText}
              >
                {item.createTime
                  ? formatDate(new Date(item.createTime))
                  : UI_TEXTS.FALLBACKS.NOT_AVAILABLE}
              </Text>
            </View>
            <View style={styles.TimeItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={COLORS.gray[500]}
              />
              <Text
                variant="bodySmall"
                color={COLORS.gray[600]}
                style={styles.detailText}
              >
                {item.createTime
                  ? TimeFormatter.forHistory(item.createTime)
                  : UI_TEXTS.FALLBACKS.NOT_AVAILABLE}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };

  const renderTabContent = () => {
    const renderItem = ({
      item,
    }: {
      item: TripTransaction | RechargeTransaction;
    }) => {
      if (activeTab === "trips") {
        return renderTripItem({ item: item as TripTransaction });
      } else {
        return renderRechargeItem({ item: item as RechargeTransaction });
      }
    };

    return (
      <FlatList
        key={activeTab} // This ensures independent scrolling for each tab
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          (activeTab === "trips" ? tripPagination : rechargePagination)
            .isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text
                variant="bodySmall"
                color={COLORS.gray[600]}
                style={styles.loadingText}
              >
                {activeTab === "trips"
                  ? UI_TEXTS.LOADING_STATES.LOADING_MORE_TRIPS
                  : UI_TEXTS.LOADING_STATES.LOADING_MORE_TRANSACTIONS}
              </Text>
            </View>
          ) : (activeTab === "trips" ? tripPagination : rechargePagination)
              .hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={onLoadMore}
            >
              <Text variant="labelSmall" color={COLORS.primary}>
                {activeTab === "trips"
                  ? UI_TEXTS.BUTTONS.LOAD_MORE_TRIPS
                  : UI_TEXTS.BUTTONS.LOAD_MORE_TRANSACTIONS}
              </Text>
            </TouchableOpacity>
          ) : null
        }
        ListEmptyComponent={
          <Card>
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === "trips" ? "bus-outline" : "card-outline"}
                size={48}
                color={COLORS.gray[400]}
              />
              <Text
                variant="h6"
                color={COLORS.gray[600]}
                style={styles.emptyText}
              >
                {activeTab === "trips"
                  ? UI_TEXTS.EMPTY_STATES.NO_TRIP_HISTORY
                  : UI_TEXTS.EMPTY_STATES.NO_WALLET_HISTORY}
              </Text>
              <Text
                variant="body"
                color={COLORS.gray[500]}
                style={styles.emptySubtext}
              >
                {searchQuery
                  ? `${UI_TEXTS.EMPTY_STATES.NO_RESULTS_FOR} "${searchQuery}"`
                  : activeTab === "trips"
                  ? UI_TEXTS.EMPTY_STATES.BUS_TRIPS_WILL_APPEAR
                  : UI_TEXTS.EMPTY_STATES.WALLET_HISTORY_WILL_APPEAR}
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchQuery("");
                  }}
                >
                  <Text variant="labelSmall" color={COLORS.primary}>
                    Clear Search
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        }
      />
    );
  };

  // Main component render
  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            {/* Tab Headers */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "trips" && styles.activeTab]}
                onPress={() => handleTabChange("trips")}
              >
                <Ionicons
                  name="bus"
                  size={20}
                  color={
                    activeTab === "trips" ? COLORS.white : COLORS.gray[600]
                  }
                />
                <Text
                  variant="labelSmall"
                  color={
                    activeTab === "trips" ? COLORS.white : COLORS.gray[600]
                  }
                  style={styles.tabText}
                >
                  {UI_TEXTS.TABS.TRIPS}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "recharge" && styles.activeTab,
                ]}
                onPress={() => handleTabChange("recharge")}
              >
                <Ionicons
                  name="card"
                  size={20}
                  color={
                    activeTab === "recharge" ? COLORS.white : COLORS.gray[600]
                  }
                />
                <Text
                  variant="labelSmall"
                  color={
                    activeTab === "recharge" ? COLORS.white : COLORS.gray[600]
                  }
                  style={styles.tabText}
                >
                  {UI_TEXTS.TABS.WALLET}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={COLORS.gray[500]} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={
                    activeTab === "trips"
                      ? UI_TEXTS.SEARCH.TRIPS_PLACEHOLDER
                      : UI_TEXTS.SEARCH.WALLET_PLACEHOLDER
                  }
                  placeholderTextColor={COLORS.gray[500]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={COLORS.gray[400]}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Error Display */}
          {error && (
            <Card style={{ margin: 16 }}>
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color={COLORS.error} />
                <Text
                  variant="h6"
                  color={COLORS.error}
                  style={styles.errorText}
                >
                  {error}
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    loadAllHistory(true);
                  }}
                >
                  <Text variant="labelSmall" color={COLORS.primary}>
                    {UI_TEXTS.BUTTONS.RETRY}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Loading Indicator for Initial Load */}
          {isLoading &&
            tripTransactions.length === 0 &&
            rechargeTransactions.length === 0 &&
            !isRefreshing &&
            !error && (
              <View style={styles.initialLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text
                  variant="body"
                  color={COLORS.gray[600]}
                  style={styles.loadingText}
                >
                  {UI_TEXTS.LOADING_STATES.LOADING_HISTORY}
                </Text>
              </View>
            )}

          {/* Tab Content */}
          {(!isLoading ||
            tripTransactions.length > 0 ||
            rechargeTransactions.length > 0 ||
            isRefreshing) && (
            <Animated.View
              entering={FadeInDown.duration(600)}
              style={styles.tabContent}
            >
              {renderTabContent()}
            </Animated.View>
          )}
        </View>

        {/* Toast notification */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          position="bottom"
          onHide={hideToast}
        />
      </SafeAreaView>
    </>
  );
}

// Styles
const styles = StyleSheet.create({
  // Main container styles
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  content: {
    flex: 1,
  },

  // Header section styles
  headerSection: {
    backgroundColor: COLORS.gray[50],
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  listContent: {
    paddingBottom: 20,
  },

  // Tab navigation styles
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    // Font properties handled by Text component
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Search and filter styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.gray[900],
    paddingVertical: 2,
  },

  // Transaction card styles
  historyCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  busInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  busDetailsContainer: {
    flex: 1,
  },
  amountDateContainer: {
    alignItems: "flex-end",
  },

  // Icon container styles
  busIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  rechargeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
  },
  returnIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
  },
  deductionIconContainer: {
    backgroundColor: COLORS.error,
  },

  // Text and content styles
  cardTitle: {
    // Font properties handled by Text component
    fontSize: 15,
  },
  cardSubtitle: {
    // marginTop: 2,
    // Font properties handled by Text component
  },
  cardDate: {
    marginTop: 4,
    // Font properties handled by Text component
  },
  fareAmount: {
    fontSize: 16,
    // Font properties handled by Text component
  },
  cardDateTrip: {
    // marginTop: 4,
    fontSize: 12,
    // Font properties handled by Text component
  },
  rechargeAmount: {
    // Font properties handled by Text component
  },
  returnAmount: {
    // Font properties handled by Text component
  },

  // Trip details styles
  tripDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: SPACING.md,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    alignItems: "center",
  },
  timeItem: {
    flex: 1,
  },
  singleRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
    alignItems: "flex-start",
  },
  singleRowItem: {
    flex: 1,
    minWidth: 0, // Prevents overflow
  },
  timeLabel: {
    marginBottom: 4,
    // Font properties handled by Text component
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: SPACING.xs,
    backgroundColor: COLORS.gray[50],
    borderRadius: 6,
  },
  tapInButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: SPACING.xs,
    backgroundColor: COLORS.primary + "20",
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 32,
  },
  tapOutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: SPACING.xs,
    backgroundColor: COLORS.primary + "20",
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 32,
  },
  timeText: {
    color: COLORS.gray[700],
    // Font properties handled by Text component
  },
  tapOutBySection: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: "#FAFAFA",
    borderRadius: 6,
  },
  tapInByButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: SPACING.xs,
    backgroundColor: "#E3F2FD", // Light blue background
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 32,
  },
  tapOutByButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: SPACING.xs,
    backgroundColor: "#E8F5E8", // Light green background
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 32,
  },
  tapByText: {
    fontWeight: "500",
    fontSize: 12,
  },
  distanceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: SPACING.xs,
    backgroundColor: COLORS.primary + "20",
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 32,
  },
  distanceText: {
    color: COLORS.gray[700],
    // Font properties handled by Text component
  },
  rechargeDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 16,
    gap: 8,
  },
  singleRowDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  transactionIdItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    // marginTop: 4,
  },
  dateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    paddingLeft: 10,
    justifyContent: "flex-end",
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "center",
  },
  TimeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
  },
  detailText: {
    // Font properties handled by Text component
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    padding: SPACING.xl,
  },
  emptyText: {
    textAlign: "center",
    marginTop: SPACING.sm,
    // Font properties handled by Text component
  },
  emptySubtext: {
    textAlign: "center",
    marginTop: 4,
    // Font properties handled by Text component
  },
  clearFiltersButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "20",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  loadMoreButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
    margin: SPACING.md,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
    gap: 4,
  },
  loadingText: {
    // Font properties handled by Text component
  },
  initialLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.md,
  },
  errorContainer: {
    alignItems: "center",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  errorText: {
    textAlign: "center",
    // Font properties handled by Text component
  },
  retryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.primary + "20",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  // Tap type specific button styles
  tapCardButton: {
    backgroundColor: "#E3F2FD", // Light blue
    borderColor: "#BBDEFB",
  },
  tapTimeOutButton: {
    backgroundColor: "#FFF3E0", // Light orange
    borderColor: "#FFCC02",
  },
  tapStaffButton: {
    backgroundColor: "#E8F5E8", // Light green
    borderColor: "#C8E6C9",
  },
  tapSessionOutButton: {
    backgroundColor: "#FFEBEE", // Light red
    borderColor: "#FFCDD2",
  },
  tapMobileAppButton: {
    backgroundColor: "#F3E5F5", // Light purple
    borderColor: "#E1BEE7",
  },
  tapPenaltyButton: {
    backgroundColor: "#FFF3E0", // Light orange-amber
    borderColor: "#FFB74D",
  },
});
