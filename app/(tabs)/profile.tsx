import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Dimensions, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { TokenInfoDemo } from '../../components/TokenInfoDemo';
import { Text } from '../../components/ui/Text';
import { useTokenRefresh, useUserContext } from '../../hooks/useTokenRefresh';
import { useAuthStore } from '../../stores/authStore';
import { useCardStore } from '../../stores/cardStore';
import { API_BASE_URL, COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');

export default function Profile() {
  const { user, logout, refreshUserData, isLoading } = useAuthStore();
  const { card } = useCardStore();
  
  // Use token refresh hook to get fresh data
  const { isRefreshing, refreshAllData } = useTokenRefresh();
  const { userContext } = useUserContext();
  
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAllData(); // Use the new token-based refresh
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAllData]);

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
  const renderProfileHeader = () => {
    // Only show profile if we have user data
    if (!user) {
      return (
        <Animated.View entering={FadeInUp.duration(600)} style={styles.headerContainer}>
          <View style={styles.profileCard}>
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>U</Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>Loading...</Text>
              <Text style={styles.userType}>Please wait...</Text>
            </View>
          </View>
        </Animated.View>
      );
    }

    // Create a unique key for the profile image to force re-render
    const profileImageUrl = user?.imageUrl ? `${API_BASE_URL}/${user.imageUrl}` : null;
    const imageKey = `profile-${user?.id || 'default'}-${user?.imageUrl || 'no-image'}`;

    return (
      <Animated.View entering={FadeInUp.duration(600)} style={styles.headerContainer}>
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            {profileImageUrl ? (
              <Image 
                key={imageKey} // Force re-render when URL changes
                source={{ uri: profileImageUrl }} 
                style={styles.profileImage}
                onError={(error) => {
                  console.log('Profile image load error:', error);
                }}
                onLoad={() => {
                  console.log('Profile image loaded successfully');
                }}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
              </View>
            )}
            <View style={[styles.statusBadge, { backgroundColor: COLORS.success }]}>
              <View style={styles.statusDot} />
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.userType}>{user.gender || user.sex} • Passenger</Text>
            <View style={styles.statusChip}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={[styles.statusText, { color: COLORS.success }]}>Active</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };
  const renderBalanceCard = () => {
    // Only show balance card if we have balance data
    if (typeof user?.balance !== 'number') {
      return null;
    }

    return (
      <Animated.View entering={SlideInRight.duration(600).delay(200)} style={styles.section}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconContainer}>
              <Ionicons name="wallet" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceAmount}>৳{user.balance.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.cardNumberContainer}>
            <Text style={styles.cardNumberLabel}>Card Number</Text>
            <Text style={styles.cardNumber}>{user.cardNumber}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderAccountInfo = () => (
    <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.headerActions}>
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

        {user?.passengerId && (
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="id-card" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Student ID</Text>
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
              <Text style={styles.infoValue}>
                {(() => {
                  if (typeof user.organization === 'string') {
                    return user.organization;
                  } else if (typeof user.organization === 'object' && user.organization?.name) {
                    return user.organization.name;
                  }
                  return 'Not provided';
                })()}
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.info + '15' }]}>
            <Ionicons name="call" size={16} color={COLORS.info} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{user?.mobileNumber || user?.mobile || 'Not provided'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="mail" size={16} color={COLORS.success} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.emailAddress || user?.email || 'Not provided'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.infoIcon, { backgroundColor: COLORS.warning + '15' }]}>
            <Ionicons name={user?.gender === 'female' || user?.sex === 'female' ? 'female' : 'male'} size={16} color={COLORS.warning} />
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
              <Ionicons name={user?.gender === 'female' || user?.sex === 'female' ? 'female' : 'male'} size={16} color={COLORS.warning} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>
                {user?.gender || (user?.sex ? user.sex.charAt(0).toUpperCase() + user.sex.slice(1) : 'Not specified')}
              </Text>
            </View>
          </View>
        )}
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
          <Text style={[styles.serverStatus, { color: COLORS.success }]}>Synced</Text>
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {renderProfileHeader()}
        {renderBalanceCard()}
        {/* <TokenInfoDemo /> */}
        {renderAccountInfo()}
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
