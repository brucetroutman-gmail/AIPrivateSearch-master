# AIPrivateSearch Licensing System Implementation

## Overview

The AIPrivateSearch licensing system has been implemented following the secure JWT-based architecture outlined in the implementation plan. The system consists of two main components:

1. **Customer Manager (custmgr)** - Cloud-based licensing server
2. **Local App Integration** - License validation and management in AIPrivateSearch

## Implementation Status

### ✅ Phase 1: Customer Manager (custmgr) Server Setup

#### Database Schema
- `customers` table for user management
- `licenses` table for license tracking
- `revocation_list` table for token revocation
- `activation_attempts` table for rate limiting

#### JWT Infrastructure
- RSA key pair auto-generation
- JWT creation with hardware binding
- Token refresh mechanism
- Revocation system

#### API Endpoints
- `POST /api/licensing/activate` - License activation
- `POST /api/licensing/refresh` - Token refresh
- `POST /api/licensing/validate` - License validation
- `POST /api/licensing/revoke` - License revocation
- `GET /api/licensing/public-key` - Public key retrieval
- `GET /api/licensing/status` - Service status

#### Security Features
- Rate limiting (5 attempts per 15 minutes)
- Hardware UUID validation (not serial number)
- Input sanitization and validation
- CORS configuration for cross-app communication

### ✅ Phase 2: Local App Integration

#### License Management Module
- `hardware.mjs` - Hardware UUID extraction
- `license-storage.mjs` - Encrypted license storage
- `license-client.mjs` - Communication with custmgr
- `license-manager.mjs` - Coordination and middleware

#### Security Features
- Secure license storage with hardware-bound encryption
- Local JWT validation with public key
- 7-day offline grace period
- Background token refresh every 24 hours

#### API Integration
- License status endpoint
- Activation endpoint
- Feature validation endpoint
- System information endpoint

#### Frontend Components
- License activation UI (`license-activation.html`)
- License checker utility (`license-checker.js`)
- Tier-based feature restrictions

## Configuration

### Customer Manager (.env)
```env
NODE_ENV=development
PORT=56304
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=aiprivatesearch_custmgr
ALLOWED_ORIGINS=http://localhost:53000,http://localhost:53001
```

### AIPrivateSearch (app.json)
```json
{
  "licensing": {
    "custmgr-url": "http://localhost:56304",
    "grace-period-days": 7,
    "refresh-interval-hours": 24
  }
}
```

## Usage

### Starting the System

1. **Start Customer Manager:**
   ```bash
   cd /Users/Shared/AIPrivateSearch/repo/aiprivatesearchcustmgr/server/s01_server-first-app
   npm install
   npm start
   ```

2. **Start AIPrivateSearch:**
   ```bash
   cd /Users/Shared/AIPrivateSearch/repo/aiprivatesearch
   ./start.sh
   ```

### License Activation

1. User visits AIPrivateSearch application
2. If no valid license found, redirected to activation page
3. User enters email address
4. System generates hardware ID and sends to custmgr
5. License token returned and stored securely
6. User gains access based on subscription tier

### License Validation Flow

1. **App Startup**: Check for stored license
2. **Local Validation**: Verify JWT signature and hardware binding
3. **Expiry Check**: Allow 7-day grace period for offline use
4. **Background Refresh**: Attempt token refresh every 24 hours
5. **Feature Gating**: Restrict features based on subscription tier

## Security Features

### Improved Security Measures
- System UUID instead of Mac serial number
- Server-side JWT signing with RSA keys
- Hardware binding to prevent license sharing
- Revocation mechanism for compromised licenses

### Privacy Protection
- Minimal data collection during activation
- Offline grace period reduces tracking
- Local license validation without constant server communication
- Encrypted local storage

### Attack Prevention
- Rate limiting on activation endpoints
- Input validation and sanitization
- Protection against license key extraction
- Monitoring for suspicious activation patterns

## Subscription Tiers

### Standard Tier (1)
- Basic search functionality
- Multi-mode search
- Collection management
- Options and dark mode

### Premium Tier (2)
- All Standard features
- Model management
- Configuration editing
- Document index editing

### Professional Tier (3)
- All Premium features
- Advanced analytics
- Test code access
- Full administrative access

## CORS Configuration

The system handles cross-app communication between:
- Local AIPrivateSearch (localhost:53000/53001)
- Customer Manager (localhost:56304 or cloud domain)

CORS is configured to allow:
- Dynamic port support with regex patterns
- Credential support for authenticated requests
- Proper HTTP methods and headers

## Troubleshooting

### Common Issues

1. **License activation fails**
   - Check custmgr server is running
   - Verify network connectivity
   - Check CORS configuration

2. **Hardware ID issues**
   - Ensure system has valid UUID
   - Check hardware detection functions
   - Verify composite ID generation

3. **Token validation fails**
   - Check public key availability
   - Verify JWT signature
   - Check hardware binding

### Debug Endpoints

- `GET /api/licensing/status` - Current license status
- `GET /api/licensing/system-info` - Hardware information
- `GET /api/licensing/features/:feature` - Feature availability

## Next Steps

### Phase 3: Integration with Existing Features
- Link with current user management system
- Integrate with Bearer token authentication
- Add license validation to protected routes

### Phase 4: Advanced Features
- Multi-machine license management
- Enterprise admin portal
- Usage analytics and monitoring
- Mobile application support

## Files Created/Modified

### Customer Manager
- `server/s01_server-first-app/lib/licensing-db.mjs`
- `server/s01_server-first-app/lib/jwt-manager.mjs`
- `server/s01_server-first-app/lib/licensing-service.mjs`
- `server/s01_server-first-app/routes/licensing.mjs`
- `server/s01_server-first-app/server.mjs` (modified)

### AIPrivateSearch
- `server/s01_server-first-app/lib/licensing/hardware.mjs`
- `server/s01_server-first-app/lib/licensing/license-storage.mjs`
- `server/s01_server-first-app/lib/licensing/license-client.mjs`
- `server/s01_server-first-app/lib/licensing/license-manager.mjs`
- `server/s01_server-first-app/routes/licensing.mjs`
- `server/s01_server-first-app/server.mjs` (modified)
- `server/s01_server-first-app/package.json` (modified)
- `client/c01_client-first-app/license-activation.html`
- `client/c01_client-first-app/shared/license-checker.js`
- `client/c01_client-first-app/config/app.json` (modified)

The licensing system is now ready for testing and integration with the existing AIPrivateSearch application.