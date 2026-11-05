package com.lpgmanager.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Local persistent storage for LPG Manager.
 * Data is kept on this device and survives app restarts.
 */
data class SavedCustomer(
    val id: String,
    val name: String,
    val phone: String,
    val address: String = "",
    val cylinderType: String = "14.2 KG Domestic",
    val openingDue: Double = 0.0,
    val pendingEmpties: Int = 0
)

data class SavedStaff(val id: String, val name: String, val phone: String = "", val role: String = "Staff", val pin: String = "")
data class SavedGodown(val id: String, val name: String)
data class SavedCashHandover(val id: String, val staffId: String, val staffName: String, val amount: Double, val createdAt: Long, val note: String = "")
data class SavedStockMovement(val id: String, val cylinderType: String, val action: String, val quantity: Int, val godownName: String, val createdAt: Long, val note: String = "")

data class SavedDelivery(
    val id: String,
    val customerId: String,
    val customerName: String,
    val cylinderType: String,
    val quantity: Int,
    val emptyReturned: Int,
    val amount: Double,
    val paymentMode: String,
    val createdAt: Long,
    val staffId: String = "admin",
    val staffName: String = "Admin",
    val paidAmount: Double = amount,
    val dueAmount: Double = (amount - paidAmount).coerceAtLeast(0.0),
    val receiptNo: String = id.take(8).uppercase()
)

class LpgPersistentStore(context: Context) {
    private val prefs = context.getSharedPreferences("lpg_manager_data", Context.MODE_PRIVATE)

    fun readInt(key: String, defaultValue: Int = 0): Int = prefs.getInt(key, defaultValue)
    fun writeInt(key: String, value: Int) { prefs.edit().putInt(key, value).apply() }
    fun readString(key: String, defaultValue: String = ""): String = prefs.getString(key, defaultValue) ?: defaultValue
    fun writeString(key: String, value: String) { prefs.edit().putString(key, value).apply() }


    fun staff(): List<SavedStaff> {
        val a = JSONArray(prefs.getString("staff", "[]"))
        return buildList { for (i in 0 until a.length()) { val o = a.optJSONObject(i) ?: continue; add(SavedStaff(o.optString("id"), o.optString("name"), o.optString("phone"), o.optString("role", "Staff"), o.optString("pin"))) } }
    }
    fun saveStaff(items: List<SavedStaff>) {
        val a = JSONArray()
        items.forEach { a.put(JSONObject().apply { put("id", it.id); put("name", it.name); put("phone", it.phone); put("role", it.role); put("pin", it.pin) }) }
        prefs.edit().putString("staff", a.toString()).apply()
    }
    fun godowns(): List<SavedGodown> {
        val a = JSONArray(prefs.getString("godowns", "[]"))
        val result = buildList { for (i in 0 until a.length()) { val o = a.optJSONObject(i) ?: continue; add(SavedGodown(o.optString("id"), o.optString("name"))) } }
        if (result.isNotEmpty()) return result
        val initial = listOf(SavedGodown("default-godown", "Main Godown"))
        saveGodowns(initial)
        return initial
    }
    fun saveGodowns(items: List<SavedGodown>) {
        val a = JSONArray()
        items.forEach { a.put(JSONObject().apply { put("id", it.id); put("name", it.name) }) }
        prefs.edit().putString("godowns", a.toString()).apply()
    }


    fun stockMovements(): List<SavedStockMovement> {
        val a = JSONArray(prefs.getString("stock_movements", "[]"))
        return buildList {
            for (i in 0 until a.length()) {
                val o = a.optJSONObject(i) ?: continue
                add(SavedStockMovement(o.optString("id"), o.optString("cylinderType"), o.optString("action"), o.optInt("quantity"), o.optString("godownName"), o.optLong("createdAt"), o.optString("note")))
            }
        }
    }
    fun saveStockMovements(items: List<SavedStockMovement>) {
        val a = JSONArray()
        items.take(500).forEach { m ->
            a.put(JSONObject().apply {
                put("id", m.id); put("cylinderType", m.cylinderType); put("action", m.action)
                put("quantity", m.quantity); put("godownName", m.godownName); put("createdAt", m.createdAt); put("note", m.note)
            })
        }
        prefs.edit().putString("stock_movements", a.toString()).apply()
    }

    fun customers(): List<SavedCustomer> {
        val array = JSONArray(prefs.getString("customers", "[]"))
        return buildList {
            for (i in 0 until array.length()) {
                val item = array.optJSONObject(i) ?: continue
                add(SavedCustomer(
                    id = item.optString("id"),
                    name = item.optString("name"),
                    phone = item.optString("phone"),
                    address = item.optString("address"),
                    cylinderType = item.optString("cylinderType", "14.2 KG Domestic"),
                    openingDue = item.optDouble("openingDue", 0.0),
                    pendingEmpties = item.optInt("pendingEmpties", 0)
                ))
            }
        }
    }

    fun saveCustomers(customers: List<SavedCustomer>) {
        val array = JSONArray()
        customers.forEach { customer ->
            array.put(JSONObject().apply {
                put("id", customer.id)
                put("name", customer.name)
                put("phone", customer.phone)
                put("address", customer.address)
                put("cylinderType", customer.cylinderType)
                put("openingDue", customer.openingDue)
                put("pendingEmpties", customer.pendingEmpties)
            })
        }
        prefs.edit().putString("customers", array.toString()).apply()
    }


    fun cashHandovers(): List<SavedCashHandover> {
        val a = JSONArray(prefs.getString("cash_handovers", "[]"))
        return buildList {
            for (i in 0 until a.length()) {
                val o = a.optJSONObject(i) ?: continue
                add(SavedCashHandover(o.optString("id"), o.optString("staffId"), o.optString("staffName"), o.optDouble("amount"), o.optLong("createdAt"), o.optString("note")))
            }
        }
    }
    fun saveCashHandovers(items: List<SavedCashHandover>) {
        val a = JSONArray()
        items.take(1000).forEach { h ->
            a.put(JSONObject().apply {
                put("id", h.id); put("staffId", h.staffId); put("staffName", h.staffName)
                put("amount", h.amount); put("createdAt", h.createdAt); put("note", h.note)
            })
        }
        prefs.edit().putString("cash_handovers", a.toString()).apply()
    }

    fun deliveries(): List<SavedDelivery> {
        val array = JSONArray(prefs.getString("deliveries", "[]"))
        return buildList {
            for (i in 0 until array.length()) {
                val item = array.optJSONObject(i) ?: continue
                add(SavedDelivery(
                    id = item.optString("id"),
                    customerId = item.optString("customerId"),
                    customerName = item.optString("customerName"),
                    cylinderType = item.optString("cylinderType"),
                    quantity = item.optInt("quantity"),
                    emptyReturned = item.optInt("emptyReturned"),
                    amount = item.optDouble("amount"),
                    paymentMode = item.optString("paymentMode"),
                    createdAt = item.optLong("createdAt"),
                    staffId = item.optString("staffId", "admin"),
                    staffName = item.optString("staffName", "Admin"),
                    paidAmount = item.optDouble("paidAmount", item.optDouble("amount")),
                    dueAmount = item.optDouble("dueAmount", 0.0),
                    receiptNo = item.optString("receiptNo", item.optString("id").take(8).uppercase())
                ))
            }
        }
    }

    fun saveDeliveries(deliveries: List<SavedDelivery>) {
        val array = JSONArray()
        deliveries.forEach { delivery ->
            array.put(JSONObject().apply {
                put("id", delivery.id)
                put("customerId", delivery.customerId)
                put("customerName", delivery.customerName)
                put("cylinderType", delivery.cylinderType)
                put("quantity", delivery.quantity)
                put("emptyReturned", delivery.emptyReturned)
                put("amount", delivery.amount)
                put("paymentMode", delivery.paymentMode)
                put("createdAt", delivery.createdAt)
                put("staffId", delivery.staffId)
                put("staffName", delivery.staffName)
                put("paidAmount", delivery.paidAmount)
                put("dueAmount", delivery.dueAmount)
                put("receiptNo", delivery.receiptNo)
            })
        }
        prefs.edit().putString("deliveries", array.toString()).apply()
    }
}
