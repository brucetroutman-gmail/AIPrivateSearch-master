# AIPrivateSearch Startup Tests & Checks

## Overview
This document lists all tests and checks performed when AIPrivateSearch starts up, based on analysis of the codebase.

## Startup Sequence

### 1. Theme Loading (Immediate)
- **Test**: Load saved theme from localStorage
- **Default**: Dark theme if no saved preference
- **Purpose**: Prevent theme flash during page load
- **On Failure**: 
  - Use dark theme as fallback
  - Continue startup (non-critical)
  - Log warning to console

### 2. App Configuration Loading
- **Test**: Fetch `./config/app.json`
- **Checks**: 
  - App name configuration
  - Backend port configuration (default: 3001, actual: 56306)
- **Actions**: Update page title and heading with app name
- **On Failure**:
  - Use default app name "AI Private Search"
  - Use default backend port 3001
  - Continue startup with defaults
  - Log error to console

### 3. License System Initialization
- **Test**: Initialize license checker
- **Checks**:
  - API base URL configuration
  - License cache validity (72-hour timeout)
  - Network connectivity to licensing server
- **On Failure**:
  - Enable fallback mode with Standard tier
  - Set `fallback: true` in license status
  - Continue startup in degraded mode
  - Show yellow warning banner

### 4. License Status Check
- **Test**: Check current license validity
- **API Call**: `GET /api/licensing/status`
- **Checks**:
  - License file existence
  - License signature validation
  - License expiration date
  - Device UUID matching
  - Email validation
- **Results**:
  - `valid`: Boolean license validity
  - `tier`: Subscription tier (1=Standard, 2=Premium, 3=Professional)
  - `email`: Licensed user email
  - `requiresActivation`: Whether activation is needed
  - `gracePeriod`: Whether in grace period
  - `expired`: Whether license has expired
- **On Failure**:
  - Set `requiresActivation: true`
  - Show "Get Started" button on index page
  - Redirect to license-activation.html when accessing protected pages
  - Enable local mode with limited features

### 5. Device Registration Check
- **Test**: Verify device is registered for license
- **API Call**: `GET /api/licensing/status?email={email}`
- **Checks**:
  - Device UUID matches registered device
  - Email matches license holder
  - License is active and not expired
- **On Failure**:
  - Show "Device Activation Required" page
  - Prompt user to register device
  - Block access to app features
  - Provide customer registration link

### 6. Authentication Status Check
- **Test**: Verify user session validity
- **API Call**: `GET /api/auth/me`
- **Checks**:
  - Session ID exists in localStorage
  - Session is not expired (1-hour timeout)
  - User account is active
  - User role and tier information
- **Actions**: Store user data in localStorage for tier access
- **On Failure**:
  - Clear invalid sessionId from localStorage
  - Show login form on user-management.html
  - Hide navigation menu on index.html
  - Auto-fill credentials if from license activation

### 7. User Role & Tier Validation
- **Test**: Validate user permissions
- **Checks**:
  - User role (admin/searcher)
  - Subscription tier (Standard/Premium/Professional)
  - Feature access permissions
- **Actions**: Apply CSS classes for tier-based UI visibility
- **On Failure**:
  - Default to Standard tier (tier 1)
  - Default to searcher role
  - Hide premium/professional features
  - Log permission errors to console

### 8. Database Connectivity Test
- **Test**: Verify MySQL database connection
- **Connection**: `92.112.184.206:3306` using `aips-readwrite` user
- **Checks**:
  - Database server availability
  - Credentials validity
  - Database schema accessibility
- **Purpose**: Enable search result storage and user management
- **On Failure**:
  - Use local JSON files for user management
  - Disable database export functionality
  - Store search results locally only
  - Show "Database Unavailable" warning
  - Continue with reduced functionality

### 9. System Information Gathering
- **Test**: Collect system hardware information
- **Checks**:
  - Device UUID generation
  - CPU information
  - Graphics card details
  - RAM specifications
  - Operating system version
- **Purpose**: License validation and performance metrics
- **On Failure**:
  - Use generic system identifiers
  - Generate fallback UUID
  - Set system info to "Unknown"
  - Continue startup (non-critical)
  - Log hardware detection errors

### 10. Footer Team Members Loading
- **Test**: Load team member information
- **API Call**: `GET /api/group-members`
- **Checks**: Database connectivity for member profiles
- **On Failure**:
  - Skip footer member display
  - Show generic footer text
  - Continue startup (non-critical)
  - Silent failure (no user notification)

## Navigation Flow Based on Checks

### New User (No License)
1. **index.html** → Shows landing page with "Get Started" button
2. **license-activation.html** → Device registration and license activation
3. **user-management.html** → Auto-login after activation

### Licensed User (No Session)
1. **index.html** → Shows landing page (license valid, no auth)
2. **user-management.html** → Login form with auto-filled credentials
3. **Dashboard** → After successful authentication

### Authenticated User
1. **index.html** → Shows navigation menu, hides "Get Started" button
2. **Direct access** → All app features available based on tier

### License Issues
1. **Expired License** → Grace period warning, limited functionality
2. **Invalid License** → Redirect to activation page
3. **Network Issues** → Fallback to local mode

## Error Handling & Fallbacks

### License Server Unavailable
- **Fallback**: Local mode with Standard tier features
- **Status**: `fallback: true` in license status
- **UI**: Yellow warning banner about local mode

### Authentication Failures
- **Session Expired**: Clear localStorage, show login form
- **Invalid Credentials**: Show error message, remain on login
- **Network Error**: Allow retry, don't block app

### Database Connection Issues
- **Search Results**: Store locally, sync when available
- **User Management**: Use local JSON files
- **Team Members**: Skip footer population

## Security Checks

### License Validation
- **Digital Signature**: Verify license authenticity
- **Device Binding**: Ensure license matches current device
- **Expiration**: Check license validity period
- **Tier Verification**: Validate subscription level

### Session Security
- **Bearer Token**: Validate session token format
- **Timeout**: Enforce 1-hour session expiration
- **CSRF Protection**: Validate request origins
- **Role Validation**: Verify user permissions

### Input Sanitization
- **Email Validation**: Check email format and domain
- **XSS Prevention**: Sanitize all user inputs
- **SQL Injection**: Use parameterized queries
- **Path Traversal**: Validate file paths

## Performance Monitoring

### Startup Timing
- **License Check**: < 2 seconds typical
- **Authentication**: < 1 second typical
- **Database Connection**: < 3 seconds typical
- **Total Startup**: < 5 seconds typical

### Cache Management
- **License Status**: 72-hour cache
- **User Session**: 1-hour timeout
- **System Info**: Session-based cache
- **Configuration**: Page-load cache

## Troubleshooting Common Issues

### "Not Licensed" Status
1. Check license file exists
2. Verify device UUID matches
3. Confirm network connectivity
4. Check license expiration date

### Authentication Loops
1. Clear localStorage data
2. Check session timeout settings
3. Verify user account status
4. Confirm database connectivity

### Missing Features
1. Check subscription tier
2. Verify license validity
3. Confirm user role permissions
4. Check feature flags

### Performance Issues
1. Monitor database response times
2. Check license server connectivity
3. Verify system resource usage
4. Review cache hit rates

## Configuration Files

### Critical Startup Files
- `config/app.json` - App configuration and ports
- `config/tier-access.json` - Feature access by tier
- `data/users.json` - Local user accounts
- `data/sessions.json` - Active user sessions
- `.env-aips` - Database credentials

### License Files
- `data/license.enc` - Encrypted license file
- `lib/licensing/public-key.pem` - License verification key
- Hardware UUID files (system-generated)

This comprehensive startup testing ensures secure, licensed operation while providing graceful fallbacks for various failure scenarios.