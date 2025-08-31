// Safe logging utility to prevent log injection
export function safeLog(message, ...args) {
  const sanitized = args.map(arg => {
    if (typeof arg === 'string') {
      return arg.replace(/[\r\n\t]/g, '_').substring(0, 200);
    }
    return arg;
  });
  console.log(message, ...sanitized);
}

export function safeError(message, ...args) {
  const sanitized = args.map(arg => {
    if (typeof arg === 'string') {
      return arg.replace(/[\r\n\t]/g, '_').substring(0, 200);
    }
    return arg;
  });
  console.error(message, ...sanitized);
}