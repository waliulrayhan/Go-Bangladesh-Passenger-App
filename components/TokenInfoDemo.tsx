import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from './ui/Text';
import { useTokenRefresh, useUserContext } from '../hooks/useTokenRefresh';
import { COLORS } from '../utils/constants';
import { Ionicons } from '@expo/vector-icons';

/**
 * Demo component to show token-based user information
 * This component demonstrates the token decoding functionality
 */
export const TokenInfoDemo = () => {
  const { userContext, isLoading } = useUserContext();
  const { isRefreshing, refreshAllData } = useTokenRefresh();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    try {
      const success = await refreshAllData();
      if (success) {
        setLastRefresh(new Date());
        Alert.alert('Success', 'Data refreshed successfully from token!');
      } else {
        Alert.alert('Info', 'No updates available or refresh failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text variant="body" color={COLORS.gray[600]}>
          Loading user context...
        </Text>
      </View>
    );
  }

  if (!userContext) {
    return (
      <View style={styles.container}>
        <Text variant="body" color={COLORS.gray[600]}>
          No user context available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h6" color={COLORS.brand.blue} style={styles.title}>
          Token Information
        </Text>
        <TouchableOpacity
          style={[styles.refreshButton, isRefreshing && styles.refreshButtonDisabled]}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Ionicons
            name="refresh"
            size={16}
            color={isRefreshing ? COLORS.gray[400] : COLORS.brand.blue}
          />
          <Text
            variant="caption"
            color={isRefreshing ? COLORS.gray[400] : COLORS.brand.blue}
            style={styles.refreshButtonText}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Text variant="caption" color={COLORS.gray[500]} style={styles.label}>
            User Type
          </Text>
          <Text variant="body" color={COLORS.gray[800]} style={styles.value}>
            {userContext.userType.toUpperCase()}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text variant="caption" color={COLORS.gray[500]} style={styles.label}>
            Context
          </Text>
          <Text variant="body" color={COLORS.gray[800]} style={styles.value}>
            {userContext.contextTitle}
          </Text>
        </View>

        {userContext.showOrganizationInfo && (
          <View style={styles.infoItem}>
            <Text variant="caption" color={COLORS.gray[500]} style={styles.label}>
              Organization
            </Text>
            <Text variant="body" color={COLORS.gray[800]} style={styles.value}>
              {userContext.organizationName}
            </Text>
          </View>
        )}

        <View style={styles.infoItem}>
          <Text variant="caption" color={COLORS.gray[500]} style={styles.label}>
            Display Name
          </Text>
          <Text variant="body" color={COLORS.gray[800]} style={styles.value}>
            {userContext.displayName}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text variant="caption" color={COLORS.gray[500]} style={styles.label}>
            User Category
          </Text>
          <Text variant="body" color={COLORS.gray[800]} style={styles.value}>
            {userContext.isPrivateUser ? 'Private User' : 'Public User'}
          </Text>
        </View>

        {lastRefresh && (
          <View style={styles.infoItem}>
            <Text variant="caption" color={COLORS.gray[500]} style={styles.label}>
              Last Refresh
            </Text>
            <Text variant="caption" color={COLORS.gray[600]} style={styles.value}>
              {lastRefresh.toLocaleTimeString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.featuresSection}>
        <Text variant="caption" color={COLORS.gray[500]} style={styles.featuresTitle}>
          Available Features
        </Text>
        <View style={styles.featuresList}>
          {userContext.shouldShowRecentActivity && (
            <View style={styles.featureItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.brand.blue} />
              <Text variant="caption" color={COLORS.gray[700]} style={styles.featureText}>
                Recent Activity
              </Text>
            </View>
          )}
          {userContext.shouldShowTripHistory && (
            <View style={styles.featureItem}>
              <Ionicons name="bus-outline" size={14} color={COLORS.brand.blue} />
              <Text variant="caption" color={COLORS.gray[700]} style={styles.featureText}>
                Trip History
              </Text>
            </View>
          )}
          {userContext.shouldShowRechargeHistory && (
            <View style={styles.featureItem}>
              <Ionicons name="card-outline" size={14} color={COLORS.brand.blue} />
              <Text variant="caption" color={COLORS.gray[700]} style={styles.featureText}>
                Recharge History
              </Text>
            </View>
          )}
          {userContext.shouldShowProfile && (
            <View style={styles.featureItem}>
              <Ionicons name="person-outline" size={14} color={COLORS.brand.blue} />
              <Text variant="caption" color={COLORS.gray[700]} style={styles.featureText}>
                Profile
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.brand.blue + '10',
  },
  refreshButtonDisabled: {
    backgroundColor: COLORS.gray[100],
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  featuresSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingTop: 16,
  },
  featuresTitle: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 8,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.gray[50],
  },
  featureText: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
});
