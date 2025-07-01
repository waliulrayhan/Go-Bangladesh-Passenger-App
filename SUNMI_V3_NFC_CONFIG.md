# Android NFC Configuration for Sunmi V3

## Add to app.json plugins section

```json
"plugins": [
  "expo-router",
  [
    "expo-location",
    {
      "locationAlwaysAndWhenInUsePermission": "This app needs access to location for trip tracking."
    }
  ],
  [
    "react-native-nfc-manager",
    {
      "nfcPermission": "This app uses NFC to read transport cards.",
      "selectIdentifiers": ["A0000002471001"],
      "systemCodeIdentifiers": ["8008"]
    }
  ]
]
```

## Manual Android Configuration (if needed)

If you need to manually configure, add to android/app/src/main/AndroidManifest.xml:

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature
    android:name="android.hardware.nfc"
    android:required="false" />

<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTask"
    android:theme="@style/LaunchTheme">
    
    <!-- NFC Intent Filters -->
    <intent-filter>
        <action android:name="android.nfc.action.TECH_DISCOVERED" />
        <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
    
    <intent-filter>
        <action android:name="android.nfc.action.NDEF_DISCOVERED" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="*/*" />
    </intent-filter>
    
    <meta-data
        android:name="android.nfc.action.TECH_DISCOVERED"
        android:resource="@xml/nfc_tech_filter" />
</activity>
```

## Sunmi V3 Specific Notes

- Sunmi V3 has built-in NFC hardware
- NFC reader is usually located on the back of the device
- Some Sunmi devices require specific initialization
- Check device settings for NFC enabled
