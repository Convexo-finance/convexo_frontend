/**
 * Dev-only logger — only logs in development environment.
 * Completely silent in production builds.
 */
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  info: (...args: unknown[]) => {
    if (isDev) console.log('[Convexo]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[Convexo]', ...args);
  },
  error: (...args: unknown[]) => {
    // Always log errors — but prefix them for easy filtering
    console.error('[Convexo]', ...args);
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[Convexo]', ...args);
  },
};
