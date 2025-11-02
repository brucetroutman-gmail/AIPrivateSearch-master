# Menu Availability Matrix by Role and Tier

## Current Menu Structure Analysis

Based on the header.html and common.js implementation, here's the complete menu availability matrix:

## Menu Items by Role and Subscription Tier

| Menu Item | Standard Admin | Standard Searcher | Premium Admin | Premium Searcher | Professional Admin | Professional Searcher |
|-----------|----------------|-------------------|---------------|------------------|-------------------|----------------------|
| **Search** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Multi-Mode Search** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Test** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Analyze** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Collections** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Models** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **User Management** | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Toggle Dark Mode** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Role Switching** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Logout (Test)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Modify Config Files** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **TestCode Checker** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |

## Current Implementation Logic

### Tier-Based Restrictions (`.adv-only` class)
- **Standard Tier**: Hides advanced features (Test, Analyze, User Management, Config Files, TestCode Checker)
- **Premium/Professional Tiers**: Shows all advanced features

### Role-Based Restrictions
- **Admin Role**: Access to User Management (when tier allows)
- **Searcher Role**: No access to User Management

### CSS Classes Used
- `.adv-only`: Hidden for Standard tier users
- No specific role-based CSS classes implemented

## Issues Identified

### 1. **User Management Access Logic**
- Currently uses `.adv-only` class only
- Should also check user role (admin vs searcher)
- Premium/Professional searchers currently see User Management menu item

### 2. **Missing Role-Based Restrictions**
- No `.admin-only` class for admin-specific features
- User Management should be admin-only regardless of tier

### 3. **Inconsistent Tier Logic**
- Standard tier should have some admin capabilities
- Current implementation may be too restrictive for Standard admins

## Recommended Menu Matrix

| Menu Item | Standard Admin | Standard Searcher | Premium Admin | Premium Searcher | Professional Admin | Professional Searcher |
|-----------|----------------|-------------------|---------------|------------------|-------------------|----------------------|
| **Search** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Multi-Mode Search** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Test** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Analyze** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Collections** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Models** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **User Management** | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| **Toggle Dark Mode** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Role Switching** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Logout (Test)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Modify Config Files** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **TestCode Checker** | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |

## Required Changes

### 1. Add Role-Based CSS Classes
```css
.admin-only { /* Show only for admin users */ }
.searcher-only { /* Show only for searcher users */ }
```

### 2. Update Header HTML
```html
<a href=\"./user-management.html\" class=\"admin-only\">User Management</a>
<a href=\"./config.html\" class=\"adv-only admin-only\">Modify Config Files</a>
<a href=\"./testcode-checker.html\" class=\"adv-only admin-only\">TestCode Checker</a>
```

### 3. Update JavaScript Logic
```javascript
function applyUserRole(role = null, userRole = null) {\n  if (role === null) role = getUserRole();\n  if (userRole === null) userRole = getUserUserRole(); // Get admin/searcher\n  \n  const showAdvanced = role !== 'standard';\n  const isAdmin = userRole === 'admin';\n  \n  toggleElementsByClass('.adv-only', showAdvanced);\n  toggleElementsByClass('.admin-only', isAdmin);\n  toggleElementsByClass('.searcher-only', !isAdmin);\n}\n```

## Summary

The current implementation has basic tier-based restrictions but lacks proper role-based access control. User Management is accessible to all Premium/Professional users regardless of role, which violates the admin-only principle. The recommended changes would implement proper role-based restrictions while maintaining appropriate tier-based feature gating.

---

**Analysis Date**: October 31, 2024  
**Current Version**: 19.37  
**Status**: Issues Identified - Requires Role-Based Menu Restrictions