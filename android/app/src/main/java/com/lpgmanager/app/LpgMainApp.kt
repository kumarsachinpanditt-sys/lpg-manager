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
    val officeFull: Int,
    val officeEmpty: Int,
    val vanFull: Int,
    val vanEmpty: Int,
    val defective: Int
)

private enum class PageTab(val label: String) {
    HOME("Home"), STOCK("Stock"), CUSTOMERS("Customers"), DELIVERY("Delivery"), REPORTS("Reports"), MANAGE("Manage")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LpgAppRoot() {
    val context = LocalContext.current
    val store = remember { LpgPersistentStore(context) }
    var isLoggedIn by remember { mutableStateOf(false) }
    var sessionRole by remember { mutableStateOf("Admin") }
    var sessionStaffId by remember { mutableStateOf("admin") }
    var sessionStaffName by remember { mutableStateOf("Admin") }
    var tab by remember { mutableStateOf(PageTab.HOME) }
    var phone by remember { mutableStateOf("") }
    var pin by remember { mutableStateOf("") }
    var loginError by remember { mutableStateOf("") }
    var customers by remember { mutableStateOf(store.customers()) }
    var staff by remember { mutableStateOf(store.staff()) }
    var godowns by remember { mutableStateOf(store.godowns()) }
    var activeGodownId by remember { mutableStateOf(store.readString("active_godown", store.godowns().first().id)) }
    var deliveries by remember { mutableStateOf(store.deliveries()) }
    var stockMovements by remember { mutableStateOf(store.stockMovements()) }
    var stockVersion by remember { mutableIntStateOf(0) }
    var notice by remember { mutableStateOf("") }

    fun stock(type: String, location: String): Int {
        stockVersion
        val key = if (location == "gf" || location == "ge") "stock_${type}_${location}_${activeGodownId}" else "stock_${type}_${location}"
        val legacy = if ((location == "gf" || location == "ge") && activeGodownId == "default-godown") store.readInt("stock_${type}_${location}", 0) else 0
        return store.readInt(key, legacy)
    }
    fun setStock(type: String, location: String, value: Int) {
        val key = if (location == "gf" || location == "ge") "stock_${type}_${location}_${activeGodownId}" else "stock_${type}_${location}"
        store.writeInt(key, value.coerceAtLeast(0))
        stockVersion++
    }
    fun row(type: String) = StockRow(type, stock(type, "gf"), stock(type, "ge"),
        stock(type, "of"), stock(type, "oe"), stock(type, "vf"), stock(type, "ve"), stock(type, "def"))

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
                        loginError = "10 digit mobile number aur 4 digit PIN dalein."
                    } else if (savedPhone.isBlank()) {
                        store.writeString("login_phone", phone)
                        store.writeString("login_pin", pin)
                        sessionRole = "Admin"
                        tab = PageTab.HOME
                        isLoggedIn = true
                    } else if (phone == savedPhone && pin == savedPin) {
                        sessionRole = "Admin"
                        isLoggedIn = true
                    } else {
                        val staffAccount = staff.firstOrNull { it.phone == phone && it.pin == pin }
                        if (staffAccount != null) {
                            sessionStaffId = staffAccount.id
                            sessionStaffName = staffAccount.name
                            sessionRole = "Staff"
                            tab = PageTab.HOME
                            isLoggedIn = true
                        } else {
                            loginError = "Mobile number ya PIN galat hai. Staff ko Admin se login details lein."
                        }
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
                                tab = PageTab.HOME
                                sessionRole = "Admin"
                                phone = ""
                                pin = ""
                            }) { Icon(Icons.Default.Logout, contentDescription = "Logout", tint = Color.White) }
                        },
                        colors = TopAppBarDefaults.topAppBarColors(containerColor = Navy)
                    )
                },
                bottomBar = {
                    NavigationBar(containerColor = Color.White) {
                        PageTab.values().filter { sessionRole == "Admin" || it != PageTab.MANAGE }.forEach { item ->
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
                                        PageTab.MANAGE -> Icons.Default.Settings
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
                        PageTab.STOCK -> StockScreen(::row, ::stock, ::setStock, godowns, activeGodownId, stockMovements, { activeGodownId = it; store.writeString("active_godown", it); stockVersion++ }, onMovement = { action, type, qty -> val gName = godowns.firstOrNull { it.id == activeGodownId }?.name ?: "Warehouse"; stockMovements = (listOf(SavedStockMovement(UUID.randomUUID().toString(), type, action, qty, gName, System.currentTimeMillis())) + stockMovements).take(500); store.saveStockMovements(stockMovements) }, onNotice = { notice = it })
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
                            staffId = sessionStaffId,
                            staffName = sessionStaffName,
                            rows = CylinderTypes.associateWith(::row),
                            onDeliver = { customer, type, qty, empties, amount, paidAmount, payment, deliveryStaffId, deliveryStaffName ->
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
                                            openingDue = it.openingDue + (amount - paidAmount).coerceAtLeast(0.0),
                                            pendingEmpties = (it.pendingEmpties + qty - empties).coerceAtLeast(0)
                                        ) else it
                                    }
                                    customers = updated
                                    store.saveCustomers(updated)
                                    val deliveryId = UUID.randomUUID().toString()
                                    val record = SavedDelivery(deliveryId, customer.id, customer.name,
                                        type, qty, empties, amount, payment, System.currentTimeMillis(),
                                        staffId = deliveryStaffId, staffName = deliveryStaffName,
                                        paidAmount = paidAmount, dueAmount = (amount - paidAmount).coerceAtLeast(0.0),
                                        receiptNo = deliveryId.take(8).uppercase())
                                    deliveries = listOf(record) + deliveries
                                    store.saveDeliveries(deliveries)
                                    val godownLabel = godowns.firstOrNull { it.id == activeGodownId }?.name ?: "Warehouse"
                                    val deliveryMoves = buildList { add(SavedStockMovement(UUID.randomUUID().toString(), type, "Customer delivery", qty, godownLabel, System.currentTimeMillis(), customer.name)); if (empties > 0) add(SavedStockMovement(UUID.randomUUID().toString(), type, "Customer empty return", empties, godownLabel, System.currentTimeMillis(), customer.name)) }
                                    stockMovements = (deliveryMoves + stockMovements).take(500)
                                    store.saveStockMovements(stockMovements)
                                    notice = "Delivery saved. Stock and customer ledger updated."
                                }
                            }
                        )
                        PageTab.REPORTS -> ReportsScreen(if (sessionRole == "Admin") deliveries else deliveries.filter { it.staffId == sessionStaffId }, customers, ::row, sessionRole)
                        PageTab.MANAGE -> ManageScreen(staff, godowns,
                            onStaffChange = { staff = it; store.saveStaff(it); notice = "Staff list saved." },
                            onGodownChange = { list -> godowns = list; store.saveGodowns(list); if (list.none { it.id == activeGodownId }) { activeGodownId = list.firstOrNull()?.id.orEmpty(); store.writeString("active_godown", activeGodownId) }; notice = "Godown list saved." })
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
        Text("Admin: pehli baar apna mobile number aur 4-digit PIN banayein. Staff ko Admin Manage tab se mobile + PIN dega.", color = Color.Gray, fontSize = 12.sp)
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
                        StockValue("Office full", s.officeFull)
                        StockValue("Office empty", s.officeEmpty)
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun StockScreen(
    row: (String) -> StockRow, stock: (String, String) -> Int,
    setStock: (String, String, Int) -> Unit, godowns: List<SavedGodown>, activeGodownId: String,
    movements: List<SavedStockMovement>, onGodown: (String) -> Unit,
    onMovement: (String, String, Int) -> Unit, onNotice: (String) -> Unit
) {
    var type by remember { mutableStateOf(CylinderTypes.first()) }
    var location by remember { mutableStateOf("Godown") }
    var target by remember { mutableStateOf("Office") }
    var kind by remember { mutableStateOf("Full") }
    var action by remember { mutableStateOf("Stock In") }
    var qtyText by remember { mutableStateOf("1") }
    val locations = listOf("Godown", "Office", "Van")
    fun key(place: String, item: String): String = when (item) {
        "Full" -> when (place) { "Godown" -> "gf"; "Office" -> "of"; else -> "vf" }
        "Empty" -> when (place) { "Godown" -> "ge"; "Office" -> "oe"; else -> "ve" }
        else -> "def"
    }
    fun current(place: String, item: String): Int = stock(type, key(place, item))
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text("Inventory Management", color = Navy, fontSize = 23.sp, fontWeight = FontWeight.Bold)
            Text("Cylinder-wise stock • Location-wise balance • Movement history", color = Color.Gray, fontSize = 12.sp)
        }
        item {
            Text("Select warehouse", color = Ink, fontWeight = FontWeight.Bold)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                godowns.forEach { g -> FilterChip(selected = activeGodownId == g.id, onClick = { onGodown(g.id) }, label = { Text(g.name) }) }
            }
        }
        items(CylinderTypes) { t ->
            val s = row(t)
            Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(t, color = Navy, fontWeight = FontWeight.Bold)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column { Text("Godown", color = Color.Gray, fontSize = 11.sp); Text("${s.godownFull} full • ${s.godownEmpty} empty", color = Ink, fontWeight = FontWeight.SemiBold) }
                        Column { Text("Office", color = Color.Gray, fontSize = 11.sp); Text("${s.officeFull} full • ${s.officeEmpty} empty", color = Blue, fontWeight = FontWeight.SemiBold) }
                    }
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column { Text("Van", color = Color.Gray, fontSize = 11.sp); Text("${s.vanFull} full • ${s.vanEmpty} empty", color = Ink, fontWeight = FontWeight.SemiBold) }
                        Column { Text("Defective", color = Color.Gray, fontSize = 11.sp); Text(s.defective.toString(), color = Red, fontWeight = FontWeight.SemiBold) }
                    }
                }
            }
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(14.dp)) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Stock entry", color = Navy, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    TypeSelector(type, { type = it })
                    Text("Action", color = Ink, fontWeight = FontWeight.SemiBold)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("Stock In", "Stock Out", "Transfer").forEach { a ->
                            FilterChip(selected = action == a, onClick = { action = a }, label = { Text(a) })
                        }
                    }
                    Text("Cylinder condition", color = Ink, fontWeight = FontWeight.SemiBold)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        listOf("Full", "Empty", "Defective").forEach { k ->
                            FilterChip(selected = kind == k, onClick = { kind = k }, enabled = !(action == "Transfer" && k == "Defective"), label = { Text(k) })
                        }
                    }
                    Text(if (action == "Transfer") "From location" else "Location", color = Ink, fontWeight = FontWeight.SemiBold)
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        locations.forEach { p -> FilterChip(selected = location == p, onClick = { location = p; if (target == p) target = locations.first { it != p } }, enabled = !(kind == "Defective" && p != "Godown"), label = { Text(p) }) }
                    }
                    if (action == "Transfer") {
                        Text("To location", color = Ink, fontWeight = FontWeight.SemiBold)
                        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            locations.filter { it != location }.forEach { p -> FilterChip(selected = target == p, onClick = { target = p }, label = { Text(p) }) }
                        }
                    }
                    Text("Available at $location: ${current(location, kind)}", color = Blue, fontWeight = FontWeight.SemiBold)
                    OutlinedTextField(qtyText, { qtyText = it.filter(Char::isDigit).take(5) }, label = { Text("Quantity") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    Button(onClick = {
                        val q = qtyText.toIntOrNull() ?: 0
                        val fromKey = key(location, kind)
                        val toKey = key(target, kind)
                        val available = current(location, kind)
                        when {
                            q <= 0 -> onNotice("Please enter a valid quantity.")
                            action == "Stock In" -> {
                                setStock(type, fromKey, available + q)
                                onMovement("Stock In • $location • $kind", type, q)
                                onNotice("$q $kind cylinders added to $location.")
                            }
                            available < q -> onNotice("Not enough $kind stock at $location.")
                            action == "Stock Out" -> {
                                setStock(type, fromKey, available - q)
                                onMovement("Stock Out • $location • $kind", type, q)
                                onNotice("$q $kind cylinders removed from $location.")
                            }
                            location == target -> onNotice("Choose a different destination.")
                            else -> {
                                setStock(type, fromKey, available - q)
                                setStock(type, toKey, current(target, kind) + q)
                                onMovement("Transfer • $location to $target • $kind", type, q)
                                onNotice("Transfer saved. Company total stock remains unchanged.")
                            }
                        }
                    }, modifier = Modifier.fillMaxWidth(), colors = ButtonDefaults.buttonColors(containerColor = Blue)) {
                        Text("Save inventory entry")
                    }
                    Text("Stock In adds stock. Stock Out removes stock. Transfer only changes location; it does not reduce total company stock.", color = Color.Gray, fontSize = 11.sp)
                }
            }
        }
        item {
            Text("Recent inventory history", color = Navy, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            if (movements.isEmpty()) Text("No stock movement recorded yet.", color = Color.Gray, fontSize = 12.sp)
        }
        items(movements.take(40), key = { "movement-" + it.id }) { m ->
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.fillMaxWidth().padding(12.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text("${m.action} • ${m.quantity} cylinders", color = Navy, fontWeight = FontWeight.Bold)
                    Text("${m.cylinderType} • ${m.godownName}", color = Ink, fontSize = 12.sp)
                    Text(java.text.SimpleDateFormat("dd MMM yyyy, hh:mm a", java.util.Locale.getDefault()).format(java.util.Date(m.createdAt)), color = Color.Gray, fontSize = 11.sp)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
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

@OptIn(ExperimentalMaterial3Api::class)
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
private fun ManageScreen(
    staff: List<SavedStaff>, godowns: List<SavedGodown>,
    onStaffChange: (List<SavedStaff>) -> Unit, onGodownChange: (List<SavedGodown>) -> Unit
) {
    var staffName by remember { mutableStateOf("") }
    var staffPhone by remember { mutableStateOf("") }
    var staffPin by remember { mutableStateOf("") }
    var godownName by remember { mutableStateOf("") }
    var editingStaff by remember { mutableStateOf("") }
    var editingGodown by remember { mutableStateOf("") }
    LazyColumn(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item { Text("Staff & Warehouse Management", color = Navy, fontSize = 21.sp, fontWeight = FontWeight.Bold) }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Add staff", color = Navy, fontWeight = FontWeight.Bold)
                    OutlinedTextField(staffName, { staffName = it }, label = { Text("Staff name") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                    OutlinedTextField(staffPhone, { staffPhone = it.filter(Char::isDigit).take(10) }, label = { Text("Staff mobile number (10 digits)") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                    OutlinedTextField(staffPin, { staffPin = it.filter(Char::isDigit).take(4) }, label = { Text("Staff 4-digit login PIN") }, modifier = Modifier.fillMaxWidth(), singleLine = true, visualTransformation = PasswordVisualTransformation())
                    Button(onClick = {
                        if (staffName.isNotBlank() && staffPhone.length == 10 && staffPin.length == 4 && staff.none { it.phone == staffPhone }) {
                            onStaffChange(staff + SavedStaff(UUID.randomUUID().toString(), staffName.trim(), staffPhone, "Staff", staffPin))
                            staffName = ""; staffPhone = ""; staffPin = ""
                        }
                    }, enabled = staffName.isNotBlank() && staffPhone.length == 10 && staffPin.length == 4, modifier = Modifier.fillMaxWidth()) { Text("Add staff login") }
                }
            }
        }
        items(staff, key = { "staff-" + it.id }) { s ->
            var name by remember(s.id, s.name) { mutableStateOf(s.name) }
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.padding(12.dp)) {
                    OutlinedTextField(name, { name = it }, label = { Text("Staff name") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                    Text("Mobile: ${s.phone} • Login PIN set", color = Color.Gray, fontSize = 11.sp)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { if (name.isNotBlank()) onStaffChange(staff.map { if (it.id == s.id) it.copy(name = name.trim()) else it }) }) { Text("Rename") }
                        TextButton(onClick = { onStaffChange(staff.filterNot { it.id == s.id }) }) { Text("Remove", color = Red) }
                    }
                }
            }
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Add Godown / Warehouse", color = Navy, fontWeight = FontWeight.Bold)
                    OutlinedTextField(godownName, { godownName = it }, label = { Text("Godown / Warehouse name") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                    Button(onClick = { if (godownName.isNotBlank()) { onGodownChange(godowns + SavedGodown(UUID.randomUUID().toString(), godownName.trim())); godownName = "" } }, modifier = Modifier.fillMaxWidth()) { Text("Add Godown") }
                }
            }
        }
        items(godowns, key = { "godown-" + it.id }) { g ->
            var name by remember(g.id, g.name) { mutableStateOf(g.name) }
            Card(colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.padding(12.dp)) {
                    OutlinedTextField(name, { name = it }, label = { Text("Godown name") }, modifier = Modifier.fillMaxWidth(), singleLine = true)
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { if (name.isNotBlank()) onGodownChange(godowns.map { if (it.id == g.id) it.copy(name = name.trim()) else it }) }) { Text("Rename") }
                        TextButton(onClick = { if (godowns.size > 1) onGodownChange(godowns.filterNot { it.id == g.id }) }, enabled = godowns.size > 1) { Text("Remove", color = Red) }
                    }
                }
            }
        }
        item { Text("Har warehouse ka stock alag rakha jayega. Stock tab me warehouse select karke inward/loading record karein.", color = Color.Gray, fontSize = 12.sp) }
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
