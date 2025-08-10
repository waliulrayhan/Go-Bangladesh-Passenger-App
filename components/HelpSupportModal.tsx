import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../utils/constants';
import { Text } from './ui/Text';

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  visible,
  onClose
}) => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const contactInfo = {
    email: 'info@thegobd.com',
    phone: '+8801521306506',
    website: 'https://thegobd.com',
    address: 'Dhaka, Bangladesh'
  };

  const faqData = [
    {
      question: 'How do I top up my card?',
      answer: 'You can top up your card through mobile banking, online banking, or at any authorized recharge station. The balance will be updated instantly in your account.'
    },
    {
      question: 'What should I do if my card is lost or stolen?',
      answer: 'Immediately contact our support team to block your card and prevent unauthorized use. You can get a replacement card with your remaining balance transferred.'
    },
    {
      question: 'How do I check my travel history?',
      answer: 'Go to the History tab in the app to view all your trips and transactions. You can filter by date range and transaction type.'
    },
    {
      question: 'Why is my balance not updating?',
      answer: 'Try refreshing the app by pulling down on the home screen. If the issue persists, check your internet connection or contact support.'
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to Profile > Change Password. You will need to enter your current password and create a new one.'
    },
    {
      question: 'Can I use my card on different bus routes?',
      answer: 'Yes, your Go Bangladesh card works on all participating bus routes and transport services in the network.'
    },
    {
      question: 'How do I update my personal information?',
      answer: 'Go to your Profile section and tap the Edit button to update your personal information like phone number, email, and address.'
    },
    {
      question: 'What is the minimum balance required?',
      answer: 'The minimum balance required is ৳20. You will be notified when your balance falls below this amount.'
    }
  ];

  const handleContactPress = (type: 'email' | 'phone' | 'website') => {
    switch (type) {
      case 'email':
        Linking.openURL(`mailto:${contactInfo.email}`);
        break;
      case 'phone':
        Linking.openURL(`tel:${contactInfo.phone}`);
        break;
      case 'website':
        Linking.openURL(contactInfo.website);
        break;
    }
  };

  const handleReportIssue = () => {
    Alert.alert(
      'Report Issue',
      'Choose how you would like to report your issue:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Support',
          onPress: () => {
            const subject = 'Issue Report - Go Bangladesh App';
            const body = `Hi Go Bangladesh Support Team,

I'm experiencing an issue with the app. Here are the details:

Device: ${Platform.OS}
App Version: 1.0.0
Issue Description: [Please describe your issue here]

Best regards,
[Your Name]`;
            Linking.openURL(`mailto:${contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
          }
        },
        {
          text: 'Call Support',
          onPress: () => handleContactPress('phone')
        }
      ]
    );
  };

  const handleSendFeedback = () => {
    Alert.alert(
      'Send Feedback',
      'We value your feedback! Please choose how you would like to share your thoughts:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Email Feedback',
          onPress: () => {
            const subject = 'App Feedback - Go Bangladesh';
            const body = `Hi Go Bangladesh Team,

I'd like to share some feedback about the app:

App Version: 1.0.0
Device: ${Platform.OS}
Rating: [1-5 stars]

Feedback:
[Please share your thoughts, suggestions, or compliments here]

Thank you for creating this app!

Best regards,
[Your Name]`;
            Linking.openURL(`mailto:${contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
          }
        },
        {
          text: 'Rate on Store',
          onPress: () => {
            // Add app store rating logic here
            Alert.alert('Thank you!', 'Redirecting to app store...');
          }
        }
      ]
    );
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <Text variant="h6" style={styles.sectionTitle}>{title}</Text>
  );

  const ContactItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress 
  }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.contactItem} onPress={onPress}>
      <View style={styles.contactLeft}>
        <View style={styles.contactIcon}>
          <Ionicons name={icon as any} size={20} color={COLORS.primary} />
        </View>
        <View style={styles.contactInfo}>
          <Text variant="body" style={styles.contactTitle}>{title}</Text>
          <Text variant="caption" style={styles.contactSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
    </TouchableOpacity>
  );

  const ActionItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress,
    color = COLORS.primary
  }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.actionLeft}>
        <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.actionInfo}>
          <Text variant="body" style={[styles.actionTitle, { color }]}>{title}</Text>
          <Text variant="caption" style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
    </TouchableOpacity>
  );

  const FAQItem = ({ 
    question, 
    answer, 
    isExpanded, 
    onToggle 
  }: {
    question: string;
    answer: string;
    isExpanded: boolean;
    onToggle: () => void;
  }) => (
    <View style={styles.faqItem}>
      <TouchableOpacity style={styles.faqHeader} onPress={onToggle}>
        <Text variant="body" style={styles.faqQuestion}>{question}</Text>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={COLORS.gray[600]} 
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.faqAnswer}>
          <Text variant="body" style={styles.faqAnswerText}>{answer}</Text>
        </View>
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
              <Ionicons name="help-circle" size={20} color={COLORS.primary} />
            </View>
            <Text variant="h5" style={styles.headerTitle}>Help & Support</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.gray[600]} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Actions */}
          {/* <View style={styles.section}>
            <SectionTitle title="Quick Actions" />
            <View style={styles.sectionContent}>
              <ActionItem
                icon="bug"
                title="Report an Issue"
                subtitle="Report bugs or technical problems"
                onPress={handleReportIssue}
                color={COLORS.error}
              />
              <ActionItem
                icon="chatbubble-ellipses"
                title="Send Feedback"
                subtitle="Share your suggestions and feedback"
                onPress={handleSendFeedback}
                color={COLORS.success}
              />
            </View>
          </View> */}

          {/* Contact Information */}
          <View style={styles.section}>
            <SectionTitle title="Contact Information" />
            <View style={styles.sectionContent}>
              <ContactItem
                icon="mail"
                title="Email Support"
                subtitle={contactInfo.email}
                onPress={() => handleContactPress('email')}
              />
              <ContactItem
                icon="call"
                title="Phone Support"
                subtitle={contactInfo.phone}
                onPress={() => handleContactPress('phone')}
              />
              <ContactItem
                icon="globe"
                title="Website"
                subtitle={contactInfo.website}
                onPress={() => handleContactPress('website')}
              />
              <View style={styles.contactItem}>
                <View style={styles.contactLeft}>
                  <View style={styles.contactIcon}>
                    <Ionicons name="location" size={20} color={COLORS.primary} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text variant="body" style={styles.contactTitle}>Office Address</Text>
                    <Text variant="caption" style={styles.contactSubtitle}>{contactInfo.address}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.section}>
            <SectionTitle title="Frequently Asked Questions" />
            <View style={styles.sectionContent}>
              {faqData.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                  isExpanded={expandedFAQ === index}
                  onToggle={() => toggleFAQ(index)}
                />
              ))}
            </View>
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
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  contactSubtitle: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 1,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionSubtitle: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginTop: 1,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    flex: 1,
    marginRight: SPACING.sm,
  },
  faqAnswer: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.gray[50],
  },
  faqAnswerText: {
    fontSize: 13,
    color: COLORS.gray[700],
    lineHeight: 18,
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
  infoTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  bottomPadding: {
    height: 40,
  },
});
