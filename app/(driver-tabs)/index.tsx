import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { Card } from '../../components/ui/Card';
import { NFCStatusIndicator } from '../../components/ui/NFCStatusIndicator';
import { Text } from '../../components/ui/Text';
import { WelcomePopup } from '../../components/ui/WelcomePopup';
import { autoTapOutService } from '../../services/autoTapOutService';
import { ExpoNFCChecker } from '../../services/expoNFCChecker';
import { mockApi } from '../../services/mockData';
import { NFCDebugger } from '../../services/nfcDebugger';
import { NFCCardData, nfcService } from '../../services/nfcService';
import { useAuthStore } from '../../stores/authStore';
import { COLORS, STORAGE_KEYS } from '../../utils/constants';
import {
    SessionStats,
    calculateRealisticFare,
    loadSessionStats,
    updateStatsForTapIn,
    updateStatsForTapOut
} from '../../utils/statistics';
import { storageService } from '../../utils/storage';

const { width, height } = Dimensions.get('screen'); // Use 'screen' instead of 'window' for full device dimensions

interface SessionData {
  userId: string;
  mobile: string;
  name: string;
  category: 'driver' | 'helper';
  loginTime: string;
}

export default function DriverHelperScanner() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState<'success' | 'error'>('success');
  const [currentCardData, setCurrentCardData] = useState<NFCCardData | null>(null);
  const [isNFCAvailable, setIsNFCAvailable] = useState(false);
  const [lastDetectedCard, setLastDetectedCard] = useState<string | null>(null);
  const [detectionTime, setDetectionTime] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalTapIns: 0,
    totalTapOuts: 0,
    totalRevenue: 0,
    lastUpdated: new Date().toISOString()
  });

  const { logout } = useAuthStore();
  const { user, showWelcomePopup, hideWelcomePopup } = useAuthStore();

  useEffect(() => {
    loadSessionData();
    // Initialize auto tap out service
    autoTapOutService.initialize();
    // Start NFC scanning
    startNFCScanning();
    
    return () => {
      // Cleanup NFC when component unmounts
      nfcService.cleanup();
    };
  }, []);

  const startNFCScanning = async () => {
    try {
      console.log('Initializing NFC for Sunmi V3...');
      
      // First check if we're in Expo Go (which doesn't support NFC)
      if (ExpoNFCChecker.isExpoGo()) {
        console.log('Running in Expo Go - NFC not supported');
        setIsNFCAvailable(false);
        Alert.alert(
          'NFC Requires Development Build',
          ExpoNFCChecker.getNFCSetupInstructions(),
          [
            { text: 'Use Demo Mode', onPress: () => setIsScanning(true) },
            { text: 'Show Setup Guide', onPress: () => {
              Alert.alert(
                'Expo Environment Info',
                ExpoNFCChecker.getExpoEnvironmentInfo(),
                [{ text: 'OK' }]
              );
            }}
          ]
        );
        return;
      }
      
      console.log('Running in development/standalone build - NFC should be supported');
      
      // Check NFC status
      const nfcStatus = await nfcService.checkNFCStatus();
      console.log('NFC Status:', nfcStatus);
      
      if (!nfcStatus.supported) {
        setIsNFCAvailable(false);
        Alert.alert(
          'NFC Not Supported',
          'This device does not support NFC functionality.',
          [
            { text: 'OK' },
            { 
              text: 'Use Demo Mode', 
              onPress: () => setIsScanning(true)
            }
          ]
        );
        return;
      }
      
      if (!nfcStatus.enabled) {
        setIsNFCAvailable(false);
        Alert.alert(
          'NFC Disabled',
          'NFC is supported but disabled. Please enable NFC in your device settings and restart the app.',
          [
            { text: 'OK' },
            { 
              text: 'Use Demo Mode', 
              onPress: () => setIsScanning(true)
            }
          ]
        );
        return;
      }
      
      // Try to initialize NFC
      const initialized = await nfcService.initialize();
      if (initialized) {
        setIsNFCAvailable(true);
        setIsScanning(true);
        await nfcService.startScanning(handleNFCCardDetection);
        console.log('NFC scanning started successfully on Sunmi V3');
        
        // Show success message
        showPopup('NFC Scanner Active - Ready for cards', 'success');
      } else {
        setIsNFCAvailable(false);
        Alert.alert(
          'NFC Initialization Failed',
          'Failed to initialize NFC on your Sunmi V3. This might be a permission issue.',
          [
            { text: 'Retry', onPress: () => startNFCScanning() },
            { 
              text: 'Use Demo Mode', 
              onPress: () => setIsScanning(true)
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('Failed to start NFC scanning:', error);
      setIsNFCAvailable(false);
      Alert.alert(
        'NFC Error',
        `NFC initialization error: ${error?.message || 'Unknown error'}. Using demo mode instead.`,
        [
          { text: 'Retry', onPress: () => startNFCScanning() },
          { text: 'Use Demo Mode', onPress: () => setIsScanning(true) }
        ]
      );
    }
  };

  const loadSessionData = async () => {
    try {
      const session = await storageService.getItem<SessionData>(STORAGE_KEYS.DRIVER_HELPER_SESSION);
      const bus = await storageService.getItem(STORAGE_KEYS.SELECTED_BUS);
      const organization = await storageService.getItem(STORAGE_KEYS.SELECTED_ORGANIZATION);
      
      if (session && bus && organization) {
        setSessionData(session);
        setSelectedBus(bus);
        setSelectedOrganization(organization);
        // Load stats after setting session data
        console.log('Loading today stats for session:', session.loginTime);
        const stats = await loadSessionStats(
          STORAGE_KEYS.DRIVER_HELPER_SESSION, 
          new Date(session.loginTime)
        );
        console.log('Loaded today stats:', stats);
        setSessionStats(stats);
      } else {
        // More specific error handling
        if (!session) {
          Alert.alert(
            'Session Expired', 
            'Your session has expired. Please log in again.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/')
              }
            ]
          );
        } else if (!bus || !organization) {
          Alert.alert(
            'Setup Incomplete', 
            'Bus or organization data is missing. Please complete the setup.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/(auth)/organization-selection')
              }
            ]
          );
        } else {
          Alert.alert('Error', 'Session data not found');
          router.replace('/');
        }
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      Alert.alert('Error', 'Failed to load session data');
      router.replace('/');
    }
  };

  const startRFIDSimulation = () => {
    // No automatic simulation - only manual simulation via button
    return () => {}; // Return empty cleanup function
  };

  const handleNFCCardDetection = async (cardData: NFCCardData) => {
    if (isProcessing) return;

    console.log('NFC Card detected:', cardData);
    setCurrentCardData(cardData);
    setLastDetectedCard(cardData.id);
    setDetectionTime(new Date().toLocaleTimeString());
    
    // Show immediate feedback on screen
    showPopup(`NFC Card Detected: ${cardData.id}`, 'success');
    
    // Use the card ID for processing
    await handleRFIDDetection(cardData.id);
  };

  const showPopup = (message: string, type: 'success' | 'error' = 'success') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowSuccessPopup(true);
    // Auto hide after 4 seconds for card detection messages
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 4000);
  };

  const showPaymentPopup = (message: string, type: 'success' | 'error' = 'success') => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPaymentModal(true);
    // Auto hide after 3 seconds for better visibility
    setTimeout(() => {
      setShowPaymentModal(false);
    }, 3000);
  };

  const handleRFIDDetection = async (cardNumber: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // No random failures - only check if card exists in our system
      const cardDetails = await mockApi.getCardDetails(cardNumber);
      
      // Check if this card is already tapped in
      const existingTrip = await checkExistingTrip(cardNumber);
      const tapType = existingTrip ? 'out' : 'in';
      
      if (tapType === 'in') {
        await processTapIn(cardDetails);
      } else {
        await processTapOut(cardDetails);
      }
    } catch (error: any) {
      // Show error popup for invalid cards (cards not in our system)
      showPopup('Invalid card detected', 'error');
      console.log('Card not found:', cardNumber);
    } finally {
      setIsProcessing(false);
    }
  };

  const processTapIn = async (cardDetails: any) => {
    if (!selectedBus || !sessionData) return;

    try {
      const result = await mockApi.tapInCard(
        cardDetails.cardNumber,
        selectedBus.id,
        parseInt(sessionData.userId)
      );

      // Schedule auto tap out for this trip
      autoTapOutService.scheduleAutoTapOut({
        id: Date.now(),
        cardId: cardDetails.id,
        cardNumber: cardDetails.cardNumber,
        busId: selectedBus.id,
        tapInTime: new Date().toISOString(),
        passengerName: result.passengerName
      });

      // Update session stats using utility
      const newStats = await updateStatsForTapIn(STORAGE_KEYS.DRIVER_HELPER_SESSION, sessionStats);
      setSessionStats(newStats);

      // Show simple success popup with card ID
      showPaymentPopup(`Tap In Successful`, 'success');
    } catch (error: any) {
      showPaymentPopup('Tap In Failed', 'error');
    }
  };

  const processTapOut = async (cardDetails: any) => {
    if (!selectedBus || !sessionData) return;

    try {
      // Generate realistic fare using utility
      const fareAmount = calculateRealisticFare();

      const result = await mockApi.tapOutCard(
        cardDetails.cardNumber,
        selectedBus.id,
        parseInt(sessionData.userId),
        fareAmount
      );

      // Update session stats using utility
      const newStats = await updateStatsForTapOut(
        STORAGE_KEYS.DRIVER_HELPER_SESSION, 
        sessionStats, 
        result.fareAmount
      );
      setSessionStats(newStats);

      // Show success popup with fare amount
      showPaymentPopup(`Payment Successful - ৳${result.fareAmount}`, 'success');
    } catch (error: any) {
      // Check if it's an insufficient balance error
      if (error.message && error.message.includes('insufficient')) {
        showPaymentPopup('Payment Failed - Insufficient Balance', 'error');
      } else {
        showPaymentPopup('Payment Failed', 'error');
      }
    }
  };

  const checkExistingTrip = async (cardNumber: string): Promise<boolean> => {
    // Check if card has an active trip (mock implementation)
    return Math.random() < 0.4; // 40% chance of existing trip
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
            await storageService.removeItem(STORAGE_KEYS.DRIVER_HELPER_SESSION);
            router.replace('/');
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <Animated.View entering={FadeInUp.duration(800)} style={styles.headerContainer}>
      <View style={styles.headerBackground}>
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>
        
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.logoContainer}>
              <View style={styles.logoIconContainer}>
                <Ionicons name="bus" size={28} color={COLORS.white} />
              </View>
              <View style={styles.logoText}>
                <Text style={styles.companyName}>
                  {selectedOrganization?.name || 'Transit Corp'}
                </Text>
                <Text style={styles.tagline}>POS Terminal System</Text>
              </View>
            </View>
          </View>

          <View style={styles.sessionInfo}>
            <Text style={styles.operatorName}>
              {sessionData?.name} ({sessionData?.category})
            </Text>
            <Text style={styles.busInfo}>
              Bus: {selectedBus?.busNumber || 'DH-11-1234'}
            </Text>
            <Text style={styles.sessionTime}>
              Session: {sessionData ? new Date(sessionData.loginTime).toLocaleTimeString() : ''}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderStats = () => (
    <Animated.View entering={FadeInUp.duration(800).delay(200)} style={styles.statsContainer}>
      <Text style={styles.statsTitle}>Today's Session</Text>
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
          <Ionicons name="log-in" size={24} color={COLORS.primary} />
          <Text style={styles.statNumber}>{sessionStats.totalTapIns}</Text>
          <Text style={styles.statLabel}>Tap Ins</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
          <Ionicons name="log-out" size={24} color={COLORS.success} />
          <Text style={styles.statNumber}>{sessionStats.totalTapOuts}</Text>
          <Text style={styles.statLabel}>Tap Outs</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.purple + '15' }]}>
          <Ionicons name="cash" size={24} color={COLORS.purple} />
          <Text style={styles.statNumber}>{sessionStats.totalRevenue}</Text>
          <Text style={styles.statLabel}>Revenue (BDT)</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderScanner = () => (
    <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.scannerContainer}>
      <Card style={styles.scannerCard}>
        <View style={styles.scannerContent}>
          <View style={[styles.scannerIcon, { opacity: isScanning ? 1 : 0.6 }]}>
            <Ionicons 
              name="radio" 
              size={48} 
              color={isScanning ? COLORS.success : COLORS.primary} 
            />
          </View>
          
          <Text style={styles.scannerTitle}>NFC Card Scanner</Text>
          <Text style={styles.scannerSubtitle}>
            {isProcessing 
              ? 'Processing card...' 
              : isScanning 
                ? 'Scanning for NFC cards...' 
                : 'Ready to scan NFC cards'
            }
          </Text>
          
          <View style={styles.scannerIndicator}>
            <View style={[
              styles.indicator, 
              { backgroundColor: isScanning ? COLORS.success : COLORS.gray[300] }
            ]} />
            <Text style={styles.indicatorText}>
              {isScanning ? 'Active' : 'Standby'}
            </Text>
          </View>

          {/* NFC Status Indicator */}
          <View style={styles.nfcStatusContainer}>
            <NFCStatusIndicator 
              isNFCAvailable={isNFCAvailable}
              isScanning={isScanning && isNFCAvailable}
              isProcessing={isProcessing}
            />
          </View>

          {/* Live NFC Detection Display */}
          {(lastDetectedCard || isScanning) && (
            <View style={styles.detectionDisplay}>
              <Text style={styles.detectionTitle}>Live NFC Detection</Text>
              {lastDetectedCard ? (
                <View style={styles.detectedCardInfo}>
                  <View style={styles.detectedCardHeader}>
                    <Ionicons name="card" size={20} color={COLORS.success} />
                    <Text style={styles.detectedCardLabel}>Last Detected Card:</Text>
                  </View>
                  <Text style={styles.detectedCardId}>{lastDetectedCard}</Text>
                  <Text style={styles.detectedCardTime}>
                    Detected at: {detectionTime}
                  </Text>
                </View>
              ) : (
                <View style={styles.scanningIndicator}>
                  <Ionicons name="search" size={16} color={COLORS.primary} />
                  <Text style={styles.scanningText}>Waiting for NFC cards...</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Card>

      <Text style={styles.helpText}>
        {isNFCAvailable && nfcService.isNFCScanning() 
          ? 'NFC Reader is active on Sunmi V3 - Tap your card on the device' 
          : isNFCAvailable 
            ? 'NFC is ready - Initialize scanning'
            : 'NFC not available - Using demo mode'
        }
      </Text>
      
      {/* Demo Button for Testing when NFC is not available */}
      {!nfcService.isNFCScanning() && (
        <View style={styles.buttonContainer}>
          {!isNFCAvailable && (
            <>
              <TouchableOpacity 
                style={[styles.demoButton, styles.debugButton]}
                onPress={() => NFCDebugger.showDiagnostics()}
              >
                <Ionicons name="bug" size={20} color={COLORS.info} />
                <Text style={[styles.demoButtonText, { color: COLORS.info }]}>
                  Run NFC Diagnostics
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.demoButton, styles.debugButton]}
                onPress={() => {
                  Alert.alert(
                    'Expo Environment Info',
                    ExpoNFCChecker.getExpoEnvironmentInfo(),
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Ionicons name="information-circle" size={20} color={COLORS.info} />
                <Text style={[styles.demoButtonText, { color: COLORS.info }]}>
                  Show Expo Environment
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.demoButton, styles.retryButton]}
                onPress={startNFCScanning}
              >
                <Ionicons name="refresh-circle" size={20} color={COLORS.warning} />
                <Text style={[styles.demoButtonText, { color: COLORS.warning }]}>
                  Retry NFC Initialization
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity 
            style={styles.demoButton}
            onPress={() => {
              // Only use valid cards from mock data - no random failures
              const validCards = [
                'CARD123456', 'CARD789012', 'CARD345678', 
                'CARD901234', 'CARD567890', 'CARD234567',
                'CARD890123', 'CARD456123', 'CARD789456',
                'CARD123789', 'CARD654321', 'CARD987654', 'CARD147258',
                // Real NFC cards detected on device
                '0127D507AE5C8895', 'A7A159E4', '471E5DE4', '0217261E'
              ];
              const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
              // Simulate NFC card data for demo
              setCurrentCardData({
                id: randomCard,
                type: 'Demo Card',
                data: { demo: true }
              });
              setLastDetectedCard(randomCard);
              setDetectionTime(new Date().toLocaleTimeString());
              showPopup(`Demo Card Detected: ${randomCard}`, 'success');
              handleRFIDDetection(randomCard);
            }}
          >
            <Ionicons name="play-circle" size={20} color={COLORS.primary} />
            <Text style={styles.demoButtonText}>Simulate Card Detection (Demo)</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );

  const renderPaymentPopup = () => {
    return (
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
      >
        <Animated.View
          entering={FadeInUp.duration(400)}
          exiting={FadeOutUp.duration(400)}
          style={styles.paymentModalOverlay}
        >
          <View style={styles.paymentModalContent}>
            <View style={[
              styles.paymentIcon,
              { backgroundColor: popupType === 'success' ? COLORS.success : COLORS.error }
            ]}>
              <Ionicons 
                name={popupType === 'success' ? "checkmark" : "close"} 
                size={80} 
                color={COLORS.white} 
              />
            </View>
            <Text style={styles.paymentModalText}>{popupMessage}</Text>
            {currentCardData && (
              <View style={styles.cardIdContainer}>
                <Text style={styles.cardIdLabel}>Card ID:</Text>
                <Text style={styles.cardIdValue}>{currentCardData.id}</Text>
              </View>
            )}
            <Text style={styles.paymentModalSubtext}>
              {popupType === 'success' ? 'Transaction Completed Successfully' : 'Transaction Failed'}
            </Text>
          </View>
        </Animated.View>
      </Modal>
    );
  };

  const renderSuccessPopup = () => {
    if (!showSuccessPopup) return null;
    
    return (
      <Animated.View
        entering={FadeInUp.duration(300)}
        exiting={FadeOutUp.duration(300)}
        style={[
          styles.successPopup,
          { backgroundColor: popupType === 'success' ? COLORS.success : COLORS.error }
        ]}
      >
        <Ionicons 
          name={popupType === 'success' ? "checkmark-circle" : "alert-circle"} 
          size={24} 
          color={COLORS.white} 
        />
        <Text style={styles.successPopupText}>{popupMessage}</Text>
      </Animated.View>
    );
  };

  // NFC scanning is now handled in the startNFCScanning function
  // No need for automatic scanning effect

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderStats()}
        {renderScanner()}
      </ScrollView>
      {renderSuccessPopup()}
      
      {/* Welcome Popup */}
      <WelcomePopup
        visible={showWelcomePopup}
        userName={user?.name || 'User'}
        onClose={hideWelcomePopup}
      />
      
      {/* Payment Popup - Using Modal for true full screen */}
      {renderPaymentPopup()}
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
  },
  headerContainer: {
    marginBottom: 20,
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
  },
  header: {
    padding: 20,
    paddingTop: 40,
    position: 'relative',
    zIndex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 2,
  },
  tagline: {
    fontSize: 12,
    color: COLORS.white + '80',
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    backgroundColor: COLORS.white + '15',
    borderRadius: 16,
    padding: 16,
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 4,
  },
  busInfo: {
    fontSize: 14,
    color: COLORS.white + '90',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 12,
    color: COLORS.white + '70',
  },
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  scannerContainer: {
    marginHorizontal: 20,
    marginBottom: 40,
  },  scannerCard: {
    padding: 0,
    marginBottom: 16,
  },
  scannerContent: {
    padding: 32,
    alignItems: 'center',
  },
  scannerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 8,
  },
  scannerSubtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: 20,
  },
  scannerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  indicatorText: {
    fontSize: 12,
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  nfcStatusContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
  },
  retryButton: {
    backgroundColor: COLORS.warning + '15',
  },
  debugButton: {
    backgroundColor: COLORS.info + '15',
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '15',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  demoButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  successPopup: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  successPopupText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  // Payment Modal Styles (Full Screen Modal)
  paymentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  paymentModalContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
  },
  paymentIcon: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  paymentModalText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  paymentModalSubtext: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 12,
  },
  cardIdContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  cardIdLabel: {
    color: COLORS.white,
    fontSize: 16,
    opacity: 0.9,
    marginBottom: 8,
    fontWeight: '500',
  },
  cardIdValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  // Live NFC Detection Styles
  detectionDisplay: {
    marginTop: 20,
    backgroundColor: COLORS.gray[50],
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  detectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
    textAlign: 'center',
  },
  detectedCardInfo: {
    alignItems: 'center',
  },
  detectedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detectedCardLabel: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginLeft: 6,
  },
  detectedCardId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detectedCardTime: {
    fontSize: 11,
    color: COLORS.gray[500],
    fontStyle: 'italic',
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 6,
    fontStyle: 'italic',
  },
});
