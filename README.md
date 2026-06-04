# FinSmart Backend API

FinSmart adalah aplikasi pencatatan keuangan cerdas yang didukung oleh Artificial Intelligence (AI) untuk membantu pengguna melacak, menganalisis, dan memprediksi kebiasaan finansial mereka. Repositori ini berisi layanan *backend* (API) untuk aplikasi FinSmart.

## ✨ Fitur Utama

- **Authentication & Authorization**: Registrasi dengan verifikasi OTP via email, Login JWT standar, dan integrasi Single Sign-On (SSO) Google.
- **Transaction Management**: Mendukung pencatatan pemasukan dan pengeluaran.
- **AI Integration**:
  - **Auto-Categorization**: Kategorisasi pengeluaran secara otomatis menggunakan AI.
  - **Predictive Spending**: Memprediksi pengeluaran bulan depan berdasarkan histori transaksi.
  - **FinBot**: Asisten AI pintar (Chatbot) untuk bertanya seputar keuangan.
  - **Behavior & Investment Insights**: Memberikan analisis dan rekomendasi instrumen investasi berdasarkan kebiasaan keuangan pengguna.
- **Budgeting**: Pembuatan target anggaran (budget) dengan pelacakan status secara *real-time*.
- **Dashboard & Analytics**: Menyediakan rangkuman keuangan, metrik bulanan, dan *breakdown* berdasarkan kategori.
- **Cloud Storage**: Terintegrasi dengan Cloudinary untuk penyimpanan foto profil.

## 🛠️ Tech Stack

- **Framework**: Node.js dengan Express.js
- **Bahasa**: TypeScript
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (Supabase)
- **Security**: bcrypt (Password Hashing), jsonwebtoken (JWT Auth)
- **Validation**: Yup
- **Cloud Storage**: Cloudinary
- **Mailing**: Nodemailer
- **API Documentation**: Swagger UI & Swagger Autogen

## 🚀 Prasyarat Instalasi

Sebelum memulai, pastikan Anda telah menginstal:
- [Node.js](https://nodejs.org/) (Versi 18+ direkomendasikan)
- [PostgreSQL](https://www.postgresql.org/) atau akun [Supabase](https://supabase.com/)
- Akun [Cloudinary](https://cloudinary.com/) (Untuk penyimpanan gambar)
- Kredensial SMTP (Misal: Gmail App Password untuk fitur kirim OTP)
- Google Cloud Console Project (Untuk Client ID Google SSO)

## ⚙️ Cara Penggunaan (Setup)

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/FinSmartTeam/backend-FinSmart.git
   cd backend-FinSmart
   ```

2. **Install semua dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Buat file `.env` di *root* folder proyek dengan merujuk pada `.env.example`:
   ```env
   # Database (Supabase / Postgres)
   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
   
   # JWT & App
   JWT_SECRET=supersecretkey_anda
   PORT=3000
   
   # URL AI Service (Python FastAPI backend)
   AI_SERVICE_URL=https://web-production-xxxx.up.railway.app
   
   # Integrasi Google SSO
   GOOGLE_CLIENT_ID=client_id_anda.apps.googleusercontent.com
   
   # Konfigurasi SMTP Email (Nodemailer)
   EMAIL_SMTP_SECURE=true
   EMAIL_SMTP_PORT=465
   EMAIL_SMTP_HOST=smtp.gmail.com
   EMAIL_SMTP_USER=email_anda@gmail.com
   EMAIL_SMTP_PASS=password_app_anda
   EMAIL_SMTP_SERVICE_NAME=FinSmart App
   
   # Konfigurasi Cloudinary
   CLOUDINARY_CLOUD_NAME=nama_cloud_anda
   CLOUDINARY_API_KEY=api_key_anda
   CLOUDINARY_API_SECRET=api_secret_anda
   ```

4. **Migrasi Database (Drizzle ORM):**
   Dorong skema tabel ke database Anda:
   ```bash
   npm run db:push
   ```

5. **Generate Dokumentasi Swagger (Opsional):**
   ```bash
   npm run docs
   ```

6. **Jalankan Aplikasi (Development Mode):**
   ```bash
   npm run dev
   ```
   *Server akan berjalan di `http://localhost:3000` (atau PORT yang Anda set di `.env`).*

## 📚 Daftar Endpoint API

Semua endpoint dilindungi dengan otentikasi **Bearer Token (JWT)**, kecuali rute login, registrasi, dan aktivasi.

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/auth/register` | Mendaftarkan akun baru dan mengirimkan OTP |
| `POST` | `/api/auth/activation` | Mengaktifkan akun menggunakan kode OTP 6-digit |
| `POST` | `/api/auth/login` | Login standar dengan email dan password |
| `POST` | `/api/auth/google` | Login/Register menggunakan Google SSO ID Token |
| `GET`  | `/api/auth/me` | Mengambil data profil user yang sedang login |
| `PUT`  | `/api/auth/profile` | Mengubah nama, password, atau foto profil (multipart/form-data) |

### 💰 Transactions (`/api/transactions`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/transactions` | Membuat 1 transaksi (Expense diproses AI jika diaktifkan) |
| `POST` | `/api/transactions/bulk` | Membuat banyak transaksi sekaligus dalam 1 request array |
| `GET`  | `/api/transactions` | Mengambil seluruh histori transaksi (mendukung filter) |
| `GET`  | `/api/transactions/:id` | Mengambil detail 1 transaksi berdasarkan ID |
| `PUT`  | `/api/transactions/:id` | Mengubah sebagian data (Partial Update) transaksi |
| `DELETE`| `/api/transactions/:id` | Menghapus transaksi berdasarkan ID |

### 🎯 Budgets (`/api/budgets`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/budgets` | Membuat alokasi/batas anggaran baru |
| `GET`  | `/api/budgets` | Menampilkan seluruh daftar anggaran user |
| `GET`  | `/api/budgets/status` | Mengambil status pemakaian (terpakai vs sisa) setiap budget |
| `GET`  | `/api/budgets/:id` | Mengambil detail 1 anggaran spesifik |
| `PUT`  | `/api/budgets/:id` | Mengubah konfigurasi anggaran |
| `DELETE`| `/api/budgets/:id` | Menghapus anggaran |

### 📊 Dashboard & Reports (`/api/dashboard` & `/api/reports`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET`  | `/api/dashboard/summary` | Rangkuman Income, Expense, dan Balance total |
| `GET`  | `/api/dashboard/category-breakdown` | Persentase pengeluaran/pemasukan berdasarkan Kategori |
| `GET`  | `/api/dashboard/monthly` | Data agregat untuk grafik bulanan |
| `GET`  | `/api/dashboard/recent-transactions` | Daftar transaksi terbaru |
| `GET`  | `/api/reports/monthly` | Laporan PDF/Data bulanan pengguna |

### 🤖 AI Services & Insights (`/api/ai` & `/api/insights`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET`  | `/api/ai/valid-values` | Daftar nilai (termasuk Kategori) yang dimengerti oleh Model AI |
| `GET`  | `/api/ai/model-info` | Informasi model AI yang sedang melayani |
| `POST` | `/api/ai/finbot-chat` | Chatbot interaktif (Kirim teks pertanyaan, terima jawaban) |
| `GET`  | `/api/ai/predict-spending` | Memprediksi angka pengeluaran bulan depan dari histori |
| `GET`  | `/api/insights/behavior` | Analisis perilaku keuangan user dari AI |
| `GET`  | `/api/insights/rekomendasi` | Rekomendasi porsi tabungan & investasi ideal |

## 📄 API Documentation (Swagger)
Aplikasi ini sudah mengimplementasikan Swagger Autogen. Apabila *service* sedang menyala, seluruh dokumentasi dan interaktif *playground* API dapat diakses melalui *browser* pada tautan:
**`http://localhost:3000/docs`**

---
*Dibuat untuk Tim FinSmart. © 2026*