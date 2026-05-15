### Detailed Caddy Setup Guide (as of November 2025)

Caddy is a modern, open-source web server written in Go, known for its simplicity, automatic HTTPS (via Let's Encrypt/ZeroSSL by default), native HTTP/3 support, and human-readable configuration. It's ideal for static sites, reverse proxies, PHP apps, and more. This guide covers installation, basic to advanced configuration using the **Caddyfile** (recommended for most users), running as a service, and production best practices.

#### 1. Installation
Choose the method that fits your OS/environment. Official packages install Caddy as a systemd service where applicable.

**Linux (Debian/Ubuntu/Raspbian) – Recommended for Production**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```
This starts Caddy as a systemd service (`systemctl status caddy`).

**Fedora/Red Hat/CentOS**
```bash
dnf install dnf-plugins-core  # or dnf5-plugins on newer Fedora
dnf copr enable @caddy/caddy
dnf install caddy
```

**Arch Linux/Manjaro**
```bash
pacman -Syu caddy
```

**Docker (Great for Containers/Compose)**
```bash
docker pull caddy:latest
```
Example `docker-compose.yml`:
```yaml
services:
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
```

**macOS (Homebrew)**
```bash
brew install caddy
```

**Windows**
Use Chocolatey: `choco install caddy` or Scoop: `scoop install caddy`.

**Manual Binary (Any OS)**
Download from https://caddyserver.com/download or use `xcaddy` for custom builds with plugins.

After install, verify: `caddy version` (should show v2.8.x or newer in 2025).

#### 2. First Run & Basic Testing
Create a file named `Caddyfile` (no extension) in your working directory.

**Hello World Example**
```
:2015

respond "Hello, world!"
```
Run foreground: `caddy run`  
Test: `curl http://localhost:2015`

For local HTTPS testing:
```
localhost

respond "Hello, secure world!"
```
Run `caddy run` – it will auto-generate a self-signed cert and prompt to trust the local CA (`caddy trust`).

#### 3. The Caddyfile – Configuration Basics
The Caddyfile is the easiest way to configure Caddy. Site blocks start with an address (domain or port).

**Key Concepts**
- Site address triggers automatic HTTPS if it's a domain (e.g., `example.com`).
- Directives (e.g., `root`, `file_server`) go inside `{ }`.
- Global options at the top:
  ```
  {
    debug  # Enable verbose logs
    auto_https off  # Disable if needed (rare)
  }
  ```

**Common Use Cases**

1. **Serve Static Files** (e.g., Hugo/Next.js site)
   ```
   example.com {
       root * /srv/www/example.com
       encode gzip zstd
       file_server
   }
   ```
   - `root *` sets document root ( `*` means for all requests).
   - `encode` enables compression (Brotli via plugin if needed).
   - `file_server` serves files + directory browsing if no index.

2. **Reverse Proxy** (Most Common – e.g., to Docker containers)
   ```
   app.example.com {
       reverse_proxy localhost:3000  # Or container name in Docker
       # Health checks (active/passive)
       reverse_proxy /api/* localhost:5000 {
           health_uri /health
           health_interval 10s
       }
   }
   ```
   Add load balancing:
   ```
   reverse_proxy localhost:3000 localhost:3001 localhost:3002
   ```

3. **PHP Site** (e.g., WordPress/Laravel)
   ```
   php.example.com {
       root * /srv/www/php
       encode gzip zstd
       php_fastcgi unix//run/php/php8.3-fpm.sock  # Adjust PHP version/socket
       file_server
   }
   ```
   Production-ready WordPress in ~5 lines!

4. **Multiple Sites**
   ```
   site1.com { ... }
   site2.com { ... }

   # Wildcard subdomain (requires DNS-01 challenge)
   *.example.com {
       reverse_proxy /${1}.localhost:8080  # Dynamic upstream via placeholder
   }
   ```

5. **Advanced: Headers, Rate Limiting, Basic Auth**
   ```
   example.com {
       header Strict-Transport-Security "max-age=31536000;"
       basicauth /admin/* {
           user JDJhJDEyJ...
       }
       ratelimit /api/* 50 10 r/m  # 50 req/min per IP
       reverse_proxy localhost:9000
   }
   ```

#### 4. Automatic HTTPS – How It Works
- **Zero-config** for public domains: Just put your domain in the site address.
- Caddy gets certs from Let's Encrypt/ZeroSSL, renews automatically.
- HTTP → HTTPS redirects on port 80.
- Requirements:
  - Domain A/AAAA records point to your server.
  - Ports 80 & 443 open/forwarded.
- Staging for testing: Add to global block
  ```
  {
    acme_ca https://acme-staging-v02.api.letsencrypt.org/directory
  }
  ```
- On-Demand TLS (for dynamic domains): Advanced, requires `on_demand_tls` global option + ask endpoint.

#### 5. Running in Production
- **As systemd Service** (from official packages): Already set up!
  - Reload config (zero-downtime): `sudo systemctl reload caddy` or `caddy reload --config /etc/caddy/Caddyfile`
  - Logs: `journalctl -u caddy -f`
- **Best Practices**
  - Use `/etc/caddy/Caddyfile` as main config + `import /etc/caddy/sites/*.caddyfile` for modular sites.
  - Run as non-root user (official packages do this).
  - Persistent data: `/var/lib/caddy` (certs, etc.) – back it up!
  - Firewall: Allow 80, 443 (and 2019 for admin API if exposed – **never expose publicly**).
  - Logging: Add `log` directive for access/error logs.
    ```
    example.com {
        log {
            output file /var/log/caddy/example.com.log
        }
        ...
    }
    ```
  - Metrics: `prometheus` directive for Prometheus scraping.
  - Security: Enable `header` for HSTS, CSP; use `tls` directive for custom certs if needed.

#### 6. Upgrading & Troubleshooting
- Upgrade: `sudo apt update && sudo apt upgrade caddy` (or `caddy upgrade` binary).
- Validate config: `caddy validate --config /etc/caddy/Caddyfile`
- Common issues:
  - Cert failures: Check DNS, ports 80/443.
  - PHP not working: Ensure PHP-FPM socket exists and permissions allow caddy user.
  - Logs: Increase verbosity with `debug` global option.

Caddy is "it just works" for 95% of setups. For full docs: https://caddyserver.com/docs/. Start simple, add features as needed – you'll rarely need more than 10-20 lines per site! If you have a specific use case (e.g., Nextcloud, Traefik replacement), let me know for tailored config.