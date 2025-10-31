# User Authentication Testing Guide

## Overview
Step-by-step guide for testing AIPrivateSearch user authentication system across all subscription tiers and user roles.

## Prerequisites
- AIPrivateSearch running (`load-aiss.command` executed)
- System accessible at `http://localhost:3000`
- Test Results Tracker available at `http://localhost:3000/test-results/test-results-tracker.html`

## Setup: Start Test Results Tracker

### Step 1: Open Test Tracker
1. Navigate to `http://localhost:3000/test-results/test-results-tracker.html`
2. Enter your email in "Tester Email" field
3. Verify "Test Title" shows "user-auth-test" (or customize)
4. Confirm Mac Serial Number is detected
5. Keep this tab open throughout testing

---

## PHASE 1: ADMIN LOGIN TESTING

### Test 1.1: Standard Tier Admin Login

**Objective**: Verify Standard tier admin authentication

**Steps**:
1. Open new tab: `http://localhost:3000/user-management.html`
2. Click "Login" button
3. Enter credentials:
   - Email: `adm-std@a.com`
   - Password: `123`
4. Click "Login"

**Expected Results**:
- ✅ Login successful message
- ✅ Admin panel appears
- ✅ "Add User" button visible
- ✅ Subscription tier shows "Standard (1)"

**Update Tracker**: Set Phase 1 status and add comments

### Test 1.2: Premium Tier Admin Login

**Steps**:
1. Click "Logout" button
2. Click "Login" button
3. Enter credentials:
   - Email: `adm-prem@a.com`
   - Password: `123`
4. Click "Login"

**Expected Results**:
- ✅ Login successful
- ✅ Admin panel visible
- ✅ Subscription tier shows "Premium (2)"

### Test 1.3: Professional Tier Admin Login

**Steps**:
1. Click "Logout" button
2. Click "Login" button
3. Enter credentials:
   - Email: `adm-prof@a.com`
   - Password: `123`
4. Click "Login"

**Expected Results**:
- ✅ Login successful
- ✅ Admin panel visible
- ✅ Subscription tier shows "Professional (3)"

**Complete Phase 1**: Update tracker with overall Phase 1 results

---

## PHASE 2: USER CREATION TESTING

### Test 2.1: Create Standard Tier Searcher

**Prerequisites**: Logged in as `adm-std@a.com`

**Steps**:
1. Click "Add User" button
2. Fill form:
   - Email: `test-std-searcher@test.com`
   - Password: `test123`
   - Role: Select "searcher"
3. Click "Add User"

**Expected Results**:
- ✅ Success message displayed
- ✅ New user appears in user list
- ✅ User shows "searcher" role
- ✅ User assigned Standard tier

### Test 2.2: Create Premium Tier Searcher

**Steps**:
1. Logout and login as `adm-prem@a.com` / `123`
2. Click "Add User" button
3. Fill form:
   - Email: `test-prem-searcher@test.com`
   - Password: `test123`
   - Role: Select "searcher"
4. Click "Add User"

**Expected Results**:
- ✅ User created successfully
- ✅ User assigned Premium tier

### Test 2.3: Create Professional Tier Searcher

**Steps**:
1. Logout and login as `adm-prof@a.com` / `123`
2. Click "Add User" button
3. Fill form:
   - Email: `test-prof-searcher@test.com`
   - Password: `test123`
   - Role: Select "searcher"
4. Click "Add User"

**Expected Results**:
- ✅ User created successfully
- ✅ User assigned Professional tier

**Complete Phase 2**: Update tracker with Phase 2 results

---

## PHASE 3: FEATURE ACCESS TESTING

### Test 3.1: Standard Searcher Access

**Steps**:
1. Logout from admin account
2. Login as `test-std-searcher@test.com` / `test123`
3. Click "Go to Application" button
4. Navigate to main application pages

**Expected Results**:
- ✅ Search page accessible
- ✅ Multi-mode search available
- ✅ Collections page accessible
- ❌ User management NOT accessible
- ❌ Model management restricted

### Test 3.2: Premium Searcher Access

**Steps**:
1. Return to user management tab
2. Logout and login as `test-prem-searcher@test.com` / `test123`
3. Click "Go to Application"
4. Test available features

**Expected Results**:
- ✅ All Standard features available
- ✅ Enhanced search capabilities
- ❌ Admin features still restricted

### Test 3.3: Professional Searcher Access

**Steps**:
1. Return to user management tab
2. Logout and login as `test-prof-searcher@test.com` / `test123`
3. Click "Go to Application"
4. Test available features

**Expected Results**:
- ✅ Enhanced search features
- ✅ Advanced parameter access
- ❌ Admin-only features still restricted

**Complete Phase 3**: Update tracker with Phase 3 results

---

## PHASE 4: CROSS-TIER ISOLATION TESTING

### Test 4.1: Verify User List Isolation

**Steps**:
1. Login as `adm-std@a.com` / `123`
2. Note users visible in admin panel
3. Logout and login as `adm-prem@a.com` / `123`
4. Note users visible in admin panel
5. Logout and login as `adm-prof@a.com` / `123`
6. Note users visible in admin panel

**Expected Results**:
- ✅ Standard admin sees only Standard users
- ✅ Premium admin sees only Premium users
- ✅ Professional admin sees only Professional users
- ✅ No cross-tier user visibility

### Test 4.2: Test Cross-Tier Login Prevention

**Steps**:
1. Attempt to login as `test-std-searcher@test.com` while system expects Premium tier
2. Attempt to login as `test-prem-searcher@test.com` while system expects Standard tier

**Expected Results**:
- ✅ Users can only access their assigned tier
- ✅ Cross-tier access properly blocked

**Complete Phase 4**: Update tracker with Phase 4 results

---

## PHASE 5: ERROR HANDLING TESTING

### Test 5.1: Invalid Login Attempts

**Steps**:
1. Attempt login with invalid email: `invalid@test.com`
2. Attempt login with wrong password for valid user
3. Attempt login with empty email field
4. Attempt login with empty password field

**Expected Results**:
- ✅ Appropriate error messages displayed
- ✅ No system crashes
- ✅ Security maintained

### Test 5.2: Session Timeout Testing

**Steps**:
1. Login as any user
2. Wait for session timeout (30 seconds by default)
3. Attempt to perform authenticated action

**Expected Results**:
- ✅ Session expires after timeout
- ✅ User redirected to login
- ✅ No unauthorized access possible

### Test 5.3: Unauthorized Access Attempts

**Steps**:
1. Login as searcher user
2. Try to access admin URLs directly:
   - Navigate to user management while logged in as searcher
   - Attempt admin actions

**Expected Results**:
- ✅ Access properly denied
- ✅ Appropriate error handling
- ✅ No privilege escalation

**Complete Phase 5**: Update tracker with Phase 5 results

---

## FINALIZE TEST RESULTS

### Step 1: Complete Test Tracker
1. Return to Test Results Tracker tab
2. Add overall test comments
3. Verify all phases have status and comments
4. Click "Save Test Results"

### Step 2: Export Results
1. Click "Export Results" button
2. Save `user-auth-test-results.json` file
3. Verify file contains all test data

### Step 3: Cleanup (Optional)
1. Login as tier admins
2. Delete test users created during testing:
   - `test-std-searcher@test.com`
   - `test-prem-searcher@test.com`
   - `test-prof-searcher@test.com`

---

## Quick Reference

### Default Admin Accounts
| Tier | Email | Password |
|------|-------|----------|
| Standard | adm-std@a.com | 123 |
| Premium | adm-prem@a.com | 123 |
| Professional | adm-prof@a.com | 123 |

### Test URLs
- **User Management**: `http://localhost:3000/user-management.html`
- **Test Tracker**: `http://localhost:3000/test-results/test-results-tracker.html`
- **Main Application**: `http://localhost:3000`

### Expected Test Duration
- **Phase 1**: 5 minutes
- **Phase 2**: 10 minutes
- **Phase 3**: 15 minutes
- **Phase 4**: 10 minutes
- **Phase 5**: 10 minutes
- **Total**: ~50 minutes

### Success Criteria
- All 5 phases show "Pass" status
- No security vulnerabilities discovered
- All tier isolation working properly
- Authentication flows functioning correctly
- Test results properly saved and exported

---

**Version**: 19.36 | **Test Type**: User Authentication System | **Estimated Time**: 50 minutes