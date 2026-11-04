package com.lpgmanager.app

import android.app.Application
import com.google.firebase.FirebaseApp
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreSettings
import com.google.firebase.firestore.PersistentCacheSettings

/**
 * LPG Manager Application - Configures Firebase and Firestore Offline-First Persistence
 */
class LpgApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        FirebaseApp.initializeApp(this)

        // Configure Cloud Firestore Offline-First Persistent Disk Cache
        // Enables staff in rural / low-connectivity areas to record deliveries uninterrupted
        val settings = FirebaseFirestoreSettings.Builder()
            .setLocalCacheSettings(
                PersistentCacheSettings.newBuilder()
                    .setSizeBytes(100L * 1024 * 1024) // 100 MB persistent cache
                    .build()
            )
            .build()

        FirebaseFirestore.getInstance().firestoreSettings = settings
    }
}
