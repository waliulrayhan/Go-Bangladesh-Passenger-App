import { Alert } from 'react-native';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

export class NFCDebugger {
  static async runDiagnostics(): Promise<string> {
    let diagnostics = 'NFC Diagnostics for Sunmi V3:\n\n';
    
    try {
      // Check if NfcManager exists
      if (!NfcManager) {
        diagnostics += '0. NfcManager Module: NOT AVAILABLE\n';
        diagnostics += 'This suggests the library is not properly linked or Expo needs a development build.\n';
        return diagnostics;
      }
      
      diagnostics += '0. NfcManager Module: AVAILABLE\n';

      // Check basic support with individual error handling
      try {
        const isSupported = await NfcManager.isSupported();
        diagnostics += `1. NFC Supported: ${isSupported}\n`;
        
        if (!isSupported) {
          diagnostics += 'Device does not support NFC hardware.\n';
          return diagnostics;
        }
      } catch (supportError) {
        diagnostics += `1. NFC Supported: ERROR - ${supportError}\n`;
        diagnostics += 'Cannot check NFC support - likely library initialization issue.\n';
        return diagnostics;
      }

      // Check if enabled
      try {
        const isEnabled = await NfcManager.isEnabled();
        diagnostics += `2. NFC Enabled: ${isEnabled}\n`;
        
        if (!isEnabled) {
          diagnostics += 'NFC is supported but disabled in device settings.\n';
        }
      } catch (enabledError) {
        diagnostics += `2. NFC Enabled: ERROR - ${enabledError}\n`;
        diagnostics += 'Cannot check NFC enabled status - permission or API issue.\n';
      }

      // Try to start NFC Manager
      try {
        await NfcManager.start();
        diagnostics += `3. NFC Manager Start: SUCCESS\n`;
        
        // Get available technologies
        try {
          await NfcManager.requestTechnology([NfcTech.Ndef]);
          diagnostics += `4. NFC Technology Request: SUCCESS\n`;
          await NfcManager.cancelTechnologyRequest();
        } catch (techError) {
          diagnostics += `4. NFC Technology Request: FAILED - ${techError}\n`;
          diagnostics += 'NFC Manager started but cannot request technologies.\n';
        }
        
      } catch (startError) {
        diagnostics += `3. NFC Manager Start: FAILED - ${startError}\n`;
        diagnostics += 'NFC Manager cannot be started - permission or hardware issue.\n';
      }
      
    } catch (error: any) {
      diagnostics += `\nUnexpected error during diagnostics: ${error}\n`;
      diagnostics += `Error type: ${typeof error}\n`;
      diagnostics += `Error name: ${error?.name || 'Unknown'}\n`;
      diagnostics += `Error message: ${error?.message || 'No message'}\n`;
    }
    
    diagnostics += `\nEnvironment Info:\n`;
    diagnostics += `- Platform: Android (Sunmi V3)\n`;
    diagnostics += `- Expo SDK: ${__DEV__ ? 'Development' : 'Production'}\n`;
    diagnostics += `- Timestamp: ${new Date().toISOString()}\n`;
    
    return diagnostics;
  }
  
  static async showDiagnostics(): Promise<void> {
    const results = await this.runDiagnostics();
    
    Alert.alert(
      'NFC Diagnostics',
      results,
      [
        { text: 'Copy to Clipboard', onPress: () => {
          // In a real app, you'd copy to clipboard here
          console.log('Diagnostics:', results);
        }},
        { text: 'OK' }
      ],
      { cancelable: true }
    );
  }
}
