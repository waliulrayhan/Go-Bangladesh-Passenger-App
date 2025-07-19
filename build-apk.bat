@echo off
echo Building production APK with EAS...
echo.

echo Checking if you're logged into Expo...
eas whoami

if %ERRORLEVEL% NEQ 0 (
    echo You need to login to Expo first.
    echo Run: eas login
    goto :end
)

echo.
echo Building production APK...
eas build --platform android --profile production-apk

:end
pause
