import path from 'path';

// Safe path validation to prevent path traversal
export function validatePath(userPath, allowedDir) {
  if (!userPath || typeof userPath !== 'string') {
    throw new Error('Invalid path input');
  }
  
  // Remove null bytes and other dangerous characters
  let cleanPath = userPath.replace(/\0/g, '');
  for (let i = 1; i <= 31; i++) {
    cleanPath = cleanPath.replace(new RegExp(String.fromCharCode(i), 'g'), '');
  }
  for (let i = 127; i <= 159; i++) {
    cleanPath = cleanPath.replace(new RegExp(String.fromCharCode(i), 'g'), '');
  }
  const normalizedPath = path.normalize(cleanPath);
  
  // Prevent path traversal attempts
  if (normalizedPath.includes('..') || 
      normalizedPath.startsWith('/') || 
      normalizedPath.includes('\\..\\') ||
      normalizedPath.match(/^[a-zA-Z]:\\/)) {
    throw new Error('Path traversal attempt detected');
  }
  
  // Build safe path within allowed directory
  const safePath = path.join(allowedDir, normalizedPath);
  const resolvedPath = path.resolve(safePath);
  const resolvedAllowedDir = path.resolve(allowedDir);
  
  // Ensure resolved path is within allowed directory
  if (!resolvedPath.startsWith(resolvedAllowedDir + path.sep) && 
      resolvedPath !== resolvedAllowedDir) {
    throw new Error('Path outside allowed directory');
  }
  
  return resolvedPath;
}

export function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename input');
  }
  
  // Remove dangerous characters
  let cleanFilename = filename.replace(/\0/g, '');
  for (let i = 1; i <= 31; i++) {
    cleanFilename = cleanFilename.replace(new RegExp(String.fromCharCode(i), 'g'), '');
  }
  for (let i = 127; i <= 159; i++) {
    cleanFilename = cleanFilename.replace(new RegExp(String.fromCharCode(i), 'g'), '');
  }
  
  // Allow alphanumeric, dots, hyphens, underscores, spaces
  if (!/^[a-zA-Z0-9._\s-]+$/.test(cleanFilename) || 
      cleanFilename.includes('..') ||
      cleanFilename.startsWith('.')) {
    throw new Error('Invalid filename');
  }
  
  return cleanFilename;
}