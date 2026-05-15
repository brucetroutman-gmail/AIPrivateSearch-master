# AIPrivateSearch User Test Plan

## Overview
This test plan validates the complete user management system across all subscription tiers (Standard, Premium, Professional) and user roles (Admin, Searcher). Each test verifies proper authentication, authorization, and feature access controls.

## Prerequisites
- AIPrivateSearch system running (http://localhost:3000)
- User Management page accessible (http://localhost:3000/user-management.html)
- Default tier-specific admin accounts created automatically

## Test Environment Setup

### Default Admin Accounts
| Tier | Email | Password | Features |
|------|-------|----------|----------|
| Standard (Tier 1) | adm-std@a.com | 123 | Basic search, collections, user management |
| Premium (Tier 2) | adm-prem@a.com | 123 | Standard + model management, config editing |
| Professional (Tier 3) | adm-prof@a.com | 123 | All features, full access |

## Test Results Tracking

### Test Results Tracker Interface
**Access**: `http://localhost:3000/test-results/test-results-tracker.html`

**Required Information**:
- **Tester Email**: Your email for accountability
- **Test Title**: Descriptive name (default: "user-auth-test")
- **Mac Serial**: Automatically detected
- **Test Results**: Pass/Fail/Pending for each phase
- **Comments**: Detailed observations for each phase

**File Output**: `{testTitle}-results.json` (e.g., `user-auth-test-results.json`)

### Using the Tracker
1. Open tracker before starting tests
2. Enter your email and test title
3. Complete each test phase
4. Update status and add comments as you progress
5. Save results when testing is complete
6. Export JSON file for records

## Test Plan Structure

### Phase 1: Admin Login Testing
Test initial admin access for each subscription tier.

### Phase 2: User Creation Testing  
Test admin ability to create searcher users within their tier.

### Phase 3: Feature Access Testing
Validate role-based and tier-based feature restrictions.

### Phase 4: Cross-Tier Isolation Testing
Verify users cannot access other tiers' data or features.

---

## PHASE 1: ADMIN LOGIN TESTING

### Test 1.1: Standard Tier Admin Login
**Objective**: Verify Standard tier admin can login and access appropriate features

**Steps**:
1. Navigate to http://localhost:3000/user-management.html
2. Click "Login" button
3. Enter credentials:
   - Email: `adm-std@a.com`
   - Password: `123`
4. Click "Login"

**Expected Results**:
- ✅ Login successful
- ✅ Admin panel visible
- ✅ "Add User" button available
- ✅ User list shows only Standard tier users
- ✅ Subscription tier displays "Standard (1)"

### Test 1.2: Premium Tier Admin Login
**Objective**: Verify Premium tier admin can login and access enhanced features

**Steps**:
1. Logout from current session
2. Login with credentials:
   - Email: `adm-prem@a.com` 
   - Password: `123`

**Expected Results**:
- ✅ Login successful
- ✅ Admin panel visible with enhanced options
- ✅ User list shows only Premium tier users
- ✅ Subscription tier displays "Premium (2)"

### Test 1.3: Professional Tier Admin Login
**Objective**: Verify Professional tier admin has full system access

**Steps**:
1. Logout from current session
2. Login with credentials:
   - Email: `adm-prof@a.com`
   - Password: `123`

**Expected Results**:
- ✅ Login successful
- ✅ Admin panel with full feature set
- ✅ User list shows only Professional tier users
- ✅ Subscription tier displays "Professional (3)"

---

## PHASE 2: USER CREATION TESTING

### Test 2.1: Create Standard Tier Searcher
**Objective**: Verify Standard admin can create searcher users

**Prerequisites**: Logged in as adm-std@a.com

**Steps**:
1. Click "Add User" button
2. Fill user form:
   - Email: `search-std@test.com`
   - Password: `test123`
   - Role: Select "searcher"
3. Click "Add User"

**Expected Results**:
- ✅ User created successfully
- ✅ New user appears in user list
- ✅ User has "searcher" role
- ✅ User assigned to Standard tier (1)

### Test 2.2: Create Premium Tier Searcher
**Objective**: Verify Premium admin can create searcher users

**Prerequisites**: Logged in as adm-prem@a.com

**Steps**:
1. Click "Add User" button
2. Fill user form:
   - Email: `search-prem@test.com`
   - Password: `test123`
   - Role: Select "searcher"
3. Click "Add User"

**Expected Results**:
- ✅ User created successfully
- ✅ New user appears in user list
- ✅ User has "searcher" role
- ✅ User assigned to Premium tier (2)

### Test 2.3: Create Professional Tier Searcher
**Objective**: Verify Professional admin can create searcher users

**Prerequisites**: Logged in as adm-prof@a.com

**Steps**:
1. Click "Add User" button
2. Fill user form:
   - Email: `search-prof@test.com`
   - Password: `test123`
   - Role: Select "searcher"
3. Click "Add User"

**Expected Results**:
- ✅ User created successfully
- ✅ New user appears in user list
- ✅ User has "searcher" role
- ✅ User assigned to Professional tier (3)

---

## PHASE 3: FEATURE ACCESS TESTING

### Test 3.1: Standard Tier Feature Access
**Objective**: Verify Standard tier users have appropriate feature restrictions

#### Test 3.1a: Standard Admin Features
**Prerequisites**: Logged in as adm-std@a.com

**Steps**:
1. Navigate to main application (http://localhost:3000)
2. Check available menu items and features

**Expected Results**:
- ✅ Search functionality available
- ✅ Multi-mode search available
- ✅ Manage collections available
- ✅ Options/Dark mode available
- ✅ User management available (admin only)
- ❌ Model management restricted
- ❌ Config file editing restricted
- ❌ Doc index card modification restricted
- ❌ Score model parameter changes restricted

#### Test 3.1b: Standard Searcher Features
**Prerequisites**: Logged in as search-std@test.com

**Steps**:
1. Navigate to main application
2. Check available menu items and features

**Expected Results**:
- ✅ Search functionality available
- ✅ Multi-mode search available
- ✅ Manage collections available
- ✅ Options/Dark mode available
- ❌ User management not available
- ❌ Model management restricted
- ❌ Config file editing restricted

### Test 3.2: Premium Tier Feature Access
**Objective**: Verify Premium tier users have enhanced feature access

#### Test 3.2a: Premium Admin Features
**Prerequisites**: Logged in as adm-prem@a.com

**Steps**:
1. Navigate to main application
2. Test enhanced features

**Expected Results**:
- ✅ All Standard features available
- ✅ Model management available
- ✅ Config file editing available
- ✅ Doc index card modification available
- ❌ Some Professional-only features restricted

#### Test 3.2b: Premium Searcher Features
**Prerequisites**: Logged in as search-prem@test.com

**Steps**:
1. Navigate to main application
2. Check available features

**Expected Results**:
- ✅ All Standard searcher features
- ✅ Enhanced search capabilities
- ❌ Admin-only features not available

### Test 3.3: Professional Tier Feature Access
**Objective**: Verify Professional tier users have full system access

#### Test 3.3a: Professional Admin Features
**Prerequisites**: Logged in as adm-prof@a.com

**Steps**:
1. Navigate to main application
2. Test all available features

**Expected Results**:
- ✅ All menu items available
- ✅ Full model management
- ✅ Complete config access
- ✅ All search types and parameters
- ✅ Full administrative capabilities

#### Test 3.3b: Professional Searcher Features
**Prerequisites**: Logged in as search-prof@test.com

**Steps**:
1. Navigate to main application
2. Test searcher capabilities

**Expected Results**:
- ✅ Enhanced search features
- ✅ Advanced parameter access
- ❌ Admin-only features still restricted

---

## PHASE 4: CROSS-TIER ISOLATION TESTING

### Test 4.1: User List Isolation
**Objective**: Verify admins only see users from their own tier

**Steps**:
1. Login as adm-std@a.com
2. Note users visible in user management
3. Logout and login as adm-prem@a.com
4. Note users visible in user management
5. Logout and login as adm-prof@a.com
6. Note users visible in user management

**Expected Results**:
- ✅ Standard admin sees only Standard tier users
- ✅ Premium admin sees only Premium tier users
- ✅ Professional admin sees only Professional tier users
- ✅ No cross-tier user visibility

### Test 4.2: Authentication Isolation
**Objective**: Verify users cannot access other tiers' accounts

**Steps**:
1. Attempt to login as search-std@test.com from Premium tier context
2. Attempt to login as search-prem@test.com from Standard tier context

**Expected Results**:
- ❌ Cross-tier login attempts fail
- ✅ Users can only access their assigned tier

### Test 4.3: Session Management
**Objective**: Verify proper session handling and timeouts

**Steps**:
1. Login as any admin user
2. Wait for session timeout (30 seconds default)
3. Attempt to perform admin action

**Expected Results**:
- ✅ Session expires after configured timeout
- ✅ User redirected to login page
- ✅ No unauthorized access after timeout

---

## PHASE 5: ERROR HANDLING TESTING

### Test 5.1: Invalid Login Attempts
**Steps**:
1. Attempt login with invalid email
2. Attempt login with wrong password
3. Attempt login with empty fields

**Expected Results**:
- ✅ Appropriate error messages displayed
- ✅ No system crashes or exposures
- ✅ Security logging functions properly

### Test 5.2: Unauthorized Access Attempts
**Steps**:
1. Login as searcher user
2. Attempt to access admin-only URLs directly
3. Attempt to perform admin actions via API

**Expected Results**:
- ✅ Access denied appropriately
- ✅ User redirected or shown error
- ✅ No privilege escalation possible

---

## TEST EXECUTION CHECKLIST

### Pre-Test Setup
- [ ] System running on localhost:3000
- [ ] User management accessible
- [ ] Default admin accounts verified
- [ ] Test user accounts cleared

### Test Execution
- [ ] Phase 1: Admin Login Testing completed
- [ ] Phase 2: User Creation Testing completed
- [ ] Phase 3: Feature Access Testing completed
- [ ] Phase 4: Cross-Tier Isolation Testing completed
- [ ] Phase 5: Error Handling Testing completed

### Post-Test Validation
- [ ] All test users created successfully
- [ ] Feature restrictions working properly
- [ ] Tier isolation functioning correctly
- [ ] Security measures validated
- [ ] No unauthorized access possible

## Test Results Summary

### Manual Tracking (Update as you test)
| Test Phase | Standard Tier | Premium Tier | Professional Tier | Status |
|------------|---------------|--------------|-------------------|---------|
| Admin Login | ⏳ Pending | ⏳ Pending | ⏳ Pending | Not Started |
| User Creation | ⏳ Pending | ⏳ Pending | ⏳ Pending | Not Started |
| Feature Access | ⏳ Pending | ⏳ Pending | ⏳ Pending | Not Started |
| Tier Isolation | ⏳ Pending | ⏳ Pending | ⏳ Pending | Not Started |
| Error Handling | ⏳ Pending | ⏳ Pending | ⏳ Pending | Not Started |

**Legend**: ✅ Pass | ❌ Fail | ⏳ Pending | 🔄 In Progress

### Automated Tracking
**Use the Test Results Tracker** for:
- Automatic Mac serial detection
- Timestamped test sessions
- Structured JSON output
- Exportable test records
- Server-side result storage

---

## Notes
- **Use Test Results Tracker**: Access at `http://localhost:3000/test-results/test-results-tracker.html`
- **Save Progress**: Update tracker status and comments after each phase
- **Export Results**: Download JSON file when testing complete
- **Document Issues**: Use comments field for detailed observations
- **Verify Security**: Ensure all authentication and authorization working properly
- **Clean Up**: Remove test users after completion (optional)

## Test Results File Structure
Your completed test will generate a JSON file like:
```
user-auth-test-results.json
├── testSession (tester info, Mac serial, timestamp)
├── testResults (5 phases with status and comments)
└── overallStatus (calculated from phase results)
```