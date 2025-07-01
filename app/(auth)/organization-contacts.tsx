import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { mockOrganizations } from '../../services/mockData';
import { COLORS, SPACING } from '../../utils/constants';

export default function OrganizationContacts() {
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor={COLORS.brand.background} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[700]} />
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
                <View style={styles.organizationCard}>
                  <Text style={styles.orgName}>{org.name}</Text>
                  <Text style={styles.orgType}>
                    {org.type === 'institute' ? 'Educational Institution' : 'Transport Company'}
                  </Text>
                  
                  <View style={styles.adminSection}>
                    <Text style={styles.adminLabel}>Admin Contact</Text>
                    <Text style={styles.adminName}>
                      {org.adminName || 'Md. Rahman Ahmed'}
                    </Text>
                    
                    <View style={styles.contactActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleCall(org.adminPhone || '+8801712345678')}
                      >
                        <Ionicons name="call" size={16} color={COLORS.primary} />
                        <Text style={styles.actionText}>Call</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEmail(org.adminEmail || 'admin@example.com')}
                      >
                        <Ionicons name="mail" size={16} color={COLORS.primary} />
                        <Text style={styles.actionText}>Email</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
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
      </View>
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
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
    marginVertical: SPACING.lg,
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
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  orgName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  orgType: {
    fontSize: 14,
    color: COLORS.gray[500],
    marginBottom: SPACING.lg,
  },
  adminSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    paddingTop: SPACING.md,
  },
  adminLabel: {
    fontSize: 12,
    color: COLORS.gray[500],
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  adminName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
  },
  contactActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  actionText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
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
