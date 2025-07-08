import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { GoBangladeshLogo } from '../../components/GoBangladeshLogo';
import { Text } from '../../components/ui/Text';
import { WelcomePopup } from '../../components/ui/WelcomePopup';
import { useAuthStore } from '../../stores/authStore';
import { useCardStore } from '../../stores/cardStore';
import { API_BASE_URL, COLORS } from '../../utils/constants';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, showWelcomePopup, hideWelcomePopup } = useAuthStore();
  const { 
    card, 
    loadCardDetails, 
    isLoading,
    tripStatus,
    currentTrip,
    transactions,
    loadHistory,
    checkOngoingTrip,
    realTapOut
  } = useCardStore();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Animation for pulse effect - moved to top level
  const pulseAnimation = useSharedValue(0);

  useEffect(() => {
    loadCardDetails();
    loadHistory(1, true); // Load recent transactions
    
    // Set up periodic checking for ongoing trips every 30 seconds
    const tripCheckInterval = setInterval(() => {
      checkOngoingTrip();
    }, 30000); // Check every 30 seconds
    
    // Check immediately on mount
    checkOngoingTrip();
    
    // Cleanup interval on unmount
    return () => {
      clearInterval(tripCheckInterval);
    };
  }, [user]);

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
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, 1.3]);
    const opacity = interpolate(pulseAnimation.value, [0, 1], [0.8, 0.3]);
    
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const handleProfilePress = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
          }
        }
      ]
    );
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
      <View style={styles.headerContent}>
        <View style={styles.brandSection}>
          <GoBangladeshLogo size={28} color1={COLORS.white} color2={COLORS.brand.orange_light} />
          <View style={styles.brandTextContainer}>
            <Text variant="h6" color={COLORS.white} style={styles.brandName}>
              Go Bangladesh
            </Text>
            <Text variant="caption" color={COLORS.white} style={styles.brandSlogan}>
              One step towards better future
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.profileSection} onPress={handleProfilePress}>
          <View style={styles.profileInfo}>
            <Text variant="caption" color={COLORS.white} style={styles.greeting} numberOfLines={1}>
              Hello, {user?.name?.split(' ')[0] || 'User'}
            </Text>
          </View>
          <View style={styles.avatar}>
            {user?.imageUrl ? (
              <Image source={{ uri: `${API_BASE_URL}/${user.imageUrl}` }} style={styles.avatarImage} />
            ) : user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={18} color={COLORS.brand.blue} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Profile Menu */}
      {showProfileMenu && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.profileMenu}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color={COLORS.error} />
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
        <View style={styles.cardTop}>
          <GoBangladeshLogo size={24} color1={COLORS.white} color2={COLORS.brand.orange_light} />
          <View style={styles.contactless}>
            <Ionicons name="wifi" size={18} color={COLORS.white} />
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text variant="h5" color={COLORS.white} style={styles.cardNumber}>
            {user?.cardNumber || card?.cardNumber || 'GB-7823456012'}
          </Text>
          
          <View style={styles.cardInfo}>
            <View style={styles.infoItem}>
              <Text variant="caption" color={COLORS.white} style={styles.label}>
                CARD HOLDER
              </Text>
              <Text variant="body" color={COLORS.white} style={styles.value}>
                {user?.name?.toUpperCase() || 'GUEST USER'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="caption" color={COLORS.white} style={styles.label}>
                TYPE
              </Text>
              <Text variant="body" color={COLORS.white} style={styles.value}>
                {user?.userType?.toUpperCase() || 'PASSENGER'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardBottom}>
          <View style={styles.balanceSection}>
            <Text variant="caption" color={COLORS.white} style={styles.balanceText}>
              Available Balance
            </Text>
            <Text variant="h3" color={COLORS.white} style={styles.balance}>
              ৳{typeof user?.balance === 'number' ? user.balance.toFixed(2) : (card?.balance?.toFixed(2) || '0.00')}
            </Text>
          </View>
          <View style={styles.nfcIcon}>
            <Ionicons name="radio" size={18} color={COLORS.white} opacity={0.8} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
  
  const renderSimulateButton = () => {
    // Hide simulate button since we're using real trip data
    return null;
  };
  
  const renderTripStatus = () => {
    if (tripStatus === 'idle') return null;
    
    return (
      <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.tripStatusContainer}>
        <View style={styles.tripStatusCard}>
          <View style={styles.tripStatusContent}>
            <View style={styles.tripStatusIconContainer}>
              <View style={styles.tripStatusIcon}>
                <Ionicons name="bus" size={20} color={COLORS.brand.blue} />
              </View>
              <View style={styles.pulseIndicator}>
                <Animated.View style={[styles.pulseRing, pulseStyle]} />
                <View style={styles.pulseCore} />
              </View>
            </View>
            <View style={styles.tripStatusInfo}>
              <Text variant="h6" color={COLORS.brand.blue} style={styles.tripStatusTitle}>
                Trip in Progress
              </Text>
              <Text variant="body" color={COLORS.gray[700]} style={styles.busName}>
                {currentTrip?.session?.bus?.busName || 'Swapnil'}
              </Text>
              <Text variant="body" color={COLORS.gray[600]} style={styles.busNumber}>
                {currentTrip?.session?.bus?.busNumber || 'GAIBANDHA-KHA-18-8123'}
              </Text>
              <Text variant="caption" color={COLORS.gray[500]} style={styles.tripTime}>
                Started: {currentTrip ? new Date(currentTrip.tripStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '8:16:45 PM'}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };
  
  const renderRecentActivity = () => {
    // Get the most recent 3 transactions
    const recentTransactions = transactions.slice(0, 3);

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
          <Text variant="h5" color={COLORS.gray[900]} style={styles.sectionTitle}>
            Recent Activity
          </Text>
          <TouchableOpacity onPress={handleViewAllPress}>
            <Text variant="bodySmall" color={COLORS.primary} style={styles.viewAllText}>
              View All
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.activityList}>
          {recentTransactions.length > 0 ? (
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
            // Fallback to mock data if no transactions are loaded
            <>
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: COLORS.error + '20' }]}>
                  <Ionicons name="arrow-up" size={16} color={COLORS.error} />
                </View>
                <View style={styles.activityContent}>
                  <Text variant="label" color={COLORS.gray[900]} style={styles.activityTitle}>
                    Bus Fare
                  </Text>
                  <Text variant="caption" color={COLORS.gray[500]} style={styles.activityTime}>
                    {formatDate(new Date())}, 2:30 PM
                  </Text>
                </View>
                <Text variant="labelSmall" color={COLORS.error} style={styles.activityAmount}>
                  -৳25.00
                </Text>
              </View>
              
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: COLORS.success + '20' }]}>
                  <Ionicons name="arrow-down" size={16} color={COLORS.success} />
                </View>
                <View style={styles.activityContent}>
                  <Text variant="label" color={COLORS.gray[900]} style={styles.activityTitle}>
                    Top Up
                  </Text>
                  <Text variant="caption" color={COLORS.gray[500]} style={styles.activityTime}>
                    {formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))}, 10:15 AM
                  </Text>
                </View>
                <Text variant="labelSmall" color={COLORS.success} style={styles.activityAmount}>
                  +৳500.00
                </Text>
              </View>
              
              <View style={styles.activityItem}>
                <View style={[styles.activityIcon, { backgroundColor: COLORS.error + '20' }]}>
                  <Ionicons name="arrow-up" size={16} color={COLORS.error} />
                </View>
                <View style={styles.activityContent}>
                  <Text variant="label" color={COLORS.gray[900]} style={styles.activityTitle}>
                    Bus Fare
                  </Text>
                  <Text variant="caption" color={COLORS.gray[500]} style={styles.activityTime}>
                    {formatDate(new Date(Date.now() - 24 * 60 * 60 * 1000))}, 8:45 AM
                  </Text>
                </View>
                <Text variant="labelSmall" color={COLORS.error} style={styles.activityAmount}>
                  -৳30.00
                </Text>
              </View>
            </>
          )}
        </View>
      </Animated.View>
    );
  };  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={() => setShowProfileMenu(false)}
        scrollEventThrottle={16}
      >
        {renderHeader()}
        {renderTripStatus()}
        {renderRFIDCard()}
        {renderSimulateButton()}
        {renderRecentActivity()}
      </ScrollView>

      {/* Welcome Popup */}
      <WelcomePopup
        visible={showWelcomePopup}
        userName={user?.name || 'User'}
        onClose={hideWelcomePopup}
      />
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
  scrollContent: {
    paddingBottom: 30,
  },
  
  // Header Styles
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 24,
    marginBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
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
  brandTextContainer: {
    marginLeft: 12,
  },
  brandName: {
    fontWeight: '700',
    fontSize: 18,
  },
  brandSlogan: {
    fontSize: 11,
    opacity: 0.9,
    marginTop: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 140, // Limit width to prevent overflow
  },
  profileInfo: {
    alignItems: 'flex-end',
    marginRight: 8,
    flex: 1,
  },
  greeting: {
    fontSize: 11,
    opacity: 0.9,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },

  // Profile Menu
  profileMenu: {
    position: 'absolute',
    top: 75,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 12,
    minWidth: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuText: {
    marginLeft: 8,
  },

  // Card Styles
  cardContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    minHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  contactless: {
    alignItems: 'center',
    opacity: 0.8,
  },
  cardContent: {
    flex: 1,
    marginBottom: 20,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 24,
    textAlign: 'left',
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 6,
    letterSpacing: 1,
    fontWeight: '500',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.white + '20',
    paddingTop: 20,
  },
  balanceSection: {
    flex: 1,
  },
  balanceText: {
    fontSize: 11,
    opacity: 0.8,
    marginBottom: 6,
    fontWeight: '500',
  },
  balance: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 32,
  },
  nfcIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  simulateText: {
    fontWeight: '600',
  },
  
  // Trip Status Styles
  tripStatusContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  tripStatusCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.brand.blue,
  },
  tripStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripStatusIconContainer: {
    position: 'relative',
    marginRight: 14,
    alignSelf: 'center',
  },
  tripStatusIcon: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.brand.blue + '15',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.brand.blue + '30',
  },
  pulseIndicator: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.brand.orange_light + '40',
    opacity: 0.8,
  },
  pulseCore: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.brand.orange_light,
  },
  tripStatusInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  tripStatusTitle: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 16,
  },
  busName: {
    fontWeight: '600',
    marginBottom: 2,
    fontSize: 14,
  },
  busNumber: {
    fontWeight: '500',
    marginBottom: 4,
    fontSize: 13,
  },
  tripTime: {
    fontSize: 12,
    fontWeight: '500',
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
    shadowColor: '#000',
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
});
