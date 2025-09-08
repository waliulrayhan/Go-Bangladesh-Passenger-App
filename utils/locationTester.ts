// Location Testing Helper
// Add this to your view.tsx component temporarily to test location functionality

import * as Location from 'expo-location';

export const testLocationFunctionality = {
  // Test location permission status
  async testPermissions() {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      console.log('🧪 Current permission status:', status);
      
      const hasServices = await Location.hasServicesEnabledAsync();
      console.log('🧪 Location services enabled:', hasServices);
      
      return { status, hasServices };
    } catch (error) {
      console.error('🧪 Permission test failed:', error);
      return null;
    }
  },

  // Test getting location
  async testGetLocation() {
    try {
      console.log('🧪 Testing location retrieval...');
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 2000,
        distanceInterval: 5,
      });
      
      console.log('🧪 Location retrieved successfully:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toISOString(),
      });
      
      return location.coords;
    } catch (error) {
      console.error('🧪 Location test failed:', error);
      return null;
    }
  },

  // Test WebView communication
  testWebViewMessage(webViewRef: any, testMessage: string = 'console.log("🧪 WebView test message received");') {
    if (!webViewRef?.current) {
      console.error('🧪 WebView ref not available');
      return false;
    }
    
    console.log('🧪 Sending test message to WebView...');
    webViewRef.current.postMessage(testMessage);
    return true;
  },

  // Complete location + WebView test
  async runCompleteTest(webViewRef: any, mapLoaded: boolean) {
    console.log('🧪 Starting complete location test...');
    
    // 1. Test permissions
    const permissions = await this.testPermissions();
    if (!permissions) return false;
    
    // 2. Test location retrieval
    const location = await this.testGetLocation();
    if (!location) return false;
    
    // 3. Test WebView communication
    if (!mapLoaded) {
      console.log('🧪 Map not loaded yet, skipping WebView test');
      return false;
    }
    
    const webViewTest = this.testWebViewMessage(webViewRef);
    if (!webViewTest) return false;
    
    // 4. Test adding location to map
    const addLocationScript = `
      try {
        if (typeof addUserLocation === 'function') {
          console.log('🧪 Testing addUserLocation function...');
          addUserLocation(${location.latitude}, ${location.longitude}, "Test User", false, null);
          console.log('🧪 addUserLocation test completed');
        } else {
          console.error('🧪 addUserLocation function not available');
        }
      } catch (error) {
        console.error('🧪 addUserLocation test failed:', error);
      }
      true;
    `;
    
    this.testWebViewMessage(webViewRef, addLocationScript);
    
    console.log('🧪 Complete test finished successfully');
    return true;
  }
};

// Usage example (add to your component):
// 
// import { testLocationFunctionality } from './path/to/this/file';
// 
// // Add a test button or call from useEffect:
// useEffect(() => {
//   if (__DEV__ && mapState.mapLoaded) {
//     setTimeout(() => {
//       testLocationFunctionality.runCompleteTest(webViewRef, mapState.mapLoaded);
//     }, 2000);
//   }
// }, [mapState.mapLoaded]);
