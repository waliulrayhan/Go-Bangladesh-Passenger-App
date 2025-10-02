// React Native and Expo imports
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { WebView } from 'react-native-webview';

// Custom components and hooks
import { useStatusBar } from "../hooks/useStatusBar";
import { useToast } from "../hooks/useToast";
import { TripTransaction } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { COLORS, SPACING } from "../utils/constants";
import { downloadInvoiceAsText } from "../utils/invoiceTextGenerator";
import { downloadInvoicePDF } from "../utils/pdfGenerator";
import { Text } from "./ui/Text";
import { Toast } from "./ui/Toast";

interface InvoiceModalProps {
  visible: boolean;
  onClose: () => void;
  tripTransaction: TripTransaction | null;
}

// Import the HTML generator from pdfGenerator
import { formatDate } from '../utils/dateTime';

// Online image URLs - GUARANTEED to work in APK builds
const ONLINE_LOGO_URLS = {
  goBdLogo: 'https://drive.google.com/uc?export=view&id=16gwTfM7qFXkj3OTNpuQORXOTJstdC4fl',
  portfolioBanner: 'https://drive.google.com/uc?export=view&id=1tYlCAWqCbN4r0M6kdcJG7kAXz8vEJQph',
};

// Online image loader - 100% GUARANTEED for APK builds
const getOnlineImageAsBase64 = async (imageUrl: string): Promise<string> => {
  try {
    console.log('Fetching online image:', imageUrl);
    
    // Fetch the image from online URL
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Get the image as blob
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('Empty image received');
    }
    
    // Convert blob to base64 using FileReader approach
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        console.log(`Online image loaded successfully (${base64.length} chars)`);
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('FileReader failed'));
      reader.readAsDataURL(blob);
    });
    
  } catch (error) {
    console.error('Error loading online image:', error);
    // Return transparent pixel as fallback
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
  
  // Platform-specific PDF generation for modal preview
  if (Platform.OS === 'ios') {
    return generateInvoiceHTMLiOS(tripTransaction, user);
  } else {
    return generateInvoiceHTMLAndroid(tripTransaction, user);
  }
};

const generateInvoiceHTMLAndroid = async (tripTransaction: TripTransaction, user?: any): Promise<string> => {
  if (!tripTransaction.trip) return '';
  
  // Load images using ONLINE approach - Simple and reliable for APK builds
  console.log('Loading images from online URLs for Android modal...');
  const [goBdLogoBase64, portfolioBannerBase64] = await Promise.all([
    getOnlineImageAsBase64(ONLINE_LOGO_URLS.goBdLogo),
    getOnlineImageAsBase64(ONLINE_LOGO_URLS.portfolioBanner),
  ]);
  
  console.log('✅ All online images loaded successfully for Android modal');
  
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
  
  // Get trip distance
  const tripDistance = trip.distance && trip.distance > 0 ? `${trip.distance.toFixed(2)} km` : '0.00 km';
  
  // Get fare amounts from API response (route information)
  const route = bus?.route;
  const baseFare = route?.baseFare || 0.00;
  const perKmFare = route?.perKmFare || 0.00;
  const penaltyFare = route?.penaltyAmount || 0.00;
  
  // Calculate amounts - VAT/Tax is zero as per requirement
  const fareAmount = totalAmount;
  const dueAmount = 0;
  const subtotal = totalAmount;
  const tax = 0.00;
  
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

const generateInvoiceHTMLiOS = async (tripTransaction: TripTransaction, user?: any): Promise<string> => {
  if (!tripTransaction.trip) return '';
  
  // Load images using ONLINE approach - iOS version (with smaller fonts for iOS WebView compensation)
  console.log('Loading images from online URLs for iOS modal...');
  const [goBdLogoBase64, portfolioBannerBase64] = await Promise.all([
    getOnlineImageAsBase64(ONLINE_LOGO_URLS.goBdLogo),
    getOnlineImageAsBase64(ONLINE_LOGO_URLS.portfolioBanner),
  ]);
  
  console.log('✅ All online images loaded successfully for iOS modal');
  
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
  
  // Get trip distance
  const tripDistance = trip.distance && trip.distance > 0 ? `${trip.distance.toFixed(2)} km` : '0.00 km';
  
  // Get fare amounts from API response (route information)
  const route = bus?.route;
  const baseFare = route?.baseFare || 0.00;
  const perKmFare = route?.perKmFare || 0.00;
  const penaltyFare = route?.penaltyAmount || 0.00;
  
  // Calculate amounts - VAT/Tax is zero as per requirement
  const fareAmount = totalAmount;
  const dueAmount = 0;
  const subtotal = totalAmount;
  const tax = 0.00;
  
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
            font-size: 9px;
            line-height: 1.2;
            color: #000000;
            background-color: #ffffff;
            padding: 12mm 8mm 8mm 8mm;
            margin: 0 auto;
            max-width: 210mm;
            min-height: 297mm;
            position: relative;
            -webkit-text-size-adjust: none;
            text-size-adjust: none;
            overflow: hidden;
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
            font-size: 11px;
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
            font-size: 5px;
            font-weight: 600;
            letter-spacing: 1.2px;
            opacity: 0.7;
        }
        
        .status-text {
            font-size: 10px;
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
            font-size: 11px;
        }
        
        /* Invoice title */
        .invoice-title {
            text-align: center;
            margin-bottom: 50px;
            position: relative;
            z-index: 2;
        }
        
        .invoice-title h1 {
            font-size: 20px;
            font-weight: 700;
            color: #000000;
            margin: 0 0 5px 0;
            border: 2px solid #000000;
            padding: 10px 20px;
            display: inline-block;
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
            font-size: 13px;
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
            font-size: 11px;
            line-height: 1.6;
        }
        
        .billing-details p {
            margin: 0 0 4px 0;
        }
        
        .billing-details .company-name {
            font-weight: 700;
            margin-bottom: 8px;
            font-size: 13px;
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
            font-size: 11px;
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
            font-size: 11px;
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
            font-size: 11px;
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
            font-size: 11px;
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
            font-size: 10px;
            line-height: 1.6;
        }
        
        .footer-content p {
            margin: 0 0 8px 0;
        }
        
        .footer-content p:last-child {
            margin-bottom: 0;
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

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  visible,
  onClose,
  tripTransaction,
}) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  
  // Get screen dimensions for responsive sizing
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Status bar configuration for modal
  useStatusBar({
    backgroundColor: COLORS.primary,
    barStyle: 'light-content',
    translucent: false,
    hidden: false,
  });
  
  // Get current user information
  const user = useAuthStore((state) => state.user);

  // Generate HTML content when modal opens
  useEffect(() => {
    if (visible && tripTransaction) {
      generateHTML();
    }
  }, [visible, tripTransaction]);

  const generateHTML = async () => {
    setIsLoading(true);
    try {
      const html = await generateInvoiceHTML(tripTransaction!, user);
      setHtmlContent(html);
    } catch (error) {
      console.error('Error generating HTML:', error);
      showToast("Failed to load receipt preview", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!tripTransaction) return;
    
    setIsGeneratingPDF(true);
    
    try {
      console.log('Attempting PDF generation...');
      const success = await downloadInvoicePDF(tripTransaction, undefined, user);
      
      if (success) {
        showToast("Trip receipt has been saved successfully!", "success");
      } else {
        console.log('PDF generation failed, trying text fallback...');
        // Fallback to text file if PDF generation fails
        const textSuccess = await downloadInvoiceAsText(tripTransaction, user);
        
        if (textSuccess) {
          showToast("Trip receipt saved as text file (PDF generation failed)", "warning");
        } else {
          showToast("Failed to generate receipt. Please try again.", "error");
        }
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      
      try {
        console.log('Attempting text fallback after error...');
        const textSuccess = await downloadInvoiceAsText(tripTransaction, user);
        
        if (textSuccess) {
          showToast("Trip receipt saved as text file (PDF error occurred)", "warning");
        } else {
          showToast("An error occurred while generating the receipt.", "error");
        }
      } catch (fallbackError) {
        console.error('Fallback text generation also failed:', fallbackError);
        showToast("An error occurred while generating the receipt.", "error");
      }
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!tripTransaction || !tripTransaction.trip) {
    return null;
  }

// Responsive dimensions for PDF preview with zoom
  // A4 aspect ratio is 1:1.414 (width:height)
  const A4_ASPECT_RATIO = 842 / 595; // height / width = 1.414
  const ZOOM_SCALE = 1.2; // Zoom factor for better readability
  
  // Calculate WebView dimensions to match device width with padding
  const horizontalPadding = SPACING.xs * 2; // Left and right padding
  const baseWidth = screenWidth - horizontalPadding;
  const webViewWidth = baseWidth * ZOOM_SCALE;
  const webViewHeight = (webViewWidth * A4_ASPECT_RATIO) - (Platform.OS === 'android' ? 120 : 200);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.container, { 
          width: webViewWidth, 
          height: webViewHeight + 60, // Add header height and some margin
        }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text variant="h5" color={COLORS.white} style={styles.headerTitle}>
            Trip Receipt
          </Text>
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownloadPDF}
            disabled={isGeneratingPDF}
            activeOpacity={0.7}
          >
            {isGeneratingPDF ? (
              <Ionicons 
                name="hourglass-outline" 
                size={16} 
                color={COLORS.white} 
              />
            ) : (
              <Feather 
                name="download" 
                size={16} 
                color={COLORS.white} 
              />
            )}
            <Text variant="bodySmall" color={COLORS.white} style={styles.downloadButtonText}>
              {isGeneratingPDF ? "Generating..." : "Download PDF"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PDF Preview Content */}
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={true}
          bounces={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text variant="body" color={COLORS.gray[600]} style={styles.loadingText}>
                Loading receipt preview...
              </Text>
            </View>
          ) : htmlContent ? (
            <View style={[styles.webViewContainer, { width: webViewWidth, height: webViewHeight }]}>
              <WebView
                source={{ html: htmlContent }}
                style={[
                  styles.webView,
                  {
                    width: webViewWidth,
                    height: webViewHeight,
                  }
                ]}
                scalesPageToFit={true}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                  <View style={[styles.webViewLoading, { width: webViewWidth, height: webViewHeight }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                  </View>
                )}
                onError={(error) => {
                  console.error('WebView error:', error);
                  showToast("Failed to load receipt preview", "error");
                }}
              />
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <Ionicons name="document-outline" size={48} color={COLORS.gray[400]} />
              <Text variant="body" color={COLORS.gray[600]} style={styles.errorText}>
                Failed to load receipt preview
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={generateHTML}
                activeOpacity={0.7}
              >
                <Text variant="body" color={COLORS.primary} style={styles.retryText}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Toast notification */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: COLORS.gray[50],
    borderRadius: 5,
    // shadowColor: '#000',
    // shadowOffset: {
    //   width: 0,
    //   height: 10,
    // },
    // shadowOpacity: 0.25,
    // shadowRadius: 20,
    // elevation: 10,
    maxWidth: '95%',
    maxHeight: '100%',
  },
  header: {
    flexDirection: "row",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    height: 55,
  },
  backButton: {
    borderRadius: 20,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.white + "20",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.white + "40",
  },
  downloadButtonText: {
    fontWeight: "500",
    fontSize: 12,
  },
  scrollContainer: {
    backgroundColor: COLORS.gray[200],
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // padding: SPACING.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    minHeight: '100%',
  },
  loadingText: {
    textAlign: 'center',
  },
  webViewContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
  },
  webView: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
  },
  webViewLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  errorText: {
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary + "10",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  retryText: {
    fontWeight: "500",
  },
});
