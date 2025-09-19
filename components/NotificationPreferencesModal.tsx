import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StatusBar, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
import { Text } from './ui/Text';

interface NotificationPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  visible,
  onClose
}) => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [lowBalanceAlerts, setLowBalanceAlerts] = useState(true);
  const [tripReminders, setTripReminders] = useState(false);
  const [promotionalOffers, setPromotionalOffers] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleSavePreferences = () => {
    // Save notification preferences to storage or send to API
    Alert.alert('Success', 'Notification preferences saved successfully!');
    onClose();
  };

  const handleTestNotification = () => {
    Alert.alert('Test Notification', 'This is a test notification to check your settings.');
  };

  const NotificationItem = ({ 
    icon, 
    title, 
    subtitle, 
    value, 
    onValueChange,
    iconColor = COLORS.primary
  }: {
    icon: string;
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    iconColor?: string;
  }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationLeft}>
        <View style={[styles.notificationIcon, { backgroundColor: iconColor + '15' }]}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.notificationInfo}>
          <Text variant="body" style={styles.notificationTitle}>{title}</Text>
          <Text variant="caption" style={styles.notificationSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: COLORS.gray[300], true: COLORS.primary + '40' }}
        thumbColor={value ? COLORS.primary : COLORS.gray[400]}
      />
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
              <Ionicons name="notifications" size={20} color={COLORS.primary} />
            </View>
            <Text variant="h5" style={styles.headerTitle}>Notification Preferences</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* General Settings */}
          <View style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>General</Text>
            <View style={styles.sectionContent}>
              <NotificationItem
                icon="notifications"
                title="Push Notifications"
                subtitle="Enable push notifications for the app"
                value={pushNotifications}
                onValueChange={setPushNotifications}
              />
              <NotificationItem
                icon="mail"
                title="Email Notifications"
                subtitle="Receive notifications via email"
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                iconColor={COLORS.info}
              />
            </View>
          </View>

          {/* Transaction Alerts */}
          <View style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>Transaction Alerts</Text>
            <View style={styles.sectionContent}>
              <NotificationItem
                icon="card"
                title="Transaction Alerts"
                subtitle="Get notified for all transactions"
                value={transactionAlerts}
                onValueChange={setTransactionAlerts}
                iconColor={COLORS.success}
              />
              <NotificationItem
                icon="wallet"
                title="Low Balance Alerts"
                subtitle="Alert when balance is below ৳20"
                value={lowBalanceAlerts}
                onValueChange={setLowBalanceAlerts}
                iconColor={COLORS.warning}
              />
            </View>
          </View>

          {/* Trip Notifications */}
          <View style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>Trip Notifications</Text>
            <View style={styles.sectionContent}>
              <NotificationItem
                icon="bus"
                title="Trip Reminders"
                subtitle="Reminders for upcoming trips"
                value={tripReminders}
                onValueChange={setTripReminders}
                iconColor={COLORS.purple}
              />
            </View>
          </View>

          {/* Marketing */}
          <View style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>Marketing & Updates</Text>
            <View style={styles.sectionContent}>
              <NotificationItem
                icon="gift"
                title="Promotional Offers"
                subtitle="Special offers and discounts"
                value={promotionalOffers}
                onValueChange={setPromotionalOffers}
                iconColor={COLORS.secondary}
              />
              <NotificationItem
                icon="information-circle"
                title="System Updates"
                subtitle="App updates and system maintenance"
                value={systemUpdates}
                onValueChange={setSystemUpdates}
                iconColor={COLORS.info}
              />
            </View>
          </View>

          {/* Sound & Vibration */}
          <View style={styles.section}>
            <Text variant="h6" style={styles.sectionTitle}>Sound & Vibration</Text>
            <View style={styles.sectionContent}>
              <NotificationItem
                icon="volume-high"
                title="Sound"
                subtitle="Play sound for notifications"
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                iconColor={COLORS.primary}
              />
              <NotificationItem
                icon="phone-portrait"
                title="Vibration"
                subtitle="Vibrate for notifications"
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                iconColor={COLORS.primary}
              />
            </View>
          </View>

          {/* Test Notification */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
              <View style={styles.testButtonContent}>
                <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
                <Text variant="body" style={styles.testButtonText}>Test Notification</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom padding for better scrolling */}
          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSavePreferences}>
            <Text variant="button" style={styles.saveButtonText}>Save Preferences</Text>
          </TouchableOpacity>
        </View>
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
    borderRadius: 12,
    overflow: 'hidden',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  notificationSubtitle: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 1,
  },
  testButton: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  testButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  bottomPadding: {
    height: 20,
  },
});
