import { Bus, Card, Organization, Transaction, Trip, User } from '../types';

// Mock Organizations - Real Bangladeshi institutions
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
    name: 'North South University',
    type: 'institute',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    name: 'BRAC University',
    type: 'institute',
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
    cardNumber: 'GB-7823456012',
    isActive: true,
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
    email: 'rahim.uddin@du.ac.bd'
  },
  {
    id: 2,
    name: 'Fatima Khatun',
    mobile: '01812345679',
    sex: 'female',
    userType: 'passenger',
    cardNumber: 'GB-8901234567',
    isActive: true,
    createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(), // 10 months ago
    email: 'fatima.khatun@du.ac.bd'
  },
  {
    id: 3,
    name: 'Abdul Karim Miah',
    mobile: '01912345680',
    sex: 'male',
    userType: 'passenger',
    cardNumber: 'GB-3456789012',
    isActive: true,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(), // 6.5 months ago
    email: 'abdul.karim@du.ac.bd'
  },
  {
    id: 4,
    name: 'Rashida Begum',
    mobile: '01612345681',
    sex: 'female',
    userType: 'passenger',
    cardNumber: 'GB-9012345678',
    isActive: true,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
    email: 'rashida.begum@du.ac.bd'
  },
  {
    id: 5,
    name: 'Mizanur Rahman',
    mobile: '01512345682',
    sex: 'male',
    userType: 'passenger',
    cardNumber: 'GB-5678901234',
    isActive: true,
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), // 5 months ago
    email: 'mizanur.rahman@du.ac.bd'
  }
];

export const mockUsers: User[] = [...mockStudents];

export const mockCard: Card = {
  id: 1,
  cardNumber: 'GB-7823456012',
  userId: 1,
  balance: 720.00,
  isActive: true,
  createdAt: new Date().toISOString()
};

// Student/Passenger Cards - Realistic Go Bangladesh card numbers
export const mockCards: Card[] = [
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
    userId: 2,
    balance: 450.00,
    isActive: true,
    createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    cardNumber: 'GB-3456789012',
    userId: 3,
    balance: 680.00,
    isActive: true,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    cardNumber: 'GB-9012345678',
    userId: 4,
    balance: 280.00,
    isActive: true,
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    cardNumber: 'GB-5678901234',
    userId: 5,
    balance: 320.00,
    isActive: true,
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock buses
export const mockBuses: Bus[] = [
  {
    id: 1,
    busNumber: 'DU-BUS-001',
    organizationId: 1,
    capacity: 45,
    route: 'Dhaka University - Gulshan',
    isActive: true
  },
  {
    id: 2,
    busNumber: 'DU-BUS-002',
    organizationId: 1,
    capacity: 45,
    route: 'Dhaka University - Uttara',
    isActive: true
  },
  {
    id: 3,
    busNumber: 'BUET-BUS-001',
    organizationId: 2,
    capacity: 40,
    route: 'BUET - Dhanmondi',
    isActive: true
  }
];

// Mock transactions for students
export const mockTransactions: Transaction[] = [
  {
    id: 1,
    cardId: 1,
    transactionType: 'recharge',
    amount: 500.00,
    balanceBefore: 220.00,
    balanceAfter: 720.00,
    description: 'Mobile recharge',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    cardId: 1,
    transactionType: 'fare_deduction',
    amount: -25.00,
    balanceBefore: 745.00,
    balanceAfter: 720.00,
    description: 'Bus fare - DU to Gulshan',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock trips for students
export const mockTrips: Trip[] = [
  {
    id: 1,
    cardId: 1,
    busId: 1,
    tapInTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    tapInLocation: {
      latitude: 23.7285,
      longitude: 90.3918
    },
    tapOutTime: new Date(Date.now() - 23.5 * 60 * 60 * 1000).toISOString(),
    tapOutLocation: {
      latitude: 23.7805,
      longitude: 90.4110
    },
    fareAmount: 25.00,
    distanceKm: 8.5,
    tripStatus: 'completed',
    busNumber: 'DU-BUS-001',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock API functions
export const mockApi = {
  // Authentication
  sendOTP: async (mobile: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const user = mockUsers.find(u => u.mobile === mobile);
        if (user) {
          console.log(`OTP sent to ${mobile}: 123456`);
          resolve();
        } else {
          reject(new Error('Mobile number not found'));
        }
      }, 1000);
    });
  },

  verifyOTP: async (mobile: string, otp: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // For demo purposes, accept 123456 as valid OTP
        resolve(otp === '123456');
      }, 1000);
    });
  },

  login: async (mobile: string, otp: string): Promise<{ user: User; tokens: any }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (otp !== '123456') {
          reject(new Error('Invalid OTP'));
          return;
        }

        const user = mockUsers.find(u => u.mobile === mobile);
        if (user) {
          resolve({
            user: mockUsers[0], // Return first student for demo
            tokens: {
              accessToken: 'mock-access-token',
              refreshToken: 'mock-refresh-token'
            }
          });
        } else {
          reject(new Error('User not found'));
        }
      }, 1000);
    });
  },

  checkCardExists: async (cardNumber: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cardExists = mockCards.some(card => card.cardNumber === cardNumber);
        resolve(cardExists);
      }, 1000);
    });
  },

  registerUser: async (userData: {
    name: string;
    sex: 'male' | 'female';
    mobile: string;
    email?: string;
    cardNumber: string;
  }): Promise<{ user: User; tokens: any }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newUser: User = {
          id: mockUsers.length + 1,
          name: userData.name,
          mobile: userData.mobile,
          email: userData.email,
          sex: userData.sex,
          userType: 'passenger',
          cardNumber: userData.cardNumber,
          isActive: true,
          createdAt: new Date().toISOString()
        };

        // Add to mock data
        mockUsers.push(newUser);

        resolve({
          user: newUser,
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          }
        });
      }, 1500);
    });
  },

  // Card and transaction related
  getCardDetails: async (cardNumber: string): Promise<Card> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const card = mockCards.find(c => c.cardNumber === cardNumber);
        if (card) {
          resolve(card);
        } else {
          reject(new Error('Card not found'));
        }
      }, 1000);
    });
  },

  getTransactionHistory: async (cardId: number): Promise<Transaction[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const transactions = mockTransactions.filter(t => t.cardId === cardId);
        resolve(transactions);
      }, 1000);
    });
  },

  getTripHistory: async (cardId: number): Promise<Trip[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const trips = mockTrips.filter(t => t.cardId === cardId);
        resolve(trips);
      }, 1000);
    });
  }
};
