import path from 'path';

// Safe path validation to prevent path traversal
export function validatePath(userPath, allowedDir) {
  // Remove null bytes and normalize
  const cleanPath = userPath.replace(/\0/g, '');
  const normalizedPath = path.normalize(cleanPath);
  
  // Prevent path traversal attempts
  if (normalizedPath.includes('..') || normalizedPath.startsWith('/')) {
    throw new Error('Invalid path');
  }
  
  // Build safe path within allowed directory
  const safePath = path.join(allowedDir, normalizedPath);
  const resolvedPath = path.resolve(safePath);
  const resolvedAllowedDir = path.resolve(allowedDir);
  
  // Ensure resolved path is within allowed directory
  if (!resolvedPath.startsWith(resolvedAllowedDir)) {
    throw new Error('Path outside allowed directory');
  }
  
  return resolvedPath;
}

export function validateFilename(filename) {
  // Allow only alphanumeric, dots, hyphens, underscores
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }
  return filename;
}