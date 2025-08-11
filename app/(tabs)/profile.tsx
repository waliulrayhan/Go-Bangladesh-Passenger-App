import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, SlideInRight } from 'react-native-reanimated';

// Components
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { DeleteAccountModal } from '../../components/DeleteAccountModal';
import { EditProfileModal } from '../../components/EditProfileModal';
import { HelpSupportModal } from '../../components/HelpSupportModal';
import { SettingsModal } from '../../components/SettingsModal';
import { Text } from '../../components/ui/Text';
import { Toast } from '../../components/ui/Toast';
import { UpdateCardModal } from '../../components/UpdateCardModal';

// Hooks & Services
import { useToast } from '../../hooks/useToast';
import { useTokenRefresh } from '../../hooks/useTokenRefresh';
import { apiService } from '../../services/api';

// Stores & Utils
import { useAuthStore } from '../../stores/authStore';
import { API_BASE_URL, COLORS } from '../../utils/constants';

// Types
interface UserProfileData {
  id: string;
  name: string;
  mobileNumber: string;
  emailAddress: string;
  gender: string;
  address: string;
  dateOfBirth: string;
  userType: string;
  imageUrl: string;
  passengerId: string;
  studentId: string;
  organizationId: string;
  organization?: { name: string } | undefined;
}

// Constants
const REFRESH_DELAY = 300;
const LOGOUT_REDIRECT_DELAY = 100;
const LOGOUT_ERROR_REDIRECT_DELAY = 1000;

/**
 * Profile Screen Component
 * 
 * This component displays comprehensive user profile information including:
 * - User avatar, name, type, and organization
 * - Current balance and card information
 * - Account details (contact info, demographics, etc.)
 * - Quick actions (settings, password change, help, logout)
 * 
 * Features:
 * - Pull-to-refresh data synchronization
 * - Auto-refresh on focus and modal close
 * - Modal-based editing workflows
 * - Error handling with toast notifications
 * - Responsive UI with animations
 */
export default function Profile() {
  // ==================== HOOKS ====================
  const { user, logout } = useAuthStore();
  const { refreshAllData } = useTokenRefresh();
  const { toast, showToast, hideToast } = useToast();

  // ==================== STATE ====================
  const [refreshing, setRefreshing] = useState(false);
  const [showUpdateCardModal, setShowUpdateCardModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showHelpSupportModal, setShowHelpSupportModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // ==================== REFS ====================
  const prevShowEditProfileModal = useRef(showEditProfileModal);

  // ==================== UTILITY FUNCTIONS ====================
  const createFreshUserObject = (freshUserData: any, currentUser: any) => ({
    id: freshUserData.id,
    name: freshUserData.name,
    email: freshUserData.emailAddress,
    emailAddress: freshUserData.emailAddress,
    mobile: freshUserData.mobileNumber,
    mobileNumber: freshUserData.mobileNumber,
    sex: (freshUserData.gender?.toLowerCase() === 'female' ? 'female' : 'male') as 'female' | 'male',
    gender: freshUserData.gender,
    cardNumber: freshUserData.cardNumber,
    userType: freshUserData.userType?.toLowerCase() as 'passenger' | 'public' | 'private' || currentUser.userType,
    isActive: currentUser.isActive || true,
    createdAt: currentUser.createdAt || new Date().toISOString(),
    profileImage: freshUserData.imageUrl,
    imageUrl: freshUserData.imageUrl,
    dateOfBirth: freshUserData.dateOfBirth,
    address: freshUserData.address,
    passengerId: freshUserData.passengerId,
    organizationId: freshUserData.organizationId,
    organization: freshUserData.organization?.name || freshUserData.organization,
    balance: freshUserData.balance
  });

  const updateUserInStorage = async (userData: any) => {
    const { storageService } = await import('../../utils/storage');
    const { STORAGE_KEYS } = await import('../../utils/constants');
    
    await storageService.setItem(STORAGE_KEYS.USER_DATA, userData);
    useAuthStore.setState({ user: userData });
  };

  // ==================== DATA REFRESH ====================
  /**
   * Force refresh profile data from API
   */
  const forceRefreshProfileData = useCallback(async () => {
    try {
      const { user: currentUser } = useAuthStore.getState();
      if (!currentUser?.id) {
        console.error('❌ [PROFILE] No user ID available for refresh');
        return;
      }

      const { apiService } = await import('../../services/api');
      const freshUserData = await apiService.getUserById(currentUser.id.toString());
      
      if (freshUserData) {
        const completelyFreshUser = createFreshUserObject(freshUserData, currentUser);
        await updateUserInStorage(completelyFreshUser);
        console.log('✅ [PROFILE] Profile data refreshed successfully');
      } else {
        console.error('❌ [PROFILE] No fresh user data received from API');
      }
    } catch (error) {
      console.error('❌ [PROFILE] Error refreshing profile data:', error);
    }
  }, []);

  // ==================== EFFECTS ====================
  /**
   * Effects for data refresh management
   */
  useEffect(() => {
    // Refresh when edit profile modal closes
    if (prevShowEditProfileModal.current === true && showEditProfileModal === false) {
      forceRefreshProfileData();
    }
    prevShowEditProfileModal.current = showEditProfileModal;
  }, [showEditProfileModal, forceRefreshProfileData]);

  useFocusEffect(
    useCallback(() => {
      const timeoutId = setTimeout(() => {
        forceRefreshProfileData();
      }, REFRESH_DELAY);
      
      return () => clearTimeout(timeoutId);
    }, [forceRefreshProfileData])
  );

  // ==================== EVENT HANDLERS ====================
  /**
   * Handle pull-to-refresh functionality
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAllData(true);
    } catch (error) {
      console.error('❌ [PROFILE] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshAllData]);

  /**
   * Logout handlers
   */
  const handleLogout = () => setShowLogoutConfirmation(true);

  const performLogout = async () => {
    try {
      showToast('Signing out...', 'info');
      setShowLogoutConfirmation(false);
      
      // The logout function now handles navigation internally
      await logout();
      
      setTimeout(() => {
        showToast('Logged out successfully', 'success');
      }, LOGOUT_REDIRECT_DELAY);
    } catch (error) {
      console.error('❌ [PROFILE] Logout error:', error);
      setShowLogoutConfirmation(false);
      showToast('Logout failed. Please try again.', 'error');
      
      // Fallback navigation if logout fails
      setTimeout(() => {
        try {
          router.replace('/');
        } catch (navError) {
          console.error('Navigation fallback also failed:', navError);
        }
      }, LOGOUT_ERROR_REDIRECT_DELAY);
    }
  };

  // ==================== DISPLAY UTILITIES ====================
  /**
   * Utility functions for user data display
   */
  const getOrganizationText = () => {
    if (!user?.organization) return 'Not Provided';
    if (typeof user.organization === 'string') return user.organization;
    if (typeof user.organization === 'object' && user.organization?.name) return user.organization.name;
    return 'Not Provided';
  };

  const getGenderText = () => {
    const gender = user?.gender || user?.sex;
    if (!gender) return 'Not Provided';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const getUserTypeText = () => {
    const gender = user?.gender || user?.sex;
    const genderText = gender ? (gender.charAt(0).toUpperCase() + gender.slice(1)) : '';
    const userTypeText = user?.userType ? (user.userType.charAt(0).toUpperCase() + user.userType.slice(1)) : 'Passenger';
    return genderText ? `${userTypeText} User` : userTypeText;
  };

  // ==================== RENDER FUNCTIONS ====================
  /**
   * Render profile header with user avatar, name, type, and organization
   */
  const renderProfileHeader = () => {
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

    const profileImageUrl = user?.imageUrl ? `${API_BASE_URL}/${user.imageUrl}` : null;
    const imageKey = `profile-${user?.id || 'default'}-${user?.imageUrl || 'no-image'}`;

    return (
      <Animated.View entering={FadeInUp.duration(600)} style={styles.headerContainer}>
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            {profileImageUrl ? (
              <Image 
                key={imageKey}
                source={{ uri: profileImageUrl }} 
                style={styles.profileImage}
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
            <View style={styles.organizationContainer}>
              <Ionicons name="business-outline" size={12} color={COLORS.gray[600]} style={styles.organizationIcon} />
              <Text style={styles.userType}>{getOrganizationText()}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  /**
   * Render balance card showing current balance and card information
   */
  const renderBalanceCard = () => {
    if (!user) {
      return null;
    }

    const hasBalance = typeof user?.balance === 'number';
    const displayBalance = hasBalance ? (user.balance as number).toFixed(2) : 'Not Provided';
    const cardNumber = user?.cardNumber || 'Not Provided';

    return (
      <Animated.View entering={SlideInRight.duration(600).delay(200)} style={styles.section}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconContainer}>
              <Ionicons name="wallet-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={[
                styles.balanceAmount,
                !hasBalance && { color: COLORS.gray[500] },
                hasBalance && {
                  color: (user.balance ?? 0) >= 200 
                    ? COLORS.success 
                    : (user.balance ?? 0) >= 50 
                    ? COLORS.warning 
                    : COLORS.error
                }
                ]}>
                {hasBalance ? `${displayBalance} BDT` : displayBalance}
                </Text>
            </View>
              <TouchableOpacity 
                style={styles.updateCardButton}
                onPress={() => setShowUpdateCardModal(true)}
              >
                <Ionicons name="card" size={16} color={COLORS.primary} />
                <Text style={styles.updateCardText}>Update Card</Text>
              </TouchableOpacity>
          </View>
          
          <View style={styles.cardNumberContainer}>
            <Text style={styles.cardNumberLabel}>Card Number</Text>
            <Text style={styles.cardNumber}>{cardNumber}</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  /**
   * Render account information section with user details
   */
  const renderAccountInfo = () => {
    return (
      <Animated.View entering={FadeInUp.duration(600).delay(400)} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text variant="h5" color={COLORS.secondary} style={styles.sectionTitle}> Account Information</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setShowEditProfileModal(true)}
            >
              <Ionicons name="create-outline" size={16} color={COLORS.primary} />
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.infoList}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="person-outline" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{user?.name || 'Not Provided'}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="call-outline" size={16} color={COLORS.info} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.mobileNumber || user?.mobile || 'Not Provided'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="mail-outline" size={16} color={COLORS.success} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.emailAddress || user?.email || 'Not Provided'}</Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.warning + '15' }]}>
              <Ionicons name={user?.gender === 'female' || user?.sex === 'female' ? 'female-outline' : 'male-outline'} size={16} color={COLORS.warning} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{getGenderText()}</Text>
            </View>
          </View>

          {/* Show Student ID / Passenger ID */}
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="id-card-outline" size={16} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {user?.passengerId ? 'Identity Number' : user?.studentId ? 'Identity Number' : 'Identity Number'}
              </Text>
              <Text style={styles.infoValue}>
                {user?.passengerId || user?.studentId || 'Not Provided'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.purple + '15' }]}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.purple} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Date of Birth</Text>
                <Text style={styles.infoValue}>
                {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                }) : 'Not Provided'}
                </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: COLORS.secondary + '15' }]}>
              <Ionicons name="location-outline" size={16} color={COLORS.secondary} />
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

  /**
   * Render quick actions section with settings, password change, help, and logout
   */
  const renderActions = () => (
    <Animated.View entering={FadeInDown.duration(600).delay(700)} style={styles.section}>
      <Text variant="h5" color={COLORS.secondary} style={styles.sectionTitle}> Quick Actions</Text>
      <View style={styles.actionsList}>
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => setShowSettingsModal(true)}
        >
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

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => setShowHelpSupportModal(true)}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.purple + '15' }]}>
              <Ionicons name="help-circle-outline" size={18} color={COLORS.purple} />
            </View>
            <Text style={styles.actionText}>Help & Support</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => setShowDeleteAccountModal(true)}
        >
          <View style={styles.actionLeft}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.error + '15' }]}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </View>
            <Text style={styles.actionText}>Delete Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
        </TouchableOpacity>

      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={16} color={COLORS.white} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // ==================== API HANDLERS ====================
  /**
   * API handlers for card and profile updates
   */
  const handleSendOTPForCardUpdate = async (newCardNumber: string) => {
    const mobileNumber = user?.mobileNumber || user?.mobile;
    if (!mobileNumber) throw new Error('Mobile number not found');
    
    await apiService.sendOTP(mobileNumber);
  };

  const handleUpdateCard = async (newCardNumber: string, otp: string) => {
    if (!user?.id) throw new Error('User ID not found');
    
    const mobileNumber = user?.mobileNumber || user?.mobile;
    if (!mobileNumber) throw new Error('Mobile number not found');

    await apiService.verifyOTP(mobileNumber, otp);
    const response = await apiService.updateCardNumber(user.id.toString(), newCardNumber);
    
    if (response.isSuccess) {
      showToast(response.message || 'Card number updated successfully!', 'success');
      await refreshAllData();
    } else {
      throw new Error(response.message || 'Failed to update card number');
    }
  };

  const handleUpdateProfile = async (updateData: any) => {
    if (!user?.id) throw new Error('User ID not found');

    const response = await apiService.updatePassengerProfile(updateData);
    
    if (response.isSuccess) {
      showToast(response.message || 'Profile updated successfully!', 'success');
      await refreshAllData();
    } else {
    }
  };

  /**
   * Create user data object for EditProfileModal
   */
  const createUserDataForModal = (): UserProfileData => {
    if (!user) throw new Error('User data not available');
    
    const getOrganizationObject = () => {
      if (!user.organization) return undefined;
      if (typeof user.organization === 'object' && user.organization.name) {
        return { name: user.organization.name };
      }
      if (typeof user.organization === 'string') {
        return { name: user.organization };
      }
      return undefined;
    };
    
    return {
      id: user.id.toString(),
      name: user.name,
      mobileNumber: user.mobileNumber || user.mobile || '',
      emailAddress: user.emailAddress || user.email || '',
      gender: user.gender || user.sex || '',
      address: user.address || '',
      dateOfBirth: user.dateOfBirth || '',
      userType: user.userType || 'public',
      imageUrl: user.imageUrl || '',
      passengerId: user.passengerId || '',
      studentId: user.studentId || '',
      organizationId: user.organizationId || '',
      organization: getOrganizationObject(),
    };
  };

  // ==================== COMPONENT RENDER ====================
  return (
    <SafeAreaView style={styles.container}>
      {/* Brand gradient background */}
      <LinearGradient
        colors={[
          "rgba(74, 144, 226, 0.5)", // Blue at top
          "rgba(74, 144, 226, 0.2)",
          "transparent",
          "rgba(255, 138, 0, 0.2)", // Orange transition
          "rgba(255, 138, 0, 0.4)", // Orange at bottom
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

      {/* Modals */}
      <UpdateCardModal
        visible={showUpdateCardModal}
        currentCardNumber={user?.cardNumber || 'Not Provided'}
        userMobile={user?.mobileNumber || user?.mobile || 'Not Provided'}
        onClose={() => setShowUpdateCardModal(false)}
        onUpdate={handleUpdateCard}
        onSendOTP={handleSendOTPForCardUpdate}
      />

      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <HelpSupportModal
        visible={showHelpSupportModal}
        onClose={() => setShowHelpSupportModal(false)}
      />

      {user && (
        <EditProfileModal
          visible={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          onUpdate={handleUpdateProfile}
          userData={createUserDataForModal()}
        />
      )}

      {/* Delete Account Modal */}
      {user && (
        <DeleteAccountModal
          visible={showDeleteAccountModal}
          userName={user.name}
          userBalance={user.balance || 0}
          onClose={() => setShowDeleteAccountModal(false)}
        />
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        visible={showLogoutConfirmation}
        title="Confirm Sign Out"
        message="You will need to login again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmButtonColor={COLORS.error}
        icon="log-out-outline"
        iconColor={COLORS.error}
        onConfirm={performLogout}
        onCancel={() => setShowLogoutConfirmation(false)}
      />

      {/* Toast Component */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        position="top"
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

/**
 * StyleSheet for Profile component
 * Organized by component sections with clear naming conventions
 */
const styles = StyleSheet.create({
  // Main container styles
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  
  // Background gradient styles
  glowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  
  // Content container styles
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
  
  // Profile header styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 2,
  },
  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.1)',
  },
  avatarSection: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  profileImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  avatarText: {
    fontSize: 20,
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
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  organizationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizationIcon: {
    marginRight: 4,
  },
  userType: {
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '500',
  },

  // Balance card styles
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.1)',
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
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
    fontSize: 18,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  updateCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  updateCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cardNumberContainer: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    borderRadius: 10,
    padding: 12,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.1)',
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

  // Section header styles
  sectionTitle: {
    fontWeight: '600',
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

  // Account information styles
  infoList: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.08)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 144, 226, 0.08)',
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
    letterSpacing: 0.1,
  },

  // Quick actions styles
  actionsList: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 50,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.08)',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(74, 144, 226, 0.08)',
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
    letterSpacing: 0.1,
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
    paddingVertical: 14,
    borderRadius: 14,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
    marginLeft: 6,
    letterSpacing: 0.2,
  },
});
