# LPG Manager - Implementation & Architecture Plan

## Executive Overview
**LPG Manager** is a specialized inventory, distribution, and financial accounting system engineered for Indian LPG distributorships (Indane, Bharatgas, and HP Gas). It enforces strict role-based access control (Admin and Staff), atomic stock accounting, cylinder status segregation (Full, Empty, Defective), delivery reconciliation, credit ledgers for bulk commercial consumers, and digital receipt delivery (PDF & WhatsApp).

All user interface screens, receipts, notifications, navigation menus, and audit logs are strictly standardized in **clean, minimalist English** with high-contrast typography designed for low-light godowns and outdoor mobile sunlight visibility.

---

## 1. Visual & Typography Constitution
The UI is styled using a modern industrial dark palette that guarantees maximum legibility and reduced eye strain during extended godown shifts:

* **Background Palette**: Deep Navy / Slate Obsidian (`#0B132B`, `#0F172A`, `#1E293B`).
* **Accent Colors**: Amber / Industrial Gas Orange (`#F97316`, `#EA580C`) for active statuses, stock movements, and primary actions. Emerald Green (`#10B981`) for completed payments and receipts. Crimson (`#EF4444`) for defective cylinders and stock shortages.
* **Typography & Contrast Rules**:
  * **Headings & Metric Figures**: Pure high-contrast white (`#FFFFFF`, `font-bold`, `tracking-tight`).
  * **Secondary Text, Subtitles & Form Labels**: Soft slate gray (`#94A3B8`, `font-medium`) with crisp contrast ratios exceeding WCAG AAA standards.
  * **Status Badges**: Semi-transparent colored containers with high-luminance text (no low-contrast washed-out pills).
  * **Zero Localization Artifacts**: Strictly pure English nomenclature across all views, receipt thermal prints, and exported day sheets.

---

## 2. Core Cylinder Classifications & Physical Segregation
LPG operations strictly segregate inventory by net product weight and physical condition:

| Cylinder Type | Weight (Net) | Target Market | Security Deposit / Price Mode |
| :--- | :--- | :--- | :--- |
| **14.2 KG Domestic Refill** | 14.2 kg LPG | Household cooking | Government subsidized / Domestic base rate |
| **19.0 KG Commercial** | 19.0 kg LPG | Hotels, Dhabas, Restaurants, Bakeries | Commercial tariff, rolling credit & security deposits |
| **5.0 KG Chhotu** | 5.0 kg LPG | Migrant workers, students, kiosks | Free Trade LPG (FTL) open market pricing |

### Cylinder Status Lifecycle
1. **Full Cylinders**: Sound, sealed, plant-certified cylinders ready for delivery.
2. **Sound Empty Cylinders**: Discharged cylinders collected from consumers, awaiting return to the bottling plant for refilling.
3. **Quarantined Defective Cylinders**: Mechanically damaged or leaking cylinders segregated in a hazard bay for plant warranty credit.

---

## 3. Key Architecture & Feature Workflows

### 3.1 End-of-Day (EOD) Staff Cash & Empty Reconciliation
At the end of every delivery shift, delivery staff must reconcile their vehicle stock and cash collections with the godown cashier before signing off:
* **Stock Balancing**:
  $$\text{Expected Empty Returned} = \text{Initial Full Loaded} - \text{Remaining Full on Van}$$
  $$\text{Discrepancy} = \text{Actual Physical Empty} - \text{Expected Empty}$$
* **Financial Tally**:
  $$\text{Expected Cash Collection} = \sum (\text{Delivered Refills} \times \text{Selling Price}) - \text{Recorded UPI/Digital Payments} - \text{Recorded Credit}$$
* **Automated Audit**: If actual cash handed over or empties returned mismatch the calculated expectations, an auditable shortfall or surplus record is flagged and appended to the staff member's settlement log.

### 3.2 Defective & Leaking Cylinder Tracker (Plant Warranty Exchange)
Cylinders received from customers or detected in godowns with faults are isolated immediately:
* **Categorized Failure Reasons**:
  * `PIN_LEAK`: Faulty center valve pin escaping gas under pressure.
  * `VALVE_DEFECT`: Damaged brass thread or jammed spindle.
  * `O_RING_DAMAGE`: Ruptured internal rubber sealing ring.
  * `BODY_DENT_LEAK`: Punctures, deep collision dents, foot-ring detachment, or seam weld compromise.
  * `WEIGHT_DISCREPANCY`: Tare weight deviation exceeding permissible Oil Marketing Company (OMC) tolerances.
* **Dispatch to Bottling Plant**: Admin dispatches batches of quarantined defectives back to the bottling plant against a Truck Delivery Challan (TDC) for 1:1 warranty replacement credit.

### 3.3 19 KG Commercial Customer Ledger
Commercial establishments (caterers, restaurants, factories) purchase 19 KG cylinders in high volume with fluctuating empty balances and partial credit:
* **Rolling Empty Tracking**: Real-time tracking of pending empty cylinders held at customer premises.
* **Credit Ledger**: Dynamic ledger tracking cumulative sales invoices, payments received (Cash, NEFT, UPI), and remaining outstanding balance.
* **Rapid Dual Settlement**: One-click settlement modal to simultaneously record return of pending empty cylinders and cash/bank payments to reduce ledger debt.

### 3.4 One-Click EOD Summary Report
A comprehensive daily closing snapshot generated at shift end for agency owners:
* **Stock Metrics**: Opening stock, plant inward received, total cylinders delivered, sound empties recovered, defective units quarantined, and closing godown balance.
* **Financial Metrics**: Total revenue, cash collected, UPI/digital receipts, customer credit granted, daily operational expenses (fuel, driver allowance, maintenance), and net cash in safe.
* **Instant Distribution**: One-click WhatsApp daily brief formatted for agency owners and partners, plus printable thermal/A4 day sheets.

---

## 4. Firestore Database Architecture

```
/users/{userId}
  - uid: string
  - name: string
  - email: string
  - phone: string
  - pin: string (hashed for staff mobile login)
  - role: 'ADMIN' | 'STAFF'
  - active: boolean
  - vehicleNumber: string?
  - createdAt: timestamp

/inventory/godown
  - domestic_14_2: { full: number, empty: number, defective: number }
  - commercial_19: { full: number, empty: number, defective: number }
  - domestic_5:    { full: number, empty: number, defective: number }
  - lastUpdated: timestamp
  - updatedBy: string

/staff_stock/{staffId}
  - staffId: string
  - staffName: string
  - vehicleNo: string
  - domestic_14_2: { full: number, empty: number }
  - commercial_19: { full: number, empty: number }
  - domestic_5:    { full: number, empty: number }
  - pendingCash: number
  - lastShiftDate: string

/customers/{customerId}
  - id: string
  - consumerNumber: string
  - name: string
  - phone: string
  - address: string
  - category: 'DOMESTIC' | 'COMMERCIAL'
  - cylinderType: 'DOMESTIC_14_2' | 'COMMERCIAL_19' | 'DOMESTIC_5'
  - emptyDueCount: number
  - paymentDueAmount: number
  - totalOrdersDelivered: number

/transactions/{transactionId}
  - id: string
  - timestamp: timestamp
  - dateString: string (YYYY-MM-DD)
  - type: 'PURCHASE_INWARD' | 'STAFF_LOAD' | 'CUSTOMER_DELIVERY' | 'STAFF_RETURN' | 'CUSTOMER_RETURN' | 'DEFECTIVE_QUARANTINE' | 'PLANT_DEFECTIVE_DISPATCH' | 'EOD_SETTLEMENT' | 'REVERSAL'
  - performedBy: string (userId)
  - staffId: string?
  - customerId: string?
  - cylinderType: 'DOMESTIC_14_2' | 'COMMERCIAL_19' | 'DOMESTIC_5'
  - quantity: number
  - ratePerUnit: number
  - totalAmount: number
  - paymentMode: 'CASH' | 'UPI' | 'CREDIT' | 'SPLIT'
  - cashAmount: number
  - upiAmount: number
  - emptyReturnedCount: number
  - status: 'COMPLETED' | 'REVERSED'
  - reversalReason: string?

/defectives/{defectiveId}
  - id: string
  - cylinderType: 'DOMESTIC_14_2' | 'COMMERCIAL_19' | 'DOMESTIC_5'
  - source: 'CUSTOMER_RETURN' | 'GODOWN_INSPECTION' | 'STAFF_INWARD'
  - defectType: 'PIN_LEAK' | 'VALVE_DEFECT' | 'O_RING_DAMAGE' | 'BODY_DENT_LEAK' | 'WEIGHT_DISCREPANCY'
  - reportedBy: string
  - serialOrBatchNumber: string?
  - status: 'QUARANTINED' | 'DISPATCHED_TO_PLANT' | 'REPLACED_CREDIT'
  - dispatchChallanNo: string?
  - loggedAt: timestamp

/eod_settlements/{settlementId}
  - id: string
  - date: string (YYYY-MM-DD)
  - staffId: string
  - staffName: string
  - domesticDelivered: number
  - commercialDelivered: number
  - chhotuDelivered: number
  - expectedCash: number
  - actualCashCollected: number
  - cashDifference: number
  - upiCollected: number
  - verifiedBy: string (Admin UID)
  - settledAt: timestamp
  - notes: string

/expenses/{expenseId}
  - id: string
  - date: string
  - category: 'FUEL' | 'STAFF_SALARY' | 'MAINTENANCE' | 'ELECTRICITY' | 'RENT' | 'TEA_SNACKS' | 'OTHER'
  - amount: number
  - description: string
  - paymentMode: 'CASH' | 'UPI'
  - createdBy: string

/settings/pricing
  - domestic_14_2: { purchasePrice: number, sellingPrice: number }
  - commercial_19: { purchasePrice: number, sellingPrice: number }
  - domestic_5:    { purchasePrice: number, sellingPrice: number }
  - updatedBy: string
  - updatedAt: timestamp
```

---

## 5. Screen Specifications & Implementation

### 5.1 Dashboard Screen (`DashboardScreen.tsx`)
* **Real-time Overview Metric Cards**:
  * Total Full Stock in Godown (all types combined).
  * Total Sound Empties available for plant return.
  * Quarantined Defective Cylinders (highlighted in crimson).
  * Pending Empty Cylinders with customers.
  * Total Unpaid Customer Dues & Commercial Credit.
  * Today's Net Revenue & Refills Sold.
* **Quick Action Launcher**:
  * One-Click EOD Summary Report modal.
  * Defective Cylinder Quarantine modal.
  * Rapid Delivery Entry.
  * Vehicle Loading modal.
* **Alerts Panel**: Stock warnings when 14.2 KG or 19 KG reserves fall below safety thresholds.

### 5.2 Godown & Plant Inward Screen (`GodownScreen.tsx`)
* **Cylinder Grid**: 3-column breakdown for 14.2 KG Domestic, 19 KG Commercial, and 5 KG Chhotu displaying Full, Sound Empty, and Quarantined counts.
* **Plant Inward Intake**: Modal to log incoming refinery truckloads, updating Godown Full stock and deducting from supplier balances.
* **Defective Bay Management**: View quarantined leaking/damaged units, filter by defect type, and generate Plant Dispatch Challans for OMC replacement.

### 5.3 Staff Distribution & Van Loading (`StaffDeliveryScreen.tsx`)
* **Staff Van Roster**: Active delivery staff list showing current cylinder load on vehicle, pending cash collection, and shift status.
* **Load Delivery Vehicle**: Transfer full cylinders from godown stock to staff vehicle.
* **Unload / Return**: Transfer unsold fulls or collected sound empties from vehicle back to godown.
* **Shift EOD Reconciliation Modal**: Comprehensive checkout calculating fulls taken vs empties returned vs cash collected, displaying discrepancy tolerances.

### 5.4 Customer & Commercial Ledger Screen (`CustomerScreen.tsx`)
* **Dual View Mode**:
  * **All Customers**: Filterable list by Domestic vs Commercial, consumer number, phone, and outstanding balances.
  * **19 KG Commercial Ledger**: Dedicated ledger for hotels and bulk clients showing open empty cylinders, credit balance, and fast-settle trigger.
* **Commercial Settlement Modal**: Settle empty cylinder returns and record bank/cash credit payments with receipt generation.
* **Customer Profile & History**: Full ledger of deliveries, returns, and payment receipts.

### 5.5 Transactions & Audit Ledger (`TransactionsScreen.tsx`)
* **Live Immutable Log**: Detailed audit log of every movement with unique sequential ID, exact timestamp, operator name, and financial values.
* **Filters**: By Date Range, Transaction Type, Cylinder Variant, and Staff ID.
* **Reversal System**: Admin-only auditable reversal creating an opposite compensating entry with mandatory reason logging.

### 5.6 Reports & Financial Analytics (`ReportsScreen.tsx`)
* **Date-Wise Filterable Reporting**: Real-time calculations of Refill Sales, Purchase Costs, Operating Expenses, and Net Profit.
* **EOD Day-Sheet Generator**: Clean tabular report of opening balances, inward, dispatches, sound returns, defectives, and cash reconciliation.
* **Export Utilities**: Clean print view and WhatsApp digital summary copy.

### 5.7 Pricing & Agency Configuration (`PricingSettingsScreen.tsx`)
* **Editable Price Master**: Real-time adjustment of purchase and consumer selling rates for 14.2 KG, 19 KG, and 5 KG cylinders.
* **Agency Metadata**: Distributorship Name, OMC Brand (Indane / Bharatgas / HP Gas), GSTIN, Godown Address, and Emergency Contact numbers displayed on receipts.

---

## 6. Project Directory Structure

```
├── android/                                  # Native Android Kotlin + Jetpack Compose codebase
│   └── app/src/main/java/com/lpgmanager/app/
│       ├── data/
│       │   ├── model/LpgModels.kt            # Clean English Kotlin data models & enums
│       │   ├── repository/LpgRepository.kt   # Firestore atomic transactions & flows
│       │   └── service/AuthService.kt        # Phone + PIN authentication logic
│       ├── ui/
│       │   ├── screens/LpgMainApp.kt         # Jetpack Compose UI with dark theme
│       │   ├── theme/Color.kt                # Navy (#0B132B) & Orange (#F97316) palette
│       │   └── components/ReceiptShare.kt    # Android PDF print & WhatsApp intent helper
│       └── utils/
│           ├── PdfReceiptGenerator.kt        # Digital PDF thermal receipt generator
│           └── WhatsAppShareHelper.kt        # Instant WhatsApp dispatch helper
├── src/
│   ├── components/
│   │   ├── CommercialSettlementModal.tsx     # 19 KG commercial credit & empty settlement
│   │   ├── CustomerModal.tsx                 # Add / edit customer details
│   │   ├── DefectiveCylinderModal.tsx        # Log & quarantine leaking cylinders
│   │   ├── DeliveryModal.tsx                 # Record staff-to-customer deliveries
│   │   ├── EODSettlementModal.tsx            # Staff end-of-day cash & empty tally checkout
│   │   ├── EODSummaryModal.tsx               # One-click agency day summary & WhatsApp share
│   │   ├── ExpenseModal.tsx                  # Record daily operating expenses
│   │   ├── Header.tsx                        # Global navigation & quick action triggers
│   │   ├── InwardStockModal.tsx              # Plant truckload intake modal
│   │   ├── ReturnEmptyModal.tsx              # Customer empty return logger
│   │   ├── ReversalModal.tsx                 # Auditable transaction reversal modal
│   │   ├── StaffModal.tsx                    # Add / manage delivery staff
│   │   ├── ThermalReceiptModal.tsx           # Printable digital receipt & WhatsApp share
│   │   └── VehicleLoadModal.tsx              # Godown-to-van cylinder transfer
│   ├── data/
│   │   └── initialData.ts                    # Realistic demo agency inventory & test data
│   ├── screens/
│   │   ├── CustomerScreen.tsx                # Customer database & 19 KG commercial ledger
│   │   ├── DashboardScreen.tsx               # High-level operational metrics & stock alerts
│   │   ├── GodownScreen.tsx                  # Godown stock & quarantined defective bay
│   │   ├── PricingSettingsScreen.tsx         # OMC pricing, agency info & user management
│   │   ├── ReportsScreen.tsx                 # Profit, sales, expense, and stock reports
│   │   ├── StaffDeliveryScreen.tsx           # Staff delivery roster, van stock & settlements
│   │   └── TransactionsScreen.tsx            # Immutable audit trail & reversal history
│   ├── services/
│   │   └── lpgStorage.ts                     # LocalStorage persistence & Firestore sync engine
│   ├── types/
│   │   └── lpg.ts                            # TypeScript domain interfaces, unions & types
│   ├── App.tsx                               # Primary routing, role switcher & tab controller
│   ├── index.css                             # Tailwind CSS setup & print media styling
│   └── main.tsx                              # React DOM mount point
├── firestore.rules                           # Production security rules enforcing RBAC
├── metadata.json                             # AI Studio metadata
└── vite.config.ts                            # Vite build configuration
```

---

## 7. Verification & Quality Assurance Checklist

- [x] **Zero Non-English Text**: Comprehensive automated regex scan confirms 100% pure English across all files, components, and receipt formats.
- [x] **High-Contrast Typography**: Applied `#FFFFFF` for primary titles/metrics and `#94A3B8` for secondary copy against dark navy backgrounds.
- [x] **EOD Staff Reconciliation Flow**: Verified math calculations for opening stock, refills delivered, sound empties returned, cash collections, and discrepancy logging.
- [x] **Defective Cylinder Tracker**: Verified logging of defect types (`PIN_LEAK`, `VALVE_DEFECT`, `O_RING_DAMAGE`, `BODY_DENT_LEAK`, `WEIGHT_DISCREPANCY`) and quarantine stock segregation.
- [x] **19 KG Commercial Ledger**: Verified dynamic tracking of rolling empty cylinders and balance dues with instantaneous payment settlement.
- [x] **One-Click EOD Summary Report**: Verified generation of complete daily stock movements, revenue breakdown, and clean WhatsApp summary formatting.
- [x] **Type Safety & Build**: Clean pass on `lint_applet` (`tsc --noEmit`) and Vite compilation.
