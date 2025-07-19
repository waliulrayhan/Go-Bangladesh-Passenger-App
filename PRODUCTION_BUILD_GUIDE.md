# Go Bangladesh - Production Build Guide

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **Android Studio** with Android SDK (Optional for EAS builds)
3. **Java Development Kit (JDK)** version 17 (Optional for EAS builds)
4. **Expo CLI** and **EAS CLI** (installed via: `npm install -g @expo/cli eas-cli`)

## App Icons & Splash Screen

The app is configured with:
- **App Icon**: `./assets/images/icon.png`
- **Splash Screen**: `./assets/images/splash-icon.png`
- **Adaptive Icon**: `./assets/images/adaptive-icon.png`

Make sure these images are properly sized:
- App Icon: 1024x1024 px
- Splash Screen: 1284x2778 px (recommended)
- Adaptive Icon: 1024x1024 px

## Current Status ✅

Your Go Bangladesh app is now **production-ready** with the following completed:

- ✅ **EAS Project Configured**: Linked to `go-bangladesh` project
- ✅ **Production Settings**: Updated app.json with proper package name
- ✅ **Build Profiles**: Created for development, preview, and production
- ✅ **App Bundle Exported**: Successfully created production bundle
- ✅ **Keystore Generated**: EAS automatically created signing keystore

## Immediate Testing Options

### 🚀 Test Your App Right Now (Recommended)

1. **Run**: `test-app-now.bat`
2. **Install** Expo Go on your Android phone
3. **Scan** the QR code to test your app immediately

### 📱 Alternative Testing
```bash
npx expo start --tunnel
```

## Getting Your APK

### Option 1: Wait for EAS (Recommended)
EAS Build is experiencing temporary server issues (500 errors). Monitor your builds at:
**https://expo.dev/accounts/waliulrayhan/projects/go-bangladesh/builds**

Once EAS servers are stable, your builds will complete automatically.

### Option 2: Try EAS Again Later
```bash
eas build --platform android --profile production-apk
```

### Option 3: Development Client Build
```bash
eas build --profile development --platform android
```
This creates an APK that can load your bundled app.

### Method 1: Using EAS Build (Cloud Build - Recommended)

**Status**: ⚠️ Currently experiencing server issues (500 errors). Try Method 2 instead.

1. **Login to Expo**:
   ```bash
   eas login
   ```

2. **Configure EAS Project** (first time only):
   ```bash
   eas build:configure
   ```

3. **Build APK**:
   ```bash
   eas build --platform android --profile production-apk
   ```
   Or run the batch file: `build-apk.bat`

4. **Build AAB for Google Play Store**:
   ```bash
   eas build --platform android --profile production
   ```
   Or run the batch file: `build-aab.bat`

### Method 2: Expo Development Build (Recommended Alternative)

1. **Install Expo Development Client**:
   ```bash
   npx create-expo-app --template
   ```

2. **Build Development Client APK**:
   ```bash
   eas build --profile development --platform android
   ```

3. **Create Production Bundle**:
   ```bash
   npx expo export --platform android
   ```

### Method 3: Using Expo Application Services (Alternative)

If EAS is having issues, you can use the Expo web interface:

1. Go to [expo.dev](https://expo.dev)
2. Create/login to your account
3. Link your project manually
4. Use the web interface to trigger builds

### Method 4: Alternative APK Creation

For immediate APK creation while EAS issues are resolved:

1. **Export your project**:
   ```bash
   npx expo export --platform android
   ```

2. **Create a simple APK wrapper** (requires Android development setup):
   ```bash
   npx create-react-native-app MyApp
   # Then copy your exported bundle
   ```

### Method 2: Local Build

1. **Generate Keystore** (first time only):
   - Run `generate-keystore.bat`
   - Follow the prompts to create your keystore
   - Update `android/gradle.properties` with keystore details

2. **Build locally**:
   - Run `build-local-apk.bat`
   - APK will be in `android/app/build/outputs/apk/release/`

## Keystore Setup for Local Builds

1. Run `generate-keystore.bat` to create your keystore
2. Add these lines to `android/gradle.properties`:
   ```properties
   MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
   MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
   MYAPP_UPLOAD_STORE_PASSWORD=your_store_password
   MYAPP_UPLOAD_KEY_PASSWORD=your_key_password
   ```

## Build Profiles

- **development**: Debug builds for testing
- **preview**: Internal distribution APK
- **production**: AAB for Google Play Store
- **production-apk**: APK for direct distribution

## Distribution

### Google Play Store
1. Build AAB: `eas build --platform android --profile production`
2. Upload to Google Play Console
3. Follow Google's review process

### Direct APK Distribution
1. Build APK: `eas build --platform android --profile production-apk`
2. Download from EAS dashboard
3. Distribute directly to users

## Troubleshooting

### Common Issues:

1. **Build fails with keystore error**:
   - Ensure keystore is generated and configured properly
   - Check gradle.properties has correct keystore settings

2. **EAS login issues**:
   - Create account at expo.dev
   - Run `eas login` and enter credentials

3. **Android SDK issues**:
   - Ensure Android SDK is installed via Android Studio
   - Set ANDROID_HOME environment variable

### Getting Build Logs:
```bash
eas build:list
eas build:view [build-id]
```

## File Structure Changes

- Updated `app.json` with production settings
- Created `eas.json` for build configuration
- Modified `android/app/build.gradle` for proper signing
- Updated `android/gradle.properties` with optimization settings

## Next Steps After Building

1. **Testing**: Test the APK thoroughly on different devices
2. **Store Listing**: Prepare app store description, screenshots
3. **Privacy Policy**: Create privacy policy if required
4. **Monitoring**: Set up crash reporting and analytics
