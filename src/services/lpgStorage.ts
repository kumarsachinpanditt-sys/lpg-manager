import {
  Customer,
  CylinderPricing,
  CylinderType,
  DefectType,
  DefectiveLog,
  EODDailySummary,
  Expense,
  GodownLocation,
  GodownStock,
  OfficeStock,
  PaymentMode,
  PaymentStatus,
  Role,
  StaffUser,
  Transaction,
  TransactionType
} from '../types/lpg';
import {
  DEMO_AGENCY_INFO,
  INITIAL_CUSTOMERS,
  INITIAL_DEFECTIVES,
  INITIAL_EXPENSES,
  INITIAL_GODOWNS,
  INITIAL_GODOWN_STOCK,
  INITIAL_OFFICE_STOCK,
  INITIAL_PRICING,
  INITIAL_STAFF,
  INITIAL_TRANSACTIONS
} from '../data/initialData';
import { lpgFirestore } from './lpgFirestore';
import { auth } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { CurrentUser } from './firebaseAuth';

const STORAGE_KEYS = {
  PRICING: 'lpg_pricing_v2',
  GODOWNS: 'lpg_godowns_v2',
  GODOWN: 'lpg_godown_stock_v2',
  OFFICE: 'lpg_office_stock_v2',
  STAFF: 'lpg_staff_v2',
  CUSTOMERS: 'lpg_customers_v2',
  TRANSACTIONS: 'lpg_transactions_v2',
  EXPENSES: 'lpg_expenses_v2',
  DEFECTIVES: 'lpg_defectives_v2',
  OFFLINE_QUEUE: 'lpg_offline_queue_v2'
};

const memoryStore: Record<string, string> = {};
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback to memory
    }
    return memoryStore[key] || null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Fallback to memory
    }
    memoryStore[key] = value;
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {
      // Fallback to memory
    }
    delete memoryStore[key];
  }
};

export interface OfflinePendingItem {
  id: string;
  type: 'DELIVERY' | 'RETURN' | 'PAYMENT' | 'DEFECTIVE';
  payload: any;
  timestamp: string;
  attempts: number;
}

class LpgStorageService {
  private listeners: (() => void)[] = [];
  private isFirestoreSynced: boolean = false;
  private unsubs: (() => void)[] = [];
  private isSyncingOffline: boolean = false;
  private inFlightOperations = new Set<string>();

  constructor() {
    this.initFirestoreSync();
  }

  private initFirestoreSync() {
    if (this.isFirestoreSynced) return;
    this.isFirestoreSynced = true;

    onAuthStateChanged(auth, (user) => {
      this.syncWithAuthUser(user);
    });

    this.syncWithAuthUser(auth.currentUser);
  }

  public syncWithAuthUser(user: FirebaseUser | null) {
    this.unsubs.forEach((unsub) => {
      try { unsub(); } catch (_) {}
    });
    this.unsubs = [];

    // Public Collections: Pricing, Godown Stock, Office Stock
    try {
      const uGodown = lpgFirestore.subscribeToGodownStock((stock) => {
        safeStorage.setItem(STORAGE_KEYS.GODOWN, JSON.stringify(stock));
        this.notify();
      });
      this.unsubs.push(uGodown);
    } catch (e) {
      console.warn('Godown stock listener:', e);
    }

    try {
      const uPricing = lpgFirestore.subscribeToPricing((pricing) => {
        if (pricing && pricing.length > 0) {
          safeStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(pricing));
          this.notify();
        }
      });
      this.unsubs.push(uPricing);
    } catch (e) {
      console.warn('Pricing listener:', e);
    }

    try {
      const uOffice = lpgFirestore.subscribeToOfficeStock((stock) => {
        safeStorage.setItem(STORAGE_KEYS.OFFICE, JSON.stringify(stock));
        this.notify();
      });
      this.unsubs.push(uOffice);
    } catch (e) {
      console.warn('Office stock listener:', e);
    }

    // Authenticated Collections: Customers, Transactions, Defectives, Expenses, Godowns
    if (!user) {
      return;
    }

    try {
      const uGodowns = lpgFirestore.subscribeToGodowns((godowns) => {
        if (godowns && godowns.length > 0) {
          safeStorage.setItem(STORAGE_KEYS.GODOWNS, JSON.stringify(godowns));
          this.notify();
        }
      });
      this.unsubs.push(uGodowns);
    } catch (e) {
      console.warn('Godowns listener:', e);
    }

    try {
      const uCust = lpgFirestore.subscribeToCustomers((customers) => {
        if (customers && customers.length > 0) {
          safeStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
          this.notify();
        }
      });
      this.unsubs.push(uCust);
    } catch (e) {
      console.warn('Customers listener:', e);
    }

    try {
      const uTxn = lpgFirestore.subscribeToTransactions((txns) => {
        if (txns && txns.length > 0) {
          safeStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txns));
          this.notify();
        }
      });
      this.unsubs.push(uTxn);
    } catch (e) {
      console.warn('Transactions listener:', e);
    }

    try {
      const uDef = lpgFirestore.subscribeToDefectives((defectives) => {
        if (defectives && defectives.length > 0) {
          safeStorage.setItem(STORAGE_KEYS.DEFECTIVES, JSON.stringify(defectives));
          this.notify();
        }
      });
      this.unsubs.push(uDef);
    } catch (e) {
      console.warn('Defectives listener:', e);
    }

    try {
      const uExp = lpgFirestore.subscribeToExpenses((expenses) => {
        if (expenses && expenses.length > 0) {
          safeStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
          this.notify();
        }
      });
      this.unsubs.push(uExp);
    } catch (e) {
      console.warn('Expenses listener:', e);
    }

    // Trigger offline queue sync once authenticated
    this.syncOfflineQueue();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // ==========================================
  // GETTERS
  // ==========================================

  public getPricing(): CylinderPricing[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.PRICING);
    if (!raw) return INITIAL_PRICING;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_PRICING;
    }
  }

  public getGodowns(): GodownLocation[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.GODOWNS);
    if (!raw) return INITIAL_GODOWNS;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_GODOWNS;
    }
  }

  public getGodownStock(): GodownStock {
    const raw = safeStorage.getItem(STORAGE_KEYS.GODOWN);
    if (!raw) return INITIAL_GODOWN_STOCK;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_GODOWN_STOCK;
    }
  }

  public getOfficeStock(): OfficeStock {
    const raw = safeStorage.getItem(STORAGE_KEYS.OFFICE);
    if (!raw) return INITIAL_OFFICE_STOCK;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_OFFICE_STOCK;
    }
  }

  public getStaff(): StaffUser[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.STAFF);
    if (!raw) return INITIAL_STAFF;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STAFF;
    }
  }

  public getCustomers(): Customer[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!raw) return INITIAL_CUSTOMERS;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CUSTOMERS;
    }
  }

  public getTransactions(): Transaction[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return INITIAL_TRANSACTIONS;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  public getDefectives(): DefectiveLog[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.DEFECTIVES);
    if (!raw) return INITIAL_DEFECTIVES;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_DEFECTIVES;
    }
  }

  public getExpenses(): Expense[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) return INITIAL_EXPENSES;
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_EXPENSES;
    }
  }

  public getOfflineQueue(): OfflinePendingItem[] {
    const raw = safeStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // ==========================================
  // CORE OPERATIONS WITH DUPLICATE GUARDS
  // ==========================================

  public async createGodown(godown: {
    name: string;
    location: string;
    capacityCylinders: number;
    isPrimary?: boolean;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const res = await lpgFirestore.createGodown(godown);
    if (res.success && res.id) {
      const list = this.getGodowns();
      list.push({
        id: res.id,
        name: godown.name,
        location: godown.location,
        capacityCylinders: godown.capacityCylinders,
        isPrimary: godown.isPrimary ?? false,
        createdAt: new Date().toISOString()
      });
      safeStorage.setItem(STORAGE_KEYS.GODOWNS, JSON.stringify(list));
      this.notify();
    }
    return res;
  }

  public async createStaff(staff: {
    name: string;
    phone: string;
    vehicleNo: string;
    vehicleType: string;
    pin: string;
  }): Promise<{ success: boolean; staffId?: string; error?: string }> {
    const res = await lpgFirestore.createStaff(staff);
    if (res.success && res.staffId) {
      const staffList = this.getStaff();
      staffList.push({
        id: res.staffId,
        name: staff.name,
        phone: staff.phone,
        vehicleNo: staff.vehicleNo,
        vehicleType: staff.vehicleType,
        role: 'STAFF',
        pinHash: staff.pin,
        active: true,
        stock: {
          '14.2KG': { full: 0, empty: 0, defective: 0 },
          '19KG': { full: 0, empty: 0, defective: 0 },
          '5KG': { full: 0, empty: 0, defective: 0 }
        },
        cashInHand: 0,
        upiInHand: 0
      });
      safeStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
      this.notify();
    }
    return res;
  }

  public async createCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
    const id = await lpgFirestore.createCustomer(customer);
    const customers = this.getCustomers();
    customers.push({ ...customer, id });
    safeStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    this.notify();
    return id;
  }

  public async transferGodownToOffice(params: {
    cylinderType: CylinderType;
    quantity: number;
    currentUser: CurrentUser;
    notes?: string;
  }): Promise<{ success: boolean; txnId?: string; error?: string }> {
    const lockKey = `G2O-${params.cylinderType}-${params.quantity}`;
    if (this.inFlightOperations.has(lockKey)) {
      return { success: false, error: 'Transfer already in progress. Please wait.' };
    }
    this.inFlightOperations.add(lockKey);

    try {
      const res = await lpgFirestore.transferGodownToOffice({
        cylinderType: params.cylinderType,
        quantity: params.quantity,
        userId: params.currentUser.id,
        userName: params.currentUser.name,
        notes: params.notes
      });

      if (res.success) {
        // Optimistic local update
        const g = this.getGodownStock();
        const o = this.getOfficeStock();
        g[params.cylinderType].full = Math.max(0, g[params.cylinderType].full - params.quantity);
        o[params.cylinderType].full = o[params.cylinderType].full + params.quantity;
        safeStorage.setItem(STORAGE_KEYS.GODOWN, JSON.stringify(g));
        safeStorage.setItem(STORAGE_KEYS.OFFICE, JSON.stringify(o));
        this.notify();
      }
      return res;
    } finally {
      this.inFlightOperations.delete(lockKey);
    }
  }

  public async transferOfficeToGodown(params: {
    cylinderType: CylinderType;
    quantity: number;
    currentUser: CurrentUser;
    notes?: string;
  }): Promise<{ success: boolean; txnId?: string; error?: string }> {
    const lockKey = `O2G-${params.cylinderType}-${params.quantity}`;
    if (this.inFlightOperations.has(lockKey)) {
      return { success: false, error: 'Transfer already in progress.' };
    }
    this.inFlightOperations.add(lockKey);

    try {
      const res = await lpgFirestore.transferOfficeToGodown({
        cylinderType: params.cylinderType,
        quantity: params.quantity,
        userId: params.currentUser.id,
        userName: params.currentUser.name,
        notes: params.notes
      });

      if (res.success) {
        const g = this.getGodownStock();
        const o = this.getOfficeStock();
        o[params.cylinderType].empty = Math.max(0, o[params.cylinderType].empty - params.quantity);
        g[params.cylinderType].empty = g[params.cylinderType].empty + params.quantity;
        safeStorage.setItem(STORAGE_KEYS.GODOWN, JSON.stringify(g));
        safeStorage.setItem(STORAGE_KEYS.OFFICE, JSON.stringify(o));
        this.notify();
      }
      return res;
    } finally {
      this.inFlightOperations.delete(lockKey);
    }
  }

  public async receivePlantStock(params: {
    truckNo: string;
    invoiceNo: string;
    cylinderType: CylinderType;
    fullReceived: number;
    emptyDespatched: number;
    unitPurchasePrice: number;
    adminUser: CurrentUser;
    notes?: string;
  }): Promise<{ success: boolean; txnId?: string; error?: string }> {
    const lockKey = `INW-${params.invoiceNo}-${params.truckNo}`;
    if (this.inFlightOperations.has(lockKey)) {
      return { success: false, error: 'Plant inward transaction already processing.' };
    }
    this.inFlightOperations.add(lockKey);

    try {
      const res = await lpgFirestore.receivePlantStock({
        truckNo: params.truckNo,
        invoiceNo: params.invoiceNo,
        cylinderType: params.cylinderType,
        fullReceived: params.fullReceived,
        emptyDespatched: params.emptyDespatched,
        unitPurchasePrice: params.unitPurchasePrice,
        adminId: params.adminUser.id,
        adminName: params.adminUser.name,
        notes: params.notes
      });

      if (res.success) {
        const g = this.getGodownStock();
        g[params.cylinderType].full += params.fullReceived;
        g[params.cylinderType].empty = Math.max(0, g[params.cylinderType].empty - params.emptyDespatched);
        safeStorage.setItem(STORAGE_KEYS.GODOWN, JSON.stringify(g));
        this.notify();
      }
      return res;
    } finally {
      this.inFlightOperations.delete(lockKey);
    }
  }

  public async issueStockToStaff(params: {
    staffId: string;
    cylinderType: CylinderType;
    quantity: number;
    adminUser: CurrentUser;
    notes?: string;
  }): Promise<{ success: boolean; txnId?: string; error?: string }> {
    const lockKey = `ISSUE-${params.staffId}-${params.cylinderType}-${params.quantity}`;
    if (this.inFlightOperations.has(lockKey)) {
      return { success: false, error: 'Vehicle load request in progress.' };
    }
    this.inFlightOperations.add(lockKey);

    try {
      const staffList = this.getStaff();
      const staff = staffList.find((s) => s.id === params.staffId);
      const staffName = staff ? staff.name : 'Delivery Staff';

      const res = await lpgFirestore.issueStockToStaff({
        staffId: params.staffId,
        staffName,
        cylinderType: params.cylinderType,
        quantity: params.quantity,
        userId: params.adminUser.id,
        userName: params.adminUser.name,
        notes: params.notes
      });

      if (res.success) {
        const g = this.getGodownStock();
        g[params.cylinderType].full = Math.max(0, g[params.cylinderType].full - params.quantity);
        safeStorage.setItem(STORAGE_KEYS.GODOWN, JSON.stringify(g));

        if (staff) {
          staff.stock[params.cylinderType].full += params.quantity;
          safeStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
        }
        this.notify();
      }
      return res;
    } finally {
      this.inFlightOperations.delete(lockKey);
    }
  }

  public async recordCustomerDelivery(params: {
    staffId: string;
    staffName: string;
    customerId: string;
    customerName: string;
    consumerNo?: string;
    cylinderType: CylinderType;
    quantity: number;
    emptyReturned: number;
    unitPrice: number;
    paymentMode: 'CASH' | 'UPI' | 'CREDIT';
    paidAmount: number;
    notes?: string;
  }): Promise<{ success: boolean; txnId?: string; error?: string; isOffline?: boolean }> {
    const lockKey = `DEL-${params.customerId}-${Date.now().toString().slice(-4)}`;
    if (this.inFlightOperations.has(lockKey)) {
      return { success: false, error: 'Delivery entry in progress.' };
    }
    this.inFlightOperations.add(lockKey);

    try {
      // Attempt server write if authenticated and online
      if (auth.currentUser && navigator.onLine) {
        const res = await lpgFirestore.recordCustomerDelivery(params);
        if (res.success) {
          this.applyLocalDelivery(params);
          return res;
        }
      }

      // Offline fallback: Queue for background sync
      const offlineItem: OfflinePendingItem = {
        id: `OFFLINE-DEL-${Date.now()}`,
        type: 'DELIVERY',
        payload: params,
        timestamp: new Date().toISOString(),
        attempts: 0
      };

      const queue = this.getOfflineQueue();
      queue.push(offlineItem);
      safeStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));

      // Apply optimistic update locally
      this.applyLocalDelivery(params);
      return { success: true, txnId: offlineItem.id, isOffline: true };
    } finally {
      this.inFlightOperations.delete(lockKey);
    }
  }

  private applyLocalDelivery(params: {
    staffId: string;
    customerId: string;
    cylinderType: CylinderType;
    quantity: number;
    emptyReturned: number;
    unitPrice: number;
    paymentMode: 'CASH' | 'UPI' | 'CREDIT';
    paidAmount: number;
  }) {
    const staffList = this.getStaff();
    const staff = staffList.find((s) => s.id === params.staffId);
    if (staff) {
      staff.stock[params.cylinderType].full = Math.max(0, staff.stock[params.cylinderType].full - params.quantity);
      staff.stock[params.cylinderType].empty += params.emptyReturned;
      if (params.paymentMode === 'CASH') staff.cashInHand += params.paidAmount;
      if (params.paymentMode === 'UPI') staff.upiInHand += params.paidAmount;
      safeStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
    }

    const customers = this.getCustomers();
    const cust = customers.find((c) => c.id === params.customerId);
    if (cust) {
      const netEmptyDiff = params.quantity - params.emptyReturned;
      cust.cylinderDues[params.cylinderType] = Math.max(0, (cust.cylinderDues[params.cylinderType] || 0) + netEmptyDiff);
      const totalAmount = params.quantity * params.unitPrice;
      const balanceDue = Math.max(0, totalAmount - params.paidAmount);
      cust.paymentDue = (cust.paymentDue || 0) + balanceDue;
      safeStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    }

    this.notify();
  }

  public async recordCustomerEmptyReturn(params: {
    staffId: string;
    staffName: string;
    customerId: string;
    customerName: string;
    cylinderType: CylinderType;
    emptyCount: number;
    notes?: string;
  }): Promise<{ success: boolean; txnId?: string; error?: string }> {
    const res = await lpgFirestore.recordCustomerEmptyReturn(params);
    if (res.success) {
      const staffList = this.getStaff();
      const staff = staffList.find((s) => s.id === params.staffId);
      if (staff) {
        staff.stock[params.cylinderType].empty += params.emptyCount;
        safeStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
      }

      const customers = this.getCustomers();
      const cust = customers.find((c) => c.id === params.customerId);
      if (cust) {
        cust.cylinderDues[params.cylinderType] = Math.max(0, (cust.cylinderDues[params.cylinderType] || 0) - params.emptyCount);
        safeStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      }
      this.notify();
    }
    return res;
  }

  public async recordPaymentCollection(params: {
    staffId: string;
    staffName: string;
    customerId: string;
    customerName: string;
    amount: number;
    paymentMode: 'CASH' | 'UPI';
    notes?: string;
  }): Promise<{ success: boolean; txnId?: string; error?: string }> {
    const res = await lpgFirestore.recordPaymentCollection(params);
    if (res.success) {
      const staffList = this.getStaff();
      const staff = staffList.find((s) => s.id === params.staffId);
      if (staff) {
        if (params.paymentMode === 'CASH') staff.cashInHand += params.amount;
        if (params.paymentMode === 'UPI') staff.upiInHand += params.amount;
        safeStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
      }

      const customers = this.getCustomers();
      const cust = customers.find((c) => c.id === params.customerId);
      if (cust) {
        cust.paymentDue = Math.max(0, (cust.paymentDue || 0) - params.amount);
        safeStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
      }
      this.notify();
    }
    return res;
  }

  public async logDefective(params: Omit<DefectiveLog, 'id' | 'timestamp' | 'status'>): Promise<string> {
    const id = await lpgFirestore.logDefective(params);
    const g = this.getGodownStock();
    g[params.cylinderType].defective += 1;
    safeStorage.setItem(STORAGE_KEYS.GODOWN, JSON.stringify(g));

    const list = this.getDefectives();
    list.unshift({
      ...params,
      id,
      timestamp: new Date().toISOString(),
      status: 'QUARANTINED'
    });
    safeStorage.setItem(STORAGE_KEYS.DEFECTIVES, JSON.stringify(list));
    this.notify();
    return id;
  }

  public async reconcileStaffEOD(params: {
    staffId: string;
    staffName: string;
    returned14Full: number;
    returned14Empty: number;
    returned19Full: number;
    returned19Empty: number;
    returned5Full: number;
    returned5Empty: number;
    cashHandedOver: number;
    upiHandedOver: number;
    adminId: string;
    adminName: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string; settlementId?: string }> {
    const res = await lpgFirestore.reconcileStaffEOD(params);
    if (res.success) {
      const g = this.getGodownStock();
      g['14.2KG'].full += params.returned14Full;
      g['14.2KG'].empty += params.returned14Empty;
      g['19KG'].full += params.returned19Full;
      g['19KG'].empty += params.returned19Empty;
      g['5KG'].full += params.returned5Full;
      g['5KG'].empty += params.returned5Empty;
      safeStorage.setItem(STORAGE_KEYS.GODOWN, JSON.stringify(g));

      const staffList = this.getStaff();
      const staff = staffList.find((s) => s.id === params.staffId);
      if (staff) {
        staff.stock['14.2KG'] = { full: 0, empty: 0, defective: 0 };
        staff.stock['19KG'] = { full: 0, empty: 0, defective: 0 };
        staff.stock['5KG'] = { full: 0, empty: 0, defective: 0 };
        staff.cashInHand = 0;
        staff.upiInHand = 0;
        safeStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
      }
      this.notify();
    }
    return res;
  }

  // ==========================================
  // SAFE OFFLINE QUEUE SYNCHRONIZATION
  // ==========================================

  public async syncOfflineQueue(): Promise<{ syncedCount: number; remainingCount: number }> {
    const isOnline = typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true;
    if (this.isSyncingOffline || !isOnline) {
      return { syncedCount: 0, remainingCount: this.getOfflineQueue().length };
    }

    this.isSyncingOffline = true;
    const queue = this.getOfflineQueue();
    const remaining: OfflinePendingItem[] = [];
    let syncedCount = 0;

    for (const item of queue) {
      try {
        if (item.type === 'DELIVERY') {
          const res = await lpgFirestore.recordCustomerDelivery(item.payload);
          if (res.success) {
            syncedCount++;
            continue;
          }
        }
        item.attempts += 1;
        remaining.push(item);
      } catch (err) {
        item.attempts += 1;
        remaining.push(item);
      }
    }

    safeStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(remaining));
    this.isSyncingOffline = false;
    this.notify();
    return { syncedCount, remainingCount: remaining.length };
  }
}

export const lpgStorage = new LpgStorageService();
