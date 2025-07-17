import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Dimensions, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';
import { Text } from '../../components/ui/Text';
import { UpdateCardModal } from '../../components/UpdateCardModal';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useCardStore } from '../../stores/cardStore';
import { API_BASE_URL, COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');

export default function Profile() {
  const { user, logout, refreshUserData, isLoading } = useAuthStore();
  const { card } = useCardStore();
  
  // Use token refresh hook to get fresh data
  const { refreshAllData } = useTokenRefresh();
  
  const [refreshing, setRefreshing] = React.useState(false);
  const [showUpdateCardModal, setShowUpdateCardModal] = React.useState(false);

  // Check if user is public type
  const isPublicUser = user?.userType === 'public';

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAllData();
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
    // Always show profile header, even if user data is loading or incomplete
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

    // Safely get user type display text
    const getUserTypeText = () => {
      const gender = user?.gender || user?.sex;
      const genderText = gender ? (gender.charAt(0).toUpperCase() + gender.slice(1)) : '';
      const userTypeText = user?.userType ? (user.userType.charAt(0).toUpperCase() + user.userType.slice(1)) : 'Passenger';
      return genderText ? `${genderText} • ${userTypeText+" User"}` : userTypeText;
    };

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
            <Text style={styles.name}>{user?.name || 'Not Provided'}</Text>
            <Text style={styles.userType}>{getUserTypeText()}</Text>
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
    // Always show balance card for both public and private users
    // If no balance data, show as "Not Provided"
    if (!user) {
      return null; // Only hide if no user at all
    }

    const hasBalance = typeof user?.balance === 'number';
    const displayBalance = hasBalance ? (user.balance as number).toFixed(2) : 'Not Provided';
    const cardNumber = user?.cardNumber || 'Not Provided';

    return (
      <Animated.View entering={SlideInRight.duration(600).delay(200)} style={styles.section}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconContainer}>
              <Ionicons name="wallet" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={[
                styles.balanceAmount,
                !hasBalance && { color: COLORS.gray[500] }
              ]}>
                {hasBalance ? `৳${displayBalance}` : displayBalance}
              </Text>
            </View>
            {isPublicUser && hasBalance && (
              <TouchableOpacity 
                style={styles.updateCardButton}
                onPress={() => setShowUpdateCardModal(true)}
              >
                <Ionicons name="card" size={16} color={COLORS.primary} />
                <Text style={styles.updateCardText}>Update Card</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.cardNumberContainer}>
            <Text style={styles.cardNumberLabel}>Card Number</Text>
            <Text style={styles.cardNumber}>{cardNumber}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderAccountInfo = () => {
    // Helper function to get organization display text
    const getOrganizationText = () => {
      if (!user?.organization) return 'Not Provided';
      if (typeof user.organization === 'string') {
        return user.organization;
      } else if (typeof user.organization === 'object' && user.organization?.name) {
        return user.organization.name;
      }
      return 'Not Provided';
    };

    // Helper function to get gender display text
    const getGenderText = () => {
      const gender = user?.gender || user?.sex;
      if (!gender) return 'Not Provided';
      return gender.charAt(0).toUpperCase() + gender.slice(1);
    };

    return (
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
              <Text style={styles.infoValue}>{user?.name || 'Not Provided'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="call" size={16} color={COLORS.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.mobileNumber || user?.mobile || 'Not Provided'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="mail" size={16} color={COLORS.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.emailAddress || user?.email || 'Not Provided'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name={user?.gender === 'female' || user?.sex === 'female' ? 'female' : 'male'} size={16} color={COLORS.warning} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{getGenderText()}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="business" size={16} color={COLORS.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Organization</Text>
              <Text style={styles.infoValue}>{getOrganizationText()}</Text>
            </View>
          </View>

          {/* Show Student ID / Passenger ID */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="id-card" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {user?.passengerId ? 'Passenger ID' : user?.studentId ? 'Student ID' : 'ID'}
              </Text>
              <Text style={styles.infoValue}>
                {user?.passengerId || user?.studentId || 'Not Provided'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.purple + '15' }]}>
              <Ionicons name="calendar" size={16} color={COLORS.purple} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
              <Text style={styles.infoValue}>
                {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not Provided'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.secondary + '15' }]}>
              <Ionicons name="location" size={16} color={COLORS.secondary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{user?.address || 'Not Provided'}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

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

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => router.push('/(auth)/change-password')}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="key-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Change Password</Text>
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

  const handleSendOTPForCardUpdate = async (newCardNumber: string) => {
    const mobileNumber = user?.mobileNumber || user?.mobile;
    if (!mobileNumber) {
      throw new Error('Mobile number not found');
    }

    try {
      console.log('📱 Sending OTP for card update to:', mobileNumber);
      await apiService.sendOTP(mobileNumber);
      console.log('✅ OTP sent successfully for card update');
    } catch (error: any) {
      console.error('❌ Send OTP error:', error);
      throw error;
    }
  };

  const handleUpdateCard = async (newCardNumber: string, otp: string) => {
    if (!user?.id) {
      throw new Error('User ID not found');
    }

    const mobileNumber = user?.mobileNumber || user?.mobile;
    if (!mobileNumber) {
      throw new Error('Mobile number not found');
    }

    try {
      // First verify OTP
      console.log('🔐 Verifying OTP for card update');
      await apiService.verifyOTP(mobileNumber, otp);
      console.log('✅ OTP verified successfully');
      
      // Then update card number
      console.log('🔄 Updating card number for user:', user.id);
      const response = await apiService.updateCardNumber(user.id.toString(), newCardNumber);
      
      if (response.isSuccess) {
        Alert.alert('Success', response.message || 'Card number updated successfully!');
        // Refresh user data to get the updated card number
        await refreshAllData();
      } else {
        throw new Error(response.message || 'Failed to update card number');
      }
    } catch (error: any) {
      console.error('❌ Update card error:', error);
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Dual Color Glow Background - Teal Top, Orange Bottom */}
      <LinearGradient
        colors={[
          'rgba(56, 193, 182, 0.5)',   // Teal at top
          'rgba(56, 193, 182, 0.2)', 
          'transparent',
          'rgba(255, 140, 60, 0.2)',   // Orange transition
          'rgba(255, 140, 60, 0.4)'    // Orange at bottom
        ]}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        style={styles.glowBackground}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      
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
        {renderAccountInfo()}
        {renderActions()}
      </ScrollView>

      {/* Update Card Modal */}
      <UpdateCardModal
        visible={showUpdateCardModal}
        currentCardNumber={user?.cardNumber || 'Not Provided'}
        userMobile={user?.mobileNumber || user?.mobile || 'Not Provided'}
        onClose={() => setShowUpdateCardModal(false)}
        onUpdate={handleUpdateCard}
        onSendOTP={handleSendOTPForCardUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  
  // Background Gradient Styles
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  
  content: {
    flex: 1,
    backgroundColor: 'transparent',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  updateCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  updateCardText: {
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
