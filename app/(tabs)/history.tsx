// React Native and Expo imports
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Clipboard,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
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
import { useTokenRefresh } from "../../hooks/useTokenRefresh";
import { RechargeTransaction, TripTransaction } from "../../services/api";
import { useCardStore } from "../../stores/cardStore";
import { COLORS, SPACING } from "../../utils/constants";

// Type definitions
type HistoryTab = "trips" | "recharge";
type DateFilter = "all" | "today" | "week" | "month" | "custom";
type SortOrder = "newest" | "oldest" | "amount_high" | "amount_low";

interface FilterOptions {
  dateFilter: DateFilter;
  sortOrder: SortOrder;
  customStartDate?: Date;
  customEndDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * History Component - Displays trip and wallet transaction history
 * with filtering, searching, and pagination capabilities
 */
export default function History() {
  // Store data and functions
  const {
    tripTransactions,
    rechargeTransactions,
    loadTripHistory,
    loadRechargeHistory,
    loadMoreTripHistory,
    loadMoreRechargeHistory,
    isLoading,
    error,
    tripPagination,
    rechargePagination,
  } = useCardStore();

  // Custom hooks
  const { refreshAllData } = useTokenRefresh();
  const { toast, showToast, hideToast } = useToast();

  // Component state management
  const [activeTab, setActiveTab] = useState<HistoryTab>("trips");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    dateFilter: "all",
    sortOrder: "newest",
  });
  
  // Derived state
  const [filteredData, setFilteredData] = useState<
    (TripTransaction | RechargeTransaction)[]
  >([]);

  // Effects
  
  // Load initial data when component mounts
  useEffect(() => {
    if (!hasInitialLoad) {
      loadTripHistory(1, true);
      loadRechargeHistory(1, true);
      setHasInitialLoad(true);
    }
  }, [hasInitialLoad]);

  // Filter and sort data whenever dependencies change
  useEffect(() => {
    let data: (TripTransaction | RechargeTransaction)[] =
      activeTab === "trips" ? tripTransactions : rechargeTransactions;

    // Apply date filter
    if (filters.dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      data = data.filter((item) => {
        const dateString =
          activeTab === "trips"
            ? (item as TripTransaction).trip?.tripStartTime
            : item.createTime;
        if (!dateString) return false;
        const itemDate = new Date(dateString);

        switch (filters.dateFilter) {
          case "today":
            return itemDate >= today;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return itemDate >= weekAgo;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return itemDate >= monthAgo;
          case "custom":
            if (filters.customStartDate && filters.customEndDate) {
              return (
                itemDate >= filters.customStartDate &&
                itemDate <= filters.customEndDate
              );
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Apply amount filter
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      data = data.filter((item) => {
        const amount = item.amount || 0;
        const minCheck =
          filters.minAmount === undefined || amount >= filters.minAmount;
        const maxCheck =
          filters.maxAmount === undefined || amount <= filters.maxAmount;
        return minCheck && maxCheck;
      });
    }

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

    // Apply sorting
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
      const aAmount = a.amount || 0;
      const bAmount = b.amount || 0;

      switch (filters.sortOrder) {
        case "oldest":
          return aDate.getTime() - bDate.getTime();
        case "amount_high":
          return bAmount - aAmount;
        case "amount_low":
          return aAmount - bAmount;
        case "newest":
        default:
          return bDate.getTime() - aDate.getTime();
      }
    });

    setFilteredData(data);
    console.log("📊 [HISTORY COMPONENT] Filtered data:", data.length);
  }, [tripTransactions, rechargeTransactions, activeTab, filters, searchQuery]);

  // Event handlers

  // Pull-to-refresh handler with error feedback
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAllData(true);
    } catch (error) {
      console.log("Refresh error:", error);
      showToast("Failed to refresh data. Please try again.", "error");
    } finally {
      setRefreshing(false);
    }
  }, [refreshAllData, showToast]);

  // Handle tab switching
  const handleTabChange = (tab: HistoryTab) => {
    setActiveTab(tab);
    // Optional: Only reload data if we don't have enough data for the specific tab
    // This prevents unnecessary API calls when just switching tabs
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
        console.log("Load more error:", error);
        showToast("Failed to load more data. Please try again.", "error");
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

  // Utility functions

  // Open location in Google Maps
  const openMapLocation = (
    latitude: number,
    longitude: number,
    label: string
  ) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  // Open route in Google Maps
  const openRouteMap = (
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ) => {
    const url = `https://www.google.com/maps/dir/${startLat},${startLng}/${endLat},${endLng}`;
    Linking.openURL(url);
  };

  // Copy transaction ID to clipboard with toast feedback
  const copyTransactionId = async (transactionId: string) => {
    try {
      await Clipboard.setString(transactionId);
      showToast("Transaction ID copied to clipboard", "success");
    } catch (error) {
      showToast("Failed to copy transaction ID", "error");
    }
  };

  // Helper functions

  // Get user-friendly date filter label
  const getDateFilterLabel = (filter: DateFilter) => {
    switch (filter) {
      case "today":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      case "custom":
        return "Custom Range";
      default:
        return "All Time";
    }
  };

  // Get user-friendly sort order label
  const getSortOrderLabel = (sort: SortOrder) => {
    switch (sort) {
      case "oldest":
        return "Oldest First";
      case "amount_high":
        return "Amount: High to Low";
      case "amount_low":
        return "Amount: Low to High";
      default:
        return "Newest First";
    }
  };

  // Filter management functions
  
  // Reset filters to default values
  const resetFilters = () => {
    setFilters({
      dateFilter: "all",
      sortOrder: "newest",
    });
  };

  // Apply new filters and close modal
  const applyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };

  // Date and time formatting functions
  
  // Format date to readable string with month name
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

  // Format time string to 12-hour format with timezone adjustment
  const formatTime = (dateString: string) => {
    const date = new Date(new Date(dateString).getTime() + 6 * 60 * 60 * 1000);
    const hours24 = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");

    // Convert to 12-hour format
    const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
    const ampm = hours24 >= 12 ? "PM" : "AM";

    return `${hours12}:${minutes} ${ampm}`;
  };

  // Render functions
  
  // Render individual trip transaction item
  const renderTripItem = ({ item }: { item: TripTransaction }) => {
    const trip = item.trip;

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
          <View style={styles.headerLeft}>
            <View style={styles.busIconContainer}>
              <Ionicons name="bus" size={20} color={COLORS.white} />
            </View>
            <View>
              <Text
                variant="label"
                color={COLORS.gray[900]}
                style={styles.cardTitle}
              >
                {busNumber}
              </Text>
              {/* {busName && busName !== "" && (
                <Text
                  variant="caption"
                  color={COLORS.gray[600]}
                  style={styles.cardSubtitle}
                >
                  {busName}
                </Text>
              )} */}
              {organization && (
                <Text
                  variant="caption"
                  color={COLORS.gray[500]}
                  style={styles.cardSubtitle}
                >
                  Organization Info
                </Text>
              )}
              <Text
                variant="caption"
                color={COLORS.gray[500]}
                style={styles.cardDate}
              >
                {tripStartTime ? formatDate(new Date(tripStartTime)) : "N/A"}
              </Text>
            </View>
          </View>
          <Text variant="h6" color={COLORS.error} style={styles.fareAmount}>
            -৳{tripAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.singleRowContainer}>
            <View style={styles.singleRowItem}>
              <Text
                variant="caption"
                color={COLORS.gray[600]}
                style={styles.timeLabel}
              >
                Tap In
              </Text>
              <TouchableOpacity
                style={styles.tapInButton}
                onPress={() => {
                  if (trip.startingLatitude && trip.startingLongitude) {
                    openMapLocation(
                      parseFloat(trip.startingLatitude),
                      parseFloat(trip.startingLongitude),
                      "Tap In Location"
                    );
                  }
                }}
                disabled={!trip.startingLatitude || !trip.startingLongitude}
              >
                <Ionicons name="time-outline" size={14} color={COLORS.success} />
                <Text
                  variant="bodySmall"
                  color={COLORS.white}
                  style={styles.timeText}
                >
                  {tripStartTime ? formatTime(tripStartTime) : "N/A"}
                </Text>
                <Ionicons name="location-outline" size={14} color={COLORS.success} />
              </TouchableOpacity>
            </View>

            {tripEndTime && (
              <View style={styles.singleRowItem}>
                <Text
                  variant="caption"
                  color={COLORS.gray[600]}
                  style={styles.timeLabel}
                >
                  Tap Out
                </Text>
                <TouchableOpacity
                  style={styles.tapOutButton}
                  onPress={() => {
                    if (trip.endingLatitude && trip.endingLongitude) {
                      openMapLocation(
                        parseFloat(trip.endingLatitude),
                        parseFloat(trip.endingLongitude),
                        "Tap Out Location"
                      );
                    }
                  }}
                  disabled={!trip.endingLatitude || !trip.endingLongitude}
                >
                  <Ionicons name="time-outline" size={14} color={COLORS.error} />
                  <Text
                    variant="bodySmall"
                    color={COLORS.white}
                    style={styles.timeText}
                  >
                    {tripEndTime ? formatTime(tripEndTime) : "N/A"}
                  </Text>
                  <Ionicons name="location-outline" size={14} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.singleRowItem}>
              <Text
                variant="caption"
                color={COLORS.gray[600]}
                style={styles.timeLabel}
              >
                Distance
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
                      parseFloat(trip.startingLatitude),
                      parseFloat(trip.startingLongitude),
                      parseFloat(trip.endingLatitude),
                      parseFloat(trip.endingLongitude)
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
                  color={
                    distance > 0 &&
                    trip.startingLatitude &&
                    trip.startingLongitude &&
                    trip.endingLatitude &&
                    trip.endingLongitude
                      ? COLORS.primary
                      : COLORS.gray[600]
                  }
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
                Tap In By
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
                  name={
                    tapInType === "Card"
                      ? "card-outline"
                      : tapInType === "Time-Out"
                      ? "time-outline"
                      : tapInType === "Staff"
                      ? "person-circle-outline"
                      : tapInType === "Session-Out"
                      ? "exit-outline"
                      : tapInType === "Mobile App"
                      ? "phone-portrait-outline"
                      : tapInType === "Penalty"
                      ? "warning-outline"
                      : "help-circle-outline"
                  }
                  size={14}
                  color={
                    tapInType === "Card"
                      ? "#1976D2"
                      : tapInType === "Time-Out"
                      ? "#F57C00"
                      : tapInType === "Staff"
                      ? "#388E3C"
                      : tapInType === "Session-Out"
                      ? "#D32F2F"
                      : tapInType === "Mobile App"
                      ? "#7B1FA2"
                      : tapInType === "Penalty"
                      ? "#E65100"
                      : COLORS.gray[500]
                  }
                />
                <Text
                  variant="bodySmall"
                  color={
                    tapInType === "Card"
                      ? "#1976D2"
                      : tapInType === "Time-Out"
                      ? "#F57C00"
                      : tapInType === "Staff"
                      ? "#388E3C"
                      : tapInType === "Session-Out"
                      ? "#D32F2F"
                      : tapInType === "Mobile App"
                      ? "#7B1FA2"
                      : tapInType === "Penalty"
                      ? "#E65100"
                      : COLORS.gray[600]
                  }
                  style={styles.tapByText}
                >
                  {tapInType || "N/A"}
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
                  Tap Out By
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
                    name={
                      tapOutStatus === "Card"
                        ? "card-outline"
                        : tapOutStatus === "Time-Out"
                        ? "time-outline"
                        : tapOutStatus === "Staff"
                        ? "person-circle-outline"
                        : tapOutStatus === "Session-Out"
                        ? "exit-outline"
                        : tapOutStatus === "Mobile App"
                        ? "phone-portrait-outline"
                        : tapOutStatus === "Penalty"
                        ? "warning-outline"
                        : "help-circle-outline"
                    }
                    size={14}
                    color={
                      tapOutStatus === "Card"
                        ? "#1976D2"
                        : tapOutStatus === "Time-Out"
                        ? "#F57C00"
                        : tapOutStatus === "Staff"
                        ? "#388E3C"
                        : tapOutStatus === "Session-Out"
                        ? "#D32F2F"
                        : tapOutStatus === "Mobile App"
                        ? "#7B1FA2"
                        : tapOutStatus === "Penalty"
                        ? "#E65100"
                        : COLORS.gray[500]
                    }
                  />
                  <Text
                    variant="bodySmall"
                    color={
                      tapOutStatus === "Card"
                        ? "#1976D2"
                        : tapOutStatus === "Time-Out"
                        ? "#F57C00"
                        : tapOutStatus === "Staff"
                        ? "#388E3C"
                        : tapOutStatus === "Session-Out"
                        ? "#D32F2F"
                        : tapOutStatus === "Mobile App"
                        ? "#7B1FA2"
                        : tapOutStatus === "Penalty"
                        ? "#E65100"
                        : COLORS.gray[600]
                    }
                    style={styles.tapByText}
                  >
                    {tapOutStatus || "N/A"}
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
    const isRecharge = item.transactionType === 'Recharge';
    const isReturn = item.transactionType === 'Return';
    const amount = item.amount || 0;
    const displayAmount = Math.abs(amount);

    return (
      <Card variant="elevated" style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[
              isRecharge ? styles.rechargeIconContainer : styles.returnIconContainer
            ]}>
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
                {isRecharge ? "Recharge" : "Return"}
              </Text>
              <Text
                variant="caption"
                color={COLORS.gray[600]}
                style={styles.cardSubtitle}
              >
                by {agent?.name || "Unknown Agent"}
              </Text>
              {organization && (
                <Text
                  variant="caption"
                  color={COLORS.gray[500]}
                  style={styles.cardSubtitle}
                >
                  {organization.name} ({organization.code})
                </Text>
              )}
            </View>
          </View>
          <Text
            variant="h6"
            color={isRecharge ? COLORS.success : COLORS.error}
            style={[
              isRecharge ? styles.rechargeAmount : styles.returnAmount
            ]}
          >
            {isRecharge ? '+' : '-'}৳{displayAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.rechargeDetails}>
          <View style={styles.singleRowDetails}>
            <TouchableOpacity 
              style={styles.transactionIdItem}
              onPress={() => copyTransactionId(transactionId)}
              activeOpacity={0.7}
            >
              <Ionicons name="receipt-outline" size={14} color={COLORS.gray[500]} />
              <Text
                variant="bodySmall"
                color={COLORS.gray[600]}
                style={styles.detailText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {transactionId}
              </Text>
              <Ionicons name="copy-outline" size={12} color={COLORS.gray[400]} />
            </TouchableOpacity>
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateItem}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.gray[500]} />
                <Text
                  variant="bodySmall"
                  color={COLORS.gray[600]}
                  style={styles.detailText}
                >
                  {item.createTime
                    ? formatDate(new Date(item.createTime))
                    : "N/A"}
                </Text>
              </View>
              <View style={styles.TimeItem}>
                <Ionicons name="time-outline" size={14} color={COLORS.gray[500]} />
                <Text
                  variant="bodySmall"
                  color={COLORS.gray[600]}
                  style={styles.detailText}
                >
                  {item.createTime ? formatTime(item.createTime) : "N/A"}
                </Text>
              </View>
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
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
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
                Loading more {activeTab === "trips" ? "trips" : "transactions"}...
              </Text>
              {(() => {
                const currentPagination = activeTab === "trips" ? tripPagination : rechargePagination;
                if (currentPagination.totalCount && currentPagination.totalCount > 0) {
                  const progressPercentage = Math.round((currentPagination.totalLoaded / currentPagination.totalCount) * 100);
                  return (
                    <Text
                      variant="caption"
                      color={COLORS.gray[500]}
                      style={styles.loadingText}
                    >
                      {currentPagination.totalLoaded} of {currentPagination.totalCount} ({progressPercentage}%)
                    </Text>
                  );
                }
                return null;
              })()}
            </View>
          ) : (activeTab === "trips" ? tripPagination : rechargePagination).hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={onLoadMore}
            >
              <Text variant="labelSmall" color={COLORS.primary}>
                Load More {activeTab === "trips" ? "Trips" : "Transactions"}
              </Text>
              {(() => {
                const currentPagination = activeTab === "trips" ? tripPagination : rechargePagination;
                if (currentPagination.totalCount && currentPagination.totalCount > 0) {
                  return (
                    <Text
                      variant="caption"
                      color={COLORS.gray[500]}
                    >
                      {currentPagination.totalLoaded} of {currentPagination.totalCount}
                    </Text>
                  );
                }
                return null;
              })()}
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
                No {activeTab === "trips" ? "trip" : "wallet"} history found
              </Text>
              <Text
                variant="body"
                color={COLORS.gray[500]}
                style={styles.emptySubtext}
              >
                {searchQuery
                  ? `No results found for "${searchQuery}"`
                  : filters.dateFilter !== "all" ||
                    filters.minAmount !== undefined ||
                    filters.maxAmount !== undefined
                  ? "Try adjusting your filters"
                  : `Your ${
                      activeTab === "trips" ? "bus trips" : "wallet history"
                    } will appear here`}
              </Text>
              {(searchQuery ||
                filters.dateFilter !== "all" ||
                filters.minAmount !== undefined ||
                filters.maxAmount !== undefined) && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchQuery("");
                    resetFilters();
                  }}
                >
                  <Text variant="labelSmall" color={COLORS.primary}>
                    Clear {searchQuery ? "Search & Filters" : "Filters"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        }
      />
    );
  };

  const FilterModal = () => {
    const [tempFilters, setTempFilters] = useState<FilterOptions>(filters);

    return (
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.gray[700]} />
            </TouchableOpacity>
            <Text
              variant="h6"
              color={COLORS.gray[900]}
              style={styles.modalTitle}
            >
              Filter {activeTab === "trips" ? "Trips" : "Wallet History"}
            </Text>
            <TouchableOpacity onPress={resetFilters}>
              <Text variant="labelSmall" color={COLORS.primary}>
                Reset
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Date Filter */}
            <View style={styles.filterSection}>
              <Text
                variant="label"
                color={COLORS.gray[700]}
                style={styles.sectionTitle}
              >
                Date Range
              </Text>
              <View style={styles.filterOptions}>
                {(["all", "today", "week", "month"] as DateFilter[]).map(
                  (option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterOption,
                        tempFilters.dateFilter === option &&
                          styles.filterOptionActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, dateFilter: option })
                      }
                    >
                      <Text
                        variant="bodySmall"
                        color={
                          tempFilters.dateFilter === option
                            ? COLORS.white
                            : COLORS.gray[700]
                        }
                      >
                        {getDateFilterLabel(option)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            {/* Sort Order */}
            <View style={styles.filterSection}>
              <Text
                variant="label"
                color={COLORS.gray[700]}
                style={styles.sectionTitle}
              >
                Sort By
              </Text>
              <View style={styles.filterOptions}>
                {(
                  [
                    "newest",
                    "oldest",
                    "amount_high",
                    "amount_low",
                  ] as SortOrder[]
                ).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      tempFilters.sortOrder === option &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() =>
                      setTempFilters({ ...tempFilters, sortOrder: option })
                    }
                  >
                    <Text
                      variant="bodySmall"
                      color={
                        tempFilters.sortOrder === option
                          ? COLORS.white
                          : COLORS.gray[700]
                      }
                    >
                      {getSortOrderLabel(option)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount Range */}
            <View style={styles.filterSection}>
              <Text
                variant="label"
                color={COLORS.gray[700]}
                style={styles.sectionTitle}
              >
                Amount Range (৳)
              </Text>
              <View style={styles.amountInputs}>
                <View style={styles.amountInput}>
                  <Text variant="bodySmall" color={COLORS.gray[600]}>
                    Min
                  </Text>
                  <TouchableOpacity
                    style={styles.amountButton}
                    onPress={() => {
                      // For now, just clear the min amount
                      setTempFilters({ ...tempFilters, minAmount: undefined });
                    }}
                  >
                    <Text variant="bodySmall" color={COLORS.gray[700]}>
                      {tempFilters.minAmount || "Any"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.amountInput}>
                  <Text variant="bodySmall" color={COLORS.gray[600]}>
                    Max
                  </Text>
                  <TouchableOpacity
                    style={styles.amountButton}
                    onPress={() => {
                      // For now, just clear the max amount
                      setTempFilters({ ...tempFilters, maxAmount: undefined });
                    }}
                  >
                    <Text variant="bodySmall" color={COLORS.gray[700]}>
                      {tempFilters.maxAmount || "Any"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick amount filters */}
              <View style={styles.quickFilters}>
                <Text
                  variant="caption"
                  color={COLORS.gray[600]}
                  style={styles.quickFiltersLabel}
                >
                  Quick filters:
                </Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() =>
                      setTempFilters({
                        ...tempFilters,
                        minAmount: undefined,
                        maxAmount: 50,
                      })
                    }
                  >
                    <Text variant="bodySmall" color={COLORS.gray[700]}>
                      Under ৳50
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() =>
                      setTempFilters({
                        ...tempFilters,
                        minAmount: 50,
                        maxAmount: 100,
                      })
                    }
                  >
                    <Text variant="bodySmall" color={COLORS.gray[700]}>
                      ৳50-100
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() =>
                      setTempFilters({
                        ...tempFilters,
                        minAmount: 100,
                        maxAmount: undefined,
                      })
                    }
                  >
                    <Text variant="bodySmall" color={COLORS.gray[700]}>
                      Over ৳100
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowFilterModal(false)}
            >
              <Text variant="labelSmall" color={COLORS.gray[700]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.applyButton]}
              onPress={() => applyFilters(tempFilters)}
            >
              <Text variant="labelSmall" color={COLORS.white}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  // Main component render
  return (
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
                color={activeTab === "trips" ? COLORS.white : COLORS.gray[600]}
              />
              <Text
                variant="labelSmall"
                color={activeTab === "trips" ? COLORS.white : COLORS.gray[600]}
                style={styles.tabText}
              >
                Trip History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "recharge" && styles.activeTab]}
              onPress={() => handleTabChange("recharge")}
            >
              <Ionicons
                name="card"
                size={20}
                color={activeTab === "recharge" ? COLORS.white : COLORS.gray[600]}
              />
              <Text
                variant="labelSmall"
                color={activeTab === "recharge" ? COLORS.white : COLORS.gray[600]}
                style={styles.tabText}
              >
                Wallet History
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={COLORS.gray[500]} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${
                  activeTab === "trips" ? "trips" : "wallet history"
                }...`}
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
                    color={COLORS.gray[500]}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter Header */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            style={styles.filterHeader}
          >
            <View style={styles.filterInfo}>
              <Text variant="bodySmall" color={COLORS.gray[600]}>
                {filteredData.length}{" "}
                {activeTab === "trips" ? "trips" : "transactions"}
                {/* Show total count if different from filtered count */}
                {(() => {
                  const currentPagination = activeTab === "trips" ? tripPagination : rechargePagination;
                  const totalCount = currentPagination.totalCount || 0;
                  const originalDataLength = activeTab === "trips" ? tripTransactions.length : rechargeTransactions.length;
                  
                  // Show total if we have filtering applied or if we have pagination info
                  if (searchQuery || filters.dateFilter !== "all" || 
                      filters.minAmount !== undefined || filters.maxAmount !== undefined) {
                    return (
                      <Text variant="bodySmall" color={COLORS.gray[500]}>
                        {" "}of {originalDataLength} loaded
                      </Text>
                    );
                  }
                    return (
                      <Text variant="bodySmall" color={COLORS.gray[500]}>
                        {" "}• {totalCount} total
                      </Text>
                    );
                })()}
                {searchQuery && (
                  <Text variant="bodySmall" color={COLORS.primary}>
                    {" "}
                    • "{searchQuery}"
                  </Text>
                )}
                {filters.dateFilter !== "all" && (
                  <Text variant="bodySmall" color={COLORS.primary}>
                    {" "}
                    • {getDateFilterLabel(filters.dateFilter)}
                  </Text>
                )}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.filterButton,
                (filters.dateFilter !== "all" ||
                  filters.minAmount !== undefined ||
                  filters.maxAmount !== undefined) &&
                  styles.filterButtonActive,
              ]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons
                name="funnel"
                size={16}
                color={
                  filters.dateFilter !== "all" ||
                  filters.minAmount !== undefined ||
                  filters.maxAmount !== undefined
                    ? COLORS.white
                    : COLORS.gray[600]
                }
              />
              <Text
                variant="labelSmall"
                color={
                  filters.dateFilter !== "all" ||
                  filters.minAmount !== undefined ||
                  filters.maxAmount !== undefined
                    ? COLORS.white
                    : COLORS.gray[600]
                }
              >
                Filter
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Error Display */}
        {error && (
          <Card style={{ margin: 16 }}>
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color={COLORS.error} />
              <Text variant="h6" color={COLORS.error} style={styles.errorText}>
                {error}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  loadTripHistory(1, true);
                  loadRechargeHistory(1, true);
                }}
              >
                <Text variant="labelSmall" color={COLORS.primary}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Loading Indicator for Initial Load */}
        {isLoading &&
          tripTransactions.length === 0 &&
          rechargeTransactions.length === 0 &&
          !error && (
            <View style={styles.initialLoading}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text
                variant="body"
                color={COLORS.gray[600]}
                style={styles.loadingText}
              >
                Loading history...
              </Text>
            </View>
          )}

        {/* Tab Content */}
        {(!isLoading ||
          tripTransactions.length > 0 ||
          rechargeTransactions.length > 0) && (
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={styles.tabContent}
          >
            {renderTabContent()}
          </Animated.View>
        )}
      </View>

      <FilterModal />
      
      {/* Toast notification */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
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
    fontSize: 16,
    color: COLORS.gray[900],
    paddingVertical: 4,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterInfo: {
    flex: 1,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
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
    fontWeight: "500",
    fontSize: 14,
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
    paddingTop: 30,
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
  sectionLabel: {
    marginBottom: SPACING.xs,
    fontWeight: "500",
    fontSize: 12,
  },
  tapOutByContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  tapOutByItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  tapInByButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: SPACING.xs,
    backgroundColor: "#E3F2FD", // Light blue background
    borderRadius: 6,
    borderColor: "#BBDEFB",
    justifyContent: "center",
    minHeight: 32,
  },
  tapOutByButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: SPACING.xs,
    // backgroundColor: "#E8F5E8", // Light green background
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 32,
  },
  tapByText: {
    fontWeight: "500",
    fontSize: 12,
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
    maxWidth: "35%", // Limit transaction ID width
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
    paddingLeft: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  TimeItem: {
  paddingLeft: 8,
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
  flex: 1,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  modalTitle: {
    flex: 1,
    textAlign: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.gray[100],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  amountInputs: {
    flexDirection: "row",
    gap: 12,
  },
  amountInput: {
    flex: 1,
  },
  amountButton: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  quickFilters: {
    marginTop: 12,
  },
  quickFiltersLabel: {
    marginBottom: 8,
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.gray[100],
  },
  applyButton: {
    backgroundColor: COLORS.primary,
  },
});
