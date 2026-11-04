import { AgencyInfo, Customer, CylinderPricing, DefectiveLog, Expense, GodownLocation, GodownStock, OfficeStock, StaffUser, Transaction } from '../types/lpg';

export const DEMO_AGENCY_INFO: AgencyInfo = {
  agencyName: 'Shree Ganesh Gas Agency',
  agencySubtitle: 'Authorized Indane LPG Distributor',
  omcName: 'INDANE',
  distributorCode: '1120498',
  gstin: '07AAAAA0000A1Z5',
  address: 'Main Godown, Industrial Area, Sector 4, New Delhi - 110020',
  phone: '+91 98765 43210',
  emergencyNo: '1906'
};

export const INITIAL_PRICING: CylinderPricing[] = [
  {
    cylinderType: '14.2KG',
    title: '14.2 KG Domestic',
    subtitle: 'Domestic Household Refill',
    refillPrice: 803.0,
    purchasePrice: 765.0,
    depositPrice: 2200.0,
    weightKg: 14.2,
    color: '#E63946'
  },
  {
    cylinderType: '19KG',
    title: '19 KG Commercial',
    subtitle: 'Commercial (Hotel & Restaurant)',
    refillPrice: 1780.0,
    purchasePrice: 1650.0,
    depositPrice: 3500.0,
    weightKg: 19.0,
    color: '#1D3557'
  },
  {
    cylinderType: '5KG',
    title: '5 KG Chhotu',
    subtitle: 'Portable Mini Refill',
    refillPrice: 340.0,
    purchasePrice: 310.0,
    depositPrice: 1100.0,
    weightKg: 5.0,
    color: '#FF6B00'
  }
];

export const INITIAL_GODOWNS: GodownLocation[] = [
  {
    id: 'godown-main',
    name: 'Sector 4 Main Godown',
    location: 'Plot 12, Industrial Area, Sector 4',
    capacityCylinders: 1500,
    isPrimary: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'godown-depot-rural',
    name: 'Rural Depot West',
    location: 'Village Badli Highway Depot',
    capacityCylinders: 600,
    isPrimary: false,
    createdAt: '2024-06-15T00:00:00Z'
  }
];

export const INITIAL_GODOWN_STOCK: GodownStock = {
  '14.2KG': { full: 450, empty: 210, defective: 6 },
  '19KG': { full: 120, empty: 45, defective: 2 },
  '5KG': { full: 85, empty: 30, defective: 1 },
  godownId: 'godown-main',
  godownName: 'Sector 4 Main Godown',
  lastUpdated: new Date().toISOString()
};

export const INITIAL_OFFICE_STOCK: OfficeStock = {
  '14.2KG': { full: 40, empty: 15, defective: 1 },
  '19KG': { full: 10, empty: 5, defective: 0 },
  '5KG': { full: 15, empty: 8, defective: 0 },
  cashInHand: 12500,
  upiInHand: 8400,
  lastUpdated: new Date().toISOString()
};

export const INITIAL_STAFF: StaffUser[] = [
  {
    id: 'staff-1',
    name: 'Vikas Sharma',
    phone: '+91 98111 22334',
    vehicleNo: 'DL 1L P 4482',
    vehicleType: 'Tata Ace Delivery Van',
    role: 'STAFF',
    pinHash: '1234',
    active: true,
    stock: {
      '14.2KG': { full: 28, empty: 14, defective: 0 },
      '19KG': { full: 4, empty: 2, defective: 0 },
      '5KG': { full: 5, empty: 2, defective: 0 }
    },
    cashInHand: 14454,
    upiInHand: 8030
  },
  {
    id: 'staff-2',
    name: 'Raju Singh',
    phone: '+91 98223 45678',
    vehicleNo: 'DL 4C R 1109',
    vehicleType: 'Electric Cargo Rickshaw',
    role: 'STAFF',
    pinHash: '5678',
    active: true,
    stock: {
      '14.2KG': { full: 16, empty: 12, defective: 0 },
      '19KG': { full: 0, empty: 0, defective: 0 },
      '5KG': { full: 8, empty: 4, defective: 0 }
    },
    cashInHand: 9636,
    upiInHand: 4818
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-101',
    consumerNo: 'IND-908122',
    name: 'Sunita Devi',
    mobile: '98711 00112',
    address: 'H.No 45, Gali No. 3, Ramesh Nagar',
    type: 'DOMESTIC',
    cylinderDues: { '14.2KG': 0, '19KG': 0, '5KG': 0 },
    paymentDue: 0,
    connectionDate: '2023-04-12'
  },
  {
    id: 'cust-102',
    consumerNo: 'IND-COM-001',
    name: 'Gurpreet Singh',
    firmName: 'Dhaba Royale & Tandoor',
    gstin: '07ABCPG1122D1Z8',
    mobile: '98122 33445',
    address: 'Shop 12-14, Highway Market, Sector 15',
    type: 'COMMERCIAL',
    securityDepositsHeld: 14000,
    cylinderDues: { '14.2KG': 0, '19KG': 2, '5KG': 0 },
    paymentDue: 3560,
    connectionDate: '2022-09-01'
  }
];

export const INITIAL_DEFECTIVES: DefectiveLog[] = [
  {
    id: 'DEF-8812',
    cylinderType: '14.2KG',
    defectType: 'PIN_LEAK',
    cylinderSerialNo: 'IN-22-90881',
    source: 'VAN_DELIVERY',
    reportedBy: 'staff-1',
    reportedByName: 'Vikas Sharma',
    timestamp: new Date().toISOString(),
    status: 'QUARANTINED',
    notes: 'Severe O-ring spindle leak reported during customer delivery'
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'EXP-101',
    category: 'DIESEL',
    title: 'Van #01 Diesel Refuel (40 Liters)',
    amount: 3600,
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'UPI',
    recordedBy: 'admin-sachin',
    recordedByName: 'Sachin Kumar (Admin)'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TXN-INW-001',
    txnType: 'SUPPLIER_INWARD',
    timestamp: new Date().toISOString(),
    userId: 'admin-sachin',
    userName: 'Sachin Kumar (Admin)',
    userRole: 'ADMIN',
    cylinderType: '14.2KG',
    quantity: 300,
    emptyReturned: 300,
    unitPrice: 765,
    totalAmount: 229500,
    paymentMode: 'NA',
    paymentStatus: 'PAID',
    paidAmount: 229500,
    balanceDue: 0,
    notes: 'Bottling Plant Tanker Inward Receiving'
  }
];
