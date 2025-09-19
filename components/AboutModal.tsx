import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Modal, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useToast } from '../hooks/useToast';
import { BORDER_RADIUS, COLORS, SPACING } from '../utils/constants';
import { GoBangladeshLogo } from './GoBangladeshLogo';
import { Text } from './ui/Text';
import { Toast } from './ui/Toast';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  visible,
  onClose
}) => {
  const { toast, showError, hideToast } = useToast();
  
  const appInfo = {
    version: '1.0.0',
    buildNumber: '100',
    lastUpdate: 'January 2025',
    developer: 'Go Bangladesh Team',
    email: 'info@thegobd.com',
    website: 'https://thegobd.com/',
    privacyPolicy: 'https://thegobd.com/privacy',
    termsOfService: 'https://thegobd.com/terms'
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url).catch(() => {
      showError('Unable to open link');
    });
  };

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${appInfo.email}`).catch(() => {
      showError('Unable to open email client');
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
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
                <GoBangladeshLogo size={70} />
              </View>
            </View>
            <Text variant="h4" style={styles.appName}>Go Bangladesh</Text>
            <Text variant="body" style={styles.appSlogan}>One step toward a better future</Text>
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

          {/* Copyright */}
          <View style={styles.copyrightSection}>
            <Text variant="caption" style={styles.copyrightText}>
              © 2025 Go Bangladesh. All rights reserved.
            </Text>
          </View>

          {/* Bottom padding for better scrolling */}
          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Toast */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}/>
      </View>
    </Modal>
  );
};

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
  logoSection: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    marginBottom: SPACING.md,
  },
  logoContainer: {
    marginBottom: SPACING.lg,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.brand.blue_subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  appSlogan: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  appDescription: {
    fontSize: 14,
    color: COLORS.gray[700],
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  infoLabel: {
    fontSize: 15,
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
    fontWeight: '500',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  featureText: {
    fontSize: 14,
    color: COLORS.gray[700],
    marginLeft: SPACING.sm,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: SPACING['2xl'],
    backgroundColor: COLORS.brand.blue_subtle,
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  bottomPadding: {
    height: SPACING['5xl'],
  },
});

