import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StatusBar, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { useToast } from '../hooks/useToast';
import { BORDER_RADIUS, COLORS, SPACING } from '../utils/constants';
import { AboutModal } from './AboutModal';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import { Text } from './ui/Text';
import { Toast } from './ui/Toast';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose
}) => {
  const [notifications, setNotifications] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoTopUp, setAutoTopUp] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const { toast, showSuccess, hideToast } = useToast();

  const handleClearCache = () => {
    // Add cache clearing logic here
    showSuccess('Cache cleared successfully');
  };

  const handleExportData = () => {
    // Add data export logic here
    showSuccess('Data exported successfully');
  };

  const handleResetSettings = () => {
    setNotifications(true);
    setBiometricAuth(false);
    setAutoRefresh(true);
    setDarkMode(false);
    setSoundEffects(true);
    setAutoTopUp(false);
    showSuccess('Settings reset to default values');
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text variant="h6" style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onValueChange,
    type = 'switch'
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    type?: 'switch' | 'action';
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <View style={styles.settingIcon}>
          <Ionicons name={icon as any} size={20} color={COLORS.primary} />
        </View>
        <View style={styles.settingInfo}>
          <Text variant="body" style={styles.settingTitle}>{title}</Text>
          {subtitle && (
            <Text variant="caption" style={styles.settingSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {type === 'switch' && value !== undefined && onValueChange && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: COLORS.gray[300], true: COLORS.primary + '40' }}
          thumbColor={value ? COLORS.primary : COLORS.gray[400]}
        />
      )}
      {type === 'action' && (
        <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="settings" size={20} color={COLORS.primary} />
            </View>
            <Text variant="h5" style={styles.headerTitle}>Settings</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Notifications */}
          {/* <SettingSection title="Notifications">
            <SettingItem
              icon="notifications"
              title="Push Notifications"
              subtitle="Get alerts for transactions and updates"
              value={notifications}
              onValueChange={setNotifications}
            />
            <TouchableOpacity onPress={() => setShowNotificationModal(true)}>
              <SettingItem
                icon="settings"
                title="Notification Preferences"
                subtitle="Customize your notification settings"
                type="action"
              />
            </TouchableOpacity>
            <SettingItem
              icon="volume-high"
              title="Sound Effects"
              subtitle="Play sounds for actions and notifications"
              value={soundEffects}
              onValueChange={setSoundEffects}
            />
          </SettingSection> */}

          {/* Security */}
          {/* <SettingSection title="Security">
            <SettingItem
              icon="finger-print"
              title="Biometric Authentication"
              subtitle="Use fingerprint or face recognition"
              value={biometricAuth}
              onValueChange={setBiometricAuth}
            />
            <SettingItem
              icon="refresh"
              title="Auto Refresh Data"
              subtitle="Automatically refresh balance and transactions"
              value={autoRefresh}
              onValueChange={setAutoRefresh}
            />
          </SettingSection> */}

          {/* Card Management */}
          {/* <SettingSection title="Card Management">
            <SettingItem
              icon="wallet"
              title="Auto Top-up"
              subtitle="Automatically add funds when balance is low (৳20)"
              value={autoTopUp}
              onValueChange={setAutoTopUp}
            />
            <SettingItem
              icon="card"
              title="Quick Balance Check"
              subtitle="Show balance on app icon (if supported)"
              value={false}
              onValueChange={() => {}}
            />
          </SettingSection> */}

          {/* Appearance */}
          {/* <SettingSection title="Appearance">
            <SettingItem
              icon="moon"
              title="Dark Mode"
              subtitle="Switch to dark theme (coming soon)"
              value={darkMode}
              onValueChange={setDarkMode}
            />
            <SettingItem
              icon="contrast"
              title="High Contrast"
              subtitle="Improve readability with high contrast colors"
              value={false}
              onValueChange={() => {}}
            />
          </SettingSection> */}

          {/* Privacy */}
          {/* <SettingSection title="Privacy">
            <SettingItem
              icon="eye-off"
              title="Private Mode"
              subtitle="Hide balance and transaction amounts"
              value={false}
              onValueChange={() => {}}
            />
            <SettingItem
              icon="analytics"
              title="Usage Analytics"
              subtitle="Help improve the app by sharing usage data"
              value={true}
              onValueChange={() => {}}
            />
          </SettingSection> */}

          {/* Data Management */}
          {/* <SettingSection title="Data Management">
            <TouchableOpacity onPress={handleExportData}>
              <SettingItem
                icon="download"
                title="Export Data"
                subtitle="Download your transaction history"
                type="action"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleClearCache}>
              <SettingItem
                icon="trash"
                title="Clear Cache"
                subtitle="Remove temporary files to free up space"
                type="action"
              />
            </TouchableOpacity>
          </SettingSection> */}

          {/* App Information */}
          <SettingSection title="App Information">
            <TouchableOpacity onPress={() => setShowAboutModal(true)}>
              <SettingItem
                icon="information-circle"
                title="About Go Bangladesh"
                subtitle="App info, version, and developer details"
                type="action"
              />
            </TouchableOpacity>
          </SettingSection>

          {/* Bottom padding for better scrolling */}
          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Toast */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
          position="bottom"
        />
      </View>

      {/* About Modal */}
      <AboutModal
        visible={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      {/* Notification Preferences Modal */}
      <NotificationPreferencesModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
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
    color: COLORS.gray[800],
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  sectionContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brand.blue_subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  bottomPadding: {
    height: SPACING['6xl'],
  },
});
