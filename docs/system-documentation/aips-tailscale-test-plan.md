Here’s a clean, structured **test plan** for tomorrow.  
Assume Screen Sharing is on, firewall is off, Stealth Mode is off, and the machine has been rebooted.

---

### Test Plan – Screen Sharing over Tailscale

#### Goal
Find out exactly where the connection to port 5900 is being dropped.

---

### Phase 1 – Confirm current state (do this first)

On **your MacBook**:

```bash
tailscale ping 100.90.98.117
nc -vz 100.90.98.117 5900
```

On the **remote Mac (ais-mac-mini)**:

```bash
sudo lsof -iTCP:5900 -sTCP:LISTEN
nc -vz 100.90.98.117 5900
```

Record the results.

---

### Phase 2 – Check if packets actually arrive

On the **remote Mac**, start a packet capture:

```bash
sudo tcpdump -n -i any port 5900
```

Leave it running, then from your **MacBook** run:

```bash
nc -vz 100.90.98.117 5900
```

**What to look for:**
- Do you see any packets arriving on the remote Mac?
- If **no packets appear** → something is dropping them before they reach the Mac (or routing issue).
- If **packets appear** → the Mac is receiving them but refusing/dropping the connection.

Stop tcpdump with `Ctrl+C` when finished.

---

### Phase 3 – Test with a different tool / client

1. On your MacBook, try connecting with the built-in Screen Sharing app using both:
   - `100.90.98.117`
   - `ais-mac-mini`
   - `ais-mac-mini.tailc73aa4.ts.net`

2. Install a third-party VNC client (RealVNC Viewer or TightVNC) and try connecting to `100.90.98.117:5900`.

---

### Phase 4 – Check for hidden filtering

On the **remote Mac** run these:

```bash
# Is pf (packet filter) active?
sudo pfctl -s info

# List any pf rules
sudo pfctl -s rules

# Check for third-party network filters
ls /Library/Extensions/ | grep -i -E 'network|firewall|filter|little|lulu|hands'
```

Also check if any of these apps are installed:
- Little Snitch
- Lulu
- Hands Off!
- Radio Silence
- Any corporate security / endpoint protection

---

### Phase 5 – Alternative access test

Enable **Remote Login** (SSH) on the remote Mac and test:

```bash
# From MacBook
nc -vz 100.90.98.117 22
ssh yourusername@100.90.98.117
```

- If SSH works but VNC does not → problem is specific to Screen Sharing / port 5900.
- If SSH also fails → broader filtering or interface issue.

---

### Phase 6 – Force restart Screen Sharing cleanly

On the remote Mac:

```bash
sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.screensharing.plist
sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.screensharing.plist
```

Or simply:

```bash
sudo launchctl kickstart -k system/com.apple.screensharing
```

Then re-test `nc` from the MacBook.

---

### What to bring back tomorrow

Please collect and share:

1. Results of Phase 1 (`tailscale ping` + both `nc` tests)
2. Whether `tcpdump` showed any packets arriving
3. Output of `sudo pfctl -s info`
4. Whether SSH (port 22) works
5. Any third-party security software found

With those five pieces of information we should be able to pinpoint the exact cause.