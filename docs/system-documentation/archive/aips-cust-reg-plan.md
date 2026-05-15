# AIPrivateSearch Licensing System Implementation Plan

## Overview

The plan integrates a secure JWT-based licensing system between the local AIPrivateSearch app and the separate `aiprivatesearchcustmgr` cloud service, following the improved architecture recommendations from the documentation.

## Architecture Components

### 1. Local App (AIPrivateSearch) - Client Side
- **Location**: `/Users/Shared/AIPrivateSearch/repo/aiprivatesearch/`
- **Role**: License validation, hardware binding, offline grace period
- **Technology**: Node.js with Keychain storage

### 2. Customer Manager (custmgr) - Server Side  
- **Location**: `/Users/Shared/AIPrivateSearch/repo/aiprivatesearchcustmgr/`
- **Role**: License generation, validation, revocation, customer management
- **Technology**: Express.js with PostgreSQL/MySQL

## Implementation Phases

### Phase 1: Customer Manager (custmgr) Server Setup

#### 1.1 Database Schema Enhancement
- Extend existing MySQL schema with licensing tables:
  - `customers` (id, email, created_at, subscription_tier)
  - `licenses` (id, customer_id, hw_hash, token, expires_at, revoked, app_version)
  - `revocation_list` (token, revoked_at)
  - `activation_attempts` (email, hw_hash, ip, attempts, last_attempt)

#### 1.2 JWT Infrastructure
- Generate RSA key pair for JWT signing
- Implement JWT creation with hardware binding
- Add token refresh mechanism
- Create revocation system

#### 1.3 API Endpoints
- `POST /activate` - Initial license activation
- `POST /refresh` - Token refresh for existing licenses  
- `POST /validate` - License validation (optional)
- `POST /revoke` - Admin license revocation
- `GET /status` - License status check

#### 1.4 Security Features
- Rate limiting per email/hardware/IP
- Hardware UUID validation (not serial number)
- Input sanitization and validation
- **CORS configuration for cross-app communication**:
  - Allow localhost origins with dynamic ports (53000, 53001)
  - Whitelist specific local IP ranges for development
  - Handle preflight OPTIONS requests for JWT operations
  - Configure secure headers for cross-origin requests

### Phase 2: Local App Integration

#### 2.1 License Management Module
- Create `lib/licensing/` directory structure:
  - `hardware.js` - Hardware UUID extraction
  - `license.js` - License storage/validation
  - `activation.js` - Activation flow
  - `validation.js` - Local validation logic

#### 2.2 Keychain Integration
- Implement secure license storage using macOS Keychain
- Fallback to encrypted local storage if Keychain unavailable
- License encryption with hardware-bound keys

#### 2.3 Startup Flow Integration
- Modify existing startup sequence to check license validity
- Implement activation prompt when no valid license found
- Add offline grace period (7 days) for expired licenses
- Background token refresh every 24 hours

#### 2.4 User Interface Updates
- Add activation dialog to existing UI
- Integrate with current user management system
- Display license status in user profile
- Add license management options for admins

### Phase 3: Integration with Existing Features

#### 3.1 User Management System Integration
- Link licensing with existing 3-tier subscription system
- Validate subscription tier against license claims
- Enforce tier-based feature restrictions via license
- Sync license status with local user database

#### 3.2 Application Security
- Add license validation to protected routes
- Implement feature gating based on license tier
- Add license checks to sensitive operations
- Integrate with existing Bearer token authentication

#### 3.3 Configuration Management
- Add license configuration to `app.json`
- Environment variable management for custmgr endpoints
- Secure storage of public keys for local validation

### Phase 4: Advanced Features

#### 4.1 Offline Capabilities
- Implement 7-day offline grace period
- Local license validation without network calls
- Graceful degradation when custmgr unavailable
- User notifications for license expiry warnings

#### 4.2 Enterprise Features
- Multi-machine license management
- Floating license support for organizations
- Admin portal for license management
- Bulk activation capabilities

#### 4.3 Monitoring and Analytics
- License usage tracking and analytics
- Activation attempt monitoring
- Security event logging
- Performance metrics for licensing operations

## Technical Implementation Details

### Hardware Identification
```javascript
// Replace Mac serial with System UUID
function getHardwareUUID() {
  const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice').toString();
  const match = output.match(/IOPlatformUUID"\s+=\s+"([^"]+)"/);
  return match ? match[1] : null;
}
```

### JWT Structure
```javascript
{
  sub: customerId,           // Customer ID
  email: "user@example.com", // User email
  hw: "sha256(hwUUID)",      // Hardware hash
  app: "aiprivatesearch",    // App identifier
  tier: 2,                   // Subscription tier (1=Standard, 2=Premium, 3=Professional)
  ver: "19.61",              // App version
  exp: timestamp,            // Expiration (30 days)
  iat: timestamp             // Issued at
}
```

### License Validation Flow
1. **App Startup**: Check for stored license in Keychain
2. **Local Validation**: Verify JWT signature and hardware binding
3. **Expiry Check**: Allow 7-day grace period for offline use
4. **Background Refresh**: Attempt token refresh every 24 hours
5. **Activation Required**: Prompt user if no valid license found

### Integration Points

#### Existing User Management
- Extend current user authentication to include license validation
- Map license tiers to existing subscription tiers
- Integrate license status with user profile display

#### Current Security System
- Add license validation to existing Bearer token middleware
- Integrate with current CSRF protection
- Maintain existing XSS prevention measures

#### Configuration System
- Add custmgr endpoint configuration to existing `app.json`
- Integrate with current environment variable management
- Maintain existing secure configuration practices

## Migration Strategy

### Development Phase
1. Set up custmgr server in parallel with existing system
2. Implement licensing module without affecting current functionality
3. Add license validation as optional feature initially
4. Test with existing user base using development licenses

### Production Rollout
1. Deploy custmgr server to production environment
2. Enable licensing system with grace period for existing users
3. Migrate existing users to licensed system gradually
4. Enforce licensing requirements after migration period

### Backward Compatibility
- Maintain existing user management during transition
- Provide migration path for current users
- Preserve existing subscription tier functionality
- Ensure no disruption to current workflows

## Security Considerations

### Improved Security Measures
- Use System UUID instead of Mac serial number
- Implement server-side JWT signing with RSA keys
- Add hardware binding to prevent license sharing
- Include revocation mechanism for compromised licenses

### Privacy Protection
- Minimize data collection during activation
- Implement offline grace period to reduce tracking
- Allow license validation without constant server communication
- Provide clear privacy controls for users

### Attack Prevention
- Rate limiting on activation endpoints
- Input validation and sanitization
- Protection against license key extraction
- Monitoring for suspicious activation patterns

## CORS Implementation Details

### Cross-App Communication Challenges
- **Local App**: Runs on localhost:53000/53001 (configurable ports)
- **custmgr Server**: Deployed on cloud domain (e.g., api.aiprivatesearch.com)
- **Browser Security**: Modern browsers block cross-origin requests by default

### CORS Configuration Strategy
```javascript
// custmgr server CORS setup
app.use(cors({
  origin: [
    'http://localhost:53000',
    'http://localhost:53001', 
    'http://127.0.0.1:53000',
    'http://127.0.0.1:53001',
    /^http:\/\/localhost:\d+$/,  // Dynamic port support
    /^http:\/\/127\.0\.0\.1:\d+$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

### Alternative Solutions for CORS Issues
1. **Server-to-Server Communication**: Local app backend calls custmgr directly (no browser CORS)
2. **Proxy Configuration**: Local app proxies custmgr requests through its own server
3. **Development Mode**: Relaxed CORS for localhost during development
4. **Production Mode**: Strict CORS with whitelisted domains

This implementation plan provides a secure, user-friendly licensing system that integrates seamlessly with the existing AIPrivateSearch architecture while addressing all security concerns and CORS challenges identified in the documentation.