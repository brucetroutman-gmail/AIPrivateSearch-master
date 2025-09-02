# Logging Utility

This centralized logging utility prevents log injection attacks by sanitizing all logged content.

## Usage

### Node.js (CommonJS)
```javascript
const { logger } = require('./shared/utils/logger.js');

logger.log('Safe message');
logger.error('Error message', errorObject);
logger.warn('Warning message');
```

### ES Modules
```javascript
import { logger } from './shared/utils/logger.js';

logger.log('Safe message');
logger.error('Error message', errorObject);
```

### Browser
```javascript
// Include the logger script first
<script src="shared/utils/logger.js"></script>

// Then use globally available logger
logger.log('Safe message');
```

## Security Features

- Removes control characters that could break log format
- Sanitizes newlines, tabs, and other injection vectors
- Handles all data types safely
- Maintains original console.* API compatibility

## Methods

- `logger.log()` - Standard logging
- `logger.error()` - Error logging  
- `logger.warn()` - Warning logging
- `logger.info()` - Info logging
- `logger.debug()` - Debug logging