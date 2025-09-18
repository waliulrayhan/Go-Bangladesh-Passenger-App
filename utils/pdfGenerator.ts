import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TripTransaction } from '../services/api';
import { formatDate, TimeFormatter } from './dateTime';

const getTripDuration = (startTime: string, endTime?: string): string => {
  if (!endTime) return 'Ongoing Trip';
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

const generateInvoiceHTML = (tripTransaction: TripTransaction): string => {
  if (!tripTransaction.trip) return '';
  
  const trip = tripTransaction.trip;
  const bus = trip.session?.bus;
  const organization = bus?.organization;
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Trip Receipt</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.4;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }
        
        .title {
            color: #0066cc;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .section {
            margin-bottom: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        
        .section-header {
            background-color: #f5f5f5;
            padding: 10px;
            font-weight: bold;
            color: #0066cc;
            border-bottom: 1px solid #ddd;
        }
        
        .section-content {
            padding: 15px;
        }
        
        .row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dotted #ccc;
        }
        
        .row:last-child {
            border-bottom: none;
        }
        
        .label {
            font-weight: 600;
            color: #666;
        }
        
        .value {
            color: #333;
            text-align: right;
        }
        
        .fare-amount {
            font-size: 18px;
            color: #dc3545;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">GO BANGLADESH</h1>
        <p>Trip Receipt</p>
    </div>

    <div class="section">
        <div class="section-header">Trip Information</div>
        <div class="section-content">
            <div class="row">
                <span class="label">Transaction ID:</span>
                <span class="value">${tripTransaction.transactionId}</span>
            </div>
            ${bus?.busNumber ? `
            <div class="row">
                <span class="label">Bus Number:</span>
                <span class="value">${bus.busNumber}</span>
            </div>
            ` : ''}
            ${organization?.name ? `
            <div class="row">
                <span class="label">Organization:</span>
                <span class="value">${organization.name}</span>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-header">Fare Details</div>
        <div class="section-content">
            <div class="row">
                <span class="label">Fare Amount:</span>
                <span class="value fare-amount">৳${tripTransaction.amount.toFixed(2)}</span>
            </div>
            ${trip.distance > 0 ? `
            <div class="row">
                <span class="label">Distance:</span>
                <span class="value">${trip.distance.toFixed(2)} km</span>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="section">
        <div class="section-header">Trip Timing</div>
        <div class="section-content">
            <div class="row">
                <span class="label">Start Time:</span>
                <span class="value">${trip.tripStartTime ? TimeFormatter.forHistory(trip.tripStartTime) : 'N/A'}</span>
            </div>
            ${trip.tripEndTime ? `
            <div class="row">
                <span class="label">End Time:</span>
                <span class="value">${TimeFormatter.forHistory(trip.tripEndTime)}</span>
            </div>
            ` : ''}
            <div class="row">
                <span class="label">Duration:</span>
                <span class="value">${getTripDuration(trip.tripStartTime, trip.tripEndTime)}</span>
            </div>
        </div>
    </div>

    ${trip.startingLatitude && trip.startingLongitude ? `
    <div class="section">
        <div class="section-header">Locations</div>
        <div class="section-content">
            <div class="row">
                <span class="label">Start:</span>
                <span class="value">${trip.startingLatitude}, ${trip.startingLongitude}</span>
            </div>
            ${trip.endingLatitude && trip.endingLongitude ? `
            <div class="row">
                <span class="label">End:</span>
                <span class="value">${trip.endingLatitude}, ${trip.endingLongitude}</span>
            </div>
            ` : ''}
        </div>
    </div>
    ` : ''}

    <div class="footer">
        <p>Digital receipt for your bus journey</p>
        <p>Generated: ${formatDate(new Date())} ${new Date().toLocaleTimeString()}</p>
    </div>
</body>
</html>
  `;
};

export const generateInvoicePDF = async (
  tripTransaction: TripTransaction,
  fileName?: string
): Promise<string | null> => {
  try {
    if (!tripTransaction.trip) {
      console.error('No trip data available');
      return null;
    }

    console.log('Starting PDF generation...');
    
    const pdfFileName = fileName || `trip-receipt-${tripTransaction.transactionId}.pdf`;
    const htmlContent = generateInvoiceHTML(tripTransaction);

    console.log('Generating PDF from HTML content...');

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });
    
    console.log('PDF generated at:', uri);

    if (!uri) {
      throw new Error('PDF generation failed - no URI returned');
    }

    // Verify the generated file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Generated PDF file does not exist');
    }

    console.log('PDF file verified, size:', fileInfo.size);
    return uri;
  } catch (error) {
    console.error('PDF generation error:', error);
    return null;
  }
};

export const downloadInvoicePDF = async (
  tripTransaction: TripTransaction,
  fileName?: string
): Promise<boolean> => {
  try {
    console.log('Starting PDF download process...');
    
    const pdfUri = await generateInvoicePDF(tripTransaction, fileName);
    
    if (!pdfUri) {
      console.error('Failed to generate PDF');
      return false;
    }

    console.log('PDF generated, starting sharing process...');

    // Check if sharing is available on this platform
    const isShareAvailable = await Sharing.isAvailableAsync();
    
    if (!isShareAvailable) {
      console.log('Sharing not available on this platform');
      return false;
    }

    // Share the PDF file
    await Sharing.shareAsync(pdfUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save Trip Receipt',
      UTI: 'com.adobe.pdf',
    });
    
    console.log('PDF sharing completed successfully');
    return true;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return false;
  }
};