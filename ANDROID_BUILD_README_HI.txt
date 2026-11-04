LPG MANAGER - ANDROID APK BUILD (PHONE SE)

1. GitHub par sign in karein aur New repository banayein (Public ya Private).
2. Is ZIP ko extract karke iske andar ka poora content repository mein upload karein. ZIP file ko as-is upload na karein.
3. Commit changes karein.
4. Repository mein Actions tab kholein.
5. 'Build LPG Manager APK' workflow select karein, phir Run workflow dabayein.
6. Build complete hone par workflow run kholein. Neeche Artifacts mein lpg-manager-debug-apk download karein.
7. Downloaded ZIP ko phone par extract karein; app-debug.apk par tap karke install karein. Android agar permission maange to browser/files app ke liye Install unknown apps allow karein.

IMPORTANT:
- Ye workflow build attempt karta hai; compile errors aa sakte hain aur unhe fix karna pad sakta hai.
- Firebase cloud sync abhi configured nahi hai. Android ke liye Firebase Console mein Android app register karke google-services.json add karna hoga. Is file ke bina app local/demo mode mein launch ho sakta hai, lekin cloud sync/auth kaam nahi karega.
- APK install karne se pehle Android Play Protect warning ko dhyan se dekhein. APK sirf apne trusted repository build se install karein.
