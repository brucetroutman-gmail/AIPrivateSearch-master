# Test Plan for app_token System

**Version**: 19.74  
**Date**: December 2024  
**Scope**: Complete testing strategy for app_token implementation  

---

## Test Overview

### Objectives
- Validate app_token functionality across all components
- Ensure secure migration from legacy localStorage
- Verify performance requirements (5-minute cache, <50ms overhead)
- Test integration with existing applications

### Test Environment
- **Browser**: Chrome 120+, Safari 17+, Firefox 121+
- **Platform**: macOS 12+
- **Applications**: Main app, Web app, Customer Manager
- **Network**: Local development (localhost:3000-3002)

---

## Unit Tests

### AppTokenManager.js
```javascript
// Test token creation
test('creates valid token structure', () => {
  const token = AppTokenManager.createToken();
  expect(token).toHaveProperty('ui');
  expect(token).toHaveProperty('search');
  expect(token).toHaveProperty('models');
  expect(token).toHaveProperty('session');
});

// Test CRUD operations
test('sets and gets values correctly', () => {
  AppTokenManager.set('ui.theme', 'dark');
  expect(AppTokenManager.get('ui.theme')).toBe('dark');
});

// Test migration
test('migrates legacy localStorage', () => {
  localStorage.setItem('theme', 'light');
  AppTokenManager.migrateLegacyData();
  expect(AppTokenManager.get('ui.theme')).toBe('light');
});
```

### SecureUserManager.js
```javascript
// Test caching
test('caches user data for 5 minutes', async () => {
  const user1 = await SecureUserManager.getUserData('test@example.com');
  const user2 = SecureUserManager.getCachedUserData('test@example.com');
  expect(user1).toEqual(user2);
});

// Test cache expiration
test('expires cache after 5 minutes', () => {
  // Mock Date.now() + 5 minutes
  const expired = SecureUserManager.isCacheExpired('test@example.com');
  expect(expired).toBe(true);
});
```

---

## Integration Tests

### Cross-Application Compatibility
```javascript
// Test token sharing between apps
test('token works across all applications', () => {
  // Set in main app
  AppTokenManager.set('ui.theme', 'dark');
  
  // Verify in web app
  const webToken = new AppTokenManager();
  expect(webToken.get('ui.theme')).toBe('dark');
});
```

### Migration Testing
```javascript
// Test complete migration scenario
test('migrates all legacy data', () => {
  // Setup legacy data
  localStorage.setItem('theme', 'light');
  localStorage.setItem('userEmail', 'test@example.com');
  localStorage.setItem('selectedSearchModel', 'qwen2:1.5b');
  
  // Run migration
  AppTokenManager.migrateLegacyData();
  
  // Verify migration
  expect(AppTokenManager.get('ui.theme')).toBe('light');
  expect(AppTokenManager.get('session.email')).toBe('test@example.com');
  expect(AppTokenManager.get('models.search')).toBe('qwen2:1.5b');
});
```

---

## Performance Tests

### Load Time Testing
```javascript
// Test initial load performance
test('loads within 50ms', () => {
  const start = performance.now();
  AppTokenManager.initialize();
  const end = performance.now();
  expect(end - start).toBeLessThan(50);
});

// Test cache performance
test('cached reads are instant', () => {
  const start = performance.now();
  SecureUserManager.getCachedUserData('test@example.com');
  const end = performance.now();
  expect(end - start).toBeLessThan(1);
});
```

### Memory Usage
```javascript
// Test token size limits
test('token stays under 10KB', () => {
  const token = AppTokenManager.getFullToken();
  const size = JSON.stringify(token).length;
  expect(size).toBeLessThan(10240); // 10KB
});
```

---

## Security Tests

### Data Validation
```javascript
// Test sensitive data removal
test('removes sensitive data from localStorage', () => {
  localStorage.setItem('userRole', 'admin');
  AppTokenManager.migrateLegacyData();
  expect(localStorage.getItem('userRole')).toBeNull();
});

// Test server-side validation
test('validates user data server-side', async () => {
  const userData = await SecureUserManager.getUserData('test@example.com');
  expect(userData).not.toHaveProperty('password');
  expect(userData).not.toHaveProperty('apiKey');
});
```

### Input Sanitization
```javascript
// Test XSS prevention
test('sanitizes malicious input', () => {
  const malicious = '<script>alert("xss")</script>';
  AppTokenManager.set('ui.theme', malicious);
  const stored = AppTokenManager.get('ui.theme');
  expect(stored).not.toContain('<script>');
});
```

---

## User Acceptance Tests

### Test Scenarios

#### Scenario 1: New User Setup
1. **Given**: Fresh browser with no localStorage
2. **When**: User accesses application
3. **Then**: Default token structure is created
4. **Verify**: All UI elements load correctly

#### Scenario 2: Existing User Migration
1. **Given**: Browser with legacy localStorage data
2. **When**: User accesses updated application
3. **Then**: Data migrates to app_token structure
4. **Verify**: All preferences preserved

#### Scenario 3: Theme Switching
1. **Given**: User in light theme
2. **When**: User switches to dark theme
3. **Then**: Theme persists across page reloads
4. **Verify**: No flash of unstyled content

#### Scenario 4: Model Selection
1. **Given**: User selects search model
2. **When**: User navigates between pages
3. **Then**: Model selection persists
4. **Verify**: Search functionality works correctly

#### Scenario 5: Session Management
1. **Given**: User logged in with email
2. **When**: User closes and reopens browser
3. **Then**: Session data restored from server
4. **Verify**: User remains authenticated

---

## Browser Compatibility Tests

### Chrome Testing
- [ ] Token creation and storage
- [ ] Migration from legacy data
- [ ] Performance benchmarks
- [ ] Security validation

### Safari Testing
- [ ] localStorage compatibility
- [ ] JSON parsing/stringifying
- [ ] Cache behavior
- [ ] Theme loading

### Firefox Testing
- [ ] Cross-tab synchronization
- [ ] Memory usage
- [ ] Error handling
- [ ] API integration

---

## Error Handling Tests

### Network Failures
```javascript
// Test offline behavior
test('handles network failures gracefully', async () => {
  // Mock network failure
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
  
  const userData = await SecureUserManager.getUserData('test@example.com');
  expect(userData).toBeNull();
});
```

### Corrupted Data
```javascript
// Test invalid token recovery
test('recovers from corrupted token', () => {
  localStorage.setItem('app_token', 'invalid-json');
  const token = AppTokenManager.getFullToken();
  expect(token).toHaveProperty('ui');
});
```

### Storage Limits
```javascript
// Test localStorage quota exceeded
test('handles storage quota exceeded', () => {
  // Fill localStorage to capacity
  try {
    AppTokenManager.set('test.large', 'x'.repeat(10000000));
  } catch (error) {
    expect(error.name).toBe('QuotaExceededError');
  }
});
```

---

## Regression Tests

### Version Compatibility
- [ ] v19.72 → v19.74 migration
- [ ] Backward compatibility with v19.70
- [ ] Forward compatibility planning

### Feature Preservation
- [ ] All existing functionality works
- [ ] No performance degradation
- [ ] UI/UX consistency maintained

---

## Test Execution

### Automated Testing
```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance

# Generate coverage report
npm run test:coverage
```

### Manual Testing Checklist
- [ ] Fresh installation test
- [ ] Migration from each legacy version
- [ ] Cross-browser compatibility
- [ ] Performance benchmarks
- [ ] Security validation
- [ ] User acceptance scenarios

### Test Data
```javascript
// Sample test users
const testUsers = [
  { email: 'admin@test.com', role: 'admin', tier: 'professional' },
  { email: 'user@test.com', role: 'searcher', tier: 'standard' },
  { email: 'guest@test.com', role: 'guest', tier: 'trial' }
];

// Sample token data
const sampleToken = {
  ui: { theme: 'light', language: 'en' },
  search: { mode: 'ai-chat', collection: 'test-docs' },
  models: { search: 'qwen2:1.5b', score: 'llama3.2:1b' },
  session: { email: 'test@example.com', timestamp: Date.now() }
};
```

---

## Success Criteria

### Performance Requirements
- [ ] Initial load: <50ms
- [ ] Cached reads: <1ms
- [ ] Token size: <10KB
- [ ] Memory usage: <5MB

### Functionality Requirements
- [ ] 100% migration success rate
- [ ] Zero data loss during migration
- [ ] All legacy features preserved
- [ ] New security model active

### Quality Requirements
- [ ] 95%+ test coverage
- [ ] Zero critical security issues
- [ ] Cross-browser compatibility
- [ ] User acceptance approval

---

## Risk Mitigation

### High-Risk Areas
1. **Migration Failures**: Comprehensive backup strategy
2. **Performance Degradation**: Rollback plan to v19.72
3. **Security Vulnerabilities**: Immediate hotfix process
4. **Browser Compatibility**: Progressive enhancement approach

### Rollback Plan
1. Detect critical issues in production
2. Revert to previous localStorage system
3. Preserve user data during rollback
4. Communicate with affected users

---

## Test Schedule

### Phase 1: Unit Testing (2 days)
- AppTokenManager tests
- SecureUserManager tests
- Utility function tests

### Phase 2: Integration Testing (2 days)
- Cross-application compatibility
- Migration testing
- API integration

### Phase 3: Performance Testing (1 day)
- Load time benchmarks
- Memory usage analysis
- Cache performance validation

### Phase 4: Security Testing (1 day)
- Penetration testing
- Data validation
- Input sanitization

### Phase 5: User Acceptance Testing (2 days)
- Real user scenarios
- Cross-browser testing
- Final validation

**Total Duration**: 8 days  
**Go-Live Target**: After successful UAT completion