@echo off
echo ================================================================
echo  Go Bangladesh - Test Your App NOW!
echo ================================================================
echo.

echo Starting Expo development server...
echo.
echo Instructions:
echo 1. Install "Expo Go" app on your Android phone from Play Store
echo 2. Make sure your phone and computer are on the same WiFi
echo 3. Open Expo Go app on your phone
echo 4. Scan the QR code that appears below
echo.
echo Your app will load on your phone for testing!
echo Press Ctrl+C to stop the server when done.
echo.

npx expo start --tunnel

pause
