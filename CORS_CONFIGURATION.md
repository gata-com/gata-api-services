# CORS Configuration Guide

## Masalah dan Solusi

### Masalah yang Terjadi
Pada deployment di VPS Linux dengan Nginx proxy, terjadi error CORS meskipun di local development berjalan lancar. Hal ini karena:

1. **Nginx Proxy Behavior**: Ketika Nginx melakukan proxy dari `https://gata.web.id` → `localhost:3000` (backend), browser tetap mengirimkan origin sebagai `https://gata.web.id`
2. **Single FRONTEND_URL**: Konfigurasi sebelumnya hanya mengizinkan satu origin, sehingga tidak fleksibel untuk berbagai environment

### Solusi
CORS configuration sudah diperbarui untuk mendukung multiple origins berdasarkan environment.

---

## Konfigurasi untuk Production

### Setup Nginx dengan Proxy

**Frontend (Port 3001 → https://gata.web.id)**
```nginx
server {
    listen 443 ssl http2;
    server_name gata.web.id www.gata.web.id;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Backend (Port 3000 → https://api.gata.web.id)**
```nginx
server {
    listen 443 ssl http2;
    server_name api.gata.web.id;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "upgrade";
    }
}
```

### Environment Variables (.env Production)

```env
NODE_ENV=production
PORT=3000

# Database
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=your_user
DB_PASSWORD=your_password
DB_NAME=gata_db

# Frontend URL (untuk CORS - diizinkan)
FRONTEND_URL=https://gata.web.id

# Backend URL (untuk redirect)
BACKEND_URL=https://api.gata.web.id

# Google OAuth (pastikan HTTPS callback)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://api.gata.web.id/auth/google/callback

# JWT & Security
JWT_SECRET=your_strong_secret_key
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=your_session_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@gata.web.id

# Database Options
DB_SYNC=false
DB_LOGGING=false

# Admin
ADMIN_EMAIL=admin@gata.web.id
ADMIN_PASSWORD=strong_password
```

---

## Konfigurasi untuk Development

### Environment Variables (.env Development)

```env
NODE_ENV=development
PORT=5000

# Database
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=gata_dev

# Frontend URL (diizinkan)
FRONTEND_URL=http://localhost:3000

# Backend URL
BACKEND_URL=http://localhost:5000

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# JWT & Security
JWT_SECRET=dev-secret-key
BCRYPT_SALT_ROUNDS=10
SESSION_SECRET=dev-session-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@localhost

# Database Options
DB_SYNC=true
DB_LOGGING=true

# Admin
ADMIN_EMAIL=admin@localhost
ADMIN_PASSWORD=admin123
```

---

## Allowed Origins (CORS)

### Production
- `https://gata.web.id`
- `https://www.gata.web.id`
- FRONTEND_URL (dari .env)

### Development
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`
- FRONTEND_URL (dari .env)

### Requests tanpa Origin
- Mobile apps
- Postman
- cURL requests

Semua diizinkan (no origin = allowed).

---

## Testing CORS

### Production Test
```bash
curl -X OPTIONS https://api.gata.web.id/auth/login \
  -H "Origin: https://gata.web.id" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

### Development Test
```bash
curl -X OPTIONS http://localhost:5000/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Respon yang diharapkan:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://gata.web.id
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Credentials: true
```

---

## Troubleshooting

### CORS Error di Production
1. ✅ Pastikan `NODE_ENV=production` di .env
2. ✅ Pastikan `FRONTEND_URL=https://gata.web.id` di .env
3. ✅ Nginx proxy header lengkap (lihat config di atas)
4. ✅ SSL/HTTPS sudah benar
5. ✅ Restart backend service

### CORS Error di Development
1. ✅ Pastikan `NODE_ENV=development` di .env
2. ✅ Pastikan frontend berjalan di port 3000 atau 3001
3. ✅ Restart backend service
4. ✅ Clear browser cache

### Check Current Config
```bash
curl http://localhost:5000/health
```

Lihat field `database` dan `environment` dalam response.

---

## Changelog

### Latest Changes (CORS Fix)
- ✅ Updated CORS configuration untuk multiple origins
- ✅ Support untuk Nginx proxy setup
- ✅ Environment-specific allowed origins
- ✅ Better .env documentation
