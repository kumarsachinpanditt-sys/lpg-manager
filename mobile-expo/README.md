# Bharat Gas Care Agency — Expo ERP

Offline-first Android application foundation using React Native, Expo and SQLite.

## Run
```bash
cd mobile-expo
npm install
npx expo start
```

## Android debug APK
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
``
APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## First login
On first launch create the Super Admin using a mobile number and 4-digit PIN. No default credentials are shipped.

## Included foundation
- SQLite local database, WAL mode and relational tables for users, roles, locations, categories, stock, customers, transactions, handover receipts and agency vault.
- 14.2 KG Domestic, 19 KG Commercial and 5 KG Chotu categories seeded.
- Atomic stock sale, internal stock transfer, vendor inward and staff cash handover operations.
- Stock sufficiency checks, input validation, customer pending empty dues and credit dues.
- Admin/staff role-aware dashboard and basic billing, inventory and ledger screens.
- SHA-256 PIN hash (not plaintext).

## Important release notes
This is an initial functional foundation, not a certified production ERP. Before agency deployment, finish and test: server-side authorization, Supabase sync/conflict resolution, signed immutable audit records, complete manager-vs-admin permission matrix, cash physical reconciliation, stock adjustment approvals, PDF invoice/report export, vehicle assignment workflows, backups/restore, and device-to-device sync. Test all financial and stock flows with sample data before live use.
