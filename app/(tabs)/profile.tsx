import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Dimensions, Image, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../stores/authStore';
import { useCardStore } from '../../stores/cardStore';
import { COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');

export default function Profile() {
  const { user, logout, refreshUserData, isLoading } = useAuthStore();
  const { card } = useCardStore();

  // Debug logging for profile data
  React.useEffect(() => {
    if (user) {
      console.log('👤 [PROFILE] User data loaded for display:');
      console.log('📋 [PROFILE] Profile details:', {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        address: user.address,
        passengerId: user.passengerId,
        cardNumber: user.cardNumber,
        balance: user.balance,
        gender: user.gender || user.sex,
        dateOfBirth: user.dateOfBirth,
        profileImage: user.profileImage ? 'Available' : 'None'
      });
    } else {
      console.log('⚠️ [PROFILE] No user data available');
    }
  }, [user]);

  const handleRefresh = async () => {
    console.log('🔄 [PROFILE] User initiated refresh...');
    const success = await refreshUserData();
    if (!success) {
      // Don't show error alert since API may not be implemented yet
      console.log('⚠️ [PROFILE] Refresh not available - using cached data');
    } else {
      console.log('✅ [PROFILE] Refresh completed successfully');
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
            try {
              await logout();
              // Use router.dismissAll() and then navigate to ensure clean navigation stack
              router.dismissAll();
              router.replace('/');
            } catch (error) {
              console.error('Logout error:', error);
              // Force navigation even if logout fails
              router.dismissAll();
              router.replace('/');
            }
          }
        }
      ]
    );
  };
  const renderProfileHeader = () => (
    <Animated.View entering={FadeInUp.duration(600)} style={styles.headerContainer}>
      <View style={styles.profileCard}>
        <View style={styles.avatarSection}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.profileImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'G'}</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: user?.isActive ? COLORS.success : COLORS.error }]}>
            <View style={styles.statusDot} />
          </View>
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user?.name || 'Guest User'}</Text>
          <Text style={styles.userType}>Student • Passenger</Text>
          <View style={styles.statusChip}>
            <Ionicons 
              name={user?.isActive ? 'checkmark-circle' : 'alert-circle'} 
              size={16} 
              color={user?.isActive ? COLORS.success : COLORS.error} 
            />
            <Text style={[styles.statusText, { color: user?.isActive ? COLORS.success : COLORS.error }]}>
              {user?.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
  const renderBalanceCard = () => (
    <Animated.View entering={SlideInRight.duration(600).delay(200)} style={styles.section}>
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceIconContainer}>
            <Ionicons name="wallet" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              ৳{typeof user?.balance === 'number' ? user.balance.toFixed(2) : (card?.balance?.toFixed(2) || '0.00')}
            </Text>
            {typeof user?.balance === 'number' && (
              <Text style={styles.balanceSource}>From API</Text>
            )}
          </View>
        </View>
        
        <View style={styles.cardNumberContainer}>
          <Text style={styles.cardNumberLabel}>Card Number</Text>
          <Text style={styles.cardNumber}>{user?.cardNumber || card?.cardNumber || '---- ---- ---- ----'}</Text>
        </View>

        {user?.passengerId && (
          <View style={styles.cardNumberContainer}>
            <Text style={styles.cardNumberLabel}>Passenger ID</Text>
            <Text style={styles.cardNumber}>{user.passengerId}</Text>
          </View>
        )}

        {typeof user?.balance === 'number' && (
          <View style={styles.cardNumberContainer}>
            <Text style={styles.cardNumberLabel}>API Balance</Text>
            <Text style={styles.cardNumber}>৳{user.balance.toFixed(2)}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderApiDataSummary = () => (
    <Animated.View entering={SlideInRight.duration(600).delay(250)} style={styles.section}>
      <Text style={styles.sectionTitle}>🌐 Live API Data</Text>
      <View style={styles.infoList}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="server" size={16} color={COLORS.success} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Data Source</Text>
            <Text style={styles.infoValue}>
              {typeof user?.balance === 'number' ? '✅ Live API Data' : '💾 Cached/JWT Data'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="time" size={16} color={COLORS.info} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>
              {new Date().toLocaleTimeString('en-BD', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>

        {typeof user?.balance === 'number' && (
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.warning} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>API Status</Text>
              <Text style={[styles.infoValue, { color: COLORS.success }]}>Connected & Active</Text>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderAccountInfo = () => (
    <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={[styles.editButton, { marginRight: 8 }]} 
            onPress={handleRefresh}
            disabled={isLoading}
          >
            <Ionicons 
              name={isLoading ? "sync" : "refresh"} 
              size={16} 
              color={COLORS.info}
              style={isLoading ? { transform: [{ rotate: '180deg' }] } : undefined}
            />
            <Text style={[styles.editText, { color: COLORS.info }]}>
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.editButton}>
            <Ionicons name="create-outline" size={16} color={COLORS.primary} />
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.infoList}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="person" size={16} color={COLORS.primary} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoValue}>{user?.name || 'Not provided'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="call" size={16} color={COLORS.info} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.mobile || 'Not provided'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="mail" size={16} color={COLORS.success} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email || 'Not provided'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.warning + '15' }]}>
            <Ionicons name={user?.sex === 'male' ? 'male' : 'female'} size={16} color={COLORS.warning} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>
              {user?.gender || (user?.sex ? user.sex.charAt(0).toUpperCase() + user.sex.slice(1) : 'Not specified')}
            </Text>
          </View>
        </View>

        {user?.dateOfBirth && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.purple + '15' }]}>
              <Ionicons name="calendar" size={16} color={COLORS.purple} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>{new Date(user.dateOfBirth).toLocaleDateString()}</Text>
            </View>
          </View>
        )}

        {user?.address && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.secondary + '15' }]}>
              <Ionicons name="location" size={16} color={COLORS.secondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{user.address}</Text>
            </View>
          </View>
        )}

        {user?.passengerId && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="id-card" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Passenger ID</Text>
              <Text style={styles.infoValue}>{user.passengerId}</Text>
            </View>
          </View>
        )}

        {user?.organization && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="business" size={16} color={COLORS.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Organization</Text>
              <Text style={styles.infoValue}>{user.organization}</Text>
            </View>
          </View>
        )}

        {user?.emergencyContact && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.error + '15' }]}>
              <Ionicons name="medical" size={16} color={COLORS.error} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Emergency Contact</Text>
              <Text style={styles.infoValue}>{user.emergencyContact}</Text>
            </View>
          </View>
        )}

        {user?.studentId && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="school" size={16} color={COLORS.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Student ID</Text>
              <Text style={styles.infoValue}>{user.studentId}</Text>
            </View>
          </View>
        )}

        {user?.institution && (
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="library" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Institution</Text>
              <Text style={styles.infoValue}>{user.institution}</Text>
            </View>
          </View>
        )}

        {!user?.institution && !user?.studentId && !user?.emergencyContact && !user?.address && !user?.dateOfBirth && (
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name={user?.sex === 'male' ? 'male' : 'female'} size={16} color={COLORS.warning} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{user?.sex ? user.sex.charAt(0).toUpperCase() + user.sex.slice(1) : 'Not specified'}</Text>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );

  const renderAccountDetails = () => (
    <Animated.View entering={FadeInUp.duration(600).delay(550)} style={styles.section}>
      <Text style={styles.sectionTitle}>Account Details</Text>
      <View style={styles.infoList}>
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.success} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-BD', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Not available'}
            </Text>
          </View>
        </View>

        {user?.updatedAt && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="sync-outline" size={16} color={COLORS.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>
                {new Date(user.updatedAt).toLocaleDateString('en-BD', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.infoIcon, { backgroundColor: user?.isActive ? COLORS.success + '15' : COLORS.error + '15' }]}>
            <Ionicons 
              name={user?.isActive ? "checkmark-circle-outline" : "close-circle-outline"} 
              size={16} 
              color={user?.isActive ? COLORS.success : COLORS.error} 
            />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={[
              styles.infoValue, 
              { color: user?.isActive ? COLORS.success : COLORS.error }
            ]}>
              {user?.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderTravelStats = () => (
    <Animated.View entering={FadeInUp.duration(600).delay(500)} style={styles.section}>
      <Text style={styles.sectionTitle}>Travel Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="bus" size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Total Trips</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="card" size={18} color={COLORS.success} />
          </View>
          <Text style={styles.statValue}>৳450</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="time" size={18} color={COLORS.info} />
          </View>
          <Text style={styles.statValue}>12h</Text>
          <Text style={styles.statLabel}>Travel Time</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderActions = () => (
    <Animated.View entering={FadeInDown.duration(600).delay(700)} style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsList}>
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderProfileHeader()}
        {renderBalanceCard()}
        {renderApiDataSummary()}
        {renderAccountInfo()}
        {renderAccountDetails()}
        {renderTravelStats()}
        {renderActions()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
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
    marginBottom: 2,
  },
  userType: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: 8,
    fontWeight: '500',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
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

  // Balance Card Styles
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: 2,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  balanceSource: {
    fontSize: 10,
    color: COLORS.gray[500],
    marginTop: 2,
    fontWeight: '500',
  },
  cardNumberContainer: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    padding: 12,
  },
  cardNumberLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
    marginBottom: 2,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    letterSpacing: 1,
  },

  // Section Styles
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },

  // Info List Styles
  infoList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.gray[500],
    marginBottom: 1,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
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
    padding: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
    textAlign: 'center',
    fontWeight: '500',
  },

  // Actions Styles
  actionsList: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
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
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  serverStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 6,
  },
});
