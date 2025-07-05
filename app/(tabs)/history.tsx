import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, RefreshControl, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '../../components/ui/Card';
import { Text } from '../../components/ui/Text';
import { useCardStore } from '../../stores/cardStore';
import { COLORS, SPACING } from '../../utils/constants';

type HistoryTab = 'trips' | 'recharge';

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

  const [activeTab, setActiveTab] = useState<HistoryTab>('trips');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    console.log('🔄 [HISTORY COMPONENT] Component mounted, loading history...');
    loadHistory(1, true);
  }, []);

  useEffect(() => {
    console.log('📊 [HISTORY COMPONENT] Data updated:', {
      transactionsCount: transactions.length,
      tripsCount: trips.length,
      isLoading,
      error,
      historyPagination
    });
  }, [transactions, trips, isLoading, error, historyPagination]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory(1, true);
    setRefreshing(false);
  }, [loadHistory]);

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

    return (
      <Card variant="elevated" style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.busIconContainer}>
              <Ionicons name="bus" size={20} color={COLORS.white} />
            </View>
            <View>
              <Text variant="label" color={COLORS.gray[900]} style={styles.cardTitle}>
                Trip #{trip.id.slice(-8)}
              </Text>
              <Text variant="caption" color={COLORS.gray[500]} style={styles.cardDate}>
                {formatDate(new Date(trip.tripStartTime))}
              </Text>
            </View>
          </View>
          <Text variant="h6" color={COLORS.error} style={styles.fareAmount}>
            -৳{trip.amount?.toFixed(2) || '0.00'}
          </Text>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <Text variant="caption" color={COLORS.gray[600]} style={styles.timeLabel}>
                Tap In
              </Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => openMapLocation(
                  parseFloat(trip.startingLatitude),
                  parseFloat(trip.startingLongitude),
                  'Tap In Location'
                )}
              >
                <Ionicons name="time" size={14} color={COLORS.primary} />
                <Text variant="bodySmall" color={COLORS.gray[700]} style={styles.timeText}>
                  {new Date(trip.tripStartTime).toLocaleTimeString()}
                </Text>
                <Ionicons name="location" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {trip.tripEndTime && (
              <View style={styles.timeItem}>
                <Text variant="caption" color={COLORS.gray[600]} style={styles.timeLabel}>
                  Tap Out
                </Text>
                <TouchableOpacity
                  style={styles.timeButton}
                  onPress={() => openMapLocation(
                    parseFloat(trip.endingLatitude),
                    parseFloat(trip.endingLongitude),
                    'Tap Out Location'
                  )}
                >
                  <Ionicons name="time" size={14} color={COLORS.primary} />
                  <Text variant="bodySmall" color={COLORS.gray[700]} style={styles.timeText}>
                    {new Date(trip.tripEndTime).toLocaleTimeString()}
                  </Text>
                  <Ionicons name="location" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {trip.distance > 0 && (
            <TouchableOpacity
              style={styles.distanceButton}
              onPress={() => openRouteMap(
                parseFloat(trip.startingLatitude),
                parseFloat(trip.startingLongitude),
                parseFloat(trip.endingLatitude),
                parseFloat(trip.endingLongitude)
              )}
            >
              <Ionicons name="map" size={14} color={COLORS.primary} />
              <Text variant="bodySmall" color={COLORS.primary} style={styles.distanceText}>
                Distance: {trip.distance.toFixed(2)}km (View Route)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  const renderRechargeItem = ({ item }: { item: any }) => {
    // Only show recharge transactions (incoming money)
    if (item.transactionType !== 'Recharge') return null;

    return (
      <Card variant="elevated" style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.rechargeIconContainer}>
              <Ionicons name="add-circle" size={20} color={COLORS.white} />
            </View>
            <View>
              <Text variant="label" color={COLORS.gray[900]} style={styles.cardTitle}>
                Recharge
              </Text>
              <Text variant="caption" color={COLORS.gray[500]} style={styles.cardSubtitle}>
                {item.agent?.name || 'Manual Recharge'}
              </Text>
            </View>
          </View>
          <Text variant="h6" color={COLORS.success} style={styles.rechargeAmount}>
            +৳{item.amount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.rechargeDetails}>
          {item.agent && (
            <View style={styles.detailRow}>
              <Ionicons name="person" size={14} color={COLORS.gray[500]} />
              <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.detailText}>
                Agent: {item.agent.name}
              </Text>
            </View>
          )}
          {item.agent?.organization && (
            <View style={styles.detailRow}>
              <Ionicons name="business" size={14} color={COLORS.gray[500]} />
              <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.detailText}>
                Organization: {item.agent.organization.name || 'N/A'}
              </Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={14} color={COLORS.gray[500]} />
            <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.detailText}>
              {formatDate(new Date(item.createTime))}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={14} color={COLORS.gray[500]} />
            <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.detailText}>
              {new Date(item.createTime).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </Card>
    );
  };
  const renderTabContent = () => {
    console.log('🎨 [HISTORY COMPONENT] Rendering tab content for:', activeTab);
    console.log('📊 [HISTORY COMPONENT] Available data:', {
      totalTransactions: transactions.length,
      totalTrips: trips.length,
      isLoading,
      historyPagination
    });
    
    if (activeTab === 'trips') {
      const tripTransactions = transactions.filter(t => t.transactionType === 'BusFare' && t.trip);
      console.log('🚌 [HISTORY COMPONENT] Trip transactions filtered:', tripTransactions.length);
      
      return (
        <FlatList
          data={tripTransactions}
          renderItem={renderTripItem}
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
                  Loading more trips...
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Card>
              <View style={styles.emptyContainer}>
                <Ionicons name="bus-outline" size={48} color={COLORS.gray[400]} />
                <Text variant="h6" color={COLORS.gray[600]} style={styles.emptyText}>
                  No trip history found
                </Text>
                <Text variant="body" color={COLORS.gray[500]} style={styles.emptySubtext}>
                  Your bus trips will appear here
                </Text>
              </View>
            </Card>
          }
        />
      );
    } else {
      const rechargeTransactions = transactions.filter(t => t.transactionType === 'Recharge'); // Only show recharge transactions
      console.log('💳 [HISTORY COMPONENT] Recharge transactions for recharge tab:', rechargeTransactions.length);
      
      return (
        <FlatList
          data={rechargeTransactions}
          renderItem={renderRechargeItem}
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
                  Loading more recharges...
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Card>
              <View style={styles.emptyContainer}>
                <Ionicons name="card-outline" size={48} color={COLORS.gray[400]} />
                <Text variant="h6" color={COLORS.gray[600]} style={styles.emptyText}>
                  No recharge history found
                </Text>
                <Text variant="body" color={COLORS.gray[500]} style={styles.emptySubtext}>
                  Your recharge history will appear here
                </Text>
              </View>
            </Card>
          }
        />
      );
    }
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },  content: {
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
    backgroundColor: COLORS.gray[50],
    borderRadius: 6,
  },
  timeText: {
    // Font properties handled by Text component
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
});
