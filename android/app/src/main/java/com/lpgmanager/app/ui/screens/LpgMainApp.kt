package com.lpgmanager.app.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.lpgmanager.app.data.model.*
import com.lpgmanager.app.ui.theme.*
import com.lpgmanager.app.utils.PdfReceiptGenerator
import com.lpgmanager.app.utils.WhatsAppShareHelper

enum class LpgScreen(val title: String) {
    DASHBOARD("Dashboard"),
    GODOWN("Godown"),
    DELIVERY("Delivery"),
    CUSTOMERS("Customers"),
    LEDGER("Ledger"),
    REPORTS("Reports"),
    SETTINGS("Pricing")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LpgMainApp() {
    var currentScreen by remember { mutableStateOf(LpgScreen.DASHBOARD) }
    var currentRole by remember { mutableStateOf(UserRole.ADMIN) }
    val context = LocalContext.current

    // Sample Active Delivery Staff
    val activeStaff = remember {
        StaffInventory(
            staffId = "staff-1",
            staffName = "Sachin Kumar",
            phone = "9811234567",
            stock14Kg = StockCount(full = 28, empty = 14, defective = 1),
            stock19Kg = StockCount(full = 4, empty = 2, defective = 0),
            stock5Kg = StockCount(full = 5, empty = 2, defective = 0),
            cashInHand = 14454.0,
            upiInHand = 8030.0
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text(
                                text = "LPG Manager",
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp,
                                color = Color.White
                            )
                            Surface(
                                color = FlameOrange.copy(alpha = 0.2f),
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    text = if (currentRole == UserRole.ADMIN) "ADMIN" else "STAFF",
                                    color = FlameOrange,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text(
                            text = "Shree Ganesh Gas Agency (Authorized Indane Distributor)",
                            color = Color(0xFF94A3B8),
                            fontSize = 11.sp
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {
                        currentRole = if (currentRole == UserRole.ADMIN) UserRole.STAFF else UserRole.ADMIN
                    }) {
                        Icon(
                            imageVector = Icons.Default.SwapHoriz,
                            contentDescription = "Switch Role",
                            tint = FlameOrange
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = DeepNavy,
                    titleContentColor = Color.White
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = NavyCard,
                tonalElevation = 8.dp
            ) {
                val screens = if (currentRole == UserRole.ADMIN) {
                    listOf(
                        LpgScreen.DASHBOARD to Icons.Default.Dashboard,
                        LpgScreen.GODOWN to Icons.Default.Inventory2,
                        LpgScreen.DELIVERY to Icons.Default.LocalShipping,
                        LpgScreen.CUSTOMERS to Icons.Default.People,
                        LpgScreen.LEDGER to Icons.Default.ReceiptLong,
                        LpgScreen.REPORTS to Icons.Default.Assessment,
                        LpgScreen.SETTINGS to Icons.Default.Settings
                    )
                } else {
                    listOf(
                        LpgScreen.DASHBOARD to Icons.Default.Dashboard,
                        LpgScreen.DELIVERY to Icons.Default.LocalShipping,
                        LpgScreen.CUSTOMERS to Icons.Default.People,
                        LpgScreen.LEDGER to Icons.Default.ReceiptLong
                    )
                }

                screens.forEach { (screen, icon) ->
                    NavigationBarItem(
                        selected = currentScreen == screen,
                        onClick = { currentScreen = screen },
                        icon = { Icon(imageVector = icon, contentDescription = screen.title) },
                        label = { Text(text = screen.title, fontSize = 10.sp) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = FlameOrange,
                            selectedTextColor = FlameOrange,
                            indicatorColor = FlameOrange.copy(alpha = 0.2f),
                            unselectedIconColor = Color(0xFF94A3B8),
                            unselectedTextColor = Color(0xFF94A3B8)
                        )
                    )
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(DeepNavy)
        ) {
            when (currentScreen) {
                LpgScreen.DASHBOARD -> DashboardComposable(currentRole, activeStaff)
                LpgScreen.GODOWN -> GodownComposable(currentRole)
                LpgScreen.DELIVERY -> DeliveryComposable(activeStaff) { txn, custPhone ->
                    val pdf = PdfReceiptGenerator.generateDeliveryReceiptPdf(context, txn)
                    if (pdf != null) {
                        WhatsAppShareHelper.shareReceiptToWhatsApp(context, pdf, txn, custPhone)
                    }
                }
                LpgScreen.CUSTOMERS -> CustomersComposable()
                LpgScreen.LEDGER -> LedgerComposable(currentRole)
                LpgScreen.REPORTS -> ReportsComposable()
                LpgScreen.SETTINGS -> SettingsComposable(currentRole)
            }
        }
    }
}

@Composable
fun DashboardComposable(role: UserRole, staff: StaffInventory) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = NavySurface),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = if (role == UserRole.ADMIN) "Godown Master Inventory" else "Vehicle Stock (${staff.staffName})",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        StockBadge("14.2 KG Domestic", full = 450, empty = 210, defective = 6)
                        StockBadge("19 KG Commercial", full = 120, empty = 45, defective = 2)
                        StockBadge("5 KG Chhotu", full = 85, empty = 30, defective = 1)
                    }
                }
            }
        }

        item {
            Text(
                text = "Today's Delivery Progress",
                color = Color.White,
                fontWeight = FontWeight.Bold,
                fontSize = 15.sp
            )
        }

        items(listOf("Sunita Devi (IND-908122)", "Dhaba Royale (IND-COM-001)", "Pooja Sharma (IND-908126)")) { cust ->
            Card(
                colors = CardDefaults.cardColors(containerColor = NavyCard),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = cust, color = Color.White, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        Text(text = "Refill Fulfilled", color = Color(0xFF94A3B8), fontSize = 11.sp)
                    }
                    Text(text = "PAID", color = SuccessGreen, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                }
            }
        }
    }
}

@Composable
fun StockBadge(title: String, full: Int, empty: Int, defective: Int = 0) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = title, color = Color(0xFF94A3B8), fontSize = 11.sp, fontWeight = FontWeight.Medium)
        Spacer(modifier = Modifier.height(4.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(text = "${full}F", color = SuccessGreen, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            Text(text = "|", color = Color(0xFF64748B), fontSize = 13.sp)
            Text(text = "${empty}E", color = FlameOrange, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            if (defective > 0) {
                Text(text = "|", color = Color(0xFF64748B), fontSize = 13.sp)
                Text(text = "${defective}D", color = DangerRed, fontWeight = FontWeight.Bold, fontSize = 13.sp)
            }
        }
    }
}

@Composable
fun GodownComposable(role: UserRole) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(text = "Godown Inventory & Stock Control", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = NavySurface), shape = RoundedCornerShape(16.dp)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(text = "Plant Receiving & Defective Quarantine", color = FlameOrange, fontWeight = FontWeight.Bold)
                    Text(text = "• Plant Inward: Receive fresh full cylinders & return empty trucks", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    Text(text = "• Defective Tracker: Quarantine pin/valve leaking cylinders for warranty return", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    Text(text = "• End-of-Day Checkout: Daily staff vehicle checkout & cash tally", color = Color(0xFF94A3B8), fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun DeliveryComposable(staff: StaffInventory, onShareReceipt: (LpgTransaction, String) -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        item {
            Text(text = "Customer Delivery & Digital Cash Memo", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = NavySurface), shape = RoundedCornerShape(16.dp)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(text = "Quick Delivery Fulfillment", color = FlameOrange, fontWeight = FontWeight.Bold)
                    Text(text = "Customer: Sunita Devi (IND-908122) - Ramesh Nagar", color = Color.White, fontSize = 13.sp)
                    Text(text = "Cylinder: 1x 14.2 KG Domestic | Empty Received: 1", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    Text(text = "Payment: ₹803 (CASH)", color = SuccessGreen, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    
                    Button(
                        onClick = {
                            val txn = LpgTransaction(
                                id = "TXN-DEL-8941",
                                customerName = "Sunita Devi",
                                consumerNo = "IND-908122",
                                cylinderType = "14.2KG",
                                quantity = 1,
                                emptyReturned = 1,
                                unitPrice = 803.0,
                                totalAmount = 803.0,
                                paidAmount = 803.0,
                                paymentMode = "CASH",
                                staffName = staff.staffName
                            )
                            onShareReceipt(txn, "9871100112")
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = FlameOrange),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(text = "Complete Delivery & Send WhatsApp Receipt", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun CustomersComposable() {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item {
            Text(text = "19 KG Commercial & Domestic Accounts", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
        items(listOf(
            Triple("Dhaba Royale & Tandoor", "IND-COM-001 (19 KG)", "Due: 2 Empties / ₹3,560 Credit"),
            Triple("Balaji Sweet House", "IND-COM-002 (19 KG)", "Due: 1 Empty / ₹1,780 Credit"),
            Triple("Sunita Devi", "IND-908122 (14.2 KG)", "All Settled")
        )) { (name, no, due) ->
            Card(colors = CardDefaults.cardColors(containerColor = NavyCard), shape = RoundedCornerShape(12.dp)) {
                Row(modifier = Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text(text = name, color = Color.White, fontWeight = FontWeight.Bold)
                        Text(text = no, color = Color(0xFF94A3B8), fontSize = 11.sp)
                    }
                    Text(text = due, color = if (due.contains("Settled")) SuccessGreen else DangerRed, fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
fun LedgerComposable(role: UserRole) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item {
            Text(text = "Immutable Stock & Financial Ledger", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
        item {
            Text(text = "Staff members cannot edit or delete entries. Auditable corrections are made via Admin reversals only.", color = Color(0xFF94A3B8), fontSize = 11.sp)
        }
    }
}

@Composable
fun ReportsComposable() {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(text = "Agency Profit & Loss and Daily EOD Summary", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}

@Composable
fun SettingsComposable(role: UserRole) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(text = "LPG Cylinder Price Master (Dynamic, Not Hardcoded)", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
    }
}
