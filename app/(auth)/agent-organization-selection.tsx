import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { mockApi } from '../../services/mockData';
import { Organization } from '../../types';
import { COLORS, STORAGE_KEYS } from '../../utils/constants';
import { storageService } from '../../utils/storage';

export default function AgentOrganizationSelection() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrganizations();
    loadSavedOrganization();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [searchQuery, organizations]);

  const loadOrganizations = async () => {
    try {
      const data = await mockApi.getOrganizations();
      setOrganizations(data);
      setFilteredOrganizations(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedOrganization = async () => {
    const savedOrg = await storageService.getItem<Organization>(STORAGE_KEYS.SELECTED_ORGANIZATION);
    if (savedOrg) {
      setSelectedOrganization(savedOrg);
    }
  };

  const filterOrganizations = () => {
    if (searchQuery.trim() === '') {
      setFilteredOrganizations(organizations);
    } else {
      const filtered = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOrganizations(filtered);
    }
  };

  const handleOrganizationSelect = (organization: Organization) => {
    setSelectedOrganization(organization);
  };

  const handleContinue = async () => {
    if (!selectedOrganization) {
      Alert.alert('Error', 'Please select an organization');
      return;
    }

    try {
      // Save organization for future use
      await storageService.setItem(STORAGE_KEYS.SELECTED_ORGANIZATION, selectedOrganization);
      router.push('/(auth)/agent-login');
    } catch (error) {
      Alert.alert('Error', 'Failed to save organization');
    }
  };

  const renderOrganizationItem = ({ item }: { item: Organization }) => (
    <TouchableOpacity
      style={[
        styles.organizationItem,
        selectedOrganization?.id === item.id && styles.selectedItem
      ]}
      onPress={() => handleOrganizationSelect(item)}
    >
      <View style={styles.organizationContent}>
        <View style={[
          styles.organizationIcon,
          selectedOrganization?.id === item.id && styles.selectedOrganizationIcon
        ]}>
          <Ionicons 
            name={item.type === 'institute' ? 'school' : 'business'} 
            size={20} 
            color={selectedOrganization?.id === item.id ? COLORS.white : COLORS.primary} 
          />
        </View>
        <View style={styles.organizationInfo}>
          <Text style={[
            styles.organizationName,
            selectedOrganization?.id === item.id && styles.selectedText
          ]}>
            {item.name}
          </Text>
          <Text style={[
            styles.organizationType,
            selectedOrganization?.id === item.id && styles.selectedSubText
          ]}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        {selectedOrganization?.id === item.id && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading organizations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.gray[50]} />
      
      <View style={styles.content}>
        <Animated.View entering={FadeInUp.duration(800)} style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="storefront" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Select Organization</Text>
          <Text style={styles.subtitle}>Choose your recharge service organization</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.searchContainer}>
          <Input
            label="Search Organizations"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by organization name..."
            icon="search"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.listContainer}>
          {filteredOrganizations.length > 0 ? (
            <FlatList
              data={filteredOrganizations}
              renderItem={renderOrganizationItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.organizationList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="business-outline" size={48} color={COLORS.gray[400]} />
              <Text style={styles.emptyText}>No organizations found</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(800).delay(600)} style={styles.buttonContainer}>
          <Button
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedOrganization}
            icon="arrow-forward"
            size="medium"
            fullWidth
          />
          
          <Button
            title="Back to Selection"
            onPress={() => router.back()}
            variant="outline"
            size="medium"
            fullWidth
          />
        </Animated.View>
      </View>
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
    padding: 12,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 20 : 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[900],
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
    marginBottom: 20,
  },
  organizationList: {
    flex: 1,
  },  organizationItem: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  selectedItem: {
    backgroundColor: COLORS.primary,
  },
  organizationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  organizationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedOrganizationIcon: {
    backgroundColor: COLORS.primary + '20',
  },
  organizationInfo: {
    flex: 1,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  organizationType: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  selectedText: {
    color: COLORS.white,
  },
  selectedSubText: {
    color: COLORS.gray[200],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 12,
  },
  buttonContainer: {
    gap: 10,
  },
});
