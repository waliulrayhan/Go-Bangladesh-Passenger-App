import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, RefreshControl, SafeAreaView, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Text } from '../../components/ui/Text';
import { useTokenRefresh, useUserContext } from '../../hooks/useTokenRefresh';
import { useAuthStore } from '../../stores/authStore';
import { useCardStore } from '../../stores/cardStore';
import { API_BASE_URL, COLORS } from '../../utils/constants';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { 
    card, 
    loadCardDetails, 
    isLoading,
    tripStatus,
    currentTrip,
    transactions,
    loadHistory,
    checkOngoingTrip,
    realTapOut,
    forceTapOut
  } = useCardStore();

  // Use token refresh hook to get fresh data
  const { isRefreshing, refreshAllData } = useTokenRefresh();
  const { userContext } = useUserContext();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation for pulse effect - moved to top level
  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    loadCardDetails();
    loadHistory(1, true); // Load recent transactions
    checkOngoingTrip();
  }, [user]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAllData();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Start pulse animation when trip is active
  useEffect(() => {
    if (tripStatus === 'active') {
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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleViewAllPress = () => {
    router.push('/(tabs)/history');
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
                  source={require('../../assets/images/icon-full-01.png')} 
                  style={styles.logoImage} 
                  resizeMode="contain"
                />
              </View>
            </View>
          <View style={styles.brandTextContainer}>
            <Text variant="h4" color={COLORS.white} style={styles.brandName}>
              Go Bangladesh
            </Text>
            <Text variant="caption" color={COLORS.white} style={styles.brandSlogan}>
              One step toward a better future
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.profileSection} onPress={handleProfilePress}>
          <View style={styles.avatar}>
            {user?.imageUrl ? (
              <Image source={{ uri: `${API_BASE_URL}/${user.imageUrl}` }} style={styles.avatarImage} />
            ) : user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text variant="bodyLarge" color={COLORS.primary} style={styles.avatarText}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Profile Menu */}
      {showProfileMenu && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.profileMenu}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(tabs)/profile')}>
            <Ionicons name="person-outline" size={18} color={COLORS.primary} />
            <Text variant="bodySmall" color={COLORS.primary} style={styles.menuText}>
              View Profile
            </Text>
          </TouchableOpacity>
          <View style={styles.menuDivider} />
          <TouchableOpacity style={styles.menuItem} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            <Text variant="bodySmall" color={COLORS.error} style={styles.menuText}>
              Logout
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
  const renderRFIDCard = () => (
    <Animated.View entering={FadeInDown.duration(800).delay(300)} style={styles.cardContainer}>
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardTop}>
          <View style={styles.cardTypeSection}>
            <Text variant="caption" color={COLORS.white} style={styles.cardTypeLabel}>
              GO BANGLADESH
            </Text>
            <Text variant="caption" color={COLORS.white} style={styles.cardSubLabel}>
              TRANSIT CARD
            </Text>
          </View>
          <View style={styles.cardLogo}>
            <View style={styles.visaStyleLogo}>
              <Text variant="bodySmall" color={COLORS.white} style={styles.logoText}>
                GB
              </Text>
            </View>
          </View>
        </View>
        
        {/* Card Number */}
        <View style={styles.cardNumberSection}>
          <Text variant="h3" color={COLORS.white} style={styles.cardNumber}>
            {user?.cardNumber || card?.cardNumber || '•••• •••• •••• ••••'}
          </Text>
        </View>
        
        {/* Card Info */}
        <View style={styles.cardInfo}>
          <View style={styles.cardInfoItem}>
            <Text variant="caption" color={COLORS.white} style={styles.label}>
              CARD HOLDER
            </Text>
            <Text variant="bodySmall" color={COLORS.white} style={styles.value} numberOfLines={1}>
              {user?.name?.toUpperCase() || 'CARD HOLDER'}
            </Text>
          </View>
          <View style={styles.cardInfoItem}>
            <Text variant="caption" color={COLORS.white} style={styles.label}>
              TYPE
            </Text>
            <Text variant="bodySmall" color={COLORS.white} style={styles.value}>
              {user?.userType?.toUpperCase() || 'STANDARD'}
            </Text>
          </View>
        </View>
        
        {/* Card Bottom - Balance */}
        <View style={styles.cardBottom}>
          <View style={styles.balanceSection}>
            <Text variant="caption" color={COLORS.white} style={styles.balanceLabel}>
              CURRENT BALANCE
            </Text>
            <Text variant="h2" color={COLORS.white} style={styles.balance}>
              ৳{typeof user?.balance === 'number' ? user.balance.toFixed(2) : (card?.balance?.toFixed(2) || '0.00')}
            </Text>
          </View>
          <View style={styles.nfcIconContainer}>
            <Ionicons name="radio" size={24} color={COLORS.white} style={styles.nfcIcon} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
    const renderTripStatus = () => {
    if (!currentTrip || tripStatus !== 'active') {
      return null;
    }

    const handleForceTapOut = () => {
      const penaltyAmount = currentTrip?.penaltyAmount || 0;
      
      Alert.alert(
        'Force Tap Out',
        `Are you sure you want to force tap out? A penalty of ৳${penaltyAmount.toFixed(2)} will be charged.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Force Tap Out', 
            style: 'destructive',
            onPress: () => forceTapOut()
          }
        ]
      );
    };

    return (
      <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.tripContainer}>
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
                <Ionicons name="bus" size={16} color={COLORS.brand.orange_light} />
                <Text variant="caption" style={styles.busLabel}>BUS</Text>
              </View>
              <Text variant="h6" style={styles.busText} numberOfLines={1}>
                {currentTrip?.busName || 'N/A'}
              </Text>
              <Text variant="caption" style={styles.busNumber} numberOfLines={1}>
                {currentTrip?.busNumber || 'N/A'}
              </Text>
            </View>

            {/* Route & Time Info - Bottom Row */}
            <View style={styles.bottomDetailsRow}>
              <View style={styles.bottomDetailItem}>
                <Ionicons name="navigate" size={14} color={COLORS.primary} />
                <View style={styles.bottomDetailInfo}>
                  <Text variant="caption" style={styles.bottomDetailLabel}>ROUTE</Text>
                  <Text variant="bodySmall" style={styles.bottomDetailValue} numberOfLines={2}>
                    {currentTrip?.tripStartPlace || 'N/A'} 
                    <Text style={styles.routeArrowSmall}> → </Text>
                    {currentTrip?.tripEndPlace || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.bottomDetailDivider} />

              <View style={styles.bottomDetailItem}>
                <Ionicons name="time" size={14} color={COLORS.success} />
                <View style={styles.bottomDetailInfo}>
                  <Text variant="caption" style={styles.bottomDetailLabel}>START TIME</Text>
                  <Text variant="bodySmall" style={styles.bottomDetailValue}>
                  {currentTrip?.tripStartTime ? new Date(new Date(currentTrip.tripStartTime).getTime() + 6 * 60 * 60 * 1000).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true
                  }) : 'N/A'}
                  </Text>
                  <Text variant="caption" style={styles.bottomDetailSubtext}>
                  {currentTrip?.tripStartTime ? new Date(new Date(currentTrip.tripStartTime).getTime() + 6 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  }) : ''}
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
    // Get the most recent 3 transactions
    const recentTransactions = transactions.slice(0, 5);

    const getActivityIcon = (transactionType: string) => {
      if (transactionType === 'BusFare') {
        return {
          icon: 'arrow-up' as const,
          color: COLORS.error,
          backgroundColor: COLORS.error + '20'
        };
      } else {
        return {
          icon: 'arrow-down' as const,
          color: COLORS.success,
          backgroundColor: COLORS.success + '20'
        };
      }
    };

    const getActivityTitle = (transactionType: string) => {
      return transactionType === 'BusFare' ? 'Bus Fare' : 'Top Up';
    };

    const getActivityAmount = (transactionType: string, amount: number) => {
      const prefix = transactionType === 'BusFare' ? '-' : '+';
      return `${prefix}৳${amount.toFixed(2)}`;
    };

    const getActivityColor = (transactionType: string) => {
      return transactionType === 'BusFare' ? COLORS.error : COLORS.success;
    };

    return (
      <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.recentActivity}>
        <View style={styles.sectionHeader}>
          <Text variant="h5" color={COLORS.secondary} style={styles.sectionTitle}>
            Recent Activity
          </Text>
          <TouchableOpacity onPress={handleViewAllPress}>
            <Text variant="bodySmall" color={COLORS.primary} style={styles.viewAllText}>
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
              <Text variant="body" color={COLORS.gray[500]} style={styles.emptyActivityTitle}>
                Loading activity...
              </Text>
              <Text variant="caption" color={COLORS.gray[400]} style={styles.emptyActivitySubtitle}>
                Fetching your latest transactions
              </Text>
            </View>
          ) : recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => {
              const iconInfo = getActivityIcon(transaction.transactionType);
              return (
                <View key={transaction.id} style={styles.activityItem}>
                  <View style={[styles.activityIcon, { backgroundColor: iconInfo.backgroundColor }]}>
                    <Ionicons name={iconInfo.icon} size={16} color={iconInfo.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text variant="label" color={COLORS.gray[900]} style={styles.activityTitle}>
                      {getActivityTitle(transaction.transactionType)}
                    </Text>
                    <Text variant="caption" color={COLORS.gray[500]} style={styles.activityTime}>
                      {formatDate(new Date(transaction.createTime))}, {new Date(transaction.createTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Text>
                  </View>
                  <Text 
                    variant="labelSmall" 
                    color={getActivityColor(transaction.transactionType)} 
                    style={styles.activityAmount}
                  >
                    {getActivityAmount(transaction.transactionType, transaction.amount)}
                  </Text>
                </View>
              );
            })
          ) : (
            // Show empty state for new users (NO MOCK DATA)
            <View style={styles.emptyActivityContainer}>
              <View style={styles.emptyActivityIcon}>
                <Ionicons name="receipt-outline" size={24} color={COLORS.gray[400]} />
              </View>
              <Text variant="body" color={COLORS.gray[500]} style={styles.emptyActivityTitle}>
                No recent activity
              </Text>
              <Text variant="caption" color={COLORS.gray[400]} style={styles.emptyActivitySubtitle}>
                Your transaction history will appear here once you start using your card
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };  return (
    <>
      <StatusBar 
        backgroundColor={COLORS.primary} 
        barStyle="light-content" 
        translucent={false}
      />
      <SafeAreaView style={styles.container}>
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
    backgroundColor: COLORS.gray[50],
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  
  // Header Styles - Modern Clean Design
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusBarArea: {
    height: 20, // iOS status bar height
    backgroundColor: COLORS.primary, // Same color as header
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    marginRight: 12,
  },
  logoBackground: {
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  logoImage: {
    width: 28,
    height: 28,
  },
  brandTextContainer: {
    flex: 1,
  },
  brandName: {
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  brandSlogan: {
    fontSize: 12,
    opacity: 0.85,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  profileSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'flex-end',
    marginRight: 12,
    flex: 1,
  },
  greeting: {
    fontSize: 11,
    opacity: 0.8,
    fontWeight: '500',
    marginBottom: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },

  // Profile Menu
  profileMenu: {
    position: 'absolute',
    top: 75,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 140,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuText: {
    marginLeft: 8,
    fontWeight: '500',
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
    backgroundColor: '#1e3c72', // Deep blue like VISA cards
    borderRadius: 20,
    padding: 28,
    minHeight: 220,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
    marginTop: 20,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  cardTypeSection: {
    flex: 1,
  },
  cardTypeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    opacity: 0.9,
    marginBottom: 2,
  },
  cardSubLabel: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1,
    opacity: 0.7,
  },
  cardLogo: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  visaStyleLogo: {
    width: 48,
    height: 32,
    backgroundColor: COLORS.white + '15',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.white + '20',
  },
  logoText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardNumberSection: {
    marginBottom: 24,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: '400',
    letterSpacing: 4,
    fontFamily: 'monospace', // Better for card numbers
    lineHeight: 28,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 24,
  },
  cardInfoItem: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    opacity: 0.8,
    marginBottom: 6,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.white + '15',
    paddingTop: 20,
  },
  balanceSection: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 1,
  },
  balance: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  nfcIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nfcIcon: {
    opacity: 0.8,
  },
  
  // Header styles updates
  userName: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Simulate Button Styles
  simulateContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  simulateText: {
    fontWeight: '600',
  },
  
  // Trip Status Styles - Compact Design
  tripContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  tripCard: {
    padding: 12,
    position: 'relative',
  },

  // Compact Header Styles
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '12',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.success + '20',
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
    fontWeight: '700',
    color: COLORS.success,
  },
  tapOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 36,
  },
  tapOutButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.5,
  },

  // Trip Content Styles
  tripContent: {
    gap: 8,
  },
  
  // Bus Container - Prominent Display
  busContainer: {
    backgroundColor: COLORS.brand.orange_light + '08',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.brand.orange_light,
  },
  busHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  busLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.brand.orange_light,
    letterSpacing: 1,
  },
  busText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gray[900],
    lineHeight: 20,
    marginBottom: 2,
  },
  busNumber: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.gray[600],
  },

  // Bottom Details Row - Route & Time
  bottomDetailsRow: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.gray[100],
  },
  bottomDetailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    fontWeight: '700',
    color: COLORS.gray[600],
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bottomDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[900],
    lineHeight: 16,
  },
  bottomDetailSubtext: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.gray[500],
    marginTop: 1,
  },
  routeArrowSmall: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
  },

  // Pulse Animation Background - Improved
  pulseBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: COLORS.success + '08',
    zIndex: -1,
  },

  // Recent Activity Styles
  recentActivity: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 12,
  },
  activityList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activityIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    opacity: 0.6,
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty Activity State Styles
  emptyActivityContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyActivityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyActivityTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyActivitySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
  },

  // User Context Styles
  userContextContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  userContextCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  userContextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userContextIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brand.blue + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userContextInfo: {
    flex: 1,
  },
  userContextTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  organizationName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  userType: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.7,
  },
  userContextActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.brand.blue + '10',
  },
  refreshButtonDisabled: {
    backgroundColor: COLORS.gray[100],
  },
  refreshingIcon: {
    transform: [{ rotate: '0deg' }],
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  welcomeContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
});
