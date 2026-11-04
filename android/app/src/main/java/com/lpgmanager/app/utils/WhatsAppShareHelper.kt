package com.lpgmanager.app.utils

import android.content.Context
import android.content.Intent
import androidx.core.content.FileProvider
import com.lpgmanager.app.data.model.LpgTransaction
import java.io.File

object WhatsAppShareHelper {

    /**
     * Dispatches the generated PDF receipt directly to WhatsApp with pre-filled English message
     */
    fun shareReceiptToWhatsApp(
        context: Context,
        pdfFile: File,
        transaction: LpgTransaction,
        customerMobile: String
    ) {
        val uri = FileProvider.getUriForFile(
            context,
            "${context.packageName}.fileprovider",
            pdfFile
        )

        val cleanPhone = customerMobile.replace(Regex("[^0-9]"), "")
        val formattedPhone = if (cleanPhone.length == 10) "91$cleanPhone" else cleanPhone

        val messageText = """
            *SHREE GANESH GAS AGENCY (Authorized LPG Distributor)*
            Dear Customer ${transaction.customerName},
            Your delivery of ${transaction.quantity}x ${transaction.cylinderType} cylinder has been successfully completed.
            
            Cash Memo / Receipt No: ${transaction.id}
            Total Amount: INR ${transaction.totalAmount}
            Amount Paid: INR ${transaction.paidAmount} (${transaction.paymentMode})
            ${if (transaction.balanceDue > 0) "Balance Due: INR ${transaction.balanceDue}" else "Payment Status: Fully Paid"}
            Empty Cylinders Received: ${transaction.emptyReturned} of ${transaction.quantity}
            
            24x7 LPG Emergency Helpline: 1906
        """.trimIndent()

        val shareIntent = Intent(Intent.ACTION_SEND).apply {
            type = "application/pdf"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_TEXT, messageText)
            putExtra("jid", "$formattedPhone@s.whatsapp.net") // Direct WhatsApp recipient if available
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }

        try {
            shareIntent.setPackage("com.whatsapp")
            context.startActivity(shareIntent)
        } catch (e: Exception) {
            // Fallback to standard Android share chooser if WhatsApp isn't installed
            shareIntent.setPackage(null)
            val chooser = Intent.createChooser(shareIntent, "Share LPG Cash Memo")
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(chooser)
        }
    }
}
