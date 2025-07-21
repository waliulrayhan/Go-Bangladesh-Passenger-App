import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { BORDER_RADIUS, COLORS, SPACING } from '../utils/constants';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Text } from './ui/Text';

const API_BASE_URL = 'https://mhmahi-001-site1.qtempurl.com';

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
  };
}

export function EditProfileModal({
  visible,
  onClose,
  onUpdate,
  userData,
}: EditProfileModalProps) {
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    if (visible) {
      setFormData({
        name: userData.name,
        mobileNumber: userData.mobileNumber,
        emailAddress: userData.emailAddress,
        address: userData.address,
        gender: userData.gender,
        dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
        passengerId: userData.passengerId || userData.studentId || '',
      });
      setSelectedImage(null);
    }
  }, [visible, userData]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera roll permissions to change your profile picture.');
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
      Alert.alert('Error', 'Failed to pick image. Please try again.');
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
      Alert.alert('Validation Error', 'Name is required');
      return false;
    }
    if (!formData.mobileNumber.trim()) {
      Alert.alert('Validation Error', 'Mobile number is required');
      return false;
    }
    if (!formData.emailAddress.trim()) {
      Alert.alert('Validation Error', 'Email address is required');
      return false;
    }
    // if (!formData.address.trim()) {
    //   Alert.alert('Validation Error', 'Address is required');
    //   return false;
    // }
    // if (!formData.gender) {
    //   Alert.alert('Validation Error', 'Gender is required');
    //   return false;
    // }
    // if (!formData.dateOfBirth) {
    //   Alert.alert('Validation Error', 'Date of birth is required');
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

      await onUpdate(updateFormData);
      onClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
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
                  {userData.organization?.name && (
                  <Text variant="caption" style={styles.profileType}>
                    {userData.organization.name}
                  </Text>
                  )}
                  <Text variant="caption" style={styles.profileType}>
                  {userData.userType} User
                  </Text>
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
                  icon="person"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Input
                  label="Mobile Number"
                  value={formData.mobileNumber}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, mobileNumber: text }))}
                  placeholder="Enter your mobile number"
                  keyboardType="phone-pad"
                  icon="call"
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
                  icon="mail"
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
                  icon="id-card"
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
                    <Ionicons name="calendar" size={18} color={COLORS.primary} />
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
                  icon="location"
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
              />
            </View>
          </View>
        </View>

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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '15',
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
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
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
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  profileType: {
    fontSize: 12,
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
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
    borderTopColor: COLORS.gray[200],
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
