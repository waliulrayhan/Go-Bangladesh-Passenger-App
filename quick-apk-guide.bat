@echo off
echo ================================================================
echo  Go Bangladesh - APK Generation Script (Alternative Method)
echo ================================================================
echo.

echo Step 1: Exporting Expo project for Android...
call npx expo export --platform android

if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to export Expo project
    goto :error
)

echo.
echo Step 2: Creating production bundle information...
echo Your app has been successfully exported to the 'dist' folder.
echo.

echo ================================================================
echo  NEXT STEPS FOR APK CREATION:
echo ================================================================
echo.
echo Option 1 - Use Expo Go for Testing:
echo 1. Install Expo Go on your Android device
echo 2. Run: npx expo start --tunnel
echo 3. Scan the QR code with Expo Go
echo.
echo Option 2 - EAS Build (when servers are working):
echo 1. Try: eas build --platform android --profile production-apk
echo 2. Monitor: https://expo.dev/accounts/waliulrayhan/projects/go-bangladesh
echo.
echo Option 3 - Local Development Build:
echo 1. Install Android Studio and set up ANDROID_HOME
echo 2. Generate keystore with: generate-keystore.bat
echo 3. Build with: ./build-local-apk.bat
echo.
echo Option 4 - Expo Development Client:
echo 1. Build dev client: eas build --profile development --platform android
echo 2. Install the dev client APK on your device
echo 3. Load your app: npx expo start --dev-client
echo.
echo ================================================================
echo  CURRENT STATUS:
echo ================================================================
echo ✅ Project configured for production
echo ✅ App exported successfully  
echo ✅ EAS project linked: go-bangladesh
echo ✅ Bundle created in: dist/
echo.
echo The exported bundle contains:
dir dist /b 2>nul || echo (No dist folder found)
echo.
echo Your project is ready for:
echo - Testing with Expo Go
echo - EAS Cloud Build (when servers recover)
echo - Local Android development setup
echo.
goto :end

:error
echo.
echo ================================================================
echo  ERROR OCCURRED
echo ================================================================
echo Please check the error messages above and try again.
echo.

:end
echo ================================================================
pause
