package com.lpgmanager.app

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// LPG Manager Android Native Jetpack Compose App
// Synchronized with Web Firestore Database Schema

val BackgroundDark = Color(0xFF020617)
val CardDark = Color(0xFF0F172A)
val CardBorder = Color(0xFF1E293B)
val TextPrimary = Color(0xFFFFFFFF)
val TextSecondary = Color(0xFF94A3B8)
val AccentOrange = Color(0xFFF97316)
val AccentEmerald = Color(0xFF10B981)
val AccentCyan = Color(0xFF06B6D4)
val AccentRose = Color(0xFFF43F5E)

enum class LpgScreen(val title: String, val icon: ImageVector) {
    DASHBOARD("Dashboard", Icons.Default.Dashboard),
    GODOWN("Godown", Icons.Default.Warehouse),
    DELIVERY("Delivery", Icons.Default.LocalShipping),
    CUSTOMERS("Ledger", Icons.Default.People),
    DEFECTIVES("Defectives", Icons.Default.Warning),
    EOD("EOD Summary", Icons.Default.ReceiptLong)
}

data class StockSummary(
    val godownFilled14: Int = 420,
    val godownEmpty14: Int = 110,
    val godownFilled19: Int = 115,
    val godownEmpty19: Int = 42,
    val officeFilled14: Int = 45,
    val officeEmpty14: Int = 38,
    val vanFilled14: Int = 86,
    val vanEmpty14: Int = 18,
    val defective14: Int = 3,
    val defective19: Int = 1
)

data class CustomerItem(
    val id: String,
    val name: String,
    val phone: String,
    val type: String,
    val pendingEmpties19: Int,
    val outstandingBalance: Double
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LpgAppRoot() {
    var currentScreen by remember { mutableStateOf(LpgScreen.DASHBOARD) }
    var stockState by remember { mutableStateOf(StockSummary()) }
    var userRole by remember { mutableStateOf("ADMIN") } // ADMIN or STAFF

    Scaffold(
        containerColor = BackgroundDark,
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(AccentOrange),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.LocalFireDepartment,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                        Column {
                            Text(
                                text = "LPG MANAGER",
                                color = TextPrimary,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Enterprise Godown & Delivery",
                                color = TextSecondary,
                                fontSize = 10.sp
                            )
                        }
                    }
                },
                actions = {
                    AssistChip(
                        onClick = {
                            userRole = if (userRole == "ADMIN") "STAFF" else "ADMIN"
                        },
                        label = {
                            Text(
                                text = userRole,
                                color = if (userRole == "ADMIN") AccentOrange else AccentCyan,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = CardDark
                        )
                    )
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = CardDark
                )
            )
        },
        bottomBar = {
            NavigationBar(
                containerColor = CardDark,
                tonalElevation = 8.dp
            ) {
                LpgScreen.values().forEach { screen ->
                    val selected = currentScreen == screen
                    NavigationBarItem(
                        selected = selected,
                        onClick = { currentScreen = screen },
                        icon = {
                            Icon(
                                imageVector = screen.icon,
                                contentDescription = screen.title,
                                tint = if (selected) AccentOrange else TextSecondary
                            )
                        },
                        label = {
                            Text(
                                text = screen.title,
                                color = if (selected) AccentOrange else TextSecondary,
                                fontSize = 10.sp,
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal
                            )
                        },
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = AccentOrange.copy(alpha = 0.15f)
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
                .background(BackgroundDark)
        ) {
            when (currentScreen) {
                LpgScreen.DASHBOARD -> DashboardScreen(stockState)
                LpgScreen.GODOWN -> GodownScreen(stockState) { stockState = it }
                LpgScreen.DELIVERY -> StaffDeliveryScreen(stockState) { stockState = it }
                LpgScreen.CUSTOMERS -> CustomerLedgerScreen()
                LpgScreen.DEFECTIVES -> DefectiveScreen(stockState) { stockState = it }
                LpgScreen.EOD -> EodSettlementScreen(stockState)
            }
        }
    }
}

@Composable
fun DashboardScreen(stock: StockSummary) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Operational Overview",
                color = TextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Real-time stock across main godown, office counter, and delivery vans",
                color = TextSecondary,
                fontSize = 12.sp
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    modifier = Modifier.weight(1f),
                    title = "Godown Filled 14.2KG",
                    value = "${stock.godownFilled14}",
                    subtitle = "Available for Loading",
                    badgeColor = AccentEmerald
                )
                StatCard(
                    modifier = Modifier.weight(1f),
                    title = "Godown Empty 14.2KG",
                    value = "${stock.godownEmpty14}",
                    subtitle = "Ready for Plant Inward",
                    badgeColor = AccentCyan
                )
            }
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    modifier = Modifier.weight(1f),
                    title = "Commercial 19KG",
                    value = "${stock.godownFilled19} Full",
                    subtitle = "${stock.godownEmpty19} Empties in stock",
                    badgeColor = AccentOrange
                )
                StatCard(
                    modifier = Modifier.weight(1f),
                    title = "Office Counter",
                    value = "${stock.officeFilled14} Full",
                    subtitle = "${stock.officeEmpty14} Empties at counter",
                    badgeColor = AccentCyan
                )
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardDark)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Delivery Vehicle Status",
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Vans on route holding ${stock.vanFilled14} filled cylinders, ${stock.vanEmpty14} collected empties.",
                        color = TextSecondary,
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}

@Composable
fun StatCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    subtitle: String,
    badgeColor: Color
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardDark)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = title, color = TextSecondary, fontSize = 11.sp, fontWeight = FontWeight.Medium)
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = value, color = TextPrimary, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = subtitle, color = badgeColor, fontSize = 10.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun GodownScreen(stock: StockSummary, onUpdateStock: (StockSummary) -> Unit) {
    var inwardQty by remember { mutableStateOf(300) }
    var loadQty by remember { mutableStateOf(40) }
    var message by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Godown & Multi-Location Transfers",
                color = TextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Plant bulk inward receipts and intra-location transfers",
                color = TextSecondary,
                fontSize = 12.sp
            )
        }

        if (message.isNotEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = AccentEmerald.copy(alpha = 0.15f))
                ) {
                    Text(
                        text = message,
                        color = AccentEmerald,
                        modifier = Modifier.padding(12.dp),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardDark)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "1. Receive Bulk Inward from Bottling Plant",
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Adds filled 14.2KG to godown and deducts empty cylinders returned to plant.",
                        color = TextSecondary,
                        fontSize = 11.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = {
                            if (stock.godownEmpty14 >= inwardQty) {
                                onUpdateStock(
                                    stock.copy(
                                        godownFilled14 = stock.godownFilled14 + inwardQty,
                                        godownEmpty14 = stock.godownEmpty14 - inwardQty
                                    )
                                )
                                message = "Successfully recorded plant inward of $inwardQty cylinders."
                            } else {
                                message = "Not enough empty cylinders in godown for 1-to-1 plant swap."
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentOrange),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Record Plant Inward (300 Cylinders)")
                    }
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardDark)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "2. Godown to Delivery Van Loading",
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Transfer filled cylinders from main godown to delivery vehicle.",
                        color = TextSecondary,
                        fontSize = 11.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = {
                            if (stock.godownFilled14 >= loadQty) {
                                onUpdateStock(
                                    stock.copy(
                                        godownFilled14 = stock.godownFilled14 - loadQty,
                                        vanFilled14 = stock.vanFilled14 + loadQty
                                    )
                                )
                                message = "Issued $loadQty filled cylinders to Delivery Van."
                            } else {
                                message = "Insufficient godown stock for loading."
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentEmerald),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Load 40 Cylinders to Van")
                    }
                }
            }
        }
    }
}

@Composable
fun StaffDeliveryScreen(stock: StockSummary, onUpdateStock: (StockSummary) -> Unit) {
    var customerName by remember { mutableStateOf("Rajesh Sharma") }
    var deliveryQty by remember { mutableStateOf(1) }
    var emptyQty by remember { mutableStateOf(1) }
    var paymentMode by remember { mutableStateOf("UPI") }
    var feedback by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Staff Delivery & Cash Register",
                color = TextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Record doorstep cylinder delivery, collect empty, and register payment",
                color = TextSecondary,
                fontSize = 12.sp
            )
        }

        if (feedback.isNotEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = AccentEmerald.copy(alpha = 0.15f))
                ) {
                    Text(
                        text = feedback,
                        color = AccentEmerald,
                        modifier = Modifier.padding(12.dp),
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardDark)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "New Customer Delivery",
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(text = "Customer: $customerName", color = TextSecondary, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = "Cylinder: 14.2KG Domestic Refill", color = TextSecondary, fontSize = 12.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(text = "Rate: ₹803 (Total ₹803)", color = AccentOrange, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            if (stock.vanFilled14 >= deliveryQty) {
                                onUpdateStock(
                                    stock.copy(
                                        vanFilled14 = stock.vanFilled14 - deliveryQty,
                                        vanEmpty14 = stock.vanEmpty14 + emptyQty
                                    )
                                )
                                feedback = "Delivery confirmed: ₹803 collected via $paymentMode. Stock updated."
                            } else {
                                feedback = "Error: Van is out of filled cylinders. Request stock transfer first."
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentEmerald),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Confirm Delivery & Receipt")
                    }
                }
            }
        }
    }
}

@Composable
fun CustomerLedgerScreen() {
    val customers = remember {
        listOf(
            CustomerItem("c1", "Grand Palace Hotel", "9876543210", "COMMERCIAL", 6, 9400.0),
            CustomerItem("c2", "Sunrise Cafe & Bakers", "9876501234", "COMMERCIAL", 3, 3760.0),
            CustomerItem("c3", "Royal Sweets Corner", "9876598765", "COMMERCIAL", 2, 0.0),
            CustomerItem("c4", "Rajesh Sharma", "9812345678", "DOMESTIC", 0, 0.0)
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Text(
                text = "Commercial Customer Ledger (19KG)",
                color = TextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Track unreturned empties and credit balances for commercial clients",
                color = TextSecondary,
                fontSize = 12.sp
            )
        }

        items(customers) { c ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(containerColor = CardDark)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(text = c.name, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        Text(text = "Phone: ${c.phone} • ${c.type}", color = TextSecondary, fontSize = 11.sp)
                        if (c.pendingEmpties19 > 0) {
                            Text(
                                text = "Pending 19KG Empties: ${c.pendingEmpties19} Cylinders",
                                color = AccentOrange,
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = if (c.outstandingBalance > 0) "₹${c.outstandingBalance.toInt()}" else "Settled",
                            color = if (c.outstandingBalance > 0) AccentRose else AccentEmerald,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(text = "Due Balance", color = TextSecondary, fontSize = 10.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun DefectiveScreen(stock: StockSummary, onUpdateStock: (StockSummary) -> Unit) {
    var loggedNote by remember { mutableStateOf("") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "Defective & Leaking Cylinder Tracker",
                color = TextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Segregate damaged or leaking cylinders for plant replacement",
                color = TextSecondary,
                fontSize = 12.sp
            )
        }

        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    modifier = Modifier.weight(1f),
                    title = "Defective 14.2KG",
                    value = "${stock.defective14}",
                    subtitle = "Marked for warranty swap",
                    badgeColor = AccentRose
                )
                StatCard(
                    modifier = Modifier.weight(1f),
                    title = "Defective 19KG",
                    value = "${stock.defective19}",
                    subtitle = "Pin valve leakage",
                    badgeColor = AccentRose
                )
            }
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardDark)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Log Leaking Cylinder (Valve Leakage)",
                        color = TextPrimary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Button(
                        onClick = {
                            if (stock.vanEmpty14 > 0) {
                                onUpdateStock(
                                    stock.copy(
                                        vanEmpty14 = stock.vanEmpty14 - 1,
                                        defective14 = stock.defective14 + 1
                                    )
                                )
                                loggedNote = "Logged 1 defective 14.2KG cylinder from Van to Quarantined Defectives."
                            } else {
                                loggedNote = "No empties on van to log as defective."
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentRose),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text("Log 1 Defective Cylinder")
                    }
                    if (loggedNote.isNotEmpty()) {
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(text = loggedNote, color = AccentEmerald, fontSize = 11.sp)
                    }
                }
            }
        }
    }
}

@Composable
fun EodSettlementScreen(stock: StockSummary) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "End-of-Day Staff & Cash Reconciliation",
                color = TextPrimary,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Verify vehicle cylinders taken vs delivered vs returned with cash & UPI collections",
                color = TextSecondary,
                fontSize = 12.sp
            )
        }

        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardDark)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(text = "Summary for Delivery Route (Van #1)", color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Cylinders Loaded (Morning):", color = TextSecondary, fontSize = 12.sp)
                        Text(text = "40 Units", color = TextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Cylinders Delivered:", color = TextSecondary, fontSize = 12.sp)
                        Text(text = "38 Units", color = AccentEmerald, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Empty Cylinders Collected:", color = TextSecondary, fontSize = 12.sp)
                        Text(text = "38 Units", color = AccentCyan, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Remaining Full Cylinders in Van:", color = TextSecondary, fontSize = 12.sp)
                        Text(text = "2 Units", color = AccentOrange, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                    Divider(modifier = Modifier.padding(vertical = 12.dp), color = CardBorder)
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Cash Collected:", color = TextSecondary, fontSize = 12.sp)
                        Text(text = "₹19,272", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "UPI Collected:", color = TextSecondary, fontSize = 12.sp)
                        Text(text = "₹11,242", color = AccentCyan, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(text = "Total Money Handover:", color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                        Text(text = "₹30,514", color = AccentEmerald, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}
