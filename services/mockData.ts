import { Agent, Bus, Card, Organization, RechargeTransaction, Transaction, Trip, User } from '../types';

// Mock Organizations - Real Bangladeshi institutions and transport companies
export const mockOrganizations: Organization[] = [
  {
    id: 1,
    name: 'University of Dhaka',
    type: 'institute',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Bangladesh University of Engineering and Technology (BUET)',
    type: 'institute',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Green Line Paribahan',
    type: 'company',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    name: 'Shohagh Paribahan',
    type: 'company',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 5,
    name: 'North South University',
    type: 'institute',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 6,
    name: 'BRAC University',
    type: 'institute',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 7,
    name: 'Ena Transport',
    type: 'company',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 8,
    name: 'Hanif Enterprise',
    type: 'company',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Mock Drivers - Realistic Bangladeshi names
export const mockDrivers: User[] = [
  // University of Dhaka drivers
  {
    id: 100,
    name: 'Mohammed Rahman',
    mobile: '01712345001',
    sex: 'male',
    userType: 'driver',
    organizationId: 1,
    isActive: true,
    staffId: 'DU-DRV001',
    createdAt: new Date().toISOString()
  },
  {
    id: 101,
    name: 'Abdul Karim Mollah',
    mobile: '01712345002',
    sex: 'male',
    userType: 'driver',
    organizationId: 1,
    isActive: true,
    staffId: 'DU-DRV002',
    createdAt: new Date().toISOString()
  },
  {
    id: 102,
    name: 'Rafiqul Islam Sheikh',
    mobile: '01712345003',
    sex: 'male',
    userType: 'driver',
    organizationId: 1,
    isActive: true,
    staffId: 'DU-DRV003',
    createdAt: new Date().toISOString()
  },
  // BUET drivers
  {
    id: 103,
    name: 'Shahidul Alam',
    mobile: '01712345004',
    sex: 'male',
    userType: 'driver',
    organizationId: 2,
    isActive: true,
    staffId: 'BUET-DRV001',
    createdAt: new Date().toISOString()
  },
  {
    id: 104,
    name: 'Aminul Haque',
    mobile: '01712345005',
    sex: 'male',
    userType: 'driver',
    organizationId: 2,
    isActive: true,
    staffId: 'BUET-DRV002',
    createdAt: new Date().toISOString()
  },
  // Green Line drivers
  {
    id: 105,
    name: 'Nasir Uddin Khan',
    mobile: '01712345006',
    sex: 'male',
    userType: 'driver',
    organizationId: 3,
    isActive: true,
    staffId: 'GL-DRV001',
    createdAt: new Date().toISOString()
  },
  {
    id: 106,
    name: 'Saiful Islam',
    mobile: '01712345007',
    sex: 'male',
    userType: 'driver',
    organizationId: 3,
    isActive: true,
    staffId: 'GL-DRV002',
    createdAt: new Date().toISOString()
  },
  // Shohagh Paribahan drivers
  {
    id: 107,
    name: 'Mizanur Rahman',
    mobile: '01712345008',
    sex: 'male',
    userType: 'driver',
    organizationId: 4,
    isActive: true,
    staffId: 'SH-DRV001',
    createdAt: new Date().toISOString()
  },
  {
    id: 108,
    name: 'Habibur Rahman',
    mobile: '01712345009',
    sex: 'male',
    userType: 'driver',
    organizationId: 4,
    isActive: true,
    staffId: 'SH-DRV002',
    createdAt: new Date().toISOString()
  }
];

// Mock Helpers - Realistic Bangladeshi names
export const mockHelpers: User[] = [
  // University of Dhaka helpers
  {
    id: 200,
    name: 'Shahid Islam Miah',
    mobile: '01812345001',
    sex: 'male',
    userType: 'helper',
    organizationId: 1,
    staffId: 'DU-HLP001',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 201,
    name: 'Rafiq Ahmed Khan',
    mobile: '01812345002',
    sex: 'male',
    userType: 'helper',
    organizationId: 1,
    staffId: 'DU-HLP002',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 202,
    name: 'Jamal Uddin',
    mobile: '01812345003',
    sex: 'male',
    userType: 'helper',
    organizationId: 1,
    staffId: 'DU-HLP003',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  // BUET helpers
  {
    id: 203,
    name: 'Kamal Hossain',
    mobile: '01812345004',
    sex: 'male',
    userType: 'helper',
    organizationId: 2,
    staffId: 'BUET-HLP001',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 204,
    name: 'Billal Ahmed',
    mobile: '01812345005',
    sex: 'male',
    userType: 'helper',
    organizationId: 2,
    staffId: 'BUET-HLP002',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  // Green Line helpers
  {
    id: 205,
    name: 'Rashed Khan',
    mobile: '01812345006',
    sex: 'male',
    userType: 'helper',
    organizationId: 3,
    staffId: 'GL-HLP001',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 206,
    name: 'Firoz Alam',
    mobile: '01812345007',
    sex: 'male',
    userType: 'helper',
    organizationId: 3,
    staffId: 'GL-HLP002',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  // Shohagh Paribahan helpers
  {
    id: 207,
    name: 'Monir Hossain',
    mobile: '01812345008',
    sex: 'male',
    userType: 'helper',
    organizationId: 4,
    staffId: 'SH-HLP001',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 208,
    name: 'Alamgir Kabir',
    mobile: '01812345009',
    sex: 'male',
    userType: 'helper',
    organizationId: 4,
    staffId: 'SH-HLP002',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Mock Agents
export const mockAgents: Agent[] = [
  {
    id: 300,
    name: 'Nasir Uddin',
    mobile: '01712345005',
    organizationId: 1,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 301,
    name: 'Kamrul Islam',
    mobile: '01712345006',
    organizationId: 1,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 302,
    name: 'Rashed Khan',
    mobile: '01712345007',
    organizationId: 2,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 303,
    name: 'Shakil Ahmed',
    mobile: '01712345008',
    organizationId: 3,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Mock Students/Passengers - Realistic Bangladeshi student names
export const mockStudents: User[] = [
  // University of Dhaka students
  {
    id: 1,
    name: 'Mohammed Rahim Uddin',
    mobile: '01712345678',
    sex: 'male',
    userType: 'passenger',
    organizationId: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
    email: 'rahim.uddin@du.ac.bd'
  },
  {
    id: 401,
    name: 'Fatima Khatun',
    mobile: '01812345679',
    sex: 'female',
    userType: 'passenger',
    organizationId: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(), // 10 months ago
    email: 'fatima.khatun@du.ac.bd'
  },
  {
    id: 402,
    name: 'Abdul Karim Miah',
    mobile: '01912345680',
    sex: 'male',
    userType: 'passenger',
    organizationId: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 6.5 months ago
    email: 'abdul.karim@du.ac.bd'
  },
  {
    id: 403,
    name: 'Rashida Begum',
    mobile: '01612345681',
    sex: 'female',
    userType: 'passenger',
    organizationId: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
    email: 'rashida.begum@du.ac.bd'
  },
  {
    id: 404,
    name: 'Mizanur Rahman',
    mobile: '01512345682',
    sex: 'male',
    userType: 'passenger',
    organizationId: 1,
    isActive: true,
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), // 5 months ago
    email: 'mizanur.rahman@du.ac.bd'
  },
  
  // BUET students
  {
    id: 405,
    name: 'Tahmina Akter',
    mobile: '01712345683',
    sex: 'female',
    userType: 'passenger',
    organizationId: 2,
    isActive: true,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(), // 4 months ago
    email: 'tahmina.akter@buet.ac.bd'
  },
  {
    id: 406,
    name: 'Shahid Hassan',
    mobile: '01812345684',
    sex: 'male',
    userType: 'passenger',
    organizationId: 2,
    isActive: true,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 3.3 months ago
    email: 'shahid.hassan@buet.ac.bd'
  },
  {
    id: 407,
    name: 'Nasreen Sultana',
    mobile: '01912345685',
    sex: 'female',
    userType: 'passenger',
    organizationId: 2,
    isActive: true,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 3 months ago
    email: 'nasreen.sultana@buet.ac.bd'
  },
  
  // North South University students
  {
    id: 408,
    name: 'Sabbir Ahmed',
    mobile: '01612345686',
    sex: 'male',
    userType: 'passenger',
    organizationId: 5,
    isActive: true,
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(), // 2.7 months ago
    email: 'sabbir.ahmed@northsouth.edu'
  },
  {
    id: 409,
    name: 'Ayesha Siddique',
    mobile: '01512345687',
    sex: 'female',
    userType: 'passenger',
    organizationId: 5,
    isActive: true,
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(), // 2.3 months ago
    email: 'ayesha.siddique@northsouth.edu'
  },
  
  // BRAC University students
  {
    id: 410,
    name: 'Rakibul Islam',
    mobile: '01712345688',
    sex: 'male',
    userType: 'passenger',
    organizationId: 6,
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 2 months ago
    email: 'rakibul.islam@bracu.ac.bd'
  },
  {
    id: 411,
    name: 'Salma Khatun',
    mobile: '01812345689',
    sex: 'female',
    userType: 'passenger',
    organizationId: 6,
    isActive: true,
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(), // 1.7 months ago
    email: 'salma.khatun@bracu.ac.bd'
  },
  
  // General public passengers (for public transport)
  {
    id: 412,
    name: 'Jahangir Alam',
    mobile: '01912345690',
    sex: 'male',
    userType: 'passenger',
    organizationId: 3, // Green Line
    isActive: true,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(), // 1.3 months ago
  },
  {
    id: 413,
    name: 'Rehana Khatun',
    mobile: '01612345691',
    sex: 'female',
    userType: 'passenger',
    organizationId: 3, // Green Line
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
  },
  {
    id: 414,
    name: 'Faruk Ahmed',
    mobile: '01512345692',
    sex: 'male',
    userType: 'passenger',
    organizationId: 4, // Shohagh Paribahan
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
  },
  {
    id: 415,
    name: 'Hosne Ara',
    mobile: '01712345693',
    sex: 'female',
    userType: 'passenger',
    organizationId: 4, // Shohagh Paribahan
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
  }
];

// Mock data for development
export const mockUsers: User[] = [
  ...mockStudents,
  ...mockDrivers,
  ...mockHelpers
];

export const mockCard: Card = {
  id: 1,
  cardNumber: 'GB-7823456012',
  userId: 1,
  balance: 720.00, // Updated to reflect recent transactions (745 - 25 from latest trip)
  isActive: true,
  createdAt: new Date().toISOString()
};

// Student/Passenger Cards - Realistic Go Bangladesh card numbers
export const mockCards: Card[] = [
  // University of Dhaka student cards
  {
    id: 1,
    cardNumber: 'GB-7823456012',
    userId: 1,
    balance: 720.00,
    isActive: true,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    cardNumber: 'GB-8901234567',
    userId: 401,
    balance: 450.00,
    isActive: true,
    createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    cardNumber: 'GB-3456789012',
    userId: 402,
    balance: 680.00,
    isActive: true,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    cardNumber: 'GB-9012345678',
    userId: 403,
    balance: 280.00,
    isActive: true,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    cardNumber: 'GB-5678901234',
    userId: 404,
    balance: 850.00,
    isActive: true,
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
  },

  // BUET student cards
  {
    id: 6,
    cardNumber: 'GB-2345678901',
    userId: 405,
    balance: 520.00,
    isActive: true,
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 7,
    cardNumber: 'GB-8901234568',
    userId: 406,
    balance: 390.00,
    isActive: true,
    createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 8,
    cardNumber: 'GB-4561234578',
    userId: 407,
    balance: 640.00,
    isActive: true,
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  },

  // NSU student cards
  {
    id: 9,
    cardNumber: 'GB-7894567890',
    userId: 408,
    balance: 750.00,
    isActive: true,
    createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 10,
    cardNumber: 'GB-1234567890',
    userId: 409,
    balance: 420.00,
    isActive: true,
    createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString()
  },

  // BRAC University student cards
  {
    id: 11,
    cardNumber: 'GB-6789012345',
    userId: 410,
    balance: 580.00,
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 12,
    cardNumber: 'GB-0123456789',
    userId: 411,
    balance: 310.00,
    isActive: true,
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
  },

  // Public transport passenger cards
  {
    id: 13,
    cardNumber: 'GB-9876543210',
    userId: 412,
    balance: 480.00,
    isActive: true,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 14,
    cardNumber: 'GB-5432109876',
    userId: 413,
    balance: 620.00,
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 15,
    cardNumber: 'GB-1098765432',
    userId: 414,
    balance: 290.00,
    isActive: true,
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 16,
    cardNumber: 'GB-8765432109',
    userId: 415,
    balance: 730.00,
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const mockTransactions: Transaction[] = [
  // Mohammed Rahim Uddin's transactions (Card: GB-7823456012)
  {
    id: 1,
    cardId: 1,
    transactionType: 'recharge',
    amount: 500,
    balanceBefore: 0,
    balanceAfter: 500,
    description: 'Card Recharge via bKash',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    id: 2,
    cardId: 1,
    transactionType: 'fare_deduction',
    amount: -25,
    balanceBefore: 500,
    balanceAfter: 475,
    description: 'Bus Fare - Curzon Hall to TSC',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
  },
  {
    id: 3,
    cardId: 1,
    transactionType: 'recharge',
    amount: 200,
    balanceBefore: 475,
    balanceAfter: 675,
    description: 'Card Recharge via Agent',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: 4,
    cardId: 1,
    transactionType: 'fare_deduction',
    amount: -30,
    balanceBefore: 675,
    balanceAfter: 645,
    description: 'Bus Fare - Nilkhet to Shahbagh',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: 5,
    cardId: 1,
    transactionType: 'recharge',
    amount: 100,
    balanceBefore: 645,
    balanceAfter: 745,
    description: 'Card Recharge via Nagad',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
  },

  // Fatima Khatun's transactions (Card: GB-8901234567)
  {
    id: 6,
    cardId: 2,
    transactionType: 'recharge',
    amount: 300,
    balanceBefore: 150,
    balanceAfter: 450,
    description: 'Card Recharge via Rocket',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
  },
  {
    id: 7,
    cardId: 2,
    transactionType: 'fare_deduction',
    amount: -20,
    balanceBefore: 450,
    balanceAfter: 430,
    description: 'Bus Fare - DU Campus to Dhanmondi',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
  },

  // Abdul Karim's transactions (Card: GB-3456789012)
  {
    id: 8,
    cardId: 3,
    transactionType: 'recharge',
    amount: 500,
    balanceBefore: 180,
    balanceAfter: 680,
    description: 'Card Recharge via Agent',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: 9,
    cardId: 3,
    transactionType: 'fare_deduction',
    amount: -35,
    balanceBefore: 680,
    balanceAfter: 645,
    description: 'Bus Fare - Shahbagh to New Market',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
  },

  // Tahmina Akter's transactions (BUET student - Card: GB-2345678901)
  {
    id: 10,
    cardId: 6,
    transactionType: 'recharge',
    amount: 400,
    balanceBefore: 120,
    balanceAfter: 520,
    description: 'Card Recharge via bKash',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
  },
  {
    id: 11,
    cardId: 6,
    transactionType: 'fare_deduction',
    amount: -25,
    balanceBefore: 520,
    balanceAfter: 495,
    description: 'Bus Fare - BUET Gate to Palashi',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() // 8 hours ago
  },

  // Public transport users
  {
    id: 12,
    cardId: 13,
    transactionType: 'recharge',
    amount: 200,
    balanceBefore: 280,
    balanceAfter: 480,
    description: 'Card Recharge via Cash',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: 13,
    cardId: 13,
    transactionType: 'fare_deduction',
    amount: -40,
    balanceBefore: 480,
    balanceAfter: 440,
    description: 'Bus Fare - Motijheel to Gulistan',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
  },

  // More student transactions
  {
    id: 14,
    cardId: 9,
    transactionType: 'recharge',
    amount: 600,
    balanceBefore: 150,
    balanceAfter: 750,
    description: 'Card Recharge via Nagad',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
  },
  {
    id: 15,
    cardId: 9,
    transactionType: 'fare_deduction',
    amount: -30,
    balanceBefore: 750,
    balanceAfter: 720,
    description: 'Bus Fare - NSU Campus to Bashundhara',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
  }
];

export const mockTrips: Trip[] = [
  {
    id: 1,
    cardId: 1,
    busId: 1,
    tapInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    tapInLocation: {
      latitude: 23.8103,
      longitude: 90.4125
    },
    tapOutTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), // 1.5 hours ago
    tapOutLocation: {
      latitude: 23.7765,
      longitude: 90.3950
    },
    fareAmount: 25,
    distanceKm: 5.2,
    tripStatus: 'completed',
    busNumber: 'DH-11-1234',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    cardId: 1,
    busId: 2,
    tapInTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    tapInLocation: {
      latitude: 23.7465,
      longitude: 90.3763
    },
    tapOutTime: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(), // 23.5 hours ago
    tapOutLocation: {
      latitude: 23.8103,
      longitude: 90.4125
    },
    fareAmount: 30,
    distanceKm: 8.1,
    tripStatus: 'completed',
    busNumber: 'DH-11-5678',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

export const mockBuses: Bus[] = [
  // University of Dhaka buses
  {
    id: 1,
    busNumber: 'DH-11-1234',
    organizationId: 1,
    capacity: 50,
    route: 'Curzon Hall - TSC - Science Library',
    isActive: true
  },
  {
    id: 2,
    busNumber: 'DH-11-5678',
    organizationId: 1,
    capacity: 45,
    route: 'Nilkhet - DU Campus - Shahbagh',
    isActive: true
  },
  {
    id: 3,
    busNumber: 'DH-11-9012',
    organizationId: 1,
    capacity: 48,
    route: 'Dhanmondi - Arts Faculty - Library',
    isActive: true
  },
  // BUET buses
  {
    id: 4,
    busNumber: 'DH-12-3456',
    organizationId: 2,
    capacity: 45,
    route: 'BUET Gate - Academic Building - Hostel',
    isActive: true
  },
  {
    id: 5,
    busNumber: 'DH-12-7890',
    organizationId: 2,
    capacity: 42,
    route: 'Palashi - BUET Campus - ECE Building',
    isActive: true
  },
  // Green Line Paribahan
  {
    id: 6,
    busNumber: 'GL-01-1111',
    organizationId: 3,
    capacity: 55,
    route: 'Motijheel - Gulistan - Sadarghat',
    isActive: true
  },
  {
    id: 7,
    busNumber: 'GL-01-2222',
    organizationId: 3,
    capacity: 58,
    route: 'Dhanmondi - New Market - Azimpur',
    isActive: true
  },
  {
    id: 8,
    busNumber: 'GL-01-3333',
    organizationId: 3,
    capacity: 52,
    route: 'Farmgate - Tejgaon - Mohakhali',
    isActive: true
  },
  // Shohagh Paribahan
  {
    id: 9,
    busNumber: 'SH-02-4444',
    organizationId: 4,
    capacity: 48,
    route: 'Uttara - Airport - Banani',
    isActive: true
  },
  {
    id: 10,
    busNumber: 'SH-02-5555',
    organizationId: 4,
    capacity: 50,
    route: 'Mirpur - Kalyanpur - Savar',
    isActive: true
  },
  // North South University
  {
    id: 11,
    busNumber: 'NS-03-6666',
    organizationId: 5,
    capacity: 40,
    route: 'NSU Campus - Bashundhara - Gulshan',
    isActive: true
  },
  {
    id: 12,
    busNumber: 'NS-03-7777',
    organizationId: 5,
    capacity: 38,
    route: 'Baridhara - NSU Main Building - Library',
    isActive: true
  },
  // BRAC University
  {
    id: 13,
    busNumber: 'BR-04-8888',
    organizationId: 6,
    capacity: 42,
    route: 'BRAC U Campus - Mohakhali - Tejgaon',
    isActive: true
  },
  {
    id: 14,
    busNumber: 'BR-04-9999',
    organizationId: 6,
    capacity: 45,
    route: 'Badda - BRAC University - Rampura',
    isActive: true
  },
  // Ena Transport
  {
    id: 15,
    busNumber: 'EN-05-1010',
    organizationId: 7,
    capacity: 55,
    route: 'Gabtoli - Savar - Manikganj',
    isActive: true
  },
  {
    id: 16,
    busNumber: 'EN-05-2020',
    organizationId: 7,
    capacity: 60,
    route: 'Dhaka - Tangail - Mymensingh',
    isActive: true
  },
  // Hanif Enterprise
  {
    id: 17,
    busNumber: 'HN-06-3030',
    organizationId: 8,
    capacity: 52,
    route: 'Dhaka - Comilla - Chittagong',
    isActive: true
  },
  {
    id: 18,
    busNumber: 'HN-06-4040',
    organizationId: 8,
    capacity: 48,
    route: 'Gazipur - Tongi - Airport',
    isActive: true
  }
];

// Mock Recharge Transactions
export const mockRechargeTransactions: RechargeTransaction[] = [
  // Today's transactions for Agent 300 (Nasir Uddin)
  {
    id: 1,
    cardNumber: 'GB-7823456012',
    amount: 500,
    agentId: 300,
    agentName: 'Nasir Uddin',
    balanceBefore: 720,
    balanceAfter: 1220,
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
  },
  {
    id: 2,
    cardNumber: 'GB-8901234567',
    amount: 200,
    agentId: 300,
    agentName: 'Nasir Uddin',
    balanceBefore: 150,
    balanceAfter: 350,
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
  },
  {
    id: 3,
    cardNumber: 'GB-3456789012',
    amount: 1000,
    agentId: 300,
    agentName: 'Nasir Uddin',
    balanceBefore: 50,
    balanceAfter: 1050,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
  },
  
  // Today's transactions for Agent 301 (Kamrul Islam)
  {
    id: 4,
    cardNumber: 'GB-9012345678',
    amount: 300,
    agentId: 301,
    agentName: 'Kamrul Islam',
    balanceBefore: 80,
    balanceAfter: 380,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: 5,
    cardNumber: 'GB-5678901234',
    amount: 500,
    agentId: 301,
    agentName: 'Kamrul Islam',
    balanceBefore: 200,
    balanceAfter: 700,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: 6,
    cardNumber: 'GB-2345678901',
    amount: 100,
    agentId: 301,
    agentName: 'Kamrul Islam',
    balanceBefore: 45,
    balanceAfter: 145,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
  },

  // Today's transactions for Agent 302 (Rashed Khan)
  {
    id: 7,
    cardNumber: 'GB-8901234568',
    amount: 200,
    agentId: 302,
    agentName: 'Rashed Khan',
    balanceBefore: 120,
    balanceAfter: 320,
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
  },
  {
    id: 8,
    cardNumber: 'GB-4561234578',
    amount: 500,
    agentId: 302,
    agentName: 'Rashed Khan',
    balanceBefore: 75,
    balanceAfter: 575,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },

  // Today's transactions for Agent 303 (Shakil Ahmed)
  {
    id: 9,
    cardNumber: 'GB-7894567890',
    amount: 300,
    agentId: 303,
    agentName: 'Shakil Ahmed',
    balanceBefore: 90,
    balanceAfter: 390,
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
  },
  {
    id: 10,
    cardNumber: 'CARD123789',
    amount: 1000,
    agentId: 303,
    agentName: 'Shakil Ahmed',
    balanceBefore: 150,
    balanceAfter: 1150,
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7 hours ago
  },

  // Yesterday's transactions for various agents
  {
    id: 11,
    cardNumber: 'CARD654321',
    amount: 400,
    agentId: 300,
    agentName: 'Nasir Uddin',
    balanceBefore: 100,
    balanceAfter: 500,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 12,
    cardNumber: 'CARD987654',
    amount: 250,
    agentId: 301,
    agentName: 'Kamrul Islam',
    balanceBefore: 60,
    balanceAfter: 310,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(), // 1 day 2 hours ago
  },
  {
    id: 13,
    cardNumber: 'CARD147258',
    amount: 600,
    agentId: 302,
    agentName: 'Rashed Khan',
    balanceBefore: 80,
    balanceAfter: 680,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(), // 1 day 4 hours ago
  }
];

// Valid card numbers present in the system - Go Bangladesh format
export const validCardNumbers: string[] = [
  // Student/Passenger cards
  'GB-7823456012', // Mohammed Rahim Uddin (DU)
  'GB-8901234567', // Fatima Khatun (DU)
  'GB-3456789012', // Abdul Karim Miah (DU)
  'GB-9012345678', // Rashida Begum (DU)
  'GB-5678901234', // Mizanur Rahman (DU)
  'GB-2345678901', // Tahmina Akter (BUET)
  'GB-8901234568', // Shahid Hassan (BUET)
  'GB-4561234578', // Nasreen Sultana (BUET)
  'GB-7894567890', // Sabbir Ahmed (NSU)
  'GB-1234567890', // Ayesha Siddique (NSU)
  'GB-6789012345', // Rakibul Islam (BRAC)
  'GB-0123456789', // Salma Khatun (BRAC)
  'GB-9876543210', // Jahangir Alam (Public)
  'GB-5432109876', // Rehana Khatun (Public)
  'GB-1098765432', // Faruk Ahmed (Public)
  'GB-8765432109', // Hosne Ara (Public)
  
  // Legacy card numbers for backward compatibility
  'CARD123456', // Primary test card
  'CARD789012', 'CARD345678', 'CARD901234', 'CARD567890',
  'CARD234567', 'CARD890123', 'CARD456123', 'CARD789456',
  'CARD123789', 'CARD654321', 'CARD987654', 'CARD147258',
  
  // Real NFC cards detected on Sunmi V3 device
  '0127D507AE5C8895', // NfcF card detected on device
  'A7A159E4',         // NfcA/MifareClassic card detected on device
  '471E5DE4',         // NfcA/MifareClassic card detected on device
  '0217261E',         // NfcA/MifareClassic card detected on device
];

// Mock API functions for development
export const mockApi = {
  login: async (mobile: string, otp: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
    if (otp === '123456') {
      // Find user by mobile number
      const user = mockUsers.find(u => u.mobile === mobile);
      if (user) {
        return {
          user,
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          }
        };
      }
      return {
        user: mockUsers[0],
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      };
    }
    throw new Error('Invalid OTP');
  },

  // Staff lookup function
  getStaffByIdentifier: async (identifier: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if identifier is a mobile number
    const phoneRegex = /^(\+?88)?01[3-9]\d{8}$/;
    
    let staff = null;
    
    if (phoneRegex.test(identifier)) {
      // Search by mobile number
      staff = [...mockDrivers, ...mockHelpers].find(user => user.mobile === identifier);
    } else {
      // Search by staff ID
      staff = [...mockDrivers, ...mockHelpers].find(user => user.staffId === identifier);
    }

    if (staff) {
      return {
        found: true,
        staff,
        mobileNumber: staff.mobile
      };
    }

    return {
      found: false,
      staff: null,
      mobileNumber: null
    };
  },

  // Organization APIs
  getOrganizations: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockOrganizations;
  },

  // Bus APIs
  getBusesByOrganization: async (organizationId: number) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockBuses.filter(bus => bus.organizationId === organizationId);
  },

  // Driver/Helper APIs
  getDriversByOrganization: async (organizationId: number) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockDrivers.filter(driver => driver.organizationId === organizationId);
  },

  getHelpersByOrganization: async (organizationId: number) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockHelpers.filter(helper => helper.organizationId === organizationId);
  },

  // Tap Operations
  tapInCard: async (cardNumber: string, busId: number, operatorId: number) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if card exists in valid cards
    if (!validCardNumbers.includes(cardNumber)) {
      throw new Error('Card not found');
    }
    
    // Get card details
    let cardDetails;
    if (cardNumber === mockCard.cardNumber) {
      const student = mockStudents.find(s => s.id === mockCard.userId);
      cardDetails = {
        ...mockCard,
        passengerName: student?.name || 'Mohammed Rahim Uddin'
      };
    } else {
      // Check if it's a student card
      const card = mockCards.find(c => c.cardNumber === cardNumber);
      if (card) {
        const student = mockStudents.find(s => s.id === card.userId);
        cardDetails = {
          ...card,
          passengerName: student?.name || 'Student'
        };
      } else {
        // Legacy card
        const cardIndex = validCardNumbers.indexOf(cardNumber);
        const mockBalances = [750, 320, 450, 680, 220, 890, 150, 560, 340, 720, 480, 630, 290, 10, -50, -80, 5, 800, 420, 680, 15, 720, 25, 30, -90]; // Added low balance cards
        cardDetails = {
          id: cardIndex + 100,
          cardNumber,
          userId: cardIndex + 500,
          balance: mockBalances[cardIndex % mockBalances.length] || 500,
          isActive: true,
          createdAt: new Date().toISOString(),
          passengerName: `Passenger ${cardIndex + 1}`
        };
      }
    }
    
    // Check if card has sufficient balance (minimum 20 BDT) but don't deduct
    if (cardDetails.balance < 20) {
      throw new Error('Insufficient balance. Minimum 20 BDT required for Tap In.');
    }

    // Generate mock location data for Dhaka
    const tapInLocations = [
      { name: 'Dhanmondi 27', latitude: 23.7475, longitude: 90.3758 },
      { name: 'Shahbag', latitude: 23.7389, longitude: 90.3944 },
      { name: 'TSC', latitude: 23.7368, longitude: 90.3933 },
      { name: 'Nilkhet', latitude: 23.7294, longitude: 90.3914 },
      { name: 'Curzon Hall', latitude: 23.7308, longitude: 90.3936 },
      { name: 'BUET Gate', latitude: 23.7263, longitude: 90.3918 },
      { name: 'NSU Campus', latitude: 23.8145, longitude: 90.4250 }
    ];
    const randomLocation = tapInLocations[Math.floor(Math.random() * tapInLocations.length)];

    return {
      success: true,
      message: 'Tap In successful',
      cardNumber: cardNumber,
      passengerName: cardDetails.passengerName,
      fareAmount: 0, // No fare deduction on tap in
      newBalance: cardDetails.balance, // Balance remains same
      timestamp: new Date().toISOString(),
      location: randomLocation
    };
  },

  tapOutCard: async (cardNumber: string, busId: number, operatorId: number, fareAmount: number) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if card exists in valid cards
    if (!validCardNumbers.includes(cardNumber)) {
      throw new Error('Card not found');
    }
    
    // Get card details (avoiding circular call)
    let cardDetails;
    if (cardNumber === mockCard.cardNumber) {
      cardDetails = {
        ...mockCard,
        passengerName: 'John Doe'
      };
    } else {
      // For other valid cards, use mock data
      const cardIndex = validCardNumbers.indexOf(cardNumber);
      const mockBalances = [750, 320, 450, 680, 220, 890, 150, 560, 340, 720, 480, 630, 290, 10, -50, -80, 5, 800, 420, 680, 15, 720, 25, 30, -90]; // Added low balance cards
      cardDetails = {
        id: cardIndex + 2,
        cardNumber,
        userId: cardIndex + 10,
        balance: mockBalances[cardIndex] || 500, // Use index directly for consistent results
        isActive: true,
        createdAt: new Date().toISOString(),
        passengerName: `Passenger ${cardIndex + 1}`
      };
    }
    
    // Check if there's sufficient balance (allow negative for overdraft, but show error if too low)
    const newBalance = cardDetails.balance - fareAmount;
    
    // If balance would go below -100 BDT, throw insufficient balance error
    if (newBalance < -100) {
      throw new Error('Payment failed due to insufficient balance');
    }
    
    // Update the main mock card if it matches, otherwise just calculate for display
    if (cardNumber === mockCard.cardNumber) {
      mockCard.balance = newBalance;
    }

    // Generate mock location data
    const tapOutLocations = [
      { name: 'New Market', latitude: 23.7340, longitude: 90.3916 },
      { name: 'Azimpur', latitude: 23.7256, longitude: 90.3882 },
      { name: 'Elephant Road', latitude: 23.7390, longitude: 90.3847 },
      { name: 'Paltan', latitude: 23.7357, longitude: 90.4125 },
      { name: 'Motijheel', latitude: 23.7329, longitude: 90.4172 }
    ];
    const randomLocation = tapOutLocations[Math.floor(Math.random() * tapOutLocations.length)];

    return {
      success: true,
      message: 'Tap Out successful',
      cardNumber: cardNumber,
      passengerName: cardDetails.passengerName,
      fareAmount: fareAmount,
      newBalance: newBalance,
      timestamp: new Date().toISOString(),
      location: randomLocation
    };
  },

  // Check card details
  getCardDetails: async (cardNumber: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if card number exists in our valid cards list
    if (!validCardNumbers.includes(cardNumber)) {
      throw new Error('Card not found');
    }
    
    // For the main mock card, return its details
    if (cardNumber === mockCard.cardNumber) {
      const student = mockStudents.find(s => s.id === mockCard.userId);
      return {
        ...mockCard,
        passengerName: student?.name || 'Mohammed Rahim Uddin'
      };
    }
    
    // For other student cards, find the matching card and student
    const card = mockCards.find(c => c.cardNumber === cardNumber);
    if (card) {
      const student = mockStudents.find(s => s.id === card.userId);
      return {
        ...card,
        passengerName: student?.name || 'Student'
      };
    }
    
    // For legacy cards, return mock data
    const cardIndex = validCardNumbers.indexOf(cardNumber);
    const mockBalances = [750, 320, 450, 680, 220, 890, 150, 560, 340, 720, 480, 630, 290, 10, -50, -80, 5, 800, 420, 680, 15, 720, 25, 30, -90]; // Added low balance cards
    
    return {
      id: cardIndex + 100, // Avoid conflicts with student card IDs
      cardNumber,
      userId: cardIndex + 500, // Mock user IDs for legacy
      balance: mockBalances[cardIndex % mockBalances.length] || 500,
      isActive: true,
      createdAt: new Date().toISOString(),
      passengerName: `Passenger ${cardIndex + 1}` // Generate passenger names
    };
  },

  sendOTP: async (mobile: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, message: 'OTP sent successfully' };
  },


  getTransactions: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTransactions;
  },

  getTrips: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockTrips;
  },

  getBuses: async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockBuses;
  },

  tapIn: async (cardNumber: string, busId: number) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      message: 'Tap in successful',
      newBalance: mockCard.balance - 20
    };
  },

  tapOut: async (cardNumber: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      message: 'Tap out successful',
      newBalance: mockCard.balance
    };
  },
  recharge: async (cardNumber: string, amount: number) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      id: Date.now(),
      cardId: 1,
      transactionType: 'recharge' as const,
      amount,
      balanceBefore: mockCard.balance,
      balanceAfter: mockCard.balance + amount,
      description: 'Card recharge',
      createdAt: new Date().toISOString()
    };
  },

  checkCardExists: async (cardNumber: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    // Check if card exists in our valid cards list
    return validCardNumbers.includes(cardNumber);
  },

  registerUser: async (userData: {
    name: string;
    sex: 'male' | 'female';
    mobile: string;
    email?: string;
    cardNumber: string;
  }) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const newUser: User = {
      id: Date.now(),
      name: userData.name,
      mobile: userData.mobile,
      sex: userData.sex,
      userType: 'passenger',
      isActive: true,
      createdAt: new Date().toISOString(),
      email: userData.email
    };

    // Add user to mock data
    mockUsers.push(newUser);
    
    // Create associated card
    const newCard: Card = {
      id: Date.now(),
      cardNumber: userData.cardNumber,
      userId: newUser.id,
      balance: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    return {
      user: newUser,
      card: newCard,
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    };
  },

  verifyOTP: async (mobile: string, otp: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Mock verification - accept 123456 or 000000 as valid OTPs
    return otp === '123456' || otp === '000000';
  },

  // Agent APIs
  getAgentsByOrganization: async (organizationId: number) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockAgents.filter(agent => agent.organizationId === organizationId);
  },

  rechargeCard: async (cardNumber: string, amount: number, agentId: number) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Find agent
    const agent = mockAgents.find(a => a.id === agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Check if card exists using validCardNumbers array
    if (!validCardNumbers.includes(cardNumber)) {
      throw new Error('Card not found');
    }

    // Find the card in mockCards array or use mockCard
    let targetCard = mockCards.find(c => c.cardNumber === cardNumber);
    if (!targetCard && cardNumber === mockCard.cardNumber) {
      targetCard = mockCard;
    }
    
    // For legacy cards not in mockCards, create virtual card data
    if (!targetCard) {
      const cardIndex = validCardNumbers.indexOf(cardNumber);
      const mockBalances = [750, 320, 450, 680, 220, 890, 150, 560, 340, 720, 480, 630, 290];
      targetCard = {
        id: cardIndex + 100,
        cardNumber,
        userId: cardIndex + 500,
        balance: mockBalances[cardIndex % mockBalances.length] || 500,
        isActive: true,
        createdAt: new Date().toISOString()
      };
    }

    const balanceBefore = targetCard.balance;
    const balanceAfter = balanceBefore + amount;
    
    // Update card balance
    targetCard.balance = balanceAfter;

    // Create recharge transaction
    const rechargeTransaction: RechargeTransaction = {
      id: Date.now(),
      cardNumber,
      amount,
      agentId,
      agentName: agent.name,
      balanceBefore,
      balanceAfter,
      timestamp: new Date().toISOString()
    };

    // Add to recharge transactions
    mockRechargeTransactions.unshift(rechargeTransaction);

    // Also add to general transactions
    const transaction: Transaction = {
      id: Date.now() + 1,
      cardId: mockCard.id,
      transactionType: 'recharge',
      amount,
      balanceBefore,
      balanceAfter,
      agentId,
      description: `Recharge via Agent - ${agent.name}`,
      createdAt: new Date().toISOString()
    };

    mockTransactions.unshift(transaction);

    return {
      success: true,
      transaction: rechargeTransaction,
      newBalance: balanceAfter
    };
  },

  getRechargeTransactions: async (agentId?: number) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (agentId) {
      return mockRechargeTransactions.filter(t => t.agentId === agentId);
    }
    return mockRechargeTransactions;
  }
};
