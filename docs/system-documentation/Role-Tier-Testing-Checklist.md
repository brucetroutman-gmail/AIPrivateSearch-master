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
- [ ] Cannot edit doc index cards
- [x] Cannot modify config files
- [x] CAN add users (admin privilege)

---

## 2. Standard Searcher (Tier 1, Searcher Role)
**Price**: $49/yr after 4 months free | **Computers**: 1

### ✅ Menu Items That SHOULD Be Visible:
- [ ] User icon (login-icon)
- [ ] Search
- [ ] Multi-Mode Search
- [ ] Manage Collections
- [ ] Options/Settings

### ❌ Menu Items That SHOULD Be Hidden:
- [ ] User Management (menu-user-management)
- [ ] Test (menu-test)
- [ ] Analyze (menu-analyze)
- [ ] Manage Models (menu-manage-models)
- [ ] Modify Config (menu-modify-config)

### 🔒 Feature Restrictions to Verify:
- [ ] Cannot modify model parameters
- [ ] Cannot edit doc index cards
- [ ] Cannot modify config files
- [ ] Cannot access user management

---

## 3. Premium Administrator (Tier 2, Admin Role)
**Price**: $199/yr | **Computers**: 5

### ✅ Menu Items That SHOULD Be Visible:
- [ ] User icon (login-icon)
- [ ] Search
- [ ] Multi-Mode Search
- [ ] Manage Collections
- [ ] Manage Models
- [ ] Modify Config
- [ ] User Management
- [ ] Test
- [ ] Analyze
- [ ] Options/Settings

### ❌ Menu Items That SHOULD Be Hidden:
- [ ] None (full access except searcher-only items)

### 🔒 Feature Access to Verify:
- [ ] CAN modify model parameters
- [ ] CAN edit doc index cards
- [ ] CAN modify config files
- [ ] CAN manage models
- [ ] CAN add users (admin privilege)

---

## 4. Premium Searcher (Tier 2, Searcher Role)
**Price**: $199/yr | **Computers**: 5

### ✅ Menu Items That SHOULD Be Visible:
- [ ] User icon (login-icon)
- [ ] Search
- [ ] Multi-Mode Search
- [ ] Manage dropdown (menu-manage)
- [ ] Manage Collections
- [ ] Modify Config
- [ ] Options/Settings

### ❌ Menu Items That SHOULD Be Hidden:
- [ ] User Management (menu-user-management)
- [ ] Manage Models (menu-manage-models)
- [ ] Test (menu-test)
- [ ] Analyze (menu-analyze)

### 🔒 Feature Restrictions to Verify:
- [ ] Cannot access user management
- [ ] Cannot manage models
- [ ] CAN edit doc index cards
- [ ] CAN modify config files

---

## 5. Professional Administrator (Tier 3, Admin Role)
**Price**: $2999 license | **Computers**: Unlimited

### ✅ Menu Items That SHOULD Be Visible:
- [ ] User icon (login-icon)
- [ ] Search
- [ ] Multi-Mode Search
- [ ] Manage dropdown (menu-manage)
- [ ] Manage Collections
- [ ] Manage Models
- [ ] Modify Config
- [ ] User Management
- [ ] Test
- [ ] Analyze
- [ ] Options/Settings

### ❌ Menu Items That SHOULD Be Hidden:
- [ ] None (full access)

### 🔒 Feature Access to Verify:
- [ ] Full access to all features
- [ ] CAN modify model parameters
- [ ] CAN edit doc index cards
- [ ] CAN modify config files
- [ ] CAN manage models
- [ ] CAN add users (admin privilege)

---

## 6. Professional Searcher (Tier 3, Searcher Role)
**Price**: $2999 license | **Computers**: Unlimited

### ✅ Menu Items That SHOULD Be Visible:
- [ ] User icon (login-icon)
- [ ] Search
- [ ] Multi-Mode Search
- [ ] Manage Collections
- [ ] Manage Models
- [ ] Modify Config
- [ ] Test
- [ ] Analyze
- [ ] Options/Settings

### ❌ Menu Items That SHOULD Be Hidden:
- [ ] User Management (menu-user-management)

### 🔒 Feature Restrictions to Verify:
- [ ] Cannot access user management
- [ ] CAN modify model parameters
- [ ] CAN edit doc index cards
- [ ] CAN modify config files
- [ ] CAN manage models

---

## Common Elements to Test for ALL Roles

### Universal Menu Items (Should Always Be Visible):
- [ ] User icon appears after login
- [ ] Search menu item
- [ ] Multi-Mode Search menu item
- [ ] Options/Settings menu item

### Authentication Flow:
- [ ] Login page loads correctly
- [ ] Authentication redirects work properly
- [ ] Session persistence across page refreshes
- [ ] Logout functionality works

### Page Access:
- [ ] Home/Index page loads
- [ ] Search page accessible
- [ ] Multi-mode search page accessible
- [ ] Collections page accessible (if in menuAccess)
- [ ] Restricted pages properly blocked

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
- `.dev-only` - Developer/Professional content
- `.adv-only` - Advanced/Professional content

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