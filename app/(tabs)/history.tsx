import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../../components/ui/Card';
import { Text } from '../../components/ui/Text';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';
import { useCardStore } from '../../stores/cardStore';
import { COLORS, SPACING } from '../../utils/constants';

type HistoryTab = 'trips' | 'recharge';

type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';
type SortOrder = 'newest' | 'oldest' | 'amount_high' | 'amount_low';

interface FilterOptions {
  dateFilter: DateFilter;
  sortOrder: SortOrder;
  customStartDate?: Date;
  customEndDate?: Date;
  minAmount?: number;
  maxAmount?: number;
}

export default function History() {
  const { 
    transactions, 
    trips, 
    loadHistory, 
    loadMoreHistory,
    isLoading,
    error,
    historyPagination
  } = useCardStore();

  // Use token refresh hook to get fresh data
  const { isRefreshing, refreshAllData } = useTokenRefresh();

  const [activeTab, setActiveTab] = useState<HistoryTab>('trips');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateFilter: 'all',
    sortOrder: 'newest',
  });
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHistory(1, true);
  }, []);

  // Filter and sort data based on current filters
  useEffect(() => {
    let data = activeTab === 'trips' 
      ? transactions.filter(t => t.transactionType === 'BusFare' && t.trip)
      : transactions.filter(t => t.transactionType === 'Recharge');

    // Apply date filter
    if (filters.dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      data = data.filter(item => {
        const dateString = item.createTime || item.trip?.tripStartTime;
        if (!dateString) return false;
        const itemDate = new Date(dateString);
        
        switch (filters.dateFilter) {
          case 'today':
            return itemDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return itemDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return itemDate >= monthAgo;
          case 'custom':
            if (filters.customStartDate && filters.customEndDate) {
              return itemDate >= filters.customStartDate && itemDate <= filters.customEndDate;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Apply amount filter
    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      data = data.filter(item => {
        const amount = item.amount || item.trip?.amount || 0;
        const minCheck = filters.minAmount === undefined || amount >= filters.minAmount;
        const maxCheck = filters.maxAmount === undefined || amount <= filters.maxAmount;
        return minCheck && maxCheck;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      data = data.filter(item => {
        const searchLower = searchQuery.toLowerCase();
        const tripId = item.trip?.id?.toString() || '';
        const agentName = item.agent?.name || '';
        const orgName = (item.agent as any)?.organization?.name || item.agent?.address || '';
        const amount = (item.amount || item.trip?.amount || 0).toString();
        
        return tripId.toLowerCase().includes(searchLower) ||
               agentName.toLowerCase().includes(searchLower) ||
               orgName.toLowerCase().includes(searchLower) ||
               amount.includes(searchQuery);
      });
    }

    // Apply sorting
    data.sort((a, b) => {
      const aDateString = a.createTime || a.trip?.tripStartTime;
      const bDateString = b.createTime || b.trip?.tripStartTime;
      if (!aDateString || !bDateString) return 0;
      
      const aDate = new Date(aDateString);
      const bDate = new Date(bDateString);
      const aAmount = a.amount || a.trip?.amount || 0;
      const bAmount = b.amount || b.trip?.amount || 0;

      switch (filters.sortOrder) {
        case 'oldest':
          return aDate.getTime() - bDate.getTime();
        case 'amount_high':
          return bAmount - aAmount;
        case 'amount_low':
          return aAmount - bAmount;
        case 'newest':
        default:
          return bDate.getTime() - aDate.getTime();
      }
    });

    setFilteredData(data);
    console.log('📊 [HISTORY COMPONENT] Filtered data:', data.length);
  }, [transactions, activeTab, filters, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAllData();
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAllData]);

  const onLoadMore = useCallback(async () => {
    if (historyPagination.hasMore && !historyPagination.isLoadingMore) {
      await loadMoreHistory();
    }
  }, [historyPagination.hasMore, historyPagination.isLoadingMore, loadMoreHistory]);

  const openMapLocation = (latitude: number, longitude: number, label: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const openRouteMap = (startLat: number, startLng: number, endLat: number, endLng: number) => {
    const url = `https://www.google.com/maps/dir/${startLat},${startLng}/${endLat},${endLng}`;
    Linking.openURL(url);
  };

  const getDateFilterLabel = (filter: DateFilter) => {
    switch (filter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'custom': return 'Custom Range';
      default: return 'All Time';
    }
  };

  const getSortOrderLabel = (sort: SortOrder) => {
    switch (sort) {
      case 'oldest': return 'Oldest First';
      case 'amount_high': return 'Amount: High to Low';
      case 'amount_low': return 'Amount: Low to High';
      default: return 'Newest First';
    }
  };

  const resetFilters = () => {
    setFilters({
      dateFilter: 'all',
      sortOrder: 'newest',
    });
  };

  const applyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setShowFilterModal(false);
  };

  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const renderTripItem = ({ item }: { item: any }) => {
    // Handle both direct trip objects and transactions with trip data
    const trip = item.trip || item;
    const transaction = item.transactionType ? item : null;
    
    if (!trip) return null;

    // Safety checks for required data
    const busName = trip.session?.bus?.busName || 'Bus Name Not Available';
    const busNumber = trip.session?.bus?.busNumber || 'N/A';
    const organization = trip.session?.bus?.organization;
    const sessionCode = trip.session?.sessionCode || 'N/A';
    const tripAmount = trip.amount || 0;
    const tripStartTime = trip.tripStartTime;
    const tripEndTime = trip.tripEndTime;
    const distance = trip.distance || 0;

    return (
      <Card variant="elevated" style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.busIconContainer}>
              <Ionicons name="bus" size={20} color={COLORS.white} />
            </View>
            <View>
              <Text variant="label" color={COLORS.gray[900]} style={styles.cardTitle}>
                {busName}
              </Text>
              <Text variant="caption" color={COLORS.gray[600]} style={styles.cardSubtitle}>
                {busNumber}
              </Text>
              {organization && (
                <Text variant="caption" color={COLORS.gray[500]} style={styles.cardSubtitle}>
                  {organization.name} ({organization.code})
                </Text>
              )}
              <Text variant="caption" color={COLORS.gray[500]} style={styles.cardDate}>
                {tripStartTime ? formatDate(new Date(tripStartTime)) : 'N/A'}
              </Text>
            </View>
          </View>
          <Text variant="h6" color={COLORS.error} style={styles.fareAmount}>
            -৳{tripAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.tripDetails}>

          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <Text variant="caption" color={COLORS.gray[600]} style={styles.timeLabel}>
                Tap In
              </Text>
              <TouchableOpacity
                style={styles.tapInButton}
                onPress={() => {
                  if (trip.startingLatitude && trip.startingLongitude) {
                    openMapLocation(
                      parseFloat(trip.startingLatitude),
                      parseFloat(trip.startingLongitude),
                      'Tap In Location'
                    );
                  }
                }}
                disabled={!trip.startingLatitude || !trip.startingLongitude}
              >
                <Ionicons name="time" size={14} color={COLORS.success} />
                <Text variant="bodySmall" color={COLORS.white} style={styles.timeText}>
                  {tripStartTime ? new Date(new Date(tripStartTime).getTime() + 6 * 60 * 60 * 1000).toLocaleTimeString() : 'N/A'}
                </Text>
                <Ionicons name="location" size={14} color={COLORS.success} />
              </TouchableOpacity>
            </View>

            {tripEndTime && (
              <View style={styles.timeItem}>
                <Text variant="caption" color={COLORS.gray[600]} style={styles.timeLabel}>
                  Tap Out
                </Text>
                <TouchableOpacity
                  style={styles.tapOutButton}
                  onPress={() => {
                    if (trip.endingLatitude && trip.endingLongitude) {
                      openMapLocation(
                        parseFloat(trip.endingLatitude),
                        parseFloat(trip.endingLongitude),
                        'Tap Out Location'
                      );
                    }
                  }}
                  disabled={!trip.endingLatitude || !trip.endingLongitude}
                >
                  <Ionicons name="time" size={14} color={COLORS.error} />
                  <Text variant="bodySmall" color={COLORS.white} style={styles.timeText}>
                    {tripEndTime ? new Date(new Date(tripEndTime).getTime() + 6 * 60 * 60 * 1000).toLocaleTimeString() : 'N/A'}
                  </Text>
                  <Ionicons name="location" size={14} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>

                    <TouchableOpacity
            style={styles.distanceButton}
            onPress={() => {
              if (distance > 0 && trip.startingLatitude && trip.startingLongitude && trip.endingLatitude && trip.endingLongitude) {
                openRouteMap(
                  parseFloat(trip.startingLatitude),
                  parseFloat(trip.startingLongitude),
                  parseFloat(trip.endingLatitude),
                  parseFloat(trip.endingLongitude)
                );
              }
            }}
            disabled={distance === 0 || !trip.startingLatitude || !trip.startingLongitude || !trip.endingLatitude || !trip.endingLongitude}
          >
            <Ionicons name="map" size={14} color={distance > 0 && trip.startingLatitude && trip.startingLongitude && trip.endingLatitude && trip.endingLongitude ? COLORS.primary : COLORS.gray[400]} />
            <Text variant="bodySmall" color={distance > 0 && trip.startingLatitude && trip.startingLongitude && trip.endingLatitude && trip.endingLongitude ? COLORS.primary : COLORS.gray[600]} style={styles.distanceText}>
              Distance: {distance.toFixed(2)}km {distance > 0 && trip.startingLatitude && trip.startingLongitude && trip.endingLatitude && trip.endingLongitude ? '(View Route)' : ''}
            </Text>
          </TouchableOpacity>

          {/* Tap Out By Section */}
          {tripEndTime && (
            <View style={styles.tapOutBySection}>
              <Text variant="caption" color={COLORS.gray[600]} style={styles.sectionLabel}>
                Tap Out By
              </Text>
              <View style={styles.tapOutByContainer}>
                <View style={styles.tapOutByItemPassenger}>
                  <Ionicons name="person" size={14} color={COLORS.primary} />
                  <Text variant="bodySmall" color={COLORS.gray[700]} style={styles.tapOutByText}>
                    Passenger
                  </Text>
                </View>
                <View style={styles.tapOutByItemManual}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                  <Text variant="bodySmall" color={COLORS.success} style={styles.tapOutByText}>
                    Manual
                  </Text>
                </View>
              </View>
            </View>
          )}
          
        </View>
      </Card>
    );
  };

  const renderRechargeItem = ({ item }: { item: any }) => {
    // Only show recharge transactions (incoming money)
    if (item.transactionType !== 'Recharge') return null;

    const agent = item.agent;
    const organization = agent?.organization;

    return (
      <Card variant="elevated" style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.rechargeIconContainer}>
              <Ionicons name="add-circle" size={20} color={COLORS.white} />
            </View>
            <View>
              <Text variant="label" color={COLORS.gray[900]} style={styles.cardTitle}>
                {agent?.name || 'Manual Recharge'}
              </Text>
              {organization && (
                <Text variant="caption" color={COLORS.gray[500]} style={styles.cardSubtitle}>
                  {organization.name} ({organization.code})
                </Text>
              )}
            </View>
          </View>
          <Text variant="h6" color={COLORS.success} style={styles.rechargeAmount}>
            +৳{item.amount?.toFixed(2) || '0.00'}
          </Text>
        </View>

        <View style={styles.rechargeDetails}>
          {/* {organization && (
            <View style={styles.detailRow}>
              <Ionicons name="business" size={14} color={COLORS.gray[500]} />
              <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.detailText}>
                {organization.name} - {organization.organizationType}
              </Text>
            </View>
          )} */}
          {agent?.address && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.gray[500]} />
              <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.detailText}>
                {agent.address}
              </Text>
            </View>
          )}
          <View style={styles.dateTimeRow}>
            <View style={styles.dateTimeItem}>
              <Ionicons name="calendar" size={14} color={COLORS.gray[500]} />
              <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.detailText}>
                {item.createTime ? formatDate(new Date(item.createTime)) : 'N/A'}
              </Text>
            </View>
            <View style={styles.dateTimeItemRight}>
              <Ionicons name="time" size={14} color={COLORS.gray[500]} />
              <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.detailText}>
                {item.createTime ? new Date(new Date(item.createTime).getTime() + 6 * 60 * 60 * 1000).toLocaleTimeString() : 'N/A'}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    );
  };
  const renderTabContent = () => {
    return (
      <FlatList
        data={filteredData}
        renderItem={activeTab === 'trips' ? renderTripItem : renderRechargeItem}
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
          historyPagination.isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.loadingText}>
                Loading more {activeTab === 'trips' ? 'trips' : 'recharges'}...
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <Card>
            <View style={styles.emptyContainer}>
              <Ionicons 
                name={activeTab === 'trips' ? 'bus-outline' : 'card-outline'} 
                size={48} 
                color={COLORS.gray[400]} 
              />
              <Text variant="h6" color={COLORS.gray[600]} style={styles.emptyText}>
                No {activeTab === 'trips' ? 'trip' : 'recharge'} history found
              </Text>
              <Text variant="body" color={COLORS.gray[500]} style={styles.emptySubtext}>
                {searchQuery 
                  ? `No results found for "${searchQuery}"`
                  : (filters.dateFilter !== 'all' || filters.minAmount !== undefined || filters.maxAmount !== undefined)
                    ? 'Try adjusting your filters'
                    : `Your ${activeTab === 'trips' ? 'bus trips' : 'recharge history'} will appear here`}
              </Text>
              {(searchQuery || filters.dateFilter !== 'all' || filters.minAmount !== undefined || filters.maxAmount !== undefined) && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchQuery('');
                    resetFilters();
                  }}
                >
                  <Text variant="labelSmall" color={COLORS.primary}>
                    Clear {searchQuery ? 'Search & Filters' : 'Filters'}
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
            <Text variant="h6" color={COLORS.gray[900]} style={styles.modalTitle}>
              Filter {activeTab === 'trips' ? 'Trips' : 'Recharges'}
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
              <Text variant="label" color={COLORS.gray[700]} style={styles.sectionTitle}>
                Date Range
              </Text>
              <View style={styles.filterOptions}>
                {(['all', 'today', 'week', 'month'] as DateFilter[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      tempFilters.dateFilter === option && styles.filterOptionActive
                    ]}
                    onPress={() => setTempFilters({...tempFilters, dateFilter: option})}
                  >
                    <Text
                      variant="bodySmall"
                      color={tempFilters.dateFilter === option ? COLORS.white : COLORS.gray[700]}
                    >
                      {getDateFilterLabel(option)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort Order */}
            <View style={styles.filterSection}>
              <Text variant="label" color={COLORS.gray[700]} style={styles.sectionTitle}>
                Sort By
              </Text>
              <View style={styles.filterOptions}>
                {(['newest', 'oldest', 'amount_high', 'amount_low'] as SortOrder[]).map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterOption,
                      tempFilters.sortOrder === option && styles.filterOptionActive
                    ]}
                    onPress={() => setTempFilters({...tempFilters, sortOrder: option})}
                  >
                    <Text
                      variant="bodySmall"
                      color={tempFilters.sortOrder === option ? COLORS.white : COLORS.gray[700]}
                    >
                      {getSortOrderLabel(option)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Amount Range */}
            <View style={styles.filterSection}>
              <Text variant="label" color={COLORS.gray[700]} style={styles.sectionTitle}>
                Amount Range (৳)
              </Text>
              <View style={styles.amountInputs}>
                <View style={styles.amountInput}>
                  <Text variant="bodySmall" color={COLORS.gray[600]}>Min</Text>
                  <TouchableOpacity
                    style={styles.amountButton}
                    onPress={() => {
                      // For now, just clear the min amount
                      setTempFilters({...tempFilters, minAmount: undefined});
                    }}
                  >
                    <Text variant="bodySmall" color={COLORS.gray[700]}>
                      {tempFilters.minAmount || 'Any'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.amountInput}>
                  <Text variant="bodySmall" color={COLORS.gray[600]}>Max</Text>
                  <TouchableOpacity
                    style={styles.amountButton}
                    onPress={() => {
                      // For now, just clear the max amount
                      setTempFilters({...tempFilters, maxAmount: undefined});
                    }}
                  >
                    <Text variant="bodySmall" color={COLORS.gray[700]}>
                      {tempFilters.maxAmount || 'Any'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Quick amount filters */}
              <View style={styles.quickFilters}>
                <Text variant="caption" color={COLORS.gray[600]} style={styles.quickFiltersLabel}>
                  Quick filters:
                </Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => setTempFilters({...tempFilters, minAmount: undefined, maxAmount: 50})}
                  >
                    <Text variant="bodySmall" color={COLORS.gray[700]}>
                      Under ৳50
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => setTempFilters({...tempFilters, minAmount: 50, maxAmount: 100})}
                  >
                    <Text variant="bodySmall" color={COLORS.gray[700]}>
                      ৳50-100
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => setTempFilters({...tempFilters, minAmount: 100, maxAmount: undefined})}
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Tab Headers */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'trips' && styles.activeTab]}
            onPress={() => setActiveTab('trips')}
          >
            <Ionicons 
              name="bus" 
              size={20} 
              color={activeTab === 'trips' ? COLORS.white : COLORS.gray[600]} 
            />
            <Text 
              variant="labelSmall"
              color={activeTab === 'trips' ? COLORS.white : COLORS.gray[600]}
              style={styles.tabText}
            >
              Trip History
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'recharge' && styles.activeTab]}
            onPress={() => setActiveTab('recharge')}
          >
            <Ionicons 
              name="card" 
              size={20} 
              color={activeTab === 'recharge' ? COLORS.white : COLORS.gray[600]} 
            />
            <Text 
              variant="labelSmall"
              color={activeTab === 'recharge' ? COLORS.white : COLORS.gray[600]}
              style={styles.tabText}
            >
              Recharge History
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={COLORS.gray[500]} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${activeTab === 'trips' ? 'trips' : 'recharges'}...`}
              placeholderTextColor={COLORS.gray[500]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.gray[500]} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Header */}
        <Animated.View entering={FadeInDown.delay(200)} style={styles.filterHeader}>
          <View style={styles.filterInfo}>
            <Text variant="bodySmall" color={COLORS.gray[600]}>
              {filteredData.length} {activeTab === 'trips' ? 'trips' : 'recharges'}
              {searchQuery && (
                <Text variant="bodySmall" color={COLORS.primary}>
                  {' '}• "{searchQuery}"
                </Text>
              )}
              {filters.dateFilter !== 'all' && (
                <Text variant="bodySmall" color={COLORS.primary}>
                  {' '}• {getDateFilterLabel(filters.dateFilter)}
                </Text>
              )}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.filterButton,
              (filters.dateFilter !== 'all' || filters.minAmount !== undefined || filters.maxAmount !== undefined) && 
              styles.filterButtonActive
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons 
              name="funnel" 
              size={16} 
              color={filters.dateFilter !== 'all' || filters.minAmount !== undefined || filters.maxAmount !== undefined 
                ? COLORS.white 
                : COLORS.gray[600]} 
            />
            <Text 
              variant="labelSmall"
              color={filters.dateFilter !== 'all' || filters.minAmount !== undefined || filters.maxAmount !== undefined 
                ? COLORS.white 
                : COLORS.gray[600]}
            >
              Filter
            </Text>
          </TouchableOpacity>
        </Animated.View>

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
                onPress={() => loadHistory(1, true)}
              >
                <Text variant="labelSmall" color={COLORS.primary}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Loading Indicator for Initial Load */}
        {isLoading && transactions.length === 0 && !error && (
          <View style={styles.initialLoading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text variant="body" color={COLORS.gray[600]} style={styles.loadingText}>
              Loading history...
            </Text>
          </View>
        )}

        {/* Tab Content */}
        {(!isLoading || transactions.length > 0) && (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.tabContent}>
            {renderTabContent()}
          </Animated.View>
        )}
      </View>
      
      <FilterModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterInfo: {
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray[100],
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  historyCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  busIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rechargeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deductionIconContainer: {
    backgroundColor: COLORS.error,
  },
  cardTitle: {
    // Font properties handled by Text component
  },
  cardSubtitle: {
    marginTop: 2,
    // Font properties handled by Text component
  },
  cardDate: {
    marginTop: 2,
    // Font properties handled by Text component
  },
  fareAmount: {
    // Font properties handled by Text component
  },
  rechargeAmount: {
    // Font properties handled by Text component
  },
  tripDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: SPACING.md,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    alignItems: 'center',
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: 4,
    // Font properties handled by Text component
    },
    timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: SPACING.xs,
    backgroundColor: COLORS.gray[100],
    borderRadius: 6,
    },
    tapInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: SPACING.xs,
    backgroundColor: '#E8F5E8',
    borderRadius: 6,
    },
    tapOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: SPACING.xs,
    backgroundColor: '#FFE8E8',
    borderRadius: 6,
    },
    timeText: {
    color: COLORS.gray[700],
    // Font properties handled by Text component
  },
  tapOutBySection: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    backgroundColor: '#FAFAFA',
    borderRadius: 6,
  },
  sectionLabel: {
    marginBottom: SPACING.xs,
    fontWeight: '500',
    fontSize: 12,
  },
  tapOutByContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tapOutByItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  tapOutByItemPassenger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD', // Light blue background
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    flex: 1,
  },
  tapOutByItemManual: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    backgroundColor: '#E8F5E8', // Light green background
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    flex: 1,
  },
  tapOutByText: {
    fontWeight: '500',
    fontSize: 12,
  },
  distanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: SPACING.xs,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 6,
    alignSelf: 'flex-start',
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dateTimeItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    // Font properties handled by Text component
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.sm,
    // Font properties handled by Text component
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: 4,
    // Font properties handled by Text component
  },
  clearFiltersButton: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  loadingText: {
    // Font properties handled by Text component
  },
  initialLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  errorContainer: {
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  errorText: {
    textAlign: 'center',
    // Font properties handled by Text component
  },
  retryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.primary + '20',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
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
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    flexDirection: 'row',
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
    flexDirection: 'row',
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
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.gray[100],
  },
  applyButton: {
    backgroundColor: COLORS.primary,
  },
});
