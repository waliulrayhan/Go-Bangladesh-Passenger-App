@echo off
echo Building production AAB (Android App Bundle) with EAS...
echo.

echo Checking if you're logged into Expo...
eas whoami

if %ERRORLEVEL% NEQ 0 (
    echo You need to login to Expo first.
    echo Run: eas login
    goto :end
)

echo.
echo Building production App Bundle for Google Play Store...
eas build --platform android --profile production

:end
pause
