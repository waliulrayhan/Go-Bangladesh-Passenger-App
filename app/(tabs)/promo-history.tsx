// React Native and Expo imports
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// Custom components and utilities
import { Card } from "../../components/ui/Card";
import { Text } from "../../components/ui/Text";
import { Toast } from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { apiService } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";
import { COLORS, SPACING } from "../../utils/constants";
import { formatDate } from "../../utils/dateTime";
import { TYPOGRAPHY } from "../../utils/fonts";

// UI text constants
const UI_TEXTS = {
  TABS: {
    USED: "Used",
    EXPIRED: "Expired",
  },
  BUTTONS: {
    LOAD_MORE: "Load More Promos",
  },
  LOADING_STATES: {
    LOADING_PROMOS: "Loading promo history...",
    LOADING_MORE_PROMOS: "Loading more promos...",
  },
  EMPTY_STATES: {
    NO_PROMOS: "No promos found",
    USED_MESSAGE: "Your used promos will appear here",
    EXPIRED_MESSAGE: "Your expired promos will appear here",
  },
  TOAST_MESSAGES: {
    REFRESH_FAILED: "Failed to refresh promos. Please try again.",
    LOAD_MORE_FAILED: "Failed to load more promos. Please try again.",
  },
  LABELS: {
    VALID_UNTIL: "Valid Until",
    MAX_USES: "Max Uses",
    USED_ON: "Used On",
  },
} as const;

// Type definitions
type PromoHistoryTab = "used" | "expired";

interface PromoDetails {
  code: string;
  promoType: string;
  discountValue: number;
  maxDiscountAmount: number;
  description: string;
  status: string;
  startTime: string;
  endTime: string;
  organizationId: string;
  passengerStatus: string;
  cardStatus: string;
  maxUsagePerCard: number;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

interface UserPromo {
  promoId: string;
  cardId: string;
  status: string;
  usageAmount: number;
  usageCount: number;
  promo: PromoDetails;
  card: any;
  id: string;
  createTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
  isDeleted: boolean;
}

interface PaginationState {
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  totalLoaded: number;
  totalCount: number;
}

/**
 * Promo History Component - Displays used and expired promos
 * with filtering and pagination capabilities
 */
export default function PromoHistory() {
  // Custom hooks
  const { toast, showToast, hideToast } = useToast();

  // Get auth state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Component state management
  const [activeTab, setActiveTab] = useState<PromoHistoryTab>("used");
  const [usedPromos, setUsedPromos] = useState<UserPromo[]>([]);
  const [expiredPromos, setExpiredPromos] = useState<UserPromo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pagination states
  const [usedPagination, setUsedPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    isLoadingMore: false,
    totalLoaded: 0,
    totalCount: 0,
  });
  const [expiredPagination, setExpiredPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    isLoadingMore: false,
    totalLoaded: 0,
    totalCount: 0,
  });

  // Get current promos and pagination based on active tab
  const currentPromos = useMemo(() => {
    switch (activeTab) {
      case "used":
        return usedPromos;
      case "expired":
        return expiredPromos;
      default:
        return [];
    }
  }, [activeTab, usedPromos, expiredPromos]);

  const currentPagination = useMemo(() => {
    switch (activeTab) {
      case "used":
        return usedPagination;
      case "expired":
        return expiredPagination;
      default:
        return usedPagination;
    }
  }, [activeTab, usedPagination, expiredPagination]);

  // Load promos function
  const loadPromos = async (
    status: string,
    pageNo: number,
    reset: boolean = false
  ) => {
    try {
      if (reset) {
        setIsLoading(true);
      } else {
        // Set loading more for respective tab
        const setPagination = 
          status === "Used" ? setUsedPagination :
          setExpiredPagination;
        
        setPagination((prev) => ({ ...prev, isLoadingMore: true }));
      }

      const response = await apiService.getUserPromos(status, pageNo, 10);
      
      if (response.data.isSuccess) {
        // API returns array directly in content
        const promos = response.data.content || [];
        const totalCount = promos.length;

        const updateState = (
          setPromos: React.Dispatch<React.SetStateAction<UserPromo[]>>,
          setPagination: React.Dispatch<React.SetStateAction<PaginationState>>
        ) => {
          if (reset) {
            setPromos(promos);
          } else {
            setPromos((prev) => [...prev, ...promos]);
          }

          setPagination({
            currentPage: pageNo,
            pageSize: 10,
            hasMore: promos.length === 10,
            isLoadingMore: false,
            totalLoaded: reset ? promos.length : currentPagination.totalLoaded + promos.length,
            totalCount: totalCount,
          });
        };

        if (status === "Used") {
          updateState(setUsedPromos, setUsedPagination);
        } else if (status === "Expired") {
          updateState(setExpiredPromos, setExpiredPagination);
        }
      }
    } catch (error: any) {
      console.error(`Failed to load ${status} promos:`, error);
      if (reset) {
        showToast(UI_TEXTS.TOAST_MESSAGES.REFRESH_FAILED, "error");
      } else {
        showToast(UI_TEXTS.TOAST_MESSAGES.LOAD_MORE_FAILED, "error");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      // Clear loading more state
      const setPagination = 
        status === "Used" ? setUsedPagination :
        setExpiredPagination;
      
      setPagination((prev) => ({ ...prev, isLoadingMore: false }));
    }
  };

  // Load all tabs data
  const loadAllPromos = useCallback(async (reset: boolean = false) => {
    await Promise.all([
      loadPromos("Used", 1, reset),
      loadPromos("Expired", 1, reset),
    ]);
  }, []);

  // Load data when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadAllPromos(true);
      }
    }, [isAuthenticated])
  );

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllPromos(true);
  }, [loadAllPromos]);

  // Handle tab switching
  const handleTabChange = (tab: PromoHistoryTab) => {
    setActiveTab(tab);
  };

  // Load more data
  const onLoadMore = useCallback(async () => {
    if (currentPagination.hasMore && !currentPagination.isLoadingMore) {
      const status = 
        activeTab === "used" ? "Used" : "Expired";
      
      await loadPromos(status, currentPagination.currentPage + 1, false);
    }
  }, [activeTab, currentPagination]);

  // Render tab buttons
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "used" && styles.activeTab,
        ]}
        onPress={() => handleTabChange("used")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "used" && styles.activeTabText,
          ]}
        >
          {UI_TEXTS.TABS.USED}
        </Text>
        {usedPromos.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{usedPromos.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "expired" && styles.activeTab,
        ]}
        onPress={() => handleTabChange("expired")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "expired" && styles.activeTabText,
          ]}
        >
          {UI_TEXTS.TABS.EXPIRED}
        </Text>
        {expiredPromos.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{expiredPromos.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render promo item
  const renderPromoItem = ({ item, index }: { item: UserPromo; index: number }) => {
    const promo = item.promo;
    const isExpired = activeTab === "expired";
    
    // Format discount text
    const discountText = promo.promoType === "Fixed" 
      ? `৳${promo.discountValue}` 
      : promo.maxDiscountAmount > 0
        ? `${promo.discountValue}% (Max ৳${promo.maxDiscountAmount})`
        : `${promo.discountValue}%`;

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 50)}
      >
        <Card style={[styles.promoCard, isExpired && styles.expiredCard]}>
          <View style={styles.promoContent}>
            {/* Left side - Info */}
            <View style={styles.promoLeft}>
              <View style={[
                styles.promoIconContainer,
                isExpired && { backgroundColor: COLORS.gray[200] }
              ]}>
                <Ionicons 
                  name={isExpired ? "time-outline" : "checkmark-done"} 
                  size={24} 
                  color={isExpired ? COLORS.gray[400] : COLORS.success} 
                />
              </View>
              
              <View style={styles.promoInfo}>
                <Text style={styles.promoCode}>{promo.code}</Text>
                
                {promo.description && (
                  <Text style={styles.promoDescription} numberOfLines={1}>
                    {promo.description}
                  </Text>
                )}
                
                <Text style={[
                  styles.promoDiscount,
                  isExpired && { color: COLORS.gray[400] }
                ]}>
                  {discountText}
                </Text>
                
                <View style={styles.promoMeta}>
                  <Text style={styles.promoMetaText}>
                    {isExpired ? "Expired" : "Valid Until"}: {formatDate(promo.endTime)}
                  </Text>
                  {item.usageCount > 0 && (
                    <Text style={styles.promoMetaText}>
                      • Used: {item.usageCount}/{promo.maxUsagePerCard}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Right side - Status Badge */}
            <View style={styles.promoRight}>
              {isExpired ? (
                <View style={styles.expiredBadge}>
                  <Ionicons name="close-circle" size={18} color={COLORS.error} />
                  <Text style={styles.expiredText}>Expired</Text>
                </View>
              ) : (
                <View style={styles.usedBadge}>
                  <Ionicons name="checkmark-done-circle" size={18} color={COLORS.success} />
                  <Text style={styles.usedText}>Used</Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </Animated.View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    const getMessage = () => {
      switch (activeTab) {
        case "used":
          return UI_TEXTS.EMPTY_STATES.USED_MESSAGE;
        case "expired":
          return UI_TEXTS.EMPTY_STATES.EXPIRED_MESSAGE;
        default:
          return UI_TEXTS.EMPTY_STATES.USED_MESSAGE;
      }
    };

    return (
      <View style={styles.emptyState}>
        <Ionicons name="pricetags-outline" size={64} color={COLORS.gray[300]} />
        <Text style={styles.emptyStateTitle}>{UI_TEXTS.EMPTY_STATES.NO_PROMOS}</Text>
        <Text style={styles.emptyStateText}>{getMessage()}</Text>
      </View>
    );
  };

  // Render load more button
  const renderFooter = () => {
    if (!currentPagination.hasMore) return null;

    if (currentPagination.isLoadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingMoreText}>
            {UI_TEXTS.LOADING_STATES.LOADING_MORE_PROMOS}
          </Text>
        </View>
      );
    }

    return (
      <TouchableOpacity style={styles.loadMoreButton} onPress={onLoadMore}>
        <Text style={styles.loadMoreText}>{UI_TEXTS.BUTTONS.LOAD_MORE}</Text>
        <Ionicons name="chevron-down" size={16} color={COLORS.primary} />
      </TouchableOpacity>
    );
  };

  // Initial loading state
  if (isLoading && currentPromos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderTabs()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            {UI_TEXTS.LOADING_STATES.LOADING_PROMOS}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderTabs()}

      <FlatList
        data={currentPromos}
        renderItem={renderPromoItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
      />

      {/* Toast Notification */}
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
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: SPACING.xs,
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray[500],
    fontWeight: "500",
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 10,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  promoCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
  },
  expiredCard: {
    opacity: 0.7,
    backgroundColor: COLORS.gray[100],
  },
  promoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  promoLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  promoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.success + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  promoInfo: {
    flex: 1,
    gap: SPACING.xs / 2,
  },
  promoCode: {
    ...TYPOGRAPHY.h6,
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  promoDescription: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.gray[500],
  },
  promoDiscount: {
    ...TYPOGRAPHY.bodySmall,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
  },
  promoMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs / 2,
  },
  promoMetaText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    color: COLORS.gray[400],
  },
  promoRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  usedBadge: {
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
  },
  usedText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.success,
    fontWeight: "600",
  },
  expiredBadge: {
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
  },
  expiredText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.error,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl * 3,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.h6,
    color: COLORS.gray[400],
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptyStateText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray[400],
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray[500],
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  loadingMoreText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray[500],
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.md,
    gap: SPACING.xs,
  },
  loadMoreText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
