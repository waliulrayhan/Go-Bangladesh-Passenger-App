import * as Location from 'expo-location';
import { useCallback, useState } from 'react';

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
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
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
      
      // Check permission first
      let permissionStatus = locationPermission;
      if (!permissionStatus) {
        permissionStatus = await checkLocationPermission();
      }
      
      // Request permission if not granted
      if (permissionStatus !== Location.PermissionStatus.GRANTED) {
        permissionStatus = await requestLocationPermission();
      }
      
      // If permission still not granted, show error
      if (permissionStatus !== Location.PermissionStatus.GRANTED) {
        onLocationError?.('Location permission is required to show your location');
        return;
      }
      
      // Get current location
      onLocationInfo?.('Getting your location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = location.coords;
      const newLocation = { latitude, longitude };
      setUserLocation(newLocation);
      
      onLocationSuccess?.(newLocation);
      
    } catch (error) {
      console.error('Error getting location:', error);
      onLocationError?.('Failed to get your location. Please try again.');
    } finally {
      setGettingLocation(false);
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
