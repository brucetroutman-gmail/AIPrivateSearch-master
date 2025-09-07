# CSRF Protection Implementation

## Overview
Cross-Site Request Forgery (CSRF) protection has been implemented to prevent malicious websites from making unauthorized requests to the AISearchScore application using a user's authenticated session.

## Implementation Details

### Server-Side Components

#### 1. CSRF Middleware (`/server/s01_server-first-app/middleware/csrf.mjs`)
- **Token Generation**: Uses crypto.randomBytes(32) for secure token generation
- **Token Storage**: In-memory storage with expiration (1 hour)
- **Token Validation**: Validates tokens on all POST/PUT/DELETE requests
- **Automatic Cleanup**: Removes expired tokens every 5 minutes

#### 2. Server Integration (`/server/s01_server-first-app/server.mjs`)
- **Token Endpoint**: `GET /api/csrf-token` provides tokens to clients
- **Middleware Application**: Applied to all `/api` routes
- **Safe Methods**: GET, HEAD, OPTIONS requests bypass validation

### Client-Side Components

#### 1. CSRF Manager (`/client/c01_client-first-app/csrf.js`)
- **Token Caching**: Stores tokens with expiration tracking
- **Automatic Refresh**: Fetches new tokens when expired
- **Header Integration**: Adds `X-CSRF-Token` header to requests
- **FormData Support**: Adds `_csrf` field to form submissions
- **Enhanced Fetch**: Wrapper function for automatic token inclusion

#### 2. Global Integration (`/client/c01_client-first-app/shared/header.html`)
- **Universal Loading**: CSRF script loaded on all pages
- **Global Availability**: `window.csrfManager` available everywhere

### Protected Endpoints

All state-changing API endpoints now require CSRF tokens:

#### Search Operations
- `POST /api/search` - Search queries with scoring

#### Document Management
- `POST /api/documents/collections/{collection}/upload` - File uploads
- `POST /api/documents/collections/{collection}/index/{filename}` - Document processing
- `DELETE /api/documents/collections/{collection}/index/{filename}` - Remove embeddings
- `DELETE /api/documents/collections/{collection}/files/{filename}` - Delete files
- `DELETE /api/documents/collections/{collection}` - Remove collections
- `POST /api/documents/collections/{collection}/search` - Collection search
- `POST /api/documents/collections/{collection}/files/{filename}/open` - Open files
- `POST /api/documents/convert-selected` - Document conversion

#### Database Operations
- `POST /api/database/save` - Save test results

### Updated Client Files

#### API Services
- `services/api.js` - Updated search function to use CSRF manager
- `shared/common.js` - Updated database export to use CSRF manager

#### User Interfaces
- `collections-editor.html` - All document management operations
- `search.html` - Search and export operations
- `test.html` - Automated testing operations

## Security Features

### Token Properties
- **Cryptographically Secure**: 32-byte random tokens
- **Session-Based**: Tied to session ID or IP address
- **Time-Limited**: 1-hour expiration
- **Automatic Cleanup**: Expired tokens removed periodically

### Validation Process
1. Client requests CSRF token from `/api/csrf-token`
2. Token stored with session identifier and expiration
3. Client includes token in all state-changing requests
4. Server validates token matches stored value
5. Request processed if valid, rejected (403) if invalid/missing

### Error Handling
- **Missing Token**: 403 Forbidden with "CSRF token missing"
- **Invalid Token**: 403 Forbidden with "CSRF token invalid"  
- **Expired Token**: 403 Forbidden with "CSRF token expired"
- **Automatic Retry**: Client can fetch new token and retry

## Testing

### Manual Testing
Run the test script to verify protection:
```bash
node test-csrf.js
```

### Expected Behavior
- GET requests work without tokens
- POST/PUT/DELETE requests fail without tokens (403)
- POST/PUT/DELETE requests succeed with valid tokens
- Expired tokens are rejected and cleaned up

## Benefits

### Security Improvements
- **CSRF Attack Prevention**: Malicious sites cannot forge requests
- **Session Protection**: User sessions protected from cross-site abuse
- **Token Validation**: Cryptographic verification of request origin

### User Experience
- **Transparent Operation**: Users don't see CSRF tokens
- **Automatic Management**: Tokens fetched and included automatically
- **Error Recovery**: Failed requests can retry with new tokens

## Maintenance

### Token Storage
- Currently uses in-memory storage
- For production, consider Redis or database storage
- Tokens automatically cleaned up every 5 minutes

### Configuration
- Token expiration: 1 hour (configurable)
- Cleanup interval: 5 minutes (configurable)
- Token length: 32 bytes (cryptographically secure)

## Compatibility

### Browser Support
- Modern browsers with fetch API support
- Automatic fallback for FormData submissions
- No additional dependencies required

### Server Requirements
- Node.js crypto module
- Express.js middleware support
- Memory for token storage (minimal impact)