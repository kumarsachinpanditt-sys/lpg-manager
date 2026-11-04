import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import {
  Customer,
  CylinderPricing,
  CylinderType,
  DefectiveLog,
  GodownLocation,
  GodownStock,
  OfficeStock,
  Role,
  StaffUser,
  Transaction,
  Expense,
  EODDailySummary
} from '../types/lpg';
import { INITIAL_PRICING, INITIAL_GODOWNS, INITIAL_GODOWN_STOCK, INITIAL_OFFICE_STOCK } from '../data/initialData';

export interface FirebaseLpgUser {
  uid: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  staffId?: string;
  pinHash?: string;
  vehicleNo?: string;
  vehicleType?: string;
  active?: boolean;
  createdAt: string;
}

class LpgFirestoreService {
  // ==========================================
  // 1. AUTHENTICATION & USER MANAGEMENT
  // ==========================================

  public async syncUserToFirestore(user: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    phoneNumber?: string | null;
    role?: Role;
    staffId?: string;
  }): Promise<FirebaseLpgUser> {
    const userRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userRef);
      const isDesignatedAdmin = user.email === 'Kumarsachinpandit@gmail.com';

      if (snap.exists()) {
        const data = snap.data() as FirebaseLpgUser;
        if (isDesignatedAdmin && data.role !== 'ADMIN') {
          await updateDoc(userRef, { role: 'ADMIN' });
          return { ...data, role: 'ADMIN' };
        }
        return data;
      } else {
        const role: Role = isDesignatedAdmin ? 'ADMIN' : (user.role || 'STAFF');
        const newUser: FirebaseLpgUser = {
          uid: user.uid,
          name: user.displayName || (isDesignatedAdmin ? 'Sachin Kumar (Admin)' : 'Delivery Staff'),
          email: user.email || '',
          phone: user.phoneNumber || '',
          role,
          staffId: user.staffId || (role === 'STAFF' ? user.uid : undefined),
          active: true,
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newUser);
        return newUser;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  }

  /**
   * Create new Staff Member with PIN stored in Firestore
   */
  public async createStaff(staff: {
    name: string;
    phone: string;
    vehicleNo: string;
    vehicleType?: string;
    pin: string;
  }): Promise<{ success: boolean; staffId?: string; error?: string }> {
    const staffId = `staff-${Date.now().toString().slice(-4)}`;
    const userRef = doc(db, 'users', staffId);
    const staffStockRef = doc(db, 'staff_stock', staffId);

    try {
      await runTransaction(db, async (t) => {
        // Create user document with role STAFF and pinHash
        t.set(userRef, {
          uid: staffId,
          name: staff.name,
          phone: staff.phone,
          vehicleNo: staff.vehicleNo || 'DL-01-VAN',
          vehicleType: staff.vehicleType || 'Delivery Van',
          role: 'STAFF',
          staffId: staffId,
          pinHash: staff.pin, // 4-digit PIN verification
          active: true,
          createdAt: new Date().toISOString()
        });

        // Initialize empty vehicle stock
        t.set(staffStockRef, {
          staffId,
          staffName: staff.name,
          phone: staff.phone,
          '14.2KG': { full: 0, empty: 0, defective: 0 },
          '19KG': { full: 0, empty: 0, defective: 0 },
          '5KG': { full: 0, empty: 0, defective: 0 },
          cashInHand: 0,
          upiInHand: 0,
          lastUpdated: new Date().toISOString()
        });
      });

      return { success: true, staffId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register staff member'
      };
    }
  }

  /**
   * Verify staff PIN against Firestore records
   */
  public async verifyStaffPin(phone: string, pin: string): Promise<{ success: boolean; user?: StaffUser; error?: string }> {
    try {
      const q = query(
        collection(db, 'users'),
        where('phone', '==', phone.trim()),
        where('role', '==', 'STAFF')
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        return { success: false, error: 'Staff phone number not found in registry.' };
      }

      const userData = snap.docs[0].data() as FirebaseLpgUser;
      if (!userData.active) {
        return { success: false, error: 'This staff account has been deactivated.' };
      }

      if (userData.pinHash !== pin.trim()) {
        return { success: false, error: 'Invalid PIN. Please check your 4-digit access code.' };
      }

      // Fetch staff stock
      const stockSnap = await getDoc(doc(db, 'staff_stock', userData.uid));
      const stockData = stockSnap.exists() ? stockSnap.data() : {};

      const staffUser: StaffUser = {
        id: userData.uid,
        name: userData.name,
        phone: userData.phone || phone,
        vehicleNo: userData.vehicleNo || 'DL-01-VAN',
        vehicleType: userData.vehicleType || 'Delivery Van',
        role: 'STAFF',
        active: true,
        stock: {
          '14.2KG': stockData['14.2KG'] || { full: 0, empty: 0, defective: 0 },
          '19KG': stockData['19KG'] || { full: 0, empty: 0, defective: 0 },
          '5KG': stockData['5KG'] || { full: 0, empty: 0, defective: 0 }
        },
        cashInHand: stockData.cashInHand || 0,
        upiInHand: stockData.upiInHand || 0
      };

      return { success: true, user: staffUser };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Staff verification error'
      };
    }
  }

  public async getStaffList(): Promise<StaffUser[]> {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'STAFF'));
      const snap = await getDocs(q);
      const staffMembers: StaffUser[] = [];

      for (const d of snap.docs) {
        const u = d.data() as FirebaseLpgUser;
        const stockSnap = await getDoc(doc(db, 'staff_stock', u.uid));
        const stockData = stockSnap.exists() ? stockSnap.data() : {};

        staffMembers.push({
          id: u.uid,
          name: u.name,
          phone: u.phone || '+91 98000 00000',
          vehicleNo: u.vehicleNo || 'DL-01-VAN',
          vehicleType: u.vehicleType || 'Delivery Van',
          role: 'STAFF',
          active: u.active ?? true,
          stock: {
            '14.2KG': stockData['14.2KG'] || { full: 0, empty: 0, defective: 0 },
            '19KG': stockData['19KG'] || { full: 0, empty: 0, defective: 0 },
            '5KG': stockData['5KG'] || { full: 0, empty: 0, defective: 0 }
          },
          cashInHand: stockData.cashInHand || 0,
          upiInHand: stockData.upiInHand || 0
        });
      }

      return staffMembers;
    } catch (error) {
      return [];
    }
  }

  // ==========================================
  // 2. GODOWN LOCATIONS & CREATION
  // ==========================================

  public async createGodown(godown: {
    name: string;
    location: string;
    capacityCylinders: number;
    isPrimary?: boolean;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    const id = `godown-${Date.now().toString().slice(-4)}`;
    const docRef = doc(db, 'godowns', id);
    try {
      const record: GodownLocation = {
        id,
        name: godown.name,
        location: godown.location,
        capacityCylinders: godown.capacityCylinders,
        isPrimary: godown.isPrimary ?? false,
        createdAt: new Date().toISOString()
      };
      await setDoc(docRef, record);
      return { success: true, id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to register godown location'
      };
    }
  }

  public subscribeToGodowns(callback: (godowns: GodownLocation[]) => void): () => void {
    if (!auth.currentUser) return () => {};
    const colRef = collection(db, 'godowns');
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_GODOWNS);
        } else {
          const list: GodownLocation[] = [];
          snapshot.forEach((d) => list.push(d.data() as GodownLocation));
          callback(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'godowns');
      }
    );
  }

  // ==========================================
  // 3. PRICING SETTINGS
  // ==========================================

  public subscribeToPricing(callback: (pricing: CylinderPricing[]) => void): () => void {
    const colRef = collection(db, 'pricing');
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          callback(INITIAL_PRICING);
        } else {
          const list: CylinderPricing[] = [];
          snapshot.forEach((d) => list.push(d.data() as CylinderPricing));
          callback(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'pricing');
      }
    );
  }

  public async updatePricing(pricing: CylinderPricing): Promise<void> {
    const docRef = doc(db, 'pricing', pricing.cylinderType);
    try {
      await setDoc(docRef, { ...pricing, updatedAt: new Date().toISOString() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `pricing/${pricing.cylinderType}`);
    }
  }

  // ==========================================
  // 4. GODOWN INVENTORY & PLANT INWARD
  // ==========================================

  public subscribeToGodownStock(callback: (stock: GodownStock) => void): () => void {
    const colRef = collection(db, 'godown_stock');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const defaultStock: GodownStock = {
          '14.2KG': { full: 0, empty: 0, defective: 0 },
          '19KG': { full: 0, empty: 0, defective: 0 },
          '5KG': { full: 0, empty: 0, defective: 0 },
          lastUpdated: new Date().toISOString()
        };

        if (!snapshot.empty) {
          snapshot.forEach((d) => {
            const data = d.data();
            const type = d.id as CylinderType;
            if (defaultStock[type]) {
              defaultStock[type] = {
                full: data.fullQuantity || data.full || 0,
                empty: data.emptyQuantity || data.empty || 0,
                defective: data.defectiveQuantity || data.defective || 0
              };
            }
          });
          defaultStock.lastUpdated = new Date().toISOString();
        }

        callback(defaultStock);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'godown_stock');
      }
    );
  }

  /**
   * Atomic Plant Inward Stock Receiving
   */
  public async receivePlantStock(params: {
    truckNo: string;
    invoiceNo: string;
    cylinderType: CylinderType;
    fullReceived: number;
    emptyDespatched: number;
    unitPurchasePrice: number;
    adminId: string;
    adminName: string;
    notes?: string;
  }): Promise<{ success: boolean; txnId?: string; error?: string }> {
    const txnId = `TXN-INW-${Date.now().toString().slice(-6)}`;
    const godownDocRef = doc(db, 'godown_stock', params.cylinderType);
    const txnDocRef = doc(db, 'transactions', txnId);

    try {
      await runTransaction(db, async (t) => {
        const snap = await t.get(godownDocRef);
        const data = snap.exists() ? snap.data() : { fullQuantity: 0, emptyQuantity: 0, defectiveQuantity: 0 };

        const currentFull = data.fullQuantity || data.full || 0;
        const currentEmpty = data.emptyQuantity || data.empty || 0;

        if (currentEmpty < params.emptyDespatched) {
          throw new Error(`Insufficient empty cylinders in Godown. Available: ${currentEmpty}, Required: ${params.emptyDespatched}`);
        }

        t.set(
          godownDocRef,
          {
            cylinderType: params.cylinderType,
            fullQuantity: currentFull + params.fullReceived,
            emptyQuantity: currentEmpty - params.emptyDespatched,
            defectiveQuantity: data.defectiveQuantity || 0,
            lastUpdated: new Date().toISOString()
          },
          { merge: true }
        );

        t.set(txnDocRef, {
          id: txnId,
          txnType: 'SUPPLIER_INWARD',
          timestamp: new Date().toISOString(),
          userId: params.adminId,
          userName: params.adminName,
          userRole: 'ADMIN',
          cylinderType: params.cylinderType,
          quantity: params.fullReceived,
          emptyReturned: params.emptyDespatched,
          unitPrice: params.unitPurchasePrice,
          totalAmount: params.fullReceived * params.unitPurchasePrice,
          paymentMode: 'NA',
          paymentStatus: 'PAID',
          paidAmount: params.fullReceived * params.unitPurchasePrice,
          balanceDue: 0,
          notes: params.notes || `Plant Inward: Truck ${params.truckNo}, Invoice ${params.invoiceNo}`
        });
      });

      return { success: true, txnId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Plant inward transaction failed'
      };
    }
  }

  // ==========================================
  // 5. OFFICE COUNTER STOCK & TRANSFERS
  // ==========================================

  public subscribeToOfficeStock(callback: (stock: OfficeStock) => void): () => void {
    const colRef = collection(db, 'office_stock');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const defaultStock: OfficeStock = {
          '14.2KG': { full: 0, empty: 0, defective: 0 },
          '19KG': { full: 0, empty: 0, defective: 0 },
          '5KG': { full: 0, empty: 0, defective: 0 },
          cashInHand: 0,
          upiInHand: 0,
          lastUpdated: new Date().toISOString()
        };

        if (!snapshot.empty) {
          snapshot.forEach((d) => {
            const data = d.data();
            const type = d.id as CylinderType;
            if (defaultStock[type]) {
              defaultStock[type] = {
                full: data.fullQuantity || data.full || 0,
                empty: data.emptyQuantity || data.empty || 0,
                defective: data.defectiveQuantity || data.defective || 0
              };
            }
          });
        }
        callback(defaultStock);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'office_stock');
      }
    );
  }

  /**
   * Atomic Godown-to-Office Transfer (Filled cylinders sent to counter)
   */
  public async transferGodownToOffice(params: {
    cylinderType: CylinderType;
    quantity: number;
    userId: string;
    userName: string;
    notes?: string;
  }): Promise<{ success: boolean; txnId?: string; error?: string }> {
    const txnId = `TXN-G2O-${Date.now().toString().slice(-6)}`;
    const godownRef = doc(db, 'godown_stock', params.cylinderType);
    const officeRef = doc(db, 'office_stock', params.cylinderType);
    const txnRef = doc(db, 'transactions', txnId);

    try {
      await runTransaction(db, async (t) => {
        const godownSnap = await t.get(godownRef);
        const godownData = godownSnap.exists() ? godownSnap.data() : { fullQuantity: 0 };
        const gFull = godownData.fullQuantity || godownData.full || 0;

        if (gFull < params.quantity) {
          throw new Error(`Insufficient filled stock in Godown. Available: ${gFull}, Required: ${params.quantity}`);
        }

        const officeSnap = await t.get(officeRef);
        const officeData = officeSnap.exists() ? officeSnap.data() : { fullQuantity: 0, emptyQuantity: 0 };
        const oFull = officeData.fullQuantity || officeData.full || 0;

        t.update(godownRef, {
          fullQuantity: gFull - params.quantity,
          lastUpdated: new Date().toISOString()
        });

        t.set(
          officeRef,
          {
            cylinderType: params.cylinderType,
            fullQuantity: oFull + params.quantity,
            emptyQuantity: officeData.emptyQuantity || 0,
            lastUpdated: new Date().toISOString()
          },
          { merge: true }
        );

        t.set(txnRef, {
          id: txnId,
          txnType: 'GODOWN_TO_OFFICE',
          timestamp: new Date().toISOString(),
          userId: params.userId,
          userName: params.userName,
          userRole: 'ADMIN',
          cylinderType: params.cylinderType,
          quantity: params.quantity,
          emptyReturned: 0,
          unitPrice: 0,
          totalAmount: 0,
          paymentMode: 'NA',
          paymentStatus: 'NA',
          paidAmount: 0,
          balanceDue: 0,
          notes: params.notes || `Transferred ${params.quantity} ${params.cylinderType} to Office Showroom Counter`
        });
      });

      return { success: true, txnId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Godown to Office transfer failed'
      };
    }
  }

  /**
   * Atomic Office-to-Godown Transfer (Collected empties returned to godown)
   */
  public async transferOfficeToGodown(params: {
    cylinderType: CylinderType;
    quantity: number;
    userId: string;
    userName: string;
    notes?: string;
  }): Promise<{ success: boolean; txnId?: string; error?: string }> {
    const txnId = `TXN-O2G-${Date.now().toString().slice(-6)}`;
    const godownRef = doc(db, 'godown_stock', params.cylinderType);
    const officeRef = doc(db, 'office_stock', params.cylinderType);
    const txnRef = doc(db, 'transactions', txnId);

    try {
      await runTransaction(db, async (t) => {
        const officeSnap = await t.get(officeRef);
        const officeData = officeSnap.exists() ? officeSnap.data() : { emptyQuantity: 0 };
        const oEmpty = officeData.emptyQuantity || officeData.empty || 0;

        if (oEmpty < params.quantity) {
          throw new Error(`Insufficient empty stock at Office counter. Available: ${oEmpty}, Requested: ${params.quantity}`);
        }

        const godownSnap = await t.get(godownRef);
        const godownData = godownSnap.exists() ? godownSnap.data() : { emptyQuantity: 0 };
        const gEmpty = godownData.emptyQuantity || godownData.empty || 0;

        t.set(
          officeRef,
          {
            emptyQuantity: oEmpty - params.quantity,
            lastUpdated: new Date().toISOString()
          },
          { merge: true }
        );

        t.update(godownRef, {
          emptyQuantity: gEmpty + params.quantity,
          lastUpdated: new Date().toISOString()
        });

        t.set(txnRef, {
          id: txnId,
          txnType: 'OFFICE_TO_GODOWN',
          timestamp: new Date().toISOString(),
          userId: params.userId,
          userName: params.userName,
          userRole: 'ADMIN',
          cylinderType: params.cylinderType,
          quantity: params.quantity,
          emptyReturned: params.quantity,
          unitPrice: 0,
          totalAmount: 0,
          paymentMode: 'NA',
          paymentStatus: 'NA',
          paidAmount: 0,
          balanceDue: 0,
          notes: params.notes || `Returned ${params.quantity} empty ${params.cylinderType} from Office to Godown`
        });
      });

      return { success: true, txnId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Office to Godown transfer failed'
      };
    }
  }

  // ==========================================
  // 6. GODOWN-TO-STAFF VEHICLE LOADING
  // ==========================================

  public async issueStockToStaff(params: {
    staffId: string;
    staffName: string;
    cylinderType: CylinderType;
    quantity: number;
    userId: string;
    userName: string;
    notes?: string;
  }): Promise<{ success: boolean; txnId?: string; error?: string }> {
    const txnId = `TXN-ISS-${Date.now().toString().slice(-6)}`;
    const godownDocRef = doc(db, 'godown_stock', params.cylinderType);
    const staffStockRef = doc(db, 'staff_stock', params.staffId);
    const txnRef = doc(db, 'transactions', txnId);

    try {
      await runTransaction(db, async (t) => {
        const godownSnap = await t.get(godownDocRef);
        const godownData = godownSnap.exists() ? godownSnap.data() : { fullQuantity: 0 };
        const currentGodownFull = godownData.fullQuantity || godownData.full || 0;

        if (currentGodownFull < params.quantity) {
          throw new Error(`Insufficient filled stock in Godown. Available: ${currentGodownFull}, Requested: ${params.quantity}`);
        }

        const staffSnap = await t.get(staffStockRef);
        const currentStaff = staffSnap.exists() ? staffSnap.data() : {};

        t.update(godownDocRef, {
          fullQuantity: currentGodownFull - params.quantity,
          lastUpdated: new Date().toISOString()
        });

        const currentStaffCategory = currentStaff[params.cylinderType] || { full: 0, empty: 0, defective: 0 };
        const updatedStaffCategory = {
          ...currentStaffCategory,
          full: currentStaffCategory.full + params.quantity
        };

        t.set(
          staffStockRef,
          {
            ...currentStaff,
            staffId: params.staffId,
            staffName: params.staffName,
            [params.cylinderType]: updatedStaffCategory,
            lastUpdated: new Date().toISOString()
          },
          { merge: true }
        );

        t.set(txnRef, {
          id: txnId,
          txnType: 'GODOWN_TO_STAFF',
          timestamp: new Date().toISOString(),
          userId: params.userId,
          userName: params.userName,
          userRole: 'ADMIN',
          staffId: params.staffId,
          staffName: params.staffName,
          cylinderType: params.cylinderType,
          quantity: params.quantity,
          emptyReturned: 0,
          unitPrice: 0,
          totalAmount: 0,
          paymentMode: 'NA',
          paymentStatus: 'NA',
          paidAmount: 0,
          balanceDue: 0,
          notes: params.notes || `Loaded onto van for ${params.staffName}`
        });
      });

      return { success: true, txnId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transfer stock to staff'
      };
    }
  }

  // ==========================================
  // 7. CUSTOMERS & ATOMIC DELIVERIES
  // ==========================================

  public subscribeToCustomers(callback: (customers: Customer[]) => void): () => void {
    if (!auth.currentUser) return () => {};
    const colRef = collection(db, 'customers');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Customer[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Customer));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'customers');
      }
    );
  }

  public async createCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
    const id = `CUST-${Date.now().toString().slice(-6)}`;
    const docRef = doc(db, 'customers', id);
    try {
      await setDoc(docRef, { ...customer, id });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `customers/${id}`);
    }
  }

  /**
   * Atomic Customer Delivery
   */
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
  }): Promise<{ success: boolean; error?: string; txnId?: string }> {
    const txnId = `TXN-DEL-${Date.now().toString().slice(-6)}`;
    const staffStockRef = doc(db, 'staff_stock', params.staffId);
    const customerRef = doc(db, 'customers', params.customerId);
    const txnRef = doc(db, 'transactions', txnId);

    const totalAmount = params.quantity * params.unitPrice;
    const balanceDue = Math.max(0, totalAmount - params.paidAmount);
    const paymentStatus = balanceDue === 0 ? 'PAID' : params.paidAmount > 0 ? 'PARTIAL' : 'DUE';

    try {
      await runTransaction(db, async (t) => {
        const staffSnap = await t.get(staffStockRef);
        const staffData = staffSnap.data() || {};
        const cat = staffData[params.cylinderType] || { full: 0, empty: 0, defective: 0 };

        if (cat.full < params.quantity) {
          throw new Error(`Insufficient filled stock in vehicle. Available: ${cat.full}, Required: ${params.quantity}`);
        }

        const custSnap = await t.get(customerRef);
        const custData = custSnap.data() as Customer;

        // Update Staff Stock
        const newStaffFull = cat.full - params.quantity;
        const newStaffEmpty = cat.empty + params.emptyReturned;
        const newCash = (staffData.cashInHand || 0) + (params.paymentMode === 'CASH' ? params.paidAmount : 0);
        const newUpi = (staffData.upiInHand || 0) + (params.paymentMode === 'UPI' ? params.paidAmount : 0);

        t.update(staffStockRef, {
          [`${params.cylinderType}.full`]: newStaffFull,
          [`${params.cylinderType}.empty`]: newStaffEmpty,
          cashInHand: newCash,
          upiInHand: newUpi,
          lastUpdated: new Date().toISOString()
        });

        // Update Customer Ledger
        const currentEmptyDues = (custData.cylinderDues && custData.cylinderDues[params.cylinderType]) || 0;
        const netEmptyDifference = params.quantity - params.emptyReturned;
        const newEmptyDue = Math.max(0, currentEmptyDues + netEmptyDifference);
        const newPaymentDue = (custData.paymentDue || 0) + balanceDue;

        t.update(customerRef, {
          [`cylinderDues.${params.cylinderType}`]: newEmptyDue,
          paymentDue: newPaymentDue
        });

        // Create Transaction
        t.set(txnRef, {
          id: txnId,
          txnType: 'STAFF_TO_CUSTOMER',
          timestamp: new Date().toISOString(),
          userId: params.staffId,
          userName: params.staffName,
          userRole: 'STAFF',
          staffId: params.staffId,
          staffName: params.staffName,
          customerId: params.customerId,
          customerName: params.customerName,
          consumerNo: params.consumerNo || custData.consumerNo || '',
          cylinderType: params.cylinderType,
          quantity: params.quantity,
          emptyReturned: params.emptyReturned,
          unitPrice: params.unitPrice,
          totalAmount,
          paymentMode: params.paymentMode,
          paymentStatus,
          paidAmount: params.paidAmount,
          balanceDue,
          notes: params.notes || `Delivery to ${params.customerName}`
        });
      });

      return { success: true, txnId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delivery transaction failed'
      };
    }
  }

  /**
   * Atomic Customer Standalone Empty Return
   */
  public async recordCustomerEmptyReturn(params: {
    staffId: string;
    staffName: string;
    customerId: string;
    customerName: string;
    cylinderType: CylinderType;
    emptyCount: number;
    notes?: string;
  }): Promise<{ success: boolean; error?: string; txnId?: string }> {
    const txnId = `TXN-RET-${Date.now().toString().slice(-6)}`;
    const staffStockRef = doc(db, 'staff_stock', params.staffId);
    const customerRef = doc(db, 'customers', params.customerId);
    const txnRef = doc(db, 'transactions', txnId);

    try {
      await runTransaction(db, async (t) => {
        const staffSnap = await t.get(staffStockRef);
        const staffData = staffSnap.data() || {};
        const cat = staffData[params.cylinderType] || { full: 0, empty: 0, defective: 0 };

        const custSnap = await t.get(customerRef);
        const custData = custSnap.data() as Customer;
        const currentEmptyDue = (custData.cylinderDues && custData.cylinderDues[params.cylinderType]) || 0;

        t.update(staffStockRef, {
          [`${params.cylinderType}.empty`]: cat.empty + params.emptyCount,
          lastUpdated: new Date().toISOString()
        });

        t.update(customerRef, {
          [`cylinderDues.${params.cylinderType}`]: Math.max(0, currentEmptyDue - params.emptyCount)
        });

        t.set(txnRef, {
          id: txnId,
          txnType: 'CUSTOMER_EMPTY_RETURN',
          timestamp: new Date().toISOString(),
          userId: params.staffId,
          userName: params.staffName,
          userRole: 'STAFF',
          staffId: params.staffId,
          staffName: params.staffName,
          customerId: params.customerId,
          customerName: params.customerName,
          cylinderType: params.cylinderType,
          quantity: 0,
          emptyReturned: params.emptyCount,
          unitPrice: 0,
          totalAmount: 0,
          paymentMode: 'NA',
          paymentStatus: 'NA',
          paidAmount: 0,
          balanceDue: 0,
          notes: params.notes || 'Customer returned outstanding empty cylinder'
        });
      });

      return { success: true, txnId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Return logging failed'
      };
    }
  }

  /**
   * Atomic Customer Credit Payment
   */
  public async recordPaymentCollection(params: {
    staffId: string;
    staffName: string;
    customerId: string;
    customerName: string;
    amount: number;
    paymentMode: 'CASH' | 'UPI';
    notes?: string;
  }): Promise<{ success: boolean; error?: string; txnId?: string }> {
    const txnId = `TXN-PAY-${Date.now().toString().slice(-6)}`;
    const staffStockRef = doc(db, 'staff_stock', params.staffId);
    const customerRef = doc(db, 'customers', params.customerId);
    const txnRef = doc(db, 'transactions', txnId);

    try {
      await runTransaction(db, async (t) => {
        const custSnap = await t.get(customerRef);
        const custData = custSnap.data() as Customer;
        const newDue = Math.max(0, (custData.paymentDue || 0) - params.amount);

        const staffSnap = await t.get(staffStockRef);
        const staffData = staffSnap.data() || {};
        const newCash = (staffData.cashInHand || 0) + (params.paymentMode === 'CASH' ? params.amount : 0);
        const newUpi = (staffData.upiInHand || 0) + (params.paymentMode === 'UPI' ? params.amount : 0);

        t.update(customerRef, { paymentDue: newDue });
        t.update(staffStockRef, {
          cashInHand: newCash,
          upiInHand: newUpi,
          lastUpdated: new Date().toISOString()
        });

        t.set(txnRef, {
          id: txnId,
          txnType: 'PAYMENT_COLLECTION',
          timestamp: new Date().toISOString(),
          userId: params.staffId,
          userName: params.staffName,
          userRole: 'STAFF',
          staffId: params.staffId,
          staffName: params.staffName,
          customerId: params.customerId,
          customerName: params.customerName,
          cylinderType: '14.2KG',
          quantity: 0,
          emptyReturned: 0,
          unitPrice: 0,
          totalAmount: params.amount,
          paymentMode: params.paymentMode,
          paymentStatus: 'PAID',
          paidAmount: params.amount,
          balanceDue: newDue,
          notes: params.notes || `Credit payment collection of ₹${params.amount}`
        });
      });

      return { success: true, txnId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment recording failed'
      };
    }
  }

  // ==========================================
  // 8. DEFECTIVE CYLINDERS QUARANTINE
  // ==========================================

  public subscribeToDefectives(callback: (defectives: DefectiveLog[]) => void): () => void {
    if (!auth.currentUser) return () => {};
    const colRef = collection(db, 'defectives');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: DefectiveLog[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as DefectiveLog));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'defectives');
      }
    );
  }

  public async logDefective(params: Omit<DefectiveLog, 'id' | 'timestamp' | 'status'>): Promise<string> {
    const id = `DEF-${Date.now().toString().slice(-6)}`;
    const defRef = doc(db, 'defectives', id);
    const godownRef = doc(db, 'godown_stock', params.cylinderType);

    try {
      await runTransaction(db, async (t) => {
        const godownSnap = await t.get(godownRef);
        const data = godownSnap.exists() ? godownSnap.data() : { defectiveQuantity: 0 };
        t.update(godownRef, {
          defectiveQuantity: (data.defectiveQuantity || 0) + 1
        });

        t.set(defRef, {
          ...params,
          id,
          timestamp: new Date().toISOString(),
          status: 'QUARANTINED'
        });
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `defectives/${id}`);
    }
  }

  // ==========================================
  // 9. END-OF-DAY RECONCILIATION
  // ==========================================

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
    notes?: string;
    adminId: string;
    adminName: string;
  }): Promise<{ success: boolean; error?: string; settlementId?: string }> {
    const settlementId = `EOD-${Date.now().toString().slice(-6)}`;
    const settlementRef = doc(db, 'eod_settlements', settlementId);
    const staffStockRef = doc(db, 'staff_stock', params.staffId);
    const godown14Ref = doc(db, 'godown_stock', '14.2KG');
    const godown19Ref = doc(db, 'godown_stock', '19KG');
    const godown5Ref = doc(db, 'godown_stock', '5KG');

    try {
      await runTransaction(db, async (t) => {
        const g14 = (await t.get(godown14Ref)).data() || {};
        const g19 = (await t.get(godown19Ref)).data() || {};
        const g5 = (await t.get(godown5Ref)).data() || {};

        t.update(godown14Ref, {
          fullQuantity: (g14.fullQuantity || 0) + params.returned14Full,
          emptyQuantity: (g14.emptyQuantity || 0) + params.returned14Empty
        });
        t.update(godown19Ref, {
          fullQuantity: (g19.fullQuantity || 0) + params.returned19Full,
          emptyQuantity: (g19.emptyQuantity || 0) + params.returned19Empty
        });
        t.update(godown5Ref, {
          fullQuantity: (g5.fullQuantity || 0) + params.returned5Full,
          emptyQuantity: (g5.emptyQuantity || 0) + params.returned5Empty
        });

        // Reset Staff Stock
        t.update(staffStockRef, {
          '14.2KG.full': 0,
          '14.2KG.empty': 0,
          '19KG.full': 0,
          '19KG.empty': 0,
          '5KG.full': 0,
          '5KG.empty': 0,
          cashInHand: 0,
          upiInHand: 0,
          lastUpdated: new Date().toISOString()
        });

        t.set(settlementRef, {
          id: settlementId,
          timestamp: new Date().toISOString(),
          staffId: params.staffId,
          staffName: params.staffName,
          adminId: params.adminId,
          adminName: params.adminName,
          returnedStock: {
            '14.2KG': { full: params.returned14Full, empty: params.returned14Empty },
            '19KG': { full: params.returned19Full, empty: params.returned19Empty },
            '5KG': { full: params.returned5Full, empty: params.returned5Empty }
          },
          cashHandedOver: params.cashHandedOver,
          upiHandedOver: params.upiHandedOver,
          notes: params.notes || 'Staff shift completed and verified by Admin'
        });
      });

      return { success: true, settlementId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'EOD Settlement failed'
      };
    }
  }

  // ==========================================
  // 10. TRANSACTIONS LEDGER & EXPENSES
  // ==========================================

  public subscribeToTransactions(callback: (txns: Transaction[]) => void): () => void {
    if (!auth.currentUser) return () => {};
    const colRef = collection(db, 'transactions');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Transaction[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Transaction));
        list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'transactions');
      }
    );
  }

  public subscribeToExpenses(callback: (expenses: Expense[]) => void): () => void {
    if (!auth.currentUser) return () => {};
    const colRef = collection(db, 'expenses');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Expense[] = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as Expense));
        callback(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'expenses');
      }
    );
  }

  public async recordExpense(params: Omit<Expense, 'id'>): Promise<string> {
    const id = `EXP-${Date.now().toString().slice(-6)}`;
    const docRef = doc(db, 'expenses', id);
    try {
      await setDoc(docRef, { ...params, id });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `expenses/${id}`);
    }
  }

  // ==========================================
  // 11. INITIALIZE CLOUD DATABASE
  // ==========================================

  public async initializeAgencyFirestore(adminUid: string, adminEmail: string, adminName: string): Promise<void> {
    try {
      // 1. Admin profile
      await setDoc(doc(db, 'users', adminUid), {
        uid: adminUid,
        name: adminName,
        email: adminEmail,
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      });

      // 2. Pricing
      for (const p of INITIAL_PRICING) {
        await setDoc(doc(db, 'pricing', p.cylinderType), {
          ...p,
          updatedAt: new Date().toISOString()
        });
      }

      // 3. Godown stock
      const types: CylinderType[] = ['14.2KG', '19KG', '5KG'];
      for (const t of types) {
        await setDoc(doc(db, 'godown_stock', t), {
          cylinderType: t,
          fullQuantity: INITIAL_GODOWN_STOCK[t].full,
          emptyQuantity: INITIAL_GODOWN_STOCK[t].empty,
          defectiveQuantity: INITIAL_GODOWN_STOCK[t].defective,
          lastUpdated: new Date().toISOString()
        });
      }

      // 4. Office Counter stock
      for (const t of types) {
        await setDoc(doc(db, 'office_stock', t), {
          cylinderType: t,
          fullQuantity: INITIAL_OFFICE_STOCK[t].full,
          emptyQuantity: INITIAL_OFFICE_STOCK[t].empty,
          defectiveQuantity: INITIAL_OFFICE_STOCK[t].defective,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error('Failed to initialize agency Firestore:', e);
    }
  }
}

export const lpgFirestore = new LpgFirestoreService();
