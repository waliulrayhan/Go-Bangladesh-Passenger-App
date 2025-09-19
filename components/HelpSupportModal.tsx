import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Linking, Modal, Platform, ScrollView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useToast } from '../hooks/useToast';
import { BORDER_RADIUS, COLORS, SPACING } from '../utils/constants';
import { Text } from './ui/Text';
import { Toast } from './ui/Toast';

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({
  visible,
  onClose
}) => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const { toast, showToast, hideToast, showError, showSuccess } = useToast();

  const contactInfo = {
    email: 'info@thegobd.com',
    phone: '+8801711360170',
    website: 'https://thegobd.com',
    address: 'ICT Tower, 14th Floor, Plot E-14/X, Agargaon, Sher-e-Bangla Nagar, Dhaka-1207'
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
        Linking.openURL(`mailto:${contactInfo.email}`).catch(() => {
          showError('Unable to open email client');
        });
        break;
      case 'phone':
        Linking.openURL(`tel:${contactInfo.phone}`).catch(() => {
          showError('Unable to make phone call');
        });
        break;
      case 'website':
        Linking.openURL(contactInfo.website).catch(() => {
          showError('Unable to open website');
        });
        break;
    }
  };

  const handleReportIssue = () => {
    const subject = 'Issue Report - Go Bangladesh App';
    const body = `Hi Go Bangladesh Support Team,

I'm experiencing an issue with the app. Here are the details:

Device: ${Platform.OS}
App Version: 1.0.0
Issue Description: [Please describe your issue here]

Best regards,
[Your Name]`;
    
    Linking.openURL(`mailto:${contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
      .catch(() => {
        showError('Unable to open email client');
      });
  };

  const handleSendFeedback = () => {
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
    
    Linking.openURL(`mailto:${contactInfo.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
      .catch(() => {
        showError('Unable to open email client');
      });
  };

  const handleRateApp = () => {
    showSuccess('Thank you for your feedback!');
    // Add app store rating logic here
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
      <Ionicons name="chevron-forward-outline" size={16} color={COLORS.gray[400]} />
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
      <Ionicons name="chevron-forward-outline" size={16} color={COLORS.gray[400]} />
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
          name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
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
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="help-circle" size={20} color={COLORS.primary} />
            </View>
            <Text variant="h5" style={styles.headerTitle}>Contact & Support</Text>
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
          {/* <View style={styles.section}>
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
          </View> */}

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
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brand.blue_subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[50],
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[900],
    flex: 1,
    marginRight: SPACING.md,
    lineHeight: 20,
  },
  faqAnswer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.brand.blue_subtle,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[50],
  },
  faqAnswerText: {
    fontSize: 14,
    color: COLORS.gray[700],
    lineHeight: 20,
    paddingTop: SPACING.sm,
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
  infoTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.gray[900],
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  bottomPadding: {
    height: SPACING['6xl'],
  },
});
