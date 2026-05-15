# AIPrivateSearch User Management System

## Overview

The AIPrivateSearch User Management System provides secure authentication, authorization, and user administration for the platform. It implements a dual-role structure combining subscription tiers with user roles for granular access control.

## System Architecture

### Core Components
- **UserManager**: JSON-based user data management
- **Authentication Middleware**: Session validation and route protection
- **Auth Routes**: Login, registration, and user management endpoints
- **User Interface**: Web-based administration panel

### Data Storage
- **Users**: `/Users/Shared/AIPrivateSearch/data/users.json`
- **Sessions**: `/Users/Shared/AIPrivateSearch/data/sessions.json`

## Database Schema

### User Object Structure
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "passwordHash": "sha256-hash",
  "subscriptionTier": "standard|premium|professional",
  "userRole": "admin|searcher",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "lastLogin": "2024-01-01T00:00:00.000Z",
  "active": true
}
```

### Session Object Structure
```json
{
  "sessionId": {
    "userId": "uuid-string",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "expiresAt": "2024-01-02T00:00:00.000Z"
  }
}
```

## Subscription Tiers & User Roles

### Subscription Tiers
- **Standard**: Basic access level
- **Premium**: Enhanced features and capabilities
- **Professional**: Full system access

### User Roles
- **Admin**: User management and system administration
- **Searcher**: Search and query operations

### Access Control Matrix
| Feature | Standard/Admin | Standard/Searcher | Premium/Admin | Premium/Searcher | Professional/Admin | Professional/Searcher |
|---------|----------------|-------------------|---------------|------------------|--------------------|--------------------|
| Search Operations | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| User Management | ✓ | ✗ | ✓ | ✗ | ✓ | ✗ |
| Model Configuration | ✗ | ✗ | ✓ | ✗ | ✓ | ✓ |
| System Administration | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |

## Security Features

### Password Security
- SHA-256 password hashing
- No plaintext password storage
- Secure password validation

### Session Management
- UUID-based session tokens
- 24-hour session expiration
- Automatic session cleanup
- Authorization header-based authentication (not cookies)

### Authorization Strategy
**Implementation**: Bearer token authentication using Authorization headers
- **Client Storage**: Session tokens stored in localStorage
- **Request Headers**: `Authorization: Bearer {sessionId}` sent with all authenticated requests
- **Server Validation**: Middleware validates session tokens against stored sessions
- **No Cookies**: Eliminates CORS cookie issues by using headers instead

### Access Control
- Route-level authentication middleware (`requireAuth`)
- Role-based authorization (admin vs searcher)
- Admin-only endpoints for user management
- Active user status checking
- Dual-role system: subscription tier + user role

### Data Protection
- Secure file operations
- JSON data validation
- Error message sanitization
- XSS prevention with DOM-based messaging
- No alert() usage for security

## API Endpoints

### Authentication
- `POST /auth/register` - Create new user account
- `POST /auth/login` - User authentication
- `POST /auth/logout` - Session termination
- `GET /auth/me` - Current user information

### User Management
- `GET /auth/users` - List all users (admin only)
- `PUT /auth/users/:userId` - Update user details (admin only)

## Getting Started

### Step 1: Automatic Setup
The system automatically configures itself when you start the application:

```bash
# Use the standard AIPrivateSearch startup
# Navigate to /Users/Shared and double-click:
load-aiss.command
```

**What happens automatically**:
- Data directory created at `/Users/Shared/AIPrivateSearch/repo/aiprivatesearch/data/`
- Default admin user created on first server startup
- Authentication system initialized
- All dependencies installed and services started

### Step 2: Default Admin Access
**Pre-configured admin credentials** (ready to use immediately):
- **Email**: `aips@anywhere.co`
- **Password**: `aips!123`
- **Subscription**: `standard`
- **Role**: `admin`

### Step 3: First Login
1. Navigate to `http://localhost:3000` (any page)
2. System automatically redirects to user management for authentication
3. Login with default admin credentials
4. Access granted to full application

### Step 4: User Management (Admin Only)
- **Add Users**: Click "Add New User" in admin panel
- **Manage Roles**: Change user roles (admin/searcher) via dropdown
- **Subscription Tiers**: Assign standard/premium/professional tiers
- **Navigation**: Use "Go to Application" button to return to main app

### Step 5: Optional - Additional Admin Users
Create additional admin users using the script:
```bash
cd /Users/Shared/AIPrivateSearch/repo/aiprivatesearch/server/s01_server-first-app
# Admin users are pre-configured in data/users.json
```

## User Management Operations

### Admin Access Control
- **Admin Role Required**: Only users with `admin` role can manage other users
- **Cross-Tier Access**: Admins can manage users regardless of subscription tier
- **Self-Service**: All users can view their own profile information

### Creating Users
1. Login as admin at `/user-management.html`
2. Click "Add New User" in admin panel
3. Enter email, password, subscription tier, and role
4. Submit to create user account

### Managing Users
1. View all users in the admin panel (admin only)
2. Update subscription tiers via dropdown selection
3. Change user roles (admin/searcher) via dropdown
4. Monitor user login activity and status

### Session Management
- **Token Storage**: Session tokens stored in browser localStorage
- **24-Hour Expiration**: Sessions automatically expire after 24 hours
- **Manual Logout**: Users can logout to terminate sessions immediately
- **Automatic Cleanup**: Server removes expired sessions automatically
- **Cross-Page Persistence**: Sessions work across all application pages

## Authorization Implementation Details

### Client-Side Authentication Flow
1. **Login**: POST to `/api/auth/login` with credentials
2. **Token Storage**: Store returned `sessionId` in localStorage
3. **Request Headers**: Include `Authorization: Bearer {sessionId}` in all API calls
4. **Logout**: Clear localStorage and call `/api/auth/logout`

### Server-Side Middleware
```javascript
// Authentication middleware
export async function requireAuth(req, res, next) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  if (!sessionId) return res.status(401).json({ error: 'Authentication required' });
  
  const user = await userManager.validateSession(sessionId);
  if (!user) return res.status(401).json({ error: 'Invalid session' });
  
  req.user = user;
  next();
}
```

### Role-Based Access Control
- **Admin Endpoints**: `/api/auth/users` (GET, PUT) - admin role required
- **User Endpoints**: `/api/auth/me` - any authenticated user
- **Public Endpoints**: `/api/auth/login`, `/api/auth/register` - no auth required

## Troubleshooting

### Authentication Issues
- **401 Unauthorized**: Check if sessionId exists in localStorage
- **Session Expired**: Re-login to get new session token
- **CORS Issues**: Ensure Authorization headers are properly sent

### Access Control Issues
- **403 Forbidden**: Verify user has admin role for management operations
- **User Not Found**: Check if user exists and is active
- **Permission Denied**: Ensure user role matches endpoint requirements

### File Locations
- User data: `/Users/Shared/AIPrivateSearch/repo/aiprivatesearch/data/users.json`
- Session data: `/Users/Shared/AIPrivateSearch/repo/aiprivatesearch/data/sessions.json`
- Admin users: Pre-configured in `data/users.json`

### Security Best Practices
- **Change Default Credentials**: Update default admin password immediately
- **HTTPS in Production**: Use secure connections for token transmission
- **Regular Audits**: Review user access levels and session activity
- **Token Security**: Tokens stored in localStorage (not sessionStorage for persistence)

## Test Results Tracking System

### Overview
Integrated test results tracking system for comprehensive user management testing across all subscription tiers and user roles.

### Test Results Tracker
**Location**: `http://localhost:3000/test-results/test-results-tracker.html`

**Features**:
- Automated Mac serial number detection
- Tester identification via email
- Real-time timestamp recording
- Structured test phase tracking (5 phases)
- JSON file storage with descriptive naming

### Test Data Structure
```json
{
  "testSession": {
    "testTitle": "user-auth-test",
    "testerEmail": "tester@example.com",
    "macSerial": "C02XY1234567",
    "testDateTime": "2024-10-28T15:30:00.000Z",
    "testDateTimeLocal": "10/28/2024, 3:30:00 PM"
  },
  "testResults": {
    "phase1": {
      "name": "Admin Login Testing",
      "status": "pass",
      "comments": "All tier admin logins successful"
    }
  },
  "overallStatus": "pass"
}
```

### Storage and Retrieval
- **Server Storage**: `/test-results/{testTitle}-results.json`
- **API Endpoints**: 
  - `GET /api/system-info` - Mac serial detection
  - `POST /api/save-test-results` - Save test results
  - `GET /api/test-results` - Retrieve all results
- **Local Fallback**: localStorage if server unavailable
- **Export**: Downloadable JSON files

## Future Enhancements

### Phase 2: SecureAccess Integration
- External API connection to SecureAccess
- Automated license validation
- Computer limit enforcement
- Synchronized user data

### Phase 3: Role-Based Feature Control
- Menu item restrictions by subscription tier
- Feature gating based on user roles
- Usage tracking and reporting
- Automated billing integration

## Current Implementation Status

### ✅ Completed Features
- JSON-based user storage system
- SHA-256 password hashing
- Bearer token authentication
- Role-based access control (admin/searcher)
- Subscription tier management (standard/premium/professional)
- User management UI with dark mode support
- Automatic default admin user creation
- Session management with 24-hour expiration
- Cross-page authentication integration
- **Test results tracking system with Mac serial detection**
- **Comprehensive test plan with 5-phase validation**
- **Automated test data storage and retrieval**

### 🔄 Next Phase: SecureAccess Integration
- External API connection to SecureAccess
- License validation and computer limits
- Automated user synchronization
- Enhanced subscription management

## Authentication Workflow Example

### Scenario: Admin Login → Search → Manage Collections

#### 1. Initial Access
```
User navigates to: http://localhost:3000/search.html
↓
No sessionId in localStorage
↓
Automatic redirect to: http://localhost:3000/user-management.html
```

#### 2. Admin Login
```
User enters credentials:
- Email: aips@anywhere.co
- Password: aips!123
↓
POST /api/auth/login
{
  "email": "aips@anywhere.co",
  "password": "aips!123"
}
↓
Server response:
{
  "success": true,
  "user": {
    "id": "uuid-123",
    "email": "aips@anywhere.co",
    "subscriptionTier": "standard",
    "userRole": "admin"
  },
  "sessionId": "session-token-456"
}
↓
Client stores sessionId in localStorage
```

#### 3. Navigate to Search Page
```
User clicks "Go to Application" or navigates to search.html
↓
common.js checks authentication:
GET /api/auth/me
Headers: { "Authorization": "Bearer session-token-456" }
↓
Server validates session and returns user data
↓
Search page loads with admin privileges
```

#### 4. Access Collections Management
```
User navigates to collections.html
↓
Same authentication check with stored sessionId
↓
Admin role grants full access to:
- Create/edit collections
- Manage document indexes
- Modify embeddings
- All collection management features
```

#### 5. Session Persistence
```
All subsequent page navigation:
- sessionId remains in localStorage
- Authorization header sent with every API request
- No re-login required until session expires (24 hours)
- Logout clears sessionId and redirects to user-management
```

### Authentication Headers in Action
```javascript
// Every authenticated API request includes:
fetch('http://localhost:3001/api/collections', {
  headers: {
    'Authorization': 'Bearer session-token-456',
    'Content-Type': 'application/json'
  }
})
```

---

**Version**: 19.36 | **Last Updated**: 2024-10-28 | **Status**: Phase 1 Complete - Authorization System + Test Tracking Implemented