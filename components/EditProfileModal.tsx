import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { useToast } from '../hooks/useToast';
import { apiService } from '../services/api';
import { BORDER_RADIUS, COLORS, SPACING } from '../utils/constants';
import { ProfileOTPVerificationModal } from './ProfileOTPVerificationModal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Text } from './ui/Text';
import { Toast } from './ui/Toast';

const API_BASE_URL = 'https://thegobd.com';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (updateData: FormData) => Promise<void>;
  userData: {
    id: string;
    name: string;
    mobileNumber: string;
    emailAddress: string;
    gender: string;
    address: string;
    dateOfBirth: string;
    userType: string;
    imageUrl?: string;
    passengerId?: string;
    studentId?: string;
    organizationId?: string;
    organization?: { name: string };
    cardNumber?: string;
  };
}

export function EditProfileModal({
  visible,
  onClose,
  onUpdate,
  userData,
}: EditProfileModalProps) {
  const { toast, showError, showSuccess, hideToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: userData.name,
    mobileNumber: userData.mobileNumber,
    emailAddress: userData.emailAddress,
    address: userData.address,
    gender: userData.gender,
    dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
    passengerId: userData.passengerId || userData.studentId || '',
  });

  const [originalData, setOriginalData] = useState({
    name: userData.name,
    mobileNumber: userData.mobileNumber,
    emailAddress: userData.emailAddress,
    address: userData.address,
    gender: userData.gender,
    dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
    passengerId: userData.passengerId || userData.studentId || '',
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isOTPSuccess, setIsOTPSuccess] = useState(false);
  
  // Debug showOTPModal state changes
  useEffect(() => {
    console.log('🔍 [EDIT PROFILE] showOTPModal state changed:', showOTPModal);
  }, [showOTPModal]);
  const [pendingUpdateData, setPendingUpdateData] = useState<FormData | null>(null);

  // Initialize form data when modal first opens
  useEffect(() => {
    console.log('🔄 [EDIT PROFILE] Modal visibility changed:', visible);
    if (visible) {
      console.log('🚀 [EDIT PROFILE] Initializing form data');
      const initialData = {
        name: userData.name,
        mobileNumber: userData.mobileNumber,
        emailAddress: userData.emailAddress,
        address: userData.address,
        gender: userData.gender,
        dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
        passengerId: userData.passengerId || userData.studentId || '',
      };
      
      setFormData(initialData);
      setOriginalData(initialData);
      setSelectedImage(null);
      setShowOTPModal(false);
      setIsOTPSuccess(false);
      setPendingUpdateData(null);
    }
  }, [visible]); // Only depend on visible, not userData
  
  // Update form data when userData changes but modal is already open
  useEffect(() => {
    if (visible) {
      console.log('📊 [EDIT PROFILE] UserData changed, updating form data');
      const updatedData = {
        name: userData.name,
        mobileNumber: userData.mobileNumber,
        emailAddress: userData.emailAddress,
        address: userData.address,
        gender: userData.gender,
        dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
        passengerId: userData.passengerId || userData.studentId || '',
      };
      
      setFormData(updatedData);
      setOriginalData(updatedData);
    }
  }, [userData]); // Only depend on userData changes

  // Check if there are any changes
  const hasChanges = () => {
    if (selectedImage) return true;
    
    return Object.keys(formData).some(key => {
      return formData[key as keyof typeof formData] !== originalData[key as keyof typeof originalData];
    });
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        showError('We need camera roll permissions to change your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // 1:1 aspect ratio
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      showError('Failed to pick image. Please try again.');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, dateOfBirth: dateString }));
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      showError('Name is required');
      return false;
    }
    if (!formData.mobileNumber.trim()) {
      showError('Mobile number is required');
      return false;
    }
    // if (!formData.emailAddress.trim()) {
    //   showError('Email address is required');
    //   return false;
    // }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const updateFormData = new FormData();
      
      // Add form fields with correct API field names (matching Postman)
      updateFormData.append('Id', userData.id);
      updateFormData.append('Name', formData.name);
      updateFormData.append('DateOfBirth', formData.dateOfBirth);
      updateFormData.append('MobileNumber', formData.mobileNumber);
      updateFormData.append('EmailAddress', formData.emailAddress);
      updateFormData.append('Address', formData.address);
      updateFormData.append('Gender', formData.gender);
      
      // Ensure UserType is capitalized (Public or Private)
      const normalizedUserType = userData.userType.toLowerCase() === 'public' ? 'Public' : 
                                 userData.userType.toLowerCase() === 'private' ? 'Private' : 
                                 userData.userType;
      updateFormData.append('UserType', normalizedUserType);
      
      updateFormData.append('PassengerId', formData.passengerId);
      
      // Add OrganizationId if available
      if (userData.organizationId) {
        updateFormData.append('OrganizationId', userData.organizationId);
      }

      // Add profile picture if selected
      if (selectedImage) {
        // Create a simple, URL-safe filename
        const timestamp = Date.now();
        const filename = `profile-${timestamp}.jpg`;
        updateFormData.append('ProfilePicture', {
          uri: selectedImage,
          type: 'image/jpeg',
          name: filename,
        } as any);
      }

      // Store the update data and show OTP modal
      setPendingUpdateData(updateFormData);
      setIsLoading(false);
      console.log('🚀 [EDIT PROFILE] Setting showOTPModal to true');
      setShowOTPModal(true);
    } catch (error: any) {
      console.error('Error preparing profile update:', error);
      showError(error.message || 'Failed to prepare profile update');
      setIsLoading(false);
    }
  };

  const handleOTPVerificationSuccess = async () => {
    if (!pendingUpdateData) {
      throw new Error('No pending update data found');
    }

    try {
      console.log('🔄 [PROFILE UPDATE] Calling update API after OTP verification...');
      
      // Call the update API using the apiService
      const result = await apiService.updatePassengerProfile(pendingUpdateData);
      
      if (!result.isSuccess) {
        throw new Error(result.message || 'Failed to update profile');
      }
      
      console.log('✅ [PROFILE UPDATE] Profile updated successfully');
      
      // Clear pending data
      setPendingUpdateData(null);
      
      // Call the original onUpdate callback to refresh UI
      console.log('🔄 [PROFILE UPDATE] Calling onUpdate callback to refresh profile UI...');
      await onUpdate(pendingUpdateData);
      console.log('✅ [PROFILE UPDATE] Profile UI refreshed successfully');
      
      // Mark OTP as successful
      setIsOTPSuccess(true);
      
      // Return success - let the OTP modal handle the UI updates and closing
      return { success: true };
    } catch (error: any) {
      console.error('❌ [PROFILE UPDATE] Error updating profile:', error);
      throw error; // Re-throw to be handled by OTP modal
    }
  };

  const getProfileImageSource = () => {
    if (selectedImage) {
      return { uri: selectedImage };
    }
    if (userData.imageUrl) {
      return { uri: `${API_BASE_URL}/${userData.imageUrl}` };
    }
    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="person" size={20} color={COLORS.primary} />
            </View>
            <Text variant="h5" style={styles.headerTitle}>Edit Profile</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Picture Section */}
          <Animated.View entering={FadeInUp.duration(600)} style={styles.section}>
            <View style={styles.sectionContent}>
              <View style={styles.profilePictureSection}>
                <View style={styles.profilePictureContainer}>
                  <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
                    {getProfileImageSource() ? (
                      <Image
                        source={getProfileImageSource()!}
                        style={styles.profileImage}
                      />
                    ) : (
                      <View style={styles.imagePlaceholder}>
                        <Ionicons name="person" size={32} color={COLORS.gray[400]} />
                      </View>
                    )}
                    <View style={styles.uploadOverlay}>
                      <Ionicons name="camera" size={16} color={COLORS.white} />
                    </View>
                  </TouchableOpacity>
                </View>
                <View style={styles.profileInfo}>
                    <Text variant="h6" style={styles.profileName}>{userData.name}</Text>
                    <Text variant="caption" style={styles.userType}>
                    {userData.userType.charAt(0).toUpperCase() + userData.userType.slice(1)} User
                    </Text>
                    {userData.organization?.name && (
                    <View style={styles.organizationContainer}>
                      <Ionicons name="business-outline" size={12} color={COLORS.gray[600]} style={styles.organizationIcon} />
                      <Text variant="caption" style={styles.userType}>
                      {userData.organization.name}
                      </Text>
                    </View>
                    )}
                  <TouchableOpacity onPress={pickImage} style={styles.changePhotoButton}>
                  <Text variant="caption" style={styles.changePhotoText}>Change Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Personal Information Section */}
          <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.sectionContent}>
              <View style={styles.fieldGroup}>
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your full name"
                  icon="person-outline"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Input
                  label="Mobile Number"
                  value={formData.mobileNumber}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, mobileNumber: text }))}
                  placeholder="Enter your mobile number"
                  keyboardType="phone-pad"
                  icon="call-outline"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Input
                  label="Email Address"
                  value={formData.emailAddress}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, emailAddress: text }))}
                  placeholder="Enter your email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail-outline"
                />
              </View>

              {/* ID Field - Editable for all users */}
              <View style={styles.fieldGroup}>
                <Input
                  label={userData.userType === 'Private' 
                    ? 'Identity Number' 
                    : 'Identity Number'}
                  value={formData.passengerId}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, passengerId: text }))}
                  placeholder={userData.userType === 'Private'
                    ? 'Enter your Identity Number' 
                    : 'Enter your Identity Number'}
                  icon="id-card-outline"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text variant="label" style={styles.fieldLabel}>Gender</Text>
                <View style={styles.genderContainer}>
                  {['Male', 'Female'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={[
                        styles.genderOption,
                        formData.gender === gender && styles.genderOptionSelected
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, gender }))}
                    >
                      <Ionicons 
                        name={gender === 'Male' ? 'male' : 'female'} 
                        size={18} 
                        color={formData.gender === gender ? COLORS.white : COLORS.primary} 
                      />
                      <Text style={[
                        styles.genderText,
                        formData.gender === gender && styles.genderTextSelected
                      ]}>
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text variant="label" style={styles.fieldLabel}>Date of Birth</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <View style={styles.dateButtonContent}>
                    <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                    <Text style={[
                      styles.dateText,
                      !formData.dateOfBirth && styles.dateTextPlaceholder
                    ]}>
                      {formData.dateOfBirth || 'Select date of birth'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={COLORS.gray[400]} />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldGroup}>
                <Input
                  label="Address"
                  value={formData.address}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                  placeholder="Enter your address"
                  icon="location-outline"
                />
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text variant="button" style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.saveButtonContainer}>
              <Button
                title="Save Changes"
                onPress={handleSubmit}
                loading={isLoading}
                size="medium"
                disabled={!hasChanges()}
              />
            </View>
          </View>
        </View>

        {/* Toast */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* OTP Verification Modal */}
        <ProfileOTPVerificationModal
          visible={showOTPModal}
          onClose={() => {
            console.log('🚪 [EDIT PROFILE] OTP Modal onClose called, isOTPSuccess:', isOTPSuccess);
            setShowOTPModal(false);
            setPendingUpdateData(null);
            
            // Always close the main modal when OTP modal closes, as it means either:
            // 1. User cancelled (they want to exit)
            // 2. OTP verification was successful (profile updated)
            // This provides better UX by returning to the profile page
            console.log('🚪 [EDIT PROFILE] Closing EditProfileModal as well for better UX');
            setIsOTPSuccess(false);
            onClose();
          }}
          onVerificationSuccess={handleOTPVerificationSuccess}
          mobileNumber={formData.mobileNumber}
          userData={{
            name: formData.name,
            cardNumber: userData.cardNumber
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.brand.blue_subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
  },
  
  // Profile Picture Section
  profilePictureSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePictureContainer: {
    marginRight: SPACING.lg,
  },
  imageButton: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderStyle: 'dashed',
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 2,
  },
  userType: {
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  organizationContainer: {
    paddingTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
    organizationIcon: {
    marginRight: 4,
  },
  changePhotoButton: {
    paddingVertical: SPACING.xs,
  },
  changePhotoText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  
  // Form Fields
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
  },
  
  // Gender Selection
  genderContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
  },
  genderOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[700],
  },
  genderTextSelected: {
    color: COLORS.white,
  },
  
  // Date Button
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    marginTop: SPACING.xs,
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.gray[900],
  },
  dateTextPlaceholder: {
    color: COLORS.gray[500],
  },
  
  // Info Items (read-only fields)
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  
  // Footer
  footer: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  saveButtonContainer: {
    flex: 2,
  },
  
  // Bottom padding
  bottomPadding: {
    height: SPACING['3xl'],
  },
});
