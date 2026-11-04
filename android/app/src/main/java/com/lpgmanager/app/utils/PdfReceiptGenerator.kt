package com.lpgmanager.app.utils

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import com.lpgmanager.app.data.model.LpgTransaction
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.Locale

object PdfReceiptGenerator {

    /**
     * Generates a tamper-evident, professional Indian LPG Cash Memo as a PDF file
     * Page dimensions: Standard 595 x 842 points (A4 format)
     */
    fun generateDeliveryReceiptPdf(
        context: Context,
        transaction: LpgTransaction,
        agencyName: String = "Shree Ganesh Gas Agency",
        agencySubtitle: String = "Authorized LPG Distributor",
        distributorCode: String = "1120498",
        gstin: String = "07AAAAA0000A1Z5"
    ): File? {
        val pdfDocument = PdfDocument()
        val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
        val page = pdfDocument.startPage(pageInfo)
        val canvas: Canvas = page.canvas

        val titlePaint = Paint().apply {
            color = Color.rgb(11, 25, 44) // Deep Navy
            textSize = 18f
            isFakeBoldText = true
            textAlign = Paint.Align.CENTER
        }

        val subTitlePaint = Paint().apply {
            color = Color.rgb(100, 116, 139)
            textSize = 11f
            textAlign = Paint.Align.CENTER
        }

        val textPaint = Paint().apply {
            color = Color.rgb(30, 41, 59)
            textSize = 12f
        }

        val boldPaint = Paint().apply {
            color = Color.rgb(15, 23, 42)
            textSize = 12f
            isFakeBoldText = true
        }

        val orangePaint = Paint().apply {
            color = Color.rgb(255, 107, 0) // Flame Orange
            textSize = 13f
            isFakeBoldText = true
        }

        val linePaint = Paint().apply {
            color = Color.rgb(203, 213, 225)
            strokeWidth = 1.5f
        }

        var y = 60f
        val centerX = 297.5f

        // Agency Header
        canvas.drawText(agencyName.uppercase(), centerX, y, titlePaint)
        y += 20f
        canvas.drawText(agencySubtitle, centerX, y, subTitlePaint)
        y += 18f
        canvas.drawText("Distributor Code: $distributorCode | GSTIN: $gstin", centerX, y, subTitlePaint)
        y += 18f
        canvas.drawText("LPG Emergency Helpline: 1906 (24x7)", centerX, y, subTitlePaint)
        y += 25f

        // Divider
        canvas.drawLine(50f, y, 545f, y, linePaint)
        y += 25f

        // Document Title
        canvas.drawText("LPG REFILL CASH MEMO", centerX, y, orangePaint.apply { textAlign = Paint.Align.CENTER })
        orangePaint.textAlign = Paint.Align.LEFT
        y += 25f

        // Receipt Meta (Left and Right Columns)
        val dateFormat = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault())
        val formattedDate = dateFormat.format(transaction.timestamp.toDate())

        canvas.drawText("Receipt No:", 50f, y, textPaint)
        canvas.drawText(transaction.id, 140f, y, boldPaint)
        canvas.drawText("Date/Time:", 330f, y, textPaint)
        canvas.drawText(formattedDate, 410f, y, boldPaint)
        y += 22f

        canvas.drawText("Consumer No:", 50f, y, textPaint)
        canvas.drawText(transaction.consumerNo.ifEmpty { "WALK-IN" }, 140f, y, orangePaint)
        canvas.drawText("Delivery Staff:", 330f, y, textPaint)
        canvas.drawText(transaction.staffName.ifEmpty { "Direct Counter" }, 410f, y, boldPaint)
        y += 22f

        canvas.drawText("Customer:", 50f, y, textPaint)
        canvas.drawText(transaction.customerName.ifEmpty { "Registered Consumer" }, 140f, y, boldPaint)
        y += 30f

        // Table Header
        canvas.drawLine(50f, y, 545f, y, linePaint)
        y += 18f
        canvas.drawText("Description", 50f, y, boldPaint)
        canvas.drawText("Quantity", 260f, y, boldPaint)
        canvas.drawText("Rate (INR)", 370f, y, boldPaint)
        canvas.drawText("Total (INR)", 480f, y, boldPaint)
        y += 10f
        canvas.drawLine(50f, y, 545f, y, linePaint)
        y += 24f

        // Item Row
        val itemDesc = "${transaction.cylinderType} Domestic/Refill"
        canvas.drawText(itemDesc, 50f, y, textPaint)
        canvas.drawText("${transaction.quantity} Cyl", 260f, y, textPaint)
        canvas.drawText("₹%.2f".format(transaction.unitPrice), 370f, y, textPaint)
        canvas.drawText("₹%.2f".format(transaction.totalAmount), 480f, y, boldPaint)
        y += 28f

        // Divider
        canvas.drawLine(50f, y, 545f, y, linePaint)
        y += 22f

        // Payment Summary
        canvas.drawText("Total Amount Payable:", 310f, y, textPaint)
        canvas.drawText("₹%.2f".format(transaction.totalAmount), 480f, y, boldPaint)
        y += 20f

        canvas.drawText("Paid (${transaction.paymentMode}):", 310f, y, textPaint)
        canvas.drawText("₹%.2f".format(transaction.paidAmount), 480f, y, boldPaint)
        y += 20f

        if (transaction.balanceDue > 0) {
            val duePaint = Paint().apply {
                color = Color.rgb(220, 38, 38)
                textSize = 12f
                isFakeBoldText = true
            }
            canvas.drawText("Balance Due:", 310f, y, duePaint)
            canvas.drawText("₹%.2f".format(transaction.balanceDue), 480f, y, duePaint)
            y += 20f
        }

        // Empty Status
        val emptyStatus = if (transaction.emptyReturned == transaction.quantity) {
            "Sound Empty Cylinder Received in Good Condition"
        } else {
            "Empty Cylinder Due: ${transaction.quantity - transaction.emptyReturned} Cylinders Pending"
        }
        canvas.drawText("Empty Status: $emptyStatus", 50f, y, boldPaint)
        y += 40f

        // Security / Verification Badge
        val badgePaint = Paint().apply {
            color = Color.rgb(241, 245, 249)
        }
        canvas.drawRoundRect(50f, y, 545f, y + 60f, 10f, 10f, badgePaint)

        val badgeTextPaint = Paint().apply {
            color = Color.rgb(71, 85, 105)
            textSize = 10f
        }
        canvas.drawText("DIGITALLY CERTIFIED LPG DELIVERY LEDGER", 65f, y + 25f, boldPaint.apply { textSize = 10f })
        canvas.drawText("System Transaction ID: ${transaction.id} | Recorded on Cloud Firestore", 65f, y + 42f, badgeTextPaint)
        y += 90f

        // Footer terms
        val footerPaint = Paint().apply {
            color = Color.rgb(148, 163, 184)
            textSize = 9f
            textAlign = Paint.Align.CENTER
        }
        canvas.drawText("Always inspect seal and tare weight before accepting delivery. Switch off regulator at night.", centerX, y, footerPaint)
        y += 14f
        canvas.drawText("Thank you for choosing safe and clean LPG energy.", centerX, y, footerPaint)

        pdfDocument.finishPage(page)

        // Write to cache file
        val outputDir = File(context.cacheDir, "receipts")
        if (!outputDir.exists()) outputDir.mkdirs()

        val outputFile = File(outputDir, "Receipt_${transaction.id}.pdf")
        try {
            val fos = FileOutputStream(outputFile)
            pdfDocument.writeTo(fos)
            pdfDocument.close()
            fos.close()
            return outputFile
        } catch (e: Exception) {
            e.printStackTrace()
            pdfDocument.close()
            return null
        }
    }
}
