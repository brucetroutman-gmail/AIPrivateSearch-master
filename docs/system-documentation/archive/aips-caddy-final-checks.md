Good — both `secureaddress.com` and `www.secureaddress.com` point directly to your server’s IP (`92.112.184.206`), so DNS isn’t the issue.  

Since ports 80 and 443 are owned by Caddy and the domain resolves correctly, the most likely cause of the TLS handshake error is either:  

- Caddy hasn’t yet obtained the Let’s Encrypt certificate.  
- There’s an old/broken cached certificate in Caddy’s storage that’s failing.  

---

### Next Step — Force fresh certificate issuance
1. **Stop Caddy:**
```bash
sudo systemctl stop caddy
```
2. **Clear cached certificates:**
```bash
sudo rm -rf /var/lib/caddy/.local/share/caddy/*
```
3. **Start Caddy again:**
```bash
sudo systemctl start caddy
```
4. **Tail logs in real-time:**
```bash
sudo journalctl -u caddy -f
```
5. **Trigger the request:**
```bash
curl -I https://secureaddress.com
```
You should now see something like:
```
obtaining certificate for secureaddress.com
certificate obtained successfully for secureaddress.com
```

---


