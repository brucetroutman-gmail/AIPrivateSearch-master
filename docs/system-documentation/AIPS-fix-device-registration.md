# AIPS-fix-device-registration

## Problem
New customers complete registration and email verification on aiprivatesearch.com, download and install the .dmg, but device activation fails with:
```
Registration failed: Request failed with status code 500
```

## On-boarding Flow (3 repos)

```
Step 1: aiprivatesearchweb        → Customer browses to aiprivatesearch.com
Step 2: aiprivatesearchcustmgr    → Customer registers (email, phone, city, state, zip, password)
Step 3: aiprivatesearchcustmgr    → Customer verifies email (6-digit code)
Step 4: aiprivatesearchcustmgr    → License created: tier=1, status=trial, 60 days
Step 5: aiprivatesearchweb        → Customer downloads AIPrivateSearch.dmg
Step 6: aiprivatesearch           → Customer installs and launches app on Mac
Step 7: aiprivatesearch           → App shows license-activation.html
Step 8: aiprivatesearch           → Customer enters email, clicks Activate License
Step 9: aiprivatesearch → custmgr → AIPS backend calls custmgr /api/licensing/register-device  ← FAILS HERE
Step 10: aiprivatesearch          → App creates local admin account and auto-login
```

## Investigation Findings

### Table schema is correct
The live `devices` table already has the right columns:
```
id, customer_id, device_uuid, device_name, registered_at, last_seen, status, pc_code, ip_address
```
The `register-device` and `validate-device` code matches this schema exactly. **No table changes needed.**

### The real issue
The `register-device` endpoint catch block returns a generic error that hides the actual cause:
```javascript
res.status(500).json({ success: false, error: 'Registration failed' });
```

During testing, the first call succeeded (INSERT) but all subsequent calls failed — including re-registering the same device (UPDATE path) and registering new devices for other customers. This points to a **database connection pool issue** on the live server, not a schema mismatch.

### Secondary issue
The AIPS `device-license-client.mjs` calls a non-existent `/api/licensing/create-license` endpoint on custmgr before every registration attempt. It always 404s, is caught and ignored, but adds unnecessary latency and noise.

---

## Fix Steps

### Step 1: Surface the actual error on custmgr

**File:** `aiprivatesearchcustmgr/server/s01_server-first-app/routes/licensing.mjs`

Change the `register-device` catch block:
```javascript
// FROM:
console.error('Device registration error:', error);
res.status(500).json({ success: false, error: 'Registration failed' });

// TO:
console.error('Device registration error:', error.message, error.code, error.sqlMessage);
res.status(500).json({ success: false, error: `Registration failed: ${error.sqlMessage || error.message}` });
```

### Step 2: Deploy custmgr and test

```bash
ssh user@custmgr-server
cd /path/to/custmgr
git pull
pm2 restart custmgr
```

Test immediately:
```bash
curl -s -X POST https://custmgr.aiprivatesearch.com/api/licensing/register-device \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bonnie.troutman@gmail.com",
    "deviceUuid": "test-device-uuid-00000000000000",
    "deviceName": "Test Device",
    "pcCode": "TST123",
    "ipAddress": "1.2.3.4"
  }'
```

The response will now show the actual error. Fix based on what it says:

| Error message | Fix |
|---------------|-----|
| `Connection pool exhausted` or `ECONNREFUSED` | Check MySQL service, increase pool size in connection.mjs |
| `Too many connections` | Increase MySQL max_connections or fix connection leaks |
| `Duplicate entry` for device_uuid | Table may have UNIQUE constraint — check with `SHOW CREATE TABLE devices;` |
| `Column not found` | A column name mismatch we missed |
| Works fine after restart | The pm2 restart cleared a stale connection pool — monitor for recurrence |

### Step 3: Check pm2 logs for historical errors

```bash
pm2 logs custmgr --lines 100
```

Look for `Device registration error:` entries to see what's been failing.

### Step 4: Fix AIPS client-side (already done locally)

**File:** `aiprivatesearch/server/s01_server-first-app/lib/licensing/device-license-client.mjs`

Two changes already applied:
1. Removed dead `create-license` call (endpoint doesn't exist on custmgr)
2. Improved error message to surface actual server error:
```javascript
const serverError = error.response?.data?.error || error.message;
return { success: false, error: `Registration failed: ${serverError}` };
```

### Step 5: Clean up test devices

```sql
DELETE FROM devices WHERE device_uuid = 'abc123def456abc123def456abc123de';
DELETE FROM devices WHERE device_uuid = 'test-device-uuid-00000000000000';
```

### Step 6: Test full on-boarding flow

1. Open http://localhost:56305/license-activation.html
2. Enter bonnie.troutman@gmail.com
3. Click Activate License
4. **Expected:** "Device registered successfully! License tier: Standard"
5. Auto-redirect to index.html

---

## Files Changed

| Repo | File | Change | Status |
|------|------|--------|--------|
| custmgr | `routes/licensing.mjs` | Surface actual SQL error in register-device catch block | To do |
| aips | `lib/licensing/device-license-client.mjs` | Remove dead create-license call, improve error messages | Done |

## Key Insight
The table schema is correct. The code is correct. The blocker is that we can't see the actual error. Step 1 + Step 2 (deploy improved error logging, then test) will reveal the root cause in one shot.
