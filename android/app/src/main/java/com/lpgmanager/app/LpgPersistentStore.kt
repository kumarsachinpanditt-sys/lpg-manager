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

data class SavedDelivery(
    val id: String,
    val customerId: String,
    val customerName: String,
    val cylinderType: String,
    val quantity: Int,
    val emptyReturned: Int,
    val amount: Double,
    val paymentMode: String,
    val createdAt: Long
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
                    createdAt = item.optLong("createdAt")
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
            })
        }
        prefs.edit().putString("deliveries", array.toString()).apply()
    }
}
