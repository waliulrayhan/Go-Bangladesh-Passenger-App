import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { DropdownSkeleton } from "../../../components/Skeleton";
import { Toast } from "../../../components/ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { ApiResponse, apiService } from "../../../services/api";
import { useAuthStore } from "../../../stores/authStore";
import { Organization } from "../../../types";
import { COLORS, STORAGE_KEYS } from "../../../utils/constants";
import { FONT_SIZES, FONT_WEIGHTS } from "../../../utils/fonts";
import { decodeJWT } from "../../../utils/jwt";
import { storageService } from "../../../utils/storage";

// Types
interface Route {
  value: string;
  label: string;
}

interface Dropdown {
  isOpen: boolean;
  selectedValue: string | null;
  selectedLabel: string | null;
}

interface DropdownItem {
  id?: string;
  value?: string;
  name?: string;
  label?: string;
}

interface StoppageResponse {
  isSuccess: boolean;
  content: string | null;
  timeStamp: string;
  payloadType: string;
  message: string;
}

type UserType = "Public" | "Private";

// Constants
const DROPDOWN_Z_INDEX = {
  ORGANIZATION: 2000,
  ROUTE: 1000,
} as const;

export default function MapScreen() {
  // Hooks
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast, showError, showWarning, hideToast } = useToast();

  // State
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [userOrganizationId, setUserOrganizationId] = useState<string | null>(
    null
  );
  const [fullRoute, setFullRoute] = useState<string | null>(null);
  const [fullRouteLoading, setFullRouteLoading] = useState(false);

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

  // Initialize user data from token
  const initializeUserData = useCallback(async () => {
    try {
      const token = await storageService.getSecureItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        const payload = decodeJWT(token);
        if (payload) {
          setUserType(payload.UserType as UserType);
          setUserOrganizationId(payload.OrganizationId || null);
        }
      }
    } catch (error) {
      console.error("Error initializing user data:", error);
    } finally {
      // Always fetch organizations regardless of token decode success
      fetchOrganizations();
    }
  }, []);

  // Clear form function
  const clearForm = useCallback(() => {
    setOrganizationDropdown({
      isOpen: false,
      selectedValue: null,
      selectedLabel: null,
    });
    setRouteDropdown({
      isOpen: false,
      selectedValue: null,
      selectedLabel: null,
    });
    setRoutes([]);
    setFullRoute(null);
  }, []);

  useEffect(() => {
    initializeUserData();
  }, [initializeUserData]);

  // Clear form when navigating back to this page
  useFocusEffect(
    useCallback(() => {
      clearForm();
    }, [clearForm])
  );

  // Filter organizations based on user type
  const filterOrganizations = useCallback(
    (orgs: Organization[]): Organization[] => {
      if (userType === "Public") {
        // Public users: Show only public organizations
        return orgs.filter((org) => org.organizationType === "Public");
      } else if (userType === "Private") {
        // Private users: Show all public organizations + their own private organization
        return orgs.filter(
          (org) =>
            org.organizationType === "Public" || org.id === userOrganizationId
        );
      }
      // Fallback: show all organizations if userType is not set
      return orgs;
    },
    [userType, userOrganizationId]
  );

  // Fetch organizations from API
  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.get<ApiResponse<Organization[]>>(
        "/api/organization/getAllForMap"
      );

      if (response.data.data.isSuccess) {
        const filteredOrganizations = filterOrganizations(
          response.data.data.content
        );
        setOrganizations(filteredOrganizations);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
      showError("Failed to fetch organizations");
    } finally {
      setLoading(false);
    }
  }, [filterOrganizations, showError]);

  // Fetch routes for selected organization
  const fetchRoutes = useCallback(
    async (organizationId: string) => {
      try {
        setRoutesLoading(true);
        const response = await apiService.get<ApiResponse<Route[]>>(
          `/api/route/routeDropdownForMobile?organizationId=${organizationId}`
        );

        if (response.data.data.isSuccess) {
          setRoutes(response.data.data.content);
        }
      } catch (error) {
        console.error("Error fetching routes:", error);
        showError("Failed to fetch routes");
        setRoutes([]);
      } finally {
        setRoutesLoading(false);
      }
    },
    [showError]
  );

  // Reset route dropdown when organization changes
  const resetRouteSelection = useCallback(() => {
    setRouteDropdown({
      isOpen: false,
      selectedValue: null,
      selectedLabel: null,
    });
    setFullRoute(null);
  }, []);

  // Fetch stoppage data for selected route
  const fetchRouteStoppages = useCallback(
    async (routeId: string, routeLabel: string) => {
      try {
        setFullRouteLoading(true);
        const response = await apiService.get<ApiResponse<StoppageResponse>>(
          `/api/route/getStoppagesByRouteId?routeId=${routeId}`
        );

        if (response.data.data.isSuccess && response.data.data.content) {
          // Combine route label with stoppage list using ⇄ symbol
          const startPoint = routeLabel.split(' - ')[0];
          const endPoint = routeLabel.split(' - ')[1];
          const stoppages = String(response.data.data.content).replace(/-/g, ' ⇄ ');
          const fullRouteString = `${startPoint} ⇄ ${stoppages} ⇄ ${endPoint}`;
          setFullRoute(fullRouteString);
        } else {
          // If no stoppages found, just show the route label with ⇄ symbol
          setFullRoute(routeLabel.replace(' - ', ' ⇄ '));
        }
      } catch (error) {
        console.error("Error fetching route stoppages:", error);
        // On error, show just the route label with ⇄ symbol
        setFullRoute(routeLabel.replace(' - ', ' ⇄ '));
      } finally {
        setFullRouteLoading(false);
      }
    },
    []
  );

  // Handle organization selection
  const handleOrganizationSelect = useCallback(
    (organization: Organization) => {
      setOrganizationDropdown({
        isOpen: false,
        selectedValue: organization.id,
        selectedLabel: organization.name,
      });

      resetRouteSelection();
      fetchRoutes(organization.id);
    },
    [resetRouteSelection, fetchRoutes]
  );

  // Handle route selection
  const handleRouteSelect = useCallback((route: Route) => {
    setRouteDropdown({
      isOpen: false,
      selectedValue: route.value,
      selectedLabel: route.label,
    });
    
    // Fetch stoppage data for the selected route
    fetchRouteStoppages(route.value, route.label);
  }, [fetchRouteStoppages]);

  // Validate selections and navigate to map view
  const handleSearchBuses = useCallback(() => {
    if (!organizationDropdown.selectedValue) {
      showWarning("Please select an organization first");
      return;
    }

    if (!routeDropdown.selectedValue) {
      showWarning("Please select a route");
      return;
    }

    const params = new URLSearchParams({
      organizationId: organizationDropdown.selectedValue,
      organizationName: organizationDropdown.selectedLabel || "",
      routeId: routeDropdown.selectedValue,
      routeName: routeDropdown.selectedLabel || "",
    });

    router.push(`/(tabs)/view?${params.toString()}`);
  }, [
    organizationDropdown.selectedValue,
    organizationDropdown.selectedLabel,
    routeDropdown.selectedValue,
    routeDropdown.selectedLabel,
    showWarning,
    router,
  ]);

  // Toggle dropdown state and close others
  const toggleDropdown = useCallback(
    (
      targetDropdown: Dropdown,
      setTargetDropdown: React.Dispatch<React.SetStateAction<Dropdown>>
    ) => {
      // Close other dropdowns first
      if (targetDropdown === organizationDropdown) {
        setRouteDropdown((prev) => ({ ...prev, isOpen: false }));
        // Fetch organizations when organization dropdown is clicked
        if (!targetDropdown.isOpen) {
          fetchOrganizations();
        }
      } else {
        setOrganizationDropdown((prev) => ({ ...prev, isOpen: false }));
      }

      setTargetDropdown((prev) => ({ ...prev, isOpen: !prev.isOpen }));
    },
    [organizationDropdown, fetchOrganizations]
  );

  // Render dropdown component
  const renderDropdown = useCallback(
    (
      dropdown: Dropdown,
      setDropdown: React.Dispatch<React.SetStateAction<Dropdown>>,
      items: DropdownItem[],
      placeholder: string,
      onSelect: (item: any) => void,
      isLoading?: boolean,
      zIndexValue: number = 1000
    ) => (
      <View style={[styles.dropdownContainer, { zIndex: zIndexValue }]}>
        <TouchableOpacity
          style={[styles.dropdown, dropdown.isOpen && styles.dropdownOpen]}
          onPress={() => toggleDropdown(dropdown, setDropdown)}
          disabled={isLoading}
        >
          <Text
            style={[
              styles.dropdownText,
              !dropdown.selectedLabel && styles.placeholderText,
            ]}
          >
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
    ),
    [toggleDropdown]
  );

  // Render full route with color-coded text
  const renderFullRouteWithColors = useCallback((routeText: string) => {
    const parts = routeText.split(' ⇄ ');
    
    return (
      <View style={styles.routeSegments}>
        {parts.map((part, index) => (
          <View key={index} style={styles.routeSegment}>
            <Text style={[
              styles.routeSegmentText,
              index === 0 && styles.startPointText,
              index === parts.length - 1 && index !== 0 && styles.endPointText,
              index !== 0 && index !== parts.length - 1 && styles.intermediatePointText
            ]}>
              {part}
            </Text>
            {index < parts.length - 1 && (
              <Text style={styles.routeSeparator}> ⇄ </Text>
            )}
          </View>
        ))}
      </View>
    );
  }, []);

  // Check if search button should be enabled
  const isSearchEnabled = Boolean(
    organizationDropdown.selectedValue && routeDropdown.selectedValue
  );

  return (
    <>
      <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["rgba(74, 144, 226, 0.1)", "rgba(255, 138, 0, 0.1)"]}
        style={styles.gradient}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Ionicons name="map-outline" size={32} color={COLORS.brand.blue} />
          <Text style={styles.title}>Find Buses on Map</Text>
          <Text style={styles.subtitle}>
            Select organization and route to view real-time bus locations
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          {/* Organization Dropdown */}
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
                DROPDOWN_Z_INDEX.ORGANIZATION
              )
            )}
          </View>

          {/* Route Dropdown */}
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
                DROPDOWN_Z_INDEX.ROUTE
              )
            )}
            {!organizationDropdown.selectedValue && !loading && (
              <Text style={styles.helperText}>
                Please select an organization first
              </Text>
            )}
          </View>

          {/* Full Route Display */}
          {routeDropdown.selectedValue && (
            <View style={styles.fullRouteContainer}>
              {/* <Text style={styles.fullRouteLabel}>Full Route:</Text> */}
              {fullRouteLoading ? (
                <View style={styles.fullRouteLoadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.brand.blue} />
                  <Text style={styles.fullRouteLoadingText}>Loading route details...</Text>
                </View>
              ) : (
                <View style={styles.fullRouteDisplay}>
                  {fullRoute && (
                    <View style={styles.routeWithColors}>
                      {renderFullRouteWithColors(fullRoute)}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Search Button */}
          <TouchableOpacity
            style={[
              styles.searchButton,
              !isSearchEnabled && styles.searchButtonDisabled,
            ]}
            onPress={handleSearchBuses}
            disabled={!isSearchEnabled}
          >
            <View style={styles.searchButtonContent}>
              <Ionicons name="search" size={20} color={COLORS.white} />
              <Text style={styles.searchButtonText}>Search Buses</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        {/* <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={COLORS.brand.orange}
            />
            <Text style={styles.infoText}>
              Both organization and route selection are required to proceed!
            </Text>
          </View>
        </View> */}
      </ScrollView>

      {/* Toast Component */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}/>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },

  // Header Styles
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONT_WEIGHTS.bold,
    color: COLORS.secondary,
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.regular,
    color: COLORS.gray[600],
    textAlign: "center",
    lineHeight: 20,
  },

  // Form Styles
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
  helperText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_WEIGHTS.regular,
    color: COLORS.gray[500],
    marginTop: 4,
  },

  // Dropdown Styles
  dropdownContainer: {
    position: "relative",
    marginBottom: 4,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    position: "absolute",
    top: "100%",
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
    textAlign: "center",
  },

  // Button Styles
  searchButton: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: COLORS.brand.blue,
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.gray[400],
  },
  searchButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  searchButtonText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONT_WEIGHTS.semiBold,
    color: COLORS.white,
  },

  // Full Route Styles
  fullRouteContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.gray[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullRouteLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.semiBold,
    color: COLORS.gray[700],
    marginBottom: 6,
  },
  fullRouteLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fullRouteLoadingText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.regular,
    color: COLORS.gray[600],
  },
  fullRouteDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  fullRouteText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.medium,
    color: COLORS.brand.blue,
    lineHeight: 20,
  },
  routeWithColors: {
    flex: 1,
  },
  routeSegments: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
  },
  routeSegment: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeSegmentText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.medium,
    color: COLORS.gray[700],
    textAlign: "center",
  },
  startPointText: {
    color: COLORS.success,
    fontFamily: FONT_WEIGHTS.semiBold,
  },
  endPointText: {
    color: COLORS.secondary,
    fontFamily: FONT_WEIGHTS.semiBold,
  },
  intermediatePointText: {
    color: COLORS.gray[800],
    fontFamily: FONT_WEIGHTS.medium,
  },
  routeSeparator: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_WEIGHTS.regular,
    color: COLORS.gray[500],
    textAlign: "center",
  },

  // Info Styles
  infoContainer: {
    backgroundColor: COLORS.brand.blue_subtle,
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
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

