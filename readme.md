# GATA API Services

REST API Backend for GATA (Guidance and Thesis Automation) System

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run migrations (if needed)
npm run migrate:fresh

# Seed database (if needed)
npm run seed

# Start development server
npm run dev
```

Server will run at `http://localhost:5000` (or your configured PORT)

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📦 Deployment

### Automatic Deployment (GitHub Actions)

Push to `main` branch akan otomatis deploy ke VPS via GitHub Actions.

**Required GitHub Secrets:**

- `SSH_PRIVATE_KEY`: Private SSH key untuk akses VPS
- `SERVER_HOST`: IP/domain VPS
- `SERVER_PORT`: SSH port (default: 22)
- `SERVER_USER`: SSH username
- `TARGET_DIR`: `/var/www/gata-api-services`

### Manual Deployment

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk panduan lengkap.

Quick commands untuk VPS:

```bash
# SSH ke VPS
ssh -p <PORT> <USER>@<HOST>

# Masuk ke directory
cd /var/www/gata-api-services

# Pull latest code
git pull origin main

# Install & build
npm install
npm run build

# Restart PM2
pm2 reload gata-api-services
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server dengan hot reload
- `npm run build` - Build untuk production
- `npm run build:clean` - Clean build (hapus dist dulu)
- `npm start` - Start production server
- `npm run prod` - Build dan start production
- `npm run verify` - Verify Node.js environment
- `npm run migrate:fresh` - Fresh migration (drop & recreate tables)
- `npm run seed` - Seed database dengan data awal

## 📋 Requirements

- Node.js >= 18.x
- MySQL >= 8.x
- PM2 (untuk production)

## 🔧 Configuration

Copy `.env.example` ke `.env` dan sesuaikan:

```env
NODE_ENV=production
PORT=3000

# Database
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🐛 Troubleshooting

### Build gagal

```bash
# Clean dan rebuild
rm -rf dist node_modules package-lock.json
npm install
npm run build
```

### PM2 tidak jalan

```bash
# Check status
pm2 list

# View logs
pm2 logs gata-api-services

# Restart
pm2 restart gata-api-services
```

### Module not found

```bash
# Reinstall dependencies
npm install
```

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md) untuk troubleshooting lengkap.

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Panduan lengkap deployment
- [API Documentation](./swagger/swagger.json) - Swagger API docs
- [Changelog](./CHANGELOG.md) - Version history

## 🏗️ Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **ORM:** TypeORM
- **Database:** MySQL
- **Authentication:** JWT + Google OAuth
- **Email:** Nodemailer
- **Process Manager:** PM2
- **CI/CD:** GitHub Actions

## 📝 License

Private Project - All Rights Reserved
