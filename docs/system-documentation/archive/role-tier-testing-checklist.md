# AIPrivateSearch Role-Tier Testing Checklist

## Testing Overview
This checklist ensures all role-tier combinations display correct menu items and enforce proper access restrictions. Test each user type by logging in and verifying the specified elements are visible/hidden.

---

## 1. Standard Administrator (Tier 1, Admin Role)
**Price**: $49/yr after 4 months free | **Computers**: 1

### ✅ Menu Items That SHOULD Be Visible:
- [x] User icon (login-icon)
- [x] Search
- [x] Multi-Mode Search
- [x] Manage Collections
- [x] User Management
- [x] Options/Settings

### ❌ Menu Items That SHOULD Be Hidden:
- [x] Test (menu-test)
- [x] Analyze (menu-analyze)
- [x] Manage Models (menu-manage-models)
- [x] Modify Config (menu-modify-config)

### 🔒 Feature Restrictions to Verify:
- [x] Cannot modify model parameters
- [x] Cannot edit doc index cards
- [x] Cannot modify config files
- [x] CAN add users (admin privilege)

- [ ] CAN remove collections ?


---

## 2. Standard Searcher (Tier 1, Searcher Role)
**Price**: $49/yr after 4 months free | **Computers**: 1

### ✅ Menu Items That SHOULD Be Visible:
- [x] User icon (login-icon)
- [x] Search
- [x] Multi-Mode Search
- [x] Manage Collections
- [x] Options/Settings

### ❌ Menu Items That SHOULD Be Hidden:
- [x] User Management (menu-user-management)
- [x] Test (menu-test)
- [x] Analyze (menu-analyze)
- [x] Manage Models (menu-manage-models)
- [x] Modify Config (menu-modify-config)

### 🔒 Feature Restrictions to Verify:
- [x] Cannot modify model parameters
- [x] Cannot edit doc index cards
- [x] Cannot modify config files
- [x] Cannot access user management
- [x] Cannot remove collections

---

## 3. Premium Administrator (Tier 2, Admin Role)
**Price**: $199/yr | **Computers**: 5

### ✅ Menu Items That SHOULD Be Visible:
- [x] User icon (login-icon)
- [x] Search
- [x] Multi-Mode Search
- [x] Manage Collections
- [x] Manage Models
- [x] Modify Config
- [x] User Management
- [x] Options/Settings

### ❌ Menu Items That SHOULD Be Hidden:
- [x] Test
- [x] Analyze

### 🔒 Feature Access to Verify:
- [x] CAN modify model parameters
- [x] CAN edit doc index cards
- [x] CAN remove collections
- [x] CAN modify config files
- [x] CAN manage models
- [x] CAN add users (admin privilege)

---

## 4. Premium Searcher (Tier 2, Searcher Role)
**Price**: $199/yr | **Computers**: 5

### ✅ Menu Items That SHOULD Be Visible:
- [x] User icon (login-icon)
- [x] Search
- [x] Multi-Mode Search
- [x] Manage dropdown (menu-manage)
- [x] Manage Collections
- [x] Options/Settings

### ❌ Menu Items That SHOULD Be Hidden:
- [x] User Management (menu-user-management)
- [x] Manage Models (menu-manage-models)
- [x] Test (menu-test)
- [x] Analyze (menu-analyze)
- [x] Modify Config

### 🔒 Feature Restrictions to Verify:
- [x] Cannot access user management
- [x] Cannot manage models
- [x] CAN edit doc index cards
- [x] Cannot modify config files
- [x] Cannot remove collections


---

## 5. Professional Administrator (Tier 3, Admin Role)
**Price**: $2999 license | **Computers**: Unlimited

### ✅ Menu Items That SHOULD Be Visible:
- [x] User icon (login-icon)
- [x] Search
- [x] Multi-Mode Search
- [x] Manage dropdown (menu-manage)
- [x] Manage Collections
- [x] Manage Models
- [x] Modify Config
- [x] User Management
- [x] Test
- [x] Analyze
- [x] Options/Settings

### ❌ Menu Items That SHOULD Be Hidden:
- [x] None (full access)

### 🔒 Feature Access to Verify:
- [x] Full access to all features
- [x] CAN modify model parameters
- [x] CAN edit doc index cards
- [x] CAN modify config files
- [x] CAN manage models
- [x] CAN add users (admin privilege)

---

## 6. Professional Searcher (Tier 3, Searcher Role)
**Price**: $2999 license | **Computers**: Unlimited

### ✅ Menu Items That SHOULD Be Visible:
- [x] User icon (login-icon)
- [x] Search
- [x] Multi-Mode Search
- [x] Manage Collections
- [x] Manage Models
- [x] Test
- [x] Analyze
- [x] Options/Settings

### ❌ Menu Items That SHOULD Be Hidden:
- [x] User Management (menu-user-management)
- [x] Modify Config

### 🔒 Feature Restrictions to Verify:
- [x] Cannot access user management
- [x] CAN edit doc index cards
- [x] CAN manage models
- [x] Cannot remove collections

---

## Common Elements to Test for ALL Roles

### Universal Menu Items (Should Always Be Visible):
- [x] User icon appears after login
- [x] Search menu item
- [x] Multi-Mode Search menu item
- [x] Options/Settings menu item

### Authentication Flow:
- [x] Login page loads correctly
- [x] Authentication redirects work properly
- [x] Session persistence across page refreshes
- [x] Logout functionality works

### Page Access:
- [x] Home/Index page loads
- [x] Search page accessible
- [x] Multi-mode search page accessible
- [x] Collections page accessible (if in menuAccess)
- [x] Restricted pages properly blocked

---

## Testing Notes

### CSS Classes Reference:
- `.login-icon` - User icon in header
- `.menu-search` - Search menu item
- `.menu-multi-mode` - Multi-Mode Search menu item
- `.menu-manage` - Manage dropdown
- `.menu-manage-collections` - Manage Collections
- `.menu-manage-models` - Manage Models
- `.menu-modify-config` - Modify Config
- `.menu-user-management` - User Management
- `.menu-test` - Test menu item
- `.menu-analyze` - Analyze menu item
- `.admin-only` - Admin-only content
- `.searcher-only` - Searcher-only content
- `.prem-only` - Premium tier (2) and above content
- `.pro-only` - Professional tier (3) only content

### Test Environment Setup:
1. Use user-management.html to create test users for each role-tier
2. Test in both light and dark modes
3. Verify on different browser sizes
4. Check console for JavaScript errors
5. Validate proper tier-access.json loading

### Common Issues to Watch For:
- Missing user icon after login
- Incorrect menu visibility
- Access to restricted pages
- Feature restrictions not enforced
- CSS class conflicts
- JavaScript errors in console