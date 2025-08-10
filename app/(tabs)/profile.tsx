import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import React from 'react';
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

/**
 * Profile Screen Component
 * Displays user profile information, balance, account details, and quick actions
 */
export default function Profile() {
  // Auth store hooks
  const { user, logout } = useAuthStore();
  
  // Token refresh hook for data synchronization
  const { refreshAllData } = useTokenRefresh();
  
  // Toast hook for notifications
  const { toast, showToast, hideToast } = useToast();
  
  // Modal state management
  const [refreshing, setRefreshing] = React.useState(false);
  const [showUpdateCardModal, setShowUpdateCardModal] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [showHelpSupportModal, setShowHelpSupportModal] = React.useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = React.useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = React.useState(false);

  // Track previous modal state to detect when modal closes
  const prevShowEditProfileModal = React.useRef(showEditProfileModal);

  /**
   * Force refresh data immediately when returning to profile page
   */
  const forceRefreshProfileData = React.useCallback(async () => {
    console.log('🔄 [PROFILE] Force refreshing profile data with complete refresh...');
    try {
      // Get current user ID
      const { user } = useAuthStore.getState();
      if (!user?.id) {
        console.error('❌ [PROFILE] No user ID available for refresh');
        return;
      }

      console.log('🔄 [PROFILE] Fetching fresh user data from API...');
      
      // Import API service dynamically to avoid circular dependencies
      const { apiService } = await import('../../services/api');
      
      // Fetch completely fresh user data from API
      const freshUserData = await apiService.getUserById(user.id.toString());
      
      if (freshUserData) {
        console.log('✅ [PROFILE] Fresh user data received:', {
          name: freshUserData.name,
          email: freshUserData.emailAddress,
          mobile: freshUserData.mobileNumber
        });

        // Create completely new user object with fresh data from ALL available API fields
        const completelyFreshUser = {
          id: freshUserData.id,
          name: freshUserData.name,
          email: freshUserData.emailAddress,
          emailAddress: freshUserData.emailAddress,
          mobile: freshUserData.mobileNumber,
          mobileNumber: freshUserData.mobileNumber,
          sex: (freshUserData.gender?.toLowerCase() === 'female' ? 'female' : 'male') as 'female' | 'male',
          gender: freshUserData.gender,
          cardNumber: freshUserData.cardNumber,
          userType: freshUserData.userType?.toLowerCase() as 'passenger' | 'public' | 'private' || user.userType,
          isActive: user.isActive || true,
          createdAt: user.createdAt || new Date().toISOString(),
          profileImage: freshUserData.imageUrl,
          imageUrl: freshUserData.imageUrl,
          dateOfBirth: freshUserData.dateOfBirth,
          address: freshUserData.address,
          passengerId: freshUserData.passengerId,
          organizationId: freshUserData.organizationId,
          organization: freshUserData.organization?.name || freshUserData.organization,
          balance: freshUserData.balance
        };

        console.log('✅ [PROFILE] Complete user data prepared:', {
          name: completelyFreshUser.name,
          email: completelyFreshUser.email,
          mobile: completelyFreshUser.mobile,
          address: completelyFreshUser.address,
          dateOfBirth: completelyFreshUser.dateOfBirth,
          gender: completelyFreshUser.gender
        });

        console.log('🔄 [PROFILE] Updating auth store with fresh data...');

        // Force update the auth store with completely fresh data
        const { storageService } = await import('../../utils/storage');
        const { STORAGE_KEYS } = await import('../../utils/constants');
        
        await storageService.setItem(STORAGE_KEYS.USER_DATA, completelyFreshUser);
        useAuthStore.setState({ user: completelyFreshUser });

        console.log('✅ [PROFILE] Auth store updated with completely fresh data');
      } else {
        console.error('❌ [PROFILE] No fresh user data received from API');
      }
      
    } catch (error) {
      console.error('❌ [PROFILE] Error force refreshing profile data:', error);
    }
  }, []); // Empty dependency array but access refreshAllData directly

  /**
   * Refresh data when edit profile modal closes to show updated information
   */
  React.useEffect(() => {
    // Only refresh when modal transitions from true to false (closes)
    if (prevShowEditProfileModal.current === true && showEditProfileModal === false) {
      console.log('🔄 [PROFILE] Edit profile modal closed, refreshing data...');
      
      // Use immediate refresh without timeout for faster response
      forceRefreshProfileData();
    }

    // Update the ref to track current state for next render
    prevShowEditProfileModal.current = showEditProfileModal;
  }, [showEditProfileModal]); // Remove forceRefreshProfileData from dependencies

  /**
   * Also refresh data when the component gains focus (when navigating back to profile)
   */
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [PROFILE] Profile page focused, checking for fresh data...');
      // Add a small delay to ensure any pending updates are complete
      const timeoutId = setTimeout(() => {
        forceRefreshProfileData();
      }, 300);
      
      return () => clearTimeout(timeoutId);
    }, []) // Empty dependency array to prevent infinite calls
  );

  /**
   * Handle pull-to-refresh functionality
   * Refreshes user data and card information
   */
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshAllData(true); // Force refresh
    } catch (error) {
      // Silently handle refresh errors to avoid disrupting user experience
    } finally {
      setRefreshing(false);
    }
  }, [refreshAllData]);

  /**
   * Handle user logout with confirmation dialog
   */
  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };

  /**
   * Perform actual logout after confirmation
   */
  const performLogout = async () => {
    try {
      console.log('🔄 [PROFILE] Starting logout process...');
      
      // Show success toast immediately
      showToast('Signing out...', 'info');
      
      // Perform logout
      await logout();
      
      console.log('✅ [PROFILE] Logout completed, redirecting...');
      
      // Close confirmation modal
      setShowLogoutConfirmation(false);
      
      // Add a small delay to ensure state is cleared
      setTimeout(() => {
        // Show success message
        showToast('Logged out successfully', 'success');
        
        // Force navigation with cleanup
        router.dismissAll();
        router.replace('/');
      }, 100);
      
    } catch (error) {
      console.error('❌ [PROFILE] Logout error:', error);
      
      // Close confirmation modal
      setShowLogoutConfirmation(false);
      
      // Show error toast
      showToast('Logout failed. Please try again.', 'error');
      
      // Force navigation even if logout fails to prevent stuck state
      setTimeout(() => {
        router.dismissAll();
        router.replace('/');
      }, 1000);
    }
  };

  /**
   * Get organization display text with proper fallbacks
   */
  const getOrganizationText = () => {
    if (!user?.organization) return 'Not Provided';
    if (typeof user.organization === 'string') {
      return user.organization;
    } else if (typeof user.organization === 'object' && user.organization?.name) {
      return user.organization.name;
    }
    return 'Not Provided';
  };

  /**
   * Get gender display text with proper formatting
   */
  const getGenderText = () => {
    const gender = user?.gender || user?.sex;
    if (!gender) return 'Not Provided';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  /**
   * Render profile header with user avatar, name, type, and organization
   */
  const renderProfileHeader = () => {
    // Show loading state if user data is not available
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

    // Generate profile image URL and unique key for re-rendering
    const profileImageUrl = user?.imageUrl ? `${API_BASE_URL}/${user.imageUrl}` : null;
    const imageKey = `profile-${user?.id || 'default'}-${user?.imageUrl || 'no-image'}`;

    // Helper to format user type display text
    const getUserTypeText = () => {
      const gender = user?.gender || user?.sex;
      const genderText = gender ? (gender.charAt(0).toUpperCase() + gender.slice(1)) : '';
      const userTypeText = user?.userType ? (user.userType.charAt(0).toUpperCase() + user.userType.slice(1)) : 'Passenger';
      return genderText ? `${userTypeText} User` : userTypeText;
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
    // Don't show balance card if user data is not available
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
                !hasBalance && { color: COLORS.gray[500] }
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
                {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not Provided'}
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
          onPress={() => {
            showToast('Account deletion feature coming soon', 'info');
          }}
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

  /**
   * Send OTP for card number update verification
   */
  const handleSendOTPForCardUpdate = async (newCardNumber: string) => {
    const mobileNumber = user?.mobileNumber || user?.mobile;
    if (!mobileNumber) {
      throw new Error('Mobile number not found');
    }

    try {
      await apiService.sendOTP(mobileNumber);
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * Update user card number after OTP verification
   */
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
      await apiService.verifyOTP(mobileNumber, otp);
      
      // Then update card number
      const response = await apiService.updateCardNumber(user.id.toString(), newCardNumber);
      
      if (response.isSuccess) {
        showToast(response.message || 'Card number updated successfully!', 'success');
        // Refresh user data to get the updated card number
        await refreshAllData();
      } else {
        throw new Error(response.message || 'Failed to update card number');
      }
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * Update user profile information
   */
  const handleUpdateProfile = async (updateData: any) => {
    if (!user?.id) {
      throw new Error('User ID not found');
    }

    try {
      const response = await apiService.updatePassengerProfile(updateData);
      
      if (response.isSuccess) {
        showToast(response.message || 'Profile updated successfully!', 'success');
        // Refresh user data to get the updated information
        await refreshAllData();
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      throw error;
    }
  };

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
          userData={{
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
            organization: user.organization ? 
              (typeof user.organization === 'object' && user.organization.name 
                ? { name: user.organization.name }
                : typeof user.organization === 'string' 
                  ? { name: user.organization }
                  : undefined)
              : undefined,
          }}
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
    fontSize: 22,
    fontWeight: '800',
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
