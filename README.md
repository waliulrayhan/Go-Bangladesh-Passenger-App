# Go Bangladesh Passenger App

React Native Expo app for managing transport card balance and trips.

## Tech Stack

- React Native + Expo
- Expo Router (navigation)
- Zustand (state management)
- TypeScript

## Setup

1. **Install dependencies**
```bash
npm install
```

2. **Start development server**
```bash
npm start
```

3. **Run on device**
```bash
npm run android  # Android
npm run ios      # iOS
```

## Project Structure

```
app/
├── (auth)/          # Login/register screens
├── (tabs)/          # Main app screens
└── _layout.tsx      # Root layout

components/          # Reusable components
services/           # API services
stores/             # Zustand stores
utils/              # Constants and utilities
```

## Development

- API Base URL: `utils/constants.ts`
- Authentication: OTP-based login
- State: Zustand stores for auth and card data

## Build APK

```bash
npm install -g eas-cli
eas login
eas build:configure
npx expo-doctor
eas build --platform android --profile preview
```

## Android Setup

Add to `android/local.properties`:
```
sdk.dir=C:/Users/[USERNAME]/AppData/Local/Android/Sdk
```

Run locally:
```bash
$env:ANDROID_HOME="C:\Users\[USERNAME]\AppData\Local\Android\Sdk"
npx expo run:android
```

eas build --platform ios --profile production

Build your iOS app in the cloud -> eas build -p ios

Submit directly to Apple -> eas submit -p ios

eas submit --platform ios

local.properties
sdk.dir=C:/Users/Rayhan/AppData/Local/Android/Sdk

npx expo start --web (Local)

npx expo start --tunnel (Remote)

npx expo prebuild --clean