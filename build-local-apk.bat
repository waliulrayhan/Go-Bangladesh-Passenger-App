@echo off
echo Building local Android APK...
echo.

echo Checking prerequisites...
where npx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npx not found. Please install Node.js.
    goto :end
)

echo.
echo Building Expo project for Android...
npx expo export --platform android

echo.
echo Building Android APK locally...
cd android
.\gradlew assembleRelease

echo.
echo Build complete! Check android\app\build\outputs\apk\release\ for the APK file.

:end
pause
