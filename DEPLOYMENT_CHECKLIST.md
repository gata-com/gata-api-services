# Deployment Checklist untuk Production

## 1. Pre-Deployment Checks

- [ ] Semua test berjalan lancar (`npm run test` atau sesuai script)
- [ ] Build berhasil tanpa error (`npm run build`)
- [ ] Environment variables sudah benar di server
- [ ] Database migrations sudah siap
- [ ] SSL certificates sudah disiapkan dengan Let's Encrypt

## 2. Backend Configuration (Node.js)

### Environment Variables (.env)
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000` (backend akan jalan di port ini)
- [ ] `FRONTEND_URL=https://gata.web.id` (CORS setting)
- [ ] `BACKEND_URL=https://api.gata.web.id`
- [ ] Database credentials sesuai production database
- [ ] `JWT_SECRET` sudah strong (minimal 32 karakter random)
- [ ] `GOOGLE_REDIRECT_URI=https://api.gata.web.id/auth/google/callback`
- [ ] Email credentials (SMTP) sudah benar
- [ ] `DB_LOGGING=false` (untuk performance)
- [ ] `DB_SYNC=false` (never auto-sync di production!)

### PM2 Configuration (ecosystem.config.js)
- [ ] Sudah dikonfigurasi dengan `NODE_ENV=production`
- [ ] Memory limit sesuai
- [ ] Auto-restart enabled
- [ ] Logging setup benar

### Start Backend
```bash
# Build
npm run build

# Start dengan PM2
pm2 start ecosystem.config.js --env production

# Check status
pm2 status
pm2 logs api-services
```

## 3. Frontend Configuration (React/Next.js)

### API URLs di Frontend
- [ ] API base URL = `https://api.gata.web.id`
- [ ] Cookies policy untuk credentials: `include`
- [ ] CORS requests konfigurasi dengan benar

### Build & Deploy
- [ ] Frontend build successful
- [ ] Static files di-serve di port 3001
- [ ] Environment variables untuk API URL sudah benar

## 4. Nginx Setup

### Install & Configure
- [ ] Nginx sudah terinstall
- [ ] Configuration files copied ke `/etc/nginx/sites-available/`
- [ ] Symbolic links dibuat ke `/etc/nginx/sites-enabled/`
- [ ] Nginx config test passed (`sudo nginx -t`)

### SSL/TLS
- [ ] Let's Encrypt certificates installed
- [ ] Auto-renewal configured (`certbot` timer running)
- [ ] HTTPS redirect dari HTTP sudah aktif
- [ ] HSTS header ditambahkan

### Check Nginx
```bash
# Test configuration
sudo nginx -t

# Start/Reload Nginx
sudo systemctl start nginx
sudo systemctl reload nginx
sudo systemctl status nginx

# Check listening ports
sudo ss -tlnp | grep -E ':(80|443|3000|3001)'
```

## 5. Verify CORS Configuration

### Test dengan curl
```bash
# Test frontend request to backend
curl -X OPTIONS https://api.gata.web.id/auth/login \
  -H "Origin: https://gata.web.id" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -i

# Expected response
# HTTP/2 200 OK
# Access-Control-Allow-Origin: https://gata.web.id
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
# Access-Control-Allow-Credentials: true
```

### Test di Browser
1. Buka https://gata.web.id
2. Buka DevTools > Console
3. Coba login / API call
4. Tidak boleh ada CORS error

## 6. Health Check

### Backend Health Check
```bash
# Test health endpoint
curl https://api.gata.web.id/health

# Response harus:
# {
#   "message": "Server health check",
#   "data": {
#     "status": "OK",
#     "database": { "status": "Connected" },
#     ...
#   }
# }
```

### Database Connection
```bash
# Test database
curl https://api.gata.web.id/db-status

# Should show database is initialized and connected
```

### Frontend Access
```bash
# Test frontend
curl https://gata.web.id

# Should return HTML (200 OK)
```

## 7. Monitoring & Logging

### Setup Log Rotation
```bash
# Create logrotate config
sudo cat > /etc/logrotate.d/gata << EOF
/var/log/nginx/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 `cat /var/run/nginx.pid`
        fi
    endscript
}
EOF
```

### Monitor Services
```bash
# Watch Nginx logs
sudo tail -f /var/log/nginx/access.log | grep api.gata.web.id

# Watch PM2 logs
pm2 logs api-services

# System resources
watch -n 1 'top -bn1 | head -20'
```

## 8. Backup & Recovery

- [ ] Database backup schedule sudah setup
- [ ] Backup storage sudah configured
- [ ] Recovery procedure sudah tested
- [ ] SSL certificates backup sudah ada

## 9. Performance Optimization

- [ ] Gzip compression enabled di Nginx
- [ ] Static files caching configured
- [ ] Database indexes optimized
- [ ] Connection pooling configured
- [ ] PM2 cluster mode considered

## 10. Security Hardening

- [ ] Firewall rules configured
- [ ] SSH key-based authentication only
- [ ] Fail2ban untuk brute-force protection
- [ ] Rate limiting enabled di Nginx
- [ ] CORS headers secure
- [ ] CSP (Content Security Policy) headers set
- [ ] HSTS enabled

## 11. DNS Configuration

- [ ] A record untuk `gata.web.id` → Server IP
- [ ] A record untuk `www.gata.web.id` → Server IP
- [ ] A record untuk `api.gata.web.id` → Server IP
- [ ] DNS propagation checked (24 jam)

## 12. Post-Deployment Tests

### Functional Tests
- [ ] Login works (dengan Google OAuth)
- [ ] Password reset works
- [ ] File upload works
- [ ] Database queries work
- [ ] Email notifications sent

### CORS Tests
- [ ] Login from frontend ✅
- [ ] API calls from frontend ✅
- [ ] Cookies saved correctly ✅
- [ ] No CORS errors di console ✅

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 1 second
- [ ] Database queries < 500ms
- [ ] Memory usage stable

### Security Tests
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No sensitive data in logs
- [ ] API rate limiting works

## 13. Communication & Documentation

- [ ] Team notified about deployment
- [ ] Deployment notes recorded
- [ ] Known issues documented
- [ ] Rollback procedure documented

## 14. Troubleshooting Commands

```bash
# View active connections
sudo netstat -tlnp | grep -E '(node|nginx)'

# Check if ports open externally
curl -I https://api.gata.web.id
curl -I https://gata.web.id

# View real-time connections
sudo watch -n 1 'ss -s'

# Check disk usage
df -h

# Monitor CPU/Memory
htop

# View process information
ps aux | grep -E '(node|nginx|mysql)'
```

## 15. Success Criteria

✅ Semua harus tercapai sebelum dianggap sukses:

- [ ] Frontend accessible di `https://gata.web.id` (HTTPS)
- [ ] Backend accessible di `https://api.gata.web.id` (HTTPS)
- [ ] Login works without CORS errors
- [ ] Database connected successfully
- [ ] All endpoints responding with expected status codes
- [ ] SSL certificates valid and auto-renewing
- [ ] No errors in logs
- [ ] Performance baseline met
- [ ] Monitoring & alerting active

---

## Quick Reference

### Frontend
- URL: `https://gata.web.id`
- Local Proxy: `localhost:3001`
- Build: `npm run build`
- Serve: Built files at port 3001

### Backend  
- URL: `https://api.gata.web.id`
- Local Proxy: `localhost:3000`
- Build: `npm run build`
- Start: `pm2 start ecosystem.config.js --env production`

### Nginx Reload
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### View Logs
```bash
sudo tail -f /var/log/nginx/access.log
pm2 logs api-services
```

### Emergency Restart
```bash
sudo systemctl restart nginx
pm2 restart all
```

