import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TripTransaction } from '../services/api';
import { formatDate } from './dateTime';

// Define image assets
const logoAssets = {
  goBdLogo: require('../assets/images/goBdLogoForInvoice.png'),
  portfolioBanner: require('../assets/images/portfolioBanner.png'),
};

// Simple and reliable PNG image loader - 100% GUARANTEED for preview APK
const getPNGImageAsBase64 = async (assetModule: any): Promise<string> => {
  try {
    const asset = Asset.fromModule(assetModule);
    
    // CRITICAL: Always ensure asset is downloaded for production builds
    if (!asset.downloaded) {
      console.log('Downloading asset for production build...');
      await asset.downloadAsync();
    }
    
    // Double check it's actually downloaded
    if (!asset.downloaded) {
      throw new Error('Asset download failed');
    }
    
    // Get the URI - localUri for downloaded assets, uri for bundled
    const uri = asset.localUri || asset.uri;
    console.log('Asset URI:', uri);
    
    if (!uri) {
      throw new Error('No URI available for asset');
    }
    
    // Verify file exists before reading (important for APK builds)
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error(`Asset file does not exist at ${uri}`);
    }
    
    // Convert PNG to base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Verify we got actual content
    if (!base64 || base64.length < 100) {
      throw new Error('Asset file appears to be empty or corrupt');
    }
    
    console.log(`Asset loaded successfully (${base64.length} chars)`);
    // Return the base64 data URL for PNG
    return `data:image/png;base64,${base64}`;
    
  } catch (error) {
    console.error('Error loading PNG asset:', error);
    // Return transparent pixel as fallback - this ensures PDF never breaks
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
};

// Helper function to format date and time together
const formatDateAndTime = (dateString: string): string => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Format: "Dec 15, 2024, 02:00 PM"
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    
    return date.toLocaleString('en-US', options);
  } catch (error) {
    console.error('Error formatting date and time:', error);
    return 'Invalid date';
  }
};

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

// Helper function to format currency for display
const formatCurrency = (amount: number): string => {
  return amount.toFixed(2);
};

// Helper function to convert number to words (comprehensive version)
const numberToWords = (amount: number): string => {
  if (amount === 0) return 'Zero Taka Only';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertHundreds = (num: number): string => {
    let result = '';
    
    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    if (num >= 20) {
      result += tens[Math.floor(num / 10)];
      if (num % 10 !== 0) {
        result += ' ' + ones[num % 10];
      }
    } else if (num >= 10) {
      result += teens[num - 10];
    } else if (num > 0) {
      result += ones[num];
    }
    
    return result.trim();
  };
  
  let wholePart = Math.floor(amount);
  const decimalPart = Math.round((amount - wholePart) * 100);
  
  let result = '';
  
  if (wholePart >= 10000000) { // Crore
    const crores = Math.floor(wholePart / 10000000);
    result += convertHundreds(crores) + ' Crore ';
    wholePart %= 10000000;
  }
  
  if (wholePart >= 100000) { // Lakh
    const lakhs = Math.floor(wholePart / 100000);
    result += convertHundreds(lakhs) + ' Lakh ';
    wholePart %= 100000;
  }
  
  if (wholePart >= 1000) { // Thousand
    const thousands = Math.floor(wholePart / 1000);
    result += convertHundreds(thousands) + ' Thousand ';
    wholePart %= 1000;
  }
  
  if (wholePart > 0) {
    result += convertHundreds(wholePart);
  }
  
  result = result.trim();
  if (result === '') result = 'Zero';
  
  result += ' Taka';
  
  if (decimalPart > 0) {
    result += ' and ' + convertHundreds(decimalPart) + ' Paisa';
  }
  
  return result + ' Only';
};

const generateInvoiceHTML = async (tripTransaction: TripTransaction, user?: any): Promise<string> => {
  if (!tripTransaction.trip) return '';
  
  // Load PNG images as base64 - Simple and clean
  const [goBdLogoBase64, portfolioBannerBase64] = await Promise.all([
    getPNGImageAsBase64(logoAssets.goBdLogo),
    getPNGImageAsBase64(logoAssets.portfolioBanner),
  ]);
  
  const trip = tripTransaction.trip;
  const bus = trip.session?.bus;
  const organization = bus?.organization;
  
  // Generate invoice number with date and transaction ID
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const invoiceNumber = `GoBD-${tripTransaction.transactionId}`;
  const issueDate = formatDate(today);
  const totalAmount = tripTransaction.amount;
  const totalInWords = numberToWords(totalAmount);
  
  // Get user information with better fallback handling
  const userName = user?.name || 'N/A';
  const userType = user?.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'N/A';
  const userCard = tripTransaction.card?.cardNumber || user?.cardNumber || 'N/A';
  
  // Handle organization properly - can be string or object
  let userOrganization = 'N/A';
  if (user?.organization) {
    if (typeof user.organization === 'string') {
      userOrganization = user.organization;
    } else if (user.organization.name) {
      userOrganization = user.organization.name;
    }
  }
  
  // Debug logging to verify user data
  console.log('PDF User Data:', {
    userName,
    userType,
    userCard,
    userOrganization,
    originalUser: user
  });
  
  // Get trip distance
  const tripDistance = trip.distance && trip.distance > 0 ? `${trip.distance.toFixed(2)} km` : '0.00 km';
  
  // Get fare amounts from API response (route information)
  const route = bus?.route;
  const baseFare = route?.baseFare || 0.00; // Use API value or fallback
  const perKmFare = route?.perKmFare || 0.00; // Use API value or fallback
  const penaltyFare = route?.penaltyAmount || 0.00; // Use API value or fallback
  
  // Debug logging for fare data
  console.log('PDF Fare Data:', {
    baseFare,
    perKmFare,
    penaltyFare,
    totalAmount,
    tripDistance,
    route: route ? { baseFare: route.baseFare, perKmFare: route.perKmFare, penaltyFare: route.penaltyAmount } : null
  });
  
  // Calculate amounts - VAT/Tax is zero as per requirement
  const fareAmount = totalAmount;
  const dueAmount = 0; // Assuming trip is paid
  const subtotal = totalAmount; // No tax/VAT, so subtotal equals total
  const tax = 0.00; // VAT/Tax is zero as requested
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice ${invoiceNumber}</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #000000;
            background-color: #ffffff;
            padding: 15mm 10mm 10mm 10mm;
            margin: 0 auto;
            max-width: 210mm;
            min-height: 297mm;
            position: relative;
        }
        
        .taka-symbol {
            font-family: 'Noto Sans Bengali', 'Plus Jakarta Sans', sans-serif;
            font-weight: 500;
        }
        
        /* Header with logos */
        .header-logos {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #000000;
            position: relative;
            z-index: 2;
        }
        
        .header-logos .logo-left,
        .header-logos .logo-right {
            flex: 1;
            display: flex;
        }
        
        .header-logos .logo-left {
            justify-content: flex-start;
        }
        
        .header-logos .logo-right {
            justify-content: flex-end;
        }
        
        .logo-image {
            height: 60px;
            width: auto;
            object-fit: contain;
        }
        
        /* Status seal */
        .status-seal {
            position: absolute;
            right: 80px;
            top: 220px;
            transform: rotate(-12deg);
            width: 120px;
            height: 120px;
            border-radius: 50%;
            border: 3px solid rgba(5, 150, 105, 0.8);
            background-color: rgba(5, 150, 105, 0.08);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: 800;
            color: rgba(5, 150, 105, 0.8);
            text-transform: uppercase;
            z-index: 1;
            text-align: center;
            line-height: 1.1;
            letter-spacing: 0.5px;
        }
        
        .status-seal::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90px;
            height: 90px;
            border-radius: 50%;
            border: 2px solid rgba(5, 150, 105, 0.8);
            background-color: transparent;
            z-index: 2;
        }
        
        .status-content {
            z-index: 3;
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1px;
        }
        
        .status-label {
            font-size: 6px;
            font-weight: 600;
            letter-spacing: 1.2px;
            opacity: 0.7;
        }
        
        .status-text {
            font-size: 12px;
            font-weight: 900;
            margin-bottom: 1px;
        }
        
        /* Date and invoice number */
        .date-invoice-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 50px;
            position: relative;
            z-index: 2;
            font-size: 14px;
        }
        
        /* Invoice title */
        .invoice-title {
            text-align: center;
            margin-bottom: 50px;
            position: relative;
            z-index: 2;
        }
        
        .invoice-title h1 {
            font-size: 24px;
            font-weight: 700;
            color: #000000;
            margin: 0 0 5px 0;
            border: 2px solid #000000;
            padding: 10px 20px;
            display: inline-block;
        }
        
        /* Period */
        .period {
            text-align: center;
            margin-bottom: 30px;
            font-size: 16px;
            position: relative;
            z-index: 2;
        }
        
        /* Billing information grid */
        .billing-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
            position: relative;
            z-index: 2;
        }
        
        .billing-section h3 {
            font-size: 16px;
            font-weight: 600;
            color: #000000;
            margin: 0 0 5px 0;
        }
        
        .billing-section hr {
            border: none;
            border-top: 1px solid #000000;
            margin: 0 0 15px 0;
            width: 80px;
        }
        
        .billing-details {
            font-size: 14px;
            line-height: 1.6;
        }
        
        .billing-details p {
            margin: 0 0 4px 0;
        }
        
        .billing-details .company-name {
            font-weight: 700;
            margin-bottom: 8px;
            font-size: 16px;
        }
        
        .billing-details strong {
            font-weight: 600;
        }
        
        /* Table introduction */
        .table-intro {
            margin-bottom: 20px;
            position: relative;
            z-index: 2;
        }
        
        .table-intro p {
            margin: 0;
            font-size: 14px;
            font-weight: 500;
            color: #000000;
        }
        
        /* Invoice table */
        .invoice-table-container {
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
        }
        
        .invoice-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
            border: 1px solid #000000;
            margin-bottom: 10px;
        }
        
        .invoice-table th,
        .invoice-table td {
            border: 1px solid #000000;
            padding: 8px;
            text-align: right;
        }
        
        .invoice-table th {
            font-weight: 600;
            background-color: #ffffff;
        }
        
        .invoice-table tbody td {
            font-weight: 400;
        }
        
        .invoice-table .total-cell {
            font-weight: 600;
        }
        
        /* Summary table */
        .summary-container {
            display: flex;
            justify-content: flex-end;
            width: 100%;
        }
        
        .summary-table {
            width: 40%;
            border-collapse: collapse;
            font-size: 14px;
        }
        
        .summary-table td {
            border: 1px solid #000000;
            padding: 8px;
            text-align: right;
            font-weight: 600;
        }
        
        .summary-table .border-top-none {
            border-top: none;
        }
        
        .summary-table .grand-total {
            font-weight: 700;
            background-color: #f9f9f9;
        }
        
        /* Amount in words and terms */
        .terms-section {
            margin-top: 25px;
            margin-bottom: 70px;
            position: relative;
            z-index: 2;
        }
        
        .terms-section p {
            margin: 0 0 15px 0;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .amount-words {
            font-weight: 600;
        }
        
        .electronic-notice {
            padding-top: 70px;
            font-style: italic;
            text-align: center;
            color: #999999;
        }
        
        /* Footer */ 
        .footer-hr {
            border: none;
            border-top: 1px solid #000000;
            margin: 20px 0 5px 0;
            padding-top: 0;
        }
        
        .footer {
            text-align: center;
        }
        
        .footer-content {
            font-size: 12px;
            line-height: 1.6;
        }
        
        .footer-content p {
            margin: 0 0 8px 0;
        }
        
        .footer-content p:last-child {
            margin-bottom: 0;
        }
        
        /* Print styles for PDF generation */
        @media print {
            body {
                padding: 15mm 10mm 10mm 10mm;
                margin: 0;
                max-width: none;
                width: 210mm;
                min-height: 257mm;
                background-color: #ffffff;
                font-size: 11px;
                display: flex;
                flex-direction: column;
                box-sizing: border-box;
            }
            
            @page {
                size: A4;
                margin: 0;
            }
            
            .status-seal {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
            }
            
            .header-logos {
                page-break-inside: avoid;
                margin-top: 0;
            }
            
            .billing-grid {
                page-break-inside: avoid;
            }
            
            .invoice-table-container {
                page-break-inside: avoid;
            }
            
            .terms-section {
                page-break-before: auto;
                page-break-inside: avoid;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
            }
            
            .footer-hr {
                margin-top: auto;
                margin-bottom: 8px;
            }
            
            .footer {
                margin-top: 0;
                margin-bottom: 0;
            }
        }
        
        /* Screen preview styles that mimic A4 */
        @media screen {
            body {
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                border: 1px solid #ddd;
            }
        }
        
        /* Logo placeholder styles for testing */
        .logo-placeholder {
            height: 60px;
            width: 120px;
            background-color: #f0f0f0;
            border: 2px dashed #ccc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <!-- Status Seal -->
    <div class="status-seal">
        <div class="status-content">
            <div class="status-label">TRIP STATUS</div>
            <div class="status-text">COMPLETED</div>
        </div>
    </div>
    
    <!-- Header with Logos -->
    <div class="header-logos">
        <div class="logo-left">
            <img src="${goBdLogoBase64}" alt="Go Bangladesh Logo" class="logo-image">
        </div>
        <div class="logo-right">
            <img src="${portfolioBannerBase64}" alt="Portfolio Banner" class="logo-image">
        </div>
    </div>
    
    <!-- Date and Invoice Number -->
    <div class="date-invoice-row">
        <div>Date: ${issueDate}</div>
        <div>Invoice Number: ${invoiceNumber}</div>
    </div>
    
    <!-- Invoice Title -->
    <div class="invoice-title">
        <h1>INVOICE</h1>
    </div>
    
    <!-- Billing Information -->
    <div class="billing-grid">
        <div class="billing-section">
            <h3>User Information</h3>
            <hr>
            <div class="billing-details">
                <p class="company-name">${userName}</p>
                <p><strong>Organization:</strong> ${userOrganization}</p>
                <p><strong>User Type:</strong> ${userType}</p>
                <p><strong>Card Number:</strong> ${userCard}</p>
                <p><strong>Transaction ID:</strong> ${tripTransaction.transactionId}</p>
            </div>
        </div>
        
        <div class="billing-section">
            <h3>Trip Information</h3>
            <hr>
            <div class="billing-details">
                <p class="company-name">${bus?.busNumber || 'N/A'}</p>
                <p><strong>Organization:</strong> ${organization?.name || 'Go Bangladesh'}</p>
                <p><strong>Route:</strong> ${bus?.route?.tripStartPlace && bus?.route?.tripEndPlace ? 
                  `${bus.route.tripStartPlace} ⇄ ${bus.route.tripEndPlace}` : 
                  (bus?.busName || 'Route not available')}</p>
                <p><strong>Start Time:</strong> ${trip.tripStartTime ? formatDateAndTime(trip.tripStartTime) : 'N/A'}</p>
                ${trip.tripEndTime ? `<p><strong>End Time:</strong> ${formatDateAndTime(trip.tripEndTime)}</p>` : ''}
            </div>
        </div>
    </div>
    
    <!-- Table Introduction -->
    <div class="table-intro">
        <p>The following table outlines the details of this trip:</p>
    </div>
    
    <!-- Simplified Invoice Table -->
    <div class="invoice-table-container">
        <!-- Main Invoice Table -->
        <table class="invoice-table">
            <thead>
                <tr>
                    <th style="width: 20%;">Base Amount</th>
                    <th style="width: 20%;">Penalty Amount</th>
                    <th style="width: 20%;">Per KM Amount</th>
                    <th style="width: 20%;">Distance</th>
                    <th style="width: 20%;">Trip Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="width: 20%;"><span class="taka-symbol">৳</span>${formatCurrency(baseFare)}</td>
                    <td style="width: 20%;"><span class="taka-symbol">৳</span>${formatCurrency(penaltyFare)}</td>
                    <td style="width: 20%;"><span class="taka-symbol">৳</span>${formatCurrency(perKmFare)}</td>
                    <td style="width: 20%;">${tripDistance}</td>
                    <td style="width: 20%;" class="total-cell"><span class="taka-symbol">৳</span>${formatCurrency(totalAmount)}</td>
                </tr>
            </tbody>
        </table>
        
        <!-- Summary Table -->
        <div class="summary-container">
            <table class="summary-table">
                <tbody>
                    <tr>
                        <td style="width: 50%;">Total</td>
                        <td style="width: 50%;"><span class="taka-symbol">৳</span>${formatCurrency(subtotal)}</td>
                    </tr>
                    <tr>
                        <td class="border-top-none">Vat / Tax</td>
                        <td class="border-top-none"><span class="taka-symbol">৳</span>${formatCurrency(tax)}</td>
                    </tr>
                    <tr>
                        <td class="border-top-none grand-total">GRAND TOTAL</td>
                        <td class="border-top-none grand-total"><span class="taka-symbol">৳</span>${formatCurrency(totalAmount)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Amount in Words and Terms -->
    <div class="terms-section">
        <p class="amount-words">Total Amount (in words): ${totalInWords}</p>
                
        <p class="electronic-notice">This is an electronically generated invoice and does not require a seal or signature.</p>
    </div>
    
    <!-- Footer -->
    <hr class="footer-hr">
    <div class="footer">
        <div class="footer-content">
            <p>ICT Tower, 14th Floor, Plot E-14/X, Agargaon, Sher-e-Bangla Nagar, Dhaka-1207</p>
            <p>Phone: +880 1711 360 170 | Email: info@thegobd.com | Website: www.thegobd.com</p>
        </div>
    </div>
</body>
</html>
  `;
};

export const generateInvoicePDF = async (
  tripTransaction: TripTransaction,
  fileName?: string,
  user?: any
): Promise<string | null> => {
  try {
    if (!tripTransaction.trip) {
      console.error('No trip data available');
      return null;
    }

    console.log('Starting PDF generation...');
    
    const pdfFileName = fileName || `GoBD-${tripTransaction.transactionId}.pdf`;
    const htmlContent = await generateInvoiceHTML(tripTransaction, user);

    console.log('Generating PDF from HTML content...');

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });
    
    console.log('PDF generated at:', uri);

    if (!uri) {
      throw new Error('PDF generation failed - no URI returned');
    }

    // Rename the file to our desired format
    const desiredUri = `${FileSystem.documentDirectory}${pdfFileName}`;
    
    // Move/rename the file
    await FileSystem.moveAsync({
      from: uri,
      to: desiredUri,
    });
    
    console.log('PDF renamed to:', desiredUri);

    // Verify the renamed file exists
    const fileInfo = await FileSystem.getInfoAsync(desiredUri);
    if (!fileInfo.exists) {
      throw new Error('Renamed PDF file does not exist');
    }

    console.log('PDF file verified, size:', fileInfo.size);
    return desiredUri;
  } catch (error) {
    console.error('PDF generation error:', error);
    return null;
  }
};

export const downloadInvoicePDF = async (
  tripTransaction: TripTransaction,
  fileName?: string,
  user?: any
): Promise<boolean> => {
  try {
    console.log('Starting PDF download process...');
    
    const pdfUri = await generateInvoicePDF(tripTransaction, fileName, user);
    
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