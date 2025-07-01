import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, STORAGE_KEYS } from '../../utils/constants';
import { FONT_SIZES, FONT_WEIGHTS } from '../../utils/fonts';
import {
  SessionStats,
  calculateAverageFare,
  calculateCompletionRate,
  calculatePassengersPerHour,
  getFormattedSessionDuration,
  loadAllTimeStats
} from '../../utils/statistics';
import { storageService } from '../../utils/storage';

interface SessionData {
  userId: string;
  mobile: string;
  name: string;
  category: 'driver' | 'helper';
  loginTime: string;
}

export default function DriverHelperProfile() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalTapIns: 0,
    totalTapOuts: 0,
    totalRevenue: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);

  const { logout } = useAuthStore();

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    try {
      const session = await storageService.getItem<SessionData>(STORAGE_KEYS.DRIVER_HELPER_SESSION);
      const bus = await storageService.getItem(STORAGE_KEYS.SELECTED_BUS);
      const organization = await storageService.getItem(STORAGE_KEYS.SELECTED_ORGANIZATION);
      
      if (session && bus && organization) {
        setSessionData(session);
        setSelectedBus(bus);
        setSelectedOrganization(organization);
        // Load all-time stats after setting session data
        console.log('Loading all-time stats for session:', session.loginTime);
        const stats = await loadAllTimeStats(
          STORAGE_KEYS.DRIVER_HELPER_SESSION, 
          new Date(session.loginTime)
        );
        console.log('Loaded all-time stats:', stats);
        setSessionStats(stats);
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSessionStatsData = async () => {
    if (sessionData) {
      // Load all-time stats for profile (not just today)
      const stats = await loadAllTimeStats(
        STORAGE_KEYS.DRIVER_HELPER_SESSION, 
        new Date(sessionData.loginTime)
      );
      setSessionStats(stats);
    }
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
            await storageService.removeItem(STORAGE_KEYS.DRIVER_HELPER_SESSION);
            router.replace('/');
          }
        }
      ]
    );
  };

  const formatLoginTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderBlueHeader = () => (
    <View style={styles.blueHeader}>
      <Text style={styles.headerTitle}>Profile</Text>
    </View>
  );

  const renderProfileHeader = () => (
    <Animated.View entering={FadeInUp.duration(600)} style={styles.headerContainer}>
      <View style={styles.profileCard}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons 
              name={sessionData?.category === 'driver' ? 'car' : 'people'} 
              size={24} 
              color={COLORS.white} 
            />
          </View>
          <View style={[styles.statusBadge, { backgroundColor: COLORS.success }]}>
            <View style={styles.statusDot} />
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{sessionData?.name || 'Driver/Helper'}</Text>
          <Text style={styles.userType}>
            {sessionData?.category === 'driver' ? 'Driver' : 'Helper'} • {selectedOrganization?.name || 'Organization'}
          </Text>
          <View style={styles.statusChip}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={[styles.statusText, { color: COLORS.success }]}>
              On Duty
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderVehicleCard = () => (
    <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.section}>
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceIconContainer}>
            <Ionicons name="bus" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Current Vehicle</Text>
            <Text style={styles.balanceAmount}>{selectedBus?.busNumber || 'DH-11-1234'}</Text>
          </View>
        </View>
        
        <View style={styles.cardNumberContainer}>
          <Text style={styles.cardNumberLabel}>Route</Text>
          <Text style={styles.cardNumber}>{selectedBus?.route || 'Not specified'}</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderPersonalInfo = () => (
    <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
      </View>
      <View style={styles.infoList}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="person" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{sessionData?.name || 'Not provided'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="call" size={16} color={COLORS.info} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoValue}>{sessionData?.mobile || 'Not provided'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="card" size={16} color={COLORS.success} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Staff ID</Text>
            <Text style={styles.infoValue}>
              {sessionData?.category === 'driver' ? 
                `${selectedOrganization?.name === 'University of Dhaka' ? 'DU-DRV' : 'STF'}-${sessionData?.userId?.slice(-3) || '001'}` :
                `${selectedOrganization?.name === 'University of Dhaka' ? 'DU-HLP' : 'STF'}-${sessionData?.userId?.slice(-3) || '001'}`
              }
            </Text>
          </View>
        </View>
        
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.warning + '15' }]}>
            <Ionicons name="business" size={16} color={COLORS.warning} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Organization</Text>
            <Text style={styles.infoValue}>{selectedOrganization?.name || 'Not provided'}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderWorkStats = () => (
    <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.section}>
      <Text style={styles.sectionTitle}>All-Time Work Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="log-in" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.statValue}>
            {sessionStats.totalTapIns-1000}
          </Text>
          <Text style={styles.statLabel}>Tap Ins</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="log-out" size={18} color={COLORS.success} />
          </View>
          <Text style={styles.statValue}>{sessionStats.totalTapOuts-600}</Text>
          <Text style={styles.statLabel}>Tap Outs</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="cash" size={18} color={COLORS.info} />
          </View>
          <Text style={styles.statValue}>৳{(sessionStats.totalRevenue - 50000).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
      </View>
      
      {/* Additional session info */}
      <View style={styles.sessionInfoCard}>
        <View style={styles.sessionInfoRow}>
          <View style={styles.sessionInfoItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.secondary} />
            <Text style={styles.sessionInfoLabel}>Session Duration</Text>
            <Text style={styles.sessionInfoValue}>
              {sessionData ? getFormattedSessionDuration(sessionData.loginTime) : '0h 0m'}
            </Text>
          </View>
          <View style={styles.sessionInfoItem}>
            <Ionicons name="trending-up-outline" size={16} color={COLORS.purple} />
            <Text style={styles.sessionInfoLabel}>Avg. Fare</Text>
            <Text style={styles.sessionInfoValue}>
              ৳{calculateAverageFare(sessionStats.totalRevenue, sessionStats.totalTapOuts)}
            </Text>
          </View>
        </View>
        <View style={styles.sessionInfoRow}>
            <View style={styles.sessionInfoItem}>
            <Ionicons name="people-outline" size={16} color={COLORS.warning} />
            <Text style={styles.sessionInfoLabel}>Passengers/Hour</Text>
            <Text style={styles.sessionInfoValue}>
              {sessionData ? calculatePassengersPerHour(sessionStats.totalTapIns, sessionData.loginTime) - 10999 : 0}
            </Text>
            </View>
          <View style={styles.sessionInfoItem}>
            <Ionicons name="card-outline" size={16} color={COLORS.primary} />
            <Text style={styles.sessionInfoLabel}>Completion Rate</Text>
            <Text style={styles.sessionInfoValue}>
              {calculateCompletionRate(sessionStats.totalTapIns, sessionStats.totalTapOuts)}%
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderActions = () => (
    <Animated.View entering={FadeInDown.duration(600).delay(700)} style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsList}>
        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(driver-tabs)/')}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="card-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Scan Card</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(driver-tabs)/history')}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="list-outline" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.actionText}>View History</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="settings-outline" size={18} color={COLORS.info} />
            </View>
            <Text style={styles.actionText}>Settings</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.purple + '15' }]}>
              <Ionicons name="help-circle-outline" size={18} color={COLORS.purple} />
            </View>
            <Text style={styles.actionText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.purple + '15' }]}>
              <Ionicons name="phone-portrait" size={18} color={COLORS.purple} />
            </View>
            <Text style={styles.actionText}>App Version 1.2.0</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="server" size={18} color={COLORS.info} />
            </View>
            <Text style={styles.actionText}>Server Status</Text>
          </View>
          <Text style={[styles.serverStatus, { color: COLORS.success }]}>Online</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="sync-outline" size={18} color={COLORS.warning} />
            </View>
            <Text style={styles.actionText}>Data Sync</Text>
          </View>
          <Text style={[styles.serverStatus, { color: COLORS.success }]}>Up to date</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionItem, { borderBottomWidth: 0 }]}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.secondary + '15' }]}>
              <Ionicons name="time-outline" size={18} color={COLORS.secondary} />
            </View>
            <Text style={styles.actionText}>Session Time</Text>
          </View>
          <Text style={[styles.serverStatus, { color: COLORS.secondary }]}>
            {sessionData ? getFormattedSessionDuration(sessionData.loginTime) : 'N/A'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={16} color={COLORS.white} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.brand.blue} />
      <SafeAreaView style={styles.container}>
        {renderBlueHeader()}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderProfileHeader()}
          {renderVehicleCard()}
          {renderPersonalInfo()}
          {renderWorkStats()}
          {renderActions()}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.blue, // Blue background for header
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
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

  // Blue Header Styles - matching (tabs) navigation header
  blueHeader: {
    backgroundColor: COLORS.brand.blue,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50, // Extra top padding for status bar area
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTitle: {
    fontFamily: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.white,
  },
  
  // Profile Header Styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 4,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  userType: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Balance/Vehicle Card Styles
  balanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
  },
  cardNumberContainer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: 12,
  },
  cardNumberLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },

  // Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  // Info List Styles
  infoList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },

  // Stats Grid Styles
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
  },

  // Actions Styles
  actionsList: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  serverStatus: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: 16,
    borderRadius: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginLeft: 8,
  },

  // Session Info Card Styles
  sessionInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  sessionInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sessionInfoItem: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  sessionInfoLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  sessionInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    textAlign: 'center',
  },
});
