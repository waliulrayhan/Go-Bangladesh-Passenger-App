@echo off
echo Generating Android keystore for release builds...
echo.
echo Please enter the following information when prompted:
echo - Use a strong password and remember it
echo - Fill in all the certificate information
echo.

cd android\app

keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000

echo.
echo Keystore generated successfully!
echo.
echo Now add the following lines to android\gradle.properties:
echo MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
echo MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
echo MYAPP_UPLOAD_STORE_PASSWORD=YOUR_STORE_PASSWORD
echo MYAPP_UPLOAD_KEY_PASSWORD=YOUR_KEY_PASSWORD
echo.
echo Replace YOUR_STORE_PASSWORD and YOUR_KEY_PASSWORD with the passwords you just entered.
echo.
pause
