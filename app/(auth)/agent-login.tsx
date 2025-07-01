import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, SafeAreaView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { mockApi } from '../../services/mockData';
import { useAuthStore } from '../../stores/authStore';
import { Organization } from '../../types';
import { COLORS, STORAGE_KEYS } from '../../utils/constants';
import { storageService } from '../../utils/storage';

const { width } = Dimensions.get('window');

export default function AgentLogin() {
  const [identifier, setIdentifier] = useState(''); // Agent ID/Mobile Number
  const [organization, setOrganization] = useState<Organization | null>(null);
  
  const { sendOTP, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      const savedOrg = await storageService.getItem<Organization>(STORAGE_KEYS.SELECTED_ORGANIZATION);
      if (!savedOrg) {
        Alert.alert('Error', 'No organization selected');
        router.back();
        return;
      }
      setOrganization(savedOrg);
    } catch (error) {
      Alert.alert('Error', 'Failed to load organization');
      router.back();
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const validateIdentifier = (input: string) => {
    // Check if it's a mobile number
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    // Check if it's an agent ID (numeric)
    const agentIdRegex = /^\d+$/;
    
    return phoneRegex.test(input) || agentIdRegex.test(input);
  };

  const handleSendOTP = async () => {
    clearError();
    
    if (!validateIdentifier(identifier)) {
      Alert.alert('Error', 'Please enter a valid Mobile Number or Agent ID');
      return;
    }

    if (!organization) {
      Alert.alert('Error', 'Organization not found');
      return;
    }

    try {
      // Get all agents from the organization
      const agents = await mockApi.getAgentsByOrganization(organization.id);
      
      console.log('Available agents:', agents);
      console.log('Looking for identifier:', identifier);
      
      // Find agent by identifier (mobile or agent ID)
      const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
      let agent = null;
      let mobileNumber = '';
      
      if (phoneRegex.test(identifier)) {
        // Search by mobile number
        console.log('Searching by mobile number');
        agent = agents.find(a => a.mobile === identifier);
        mobileNumber = identifier;
      } else {
        // Search by agent ID (numeric id)
        console.log('Searching by agent ID');
        const agentId = parseInt(identifier);
        if (!isNaN(agentId)) {
          agent = agents.find(a => a.id === agentId);
          if (agent) {
            mobileNumber = agent.mobile;
          }
        }
      }
      
      console.log('Found agent:', agent);
      
      if (!agent) {
        // Show available agents for debugging
        const availableInfo = agents.map(a => `ID: ${a.id}, Mobile: ${a.mobile}, Name: ${a.name}`).join('\n');
        Alert.alert(
          'Agent not found', 
          `Agent not found in this organization.\n\nAvailable agents:\n${availableInfo}\n\nPlease check your Mobile Number or Agent ID.`
        );
        return;
      }

      const success = await sendOTP(mobileNumber);
      
      if (success) {
        // Navigate to the dedicated OTP screen with agent info
        router.push({
          pathname: '/(auth)/agent-otp',
          params: {
            identifier,
            mobileNumber: mobileNumber,
            agentName: agent.name,
            organizationId: organization.id,
            organizationName: organization.name
          }
        });
      } else {
        Alert.alert('Error', error || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Agent lookup error:', error);
      Alert.alert('Error', 'Failed to lookup agent information. Please try again.');
    }
  };

  return (
    <>
      <StatusBar style="dark" backgroundColor={COLORS.gray[50]} translucent={false} />
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="storefront" size={Math.min(width * 0.1, 40)} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>Agent Login</Text>
          {organization && (
            <Text style={styles.organizationName}>
              {organization.name}
            </Text>
          )}
          <Text style={styles.subtitle}>
            Enter your mobile number or agent ID (numeric) to continue
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200)}>
          <Card variant="elevated" style={styles.loginCard}>
            <View style={styles.loginContent}>
              <Input
                label="Mobile Number or Agent ID"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Enter mobile number or agent ID"
                keyboardType="default"
                icon="person-circle"
              />
              
              <Button
                title="Send OTP"
                onPress={handleSendOTP}
                loading={isLoading}
                disabled={!identifier.trim()}
                icon="send"
                size="medium"
                fullWidth
              />

              {error && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.duration(800).delay(400)} 
          style={styles.bottomSection}
        >
          <View style={styles.infoCard}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Agent Access</Text>
              <Text style={styles.infoText}>
                This login is for authorized agents who can recharge student cards and manage transactions.
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    position: 'absolute',
    left: 8,
    top: 48,
    padding: 8,
    zIndex: 1,
  },
  iconContainer: {
    width: Math.min(width * 0.2, 80),
    height: Math.min(width * 0.2, 80),
    borderRadius: Math.min(width * 0.1, 40),
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  title: {
    fontSize: Math.min(width * 0.07, 28),
    fontWeight: 'bold',
    textAlign: 'center',
    color: COLORS.gray[900],
    marginBottom: 8,
  },
  organizationName: {
    fontSize: Math.min(width * 0.05, 20),
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Math.min(width * 0.04, 16),
    textAlign: 'center',
    color: COLORS.gray[600],
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  loginCard: {
    marginBottom: 24,
  },
  loginContent: {
    padding: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.error + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  bottomSection: {
    alignItems: 'center',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '08',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 18,
  },
});
