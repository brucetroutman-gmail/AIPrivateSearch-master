// Safe logging utility to prevent log injection
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input.replace(/[\r\n\t\x00-\x1f\x7f-\x9f]/g, '_').substring(0, 500);
  }
  if (typeof input === 'object' && input !== null) {
    return JSON.stringify(input).substring(0, 500);
  }
  return String(input).substring(0, 500);
}

export function safeLog(message, ...args) {
  const sanitized = args.map(sanitizeInput);
  console.log(message, ...sanitized);
}

export function safeError(message, ...args) {
  const sanitized = args.map(sanitizeInput);
  console.error(message, ...sanitized);
}