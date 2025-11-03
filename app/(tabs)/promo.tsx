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
    View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// Custom components and utilities
import { ConfirmationModal } from "../../components/ConfirmationModal";
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
    AVAILABLE: "Available",
    APPLIED: "Applied",
  },
  BUTTONS: {
    RETRY: "Retry",
    LOAD_MORE: "Load More Promos",
    APPLY: "Apply",
    APPLIED: "Applied",
  },
  LOADING_STATES: {
    LOADING_PROMOS: "Loading promos...",
    LOADING_MORE_PROMOS: "Loading more promos...",
    APPLYING_PROMO: "Applying promo...",
  },
  EMPTY_STATES: {
    NO_PROMOS: "No promos found",
    AVAILABLE_MESSAGE: "Available promos will appear here",
    APPLIED_MESSAGE: "Your applied promos will appear here",
  },
  TOAST_MESSAGES: {
    REFRESH_FAILED: "Failed to refresh promos. Please try again.",
    LOAD_MORE_FAILED: "Failed to load more promos. Please try again.",
    APPLY_SUCCESS: "Promo applied successfully!",
    APPLY_FAILED: "Failed to apply promo. Please try again.",
  },
  CONFIRMATION: {
    TITLE: "Apply Promo",
    MESSAGE: "Are you sure you want to apply this promo code?",
    CONFIRM: "Apply",
    CANCEL: "Cancel",
  },
  LABELS: {
    CODE: "Code",
    DISCOUNT: "Discount",
    VALID_UNTIL: "Valid Until",
    TYPE: "Type",
    MAX_USES: "Max Uses",
    USES_LEFT: "Uses Left",
  },
} as const;

// Type definitions
type PromoTab = "available" | "applied";

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
 * Promo Component - Displays available, applied, and used promos
 * with filtering and pagination capabilities
 */
export default function Promo() {
  // Custom hooks
  const { toast, showToast, hideToast } = useToast();

  // Get auth state
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Component state management
  const [activeTab, setActiveTab] = useState<PromoTab>("available");
  const [availablePromos, setAvailablePromos] = useState<UserPromo[]>([]);
  const [appliedPromos, setAppliedPromos] = useState<UserPromo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isApplying, setIsApplying] = useState<string | null>(null);
  
  // Pagination states
  const [availablePagination, setAvailablePagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    isLoadingMore: false,
    totalLoaded: 0,
    totalCount: 0,
  });
  const [appliedPagination, setAppliedPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: 10,
    hasMore: true,
    isLoadingMore: false,
    totalLoaded: 0,
    totalCount: 0,
  });

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<UserPromo | null>(null);

  // Get current promos and pagination based on active tab
  const currentPromos = useMemo(() => {
    switch (activeTab) {
      case "available":
        return availablePromos;
      case "applied":
        return appliedPromos;
      default:
        return [];
    }
  }, [activeTab, availablePromos, appliedPromos]);

  const currentPagination = useMemo(() => {
    switch (activeTab) {
      case "available":
        return availablePagination;
      case "applied":
        return appliedPagination;
      default:
        return availablePagination;
    }
  }, [activeTab, availablePagination, appliedPagination]);

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
          status === "Available" ? setAvailablePagination :
          setAppliedPagination;
        
        setPagination((prev) => ({ ...prev, isLoadingMore: true }));
      }

      const response = await apiService.getUserPromos(status, pageNo, 10);
      
      if (response.data.isSuccess) {
        // API returns array directly in content, not in content.data
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

        if (status === "Available") {
          updateState(setAvailablePromos, setAvailablePagination);
        } else if (status === "Applied") {
          updateState(setAppliedPromos, setAppliedPagination);
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
        status === "Available" ? setAvailablePagination :
        setAppliedPagination;
      
      setPagination((prev) => ({ ...prev, isLoadingMore: false }));
    }
  };

  // Load all tabs data
  const loadAllPromos = useCallback(async (reset: boolean = false) => {
    await Promise.all([
      loadPromos("Available", 1, reset),
      loadPromos("Applied", 1, reset),
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
  const handleTabChange = (tab: PromoTab) => {
    setActiveTab(tab);
  };

  // Load more data
  const onLoadMore = useCallback(async () => {
    if (currentPagination.hasMore && !currentPagination.isLoadingMore) {
      const status = 
        activeTab === "available" ? "Available" :
        "Applied";
      
      await loadPromos(status, currentPagination.currentPage + 1, false);
    }
  }, [activeTab, currentPagination]);

  // Handle apply promo
  const handleApplyPromo = async (promo: UserPromo) => {
    setSelectedPromo(promo);
    setShowConfirmModal(true);
  };

  const confirmApplyPromo = async () => {
    if (!selectedPromo || !user?.cardNumber) {
      showToast("Unable to apply promo. Please try again.", "error");
      return;
    }

    setIsApplying(selectedPromo.id);
    setShowConfirmModal(false);

    try {
      const response = await apiService.applyPromo({
        promoId: selectedPromo.promoId,
        cardNumber: user.cardNumber,
      });

      if (response.data.isSuccess) {
        showToast(UI_TEXTS.TOAST_MESSAGES.APPLY_SUCCESS, "success");
        // Refresh the promos to update the lists
        await loadAllPromos(true);
      } else {
        showToast(response.data.message || UI_TEXTS.TOAST_MESSAGES.APPLY_FAILED, "error");
      }
    } catch (error: any) {
      console.error("Failed to apply promo:", error);
      const errorMessage = error.response?.data?.data?.message || UI_TEXTS.TOAST_MESSAGES.APPLY_FAILED;
      showToast(errorMessage, "error");
    } finally {
      setIsApplying(null);
      setSelectedPromo(null);
    }
  };

  // Render tab buttons
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "available" && styles.activeTab,
        ]}
        onPress={() => handleTabChange("available")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "available" && styles.activeTabText,
          ]}
        >
          {UI_TEXTS.TABS.AVAILABLE}
        </Text>
        {availablePromos.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{availablePromos.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === "applied" && styles.activeTab,
        ]}
        onPress={() => handleTabChange("applied")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "applied" && styles.activeTabText,
          ]}
        >
          {UI_TEXTS.TABS.APPLIED}
        </Text>
        {appliedPromos.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{appliedPromos.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render promo item
  const renderPromoItem = ({ item, index }: { item: UserPromo; index: number }) => {
    const promo = item.promo;
    const isExpired = new Date(promo.endTime) < new Date();
    const discountText = promo.promoType === "Fixed" 
      ? `৳${promo.discountValue}` 
      : `${promo.discountValue}%`;
    const maxDiscountText = promo.maxDiscountAmount > 0 
      ? ` (Max ৳${promo.maxDiscountAmount})` 
      : "";

    return (
      <Animated.View
        entering={FadeInDown.duration(400).delay(index * 50)}
      >
        <Card style={[styles.promoCard, isExpired && styles.expiredCard]}>
          <View style={styles.promoHeader}>
            <View style={styles.promoCodeContainer}>
              <Ionicons name="pricetag" size={20} color={COLORS.primary} />
              <Text style={styles.promoCode}>{promo.code}</Text>
            </View>
            <View style={[styles.discountBadge, isExpired && styles.expiredBadge]}>
              <Text style={styles.discountText}>{discountText}{maxDiscountText}</Text>
            </View>
          </View>

          {promo.description && (
            <Text style={styles.promoDescription}>{promo.description}</Text>
          )}

          {promo.status && (
            <View style={styles.promoStatusContainer}>
              <View style={[
                styles.promoStatusBadge,
                promo.status === "Active" && { backgroundColor: COLORS.success + "20" },
                promo.status === "Available Soon" && { backgroundColor: COLORS.info + "20" },
                promo.status === "Expired" && { backgroundColor: COLORS.gray[300] + "20" },
              ]}>
                <Text style={[
                  styles.promoStatusText,
                  promo.status === "Active" && { color: COLORS.success },
                  promo.status === "Available Soon" && { color: COLORS.info },
                  promo.status === "Expired" && { color: COLORS.gray[500] },
                ]}>
                  {promo.status}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.promoDetails}>
            <View style={styles.promoDetailRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.gray[500]} />
              <Text style={styles.promoDetailText}>
                {UI_TEXTS.LABELS.VALID_UNTIL}: {formatDate(promo.endTime)}
              </Text>
            </View>

            {promo.maxUsagePerCard > 0 && (
              <View style={styles.promoDetailRow}>
                <Ionicons name="repeat-outline" size={14} color={COLORS.gray[500]} />
                <Text style={styles.promoDetailText}>
                  {UI_TEXTS.LABELS.MAX_USES}: {promo.maxUsagePerCard}
                </Text>
              </View>
            )}

            {item.usageCount !== undefined && (
              <View style={styles.promoDetailRow}>
                <Ionicons name="checkmark-done-outline" size={14} color={COLORS.gray[500]} />
                <Text style={styles.promoDetailText}>
                  Used: {item.usageCount} / {promo.maxUsagePerCard}
                </Text>
              </View>
            )}
          </View>

          {activeTab === "available" && (
            <TouchableOpacity
              style={[
                styles.applyButton,
                (isExpired || isApplying === item.id) && styles.applyButtonDisabled,
              ]}
              onPress={() => handleApplyPromo(item)}
              disabled={isExpired || isApplying === item.id}
            >
              {isApplying === item.id ? (
                <>
                  <ActivityIndicator size="small" color={COLORS.white} />
                  <Text style={styles.applyButtonText}>
                    {UI_TEXTS.LOADING_STATES.APPLYING_PROMO}
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                  <Text style={styles.applyButtonText}>
                    {isExpired ? "Expired" : UI_TEXTS.BUTTONS.APPLY}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {activeTab === "applied" && (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.statusText}>{UI_TEXTS.BUTTONS.APPLIED}</Text>
            </View>
          )}


        </Card>
      </Animated.View>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    const getMessage = () => {
      switch (activeTab) {
        case "available":
          return UI_TEXTS.EMPTY_STATES.AVAILABLE_MESSAGE;
        case "applied":
          return UI_TEXTS.EMPTY_STATES.APPLIED_MESSAGE;
        default:
          return UI_TEXTS.EMPTY_STATES.AVAILABLE_MESSAGE;
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

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmModal}
        title={UI_TEXTS.CONFIRMATION.TITLE}
        message={`${UI_TEXTS.CONFIRMATION.MESSAGE}\n\nCode: ${selectedPromo?.promo?.code}`}
        confirmText={UI_TEXTS.CONFIRMATION.CONFIRM}
        cancelText={UI_TEXTS.CONFIRMATION.CANCEL}
        onConfirm={confirmApplyPromo}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedPromo(null);
        }}
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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
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
    opacity: 0.6,
    backgroundColor: COLORS.gray[100],
  },
  promoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  promoCodeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    flex: 1,
  },
  promoCode: {
    ...TYPOGRAPHY.h6,
    color: COLORS.secondary,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
  },
  expiredBadge: {
    backgroundColor: COLORS.gray[300] + "20",
  },
  discountText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.success,
    fontWeight: "700",
  },
  promoDescription: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.gray[600],
    marginBottom: SPACING.sm,
  },
  promoStatusContainer: {
    marginBottom: SPACING.sm,
  },
  promoStatusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 4,
    backgroundColor: COLORS.gray[200],
  },
  promoStatusText: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.gray[600],
  },
  promoDetails: {
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  promoDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  promoDetailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray[500],
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  applyButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  applyButtonText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.white,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
  },
  usedBadge: {
    opacity: 0.7,
  },
  statusText: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.success,
    fontWeight: "600",
  },
  usedText: {
    color: COLORS.gray[500],
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
