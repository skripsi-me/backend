# Deployment Guide

Panduan lengkap deploy backend e-commerce ke server/VPS.

---

## Daftar Isi

- [Prasyarat](#prasyarat)
- [Setup Server](#setup-server)
- [Deploy](#deploy)
- [Process Manager](#process-manager)
- [Environment Variables](#environment-variables)
- [Reverse Proxy (Nginx)](#reverse-proxy-nginx)
- [SSL (Let's Encrypt)](#ssl-lets-encrypt)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prasyarat

- Server/VPS dengan akses SSH
- OS: Ubuntu 22.04+ / Debian 12+ / AlmaLinux 9+
- Node.js 20+ terinstall
- MariaDB 10.6+ terinstall
- Git

---

## Setup Server

### 1. Install Node.js (jika belum ada)

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifikasi
node -v  # v20.x.x
npm -v
```

### 2. Install MariaDB

```bash
# Ubuntu/Debian
sudo apt install mariadb-server -y
sudo systemctl start mariadb
sudo systemctl enable mariadb

# Secure installation
sudo mysql_secure_installation
```

### 3. Setup Database

```bash
# Login ke MariaDB
sudo mysql -u root -p

# Buat database dan user
CREATE DATABASE skripsi_db;
CREATE USER 'skripsi_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON skripsi_db.* TO 'skripsi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Install PM2

```bash
sudo npm install -g pm2
```

---

## Deploy

### 1. Clone Repository

```bash
cd /var/www
sudo git clone <repository-url> backend
sudo chown -R $USER:$USER backend
cd backend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment

```bash
cp .env.example .env
nano .env  # Edit sesuai konfigurasi server
```

### 4. Build

```bash
npm run build
```

### 5. Sync Database Schema

```bash
npx drizzle-kit push
```

### 6. Setup FULLTEXT Index

```bash
node scripts/setup-fulltext.js
```

---

## Process Manager

### Start dengan PM2

```bash
# Build dulu
npm run build

# Jalankan dengan PM2
pm2 start dist/src/server.js --name "ecommerce-api"

# Save process list
pm2 save

# Auto-start saat server reboot
pm2 startup
```

### PM2 Commands

```bash
pm2 status              # Lihat status
pm2 logs ecommerce-api  # Lihat logs
pm2 restart ecommerce-api  # Restart
pm2 stop ecommerce-api     # Stop
pm2 delete ecommerce-api   # Hapus
```

---

## Environment Variables

| Variable | Required | Default | Deskripsi |
|----------|----------|---------|-----------|
| `NODE_ENV` | No | `development` | Mode: `development` atau `production` |
| `PORT` | No | `3000` | Port server |
| `HOST` | No | `0.0.0.0` | Bind address |
| `DATABASE_HOST` | Yes | - | Host MariaDB |
| `DATABASE_PORT` | No | `3306` | Port MariaDB |
| `DATABASE_USER` | Yes | - | Username DB |
| `DATABASE_PASSWORD` | Yes | - | Password DB |
| `DATABASE_NAME` | Yes | - | Nama database |
| `JWT_SECRET` | Yes | - | Secret key JWT |
| `COOKIE_SECRET` | Yes | - | Secret key cookies |
| `IMAGEKIT_PUBLIC_KEY` | Yes | - | ImageKit public key |
| `IMAGEKIT_PRIVATE_KEY` | Yes | - | ImageKit private key |
| `IMAGEKIT_URL_ENDPOINT` | Yes | - | ImageKit URL endpoint |

### Contoh `.env` untuk Production

```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=skripsi_user
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=skripsi_db

JWT_SECRET=<random_hex_32_chars>
COOKIE_SECRET=<random_hex_32_chars>

IMAGEKIT_PUBLIC_KEY=public_xxx
IMAGEKIT_PRIVATE_KEY=private_xxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/xxx
```

---

## Reverse Proxy (Nginx)

### Install Nginx

```bash
sudo apt install nginx -y
```

### Konfigurasi Nginx

Buat file `/etc/nginx/sites-available/ecommerce-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/ecommerce-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Dapatkan SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Monitoring

### PM2 Monitoring

```bash
pm2 monit  # Real-time monitoring
pm2 logs   # Live logs
```

### Logrotate untuk PM2

```bash
sudo nano /etc/logrotate.d/pm2
```

Isi:
```
/root/.pm2/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
}
```

---

## Troubleshooting

### Error: "Connection refused"

1. Pastikan MariaDB berjalan: `sudo systemctl status mariadb`
2. Pastikan `DATABASE_HOST` = `localhost`
3. Cek port: `sudo netstat -tlnp | grep 3306`

### Error: "Access denied for user"

1. Pastikan user dan password benar di `.env`
2. Pastikan user punya hak akses ke database:
   ```sql
   SHOW GRANTS FOR 'skripsi_user'@'localhost';
   ```

### Error: "EADDRINUSE"

Port sudah digunakan. Ganti port di `.env` atau hentikan proses yang menggunakan port tersebut:
```bash
sudo lsof -i :3000
sudo kill <PID>
```

### Server Tidak Merespon

1. Cek PM2 status: `pm2 status`
2. Cek logs: `pm2 logs ecommerce-api`
3. Restart: `pm2 restart ecommerce-api`

### FULLTEXT Index Error

Pastikan FULLTEXT index sudah dibuat:
```bash
node scripts/setup-fulltext.js
```

---

## Update Aplikasi

```bash
cd /var/www/backend

# Pull updates
git pull origin main

# Install dependencies (jika ada perubahan)
pnpm install

# Build
npm run run build

# Sync schema (jika ada perubahan)
npx drizzle-kit push

# Restart
pm2 restart ecommerce-api
```
