package com.lpgmanager.app.data.model

import com.google.firebase.Timestamp

enum class UserRole {
    ADMIN,
    STAFF
}

enum class CylinderCategory(val displayName: String, val subtitle: String) {
    DOMESTIC_14_2("14.2 KG Domestic", "Subsidized / Domestic Refill"),
    COMMERCIAL_19("19 KG Commercial", "Commercial Blue Cylinder"),
    SMALL_5("5 KG Chhotu", "Small Portable Cylinder")
}

enum class TransactionType(val displayName: String, val subtitle: String) {
    SUPPLIER_INWARD("Plant Stock Inward", "LPG Plant Supply Receipt"),
    GODOWN_TO_STAFF("Issue to Staff", "Vehicle Loading from Godown"),
    STAFF_TO_CUSTOMER("Customer Delivery", "Consumer Refill Fulfillment"),
    CUSTOMER_EMPTY_RETURN("Customer Empty Return", "Sound Cylinder Recovery"),
    STAFF_DAY_END_RETURN("Staff Day-End Deposit", "Cash & Empty Godown Return"),
    PAYMENT_COLLECTION("Payment Due Collection", "Credit Balance Settlement"),
    DEFECTIVE_LOG("Defective Quarantined", "Pin or Valve Leak Segregation"),
    DEFECTIVE_PLANT_DISPATCH("Defective to Plant", "Warranty Replacement Claim"),
    ADMIN_REVERSAL("Auditable Reversal", "Audit Ledger Correction")
}

enum class DefectType {
    PIN_LEAK,
    VALVE_DEFECT,
    O_RING_DAMAGE,
    BODY_DENT_LEAK,
    WEIGHT_DISCREPANCY
}

enum class PaymentMode {
    CASH,
    UPI,
    CREDIT,
    NA
}

data class UserProfile(
    val uid: String = "",
    val name: String = "",
    val email: String = "",
    val role: UserRole = UserRole.STAFF,
    val phone: String = "",
    val active: Boolean = true
)

data class CylinderPricing(
    val cylinderType: String = "", // "14.2KG", "19KG", "5KG"
    val refillPrice: Double = 0.0,
    val purchasePrice: Double = 0.0,
    val depositPrice: Double = 0.0,
    val updatedAt: Timestamp = Timestamp.now(),
    val updatedBy: String = ""
)

data class StockCount(
    val full: Int = 0,
    val empty: Int = 0,
    val defective: Int = 0
)

data class GodownInventory(
    val cylinderType: String = "",
    val fullQuantity: Int = 0,
    val emptyQuantity: Int = 0,
    val defectiveQuantity: Int = 0,
    val lastUpdated: Timestamp = Timestamp.now()
)

data class StaffInventory(
    val staffId: String = "",
    val staffName: String = "",
    val phone: String = "",
    val stock14Kg: StockCount = StockCount(),
    val stock19Kg: StockCount = StockCount(),
    val stock5Kg: StockCount = StockCount(),
    val cashInHand: Double = 0.0,
    val upiInHand: Double = 0.0,
    val lastUpdated: Timestamp = Timestamp.now()
)

data class CustomerRecord(
    val id: String = "",
    val consumerNo: String = "",
    val name: String = "",
    val firmName: String = "",
    val gstin: String = "",
    val mobile: String = "",
    val address: String = "",
    val type: String = "DOMESTIC", // DOMESTIC or COMMERCIAL
    val cylinderDues: Map<String, Int> = mapOf("14.2KG" to 0, "19KG" to 0, "5KG" to 0),
    val paymentDue: Double = 0.0,
    val createdAt: Timestamp = Timestamp.now()
)

data class DefectiveLogRecord(
    val id: String = "",
    val cylinderType: String = "14.2KG",
    val defectType: DefectType = DefectType.PIN_LEAK,
    val serialNo: String = "",
    val source: String = "GODOWN",
    val reportedBy: String = "",
    val status: String = "QUARANTINED",
    val timestamp: Timestamp = Timestamp.now()
)

data class LpgTransaction(
    val id: String = "",
    val txnType: String = "",
    val timestamp: Timestamp = Timestamp.now(),
    val userId: String = "",
    val userName: String = "",
    val staffId: String = "",
    val staffName: String = "",
    val customerId: String = "",
    val customerName: String = "",
    val cylinderType: String = "",
    val quantity: Int = 0,
    val emptyReturned: Int = 0,
    val unitPrice: Double = 0.0,
    val totalAmount: Double = 0.0,
    val paymentMode: String = "CASH",
    val paymentStatus: String = "PAID",
    val paidAmount: Double = 0.0,
    val balanceDue: Double = 0.0,
    val notes: String = "",
    val isReversal: Boolean = false,
    val reversedTxnId: String = "",
    val reversalReason: String = ""
)

data class AgencyExpense(
    val id: String = "",
    val category: String = "",
    val amount: Double = 0.0,
    val description: String = "",
    val date: String = "",
    val paymentMode: String = "CASH",
    val recordedBy: String = ""
)
