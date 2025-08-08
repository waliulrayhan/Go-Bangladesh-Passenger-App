import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { DropdownSkeleton } from '../../../components/Skeleton';
import { ApiResponse, apiService } from '../../../services/api';
import { useAuthStore } from '../../../stores/authStore';
import { COLORS, STORAGE_KEYS } from '../../../utils/constants';
import { FONT_SIZES, FONT_WEIGHTS } from '../../../utils/fonts';
import { decodeJWT } from '../../../utils/jwt';
import { storageService } from '../../../utils/storage';
interface Organization {
  id: string;
  name: string;
  code: string;
  organizationType: 'Public' | 'Private';
}

interface Route {
  value: string;
  label: string;
}

interface Dropdown {
  isOpen: boolean;
  selectedValue: string | null;
  selectedLabel: string | null;
}

export default function MapScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  
  const [organizationDropdown, setOrganizationDropdown] = useState<Dropdown>({
    isOpen: false,
    selectedValue: null,
    selectedLabel: null,
  });
  
  const [routeDropdown, setRouteDropdown] = useState<Dropdown>({
    isOpen: false,
    selectedValue: null,
    selectedLabel: null,
  });

  const [userType, setUserType] = useState<'Public' | 'Private' | null>(null);
  const [userOrganizationId, setUserOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    // Decode token to get user information
    const initializeUserData = async () => {
      try {
        const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          const payload = decodeJWT(token);
          if (payload) {
            setUserType(payload.UserType as 'Public' | 'Private');
            setUserOrganizationId(payload.OrganizationId || null);
          }
        }
        
        fetchOrganizations();
      } catch (error) {
        console.error('Error initializing user data:', error);
        fetchOrganizations();
      }
    };
    
    initializeUserData();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<ApiResponse<Organization[]>>('/api/organization/getAllForMap');
      
      if (response.data.data.isSuccess) {
        let filteredOrganizations = response.data.data.content;
        
        // Filter based on user type
        if (userType === 'Public') {
          // Show only public organizations + user's own organization
          filteredOrganizations = response.data.data.content.filter((org: Organization) => 
            org.organizationType === 'Public' || org.id === userOrganizationId
          );
        }
        // For Private users, show all organizations
        
        setOrganizations(filteredOrganizations);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      Alert.alert('Error', 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async (organizationId: string) => {
    try {
      setRoutesLoading(true);
      const response = await apiService.get<ApiResponse<Route[]>>(`/api/route/routeDropdownForMobile?organizationId=${organizationId}`);
      
      if (response.data.data.isSuccess) {
        setRoutes(response.data.data.content);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      Alert.alert('Error', 'Failed to fetch routes');
      setRoutes([]);
    } finally {
      setRoutesLoading(false);
    }
  };

  const handleOrganizationSelect = (organization: Organization) => {
    setOrganizationDropdown({
      isOpen: false,
      selectedValue: organization.id,
      selectedLabel: organization.name,
    });
    
    // Reset route selection when organization changes
    setRouteDropdown({
      isOpen: false,
      selectedValue: null,
      selectedLabel: null,
    });
    
    // Fetch routes for selected organization
    fetchRoutes(organization.id);
  };

  const handleRouteSelect = (route: Route) => {
    setRouteDropdown({
      isOpen: false,
      selectedValue: route.value,
      selectedLabel: route.label,
    });
  };

  const handleSearchBuses = () => {
    if (!organizationDropdown.selectedValue) {
      Alert.alert('Selection Required', 'Please select an organization first');
      return;
    }

    if (!routeDropdown.selectedValue) {
      Alert.alert('Selection Required', 'Please select a route');
      return;
    }

    // Navigate to map view with selected parameters
    const params = new URLSearchParams({
      organizationId: organizationDropdown.selectedValue,
      organizationName: organizationDropdown.selectedLabel || '',
      routeId: routeDropdown.selectedValue,
      routeName: routeDropdown.selectedLabel || '',
    });

    router.push(`/(tabs)/map/view?${params.toString()}`);
  };

  const renderDropdown = (
    dropdown: Dropdown,
    setDropdown: React.Dispatch<React.SetStateAction<Dropdown>>,
    items: { id?: string; value?: string; name?: string; label?: string }[],
    placeholder: string,
    onSelect: (item: any) => void,
    isLoading?: boolean,
    zIndexValue: number = 1000
  ) => (
    <View style={[styles.dropdownContainer, { zIndex: zIndexValue }]}>
      <TouchableOpacity
        style={[styles.dropdown, dropdown.isOpen && styles.dropdownOpen]}
        onPress={() => {
          // Close other dropdowns first
          if (dropdown === organizationDropdown) {
            setRouteDropdown(prev => ({ ...prev, isOpen: false }));
          } else {
            setOrganizationDropdown(prev => ({ ...prev, isOpen: false }));
          }
          setDropdown(prev => ({ ...prev, isOpen: !prev.isOpen }));
        }}
        disabled={isLoading}
      >
        <Text style={[
          styles.dropdownText,
          !dropdown.selectedLabel && styles.placeholderText
        ]}>
          {dropdown.selectedLabel || placeholder}
        </Text>
        {isLoading ? (
          <ActivityIndicator size="small" color={COLORS.brand.blue} />
        ) : (
          <Ionicons
            name={dropdown.isOpen ? "chevron-up" : "chevron-down"}
            size={24}
            color={COLORS.gray[500]}
          />
        )}
      </TouchableOpacity>

      {dropdown.isOpen && items.length > 0 && (
        <View style={styles.dropdownList}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
            {items.map((item) => (
              <TouchableOpacity
                key={item.id || item.value}
                style={styles.dropdownItem}
                onPress={() => onSelect(item)}
              >
                <Text style={styles.dropdownItemText}>
                  {item.name || item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {dropdown.isOpen && items.length === 0 && !isLoading && (
        <View style={styles.dropdownList}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          "rgba(74, 144, 226, 0.1)",
          "rgba(255, 138, 0, 0.1)",
        ]}
        style={styles.gradient}
      />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="map-outline" size={32} color={COLORS.brand.blue} />
          <Text style={styles.title}>Find Buses on Map</Text>
          <Text style={styles.subtitle}>
            Select organization and route to view real-time bus locations
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Organization <Text style={styles.required}>*</Text>
            </Text>
            {loading ? (
              <DropdownSkeleton />
            ) : (
              renderDropdown(
                organizationDropdown,
                setOrganizationDropdown,
                organizations,
                "Select Organization",
                handleOrganizationSelect,
                loading,
                2000
              )
            )}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Route <Text style={styles.required}>*</Text>
            </Text>
            {loading ? (
              <DropdownSkeleton />
            ) : (
              renderDropdown(
                routeDropdown,
                setRouteDropdown,
                routes,
                "Select Route",
                handleRouteSelect,
                routesLoading,
                1000
              )
            )}
            {!organizationDropdown.selectedValue && !loading && (
              <Text style={styles.helperText}>
                Please select an organization first
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.searchButton,
              (!organizationDropdown.selectedValue || !routeDropdown.selectedValue) && styles.searchButtonDisabled
            ]}
            onPress={handleSearchBuses}
            disabled={!organizationDropdown.selectedValue || !routeDropdown.selectedValue}
          >
            <LinearGradient
              colors={
                (organizationDropdown.selectedValue && routeDropdown.selectedValue)
                  ? [COLORS.brand.blue, COLORS.brand.orange]
                  : [COLORS.gray[300], COLORS.gray[400]]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.searchButtonGradient}
            >
              <Ionicons name="search" size={20} color={COLORS.white} />
              <Text style={styles.searchButtonText}>Search Buses</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.brand.orange} />
            <Text style={styles.infoText}>
              Both organization and route selection are required to proceed
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONT_WEIGHTS.bold,
    color: COLORS.gray[900],
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.regular,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.semiBold,
    color: COLORS.gray[700],
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },
  dropdownContainer: {
    position: 'relative',
    marginBottom: 4, // Add margin to prevent overlap
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 12,
    minHeight: 48,
  },
  dropdownOpen: {
    borderColor: COLORS.brand.blue,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownText: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_WEIGHTS.medium,
    color: COLORS.gray[900],
  },
  placeholderText: {
    color: COLORS.gray[500],
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.brand.blue,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  dropdownItemText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_WEIGHTS.medium,
    color: COLORS.gray[900],
  },
  noDataText: {
    padding: 16,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.medium,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  helperText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_WEIGHTS.regular,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  searchButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  searchButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },
  infoContainer: {
    backgroundColor: COLORS.brand.blue_subtle,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.regular,
    color: COLORS.gray[700],
    lineHeight: 18,
  },
});
