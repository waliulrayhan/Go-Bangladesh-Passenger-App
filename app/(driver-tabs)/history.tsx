import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Linking,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { Card } from '../../components/ui/Card';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, STORAGE_KEYS } from '../../utils/constants';
import { storageService } from '../../utils/storage';

interface SessionData {
  userId: string;
  mobile: string;
  name: string;
  category: 'driver' | 'helper';
  loginTime: string;
}

interface Transaction {
  id: string;
  cardNumber: string;
  passengerName: string;
  type: 'tap_in' | 'tap_out';
  amount: number;
  balance: number;
  location: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  busNumber?: string;
  distanceKm?: number;
}

interface Trip {
  id: string;
  cardNumber: string;
  passengerName: string;
  busNumber: string;
  tapInTime: string;
  tapOutTime?: string;
  tapInLocation: {
    name: string;
    latitude: number;
    longitude: number;
  };
  tapOutLocation?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  fareAmount: number;
  distanceKm?: number;
  finalBalance: number;
}

type HistoryTab = 'trips' | 'stats';

export default function DriverHelperHistory() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HistoryTab>('trips');
  const [todayStats, setTodayStats] = useState({
    tapIns: 0,
    tapOuts: 0,
    totalAmount: 0,
    totalTransactions: 0
  });

  const { user } = useAuthStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const session = await storageService.getItem<SessionData>(STORAGE_KEYS.DRIVER_HELPER_SESSION);
      const bus = await storageService.getItem(STORAGE_KEYS.SELECTED_BUS);
      
      if (session && bus) {
        setSessionData(session);
        setSelectedBus(bus);
        loadMockTransactions();
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockTransactions = () => {
    // Mock passenger RFID card trips on this bus
    const mockTrips: Trip[] = [
      // Completed trip - tap in + tap out (fare charged)
      {
        id: '1',
        cardNumber: 'CARD123456',
        passengerName: 'John Doe',
        busNumber: selectedBus?.busNumber || 'DH-11-1234',
        tapInTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
        tapOutTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
        tapInLocation: {
          name: 'Dhanmondi 27',
          latitude: 23.7475,
          longitude: 90.3758
        },
        tapOutLocation: {
          name: 'Shahbag',
          latitude: 23.7389,
          longitude: 90.3944
        },
        fareAmount: 50, // Fare charged on tap out
        distanceKm: 3.2,
        finalBalance: 675
      },
      // Completed trip - tap in + tap out (fare charged)
      {
        id: '2',
        cardNumber: 'CARD789012',
        passengerName: 'Jane Smith',
        busNumber: selectedBus?.busNumber || 'DH-11-1234',
        tapInTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        tapOutTime: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
        tapInLocation: {
          name: 'TSC',
          latitude: 23.7368,
          longitude: 90.3933
        },
        tapOutLocation: {
          name: 'New Market',
          latitude: 23.7340,
          longitude: 90.3916
        },
        fareAmount: 30, // Fare charged on tap out
        distanceKm: 2.1,
        finalBalance: 150
      },
      // Ongoing trip - tap in only (no fare charged yet)
      {
        id: '3',
        cardNumber: 'CARD345678',
        passengerName: 'Mike Johnson',
        busNumber: selectedBus?.busNumber || 'DH-11-1234',
        tapInTime: new Date(Date.now() - 1000 * 60 * 20).toISOString(), // 20 mins ago
        // No tap out yet - trip ongoing
        tapInLocation: {
          name: 'Nilkhet',
          latitude: 23.7294,
          longitude: 90.3914
        },
        fareAmount: 0, // No fare charged until tap out
        finalBalance: 285 // Current balance (unchanged)
      },
      // Ongoing trip - tap in only (no fare charged yet)
      {
        id: '4',
        cardNumber: 'CARD901234',
        passengerName: 'Sarah Williams',
        busNumber: selectedBus?.busNumber || 'DH-11-1234',
        tapInTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        // No tap out yet - trip ongoing
        tapInLocation: {
          name: 'Dhanmondi 32',
          latitude: 23.7500,
          longitude: 90.3782
        },
        fareAmount: 0, // No fare charged until tap out
        finalBalance: 235 // Current balance (unchanged)
      },
      // Completed trip - tap in + tap out (fare charged)
      {
        id: '5',
        cardNumber: 'CARD567890',
        passengerName: 'Ahmed Rahman',
        busNumber: selectedBus?.busNumber || 'DH-11-1234',
        tapInTime: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
        tapOutTime: new Date(Date.now() - 1000 * 60 * 70).toISOString(), // 1 hour 10 mins ago
        tapInLocation: {
          name: 'Uttara Sector 10',
          latitude: 23.8759,
          longitude: 90.3795
        },
        tapOutLocation: {
          name: 'Farmgate',
          latitude: 23.7588,
          longitude: 90.3895
        },
        fareAmount: 60, // Fare charged on tap out
        distanceKm: 4.5,
        finalBalance: 320
      },
      // Failed trip - tap in + tap out but no fare charged (insufficient balance)
      {
        id: '6',
        cardNumber: 'CARD234567',
        passengerName: 'Fatima Begum',
        busNumber: selectedBus?.busNumber || 'DH-11-1234',
        tapInTime: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
        tapOutTime: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
        tapInLocation: {
          name: 'Gulshan 1',
          latitude: 23.7808,
          longitude: 90.4176
        },
        tapOutLocation: {
          name: 'Banani',
          latitude: 23.7936,
          longitude: 90.4066
        },
        fareAmount: 0, // Failed - no fare charged due to insufficient balance
        distanceKm: 2.8,
        finalBalance: -15 // Negative balance
      }
    ];

    setTrips(mockTrips);
    
    // Calculate today's stats from passenger trips
    const completedTrips = mockTrips.filter(trip => trip.tapOutTime);
    const ongoingTrips = mockTrips.filter(trip => !trip.tapOutTime);
    const totalRevenue = completedTrips.reduce((sum, trip) => sum + trip.fareAmount, 0);
    
    setTodayStats({
      tapIns: mockTrips.length, // Total passengers who tapped in
      tapOuts: completedTrips.length, // Passengers who tapped out
      totalAmount: totalRevenue, // Revenue from completed trips
      totalTransactions: mockTrips.length + completedTrips.length // Total tap actions
    });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCardNumber = (cardNumber: string) => {
    if (cardNumber.length < 4) return cardNumber;
    const lastTwo = cardNumber.slice(-2);
    const firstFour = cardNumber.slice(0, 4);
    return `${firstFour}***${lastTwo}`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const openMapLocation = (latitude: number, longitude: number, label: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const openRouteMap = (startLat: number, startLng: number, endLat: number, endLng: number) => {
    const url = `https://www.google.com/maps/dir/${startLat},${startLng}/${endLat},${endLng}`;
    Linking.openURL(url);
  };

  const renderTripItem = ({ item }: { item: Trip }) => {
    const isOngoing = !item.tapOutTime;
    const isSuccess = item.tapOutTime && item.fareAmount > 0;
    const isFailed = item.tapOutTime && item.fareAmount === 0;
    
    let cardBackgroundColor = COLORS.white;
    let cardBorderColor = COLORS.gray[200];
    let statusColor = COLORS.gray[500];
    
    if (isOngoing) {
      cardBackgroundColor = COLORS.warning + '10';
      cardBorderColor = COLORS.warning;
      statusColor = COLORS.warning;
    } else if (isSuccess) {
      cardBackgroundColor = COLORS.success + '10';
      cardBorderColor = COLORS.success;
      statusColor = COLORS.success;
    } else if (isFailed) {
      cardBackgroundColor = COLORS.error + '10';
      cardBorderColor = COLORS.error;
      statusColor = COLORS.error;
    }

    return (
      <Card variant="elevated" style={[
        styles.historyCard, 
        { 
          borderLeftWidth: 4, 
          borderLeftColor: cardBorderColor,
          backgroundColor: cardBackgroundColor
        }
      ]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.busIconContainer, { backgroundColor: statusColor }]}>
              <Ionicons name="card" size={20} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.cardTitle}>{item.passengerName}</Text>
              <Text style={styles.cardSubtitle}>Card: {formatCardNumber(item.cardNumber)}</Text>
              <Text style={styles.cardDate}>
                {formatDate(item.tapInTime)}
              </Text>
            </View>
          </View>
          <View style={styles.amountContainer}>
            {item.tapOutTime ? (
              <>
                <Text style={[styles.fareAmount, { color: statusColor }]}>
                  {item.fareAmount > 0 ? `-৳${item.fareAmount?.toFixed(2)}` : 'Failed'}
                </Text>
                <Text style={[styles.tripStatus, { color: statusColor }]}>
                  {item.fareAmount > 0 ? 'Completed' : 'Failed'}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.fareAmount, { color: statusColor }]}>৳0.00</Text>
                <Text style={[styles.tripStatus, { color: statusColor }]}>Ongoing</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.tripDetails}>
          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>Tap In</Text>
              <TouchableOpacity
                style={[styles.timeButton, { backgroundColor: statusColor + '15' }]}
                onPress={() => openMapLocation(
                  item.tapInLocation.latitude,
                  item.tapInLocation.longitude,
                  'Tap In Location'
                )}
              >
                <Ionicons name="time" size={14} color={statusColor} />
                <Text style={[styles.timeText, { color: statusColor }]}>
                  {formatTime(item.tapInTime)}
                </Text>
                <Ionicons name="location" size={14} color={statusColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.spacer} />

            {item.tapOutTime && item.tapOutLocation ? (
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Tap Out</Text>
                <TouchableOpacity
                  style={[styles.timeButton, { backgroundColor: statusColor + '15' }]}
                  onPress={() => openMapLocation(
                    item.tapOutLocation!.latitude,
                    item.tapOutLocation!.longitude,
                    'Tap Out Location'
                  )}
                >
                  <Ionicons name="time" size={14} color={statusColor} />
                  <Text style={[styles.timeText, { color: statusColor }]}>
                    {formatTime(item.tapOutTime)}
                  </Text>
                  <Ionicons name="location" size={14} color={statusColor} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.timeItem}>
                <Text style={[styles.timeLabel, { color: statusColor }]}>Waiting for Tap Out</Text>
                <View style={[styles.ongoingIndicator, { backgroundColor: statusColor + '15' }]}>
                  <Ionicons name="time-outline" size={14} color={statusColor} />
                  <Text style={[styles.timeText, { color: statusColor }]}>
                    In progress...
                  </Text>
                </View>
              </View>
            )}
          </View>

          {item.distanceKm && item.tapOutLocation && (
            <TouchableOpacity
              style={[styles.distanceButton, { backgroundColor: statusColor + '15' }]}
              onPress={() => item.tapOutLocation && openRouteMap(
                item.tapInLocation.latitude,
                item.tapInLocation.longitude,
                item.tapOutLocation.latitude,
                item.tapOutLocation.longitude
              )}
            >
              <Ionicons name="map" size={14} color={statusColor} />
              <Text style={[styles.distanceText, { color: statusColor }]}>
                Distance: {item.distanceKm}km (View Route)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  const renderStatsTab = () => (
    <View style={styles.statsTabContainer}>
      <Card variant="elevated" style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Passenger Activity</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="log-in" size={24} color={COLORS.primary} />
            <Text style={styles.statNumber}>{todayStats.tapIns}</Text>
            <Text style={styles.statLabel}>Passengers Boarded</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="log-out" size={24} color={COLORS.success} />
            <Text style={styles.statNumber}>{todayStats.tapOuts}</Text>
            <Text style={styles.statLabel}>Passengers Alighted</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: COLORS.purple + '15' }]}>
            <Ionicons name="cash" size={24} color={COLORS.purple} />
            <Text style={styles.statNumber}>{todayStats.totalAmount}</Text>
            <Text style={styles.statLabel}>Revenue (BDT)</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: COLORS.warning + '15' }]}>
            <Ionicons name="people" size={24} color={COLORS.warning} />
            <Text style={styles.statNumber}>{todayStats.tapIns - todayStats.tapOuts}</Text>
            <Text style={styles.statLabel}>Onboard Now</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  const renderTabContent = () => {
    if (activeTab === 'trips') {
      // Sort trips to show ongoing trips first
      const sortedTrips = [...trips].sort((a, b) => {
        // Ongoing trips (no tapOutTime) come first
        if (!a.tapOutTime && b.tapOutTime) return -1;
        if (a.tapOutTime && !b.tapOutTime) return 1;
        // For same type, sort by tapInTime (most recent first)
        return new Date(b.tapInTime).getTime() - new Date(a.tapInTime).getTime();
      });

      return (
        <FlatList
          data={sortedTrips}
          renderItem={renderTripItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Card>
              <View style={styles.emptyContainer}>
                <Ionicons name="card-outline" size={48} color={COLORS.gray[400]} />
                <Text style={styles.emptyText}>No passenger trips today</Text>
                <Text style={styles.emptySubtext}>RFID card trips will appear here</Text>
              </View>
            </Card>
          }
        />
      );
    } else {
      return renderStatsTab();
    }
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'trips' && styles.activeTab]}
        onPress={() => setActiveTab('trips')}
      >
        <Ionicons 
          name="bus" 
          size={20} 
          color={activeTab === 'trips' ? COLORS.primary : COLORS.gray[500]} 
        />
        <Text style={[
          styles.tabText,
          activeTab === 'trips' && styles.activeTabText
        ]}>
          Passenger Trips
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
        onPress={() => setActiveTab('stats')}
      >
        <Ionicons 
          name="stats-chart" 
          size={20} 
          color={activeTab === 'stats' ? COLORS.primary : COLORS.gray[500]} 
        />
        <Text style={[
          styles.tabText,
          activeTab === 'stats' && styles.activeTabText
        ]}>
          Statistics
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip History</Text>
        <Text style={styles.headerSubtitle}>
          Bus: {selectedBus?.busNumber || 'DH-11-1234'} • Driver: {sessionData?.name || 'Unknown'}
        </Text>
      </View>
      
      {renderTabs()}
      
      <View style={styles.content}>
        {renderTabContent()}
      </View>
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
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.white + '90',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary + '10',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
  activeTabText: {
    color: COLORS.primary,
  },
  listContent: {
    paddingBottom: 20,
  },
  historyCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardDate: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  passengerName: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: 4,
  },
  tripDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  spacer: {
    width: 16,
  },
  timeItem: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
    fontWeight: '500',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    backgroundColor: COLORS.gray[50],
    borderRadius: 6,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  ongoingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 6,
  },
  distanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: COLORS.primary + '10',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  busNumber: {
    fontSize: 12,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: COLORS.error, // Red color for fare reduction
  },
  tripStatus: {
    fontSize: 12,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
  locationText: {
    fontSize: 11,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginTop: 4,
  },
  balanceText: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
  transactionDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  statsTabContainer: {
    flex: 1,
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
});
