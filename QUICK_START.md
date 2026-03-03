# 🚀 SIMORA Quick Start

## ⚡ Jalankan Aplikasi (2 Terminal)

**Terminal 1 - Laravel:**
```bash
cd /c/laragon/www/SIMORA
/c/laragon/bin/php/php-8.3.16-Win32-vs16-x64/php.exe artisan serve
```

**Terminal 2 - Vite:**
```bash
cd /c/laragon/www/SIMORA
export PATH="/c/laragon/bin/nodejs/node-v22:$PATH"
npm run dev
```

Buka: **http://127.0.0.1:8000**

---

## 👥 Test Credentials

```
📧 admin@bpdas-barito.go.id     🔑 password   👤 ADMIN (Full CRUD)
📧 operator@bpdas-barito.go.id  🔑 password   👤 OPERATOR (Full CRUD)
```

*(Akses tanpa login = Read-Only)*

---

## 🧪 Test Scenarios Cepat

### 1️⃣ Test Read-Only Mode (No Login)
```
✅ Buka http://127.0.0.1:8000
✅ Klik menu Tata Usaha / PEV / RHL / PKDAS
❌ TIDAK ada tombol: Tambah, Ubah, Hapus, Input Realisasi
```

### 2️⃣ Test CRUD (Login sebagai Admin)
```
✅ Login → admin@bpdas-barito.go.id / password
✅ Klik "Tambah Kegiatan Baru"
✅ Isi form → Submit → Lihat optimistic UI
✅ Klik "Ubah" → Edit data → Submit
✅ Klik "Hapus" → Confirm → Data hilang
```

### 3️⃣ Test Input Realisasi
```
✅ Klik "Input Realisasi" pada kegiatan
✅ Pilih komponen → Isi tanggal, nominal, keterangan
✅ Submit → Lihat log muncul instant
✅ Expand komponen → Klik "+" (quick add)
```

### 4️⃣ Test Performance Debounce
```
✅ Menu "Capaian Target"
✅ Ketik target Januari: 5000000
✅ Tunggu 1.5 detik → DevTools Network → PUT /api/performance
✅ Ketik lagi sebelum 1.5s → Timer reset (hanya 1 request)
```

### 5️⃣ Test Error Handling
```
✅ DevTools → Network → Block /api/kegiatans
✅ Coba tambah kegiatan → Submit
✅ Lihat optimistic UI → Rollback → Modal muncul lagi
✅ Toast error muncul
```

### 6️⃣ Test Role-Based Access
```
✅ Logout → Akses tanpa login
✅ DevTools Console → axios.post('/api/kegiatans', {...})
❌ Response: 401 Unauthorized
```

---

## 🔧 Debug Commands

```bash
# Show users
php show-users.php

# Tinker
php artisan tinker
>>> \App\Models\Kegiatan::count()
>>> \App\Models\User::pluck('role', 'email')

# Tail logs
tail -f storage/logs/laravel.log

# Clear cache
php artisan config:clear && php artisan route:clear
```

---

## 📊 API Endpoints

| Method | Endpoint | Auth | Role | Response |
|--------|----------|------|------|----------|
| GET | `/api/kegiatans` | ❌ | - | 200 |
| POST | `/api/kegiatans` | ✅ | operator/admin | 201 |
| PUT | `/api/kegiatans/{id}` | ✅ | operator/admin | 200 |
| DELETE | `/api/kegiatans/{id}` | ✅ | operator/admin | 204 |
| POST | `/api/komponens/{id}/logs` | ✅ | operator/admin | 201 |
| DELETE | `/api/logs/{id}` | ✅ | operator/admin | 204 |
| GET | `/api/performance` | ❌ | - | 200 |
| PUT | `/api/performance/{kategori}` | ✅ | operator/admin | 200 |

---

## ✅ Fitur Checklist

- [x] **MVC Architecture** - Controllers, Models, Services separated
- [x] **SOLID Principles** - FormRequests, Resources, Service layer
- [x] **Clean Code** - Single responsibility, dependency injection
- [x] **Optimistic UI** - Instant updates with rollback on error
- [x] **Debounced API** - 1.5s delay for performance data
- [x] **Role-Based Access** - viewer (read-only) vs operator/admin (full CRUD)
- [x] **Loading States** - Spinner + disabled buttons during submit
- [x] **Error Handling** - Toast notifications for 403, 422, 500
- [x] **Database Storage** - SQLite/MySQL (no localStorage)
- [x] **Cascade Deletes** - FK constraints
- [x] **API Resources** - Transform snake_case to camelCase
- [x] **Shared Data** - One organization, role-based CRUD

---

**📖 Panduan lengkap:** [TESTING_GUIDE.md](TESTING_GUIDE.md)
