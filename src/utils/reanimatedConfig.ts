// Configure Reanimated logger to reduce warnings in development
// This will be configured once Reanimated is properly imported elsewhere
if (__DEV__) {
  // Suppress reanimated warnings in development
  console.warn = ((originalWarn) => {
    return (...args: any[]) => {
      if (
        typeof args[0] === 'string' && 
        args[0].includes('[Reanimated]') &&
        args[0].includes('Reading from `value` during component render')
      ) {
        return; // Suppress this specific warning
      }
      originalWarn.apply(console, args);
    };
  })(console.warn);
}