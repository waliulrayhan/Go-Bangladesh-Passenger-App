import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { WelcomePopup } from '../../components/ui/WelcomePopup';
import { mockApi } from '../../services/mockData';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, STORAGE_KEYS } from '../../utils/constants';
import { storageService } from '../../utils/storage';

interface AgentSessionData {
  agentId: number;
  agentName: string;
  agentMobile: string;
  organizationId: number;
  organizationName: string;
  loginTime: string;
}

export default function AgentRecharge() {
  const [sessionData, setSessionData] = useState<AgentSessionData | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState<any>(null);
  const [todayStats, setTodayStats] = useState({
    totalRecharges: 0,
    totalAmount: 0
  });

  const { logout, user } = useAuthStore();
  const { showWelcomePopup, hideWelcomePopup } = useAuthStore();

  useEffect(() => {
    loadSessionData();
    loadTodayStats();
    // Start simulating RFID detection
    const cleanup = startRFIDSimulation();
    return cleanup;
  }, []);

  const loadSessionData = async () => {
    try {
      const session = await storageService.getItem<AgentSessionData>(STORAGE_KEYS.AGENT_SESSION);
      
      if (session) {
        setSessionData(session);
      } else {
        Alert.alert('Error', 'Session data not found');
        router.replace('/');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load session data');
      router.replace('/');
    }
  };

  const loadTodayStats = async () => {
    try {
      const sessionData = await storageService.getItem<AgentSessionData>(STORAGE_KEYS.AGENT_SESSION);
      if (sessionData) {
        const transactions = await mockApi.getRechargeTransactions(sessionData.agentId);
        const today = new Date().toDateString();
        const todayTransactions = transactions.filter(t => 
          new Date(t.timestamp).toDateString() === today
        );
        
        setTodayStats({
          totalRecharges: todayTransactions.length,
          totalAmount: todayTransactions.reduce((sum, t) => sum + t.amount, 0)
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const startRFIDSimulation = () => {
    // No automatic simulation - only manual simulation via button
    return () => {}; // Return empty cleanup function
  };

  const handleCardDetected = async (detectedCard: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const details = await mockApi.getCardDetails(detectedCard);
      setCardDetails(details);
      setCardNumber(detectedCard);
    } catch (error: any) {
      // Silently handle invalid cards - don't show error alert for card detection
      // Only show error during recharge process
      console.log('Card not found:', detectedCard);
    } finally {
      setIsProcessing(false);
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
            await logout();
            await storageService.removeItem(STORAGE_KEYS.AGENT_SESSION);
            router.replace('/');
          }
        }
      ]
    );
  };

  const handleRecharge = async () => {
    if (!cardNumber.trim()) {
      Alert.alert('Error', 'Please scan an RFID card first');
      return;
    }

    if (!cardDetails) {
      Alert.alert('Error', 'Card details not loaded. Please scan the card again.');
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!sessionData) {
      Alert.alert('Error', 'Session data not found');
      return;
    }

    // Confirmation dialog before processing
    Alert.alert(
      'Confirm Recharge',
      `Are you sure you want to recharge ৳${amount} to card ${cardNumber}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'OK',
          style: 'default',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const result = await mockApi.rechargeCard(
                cardNumber.trim(),
                Number(amount),
                sessionData.agentId
              );

              Alert.alert(
                'Success',
                `Card recharged successfully!\n\nAmount: ৳${amount}\nNew Balance: ৳${result.newBalance.toFixed(2)}`,
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Reset all form data after successful transaction
                      setCardNumber('');
                      setAmount('');
                      setCardDetails(null);
                      setIsProcessing(false);
                      // Reload stats to see updated data
                      loadTodayStats();
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Recharge failed');
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };  const renderHeader = () => (
    <Animated.View entering={FadeInUp.duration(800)} style={styles.headerContainer}>
      <View style={styles.headerBackground}>
        {/* Animated Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>
        
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <View style={styles.logoIconContainer}>
                <Ionicons name="business" size={28} color={COLORS.white} />
              </View>
              <View style={styles.logoText}>
                <Text style={styles.companyName}>Go Bangladesh</Text>
                <Text style={styles.tagline}>Agent Recharge Terminal</Text>
              </View>
            </View>
          </View>

          {/* Agent Session Info */}
          <View style={styles.sessionInfo}>
            <Text style={styles.agentName}>
              Agent: {sessionData?.agentName || 'Kamrul Islam'}
            </Text>
            <Text style={styles.organizationInfoText}>
              {sessionData?.organizationName || 'Dhaka University'}
            </Text>
            <Text style={styles.sessionTime}>
              Session: {sessionData ? new Date(sessionData.loginTime).toLocaleTimeString() : '3:18:38 AM'}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
  const renderStatsCards = () => (
    <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.statsContainer}>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
          <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          <Text style={styles.statNumber}>{todayStats.totalRecharges}</Text>
          <Text style={styles.statLabel}>Today's Recharges</Text>
        </View>
        
        <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
          <Ionicons name="wallet" size={24} color={COLORS.success} />
          <Text style={styles.statNumber}>৳{todayStats.totalAmount.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Amount</Text>
        </View>
      </View>
    </Animated.View>
  );
  const renderRechargeForm = () => (
    <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.formContainer}>
      <Card variant="elevated" style={styles.formCard}>
        <View style={styles.formHeader}>
          <Ionicons name="card-outline" size={32} color={COLORS.primary} />
          <Text style={styles.formTitle}>Card Recharge Terminal</Text>
          <Text style={styles.formSubtitle}>Scan card and enter amount to recharge</Text>
        </View>
        
        {/* RFID Scanning Section */}
        <View style={styles.rfidSection}>
          <View style={styles.rfidIndicator}>
            <View style={[styles.rfidIcon, !cardNumber && styles.rfidIconActive]}>
              <Ionicons 
                name="radio" 
                size={28} 
                color={cardNumber ? COLORS.success : COLORS.primary} 
              />
            </View>
            <View style={styles.rfidTextContainer}>
              <Text style={styles.rfidTitle}>
                {cardNumber ? 'Card Detected' : 'RFID Scanner Ready'}
              </Text>
              <Text style={styles.rfidSubtitle}>
                {cardNumber 
                  ? 'Card detected successfully' 
                  : 'Hold RFID card near the scanner'
                }
              </Text>
            </View>
          </View>
          
          {/* Manual Simulation Button */}
          <TouchableOpacity 
            style={[styles.simulateButton, isProcessing && styles.simulateButtonDisabled]}
            onPress={() => {
              // Use valid card numbers from mock data for better user experience
              const validCards = [
                'GB-7823456012', 'GB-8901234567', 'GB-3456789012', 'GB-9012345678',
                'GB-5678901234', 'GB-2345678901', 'GB-8901234568', 'GB-4561234578',
                'GB-7894567890', 'GB-1234567890', 'GB-6789012345', 'GB-0123456789',
                'CARD123456', 'CARD789012', 'CARD345678', 'CARD901234'
              ];
              const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
              handleCardDetected(randomCard);
            }}
            disabled={isProcessing}
          >
            <Ionicons name="scan-outline" size={18} color={isProcessing ? COLORS.gray[400] : COLORS.primary} />
            <Text style={[styles.simulateButtonText, isProcessing && { color: COLORS.gray[400] }]}>
              {isProcessing ? 'Scanning...' : 'Test Card Scan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card Details Section */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <Input
                label="Card Number"
                value={cardNumber}
                onChangeText={setCardNumber}
                placeholder="No card detected"
                icon="card-outline"
                editable={false}
              />
            </View>
            {(cardNumber || amount) && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => {
                  Alert.alert(
                    'Clear Form',
                    'Clear all entered data?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Clear',
                        style: 'destructive',
                        onPress: () => {
                          setCardNumber('');
                          setAmount('');
                          setCardDetails(null);
                        }
                      }
                    ]
                  );
                }}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.error} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {cardDetails && (
            <Animated.View entering={FadeInDown.duration(500)} style={styles.cardInfo}>
              <View style={styles.cardInfoHeader}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                <Text style={styles.cardInfoTitle}>Card Successfully Detected</Text>
              </View>
              <Text style={styles.cardInfoText}>
                Ready for recharge
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Amount Input Section */}
        <View style={styles.inputContainer}>
          <Input
            label="Recharge Amount"
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount to recharge"
            keyboardType="numeric"
            icon="wallet-outline"
            editable={!!cardNumber}
          />
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmountContainer}>
          <Text style={styles.quickAmountLabel}>Quick Amount Selection</Text>
          <View style={styles.quickAmountButtons}>
            {[100, 200, 500].map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  Number(amount) === quickAmount && styles.quickAmountButtonActive,
                  !cardNumber && styles.quickAmountButtonDisabled
                ]}
                onPress={() => setAmount(quickAmount.toString())}
                disabled={!cardNumber}
              >
                <Text style={[
                  styles.quickAmountButtonText,
                  Number(amount) === quickAmount && styles.quickAmountButtonTextActive,
                  !cardNumber && styles.quickAmountButtonTextDisabled
                ]}>
                  ৳{quickAmount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <Button
            title="Recharge Card"
            onPress={handleRecharge}
            loading={isProcessing}
            disabled={!cardNumber.trim() || !amount.trim()}
            icon="wallet-outline"
            fullWidth
          />
        </View>
      </Card>
    </Animated.View>
  );

  if (!sessionData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeader()}
        <View style={styles.contentWrapper}>
          {renderStatsCards()}
          {renderRechargeForm()}
        </View>
      </ScrollView>

      {/* Welcome Popup */}
      <WelcomePopup
        visible={showWelcomePopup}
        userName={user?.name || 'User'}
        onClose={hideWelcomePopup}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  content: {
    flex: 1,
  },  scrollContent: {
    paddingBottom: 20,
  },
  contentWrapper: {
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
  },  // Header Styles
  headerContainer: {
    marginBottom: 16,
  },
  headerBackground: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: 'absolute',
    borderRadius: 100,
    backgroundColor: COLORS.white,
    opacity: 0.1,
  },
  circle1: {
    width: 120,
    height: 120,
    top: -40,
    right: -20,
  },
  circle2: {
    width: 80,
    height: 80,
    top: 60,
    right: 60,
  },
  circle3: {
    width: 60,
    height: 60,
    bottom: -20,
    left: 40,
  },  header: {
    padding: 24,
    paddingTop: 50,
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.white + '90',
    marginTop: 2,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },  sessionInfo: {
    backgroundColor: COLORS.white + '15',
    borderRadius: 16,
    padding: 16,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  organizationInfoText: {
    fontSize: 14,
    color: COLORS.white + '90',
    marginBottom: 4,
  },  sessionTime: {
    fontSize: 12,
    color: COLORS.white + '70',
  },  // Stats Styles
  statsContainer: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginTop: 6,
    marginBottom: 2,
  },
  statLabel: {    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
  },  // Form Styles
  formContainer: {
    marginBottom: 20,
  },formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 24,
  },  formHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },  inputContainer: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    height: 44, // Match exact input field height (SIZES.input.md)
    backgroundColor: COLORS.error + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error + '20',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: 4,
  },
  cardInfo: {
    marginTop: 12,
    padding: 16,
    backgroundColor: COLORS.success + '10',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  cardInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    marginLeft: 8,
  },
  cardInfoText: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '600',
  },  quickAmountContainer: {
    marginBottom: 20,
  },
  quickAmountLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 12,
  },
  quickAmountButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },  quickAmountButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  quickAmountButtonDisabled: {
    backgroundColor: COLORS.gray[100],
    borderColor: COLORS.gray[200],
  },
  quickAmountButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
  },
  quickAmountButtonTextActive: {
    color: COLORS.white,
  },
  quickAmountButtonTextDisabled: {
    color: COLORS.gray[400],
  },  // RFID Section Styles
  rfidSection: {
    marginBottom: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  rfidIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  rfidIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
  },
  rfidIconActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary + '30',
  },
  rfidTextContainer: {
    flex: 1,
  },
  rfidTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
  },
  rfidSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    lineHeight: 20,
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  simulateButtonDisabled: {
    backgroundColor: COLORS.gray[100],
    borderColor: COLORS.gray[200],
  },
  simulateButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Action Container Styles
  actionContainer: {
    marginTop: 8,
  },
});
