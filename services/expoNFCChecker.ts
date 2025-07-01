import Constants from 'expo-constants';

export class ExpoNFCChecker {
  static isExpoGo(): boolean {
    return Constants.appOwnership === 'expo';
  }

  static isStandaloneBuild(): boolean {
    return Constants.appOwnership !== 'expo' && Constants.appOwnership !== null;
  }

  static isDevelopmentBuild(): boolean {
    return !this.isExpoGo();
  }

  static getExpoEnvironmentInfo(): string {
    return `
Expo Environment Information:
- App Ownership: ${Constants.appOwnership}
- Expo Version: ${Constants.expoVersion}
- Platform: ${Constants.platform?.android ? 'Android' : 'Other'}
- Is Development: ${__DEV__}
- Runtime Version: ${Constants.runtimeVersion || 'N/A'}

NFC Library Compatibility:
- react-native-nfc-manager requires a development build or standalone build
- It does NOT work in Expo Go client
- For Sunmi V3, you need: npx expo run:android or npx eas build
    `;
  }

  static getNFCSetupInstructions(): string {
    if (this.isExpoGo()) {
      return `
🚨 NFC NOT SUPPORTED IN EXPO GO

Your app is running in Expo Go, which doesn't support native NFC functionality.

To use NFC on your Sunmi V3:

OPTION 1 - Development Build (Recommended for testing):
1. Stop the current Expo server
2. Run: npx expo run:android
3. This creates a development build with native NFC support

OPTION 2 - EAS Build (For production):
1. Configure EAS: npx eas build:configure
2. Build for Android: npx eas build --platform android
3. Install the APK on your Sunmi V3

OPTION 3 - Use Demo Mode:
- Use the "Simulate Card Detection" button for testing
- All functionality works except real NFC reading

Current Status: Expo Go - NFC Unavailable
      `;
    } else {
      return `
✅ EXPO ENVIRONMENT SUPPORTS NFC

Your app should support NFC functionality.
If you're still seeing errors, check:

1. Device NFC settings are enabled
2. App has NFC permissions
3. No other app is using NFC exclusively

Current Status: Development/Standalone Build - NFC Should Work
      `;
    }
  }
}
