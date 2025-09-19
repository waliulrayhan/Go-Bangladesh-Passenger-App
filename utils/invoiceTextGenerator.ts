import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
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

export const generateInvoiceText = (tripTransaction: TripTransaction, user?: any): string => {
  if (!tripTransaction.trip) return '';
  
  const trip = tripTransaction.trip;
  const bus = trip.session?.bus;
  const organization = bus?.organization;
  
  // Get user information
  const userName = user?.name || 'N/A';
  const userType = user?.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : 'N/A';
  const userCard = tripTransaction.card?.cardNumber || user?.cardNumber || 'N/A';
  
  // Handle organization properly
  let userOrganization = 'N/A';
  if (user?.organization) {
    if (typeof user.organization === 'string') {
      userOrganization = user.organization;
    } else if (user.organization.name) {
      userOrganization = user.organization.name;
    }
  }
  
  const lines = [
    '==========================================',
    '           GO BANGLADESH',
    '         TRIP RECEIPT',
    '==========================================',
    '',
    'USER INFORMATION',
    '==========================================',
    `Name: ${userName}`,
    `Organization: ${userOrganization}`,
    `User Type: ${userType}`,
    `Card Number: ${userCard}`,
    '',
    'TRIP INFORMATION',
    '==========================================',
    `Transaction ID: ${tripTransaction.transactionId}`,
  ];

  if (bus?.busNumber) {
    lines.push(`Bus Number: ${bus.busNumber}`);
  }

  if (organization?.name) {
    lines.push(`Organization: ${organization.name}`);
  }

  lines.push(
    '',
    'FARE DETAILS',
    '==========================================',
    `Fare Amount: ৳${tripTransaction.amount.toFixed(2)}`,
  );

  if (trip.distance > 0) {
    lines.push(`Distance Traveled: ${trip.distance.toFixed(2)} km`);
  }

  lines.push(
    '',
    'TRIP TIMING',
    '==========================================',
    `Tap In Time: ${trip.tripStartTime ? TimeFormatter.forHistory(trip.tripStartTime) : 'N/A'}`,
  );

  if (trip.tripStartTime) {
    lines.push(`Date: ${formatDate(new Date(trip.tripStartTime))}`);
  }

  if (trip.tripEndTime) {
    lines.push(
      `Tap Out Time: ${TimeFormatter.forHistory(trip.tripEndTime)}`,
      `Date: ${formatDate(new Date(trip.tripEndTime))}`
    );
  }

  lines.push(`Trip Duration: ${getTripDuration(trip.tripStartTime, trip.tripEndTime)}`);

  if (trip.startingLatitude && trip.startingLongitude) {
    lines.push(
      '',
      'TRIP LOCATIONS',
      '==========================================',
      `Boarding Location: ${trip.startingLatitude}, ${trip.startingLongitude}`,
    );

    if (trip.endingLatitude && trip.endingLongitude) {
      lines.push(`Alighting Location: ${trip.endingLatitude}, ${trip.endingLongitude}`);
    }
  }

  lines.push(
    '',
    '==========================================',
    'This is an official digital receipt',
    'for your bus journey.',
    '',
    'For support, please contact',
    'Go Bangladesh customer service.',
    '==========================================',
    '',
    `Generated on: ${formatDate(new Date())}`,
    `Time: ${new Date().toLocaleTimeString()}`,
    '==========================================',
  );

  return lines.join('\n');
};

export const downloadInvoiceAsText = async (
  tripTransaction: TripTransaction,
  user?: any
): Promise<boolean> => {
  try {
    const fileName = `trip-receipt-${tripTransaction.transactionId}.txt`;
    const textContent = generateInvoiceText(tripTransaction, user);
    
    // Create file path
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write the text content to file
    await FileSystem.writeAsStringAsync(filePath, textContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    console.log('Text receipt saved to:', filePath);

    // Share the file
    if (Platform.OS !== 'web') {
      const isShareAvailable = await Sharing.isAvailableAsync();
      
      if (isShareAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/plain',
          dialogTitle: 'Save Trip Receipt',
        });
        return true;
      }
    }

    return true;
  } catch (error) {
    console.error('Error generating text receipt:', error);
    return false;
  }
};