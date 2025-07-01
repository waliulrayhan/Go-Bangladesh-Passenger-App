import NfcManager, { NfcTech } from 'react-native-nfc-manager';

export interface NFCCardData {
  id: string;
  type: string;
  data?: any;
}

class NFCService {
  private isInitialized = false;
  private isScanning = false;
  private onCardDetected?: (cardData: NFCCardData) => void;

  async initialize(): Promise<boolean> {
    try {
      console.log('Starting NFC initialization...');
      
      // Check if NFC is supported
      const supported = await NfcManager.isSupported();
      console.log('NFC supported:', supported);
      
      if (!supported) {
        console.log('NFC is not supported on this device');
        return false;
      }

      // Check if NFC is enabled
      const enabled = await NfcManager.isEnabled();
      console.log('NFC enabled:', enabled);
      
      if (!enabled) {
        console.log('NFC is not enabled on this device');
        // For Sunmi devices, NFC might be available but disabled
        return false;
      }

      // Start NFC Manager
      await NfcManager.start();
      this.isInitialized = true;
      console.log('NFC Manager initialized successfully for Sunmi V3');
      return true;
    } catch (error) {
      console.error('Failed to initialize NFC:', error);
      console.error('Error details:', JSON.stringify(error));
      return false;
    }
  }

  async startScanning(onCardDetected: (cardData: NFCCardData) => void): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('NFC not available');
      }
    }

    this.onCardDetected = onCardDetected;
    this.isScanning = true;
    console.log('Starting NFC scanning for Sunmi V3...');
    this.scanForCards();
  }

  async checkNFCStatus(): Promise<{ supported: boolean; enabled: boolean; available: boolean }> {
    try {
      console.log('Checking NFC status...');
      
      // Check if NfcManager is available
      if (!NfcManager) {
        console.log('NfcManager is not available');
        return { supported: false, enabled: false, available: false };
      }

      // Try to check support with error handling
      let supported = false;
      try {
        supported = await NfcManager.isSupported();
        console.log('NFC isSupported() result:', supported);
      } catch (supportError) {
        console.log('Error checking NFC support:', supportError);
        return { supported: false, enabled: false, available: false };
      }

      if (!supported) {
        return { supported: false, enabled: false, available: false };
      }

      // Try to check if enabled with error handling
      let enabled = false;
      try {
        enabled = await NfcManager.isEnabled();
        console.log('NFC isEnabled() result:', enabled);
      } catch (enabledError) {
        console.log('Error checking NFC enabled status:', enabledError);
        // If we can't check enabled status, assume it's a permission/API issue
        return { supported: true, enabled: false, available: false };
      }

      return {
        supported,
        enabled,
        available: supported && enabled
      };
    } catch (error) {
      console.error('Error checking NFC status:', error);
      return {
        supported: false,
        enabled: false,
        available: false
      };
    }
  }

  private async scanForCards(): Promise<void> {
    while (this.isScanning) {
      try {
        console.log('Scanning for NFC cards on Sunmi V3...');
        
        // Request multiple NFC technologies for broader compatibility
        await NfcManager.requestTechnology([
          NfcTech.Ndef, 
          NfcTech.NfcA, 
          NfcTech.NfcB, 
          NfcTech.NfcF, 
          NfcTech.NfcV,
          NfcTech.IsoDep,
          NfcTech.MifareClassic,
          NfcTech.MifareUltralight
        ]);
        
        // Get the tag information
        const tag = await NfcManager.getTag();
        console.log('Raw NFC tag detected:', tag);
        
        if (tag && tag.id) {
          // Use the ID directly as it's already a string
          const cardId = tag.id;
          
          const cardData: NFCCardData = {
            id: cardId,
            type: tag.techTypes?.[0] || 'Unknown',
            data: tag
          };

          console.log('NFC Card processed for Sunmi V3:', cardData);
          
          if (this.onCardDetected) {
            this.onCardDetected(cardData);
          }
          
          // Wait a bit after successful detection to avoid duplicate reads
          await this.sleep(2000);
        }

        // Cancel the current request to prepare for next scan
        await NfcManager.cancelTechnologyRequest();
        
        // Small delay before next scan
        await this.sleep(100);
        
      } catch (error) {
        console.log('NFC scan cycle (will retry):', error);
        // Cancel any pending request
        try {
          await NfcManager.cancelTechnologyRequest();
        } catch (cancelError) {
          // Ignore cancel errors
        }
        
        // Wait a bit before retrying
        await this.sleep(500);
      }
    }
  }

  stopScanning(): void {
    this.isScanning = false;
    NfcManager.cancelTechnologyRequest().catch(() => {
      // Ignore errors when stopping
    });
  }

  async cleanup(): Promise<void> {
    this.stopScanning();
    if (this.isInitialized) {
      try {
        // NFC Manager doesn't need explicit stop in newer versions
        this.isInitialized = false;
      } catch (error) {
        console.error('Error cleaning up NFC:', error);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isNFCScanning(): boolean {
    return this.isScanning;
  }
}

export const nfcService = new NFCService();
