import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, Dimensions, Platform, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { COLORS, SPACING } from '../../utils/constants';

const { width } = Dimensions.get('window');

interface PersonalForm {
  name: string;
  phone: string;
  email: string;
  gender: 'male' | 'female' | '';
  address: string;
  dateOfBirth: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function RegistrationPersonalInfo() {
  const params = useLocalSearchParams<{ cardNumber: string }>();
  
  const [form, setForm] = useState<PersonalForm>({
    name: '',
    phone: '',
    email: '',
    gender: '',
    address: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleGoBack = () => {
    router.back();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Phone validation
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    if (!form.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(form.phone.trim())) {
      newErrors.phone = 'Please enter a valid Bangladeshi mobile number';
    }

    // Email validation (optional)
    if (form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      Alert.alert('Please Fix Errors', 'Please correct all the errors before proceeding.');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to OTP verification page
      router.push({
        pathname: '/(auth)/verify-registration',
        params: {
          cardNumber: params.cardNumber,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          gender: form.gender,
          address: form.address.trim(),
          dateOfBirth: form.dateOfBirth.trim()
        }
      });
    }, 1000);
  };

  const updateForm = (field: keyof PersonalForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
      updateForm('dateOfBirth', formatDate(date));
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  return (
    <>
      <StatusBar style="dark" backgroundColor={COLORS.brand.background} translucent={false} />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-add" size={32} color={COLORS.primary} />
            </View>
            
            <Text style={styles.title}>Personal Information</Text>
            <Text style={styles.subtitle}>
              Complete your profile to finish registration
            </Text>
            
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>Card Number:</Text>
              <Text style={styles.cardNumber}>{params.cardNumber}</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(800).delay(200)}>
            <Card variant="elevated" style={styles.formCard}>
              <View style={styles.formContent}>
                <Input
                  label="Full Name *"
                  value={form.name}
                  onChangeText={(value) => updateForm('name', value)}
                  placeholder="Enter your full name"
                  icon="person"
                  error={errors.name}
                />

                <Input
                  label="Phone Number *"
                  value={form.phone}
                  onChangeText={(value) => updateForm('phone', value)}
                  placeholder="01XXXXXXXXX"
                  keyboardType="phone-pad"
                  icon="call"
                  error={errors.phone}
                />

                <Input
                  label="Email"
                  value={form.email}
                  onChangeText={(value) => updateForm('email', value)}
                  placeholder="your.email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="mail"
                  error={errors.email}
                />

                <View style={styles.genderSection}>
                  <Text style={styles.genderLabel}>Gender</Text>
                  <View style={styles.genderButtons}>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        form.gender === 'male' && styles.genderButtonActive
                      ]}
                      onPress={() => updateForm('gender', 'male')}
                    >
                      <Ionicons 
                        name="male" 
                        size={20} 
                        color={form.gender === 'male' ? COLORS.white : COLORS.primary} 
                      />
                      <Text style={[
                        styles.genderButtonText,
                        form.gender === 'male' && styles.genderButtonTextActive
                      ]}>
                        Male
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        form.gender === 'female' && styles.genderButtonActive
                      ]}
                      onPress={() => updateForm('gender', 'female')}
                    >
                      <Ionicons 
                        name="female" 
                        size={20} 
                        color={form.gender === 'female' ? COLORS.white : COLORS.primary} 
                      />
                      <Text style={[
                        styles.genderButtonText,
                        form.gender === 'female' && styles.genderButtonTextActive
                      ]}>
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
                </View>

                <Input
                  label="Address"
                  value={form.address}
                  onChangeText={(value) => updateForm('address', value)}
                  placeholder="Enter your address"
                  icon="location"
                  error={errors.address}
                />

                <View style={styles.dateSection}>
                  <Text style={styles.dateLabel}>Date of Birth</Text>
                  <TouchableOpacity style={styles.dateInput} onPress={showDatepicker}>
                    <Ionicons name="calendar" size={20} color={COLORS.primary} style={styles.dateIcon} />
                    <Text style={[styles.dateText, !form.dateOfBirth && styles.placeholderText]}>
                      {form.dateOfBirth || 'Select your date of birth'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={COLORS.gray[500]} />
                  </TouchableOpacity>
                  {errors.dateOfBirth && <Text style={styles.errorText}>{errors.dateOfBirth}</Text>}
                </View>

                {showDatePicker && (
                  <DateTimePicker
                    value={selectedDate || new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                )}

                <Input
                  label="Password *"
                  value={form.password}
                  onChangeText={(value) => updateForm('password', value)}
                  placeholder="Create a password"
                  secureTextEntry={!showPassword}
                  icon="lock-closed"
                  rightIcon={showPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  error={errors.password}
                />

                <Input
                  label="Confirm Password *"
                  value={form.confirmPassword}
                  onChangeText={(value) => updateForm('confirmPassword', value)}
                  placeholder="Confirm your password"
                  secureTextEntry={!showConfirmPassword}
                  icon="lock-closed"
                  rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  error={errors.confirmPassword}
                />

                <Button
                  title="Continue"
                  onPress={handleNext}
                  loading={isLoading}
                  icon="arrow-forward"
                  size="medium"
                  fullWidth
                />
              </View>
            </Card>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.xl + 20, // Extra padding for status bar
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
  },
  backButton: {
    position: 'absolute',
    left: SPACING.md,
    top: 48,
    padding: SPACING.sm,
    zIndex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.brand.blue_subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: COLORS.gray[600],
    paddingHorizontal: SPACING.md,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.brand.orange_subtle,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  cardLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
    fontWeight: '500',
  },
  cardNumber: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  formCard: {
    marginBottom: SPACING.md,
  },
  formContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  genderSection: {
    marginBottom: SPACING.sm,
  },
  genderLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
  },
  genderButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
  },
  genderButtonActive: {
    backgroundColor: COLORS.primary,
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  genderButtonTextActive: {
    color: COLORS.white,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
  dateSection: {
    marginBottom: SPACING.sm,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    gap: SPACING.sm,
  },
  dateIcon: {
    marginRight: SPACING.xs,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray[900],
  },
  placeholderText: {
    color: COLORS.gray[500],
  },
});
