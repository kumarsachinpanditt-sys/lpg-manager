package com.lpgmanager.app

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.UUID

private val Navy = Color(0xFF102A56)
private val Blue = Color(0xFF1769AA)
private val Yellow = Color(0xFFFFC928)
private val Page = Color(0xFFF3F6FA)
private val Ink = Color(0xFF172B4D)
private val Green = Color(0xFF16865B)
private val Red = Color(0xFFB83232)
private val CylinderTypes = listOf("14.2 KG Domestic", "5 KG Small", "19 KG Commercial")

private data class StockRow(
    val type: String,
    val godownFull: Int,
    val godownEmpty: Int,
    val vanFull: Int,
    val vanEmpty: Int,
    val defective: Int
)

private enum class PageTab(val label: String) {
    HOME("Home"), STOCK("Stock"), CUSTOMERS("Customers"), DELIVERY("Delivery"), REPORTS("Reports")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LpgAppRoot() {
    val context = LocalContext.current
    val store = remember { LpgPersistentStore(context) }
    var isLoggedIn by remember { mutableStateOf(store.readString("login_phone").isNotBlank()) }
    var tab by remember { mutableStateOf(PageTab.HOME) }
    var phone by remember { mutableStateOf("") }
    var pin by remember { mutableStateOf("") }
    var loginError by remember { mutableStateOf("") }
    var customers by remember { mutableStateOf(store.customers()) }
    var deliveries by remember { mutableStateOf(store.deliveries()) }
    var stockVersion by remember { mutableIntStateOf(0) }
    var notice by remember { mutableStateOf("") }

    fun stock(type: String, location: String): Int {
        stockVersion
        return store.readInt("stock_${type}_${location}", 0)
    }
    fun setStock(type: String, location: String, value: Int) {
        store.writeInt("stock_${type}_${location}", value.coerceAtLeast(0))
        stockVersion++
    }
    fun row(type: String) = StockRow(type, stock(type, "gf"), stock(type, "ge"),
        stock(type, "vf"), stock(type, "ve"), stock(type, "def"))

    MaterialTheme(colorScheme = lightColorScheme(primary = Blue, secondary = Yellow, background = Page)) {
        if (!isLoggedIn) {
            LoginScreen(
                phone = phone, onPhone = { phone = it.filter(Char::isDigit).take(10) },
                pin = pin, onPin = { pin = it.filter(Char::isDigit).take(4) },
                error = loginError,
                onContinue = {
                    val savedPhone = store.readString("login_phone")
                    val savedPin = store.readString("login_pin")
                    if (phone.length != 10 || pin.length != 4) {
                        loginError = "Enter a 10-digit mobile number and 4-digit PIN."
                    } else if (savedPhone.isBlank()) {
                        store.writeString("login_phone", phone)
                        store.writeString("login_pin", pin)
                        isLoggedIn = true
                    } else if (phone == savedPhone && pin == savedPin) {
                        isLoggedIn = true
                    } else {
                        loginError = "Mobile number or PIN is incorrect."
                    }
                }
            )
        } else {
            Scaffold(
                containerColor = Page,
                topBar = {
                    TopAppBar(
                        title = {
                            Column {
                                Text("LPG MANAGER", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                                Text("Bharat Gas Agency", color = Color(0xFFD8E7F7), fontSize = 11.sp)
                            }
                        },
                        actions = {
                            IconButton(onClick = {
                                isLoggedIn = false
                                phone = ""
                                pin = ""
                            }) { Icon(Icons.Default.Logout, contentDescription = "Logout", tint = Color.White) }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = Navy)
                    )
                },
                bottomBar = {
                    NavigationBar(containerColor = Color.White) {
                        PageTab.values().forEach { item ->
                            NavigationBarItem(
                                selected = tab == item,
                                onClick = { tab = item; notice = "" },
                                icon = {
                                    Icon(when (item) {
                                        PageTab.HOME -> Icons.Default.Dashboard
                                        PageTab.STOCK -> Icons.Default.Inventory
                                        PageTab.CUSTOMERS -> Icons.Default.People
                                        PageTab.DELIVERY -> Icons.Default.LocalShipping
                                        PageTab.REPORTS -> Icons.Default.Assessment
                                    }, contentDescription = item.label)
                                },
                                label = { Text(item.label, fontSize = 10.sp) },
                                colors = NavigationBarItemDefaults.colors(selectedIconColor = Blue, indicatorColor = Yellow.copy(alpha = .35f))
                            )
                        }
                    }
                }
            ) { padding ->
                Column(Modifier.fillMaxSize().padding(padding)) {
                    if (notice.isNotBlank()) {
                        Text(notice, color = Green, modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp))
                    }
                    when (tab) {
                        PageTab.HOME -> HomeScreen(::row, customers.size, deliveries.size)
                        PageTab.STOCK -> StockScreen(::row, ::stock, ::setStock, onNotice = { notice = it })
                        PageTab.CUSTOMERS -> CustomersScreen(
                            customers = customers,
                            onSave = {
                                customers = it
                                store.saveCustomers(it)
                                notice = "Customer list saved."
                            }
                        )
                        PageTab.DELIVERY -> DeliveryScreen(
                            customers = customers,
                            rows = CylinderTypes.associateWith(::row),
                            onDeliver = { customer, type, qty, empties, amount, payment ->
                                val current = row(type)
                                if (current.vanFull < qty) {
                                    notice = "Not enough filled cylinders in van."
                                } else if (empties > current.vanEmpty + qty) {
                                    notice = "Returned empty quantity is more than delivered quantity."
                                } else {
                                    setStock(type, "vf", current.vanFull - qty)
                                    setStock(type, "ve", current.vanEmpty + empties)
                                    val updated = customers.map {
                                        if (it.id == customer.id) it.copy(
                                            openingDue = it.openingDue + if (payment == "Credit") amount else 0.0,
                                            pendingEmpties = (it.pendingEmpties + qty - empties).coerceAtLeast(0)
                                        ) else it
                                    }
                                    customers = updated
                                    store.saveCustomers(updated)
                                    val record = SavedDelivery(UUID.randomUUID().toString(), customer.id, customer.name,
                                        type, qty, empties, amount, payment, System.currentTimeMillis())
                                    deliveries = listOf(record) + deliveries
                                    store.saveDeliveries(deliveries)
                                    notice = "Delivery saved. Stock and customer ledger updated."
                                }
                            }
                        )
                        PageTab.REPORTS -> ReportsScreen(deliveries, customers, ::row)
                    }
                }
            }
        }
    }
}

@Composable
private fun LoginScreen(
    phone: String, onPhone: (String) -> Unit, pin: String, onPin: (String) -> Unit,
    error: String, onContinue: () -> Unit
) {
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("LPG MANAGER", color = Navy, fontWeight = FontWeight.ExtraBold, fontSize = 28.sp)
        Text("Bharat Gas Agency Management", color = Blue, fontSize = 14.sp)
        Spacer(Modifier.height(28.dp))
        Text("Mobile login", color = Ink, fontWeight = FontWeight.Bold, fontSize = 20.sp)
        Text("First login: enter your mobile number and create a 4-digit PIN. Use the same details next time.", color = Color.Gray, fontSize = 12.sp)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(phone, onPhone, label = { Text("10-digit mobile number") }, singleLine = true, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.height(10.dp))
        OutlinedTextField(pin, onPin, label = { Text("4-digit PIN") }, singleLine = true, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
        if (error.isNotBlank()) Text(error, color = Red, fontSize = 12.sp, modifier = Modifier.padding(top = 8.dp))
        Spacer(Modifier.height(18.dp))
        Button(onClick = onContinue, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Blue)) {
            Text("Continue", color = Color.White)
        }
    }
}

@Composable
private fun HomeScreen(row: (String) -> StockRow, customerCount: Int, deliveryCount: Int) {
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text("Dashboard", color = Navy, fontSize = 23.sp, fontWeight = FontWeight.Bold) }
        item { Text("Live stock overview • Data saved on this phone", color = Color.Gray, fontSize = 12.sp) }
        items(CylinderTypes) { type ->
            val s = row(type)
            Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.fillMaxWidth().padding(16.dp)) {
                    Text(type, color = Navy, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(Modifier.height(8.dp))
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        StockValue("Godown full", s.godownFull)
                        StockValue("Godown empty", s.godownEmpty)
                    }
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        StockValue("Van full", s.vanFull)
                        StockValue("Van empty", s.vanEmpty)
                    }
                    StockValue("Defective", s.defective)
                }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                SummaryTile("Customers", customerCount.toString(), Modifier.weight(1f))
                SummaryTile("Deliveries", deliveryCount.toString(), Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun StockValue(label: String, value: Int) {
    Column(Modifier.padding(vertical = 4.dp)) {
        Text(label, color = Color.Gray, fontSize = 11.sp)
        Text(value.toString(), color = Ink, fontWeight = FontWeight.Bold, fontSize = 18.sp)
    }
}

@Composable
private fun SummaryTile(title: String, value: String, modifier: Modifier = Modifier) {
    Card(modifier, colors = CardDefaults.cardColors(containerColor = Yellow.copy(alpha = .25f))) {
        Column(Modifier.padding(16.dp)) {
            Text(title, color = Ink, fontSize = 12.sp)
            Text(value, color = Navy, fontSize = 22.sp, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
private fun StockScreen(
    row: (String) -> StockRow, stock: (String, String) -> Int,
    setStock: (String, String, Int) -> Unit, onNotice: (String) -> Unit
) {
    var type by remember { mutableStateOf(CylinderTypes.first()) }
    var qtyText by remember { mutableStateOf("1") }
    var action by remember { mutableStateOf("Plant inward") }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item { Text("Stock & Godown", color = Navy, fontSize = 22.sp, fontWeight = FontWeight.Bold) }
        items(CylinderTypes) { t ->
            val s = row(t)
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.fillMaxWidth().padding(14.dp)) {
                    Text(t, color = Navy, fontWeight = FontWeight.Bold)
                    Text("Godown: ${s.godownFull} full / ${s.godownEmpty} empty", color = Ink)
                    Text("Van: ${s.vanFull} full / ${s.vanEmpty} empty • Defective: ${s.defective}", color = Color.Gray, fontSize = 12.sp)
                }
            }
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Record stock movement", color = Navy, fontWeight = FontWeight.Bold)
                    TypeSelector(type, { type = it })
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        listOf("Plant inward", "Load van", "Return van").forEach { a ->
                            FilterChip(selected = action == a, onClick = { action = a }, label = { Text(a, fontSize = 10.sp) })
                        }
                    }
                    OutlinedTextField(qtyText, { qtyText = it.filter(Char::isDigit).take(5) }, label = { Text("Quantity") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    Button(onClick = {
                        val q = qtyText.toIntOrNull() ?: 0
                        val s = row(type)
                        if (q <= 0) onNotice("Enter a valid quantity.")
                        else when (action) {
                            "Plant inward" -> if (s.godownEmpty >= q) {
                                setStock(type, "ge", s.godownEmpty - q); setStock(type, "gf", s.godownFull + q)
                                onNotice("Plant inward saved.")
                            } else onNotice("Not enough empty cylinders in godown.")
                            "Load van" -> if (s.godownFull >= q) {
                                setStock(type, "gf", s.godownFull - q); setStock(type, "vf", s.vanFull + q)
                                onNotice("Van loading saved.")
                            } else onNotice("Not enough filled cylinders in godown.")
                            else -> if (s.vanEmpty >= q) {
                                setStock(type, "ve", s.vanEmpty - q); setStock(type, "ge", s.godownEmpty + q)
                                onNotice("Van empty return saved.")
                            } else onNotice("Not enough empty cylinders in van.")
                        }
                    }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Blue)) { Text("Save stock movement") }
                }
            }
        }
    }
}

@Composable
private fun TypeSelector(value: String, onChange: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
        OutlinedTextField(value, {}, readOnly = true, label = { Text("Cylinder type") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            modifier = Modifier.menuAnchor().fillMaxWidth())
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            CylinderTypes.forEach { type ->
                DropdownMenuItem(text = { Text(type) }, onClick = { onChange(type); expanded = false })
            }
        }
    }
}

@Composable
private fun CustomersScreen(customers: List<SavedCustomer>, onSave: (List<SavedCustomer>) -> Unit) {
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var type by remember { mutableStateOf(CylinderTypes.first()) }
    var due by remember { mutableStateOf("0") }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { Text("Customer Ledger", color = Navy, fontSize = 22.sp, fontWeight = FontWeight.Bold) }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Add customer", color = Navy, fontWeight = FontWeight.Bold)
                    OutlinedTextField(name, { name = it }, label = { Text("Customer name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(phone, { phone = it.filter(Char::isDigit).take(10) }, label = { Text("Mobile number") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    OutlinedTextField(address, { address = it }, label = { Text("Address") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    TypeSelector(type, { type = it })
                    OutlinedTextField(due, { due = it.filter { ch -> ch.isDigit() || ch == '.' } }, label = { Text("Opening due (₹)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    Button(onClick = {
                        if (name.isBlank() || phone.length != 10) return@Button
                        val item = SavedCustomer(UUID.randomUUID().toString(), name.trim(), phone, address.trim(), type, due.toDoubleOrNull() ?: 0.0, 0)
                        onSave(customers + item)
                        name = ""; phone = ""; address = ""; due = "0"
                    }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Blue)) { Text("Save customer") }
                }
            }
        }
        items(customers, key = { it.id }) { customer ->
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(customer.name, color = Navy, fontWeight = FontWeight.Bold)
                        Text("${customer.phone} • ${customer.cylinderType}", color = Color.Gray, fontSize = 11.sp)
                        Text("Due ₹${"%.2f".format(customer.openingDue)} • Pending empties: ${customer.pendingEmpties}", color = Red, fontSize = 12.sp)
                    }
                    IconButton(onClick = { onSave(customers.filterNot { it.id == customer.id }) }) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete customer", tint = Red)
                    }
                }
            }
        }
    }
}

@Composable
private fun DeliveryScreen(
    customers: List<SavedCustomer>, rows: Map<String, StockRow>,
    onDeliver: (SavedCustomer, String, Int, Int, Double, String) -> Unit
) {
    var customerId by remember(customers) { mutableStateOf(customers.firstOrNull()?.id.orEmpty()) }
    var type by remember { mutableStateOf(CylinderTypes.first()) }
    var qty by remember { mutableStateOf("1") }
    var empties by remember { mutableStateOf("1") }
    var amount by remember { mutableStateOf("") }
    var payment by remember { mutableStateOf("Cash") }
    var expanded by remember { mutableStateOf(false) }
    val customer = customers.firstOrNull { it.id == customerId }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { Text("New Delivery", color = Navy, fontSize = 22.sp, fontWeight = FontWeight.Bold) }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
                    Text("Delivery details", color = Navy, fontWeight = FontWeight.Bold)
                    if (customers.isEmpty()) Text("Add a customer first in Customers tab.", color = Red)
                    else {
                        ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                            OutlinedTextField(customer?.name ?: "Select customer", {}, readOnly = true, label = { Text("Customer") },
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                                modifier = Modifier.menuAnchor().fillMaxWidth())
                            ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                                customers.forEach { c -> DropdownMenuItem(text = { Text(c.name) }, onClick = { customerId = c.id; expanded = false }) }
                            }
                        }
                        TypeSelector(type, { type = it })
                        Text("Van filled available: ${rows[type]?.vanFull ?: 0}", color = Blue, fontSize = 12.sp)
                        OutlinedTextField(qty, { qty = it.filter(Char::isDigit).take(4) }, label = { Text("Filled cylinders delivered") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(empties, { empties = it.filter(Char::isDigit).take(4) }, label = { Text("Empty cylinders received") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(amount, { amount = it.filter { ch -> ch.isDigit() || ch == '.' } }, label = { Text("Total amount (₹)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            listOf("Cash", "UPI", "Credit").forEach { p ->
                                FilterChip(selected = payment == p, onClick = { payment = p }, label = { Text(p) })
                            }
                        }
                        Button(onClick = {
                            val q = qty.toIntOrNull() ?: 0
                            val e = empties.toIntOrNull() ?: 0
                            val a = amount.toDoubleOrNull() ?: 0.0
                            if (customer != null && q > 0 && e <= q && a >= 0) onDeliver(customer, type, q, e, a, payment)
                        }, enabled = customer != null, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Blue)) {
                            Text("Confirm delivery & save receipt")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ReportsScreen(deliveries: List<SavedDelivery>, customers: List<SavedCustomer>, row: (String) -> StockRow) {
    val today = deliveries.filter {
        val day = java.text.SimpleDateFormat("yyyyMMdd", java.util.Locale.getDefault()).format(java.util.Date(it.createdAt))
        day == java.text.SimpleDateFormat("yyyyMMdd", java.util.Locale.getDefault()).format(java.util.Date())
    }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { Text("Reports & Day Summary", color = Navy, fontSize = 22.sp, fontWeight = FontWeight.Bold) }
        item { SummaryTile("Today's deliveries", today.sumOf { it.quantity }.toString(), Modifier.fillMaxWidth()) }
        item { SummaryTile("Today's recorded value", "₹${"%.2f".format(today.sumOf { it.amount })}", Modifier.fillMaxWidth()) }
        item { SummaryTile("Customers with outstanding due", customers.count { it.openingDue > 0 }.toString(), Modifier.fillMaxWidth()) }
        item { Text("Payment summary", color = Navy, fontWeight = FontWeight.Bold) }
        item { Text("Cash: ₹${"%.2f".format(today.filter { it.paymentMode == "Cash" }.sumOf { it.amount })}", color = Ink) }
        item { Text("UPI: ₹${"%.2f".format(today.filter { it.paymentMode == "UPI" }.sumOf { it.amount })}", color = Ink) }
        item { Text("Credit: ₹${"%.2f".format(today.filter { it.paymentMode == "Credit" }.sumOf { it.amount })}", color = Ink) }
        item { Divider(); Text("Recent deliveries", color = Navy, fontWeight = FontWeight.Bold) }
        items(deliveries.take(100), key = { it.id }) { d ->
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.padding(12.dp)) {
                    Text(d.customerName, color = Navy, fontWeight = FontWeight.Bold)
                    Text("${d.cylinderType} • Qty ${d.quantity} • Empty ${d.emptyReturned}", color = Ink, fontSize = 12.sp)
                    Text("₹${"%.2f".format(d.amount)} • ${d.paymentMode}", color = Blue, fontSize = 12.sp)
                }
            }
        }
        item { Text("Stock data is stored locally on this phone. Use regular device backup; uninstalling the app may remove local data.", color = Color.Gray, fontSize = 11.sp) }
    }
}
