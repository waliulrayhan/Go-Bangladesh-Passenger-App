import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';

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
  console.log('📋 EditProfileModal opened with userData:', userData);

  const [formData, setFormData] = useState({
    name: userData.name,
    address: userData.address,
    gender: userData.gender,
    dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
  });

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is private (cannot edit name)
  const isPrivateUser = userData.userType === 'Private';

  console.log('📋 Form data initialized:', formData);
  console.log('📋 Modal visible state:', visible);

  useEffect(() => {
    if (visible) {
      setFormData({
        name: userData.name,
        address: userData.address,
        gender: userData.gender,
        dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
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
      console.error('Error picking image:', error);
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
    if (!formData.address.trim()) {
      Alert.alert('Validation Error', 'Address is required');
      return false;
    }
    if (!formData.gender) {
      Alert.alert('Validation Error', 'Gender is required');
      return false;
    }
    if (!formData.dateOfBirth) {
      Alert.alert('Validation Error', 'Date of birth is required');
      return false;
    }
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
      updateFormData.append('MobileNumber', userData.mobileNumber);
      updateFormData.append('EmailAddress', userData.emailAddress);
      updateFormData.append('Address', formData.address);
      updateFormData.append('Gender', formData.gender);
      
      // Ensure UserType is capitalized (Public or Private)
      const normalizedUserType = userData.userType.toLowerCase() === 'public' ? 'Public' : 
                                 userData.userType.toLowerCase() === 'private' ? 'Private' : 
                                 userData.userType;
      updateFormData.append('UserType', normalizedUserType);
      
      updateFormData.append('PassengerId', userData.passengerId || '');
      
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

      console.log('📤 Sending FormData with fields:');
      console.log('- Id:', userData.id);
      console.log('- Name:', formData.name);
      console.log('- DateOfBirth:', formData.dateOfBirth);
      console.log('- MobileNumber:', userData.mobileNumber);
      console.log('- EmailAddress:', userData.emailAddress);
      console.log('- Address:', formData.address);
      console.log('- Gender:', formData.gender);
      console.log('- UserType:', normalizedUserType);
      console.log('- PassengerId:', userData.passengerId);
      console.log('- OrganizationId:', userData.organizationId);
      console.log('- ProfilePicture:', selectedImage ? 'File attached' : 'No file');

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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
              {getProfileImageSource() ? (
                <Image
                  source={getProfileImageSource()!}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="person" size={28} color="#9ca3af" />
                </View>
              )}
              <View style={styles.uploadOverlay}>
                <Ionicons name="camera" size={12} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.uploadText}>Tap to change photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            {/* Full Name */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              {userData.userType === 'Public' ? (
                <Input
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your full name"
                />
              ) : (
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>{userData.name}</Text>
                </View>
              )}
            </View>

            {/* Phone */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>{userData.mobileNumber}</Text>
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>{userData.emailAddress}</Text>
              </View>
            </View>

            {/* Gender */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Gender</Text>
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

            {/* Student ID / Passenger ID for Private users */}
            {userData.userType === 'Private' && userData.passengerId && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  {userData.organization?.name?.toLowerCase().includes('university') ? 'Student ID' : 'Passenger ID'}
                </Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>{userData.passengerId}</Text>
                </View>
              </View>
            )}

            {/* Organization - Show for both Public and Private users if available */}
            {userData.organization && (
              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Organization</Text>
                <View style={styles.readOnlyField}>
                  <Text style={styles.readOnlyText}>{userData.organization.name}</Text>
                </View>
              </View>
            )}

            {/* Date of Birth */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.dateOfBirth || 'Select date of birth'}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Address */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Address</Text>
              <Input
                value={formData.address}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                placeholder="Enter your address"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Cancel"
            variant="outline"
            onPress={onClose}
          />
          <Button
            title="Save Changes"
            onPress={handleSubmit}
            loading={isLoading}
          />
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date()}
            mode="date"
            display="default"
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
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  placeholder: {
    width: 36,
  },
  content: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  imageSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
  },
  imageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  cameraButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  formSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  readOnlyField: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6b7280',
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  genderOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  genderTextSelected: {
    color: '#ffffff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dateText: {
    fontSize: 16,
    color: '#374151',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  uploadText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginTop: 8,
  },
});
