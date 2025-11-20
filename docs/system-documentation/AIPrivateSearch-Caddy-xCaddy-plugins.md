### Caddy Plugins with xcaddy (2025 Guide)

xcaddy is the official tool for building custom Caddy binaries with any combination of third-party plugins. It’s perfect when you need features not in the standard download (e.g., WebDAV, Brotli, Cloudflare DNS, caching layers, etc.).

#### 1. Install xcaddy (one-liner, works everywhere)
```bash
go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
# Or with Homebrew (macOS/Linux)
brew install xcaddy
```

Make sure you have Go ≥1.22 installed (required as of 2025).

#### 2. Common Useful Plugins (2025)

| Plugin | What it adds | xcaddy command |
|--------|--------------|----------------|
| **caddy-l4** | Layer 4 (TCP/UDP) proxying – great for Minecraft, SMTP, etc. | `xcaddy build --with github.com/caddyserver/layer4` |
| **httpcache** | Full in-memory + disk HTTP cache (like Nginx proxy_cache) | `xcaddy build --with github.com/caddyserver/cache-handler` |
| **WebDAV** | Proper WebDAV server (file browser, Nextcloud alternative) | `xcaddy build --with github.com/mholt/caddy-webdav` |
| **Brotli** | Brotli compression (better than gzip) | `xcaddy build --with github.com/caddyserver/encoding/brotli` |
| **Cloudflare DNS** | DNS-01 challenge for wildcard certs on Cloudflare | `xcaddy build --with github.com/caddy-dns/cloudflare` |
| **dns.providers** | 100+ DNS providers for DNS-01 (Route53, DigitalOcean, etc.) | See list: https://github.com/caddy-dns |
| **caddy-rate-limit** | Advanced token-bucket rate limiting | `xcaddy build --with github.com/mholt/caddy-ratelimit` |
| **caddy-dynamicdns** | IP updater for dynamic home IPs | `xcaddy build --with github.com/caddy-dns/dynamicdns` |
| **caddy-security** | Auth portal, JWT validation, OAuth2 proxy, etc. | `xcaddy build --with github.com/greenpau/caddy-security` |
| **replace-response** | Powerful response rewriting (great for SPA fallback) | `xcaddy build --with github.com/caddyserver/replace-response` |

#### 3. Build a Real-World Custom Caddy (Example: Home server with everything)
```bash
xcaddy build \
  --with github.com/caddyserver/cache-handler \
  --with github.com/mholt/caddy-webdav \
  --with github.com/caddyserver/layer4 \
  --with github.com/caddyserver/replace-response \
  --with github.com/caddy-dns/cloudflare \
  --with github.com/greenpau/caddy-security
```
→ Outputs a `./caddy` binary (~50-80 MB) with all those plugins baked in.

#### 4. One-liner for the Most Popular 2025 Combo (Cache + WebDAV + Cloudflare DNS)
```bash
xcaddy build --with github.com/caddyserver/cache-handler --with github.com/mholt/caddy-webdav --with github.com/caddy-dns/cloudflare
```

#### 5. Use Your Custom Binary
```bash
sudo mv caddy /usr/local/bin/caddy   # replace system caddy
sudo systemctl restart caddy         # if running as service
caddy version                        # shows your custom build + plugins
```

#### 6. Dockerfile Example (Custom Caddy in Docker)
```dockerfile
FROM golang:1.23-alpine AS builder
RUN apk add --no-cache git
RUN go install github.com/caddyserver/xcaddy/cmd/xcaddy@latest
ENV XCADDY_SETCAP=1
RUN xcaddy build \
    --with github.com/caddyserver/cache-handler \
    --with github.com/mholt/caddy-webdav \
    --with github.com/caddy-dns/cloudflare

FROM alpine:latest
COPY --from=builder /go/caddy /usr/bin/caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
```

#### 7. Example Caddyfile Using Popular Plugins
```caddy
example.com {
    # Cache handler (finally Nginx-like caching!)
    cache {
        default_max_age 1h
        match_header Cache-Control "public"
    }

    # WebDAV on /files
    route /files/* {
        webdav
        authenticate with local  # from caddy-security plugin
    }

    # Layer4 TCP proxy (e.g., Minecraft on 25565)
    :25565 {
        layer4 {
            proxy minecraft-backend:25565
        }
    }
}
```

#### 8. Finding New Plugins
- Official list: https://caddyserver.com/docs/modules/
- Community plugins: https://caddy.community/c/plugins/12
- GitHub: search “caddy” + your need (e.g., “caddy prometheus”, “caddy s3”)

In 2025, xcaddy + plugins is how most power users run Caddy — the official download is deliberately minimal, but you can have a “Nginx Plus on steroids” binary in one command. Let me know what specific feature you’re missing and I’ll give you the exact xcaddy line!
