package com.lpgmanager.app.data.repository

import com.google.firebase.Timestamp
import com.google.firebase.firestore.FirebaseFirestore
import com.lpgmanager.app.data.model.*
import kotlinx.coroutines.tasks.await
import java.util.UUID

class LpgFirestoreRepository(
    private val firestore: FirebaseFirestore
) {

    /**
     * ATOMIC: Deliver cylinder to customer by staff member
     * - Decrements staff full stock
     * - Increments staff empty stock (if returned)
     * - Updates customer cylinder dues (if not returned)
     * - Records cash/UPI in staff hand
     * - Appends immutable transaction ledger record
     */
    suspend fun deliverToCustomer(
        staffId: String,
        staffName: String,
        customer: CustomerRecord,
        cylinderType: String,
        quantity: Int,
        emptyReturned: Int,
        unitPrice: Double,
        paidAmount: Double,
        paymentMode: PaymentMode,
        notes: String
    ): Result<String> {
        return try {
            val txnId = "TXN-${System.currentTimeMillis()}-${UUID.randomUUID().toString().take(6).uppercase()}"
            val totalAmount = quantity * unitPrice
            val balanceDue = (totalAmount - paidAmount).coerceAtLeast(0.0)

            firestore.runTransaction { transaction ->
                val staffRef = firestore.collection("staff_stock").document(staffId)
                val customerRef = firestore.collection("customers").document(customer.id)
                val txnRef = firestore.collection("transactions").document(txnId)

                val staffSnap = transaction.get(staffRef)
                if (!staffSnap.exists()) {
                    throw IllegalStateException("Staff inventory record not found")
                }

                // Check staff current full stock
                val stockKey = when (cylinderType) {
                    "14.2KG" -> "stock14Kg"
                    "19KG" -> "stock19Kg"
                    "5KG" -> "stock5Kg"
                    else -> "stock14Kg"
                }

                @Suppress("UNCHECKED_CAST")
                val currentStock = staffSnap.get(stockKey) as? Map<String, Any> ?: emptyMap()
                val currentFull = (currentStock["full"] as? Number)?.toInt() ?: 0
                val currentEmpty = (currentStock["empty"] as? Number)?.toInt() ?: 0

                if (currentFull < quantity) {
                    throw IllegalStateException("Insufficient stock! Available: $currentFull, Requested: $quantity")
                }

                // Update Staff stock
                val updatedFull = currentFull - quantity
                val updatedEmpty = currentEmpty + emptyReturned

                val newStockMap = mapOf(
                    "full" to updatedFull,
                    "empty" to updatedEmpty,
                    "defective" to ((currentStock["defective"] as? Number)?.toInt() ?: 0)
                )

                val currentCash = staffSnap.getDouble("cashInHand") ?: 0.0
                val currentUpi = staffSnap.getDouble("upiInHand") ?: 0.0

                val newCash = if (paymentMode == PaymentMode.CASH) currentCash + paidAmount else currentCash
                val newUpi = if (paymentMode == PaymentMode.UPI) currentUpi + paidAmount else currentUpi

                transaction.update(staffRef, mapOf(
                    stockKey to newStockMap,
                    "cashInHand" to newCash,
                    "upiInHand" to newUpi,
                    "lastUpdated" to Timestamp.now()
                ))

                // Update Customer Dues
                val pendingEmptyCylinders = quantity - emptyReturned
                val existingDues = customer.cylinderDues.toMutableMap()
                val currentCylDue = existingDues[cylinderType] ?: 0
                existingDues[cylinderType] = (currentCylDue + pendingEmptyCylinders).coerceAtLeast(0)

                val existingPaymentDue = customer.paymentDue
                val updatedPaymentDue = existingPaymentDue + balanceDue

                transaction.update(customerRef, mapOf(
                    "cylinderDues" to existingDues,
                    "paymentDue" to updatedPaymentDue
                ))

                // Append Immutable Transaction
                val txn = hashMapOf(
                    "id" to txnId,
                    "txnType" to TransactionType.STAFF_TO_CUSTOMER.name,
                    "timestamp" to Timestamp.now(),
                    "userId" to staffId,
                    "userName" to staffName,
                    "staffId" to staffId,
                    "staffName" to staffName,
                    "customerId" to customer.id,
                    "customerName" to customer.name,
                    "cylinderType" to cylinderType,
                    "quantity" to quantity,
                    "emptyReturned" to emptyReturned,
                    "unitPrice" to unitPrice,
                    "totalAmount" to totalAmount,
                    "paymentMode" to paymentMode.name,
                    "paymentStatus" to if (balanceDue == 0.0) "PAID" else if (paidAmount > 0) "PARTIAL" else "DUE",
                    "paidAmount" to paidAmount,
                    "balanceDue" to balanceDue,
                    "notes" to notes,
                    "isReversal" to false
                )

                transaction.set(txnRef, txn)
                txnId
            }.await().let { Result.success(it) }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * ATOMIC: Issue stock from Godown to Delivery Staff
     */
    suspend fun issueStockToStaff(
        adminId: String,
        adminName: String,
        staffId: String,
        staffName: String,
        cylinderType: String,
        quantity: Int
    ): Result<String> {
        return try {
            val txnId = "ISSUE-${System.currentTimeMillis()}-${UUID.randomUUID().toString().take(4).uppercase()}"

            firestore.runTransaction { transaction ->
                val godownRef = firestore.collection("godown_stock").document(cylinderType)
                val staffRef = firestore.collection("staff_stock").document(staffId)
                val txnRef = firestore.collection("transactions").document(txnId)

                val godownSnap = transaction.get(godownRef)
                val staffSnap = transaction.get(staffRef)

                val godownFull = godownSnap.getLong("fullQuantity")?.toInt() ?: 0
                if (godownFull < quantity) {
                    throw IllegalStateException("Insufficient Godown stock! Available: $godownFull")
                }

                // Decrement godown full
                transaction.update(godownRef, mapOf(
                    "fullQuantity" to (godownFull - quantity),
                    "lastUpdated" to Timestamp.now()
                ))

                // Increment staff full
                val stockKey = when (cylinderType) {
                    "14.2KG" -> "stock14Kg"
                    "19KG" -> "stock19Kg"
                    "5KG" -> "stock5Kg"
                    else -> "stock14Kg"
                }

                @Suppress("UNCHECKED_CAST")
                val cur = staffSnap.get(stockKey) as? Map<String, Any> ?: emptyMap()
                val curFull = (cur["full"] as? Number)?.toInt() ?: 0
                val curEmpty = (cur["empty"] as? Number)?.toInt() ?: 0

                transaction.update(staffRef, mapOf(
                    stockKey to mapOf(
                        "full" to curFull + quantity,
                        "empty" to curEmpty,
                        "defective" to 0
                    ),
                    "lastUpdated" to Timestamp.now()
                ))

                // Append transaction
                val txn = hashMapOf(
                    "id" to txnId,
                    "txnType" to TransactionType.GODOWN_TO_STAFF.name,
                    "timestamp" to Timestamp.now(),
                    "userId" to adminId,
                    "userName" to adminName,
                    "staffId" to staffId,
                    "staffName" to staffName,
                    "cylinderType" to cylinderType,
                    "quantity" to quantity,
                    "emptyReturned" to 0,
                    "totalAmount" to 0.0,
                    "paymentMode" to PaymentMode.NA.name,
                    "isReversal" to false
                )
                transaction.set(txnRef, txn)
                txnId
            }.await().let { Result.success(it) }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * ATOMIC: Staff Day-End Deposit to Godown
     */
    suspend fun dayEndDeposit(
        adminId: String,
        adminName: String,
        staffId: String,
        staffName: String,
        returnedFull14: Int,
        returnedEmpty14: Int,
        returnedFull19: Int,
        returnedEmpty19: Int,
        cashSettled: Double,
        upiSettled: Double
    ): Result<String> {
        return try {
            val txnId = "CLOSE-${System.currentTimeMillis()}-${UUID.randomUUID().toString().take(4).uppercase()}"

            firestore.runTransaction { transaction ->
                val staffRef = firestore.collection("staff_stock").document(staffId)
                val godown14Ref = firestore.collection("godown_stock").document("14.2KG")
                val godown19Ref = firestore.collection("godown_stock").document("19KG")
                val txnRef = firestore.collection("transactions").document(txnId)

                // Update Godown 14.2KG
                val g14 = transaction.get(godown14Ref)
                val g14Full = g14.getLong("fullQuantity")?.toInt() ?: 0
                val g14Empty = g14.getLong("emptyQuantity")?.toInt() ?: 0
                transaction.update(godown14Ref, mapOf(
                    "fullQuantity" to g14Full + returnedFull14,
                    "emptyQuantity" to g14Empty + returnedEmpty14,
                    "lastUpdated" to Timestamp.now()
                ))

                // Update Godown 19KG
                val g19 = transaction.get(godown19Ref)
                val g19Full = g19.getLong("fullQuantity")?.toInt() ?: 0
                val g19Empty = g19.getLong("emptyQuantity")?.toInt() ?: 0
                transaction.update(godown19Ref, mapOf(
                    "fullQuantity" to g19Full + returnedFull19,
                    "emptyQuantity" to g19Empty + returnedEmpty19,
                    "lastUpdated" to Timestamp.now()
                ))

                // Reset Staff Stock & Cash In Hand
                transaction.update(staffRef, mapOf(
                    "stock14Kg" to mapOf("full" to 0, "empty" to 0, "defective" to 0),
                    "stock19Kg" to mapOf("full" to 0, "empty" to 0, "defective" to 0),
                    "stock5Kg" to mapOf("full" to 0, "empty" to 0, "defective" to 0),
                    "cashInHand" to 0.0,
                    "upiInHand" to 0.0,
                    "lastUpdated" to Timestamp.now()
                ))

                // Log Closing Txn
                val txn = hashMapOf(
                    "id" to txnId,
                    "txnType" to TransactionType.STAFF_DAY_END_RETURN.name,
                    "timestamp" to Timestamp.now(),
                    "userId" to adminId,
                    "userName" to adminName,
                    "staffId" to staffId,
                    "staffName" to staffName,
                    "cylinderType" to "MIXED",
                    "quantity" to (returnedFull14 + returnedFull19),
                    "emptyReturned" to (returnedEmpty14 + returnedEmpty19),
                    "paidAmount" to (cashSettled + upiSettled),
                    "notes" to "Cash: ₹$cashSettled, UPI: ₹$upiSettled",
                    "isReversal" to false
                )
                transaction.set(txnRef, txn)
                txnId
            }.await().let { Result.success(it) }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * ATOMIC ADMIN REVERSAL: Reverses a prior transaction with full audit trail
     */
    suspend fun reverseTransaction(
        adminId: String,
        adminName: String,
        originalTxnId: String,
        reason: String
    ): Result<String> {
        return try {
            val revTxnId = "REV-${System.currentTimeMillis()}-${UUID.randomUUID().toString().take(4).uppercase()}"

            firestore.runTransaction { transaction ->
                val origRef = firestore.collection("transactions").document(originalTxnId)
                val origSnap = transaction.get(origRef)

                if (!origSnap.exists()) {
                    throw IllegalStateException("Original transaction not found")
                }
                if (origSnap.getBoolean("isReversal") == true) {
                    throw IllegalStateException("Transaction has already been reversed")
                }

                val cylinderType = origSnap.getString("cylinderType") ?: "14.2KG"
                val quantity = origSnap.getLong("quantity")?.toInt() ?: 0
                val emptyReturned = origSnap.getLong("emptyReturned")?.toInt() ?: 0
                val paidAmount = origSnap.getDouble("paidAmount") ?: 0.0
                val staffId = origSnap.getString("staffId") ?: ""
                val customerId = origSnap.getString("customerId") ?: ""

                // Restore staff stock & cash if it was a customer delivery
                if (staffId.isNotEmpty()) {
                    val staffRef = firestore.collection("staff_stock").document(staffId)
                    val staffSnap = transaction.get(staffRef)
                    if (staffSnap.exists()) {
                        val stockKey = when (cylinderType) {
                            "14.2KG" -> "stock14Kg"
                            "19KG" -> "stock19Kg"
                            else -> "stock5Kg"
                        }
                        @Suppress("UNCHECKED_CAST")
                        val cur = staffSnap.get(stockKey) as? Map<String, Any> ?: emptyMap()
                        val curFull = (cur["full"] as? Number)?.toInt() ?: 0
                        val curEmpty = (cur["empty"] as? Number)?.toInt() ?: 0

                        val newCash = ((staffSnap.getDouble("cashInHand") ?: 0.0) - paidAmount).coerceAtLeast(0.0)
                        transaction.update(staffRef, mapOf(
                            stockKey to mapOf(
                                "full" to curFull + quantity,
                                "empty" to (curEmpty - emptyReturned).coerceAtLeast(0),
                                "defective" to 0
                            ),
                            "cashInHand" to newCash
                        ))
                    }
                }

                // Restore customer dues if applicable
                if (customerId.isNotEmpty()) {
                    val custRef = firestore.collection("customers").document(customerId)
                    val custSnap = transaction.get(custRef)
                    if (custSnap.exists()) {
                        @Suppress("UNCHECKED_CAST")
                        val cylDues = (custSnap.get("cylinderDues") as? Map<String, Any>)?.toMutableMap() ?: mutableMapOf()
                        val currentDue = (cylDues[cylinderType] as? Number)?.toInt() ?: 0
                        val deltaEmpty = quantity - emptyReturned
                        cylDues[cylinderType] = (currentDue - deltaEmpty).coerceAtLeast(0)

                        val curPayDue = custSnap.getDouble("paymentDue") ?: 0.0
                        val origBalDue = origSnap.getDouble("balanceDue") ?: 0.0
                        val newPayDue = (curPayDue - origBalDue).coerceAtLeast(0.0)

                        transaction.update(custRef, mapOf(
                            "cylinderDues" to cylDues,
                            "paymentDue" to newPayDue
                        ))
                    }
                }

                // Mark original transaction as reversed
                transaction.update(origRef, mapOf(
                    "isReversal" to true,
                    "reversedTxnId" to revTxnId,
                    "reversalReason" to reason
                ))

                // Insert reversal transaction
                val revRef = firestore.collection("transactions").document(revTxnId)
                val revRecord = hashMapOf(
                    "id" to revTxnId,
                    "txnType" to TransactionType.ADMIN_REVERSAL.name,
                    "timestamp" to Timestamp.now(),
                    "userId" to adminId,
                    "userName" to adminName,
                    "staffId" to staffId,
                    "customerId" to customerId,
                    "cylinderType" to cylinderType,
                    "quantity" to -quantity,
                    "emptyReturned" to -emptyReturned,
                    "paidAmount" to -paidAmount,
                    "reversedTxnId" to originalTxnId,
                    "reversalReason" to reason,
                    "isReversal" to true,
                    "notes" to "Reversal of $originalTxnId: $reason"
                )
                transaction.set(revRef, revRecord)
                revTxnId
            }.await().let { Result.success(it) }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
