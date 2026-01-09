# AIPS Licensing Test Plan - January 26, 2025

## Executive Summary

This test plan addresses the critical licensing flow issues in AIPrivateSearch, specifically solving the transition from **no license → license** and **no device → device registration** under a license. The current system has activation loops and authentication conflicts that prevent proper user onboarding.

## Current Issues

### 1. Activation Loop Problem
- User activates license → redirected to login → after login → activation form appears again
- Infinite cycle: activation → login → activation → login → search → activation
- localStorage conflicts between license state and authentication state

### 2. Device Registration Issues
- Hardware ID binding not properly synchronized with CustMgr
- Multiple devices under same license not handled correctly
- Device limits not enforced or validated

### 3. Authentication Integration
- License system (CustMgr) and local authentication system are disconnected
- No automatic user creation after license activation
- Session management conflicts with license validation

## Test Scenarios

### Scenario 1: Fresh Installation (No License, No Device)
**Goal**: New user gets license and registers first device

**Steps**:
1. Fresh install on clean Mac
2. Launch app → index.html
3. Click "Get Started" → license-activation.html
4. Enter email → activate license
5. Redirect to user-management.html → create account
6. Login → access full app functionality

**Expected Result**: Seamless flow without loops

### Scenario 2: Existing License, New Device
**Goal**: User with existing license adds new device

**Steps**:
1. Fresh install on second Mac
2. Launch app → index.html
3. Click "Get Started" → license-activation.html
4. Enter same email as existing license
5. System recognizes existing license, registers new device
6. Redirect to login → user creates account on new device
7. Login → access app with same tier as original license

**Expected Result**: Device added to license, no conflicts

### Scenario 3: License Upgrade
**Goal**: User upgrades from Standard to Premium/Professional

**Steps**:
1. User with Standard license
2. Upgrade license in CustMgr system
3. User clicks "Refresh License" in user-management
4. System updates tier and menu access
5. User sees new Premium/Professional features

**Expected Result**: Immediate tier upgrade without re-activation

### Scenario 4: Device Limit Exceeded
**Goal**: User tries to activate on too many devices

**Steps**:
1. User with Standard license (1 device limit)
2. Try to activate on second device
3. System should reject activation
4. Show error message with device management options

**Expected Result**: Clear error, no activation loop

## Technical Solutions Required

### 1. Fix Activation → Login Flow
```javascript
// After successful license activation:
1. Clear all localStorage auth data
2. Create temporary activation token
3. Redirect to user-management with activation token
4. Auto-populate email field
5. User creates password
6. System creates user account with correct tier
7. Login successful → full app access
```

### 2. Integrate License Check with Auth
```javascript
// In common.js authentication flow:
1. Check license status first
2. If license valid but no user account → redirect to registration
3. If license invalid → redirect to activation
4. If both valid → proceed to app
```

### 3. Device Management System
```javascript
// Device registration process:
1. Generate unique hardware ID
2. Send to CustMgr with license check
3. CustMgr validates device count against license limits
4. Return success/failure with device list
5. Store device registration locally
```

### 4. localStorage Management
```javascript
// Clear strategy for localStorage:
1. License activation clears all auth data
2. Login success stores user session
3. License refresh updates tier without clearing session
4. Logout clears session but preserves license data
```

## Test Environment Setup

### Prerequisites
- Clean macOS installation or VM
- Access to CustMgr test environment
- Test email accounts for different scenarios
- Multiple hardware IDs for device testing

### Test Data
- **Standard License**: test-standard@example.com (1 device)
- **Premium License**: test-premium@example.com (5 devices)
- **Professional License**: test-pro@example.com (unlimited devices)

### Debug Tools
- Use new DebugUtils for state tracking
- Monitor console logs with license/auth prefixes
- Track localStorage changes at each step
- Verify CustMgr API calls and responses

## Success Criteria

### Primary Goals
1. **Zero activation loops**: User never sees activation form after successful activation
2. **Seamless device registration**: New devices register without conflicts
3. **Proper tier enforcement**: Menu access matches license tier
4. **Clean state management**: localStorage and cache work together

### Secondary Goals
1. **Error handling**: Clear messages for device limits, expired licenses
2. **Upgrade path**: Smooth tier upgrades without re-activation
3. **Multi-device sync**: Consistent experience across devices
4. **Fallback mode**: App works offline with cached license

## Implementation Priority

### Phase 1: Fix Activation Loop (Critical)
- Implement proper localStorage clearing
- Fix redirect chain after activation
- Ensure single activation per license

### Phase 2: Device Management (High)
- Implement device registration system
- Add device limit enforcement
- Create device management UI

### Phase 3: Integration Testing (Medium)
- Test all scenarios end-to-end
- Verify CustMgr integration
- Performance and reliability testing

## Timeline

- **Week 1**: Phase 1 implementation and testing
- **Week 2**: Phase 2 implementation and testing  
- **Week 3**: Phase 3 integration testing and bug fixes
- **Week 4**: Production deployment and monitoring

## Risk Mitigation

### High Risk: Breaking Existing Users
- **Mitigation**: Maintain backward compatibility, gradual rollout

### Medium Risk: CustMgr API Changes
- **Mitigation**: Version API calls, implement fallback modes

### Low Risk: Hardware ID Conflicts
- **Mitigation**: Multiple ID generation methods, collision detection

## Conclusion

This test plan provides a comprehensive approach to solving the licensing flow issues. The key is proper integration between the CustMgr license system and local authentication, with clean state management and clear user flows.

**Next Steps**:
1. Implement Phase 1 fixes
2. Create automated test suite
3. Deploy to test environment
4. Validate all scenarios
5. Production rollout with monitoring