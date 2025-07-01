import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Text } from '../../components/ui/Text';
import { mockApi } from '../../services/mockData';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, STORAGE_KEYS } from '../../utils/constants';
import { storageService } from '../../utils/storage';

const { width } = Dimensions.get('window');

// Get status bar height
const getStatusBarHeight = () => {
  if (Platform.OS === 'android') {
    return StatusBar.currentHeight || 24;
  }
  return 44; // iOS default
};

interface AgentSessionData {
  agentId: number;
  agentName: string;
  agentMobile: string;
  organizationId: number;
  organizationName: string;
  loginTime: string;
}

interface WorkStatistics {
  totalTransactions: number;
  totalRevenue: number;
}

export default function AgentProfile() {
  const [sessionData, setSessionData] = useState<AgentSessionData | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [workStats, setWorkStats] = useState<WorkStatistics>({ totalTransactions: 0, totalRevenue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const { user, logout } = useAuthStore();

  useEffect(() => {
    loadSessionData();
  }, []);

  useEffect(() => {
    if (sessionData) {
      loadWorkStatistics();
    }
  }, [sessionData]);

  const loadSessionData = async () => {
    try {
      const session = await storageService.getItem<AgentSessionData>(STORAGE_KEYS.AGENT_SESSION);
      
      if (session) {
        setSessionData(session);
        // Set organization from session data
        setSelectedOrganization({
          id: session.organizationId,
          name: session.organizationName
        });
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWorkStatistics = async () => {
    try {
      // Get agent transactions and calculate statistics
      const agentId = sessionData?.agentId || 300; // Default to 300 if not found
      const transactions = await mockApi.getRechargeTransactions(agentId);
      
      const totalTransactions = transactions.length;
      const totalRevenue = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      
      setWorkStats({
        totalTransactions,
        totalRevenue
      });
    } catch (error) {
      console.error('Failed to load work statistics:', error);
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
            await storageService.removeItem(STORAGE_KEYS.AGENT_SESSION);
            router.replace('/');
          }
        }
      ]
    );
  };

  const renderProfileHeader = () => (
    <View style={styles.blueHeaderContainer}>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <Animated.View entering={FadeInUp.duration(600)} style={styles.profileContainer}>
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{sessionData?.agentName?.charAt(0) || user?.name?.charAt(0) || 'N'}</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: user?.isActive !== false ? COLORS.success : COLORS.error }]}>
              <View style={styles.statusDot} />
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{sessionData?.agentName || user?.name || 'Nasir Uddin'}</Text>
            <Text style={styles.userType}>Recharge Agent • {selectedOrganization?.name || 'University of Dhaka'}</Text>
            <View style={styles.statusChip}>
              <Ionicons 
                name={user?.isActive !== false ? 'checkmark-circle' : 'alert-circle'} 
                size={16} 
                color={user?.isActive !== false ? COLORS.success : COLORS.error} 
              />
              <Text style={[styles.statusText, { color: user?.isActive !== false ? COLORS.success : COLORS.error }]}>
                {user?.isActive !== false ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );

  const renderAccountInfo = () => (
    <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.infoList}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="person" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Agent Name</Text>
            <Text style={styles.infoValue}>{sessionData?.agentName || user?.name || 'Nasir Uddin'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="call" size={16} color={COLORS.info} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoValue}>{sessionData?.agentMobile || user?.mobile || '01712345005'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.purple + '15' }]}>
            <Ionicons name="business" size={16} color={COLORS.purple} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Organization</Text>
            <Text style={styles.infoValue}>{selectedOrganization?.name || 'University of Dhaka'}</Text>
          </View>
        </View>
        
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.warning + '15' }]}>
            <Ionicons name="id-card" size={16} color={COLORS.warning} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Agent ID</Text>
            <Text style={styles.infoValue}>{sessionData?.agentId || user?.id || '300'}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderWorkStats = () => (
    <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.section}>
      <Text style={styles.sectionTitle}>Work Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="receipt" size={18} color={COLORS.success} />
          </View>
          <Text style={styles.statValue}>{workStats.totalTransactions}</Text>
          <Text style={styles.statLabel}>Total Transactions</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="wallet" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.statValue}>৳{workStats.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderActions = () => (
    <Animated.View entering={FadeInDown.duration(600).delay(700)} style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsList}>
        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(agent-tabs)/')}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Recharge Cards</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(agent-tabs)/history')}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="time-outline" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.actionText}>Transaction History</Text>
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

        <TouchableOpacity style={[styles.actionItem, { borderBottomWidth: 0 }]}>
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="shield-checkmark" size={18} color={COLORS.warning} />
            </View>
            <Text style={styles.actionText}>Data Sync</Text>
          </View>
          <Text style={[styles.serverStatus, { color: COLORS.success }]}>Up to date</Text>
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
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} translucent={false} />
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderProfileHeader()}
        {renderAccountInfo()}
        {renderWorkStats()}
        {renderActions()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
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
  content: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  scrollContent: {
    paddingBottom: 24,
  },
  
  // Blue Header Section
  blueHeaderContainer: {
    backgroundColor: COLORS.primary,
    paddingTop: getStatusBarHeight(),
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerTitleContainer: {
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 12,
    letterSpacing: 0.15,
  },
  profileContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Profile Header
  headerContainer: {
    padding: 20,
    backgroundColor: COLORS.white,
    marginBottom: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 12,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
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
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 2,
    letterSpacing: 0.15,
  },
  userType: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray[600],
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 3,
    letterSpacing: 0.1,
  },

  // Sections
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.gray[900],
    letterSpacing: 0.15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.primary + '10',
  },
  editText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
    letterSpacing: 0.1,
  },

  // Info List
  infoList: {
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray[600],
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[900],
    letterSpacing: 0.1,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    minWidth: 120,
    flex: 1,
    marginHorizontal: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: 4,
    letterSpacing: 0.15,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray[600],
    textAlign: 'center',
    letterSpacing: 0.1,
  },

  // Actions List
  actionsList: {
    borderRadius: 8,
    backgroundColor: COLORS.gray[50],
    overflow: 'hidden',
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
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
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[900],
    letterSpacing: 0.1,
  },
  serverStatus: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 6,
    letterSpacing: 0.15,
  },
});
