import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
import { Text } from './ui/Text';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  visible,
  onClose
}) => {
  const appInfo = {
    version: '1.0.0',
    buildNumber: '100',
    lastUpdate: 'January 2025',
    developer: 'Go Bangladesh Team',
    email: 'info@thegobd.com',
    website: 'https://gobangladesh.com',
    privacyPolicy: 'https://gobangladesh.com/privacy',
    termsOfService: 'https://gobangladesh.com/terms'
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${appInfo.email}`).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const InfoItem = ({ 
    label, 
    value, 
    isLink = false, 
    onPress 
  }: {
    label: string;
    value: string;
    isLink?: boolean;
    onPress?: () => void;
  }) => (
    <View style={styles.infoItem}>
      <Text variant="body" style={styles.infoLabel}>{label}</Text>
      {isLink ? (
        <TouchableOpacity onPress={onPress}>
          <Text variant="body" style={styles.infoLink}>{value}</Text>
        </TouchableOpacity>
      ) : (
        <Text variant="body" style={styles.infoValue}>{value}</Text>
      )}
    </View>
  );

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
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            </View>
            <Text variant="h5" style={styles.headerTitle}>About Go Bangladesh</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* App Logo and Description */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons name="bus" size={40} color={COLORS.primary} />
              </View>
            </View>
            <Text variant="h4" style={styles.appName}>Go Bangladesh</Text>
            <Text variant="body" style={styles.appSlogan}>One step toward a better future</Text>
            <Text variant="body" style={styles.appDescription}>
              Your convenient way to pay for transport with RFID card technology. 
              Experience seamless travel across Bangladesh with our smart card system.
            </Text>
          </View>

          {/* App Information */}
          <View style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>App Information</Text>
            <View style={styles.sectionContent}>
              <InfoItem label="Version" value={appInfo.version} />
              <InfoItem label="Build Number" value={appInfo.buildNumber} />
              <InfoItem label="Last Update" value={appInfo.lastUpdate} />
              <InfoItem label="Developer" value={appInfo.developer} />
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>Contact</Text>
            <View style={styles.sectionContent}>
              <InfoItem 
                label="Email" 
                value={appInfo.email} 
                isLink 
                onPress={handleEmailPress} 
              />
              <InfoItem 
                label="Website" 
                value={appInfo.website} 
                isLink 
                onPress={() => handleLinkPress(appInfo.website)} 
              />
            </View>
          </View>

          {/* Legal Information */}
          <View style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>Legal</Text>
            <View style={styles.sectionContent}>
              <InfoItem 
                label="Privacy Policy" 
                value="View Privacy Policy" 
                isLink 
                onPress={() => handleLinkPress(appInfo.privacyPolicy)} 
              />
              <InfoItem 
                label="Terms of Service" 
                value="View Terms of Service" 
                isLink 
                onPress={() => handleLinkPress(appInfo.termsOfService)} 
              />
            </View>
          </View>

          {/* Features */}
          <View style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>Features</Text>
            <View style={styles.sectionContent}>
              <View style={styles.featureItem}>
                <Ionicons name="card" size={20} color={COLORS.primary} />
                <Text variant="body" style={styles.featureText}>RFID Card Integration</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="flash" size={20} color={COLORS.primary} />
                <Text variant="body" style={styles.featureText}>Instant Balance Updates</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="time" size={20} color={COLORS.primary} />
                <Text variant="body" style={styles.featureText}>Trip History Tracking</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
                <Text variant="body" style={styles.featureText}>Secure Transactions</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="notifications" size={20} color={COLORS.primary} />
                <Text variant="body" style={styles.featureText}>Real-time Notifications</Text>
              </View>
            </View>
          </View>

          {/* Copyright */}
          <View style={styles.copyrightSection}>
            <Text variant="caption" style={styles.copyrightText}>
              © 2025 Go Bangladesh. All rights reserved.
            </Text>
            <Text variant="caption" style={styles.copyrightText}>
              Built with ❤️ for the people of Bangladesh
            </Text>
          </View>

          {/* Bottom padding for better scrolling */}
          <View style={styles.bottomPadding} />
        </ScrollView>
      </View>
    </Modal>
  );
};

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
  logoSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.md,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  appSlogan: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  appDescription: {
    fontSize: 14,
    color: COLORS.gray[700],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  infoLink: {
    fontSize: 14,
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  featureText: {
    fontSize: 14,
    color: COLORS.gray[700],
    marginLeft: SPACING.sm,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  bottomPadding: {
    height: 40,
  },
});
