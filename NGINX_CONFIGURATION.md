# GATA API & Frontend - Nginx Configuration

## Production Setup dengan Nginx Proxy

### Frontend Configuration (https://gata.web.id)

```nginx
# File: /etc/nginx/sites-available/gata-frontend
# atau /etc/nginx/conf.d/gata-frontend.conf

upstream gata_frontend {
    server localhost:3001;
    keepalive 64;
}

server {
    listen 80;
    server_name gata.web.id www.gata.web.id;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gata.web.id www.gata.web.id;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/gata.web.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gata.web.id/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Add HSTS header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://gata_frontend;
        
        # Proxy headers - PENTING untuk CORS!
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Connection settings
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering off;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://gata_frontend;
        proxy_cache_valid 30d;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Backend Configuration (https://api.gata.web.id)

```nginx
# File: /etc/nginx/sites-available/gata-api
# atau /etc/nginx/conf.d/gata-api.conf

upstream gata_api {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.gata.web.id;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.gata.web.id;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.gata.web.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.gata.web.id/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Add HSTS header
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://gata_api;
        
        # Proxy headers - CRITICAL untuk CORS!
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # Connection settings untuk WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering off;
    }
    
    # Rate limiting untuk API endpoints
    location ~ ^/auth/login$ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://gata_api;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Rate Limiting Configuration (tambahkan di http block)

```nginx
# Di /etc/nginx/nginx.conf, dalam http { } block

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=50r/s;

# Logging format dengan request time
log_format gata_log '$remote_addr - $remote_user [$time_local] '
                    '"$request" $status $body_bytes_sent '
                    '"$http_referer" "$http_user_agent" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

access_log /var/log/nginx/access.log gata_log;
error_log /var/log/nginx/error.log warn;
```

## SSL Setup dengan Let's Encrypt

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate untuk frontend
sudo certbot certonly --standalone -d gata.web.id -d www.gata.web.id

# Generate certificate untuk API
sudo certbot certonly --standalone -d api.gata.web.id

# Auto-renew certificates
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

## Enable Nginx Config

```bash
# Test configuration
sudo nginx -t

# Enable site (symlink dari sites-available ke sites-enabled)
sudo ln -s /etc/nginx/sites-available/gata-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/gata-api /etc/nginx/sites-enabled/

# Reload Nginx
sudo systemctl reload nginx
sudo systemctl status nginx
```

## Troubleshooting

### Check Nginx Logs
```bash
# Real-time access log
sudo tail -f /var/log/nginx/access.log

# Error log
sudo tail -f /var/log/nginx/error.log

# Grep specific domain
sudo grep "api.gata.web.id" /var/log/nginx/access.log | tail -20
```

### Check Backend Service
```bash
# Check if backend running
sudo netstat -tlnp | grep 3000

# Check if frontend running
sudo netstat -tlnp | grep 3001

# Test backend directly
curl http://localhost:3000/health

# Test with Nginx (internal test, before DNS)
curl -H "Host: api.gata.web.id" http://localhost/health
```

### Test CORS Headers
```bash
# Test OPTIONS request
curl -X OPTIONS https://api.gata.web.id/auth/login \
  -H "Origin: https://gata.web.id" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Expected response headers:
# Access-Control-Allow-Origin: https://gata.web.id
# Access-Control-Allow-Credentials: true
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

## Performance Optimization

### Compression
```nginx
# Add to server block
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript 
            application/json application/javascript application/xml+rss 
            application/rss+xml font/truetype font/opentype 
            application/vnd.ms-fontobject image/svg+xml;
```

### Caching
```nginx
# Add to server block untuk static files
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=1g inactive=60m use_temp_path=off;

location ~ ^/(api|health|db-status)$ {
    proxy_cache api_cache;
    proxy_cache_valid 200 1m;
    proxy_cache_use_stale error timeout invalid_header updating;
    add_header X-Cache-Status $upstream_cache_status;
    
    proxy_pass http://gata_api;
    # ... proxy headers ...
}
```

## Monitoring

### Check Service Status
```bash
# Check Nginx
sudo systemctl status nginx

# Check if ports listening
sudo ss -tlnp | grep -E ':(80|443|3000|3001)'

# Check disk space
df -h

# Check memory
free -h

# Check CPU usage
top -p $(pgrep -f "node|nginx")
```

### Logs Analysis
```bash
# Count requests per second
tail -f /var/log/nginx/access.log | pv -L 1 -r

# Find slow requests (> 1 second)
awk '$NF > 1' /var/log/nginx/access.log | tail -20

# Check for 5xx errors
grep " 5[0-9][0-9] " /var/log/nginx/access.log | tail -20
```

## Notes

1. **Header Forwarding**: `X-Forwarded-Proto`, `X-Forwarded-Host` sangat penting untuk CORS bekerja
2. **Proxy Buffering**: Set ke `off` untuk real-time streaming dan WebSocket
3. **Keep-Alive**: Set di upstream untuk koneksi yang lebih efisien
4. **SSL/TLS**: Selalu gunakan HTTPS di production
5. **Rate Limiting**: Proteksi dari abuse dan DDoS attacks
6. **Timeouts**: Sesuaikan dengan kebutuhan aplikasi Anda

