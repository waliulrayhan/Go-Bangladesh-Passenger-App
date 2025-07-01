import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { mockApi } from '../../services/mockData';
import { Bus, Organization } from '../../types';
import { COLORS, STORAGE_KEYS } from '../../utils/constants';
import { storageService } from '../../utils/storage';

export default function BusSelection() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [filteredBuses, setFilteredBuses] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrganizationAndBuses();
    loadSavedBus();
  }, []);

  useEffect(() => {
    filterBuses();
  }, [searchQuery, buses]);

  const loadOrganizationAndBuses = async () => {
    try {
      const savedOrg = await storageService.getItem<Organization>(STORAGE_KEYS.SELECTED_ORGANIZATION);
      if (!savedOrg) {
        Alert.alert('Error', 'No organization selected');
        router.back();
        return;
      }

      setOrganization(savedOrg);
      const busData = await mockApi.getBusesByOrganization(savedOrg.id);
      setBuses(busData);
      setFilteredBuses(busData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load buses');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedBus = async () => {
    const savedBus = await storageService.getItem<Bus>(STORAGE_KEYS.SELECTED_BUS);
    if (savedBus) {
      setSelectedBus(savedBus);
    }
  };

  const filterBuses = () => {
    if (searchQuery.trim() === '') {
      setFilteredBuses(buses);
    } else {
      const filtered = buses.filter(bus =>
        bus.busNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredBuses(filtered);
    }
  };

  const handleBusSelect = (bus: Bus) => {
    setSelectedBus(bus);
  };

  const handleContinue = async () => {
    if (!selectedBus) {
      Alert.alert('Error', 'Please select a bus');
      return;
    }

    // Save selected bus to local storage
    await storageService.setItem(STORAGE_KEYS.SELECTED_BUS, selectedBus);
    
    // Navigate to staff login
    router.push('/(auth)/staff-options');
  };

  const renderBusItem = ({ item }: { item: Bus }) => (
    <Animated.View entering={FadeInDown.duration(400)}>
      <TouchableOpacity
        style={[
          styles.busItem,
          selectedBus?.id === item.id && styles.selectedBusItem
        ]}
        onPress={() => handleBusSelect(item)}
      >
        <View style={styles.busInfo}>
          <View style={[
            styles.busIcon,
            selectedBus?.id === item.id && styles.selectedBusIcon
          ]}>
            <Ionicons 
              name="bus" 
              size={20} 
              color={selectedBus?.id === item.id ? COLORS.white : COLORS.primary} 
            />
          </View>
          <View style={styles.busDetails}>
            <Text style={[
              styles.busNumber,
              selectedBus?.id === item.id && styles.selectedText
            ]}>
              {item.busNumber}
            </Text>
            <Text style={[
              styles.busRoute,
              selectedBus?.id === item.id && styles.selectedText
            ]}>
              {item.route}
            </Text>
          </View>
        </View>
        {selectedBus?.id === item.id && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="sync" size={32} color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading buses...</Text>
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
            <Ionicons name="bus" size={40} color={COLORS.white} />
          </View>
          <Text style={styles.title}>Select Your Bus</Text>
          {organization && (
            <Text style={styles.subtitle}>
              Choose your assigned bus from {organization.name}
            </Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.searchContainer}>
          <Input
            label="Search Bus Number"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by bus number..."
            icon="search"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.listContainer}>
          {filteredBuses.length > 0 ? (
            <FlatList
              data={filteredBuses}
              renderItem={renderBusItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.busList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="bus-outline" size={48} color={COLORS.gray[400]} />
              <Text style={styles.emptyText}>No buses found</Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(800).delay(600)} style={styles.buttonContainer}>
          <Button
            title="Continue to Staff Login"
            onPress={handleContinue}
            disabled={!selectedBus}
            icon="arrow-forward"
            size="medium"
            fullWidth
          />
          
          <Button
            title="Back to Organization Selection"
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
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 0,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 12,
  },
  searchContainer: {
    marginBottom: 20,
  },
  listContainer: {
    flex: 1,
    marginBottom: 20,
  },
  busList: {
    flex: 1,
  },
  busItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedBusItem: {
    backgroundColor: COLORS.primary,
  },
  busInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  busIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedBusIcon: {
    backgroundColor: COLORS.primary + '20',
  },
  busDetails: {
    flex: 1,
  },
  busNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  busRoute: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  selectedText: {
    color: COLORS.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.gray[500],
    marginTop: 16,
  },
  buttonContainer: {
    gap: 10,
  },
});
