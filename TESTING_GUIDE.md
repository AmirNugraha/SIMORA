# 🧪 SIMORA Testing Guide

## 🚀 Setup & Jalankan Server

### 1. Jalankan Laravel Server
```bash
cd /c/laragon/www/SIMORA
/c/laragon/bin/php/php-8.3.16-Win32-vs16-x64/php.exe artisan serve
```

### 2. Jalankan Vite Dev Server (Terminal Baru)
```bash
cd /c/laragon/www/SIMORA
export PATH="/c/laragon/bin/nodejs/node-v22:$PATH"
npm run dev
```

### 3. Buka Browser
http://127.0.0.1:8000

---

## 👥 Test Users (Sudah Dibuat oleh Seeder)

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| `admin@bpdas-barito.go.id` | `password` | admin | **Full CRUD** |
| `operator@bpdas-barito.go.id` | `password` | operator | **Full CRUD** |

### Buat User Viewer Manual (Opsional)
```bash
php artisan tinker
```
```php
\App\Models\User::create([
    'name' => 'User Viewer',
    'email' => 'viewer@bpdas-barito.go.id',
    'password' => bcrypt('password'),
    'role' => 'viewer'
]);
```

---

## 🧪 Skenario Pengujian

### ✅ **TEST 1: Akses Tanpa Login (Guest/Viewer Mode)**

**Steps:**
1. Buka http://127.0.0.1:8000 **tanpa login**
2. Klik menu **Tata Usaha**, **PEV**, **RHL**, atau **PKDAS**

**Expected:**
- ✅ Dashboard menampilkan data kegiatan yang sudah di-seed
- ✅ Semua data terlihat (read-only)
- ❌ **TIDAK ada** tombol: "Tambah Kegiatan Baru", "Input Realisasi", "Ubah", "Hapus"
- ❌ **TIDAK ada** tombol quick-add (+) di komponen
- ❌ **TIDAK ada** tombol delete log (ikon trash)

**Check di Tab Capaian Target:**
- ✅ Data performance terlihat
- ❌ Input target bulanan: **readOnly** (tidak bisa edit)
- ❌ Select status: **disabled**
- ❌ Textarea kendala & rekomendasi: **readOnly**

---

### ✅ **TEST 2: Login sebagai ADMIN/OPERATOR (Full Access)**

**Steps:**
1. Klik **Login** → Email: `admin@bpdas-barito.go.id`, Password: `password`
2. Setelah login, kembali ke halaman utama

**Expected:**
- ✅ Semua tombol CRUD **muncul**:
  - "Tambah Kegiatan Baru" (di halaman bidang)
  - "Input Realisasi", "Ubah", "Hapus" (per kegiatan)
  - Quick-add (+) di setiap komponen
  - Delete log (trash icon)

**Check di Tab Capaian Target:**
- ✅ Input target bulanan: **editable** (bisa ketik angka)
- ✅ Select status: **enabled**
- ✅ Textarea kendala & rekomendasi: **editable**

---

### ✅ **TEST 3: CRUD Kegiatan (Create)**

**Steps:**
1. Login sebagai `operator@bpdas-barito.go.id`
2. Klik menu **Tata Usaha**
3. Klik **"Tambah Kegiatan Baru"**
4. Isi form:
   - Kode: `TU-TEST-001`
   - Kategori: `Tata Usaha`
   - Belanja: `52`
   - Sumber Dana: `RM`
   - Nama Kegiatan: `Testing CRUD Kegiatan Baru`
   - Klik **"+ Tambah Baris"** untuk komponen:
     - Kode Akun: `521111`
     - Nama: `Komponen Test 1`
     - Pagu: `5000000`
   - (Opsional) Tambah komponen kedua
   - Dana Blokir: `0`
5. Klik **"Tambahkan Kegiatan"**

**Expected:**
- ✅ Modal menutup
- ✅ Toast muncul: "Data berhasil disimpan."
- ✅ Kegiatan baru muncul di list Tata Usaha
- ✅ **Optimistic UI:** Data langsung muncul tanpa refresh
- ✅ Spinner muncul saat submit (tombol disabled + "Menyimpan...")

**Error Scenario:**
- Kosongkan field "Nama Kegiatan" → Submit → Toast error: validasi "kegiatan field is required"

---

### ✅ **TEST 4: CRUD Kegiatan (Update)**

**Steps:**
1. Pada kegiatan yang baru dibuat, klik **"Ubah"**
2. Ganti nama kegiatan menjadi: `Testing Update Kegiatan`
3. Ubah pagu komponen menjadi `10000000`
4. Klik **"Simpan Perubahan"**

**Expected:**
- ✅ Toast: "Data berhasil disimpan."
- ✅ Perubahan langsung terlihat tanpa refresh
- ✅ Spinner muncul saat submit

---

### ✅ **TEST 5: Input Realisasi (Create Log)**

**Steps:**
1. Klik **"Input Realisasi"** pada kegiatan testing
2. Form timeline terbuka
3. Isi form:
   - Komponen: Pilih `[521111] Komponen Test 1`
   - Tanggal: `2026-02-24`
   - Nominal: `1500000`
   - Keterangan: `Pembayaran testing pertama`
4. Klik **"Simpan Realisasi"**

**Expected:**
- ✅ Toast: "Realisasi berhasil disimpan."
- ✅ Log muncul di panel kanan (Riwayat Transaksi)
- ✅ **Optimistic UI:** Log langsung muncul sebelum server response
- ✅ Total realisasi komponen update otomatis
- ✅ Form direset (deskripsi & nominal kosong, komponen tetap)

**Test Quick-Add (+):**
1. Tutup timeline, kembali ke list kegiatan
2. Expand komponen (klik chevron)
3. Klik tombol **"+"** biru di kanan komponen
4. Timeline terbuka dengan komponen **sudah terpilih**
5. Tambahkan realisasi kedua

**Expected:**
- ✅ Komponen otomatis terpilih di dropdown

---

### ✅ **TEST 6: Delete Log**

**Steps:**
1. Di expanded komponen view, klik ikon **trash** (muncul saat hover)
2. Log langsung hilang (no confirmation)

**Expected:**
- ✅ Log hilang dari UI (optimistic)
- ✅ Jika API error, log muncul lagi (rollback)
- ✅ Total realisasi komponen update otomatis

---

### ✅ **TEST 7: Delete Kegiatan**

**Steps:**
1. Klik **"Hapus"** pada kegiatan testing
2. Konfirmasi popup browser: **OK**

**Expected:**
- ✅ Kegiatan hilang dari list (optimistic)
- ✅ Toast: "Kegiatan dihapus."
- ✅ Jika timeline sedang terbuka untuk kegiatan ini → otomatis tutup

---

### ✅ **TEST 8: Performance Data - Debounced Auto-Save**

**Steps:**
1. Klik menu **"Capaian Target"**
2. Pilih bidang: **Tata Usaha**
3. Ketik target bulanan di input Januari: `5000000`
4. **Tunggu 1.5 detik** tanpa ketik apapun
5. Buka DevTools → Network tab → filter `performance`
6. Lihat request `PUT /api/performance/Tata%20Usaha`

**Expected:**
- ✅ Request **TIDAK langsung** terkirim saat mengetik
- ✅ Request terkirim **setelah 1.5 detik** berhenti mengetik
- ✅ Jika ketik lagi sebelum 1.5s → timer reset, hanya 1 request terkirim

**Test Status, Kendala, Rekomendasi:**
1. Ubah status → `Tercapai` (hijau)
2. Isi textarea **Kendala**: `Cuaca buruk menghambat pekerjaan`
3. Isi **Rekomendasi**: `Perlu alokasi dana tambahan`
4. Tunggu 1.5 detik
5. Cek Network: `PUT /api/performance/Tata%20Usaha` dengan payload lengkap

**Expected:**
- ✅ Semua field (status, kendala, rekomendasi, monthlyTargets) terkirim dalam 1 request
- ✅ Debounce bekerja untuk semua field

---

### ✅ **TEST 9: Role-Based Access Control (RBAC)**

**Scenario A: Viewer mencoba akses API langsung**
1. Buka DevTools Console
2. Jalankan:
```javascript
await axios.post('/api/kegiatans', {
  kategori: 'Tata Usaha',
  kode: 'HACK',
  kegiatan: 'Hacking',
  pagu: 1000000,
  belanja: '52',
  sumber_dana: 'RM',
  komponen: []
})
```

**Expected:**
- ❌ Response: `403 Forbidden`
- ✅ Toast error: "Akses ditolak. Anda tidak memiliki izin."

**Scenario B: Operator berhasil akses API**
1. Login sebagai `operator@bpdas-barito.go.id`
2. Jalankan request yang sama

**Expected:**
- ✅ Response: `201 Created`
- ✅ Data kegiatan berhasil dibuat

---

### ✅ **TEST 10: Optimistic UI Rollback (Error Handling)**

**Simulasi API Error:**
1. Login sebagai operator
2. Buka DevTools → Network tab → klik kanan request → Block request pattern: `/api/kegiatans`
3. Coba tambah kegiatan baru
4. Submit form

**Expected:**
- ✅ Data muncul di UI (optimistic)
- ❌ Request gagal (blocked)
- ✅ Modal **muncul lagi** (rollback)
- ✅ Data **hilang** dari UI
- ✅ Toast error: "Terjadi kesalahan server. Silakan coba lagi."

**Unblock request:**
- DevTools → Network → Remove blocked URL → coba lagi

---

### ✅ **TEST 11: Validation Error Handling**

**Steps:**
1. Tambah kegiatan baru
2. Isi komponen dengan pagu: `-500000` (angka negatif)
3. Submit

**Expected:**
- ❌ Response: `422 Unprocessable Entity`
- ✅ Toast error menampilkan pesan validasi Laravel (misal: "pagu must be at least 0")

---

### ✅ **TEST 12: Concurrent Editing (Multi-field Debounce)**

**Steps:**
1. Di Capaian Target → Tata Usaha
2. Ketik target Januari: `5000000`
3. **Sebelum 1.5s**, ketik target Februari: `6000000`
4. **Sebelum 1.5s**, ubah status → `Tercapai`
5. Tunggu 1.5 detik
6. Cek Network

**Expected:**
- ✅ Hanya **1 request** terkirim
- ✅ Request berisi **semua perubahan** (Januari, Februari, status)
- ✅ Timer reset setiap kali ada perubahan

---

### ✅ **TEST 13: Loading State & Disabled Buttons**

**Steps:**
1. Tambah kegiatan baru
2. **Sambil submit loading**, coba klik tombol submit lagi

**Expected:**
- ✅ Tombol submit disabled (opacity 60%, cursor not-allowed)
- ✅ Spinner muncul dengan teks "Menyimpan..."
- ❌ **TIDAK bisa** double-submit

---

### ✅ **TEST 14: Backup JSON (Masih Berfungsi)**

**Steps:**
1. Klik sidebar → **"Backup JSON"**

**Expected:**
- ✅ File JSON ter-download: `simora_backup_2026-02-24.json`
- ✅ Isi file berisi array semua kegiatan dengan komponen & logs

*(Note: Restore JSON sudah dihapus karena data sekarang di database)*

---

## 🔍 Debugging Tips

### Cek Database Secara Manual
```bash
php artisan tinker
```
```php
// Lihat semua kegiatan
\App\Models\Kegiatan::with('komponens.logs')->get();

// Lihat performance data
\App\Models\PerformanceData::all();

// Lihat user role
\App\Models\User::pluck('role', 'email');
```

### Clear Cache Jika Ada Masalah
```bash
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear
```

### Tail Laravel Log
```bash
tail -f storage/logs/laravel.log
```

---

## ✅ Checklist Fitur yang Harus Berfungsi

- [ ] Guest/viewer bisa lihat data, tapi **NO write buttons**
- [ ] Operator/admin bisa **CRUD kegiatan**
- [ ] Operator/admin bisa **input realisasi**
- [ ] Operator/admin bisa **delete log**
- [ ] **Optimistic UI** untuk semua operasi CRUD
- [ ] **Rollback** saat API error
- [ ] **Debounce 1.5s** untuk performance data
- [ ] **Loading state** dengan spinner saat submit
- [ ] **Validation error** ditampilkan di toast
- [ ] **403 Forbidden** untuk viewer yang coba POST/PUT/DELETE
- [ ] API returns **201** untuk POST, **204** untuk DELETE
- [ ] **Role-based UI** (tombol muncul/hilang sesuai role)

---

## 🎯 Expected API Behavior

| Endpoint | Method | Auth | Role | Response |
|----------|--------|------|------|----------|
| `/api/kegiatans` | GET | ❌ No | - | 200 OK |
| `/api/kegiatans` | POST | ✅ Yes | operator/admin | 201 Created |
| `/api/kegiatans/{id}` | PUT | ✅ Yes | operator/admin | 200 OK |
| `/api/kegiatans/{id}` | DELETE | ✅ Yes | operator/admin | 204 No Content |
| `/api/komponens/{id}/logs` | POST | ✅ Yes | operator/admin | 201 Created |
| `/api/logs/{id}` | DELETE | ✅ Yes | operator/admin | 204 No Content |
| `/api/performance` | GET | ❌ No | - | 200 OK |
| `/api/performance/{kategori}` | PUT | ✅ Yes | operator/admin | 200 OK |

**Unauthorized Access:**
- Guest POST/PUT/DELETE → **401 Unauthorized** (redirected to login)
- Viewer (logged in) POST/PUT/DELETE → **403 Forbidden**

---

## 📊 Performance Metrics

- **Debounce delay:** 1500ms
- **Optimistic UI:** Instant (0ms perceived latency)
- **API response time:** < 200ms (depends on server)
- **Build size:** ~87KB (Simora.js gzipped)

---

**Happy Testing! 🚀**
