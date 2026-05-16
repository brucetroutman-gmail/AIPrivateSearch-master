# AIPrivateSearch Licensing System

**Version**: 20.22

---

## Overview

The licensing system controls access to AIPrivateSearch features based on subscription tier and role. It consists of two parts:

- **custmgr** (cloud) — customer registration, license issuance, device management
- **aiprivatesearch** (local) — license validation, tier enforcement, feature gating

---

## Subscription Tiers

| Tier | Name | Price | Computers | Key Features |
|------|------|-------|-----------|-------------|
| 1 | Standard | $49/yr | 1 | Search, scoring, collections, admin + searcher roles |
| 2 | Premium | $199/yr | 5 | + Model management, config editing, doc index editing |
| 3 | Professional | $2,999 one-time | Unlimited | Full access, all features |

---

## Roles

| Role | Description |
|------|-------------|
| admin | User management + all tier features |
| searcher | Search and collections only |

User type is a combination of tier + role: `standard-admin`, `premium-searcher`, `professional-admin`, etc.

---

## License Validation Flow

```
App startup
    ↓
Check localStorage for sessionId
    ↓
GET /api/auth/me → validate session server-side
    ↓
Load user tier + role from session
    ↓
tierAccessManager reads tier-access.json
    ↓
Show/hide menu items and features by CSS class
    ↓
Server enforces auth on every API request via requireAuth middleware
```

### Device activation flow (first time)
1. User visits app — no valid session found
2. Redirected to login / device activation page
3. User enters email
4. App generates device UUID (platform UUID + serial number → PC code e.g. `C02D6R`)
5. Device registered with custmgr — license validated
6. Session created, user gains access at their subscription tier

---

## Feature Gating

### Client-side (UX only)
`tier-access.json` defines CSS classes to show/hide per user type:

```json
"premium-admin": {
  "cssShow": [".menu-search", ".menu-multi-mode", ".prem-only", ...],
  "cssHide": [".pro-only", ".menu-test", ...]
}
```

`tierAccessManager.js` applies these rules on every page load by setting `element.style.display`.

### Server-side (enforced)
`featureGates` in `tier-access.json` defines minimum tier for sensitive operations:

```json
"featureGates": {
  "modify-doc-index":    { "requiredTier": 2 },
  "change-model-params": { "requiredTier": 2 },
  "manage-models":       { "requiredTier": 2 },
  "modify-config-files": { "requiredTier": 2 },
  "user-management":     { "requiredTier": 1, "requiredRole": "admin" },
  "full-menu-access":    { "requiredTier": 3 }
}
```

---

## Config Files

### tier-access.json
Location: `/Users/Shared/AIPrivateSearch/config/tier-access.json` (runtime)
Template: `client/c01_client-first-app/config/tier-access.json` (repo)

Defines per user type:
- `tier` — numeric tier level
- `role` — admin or searcher
- `cssShow` — CSS classes to make visible
- `cssHide` — CSS classes to hide
- `menuAccess` — menu items allowed
- `features` — feature flags
- `restrictions` — explicit restrictions

### app.json
Contains licensing configuration:
```json
{
  "licensing": {
    "custmgr-url": "http://localhost:56304",
    "grace-period-days": 7,
    "refresh-interval-hours": 24
  }
}
```

---

## custmgr Integration

`aiprivatesearchcustmgr` is the cloud-side licensing server. It manages:
- Customer registration and accounts
- License issuance and revocation
- Device registration and tracking
- Payment processing

### Key custmgr endpoints used by aiprivatesearch
| Endpoint | Purpose |
|----------|---------|
| `POST /api/licensing/activate` | Activate license for a device |
| `POST /api/licensing/validate` | Validate existing license |
| `POST /api/licensing/refresh` | Refresh license token |
| `GET /api/licensing/status` | Check license service status |

### Offline grace period
- 7-day grace period allows offline use without contacting custmgr
- Background refresh attempts every 24 hours
- After grace period expires, user prompted to reconnect

---

## Security

- Device UUID bound to license — prevents sharing across machines
- PC code format: first 3 + last 3 digits of Mac serial number (e.g. `C02D6R`)
- Public IP collected during device registration for analytics
- Rate limiting: 5 activation attempts per 15 minutes
- Server enforces auth independently of client-side visibility

---

## Adding Users (Admin only)

1. Go to **User Management** (admin role required)
2. Click **Add User**
3. Enter email and assign role (admin / searcher)
4. User receives access at the account's subscription tier

Standard tier: 1 computer, 1 admin + searchers
Premium tier: 5 computers, multiple users
Professional tier: unlimited computers and users

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Stuck on activation page | Device not registered | Complete device activation with valid email |
| Wrong tier features showing | Stale tier-access.json | Restart app via `aiprivatesearch.app`, hard refresh |
| "License expired" after offline | Grace period exceeded | Connect to internet, app will refresh automatically |
| User can't access feature | Wrong role or tier | Check user role in User Management |
| Menu items missing | CSS class mismatch | Check browser console for `TIER CSS SHOW` logs |
