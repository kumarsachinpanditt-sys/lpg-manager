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

    // Active Delivery Staff Session State
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
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
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
                            text = "Authorized Gas Agency Distributorship",
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
            Card(
                colors = CardDefaults.cardColors(containerColor = NavyCard),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        text = "Essential Operations & Audits",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Surface(
                            color = FlameOrange.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(text = "EOD Settlement", color = FlameOrange, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text(text = "Daily Cash & Empty Tally", color = Color(0xFF94A3B8), fontSize = 11.sp)
                            }
                        }
                        Surface(
                            color = DangerRed.copy(alpha = 0.15f),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(text = "Defective Bay", color = DangerRed, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                Text(text = "9 Quarantined for Plant", color = Color(0xFF94A3B8), fontSize = 11.sp)
                            }
                        }
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

        items(listOf(
            Triple("Sunita Devi (IND-908122)", "1x 14.2 KG Domestic Refill", "₹803 (CASH)"),
            Triple("Dhaba Royale & Tandoor (IND-COM-001)", "4x 19 KG Commercial Refill", "₹7,120 (CREDIT)"),
            Triple("Pooja Sharma (IND-908126)", "1x 14.2 KG Domestic Refill", "₹803 (UPI)")
        )) { (cust, desc, amt) ->
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
                        Text(text = desc, color = Color(0xFF94A3B8), fontSize = 11.sp)
                    }
                    Text(text = amt, color = SuccessGreen, fontWeight = FontWeight.Bold, fontSize = 13.sp)
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
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
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
        item {
            Text(text = "Quarantined Defective Bay (Plant Warranty Return)", color = DangerRed, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }
        items(listOf(
            Triple("14.2 KG Domestic", "PIN_LEAK (Spindle O-Ring Leaking)", "SN: IND-2024-8841"),
            Triple("19 KG Commercial", "VALVE_DEFECT (Thread Ruptured)", "SN: BHT-2023-1192"),
            Triple("14.2 KG Domestic", "BODY_DENT_LEAK (Seam Weld Pinhole)", "SN: HPC-2022-7740")
        )) { (type, defect, sn) ->
            Card(colors = CardDefaults.cardColors(containerColor = NavyCard), shape = RoundedCornerShape(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = type, color = Color.White, fontWeight = FontWeight.Bold)
                        Text(text = defect, color = DangerRed, fontSize = 11.sp)
                        Text(text = sn, color = Color(0xFF94A3B8), fontSize = 10.sp)
                    }
                    Text(text = "QUARANTINED", color = FlameOrange, fontWeight = FontWeight.Bold, fontSize = 11.sp)
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
        item {
            Card(colors = CardDefaults.cardColors(containerColor = NavyCard), shape = RoundedCornerShape(16.dp)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(text = "Staff Shift Summary (${staff.staffName})", color = Color.White, fontWeight = FontWeight.Bold)
                    Text(text = "• Cash In Hand: ₹${staff.cashInHand.toInt()}", color = SuccessGreen, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    Text(text = "• UPI Received: ₹${staff.upiInHand.toInt()}", color = FlameOrange, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    Text(text = "• Van Load Remaining: ${staff.stock14Kg.full}F / ${staff.stock14Kg.empty}E", color = Color(0xFF94A3B8), fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun CustomersComposable() {
    var selectedFilter by remember { mutableStateOf("ALL") }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item {
            Text(text = "Customers & 19 KG Commercial Ledger", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("ALL" to "All Accounts", "COMMERCIAL" to "19 KG Commercial", "DOMESTIC" to "Domestic").forEach { (id, label) ->
                    FilterChip(
                        selected = selectedFilter == id,
                        onClick = { selectedFilter = id },
                        label = { Text(text = label, fontSize = 12.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = FlameOrange,
                            selectedLabelColor = Color.White,
                            containerColor = NavyCard,
                            labelColor = Color(0xFF94A3B8)
                        )
                    )
                }
            }
        }
        items(listOf(
            Triple("Dhaba Royale & Tandoor", "IND-COM-001 (19 KG)", "Due: 2 Empties / ₹3,560 Credit"),
            Triple("Balaji Sweet House", "IND-COM-002 (19 KG)", "Due: 1 Empty / ₹1,780 Credit"),
            Triple("Sunita Devi", "IND-908122 (14.2 KG)", "All Settled"),
            Triple("Pooja Sharma", "IND-908126 (14.2 KG)", "All Settled")
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
            Text(
                text = "Staff members cannot edit or delete entries. Auditable corrections are made via Admin reversals only.",
                color = Color(0xFF94A3B8),
                fontSize = 11.sp
            )
        }
        items(listOf(
            Triple("DELIVERY (Sunita Devi)", "1x 14.2 KG Refill Delivered | 1 Empty Returned", "+ ₹803.00 (CASH)"),
            Triple("DELIVERY (Dhaba Royale)", "4x 19 KG Refill Delivered | 2 Empties Due", "+ ₹7,120.00 (CREDIT)"),
            Triple("INWARD (Plant Batch)", "300x 14.2 KG Full Received from Bottling Plant", "- ₹227,100.00")
        )) { (title, sub, amt) ->
            Card(colors = CardDefaults.cardColors(containerColor = NavyCard), shape = RoundedCornerShape(12.dp)) {
                Row(modifier = Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(text = title, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        Text(text = sub, color = Color(0xFF94A3B8), fontSize = 11.sp)
                    }
                    Text(
                        text = amt,
                        color = if (amt.startsWith("+")) SuccessGreen else Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
fun ReportsComposable() {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(text = "Agency Profit & Loss and Daily EOD Summary", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
        item {
            Card(colors = CardDefaults.cardColors(containerColor = NavySurface), shape = RoundedCornerShape(16.dp)) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(text = "Today's One-Click EOD Snapshot", color = FlameOrange, fontWeight = FontWeight.Bold)
                    Text(text = "• Total Revenue: ₹48,450.00", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                    Text(text = "• Cash In Safe: ₹32,150.00", color = SuccessGreen, fontSize = 13.sp)
                    Text(text = "• UPI Receipts: ₹16,300.00", color = FlameOrange, fontSize = 13.sp)
                    Text(text = "• Sound Empties Recovered: 58 Cylinders", color = Color(0xFF94A3B8), fontSize = 12.sp)
                    Text(text = "• Defectives Quarantined: 2 Cylinders", color = DangerRed, fontSize = 12.sp)
                }
            }
        }
    }
}

@Composable
fun SettingsComposable(role: UserRole) {
    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(text = "LPG Cylinder Price Master (Dynamic, Not Hardcoded)", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 16.sp)
        }
        items(listOf(
            Triple("14.2 KG Domestic Refill", "Selling: ₹803.00", "Purchase: ₹757.00 | Margin: ₹46.00"),
            Triple("19 KG Commercial Refill", "Selling: ₹1,780.00", "Purchase: ₹1,610.00 | Margin: ₹170.00"),
            Triple("5 KG Chhotu FTL Refill", "Selling: ₹340.00", "Purchase: ₹310.00 | Margin: ₹30.00")
        )) { (name, sell, purch) ->
            Card(colors = CardDefaults.cardColors(containerColor = NavyCard), shape = RoundedCornerShape(12.dp)) {
                Column(modifier = Modifier.fillMaxWidth().padding(14.dp)) {
                    Text(text = name, color = Color.White, fontWeight = FontWeight.Bold)
                    Text(text = sell, color = FlameOrange, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    Text(text = purch, color = Color(0xFF94A3B8), fontSize = 11.sp)
                }
            }
        }
    }
}
