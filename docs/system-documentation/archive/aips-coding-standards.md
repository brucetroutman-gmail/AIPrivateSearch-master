# AIPrivateSearch Coding Standards

## Security-First Development Standards

### 1. Input Sanitization (CWE-79, CWE-89)

**NEVER use:**
```javascript
// ❌ BANNED - Direct DOM injection
element.innerHTML = userInput;
document.write(userInput);

// ❌ BANNED - Direct SQL queries  
const query = `SELECT * FROM users WHERE name = '${userInput}'`;
```

**ALWAYS use:**
```javascript
// ✅ REQUIRED - Safe DOM manipulation
element.textContent = userInput;
element.setAttribute('data-value', userInput);

// ✅ REQUIRED - Parameterized queries
const query = 'SELECT * FROM users WHERE name = ?';
db.query(query, [userInput]);
```

### 2. Function Dependencies (CWE-476)

**NEVER use:**
```javascript
// ❌ BANNED - Direct function calls without checks
loadScoreModels('scoreModel');
exportToDatabase(data);
```

**ALWAYS use:**
```javascript
// ✅ REQUIRED - Proper imports and error handling
import { loadScoreModels } from './common.js';
import { exportToDatabase } from './common.js';

try {
  await loadScoreModels('scoreModel');
} catch (error) {
  logger.error('Failed to load models:', error);
}
```

### 3. Path Traversal Prevention (CWE-22)

**NEVER use:**
```javascript
// ❌ BANNED - Direct path concatenation
const filePath = basePath + '/' + userInput;
fs.readFile(userInput);
```

**ALWAYS use:**
```javascript
// ✅ REQUIRED - Path validation and sanitization
import path from 'path';

function validatePath(userPath, allowedBase) {
  const resolved = path.resolve(allowedBase, userPath);
  if (!resolved.startsWith(path.resolve(allowedBase))) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}
```

### 4. CSRF Protection (CWE-352)

**NEVER use:**
```javascript
// ❌ BANNED - Unprotected API calls
fetch('/api/delete', { method: 'POST' });
```

**ALWAYS use:**
```javascript
// ✅ REQUIRED - CSRF token validation
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
fetch('/api/delete', {
  method: 'POST',
  headers: { 'X-CSRF-Token': csrfToken }
});
```

### 5. Error Handling (CWE-209)

**NEVER use:**
```javascript
// ❌ BANNED - Exposing internal errors
catch (error) {
  res.status(500).json({ error: error.stack });
}
```

**ALWAYS use:**
```javascript
// ✅ REQUIRED - Safe error responses
catch (error) {
  logger.error('Internal error:', error);
  res.status(500).json({ error: 'Internal server error' });
}
```

## Architecture Standards

### 1. Module Structure
```
src/
├── components/     # Reusable UI components
├── services/       # API and business logic
├── utils/          # Pure utility functions
├── security/       # Security-specific modules
└── types/          # Type definitions
```

### 2. Import/Export Patterns
```javascript
// ✅ REQUIRED - Explicit imports
import { specificFunction } from './module.js';

// ❌ BANNED - Wildcard imports
import * from './module.js';
```

### 3. Configuration Management
```javascript
// ✅ REQUIRED - Environment-based config
const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  timeout: parseInt(process.env.TIMEOUT) || 5000
};

// ❌ BANNED - Hardcoded values
const apiUrl = 'http://localhost:3001';
```

## ESLint Rules Enforcement

### Required Rules
```javascript
{
  "no-eval": "error",
  "no-implied-eval": "error", 
  "no-new-func": "error",
  "no-script-url": "error",
  "no-unsafe-innerhtml/no-unsafe-innerhtml": "error"
}
```

## Code Review Checklist

### Before Committing:
- [ ] No `innerHTML` or `document.write` usage
- [ ] All user inputs sanitized
- [ ] Functions properly imported
- [ ] Error handling implemented
- [ ] CSRF protection added
- [ ] Path validation implemented
- [ ] ESLint passes with no errors

### Security Validation:
- [ ] Run `npm run security-scan`
- [ ] Check for hardcoded secrets
- [ ] Validate all API endpoints
- [ ] Test with malicious inputs

## Enforcement Tools

### 1. Pre-commit Hooks
```bash
#!/bin/sh
# .git/hooks/pre-commit
npm run lint
npm run security-scan
```

### 2. Security Scanner
```bash
# Add to package.json scripts
"security-scan": "eslint . --ext .js,.mjs --rule 'no-eval: error'"
```

## Migration Strategy

### Phase 1: Stop the Bleeding
1. Add ESLint security rules
2. Fix critical vulnerabilities
3. Implement input sanitization

### Phase 2: Systematic Fixes  
1. Refactor DOM manipulation
2. Implement proper imports
3. Add CSRF protection

### Phase 3: Prevention
1. Add pre-commit hooks
2. Automated security scanning
3. Regular code reviews

## Violation Consequences

### Severity Levels:
- **Critical**: Blocks deployment
- **High**: Requires immediate fix
- **Medium**: Fix within 1 week
- **Low**: Fix in next sprint

### Enforcement:
- ESLint errors block commits
- Security scan failures block deployment
- Code review required for all changes