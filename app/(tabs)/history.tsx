import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { FlatList, Linking, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
    loadTransactions, 
    loadTrips, 
    isLoading 
  } = useCardStore();

  const [activeTab, setActiveTab] = useState<HistoryTab>('trips');

  useEffect(() => {
    loadTransactions();
    loadTrips();
  }, []);

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

  const renderTripItem = ({ item }: any) => (
    <Card variant="elevated" style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.busIconContainer}>
            <Ionicons name="bus" size={20} color={COLORS.white} />
          </View>
          <View>
            <Text variant="label" color={COLORS.gray[900]} style={styles.cardTitle}>
              Bus #{item.busNumber}
            </Text>
            <Text variant="caption" color={COLORS.gray[500]} style={styles.cardDate}>
              {formatDate(new Date(item.tapInTime))}
            </Text>
          </View>
        </View>
        <Text variant="h6" color={COLORS.error} style={styles.fareAmount}>
          -৳{item.fareAmount?.toFixed(2) || '0.00'}
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
              onPress={() => item.tapInLocation && openMapLocation(
                item.tapInLocation.latitude,
                item.tapInLocation.longitude,
                'Tap In Location'
              )}
            >
              <Ionicons name="time" size={14} color={COLORS.primary} />
              <Text variant="bodySmall" color={COLORS.gray[700]} style={styles.timeText}>
                {new Date(item.tapInTime).toLocaleTimeString()}
              </Text>
              {item.tapInLocation && (
                <Ionicons name="location" size={14} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>

          {item.tapOutTime && (
            <View style={styles.timeItem}>
              <Text variant="caption" color={COLORS.gray[600]} style={styles.timeLabel}>
                Tap Out
              </Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => item.tapOutLocation && openMapLocation(
                  item.tapOutLocation.latitude,
                  item.tapOutLocation.longitude,
                  'Tap Out Location'
                )}
              >
                <Ionicons name="time" size={14} color={COLORS.primary} />
                <Text variant="bodySmall" color={COLORS.gray[700]} style={styles.timeText}>
                  {new Date(item.tapOutTime).toLocaleTimeString()}
                </Text>
                {item.tapOutLocation && (
                  <Ionicons name="location" size={14} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>        {item.distanceKm && item.tapInLocation && item.tapOutLocation && (
          <TouchableOpacity
            style={styles.distanceButton}
            onPress={() => openRouteMap(
              item.tapInLocation.latitude,
              item.tapInLocation.longitude,
              item.tapOutLocation.latitude,
              item.tapOutLocation.longitude
            )}
          >
            <Ionicons name="map" size={14} color={COLORS.primary} />
            <Text variant="bodySmall" color={COLORS.primary} style={styles.distanceText}>
              Distance: {item.distanceKm}km (View Route)
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderRechargeItem = ({ item }: any) => {
    // Show both recharge and fare deduction transactions
    if (item.transactionType !== 'recharge' && item.transactionType !== 'fare_deduction') return null;

    const getChannelInfo = (description: string, transactionType: string) => {
      if (transactionType === 'fare_deduction') {
        return { channel: 'Fare', name: 'Bus Fare', icon: 'remove-circle' as const };
      } else if (description?.toLowerCase().includes('bkash')) {
        return { channel: 'MFS', name: 'bKash', icon: 'phone-portrait' as const };
      } else if (description?.toLowerCase().includes('nagad')) {
        return { channel: 'MFS', name: 'Nagad', icon: 'phone-portrait' as const };
      } else if (description?.toLowerCase().includes('card')) {
        return { channel: 'CARD', name: 'Card Payment', icon: 'card' as const };
      } else if (description?.toLowerCase().includes('mobile')) {
        return { channel: 'Mobile', name: 'Mobile Recharge', icon: 'phone-portrait' as const };
      } else {
        return { channel: 'Other', name: 'Manual Recharge', icon: 'add-circle' as const };
      }
    };

    const channelInfo = getChannelInfo(item.description || '', item.transactionType);
    const isDeduction = item.transactionType === 'fare_deduction';
    const amountColor = isDeduction ? COLORS.error : COLORS.success;
    const amountPrefix = isDeduction ? '-' : '+';

    return (
      <Card variant="elevated" style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.rechargeIconContainer, isDeduction && styles.deductionIconContainer]}>
              <Ionicons name={channelInfo.icon} size={20} color={COLORS.white} />
            </View>
            <View>
              <Text variant="label" color={COLORS.gray[900]} style={styles.cardTitle}>
                {channelInfo.name}
              </Text>
              <Text variant="caption" color={COLORS.gray[500]} style={styles.cardSubtitle}>
                {isDeduction ? 'Deduction' : channelInfo.channel}
              </Text>
            </View>
          </View>
          <Text variant="h6" color={amountColor} style={styles.rechargeAmount}>
            {amountPrefix}৳{Math.abs(item.amount).toFixed(2)}
          </Text>
        </View>

        <View style={styles.rechargeDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={14} color={COLORS.gray[500]} />
            <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.detailText}>
              {formatDate(new Date(item.createdAt))}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={14} color={COLORS.gray[500]} />
            <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.detailText}>
              {new Date(item.createdAt).toLocaleTimeString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="wallet" size={14} color={COLORS.gray[500]} />
            <Text variant="bodySmall" color={COLORS.gray[600]} style={styles.detailText}>
              Balance After: ৳{item.balanceAfter.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };
  const renderTabContent = () => {
    if (activeTab === 'trips') {
      return (
        <FlatList
          data={trips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
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
      const rechargeTransactions = transactions.filter(t => t.transactionType === 'recharge' || t.transactionType === 'fare_deduction');
      return (
        <FlatList
          data={rechargeTransactions}
          renderItem={renderRechargeItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Card>
              <View style={styles.emptyContainer}>
                <Ionicons name="card-outline" size={48} color={COLORS.gray[400]} />
                <Text variant="h6" color={COLORS.gray[600]} style={styles.emptyText}>
                  No transaction history found
                </Text>
                <Text variant="body" color={COLORS.gray[500]} style={styles.emptySubtext}>
                  Your transactions will appear here
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
              Transactions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.tabContent}>
          {renderTabContent()}
        </Animated.View>
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
});
