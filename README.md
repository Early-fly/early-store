# EARLY STORE
E-commerce starter berbasis React + Vite, GitHub Pages, Firebase Authentication, Firestore, Storage, dan Cloud Functions.

## Status dan batasan penting
Ini adalah source project awal yang dapat dijalankan setelah konfigurasi Firebase. **Belum terhubung ke project Firebase Anda, belum dideploy, dan belum lulus pengujian operasional.** Jangan menerima pembayaran sungguhan sebelum menyelesaikan seluruh langkah setup, hardening, dan pengujian.

Fitur awal yang tersedia: katalog Firestore, cart lokal, registrasi/login Firebase, area admin berbasis custom claim, pengelolaan tambah produk, pengaturan dasar toko, daftar pesanan, checkout yang memanggil Cloud Function, dan rules dasar. Beberapa panel admin (edit produk, verifikasi UI, log viewer, grafik, rekening/QRIS CRUD, tracking workflow) masih perlu diselesaikan. Backend callable verifikasi sudah disediakan sebagai fondasi, tetapi UI tombol verifikasi belum memanggilnya. Harga/stok checkout dihitung ulang di backend. Stok dikurangi saat pesanan dibuat; jika pesanan dibatalkan, implementasikan pengembalian stok yang atomik sebelum operasional.

## Prasyarat
- Node.js 20+
- Project Firebase dengan billing plan yang mendukung Cloud Functions (Blaze untuk deploy Functions)
- GitHub repository
- Firebase CLI: `npm i -g firebase-tools`

## Menjalankan lokal
1. `npm install`
2. Salin `.env.example` menjadi `.env`.
3. Isi Firebase Web App config dari Firebase Console → Project settings → Your apps.
4. Aktifkan Authentication → Sign-in method → Email/Password.
5. Buat Firestore Database dan Storage bucket.
6. `npm run dev`

Firebase web config memang dapat berada di frontend; keamanan wajib berasal dari Security Rules dan validasi backend. Jangan masukkan service account/private key.

## Setup Firebase
1. Buat project di Firebase Console.
2. Aktifkan Firestore, Authentication (Email/Password), dan Storage.
3. Deploy rules dan indexes:
   `firebase deploy --only firestore:rules,firestore:indexes,storage`
4. Deploy Functions:
   `cd functions && npm install && cd ..`
   `firebase deploy --only functions`
5. Buat admin pertama dari lingkungan tepercaya. Contoh lokal:
   - Buat akun melalui halaman Daftar.
   - Ambil UID akun dari Authentication → Users.
   - Siapkan service account hanya secara lokal, jangan commit.
   - Jalankan skrip Node lokal yang menggunakan `firebase-admin` untuk `getAuth().setCustomUserClaims(uid,{admin:true})`.
   - Logout/login kembali agar token diperbarui.
   - Pastikan user profile role tidak dipakai sebagai sumber otorisasi; token custom claim adalah otoritas.
6. Tambahkan konfigurasi Firestore `storeSettings/main` secara manual sebelum checkout:
   `{storeName:"EARLY STORE", tagline:"SHOP SMART. LIVE BETTER.", shippingCost:0, transferEnabled:true, qrisEnabled:true, cashEnabled:true, bankAccounts:[], qrisImageUrl:"", updatedAt:serverTimestamp()}`
   Masukkan data rekening dan QRIS asli melalui proses admin aman. Jangan gunakan placeholder sebagai instruksi pembayaran nyata.

## Deploy GitHub Pages
1. Push source ke repository GitHub branch `main`.
2. Repository → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Settings → Secrets and variables → Actions → Variables, tambahkan:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
4. Jika nama repository bukan `early-store`, ubah `base` di `vite.config.js` agar sama dengan `/<nama-repository>/`.
5. Push ke `main`; workflow build dan deploy otomatis. Periksa tab Actions dan Pages untuk hasil sebenarnya.
6. GitHub Pages memakai URL repository; aplikasi menggunakan HashRouter agar refresh route tidak memerlukan server fallback.

## Data model
- `users/{uid}`: profil pelanggan; role display tidak memberi akses admin.
- `products/{productId}`: katalog; `isPublished`, `price`, `stock`.
- `orders/{uid_requestKey}`: transaksi dengan `items[]` snapshot nama/harga, status pembayaran dan pesanan terpisah.
- `payments/{paymentId}`: bukti dan status verifikasi.
- `orderLogs/{logId}`: audit append-only dari backend.
- `storeSettings/main`: konfigurasi toko, rekening, QRIS, ongkir.

## Security notes sebelum produksi
- Rules sengaja menolak write langsung ke orders/payments/logs; Cloud Functions memakai Admin SDK.
- Produk bisa dibaca publik hanya jika published. Untuk katalog privat, ubah rule.
- Bukti pembayaran hanya dapat dibaca pemilik dan admin. Aplikasi sebaiknya menampilkan bukti melalui Storage SDK, bukan menjadikan URL download publik.
- Custom claim admin wajib disetel dari lingkungan tepercaya. Jangan pernah menyediakan endpoint publik yang bisa menaikkan role.
- Admin masuk menggunakan Firebase Authentication Email/Password dan hanya akun dengan custom claim `admin:true` yang dapat membuka dashboard. Menu Pengaturan → Keamanan akun admin menyediakan ganti kata sandi: admin wajib memasukkan kata sandi saat ini (reauthentication), kata sandi baru minimal 8 karakter, dan konfirmasi. Proses memakai Firebase `reauthenticateWithCredential` + `updatePassword`; tidak ada kata sandi admin hardcode di source code. Jika lupa kata sandi, gunakan alur reset password Firebase Authentication atau reset dari Firebase Console.
- Tambahkan App Check, rate limiting/abuse protection, validasi URL tracking (https only), batas jumlah item, kebijakan refund stok, dan monitoring.
- Saat ini upload bukti menggunakan Storage path; backend perlu memeriksa keberadaan file dan mengikatnya ke order sebelum verifikasi.
- Firestore rules admin memakai `request.auth.token.admin`; pastikan klaim diberikan hanya oleh operator tepercaya.

## Pengujian
Checklist manual wajib: login customer/admin, tambah produk, katalog, cart, checkout pickup cash/transfer/QRIS, delivery transfer/QRIS, bukti privat, verifikasi approve/reject, pemrosesan pickup, tracking delivery, update rekening/QRIS, audit log, akses lintas akun. Pengujian ini belum dijalankan di project Firebase pemilik.
