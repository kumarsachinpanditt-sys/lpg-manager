/**
 * LPG Manager - Professional Gas Agency Data Types & Enums
 */

export type Role = 'ADMIN' | 'STAFF';

export type CylinderType = '14.2KG' | '19KG' | '5KG';

export type TransactionType =
  | 'SUPPLIER_INWARD'          // Plant to Godown
  | 'GODOWN_TO_STAFF'          // Godown to Staff Van
  | 'GODOWN_TO_OFFICE'         // Godown to Agency Office / Showroom Counter
  | 'OFFICE_TO_GODOWN'         // Office Counter Empties/Defectives to Godown
  | 'STAFF_TO_CUSTOMER'        // Staff to Customer Delivery
  | 'CUSTOMER_EMPTY_RETURN'    // Customer returns empty
  | 'STAFF_DAY_END_RETURN'     // Staff deposits to Godown
  | 'PAYMENT_COLLECTION'       // Settling pending cash/UPI
  | 'DEFECTIVE_LOG'            // Log defective/leaking cylinder
  | 'DEFECTIVE_PLANT_DISPATCH' // Sent defective to bottling plant
  | 'ADMIN_REVERSAL'           // Auditable reversal entry
  | 'GODOWN_CREATE'            // Registered new godown facility
  | 'STAFF_CREATE';            // Created delivery staff profile

export type PaymentMode = 'CASH' | 'UPI' | 'CREDIT' | 'NA';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'DUE' | 'NA';
export type CustomerType = 'DOMESTIC' | 'COMMERCIAL';

export type DefectType =
  | 'PIN_LEAK'            // Pin leakage / Valve O-ring failure
  | 'VALVE_DEFECT'         // Valve thread defect / jammed spindle
  | 'O_RING_DAMAGE'        // Damaged rubber O-ring causing regulator leak
  | 'BODY_DENT_LEAK'       // Body wall dent / bottom ring pinhole
  | 'WEIGHT_DISCREPANCY';  // Severe tare weight mismatch

export interface DefectiveLog {
  id: string;
  cylinderType: CylinderType;
  defectType: DefectType;
  cylinderSerialNo?: string;
  source: 'GODOWN' | 'VAN_DELIVERY' | 'CUSTOMER_RETURN' | 'OFFICE_COUNTER';
  reportedBy: string;
  reportedByName: string;
  timestamp: string;
  status: 'QUARANTINED' | 'DISPATCHED_TO_PLANT';
  notes?: string;
}

export interface CylinderPricing {
  cylinderType: CylinderType;
  title: string;
  subtitle: string;
  refillPrice: number;    // Selling price to customer
  purchasePrice: number;  // Price paid to IOCL/BPCL/HPCL
  depositPrice: number;   // Security deposit for new connection
  weightKg: number;
  color: string;
}

export interface StockQuantity {
  full: number;
  empty: number;
  defective: number;
}

export interface GodownLocation {
  id: string;
  name: string;
  location: string;
  capacityCylinders: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface GodownStock {
  '14.2KG': StockQuantity;
  '19KG': StockQuantity;
  '5KG': StockQuantity;
  godownId?: string;
  godownName?: string;
  lastUpdated: string;
}

export interface OfficeStock {
  '14.2KG': StockQuantity;
  '19KG': StockQuantity;
  '5KG': StockQuantity;
  cashInHand: number;
  upiInHand: number;
  lastUpdated: string;
}

export interface StaffStock {
  '14.2KG': StockQuantity;
  '19KG': StockQuantity;
  '5KG': StockQuantity;
}

export interface StaffUser {
  id: string;
  name: string;
  phone: string;
  vehicleNo: string;
  vehicleType: string;
  role: 'STAFF';
  pinHash?: string;
  active: boolean;
  stock: StaffStock;
  cashInHand: number;
  upiInHand: number;
}

export interface Customer {
  id: string;
  consumerNo: string;
  name: string;
  mobile: string;
  address: string;
  type: CustomerType;
  firmName?: string;                           // Commercial Firm / Hotel name
  gstin?: string;                              // GSTIN for commercial accounts
  securityDepositsHeld?: number;               // Deposit held by agency
  cylinderDues: Record<CylinderType, number>;  // How many empty cylinders owed
  paymentDue: number;                          // INR amount owed
  connectionDate: string;
}

export interface Transaction {
  id: string;
  txnType: TransactionType;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: Role;
  staffId?: string;
  staffName?: string;
  customerId?: string;
  customerName?: string;
  consumerNo?: string;
  cylinderType: CylinderType | 'MIXED';
  quantity: number;
  emptyReturned: number;
  unitPrice: number;
  totalAmount: number;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  balanceDue: number;
  notes: string;
  isReversal?: boolean;
  reversedTxnId?: string;
  reversalReason?: string;
}

export interface Expense {
  id: string;
  category: 'DIESEL' | 'VEHICLE_REPAIR' | 'SALARY' | 'GODOWN_RENT' | 'ELECTRICITY' | 'TEA_SNACKS' | 'OTHER';
  title: string;
  amount: number;
  date: string;
  paymentMode: 'CASH' | 'UPI';
  recordedBy: string;
  recordedByName: string;
}

export interface AgencyInfo {
  agencyName: string;
  agencySubtitle: string;
  omcName: 'INDANE' | 'BHARAT GAS' | 'HP GAS';
  distributorCode: string;
  gstin: string;
  address: string;
  phone: string;
  emergencyNo: string;
}

export interface EODDailySummary {
  date: string;
  timestamp: string;
  agencyName: string;
  godownStock: GodownStock;
  inTransitStock: {
    full: number;
    empty: number;
    defective: number;
  };
  totalRefillSalesCount: {
    '14.2KG': number;
    '19KG': number;
    '5KG': number;
    total: number;
  };
  emptyRecoveredCount: number;
  defectiveCount: number;
  financials: {
    totalSalesRevenue: number;
    cashCollected: number;
    upiCollected: number;
    creditIssued: number;
    duesCollected: number;
    expensesPaid: number;
    netCashInSafe: number;
  };
  activeVans: {
    name: string;
    vehicleNo: string;
    cashInHand: number;
    upiInHand: number;
    stockSummary: string;
  }[];
}
