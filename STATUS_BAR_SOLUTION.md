# Status Bar Handling Solution

## Problem
The status bar appearance differs between:
1. **Development with USB debugging** (`npx expo run:android`) - Full control over status bar
2. **Expo Go development** (`npx expo start` + QR code) - Limited control due to Expo Go wrapper
3. **Production APK build** (`eas build`) - Full control like USB debugging

## Root Cause
- **Expo Go Environment**: The Expo Go app manages its own status bar, which can override or interfere with your app's StatusBar component settings
- **Platform Differences**: Android and iOS handle status bars differently
- **Environment Inconsistency**: Different build/runtime environments have different levels of control

## Solution Implemented

### 1. Enhanced Status Bar Configuration
**File: `app/(tabs)/index.tsx`**
- Added `Platform` and `Constants` imports for proper platform detection
- Enhanced StatusBar component with more explicit configuration:
  ```tsx
  <StatusBar
    backgroundColor={COLORS.primary}
    barStyle="light-content"
    translucent={false}
    hidden={false}
    animated={true}
  />
  ```

### 2. Dynamic Header Padding
**File: `app/(tabs)/index.tsx`**
- Removed hardcoded `statusBarArea` height
- Added platform-specific padding using `Constants.statusBarHeight`:
  ```tsx
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? Constants.statusBarHeight : 0,
    paddingBottom: 20,
  }
  ```

### 3. App-Level Status Bar Configuration
**File: `app.json`**
- Added global status bar configuration:
  ```json
  {
    "statusBarBackgroundColor": "#4A90E2",
    "statusBarStyle": "light",
    "android": {
      "statusBarBackgroundColor": "#4A90E2",
      "statusBarStyle": "light"
    }
  }
  ```

### 4. Custom Status Bar Hook
**File: `hooks/useStatusBar.ts`**
- Created reusable hook for consistent status bar management
- Handles focus changes to maintain consistency in tab navigation
- Uses `useFocusEffect` to reapply settings when screens become active

### 5. Status Bar Manager Component
**File: `components/StatusBarManager.tsx`**
- Wrapper component for centralized status bar management
- Detects environment (Expo Go vs standalone)
- Applies platform-specific configurations

### 6. Integration in Layout Components
**Files: `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`**
- Applied the `useStatusBar` hook in both main components
- Ensures consistent status bar across all tab screens

## Expected Results

### Development with Expo Go (`npx expo start`)
- Status bar will now be more consistent with production builds
- Blue background color (#4A90E2) should appear correctly
- Light content style for white text/icons

### USB Debugging (`npx expo run:android`)
- Maintains current appearance
- Consistent with production builds

### Production APK (`eas build --platform android --profile preview`)
- **Should match USB debugging appearance**
- Blue status bar background
- Proper integration with header design
- No spacing issues

## Why This Works

1. **Platform Detection**: Uses `Platform.OS` and `Constants.statusBarHeight` for accurate cross-platform handling
2. **Environment Awareness**: The solution adapts to different runtime environments
3. **Multiple Layers**: Combines app.json configuration, StatusBar component, and custom hooks for maximum compatibility
4. **Focus Management**: Maintains status bar consistency during navigation

## Testing Recommendations

1. **Test in Expo Go**: Scan QR code - should see improved status bar consistency
2. **Test USB Debugging**: `npx expo run:android` - should maintain current appearance
3. **Test Production Build**: `eas build` - should match USB debugging experience

The production APK build will have the same status bar behavior as USB debugging because both environments give your app full control over the status bar, unlike Expo Go which has its own wrapper constraints.
