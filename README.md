# Sistem Manajemen Tahfidz v3

Arsitektur: **GitHub Pages (frontend) + Supabase (Auth + PostgreSQL)**.

## Fitur utama v3
- Guru mendaftar dengan nama, email, password, dan satu/lebih halaqoh yang diampu.
- Pendaftaran guru masuk ke tabel akun guru dan harus disetujui Koordinator.
- Satu guru dapat mengampu banyak halaqoh.
- Kelas guru juga berupa penugasan yang dapat berjumlah lebih dari satu.
- Nama murid, kelas, dan halaqoh dipilih dari dropdown; tidak diketik manual pada transaksi.
- Nama penguji dikelola CRUD oleh Koordinator.
- Kelas dikelola CRUD oleh Koordinator.
- Halaqoh dikelola CRUD oleh Koordinator.
- Jurnal Tahfidz diisi **1 kali per murid per bulan** dan terhubung ke rekap 3 bulan.
- Guru jurnal memilih halaqoh yang memang ditugaskan kepadanya.
- Rekap 3 bulan diisi oleh guru kelas/partner berdasarkan kelas yang ditugaskan.
- Pengajuan ujian dan verifikasi Koordinator tetap tersedia.
- Data tersimpan di database Supabase, bukan localStorage.
- RLS (Row Level Security) disiapkan dalam `supabase/schema.sql`.

## 1. Buat project Supabase
1. Buat project baru di Supabase.
2. Buka SQL Editor.
3. Jalankan seluruh isi `supabase/schema.sql`.
4. Ambil **Project URL** dan **anon public key** dari Project Settings > API.
5. Isi `js/config.js`.

Jangan masukkan `service_role key` ke frontend/GitHub.

## 2. Akun Koordinator pertama
Setelah schema dijalankan:
1. Daftarkan akun melalui Supabase Authentication.
2. Buka tabel `profiles` dan ubah role menjadi `koordinator` serta `status` menjadi `approved` untuk akun pertama.

Atau gunakan SQL setelah user terdaftar:
```sql
update public.profiles
set role='koordinator', status='approved', nama='Koordinator Tahfidz'
where email='EMAIL_ANDA';
```

## 3. Jalankan lokal
Tidak wajib Node.js. Karena frontend statis, bisa memakai VS Code + Live Server.

Jika menggunakan Python:
```bash
python -m http.server 5500
```
Lalu buka `http://localhost:5500`.

## 4. Hosting GitHub Pages
1. Upload seluruh folder ke repository GitHub.
2. Pastikan `index.html` berada di root repository.
3. Settings > Pages > Deploy from branch > pilih branch `main` dan folder `/root`.
4. Buka URL GitHub Pages.

Database tetap berada di Supabase sehingga semua guru dan koordinator melihat data yang sama.

## Catatan keamanan
- Supabase Auth digunakan untuk login.
- RLS membatasi data berdasarkan role dan penugasan.
- `anon key` memang boleh berada di frontend; `service_role key` tidak boleh.
- Untuk produksi, sebaiknya aktifkan verifikasi email di Supabase Auth.

## Fitur Peraturan & Pengaturan

Versi ini menambahkan menu **Peraturan & Pengaturan** khusus Koordinator untuk:
- mengubah nama lembaga;
- mengganti logo dari komputer (maks. 500 KB);
- memilih tema aplikasi;
- mengelola master Kelas, Halaqoh, dan Penguji yang sudah ada.

Sebelum memakai menu ini pada project Supabase yang sudah ada, jalankan file `migration_peraturan.sql` sekali di Supabase SQL Editor.
