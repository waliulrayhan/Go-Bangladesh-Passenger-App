@echo off
color 0A
echo ================================================================
echo            Go Bangladesh - INSTANT APP TESTING
echo ================================================================
echo.
echo Your app is ready! Let's test it RIGHT NOW on your phone.
echo.
echo Instructions:
echo 1. Install "Expo Go" app from Google Play Store on your phone
echo 2. Make sure phone and computer are on same WiFi network
echo 3. When QR code appears below, open Expo Go and scan it
echo 4. Your app will load instantly on your phone!
echo.
echo Starting in 3 seconds...
timeout /t 3 /nobreak >nul
echo.
echo ================================================================
echo                    STARTING EXPO SERVER...
echo ================================================================
echo.

npx expo start --tunnel

echo.
echo ================================================================
echo Test completed! Your app should be running on your phone.
echo To get a production APK, EAS builds need to be fixed or 
echo use the alternative methods in IMMEDIATE_APK_SOLUTION.md
echo ================================================================
pause
