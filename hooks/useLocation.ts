import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { debugLocation } from '../utils/debugLocation';

interface UseLocationParams {
  onLocationSuccess?: (location: { latitude: number; longitude: number }) => void;
  onLocationError?: (error: string) => void;
  onLocationInfo?: (info: string) => void;
}

interface UseLocationReturn {
  userLocation: { latitude: number; longitude: number } | null;
  locationPermission: Location.PermissionStatus | null;
  gettingLocation: boolean;
  getUserLocation: () => Promise<void>;
  checkLocationPermission: () => Promise<Location.PermissionStatus>;
  requestLocationPermission: () => Promise<Location.PermissionStatus>;
}

export const useLocation = ({
  onLocationSuccess,
  onLocationError,
  onLocationInfo,
}: UseLocationParams = {}): UseLocationReturn => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<Location.PermissionStatus | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const checkLocationPermission = useCallback(async (): Promise<Location.PermissionStatus> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
      return status;
    } catch (error) {
      console.error('Error checking location permission:', error);
      return Location.PermissionStatus.DENIED;
    }
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<Location.PermissionStatus> => {
    try {
      // Check if location services are enabled first (especially important for iOS)
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        onLocationError?.(
          Platform.OS === 'ios' 
            ? 'Please enable Location Services in Settings > Privacy & Security > Location Services'
            : 'Please enable Location Services on your device'
        );
        return Location.PermissionStatus.DENIED;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status !== Location.PermissionStatus.GRANTED) {
        if (Platform.OS === 'ios') {
          onLocationError?.(
            'Location permission is required. Please go to Settings > Go BD > Location and select "While Using App"'
          );
        } else {
          onLocationError?.('Location permission is required to show your location');
        }
      }
      
      return status;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      onLocationError?.('Failed to request location permission');
      return Location.PermissionStatus.DENIED;
    }
  }, [onLocationError]);

  const getUserLocation = useCallback(async (): Promise<void> => {
    try {
      setGettingLocation(true);
      debugLocation.log('Starting location request...');
      
      // Check if location services are enabled first (especially important for iOS)
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      debugLocation.log('Location services enabled:', servicesEnabled);
      
      if (!servicesEnabled) {
        debugLocation.error('Location services disabled');
        onLocationError?.(
          Platform.OS === 'ios' 
            ? 'Please enable Location Services in Settings > Privacy & Security > Location Services'
            : 'Please enable Location Services on your device'
        );
        return;
      }
      
      // Check permission first
      let permissionStatus = locationPermission;
      if (!permissionStatus) {
        debugLocation.log('Checking location permission...');
        permissionStatus = await checkLocationPermission();
      }
      
      debugLocation.log('Current permission status:', permissionStatus);
      
      // Request permission if not granted
      if (permissionStatus !== Location.PermissionStatus.GRANTED) {
        debugLocation.log('Requesting location permission...');
        permissionStatus = await requestLocationPermission();
      }
      
      // If permission still not granted, show platform-specific error
      if (permissionStatus !== Location.PermissionStatus.GRANTED) {
        debugLocation.error('Permission denied after request:', permissionStatus);
        if (Platform.OS === 'ios') {
          if (permissionStatus === Location.PermissionStatus.DENIED) {
            onLocationError?.(
              'Location access denied. Please go to Settings > Go BD > Location and select "While Using App"'
            );
          } else {
            onLocationError?.(
              'Location permission required. Please allow location access when prompted or check Settings > Go BD > Location'
            );
          }
        } else {
          onLocationError?.('Location permission is required to show your location');
        }
        return;
      }
      
      // Get current location with enhanced settings for iOS
      onLocationInfo?.('Getting your location...');
      debugLocation.log('Getting current position with options...');
      
      let location;
      if (Platform.OS === 'ios') {
        // Try with high accuracy first, fallback to balanced if needed
        try {
          const highAccuracyOptions: Location.LocationOptions = {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 5,
          };
          
          debugLocation.log('Trying high accuracy location options:', highAccuracyOptions);
          location = await Location.getCurrentPositionAsync(highAccuracyOptions);
        } catch (highAccuracyError) {
          debugLocation.warn('High accuracy failed, trying balanced:', highAccuracyError);
          
          const balancedOptions: Location.LocationOptions = {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 3000,
            distanceInterval: 10,
          };
          
          debugLocation.log('Trying balanced accuracy location options:', balancedOptions);
          location = await Location.getCurrentPositionAsync(balancedOptions);
        }
      } else {
        const locationOptions: Location.LocationOptions = {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        };
        
        debugLocation.log('Android location options:', locationOptions);
        location = await Location.getCurrentPositionAsync(locationOptions);
      }
      
      const { latitude, longitude } = location.coords;
      const newLocation = { latitude, longitude };
      debugLocation.log('Got location successfully:', newLocation);
      
      setUserLocation(newLocation);
      
      onLocationSuccess?.(newLocation);
      
    } catch (error: any) {
      debugLocation.error('Error getting location:', error);
      console.error('Error getting location:', error);
      
      // Handle iOS-specific location errors
      if (Platform.OS === 'ios') {
        if (error.code === 'E_LOCATION_SERVICES_DISABLED') {
          onLocationError?.(
            'Location Services are disabled. Please enable them in Settings > Privacy & Security > Location Services'
          );
        } else if (error.code === 'E_LOCATION_UNAUTHORIZED') {
          onLocationError?.(
            'Location access denied. Please go to Settings > Go BD > Location and select "While Using App"'
          );
        } else if (error.code === 'E_LOCATION_TIMEOUT') {
          onLocationError?.('Location request timed out. Please try again.');
        } else {
          onLocationError?.('Failed to get your location. Please ensure Location Services are enabled and try again.');
        }
      } else {
        // Android error handling
        if (error.code === 'E_LOCATION_SERVICES_DISABLED') {
          onLocationError?.('Please enable Location Services on your device');
        } else if (error.code === 'E_LOCATION_UNAUTHORIZED') {
          onLocationError?.('Location permission is required to show your location');
        } else {
          onLocationError?.('Failed to get your location. Please try again.');
        }
      }
    } finally {
      setGettingLocation(false);
      debugLocation.log('Location request completed');
    }
  }, [
    locationPermission,
    checkLocationPermission,
    requestLocationPermission,
    onLocationSuccess,
    onLocationError,
    onLocationInfo,
  ]);

  return {
    userLocation,
    locationPermission,
    gettingLocation,
    getUserLocation,
    checkLocationPermission,
    requestLocationPermission,
  };
};
