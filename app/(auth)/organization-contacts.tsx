import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { mockOrganizations } from '../../services/mockData';
import { COLORS, SPACING } from '../../utils/constants';

export default function OrganizationContacts() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleGoBack = () => {
    router.back();
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const filteredOrganizations = mockOrganizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Organizations</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(600)}>
          <Text style={styles.description}>
            Contact your institution's admin for account support and assistance.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)} style={styles.searchInput}>
          <Input
            label="Search Organizations"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name..."
            icon="search"
          />
        </Animated.View>

        <View style={styles.organizationsList}>
          {filteredOrganizations.map((org, index) => (
            <Animated.View
              key={org.id}
              entering={FadeInDown.duration(600).delay(300 + index * 100)}
            >
              <Card variant="elevated" style={styles.organizationCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.orgInfo}>
                    <Text style={styles.orgName}>{org.name}</Text>
                    <Text style={styles.orgType}>
                      {org.type === 'institute' ? 'Educational Institution' : 'Transport Company'}
                    </Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </View>

                <View style={styles.contactInfo}>
                  <Text style={styles.sectionTitle}>Admin Contact Information</Text>
                  
                  <View style={styles.contactRow}>
                    <View style={styles.contactItem}>
                      <Text style={styles.contactLabel}>Admin Name</Text>
                      <Text style={styles.contactValue}>
                        {org.adminName || 'Md. Rahman Ahmed'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.contactActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleCall(org.adminPhone || '+8801712345678')}
                    >
                      <Ionicons name="call" size={20} color={COLORS.primary} />
                      <Text style={styles.actionText}>
                        {org.adminPhone || '+880 1712-345678'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEmail(org.adminEmail || 'admin@example.com')}
                    >
                      <Ionicons name="mail" size={20} color={COLORS.primary} />
                      <Text style={styles.actionText}>
                        {org.adminEmail || 'admin@' + org.name.toLowerCase().replace(/\s+/g, '') + '.edu.bd'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            </Animated.View>
          ))}
        </View>

        {filteredOrganizations.length === 0 && (
          <Animated.View entering={FadeInDown.duration(600)} style={styles.noResults}>
            <Ionicons name="search" size={48} color={COLORS.gray[400]} />
            <Text style={styles.noResultsText}>No organizations found</Text>
            <Text style={styles.noResultsSubtext}>
              Try adjusting your search terms
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.brand.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  description: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 24,
  },
  searchInput: {
    marginBottom: SPACING.lg,
  },
  organizationsList: {
    gap: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  organizationCard: {
    padding: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  orgType: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  statusBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  contactInfo: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
  },
  contactRow: {
    marginBottom: SPACING.md,
  },
  contactItem: {
    marginBottom: SPACING.sm,
  },
  contactLabel: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs,
  },
  contactValue: {
    fontSize: 16,
    color: COLORS.gray[900],
    fontWeight: '500',
  },
  contactActions: {
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.md,
    borderRadius: 8,
    gap: SPACING.sm,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    flex: 1,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginTop: SPACING.md,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
});
