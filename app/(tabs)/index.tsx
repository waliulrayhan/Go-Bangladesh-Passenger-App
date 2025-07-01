import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { GoBangladeshLogo } from '../../components/GoBangladeshLogo';
import { Text } from '../../components/ui/Text';
import { WelcomePopup } from '../../components/ui/WelcomePopup';
import { useAuthStore } from '../../stores/authStore';
import { useCardStore } from '../../stores/cardStore';
import { COLORS } from '../../utils/constants';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, showWelcomePopup, hideWelcomePopup } = useAuthStore();
  const { 
    card, 
    loadCardDetails, 
    isLoading,
    tripStatus,
    currentTrip
  } = useCardStore();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    loadCardDetails();
  }, [user]);

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
          <View style={styles.logoIcon}>
            <GoBangladeshLogo size={24} color1="#ffffff" color2="#ffffff" />
          </View>
          <View>
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
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={18} color={COLORS.primary} />
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
    <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.cardContainer}>
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardLogo}>
            <GoBangladeshLogo size={20} color1="#ffffff" color2="#ffffff" />
          </View>
          <View style={styles.contactless}>
            <Ionicons name="wifi" size={16} color={COLORS.white} />
          </View>
        </View>
        
        <View style={styles.cardContent}>
          <Text variant="h6" color={COLORS.white} style={styles.cardNumber}>
            {card?.cardNumber || 'GB-7823456012'}
          </Text>
          
          <View style={styles.cardInfo}>
            <View style={styles.infoItem}>
              <Text variant="caption" color={COLORS.white} style={styles.label}>
                CARD HOLDER
              </Text>
              <Text variant="caption" color={COLORS.white} style={styles.value}>
                {user?.name?.toUpperCase() || 'MOHAMMED RAHIM'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="caption" color={COLORS.white} style={styles.label}>
                TYPE
              </Text>
              <Text variant="caption" color={COLORS.white} style={styles.value}>
                STUDENT
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.cardBottom}>
          <View>
            <Text variant="caption" color={COLORS.white} style={styles.balanceText}>
              Available Balance
            </Text>
            <Text variant="h4" color={COLORS.white} style={styles.balance}>
              ৳{card?.balance?.toFixed(2) || '720.00'}
            </Text>
          </View>
          <View style={styles.nfcIcon}>
            <Ionicons name="radio" size={16} color={COLORS.white} opacity={0.8} />
          </View>
        </View>
      </View>
    </Animated.View>
  );
  
  const renderSimulateButton = () => (
    <Animated.View entering={FadeInDown.duration(800).delay(300)} style={styles.simulateContainer}>
      {tripStatus === 'idle' ? (
        <TouchableOpacity 
          style={styles.simulateButton}
          onPress={() => {
            require('../../stores/cardStore').useCardStore.getState().simulateTapIn();
          }}
        >
          <Ionicons name="radio" size={20} color={COLORS.primary} />
          <Text variant="labelSmall" color={COLORS.primary} style={styles.simulateText}>
            Simulate Tap In
          </Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
  
  const renderTripStatus = () => {
    if (tripStatus === 'idle') return null;
    
    return (
      <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.tripStatusContainer}>
        <View style={styles.tripStatusCard}>
          <View style={styles.tripStatusHeader}>
            <View style={styles.tripStatusIcon}>
              <Ionicons name="bus" size={24} color={COLORS.white} />
            </View>
            <View style={styles.tripStatusInfo}>
              <Text variant="h6" color={COLORS.white} style={styles.tripStatusTitle}>
                Trip in Progress
              </Text>
              <Text variant="caption" color={COLORS.white} style={styles.tripStatusSubtitle}>
                Bus: {currentTrip?.busNumber || 'DHK-123-4567'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.tapOutButton}
              onPress={() => {
                Alert.alert(
                  'Tap Out',
                  'Are you sure you want to end this trip?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Tap Out', 
                      onPress: () => {
                        // Call tap out simulation
                        require('../../stores/cardStore').useCardStore.getState().simulateTapOut();
                      }
                    }
                  ]
                );
              }}
            >
              <Text variant="caption" color={COLORS.secondary} style={styles.tapOutText}>
                Tap Out
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tripStatusDetails}>
            <View style={styles.tripStatusItem}>
              <Ionicons name="time" size={16} color={COLORS.white} />
              <Text variant="caption" color={COLORS.white} style={styles.tripStatusDetailText}>
                Started: {currentTrip ? new Date(currentTrip.tapInTime).toLocaleTimeString() : ''}
              </Text>
            </View>
            <View style={styles.tripStatusItem}>
              <Ionicons name="location" size={16} color={COLORS.white} />
              <Text variant="caption" color={COLORS.white} style={styles.tripStatusDetailText}>
                Ongoing Journey
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };
  
  const renderRecentActivity = () => (
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
      </View>
    </Animated.View>
  );  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={() => setShowProfileMenu(false)}
        scrollEventThrottle={16}
      >
        {renderHeader()}
        {renderRFIDCard()}
        {renderSimulateButton()}
        {renderTripStatus()}
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
    paddingTop: 50, // Increased to avoid status bar overlap
    paddingBottom: 20,
    marginBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    top: 70,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
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
    padding: 20,
    minHeight: 180,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactless: {
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 16,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    opacity: 0.7,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 11,
    fontWeight: '500',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.white + '20',
    paddingTop: 16,
  },
  balanceText: {
    fontSize: 11,
    opacity: 0.8,
    marginBottom: 4,
  },
  balance: {
    fontSize: 24,
    fontWeight: '700',
  },
  nfcIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    gap: 8,
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
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  tripStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tripStatusIcon: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.white + '20',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tripStatusInfo: {
    flex: 1,
  },
  tripStatusTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  tripStatusSubtitle: {
    fontSize: 12,
    opacity: 0.9,
  },
  tapOutButton: {
    backgroundColor: COLORS.white + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tapOutText: {
    fontWeight: '600',
    fontSize: 12,
  },
  tripStatusDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tripStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tripStatusDetailText: {
    marginLeft: 6,
    fontSize: 12,
    opacity: 0.9,
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
    borderRadius: 12,
    paddingVertical: 4,
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
