Here’s the cleanest and most common way in 2025 to run **Caddy on ports 80 + 443** (for automatic HTTPS, HTTP→HTTPS redirects, HTTP/3, etc.) and **Nginx on any other ports** (e.g., 8080, 8443, 9000, custom TCP ports) on the **same public IP** without conflicts.

### Recommended Architecture (2025 Best Practice)

```
Internet
   │
   ├─→ ports 80 & 443  → Caddy (handles all public HTTP/S traffic + certs)
   │
   └─→ all other ports → Nginx (or any other service)

Caddy reverse-proxies selected domains/path to your Nginx instances
(e.g., example.com → nginx:8080, api.example.com → nginx:9000, etc.)
```

You do **not** let Nginx listen on 80/443 at all — that would conflict.

### Step-by-Step Configuration

#### 1. Configure Nginx to listen ONLY on non-privileged or internal ports
Edit your Nginx sites (or default config):

```nginx
# /etc/nginx/sites-available/default or your custom conf
server {
    listen 127.0.0.1:8080;    # or just listen 8080; if you want it reachable from LAN too
    # listen [::]:8080;       # IPv6 if needed
    server_name example.com www.example.com;

    # your normal location blocks, root, proxy_pass, php-fpm, etc.
    location / {
        try_files $uri $uri/ =404;
        # or proxy_pass http://localhost:3000; etc.
    }
}
```

Do this for every site. Common ports people use:
- 8080 → main site
- 9000 → API
- 9001 → phpMyAdmin
- 8443 → alternative HTTPS (but usually unnecessary with Caddy)

Restart Nginx:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

#### 2. Configure Caddy (Caddyfile) to front everything on 80/443
Example `/etc/caddy/Caddyfile`:

```caddy
{
    # Optional: debug, email, etc.
    # email you@example.com
}

# Main website – proxy to your Nginx on 8080
example.com, www.example.com {
    reverse_proxy localhost:8080

    # Optional: add caching, headers, rate limiting, etc.
    header / Strict-Transport-Security "max-age=31536000; includeSubDomains"
}

# API subdomain – proxy to Nginx on a different port
api.example.com {
    reverse_proxy localhost:9000
}

# phpMyAdmin or any internal tool
pma.example.com {
    reverse_proxy localhost:9001
    # Add basic auth if you want
    basicauth * {
        admin JDJhJDEyJ....  # output of `caddy hash-password`
    }
}

# Optional: serve something directly with Caddy (static files, etc.)
static.example.com {
    root * /var/www/static
    file_server
}
```

Reload Caddy:
```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

That’s it. Caddy now:
- Terminates TLS automatically (Let’s Encrypt)
- Does HTTP → HTTPS redirects
- Supports HTTP/3 out of the box
- Proxies cleanly to your Nginx instances on backend ports

#### 3. Firewall Rules (ufw example)
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# Optional: if you want Nginx directly reachable from LAN on its ports
sudo ufw allow from 192.168.0.0/16 to any port 8080  # example for local network
sudo ufw deny 8080   # block from internet
```

#### 4. Alternative: Pure TCP/UDP proxying with Caddy (Layer4) – no Nginx on those ports at all
If you have non-HTTP services (Minecraft, WireGuard, SMTP, etc.), build Caddy with the layer4 plugin and do:

```caddy
:25565 {                  # Minecraft
    layer4 {
        proxy minecraft-server-ip:25565
    }
}

:5000 {                   # UDP example (WireGuard)
    layer4 {
        proxy 10.0.0.5:51820
    }
}
```

#### Why this setup wins in 2025
- Zero cert management (Caddy handles everything)
- One place for HSTS, OCSP stapling, HTTP/3
- Nginx keeps its superior caching, Lua/OpenResty scripts, fancy modules, or extreme performance when you need them
- No port conflicts
- Easy to add new domains (just add a Caddy block)

This is exactly what thousands of homelabbers and small companies do now: **Caddy as the public TLS terminator + reverse proxy**, **Nginx (or Traefik, Apache, etc.) only on backend ports**.

If you tell me what exact services/ports you want Nginx to serve, I’ll write you the exact Caddy + Nginx configs.