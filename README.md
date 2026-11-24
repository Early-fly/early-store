# EARLY STORE — Firebase Spark edition

Website e-commerce React + Vite untuk GitHub Pages dan Firebase Authentication + Cloud Firestore. Versi ini disesuaikan agar **tidak menggunakan Firebase Storage, Cloud Functions, atau layanan yang memerlukan Blaze**.

## Batasan versi Spark (wajib dibaca)
- Foto produk dan QRIS menggunakan URL gambar HTTPS dari layanan/hosting gambar eksternal. Tidak ada upload file langsung ke Firebase.
- Bukti pembayaran tidak diunggah. Pelanggan dapat mengisi nomor referensi/berita transfer; admin memeriksa pembayaran secara manual.
- Checkout menulis dokumen pesanan langsung ke Firestore. Harga produk dibaca ulang dari Firestore oleh aplikasi, tetapi karena tidak ada backend tepercaya, **admin wajib memeriksa total, stok, dan pembayaran secara manual sebelum menyetujui pesanan**.
- Stok tidak otomatis dikurangi atau dikunci saat checkout. Hindari menerima pesanan melebihi stok.
- Tidak ada verifikasi pembayaran otomatis, pengembalian stok otomatis, atau backend server.
- Firestore Rules membatasi pelanggan agar hanya membuat pesanan untuk UID sendiri dan tidak dapat mengubah/menghapus pesanan setelah dibuat. Admin dapat memperbarui status.
- Ini starter project; lakukan pengujian dengan pesanan percobaan sebelum dipakai menerima transaksi nyata.

## Persyaratan
- Project Firebase pada paket Spark (gratis). Jangan upgrade ke Blaze jika tidak ingin mengaktifkan billing.
- Authentication Email/Password dan Cloud Firestore aktif.
- Repository GitHub publik untuk GitHub Pages pada paket GitHub Free.

## Konfigurasi Firebase Web
1. Firebase Console → Project settings → Your apps → Web app.
2. Salin nilai `apiKey`, `authDomain`, `projectId`, `messagingSenderId`, dan `appId`.
3. Untuk lokal, salin `.env.example` menjadi `.env` dan isi nilainya.
4. Aktifkan Authentication → Sign-in method → Email/Password.
5. Buat Cloud Firestore. Tidak perlu membuat Storage bucket.
6. Jalankan `npm install`, lalu `npm run dev`.

Firebase Web API key bukan password server. Jangan pernah memasukkan service account/private key ke source code atau GitHub.

## Deploy Firestore Rules dan Indexes (opsional dari komputer)
Instal Firebase CLI dan login:
```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,firestore:indexes
```
Rules juga dapat ditempel melalui Firebase Console → Firestore Database → Rules. Pastikan rules sudah dipasang sebelum membuka aplikasi ke publik.

## Menyiapkan admin pertama
1. Daftarkan akun melalui halaman Daftar pada website.
2. Firebase Console → Authentication → Users: salin UID akun tersebut.
3. Firebase Console → Firestore Database → Data: buat collection `users` (jika belum ada), document ID harus sama persis dengan UID.
4. Isi dokumen dengan field:
```json
{
  "uid": "UID_DARI_AUTHENTICATION",
  "name": "Admin EARLY STORE",
  "email": "email-admin",
  "role": "admin"
}
```
5. Logout dan login kembali di website. Jangan pernah mengubah role pelanggan menjadi admin melalui frontend.
6. Menu Pengaturan → Keamanan akun admin menyediakan ganti password (password saat ini, password baru minimal 8 karakter, konfirmasi).

Firestore Console menggunakan hak pemilik project untuk bootstrap awal; jangan membagikan akses pemilik Firebase kepada pelanggan.

## Pengaturan toko awal
Setelah admin aktif, buat dokumen Firestore:
- Collection: `storeSettings`
- Document ID: `main`
- Fields:
```json
{
  "storeName": "EARLY STORE",
  "tagline": "SHOP SMART. LIVE BETTER.",
  "shippingCost": 0,
  "transferEnabled": true,
  "qrisEnabled": true,
  "cashEnabled": true,
  "bankAccounts": [],
  "qrisImageUrl": ""
}
```
Admin dapat memperbarui nama toko, tagline, ongkir, dan URL QRIS dari halaman Pengaturan. Rekening bank dapat ditambahkan ke array `bankAccounts` melalui dokumen Firestore; UI pengelolaan rekening lengkap belum tersedia.

## Deploy GitHub Pages
1. Upload seluruh isi folder proyek ke repository `early-store`, termasuk folder tersembunyi `.github`.
2. Repository → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Settings → Secrets and variables → Actions → Variables, tambahkan:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. Isi nilai dari Firebase Web App config. `storageBucket` boleh diisi nilai dari config walaupun Storage tidak digunakan.
5. Push/commit ke branch `main`. Workflow GitHub Actions akan menjalankan `npm install`, build, dan deploy.
6. Alamat website umumnya `https://early-fly.github.io/early-store/`.
7. Firebase Authentication → Settings → Authorized domains: tambahkan `early-fly.github.io`.

## Struktur data
- `users/{uid}`: profil pelanggan/admin.
- `products/{productId}`: katalog produk.
- `orders/{orderId}`: pesanan pelanggan dan status.
- `storeSettings/main`: nama toko, ongkir, metode pembayaran, rekening, dan URL QRIS.

## Fitur yang tersedia pada starter
- Katalog produk dari Firestore dan pencarian.
- Keranjang lokal browser.
- Registrasi/login email dan password.
- Area admin berdasarkan `users/{uid}.role`.
- Tambah/hapus produk dengan URL foto.
- Pengaturan toko dasar dan URL QRIS.
- Checkout pickup/delivery dan cash/transfer/QRIS.
- Riwayat pesanan pelanggan.
- Admin dapat mengubah status pesanan dan menandai pembayaran.
- Admin dapat mengganti password dari halaman pengaturan.

## Fitur yang belum lengkap
- Edit produk (saat ini tambah dan hapus).
- Upload gambar langsung dan upload bukti pembayaran.
- CRUD rekening bank lengkap dari UI.
- Verifikasi bukti transfer otomatis, notifikasi, refund dan pengurangan stok otomatis.
- Dashboard grafik, audit log, serta sistem tracking internal.
