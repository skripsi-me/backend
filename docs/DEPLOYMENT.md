# Deployment Guide

Panduan lengkap deploy backend e-commerce ke Vercel dengan TiDB database.

---

## Daftar Isi

- [Prasyarat](#prasyarat)
- [Setup TiDB Cloud](#setup-tidb-cloud)
- [Setup Vercel](#setup-vercel)
- [Deploy](#deploy)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Prasyarat

- Akun [TiDB Cloud](https://tidbcloud.com/) (gratis tier tersedia)
- Akun [Vercel](https://vercel.com/) (gratis tier tersedia)
- Node.js 18+ terinstall
- Vercel CLI terinstall (`npm i -g vercel`)
- Git repository (GitHub/GitLab/Bitbucket)

---

## Setup TiDB Cloud

### 1. Buat Cluster

1. Login ke [TiDB Cloud Console](https://tidbcloud.com/console)
2. Klik **Create Cluster**
3. Pilih **Serverless** (gratis)
4. Pilih region terdekat
5. Buat database baru (contoh: `skripsi_db`)
6. Catat connection string yang diberikan

### 2. Ambil Connection String

Format connection string TiDB:

```
mysql://<username>:<password>@<host>:4000/<database>?ssl={"rejectUnauthorized":true}
```

Contoh:
```
mysql://root.xxxxx:password@gateway.tidbcloud.com:4000/skripsi_db?ssl={"rejectUnauthorized":true}
```

### 3. Push Schema ke TiDB

```bash
# Set DATABASE_URL di .env
DATABASE_URL=mysql://root.xxxxx:password@gateway.tidbcloud.com:4000/skripsi_db?ssl={"rejectUnauthorized":true}

# Push schema
npx drizzle-kit push
```

---

## Setup Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

### 2. Login

```bash
vercel login
```

### 3. Inisialisasi Project

```bash
cd backend
vercel
```

Ikuti instruksi di terminal. Pilih:
- **Set up and deploy**: Yes
- **Which scope**: Pilih akun kamu
- **Link to existing project**: No
- **Project name**: sesuai nama project
- **Directory**: `./` (root)
- **Override settings**: No

### 4. Set Environment Variables

```bash
# Database
vercel env add DATABASE_URL production
# Paste connection string TiDB

# Authentication
vercel env add JWT_SECRET production
# Generate secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

vercel env add COOKIE_SECRET production
# Generate secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ImageKit
vercel env add IMAGEKIT_PUBLIC_KEY production
vercel env add IMAGEKIT_PRIVATE_KEY production
vercel env add IMAGEKIT_URL_ENDPOINT production

# Node Environment
vercel env add NODE_ENV production
# Value: production
```

Atau set manual di Vercel Dashboard:
1. Buka project di Vercel
2. Go to **Settings** > **Environment Variables**
3. Tambah semua variabel di atas

---

## Deploy

### Deploy ke Production

```bash
vercel --prod
```

### Deploy via Git

Setelah setup, setiap push ke branch `main` akan otomatis deploy ke production.

1. Push kode ke GitHub
2. Hubungkan repository ke Vercel di Dashboard
3. Set environment variables di Dashboard
4. Deploy otomatis terjadi

---

## Environment Variables

| Variable | Keterangan | Contoh |
|----------|-----------|--------|
| `DATABASE_URL` | TiDB connection string | `mysql://user:pass@host:4000/db?ssl=...` |
| `JWT_SECRET` | Secret untuk JWT signing | `random_hex_string` |
| `COOKIE_SECRET` | Secret untuk cookie signing | `random_hex_string` |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key | `public_xxx` |
| `IMAGEKIT_PRIVATE_KEY` | ImageKit private key | `private_xxx` |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit URL | `https://ik.imagekit.io/xxx` |
| `NODE_ENV` | Environment mode | `production` |

---

## Struktur Project untuk Vercel

```
backend/
├── api/
│   └── index.ts          # Vercel serverless handler
├── src/
│   ├── app.ts            # Fastify app builder
│   ├── config/
│   │   ├── database.ts   # DB connection (supports TiDB)
│   │   └── env.ts        # Env validation
│   └── ...
├── vercel.json           # Vercel configuration
├── package.json
└── drizzle.config.ts     # Drizzle config (supports TiDB)
```

---

## Troubleshooting

### Error: "DATABASE_URL or DATABASE_HOST required"

Pastikan `DATABASE_URL` atau kombinasi `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_NAME` sudah diset di environment variables Vercel.

### Error: "Connection refused"

1. Pastikan IP Vercel di-whitelist di TiDB Cloud (untuk serverless, semua IP bisa akses)
2. Pastikan format connection string benar
3. Cek apakah SSL diperlukan

### Error: "Module not found"

Pastikan build berjalan lancar:
```bash
vercel build
```

Jika ada error, cek log di Vercel Dashboard > Functions.

### Cold Start Lambat

Vercel free tier punya cold start. Solutions:
1. Gunakan Vercel Pro ($20/bulan) untuk lebih cepat
2. Minimalkan jumlah dependencies
3. Gunakan `keepAlive` pada connection pool

### Cookie Tidak Berfungsi

Pastikan frontend mengirim request dengan `credentials: 'include'`:

```javascript
fetch('https://your-app.vercel.app/api/users/me', {
  credentials: 'include'
});
```

---

## Rollback

Jika ada masalah, rollback ke versi sebelumnya:

```bash
# Lihat deployment history
vercel ls

# Rollback
vercel rollback <deployment-id>
```

---

## Monitoring

Monitor aplikasi di Vercel Dashboard:
- **Functions**: Log dan error
- **Analytics**: Traffic dan performance
- **Logs**: Real-time logs

Untuk TiDB, monitor di TiDB Cloud Console:
- **Metrics**: Query performance
- **Logs**: Slow queries
- **Monitoring**: Resource usage
