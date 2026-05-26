/**
 * Centralized Supabase / PostgREST error handler.
 * - Dev: always log full error to console.
 * - Production: show user-friendly toast via registered notifier.
 * - Never swallows errors: always rethrows after handling.
 */

const isDev = () =>
  typeof process !== 'undefined' &&
  process.env?.NODE_ENV !== 'production';

/** @type {((message: string, severity: 'error' | 'warning' | 'info') => void) | null} */
let globalNotifier = null;

/**
 * Register a function to show user-facing messages (e.g. MUI Snackbar).
 * Call once at app root (e.g. in useEffect) with (message, severity) => { ... }.
 * @param {((message: string, severity: 'error' | 'warning' | 'info') => void) | null} fn
 */
export function setGlobalErrorNotifier(fn) {
  globalNotifier = typeof fn === 'function' ? fn : null;
}

/**
 * Map known Supabase/PostgREST codes to short, user-friendly messages.
 * @param {string} code
 * @param {string} rawMessage
 * @returns {string}
 */
function userMessageFromCode(code, rawMessage) {
  if (!code) return rawMessage || 'Something went wrong. Please try again.';
  const codeStr = String(code).toUpperCase();
  const map = {
    '23502': 'A required value is missing.',
    '23503': 'This record is linked to others and cannot be changed.',
    '23505': 'This value already exists. Please use a different one.',
    '23514': 'The value entered is not allowed.',
    '25006': 'This action is not allowed in the current state.',
    '42501': "You don't have permission to perform this action.",
    '42P01': 'The requested resource was not found.',
    '42883': 'The requested operation is not available.',
    PGRST301: 'Request took too long. Please try again.',
    PGRST116: 'No rows found for this request.',
  };
  for (const [key, msg] of Object.entries(map)) {
    if (codeStr === key || codeStr.endsWith(key)) return msg;
  }
  if (codeStr.startsWith('PGRST')) return 'A server error occurred. Please try again.';
  return rawMessage || 'Something went wrong. Please try again.';
}

/**
 * Normalize any thrown value to an Error and extract code/message.
 * @param {unknown} error
 * @returns {{ err: Error, code?: string, userMessage: string, rawMessage: string }}
 */
export function normalizeError(error) {
  const rawMessage =
    error?.message ?? (typeof error === 'string' ? error : 'Unknown error');
  const code = error?.code ?? null;
  const err =
    error instanceof Error ? error : new Error(String(rawMessage));
  if (code != null) err.code = code;
  const userMessage = userMessageFromCode(code, rawMessage);
  return { err, code, userMessage, rawMessage };
}

/**
 * Handle a Supabase/PostgREST (or any) error: log in dev, show toast in production, then rethrow.
 * Use in catch blocks or after checking result.error. Never swallows the error.
 *
 * @param {unknown} error - Supabase result.error, or any thrown value
 * @param {{ operation?: string, context?: object }} options - Optional context for logs
 * @throws {Error} Always rethrows the normalized error
 * @example
 * const { data, error } = await supabase.from('users').select();
 * if (error) handleSupabaseError(error, { operation: 'fetch users', context: {} });
 */
export function handleSupabaseError(error, options = {}) {
  const { operation = '', context = {} } = options;
  const { err, code, userMessage, rawMessage } = normalizeError(error);

  if (isDev()) {
    console.error(
      `[Supabase Error]${operation ? ` ${operation}:` : ''}`,
      rawMessage,
      { code, ...context }
    );
    if (err.stack) console.error(err.stack);
  }

  if (!isDev() && globalNotifier) {
    try {
      globalNotifier(userMessage, 'error');
    } catch (notifierError) {
      console.error('[supabaseErrorHandler] Notifier failed:', notifierError);
    }
  }

  throw err;
}

/**
 * Wraps an async function: on rejection, runs handleSupabaseError then rethrows.
 * Useful for one-liners in components (e.g. onSubmit).
 *
 * @param {() => Promise<void>} fn
 * @param {{ operation?: string, context?: object }} options
 * @returns {Promise<void>}
 */
export async function withSupabaseErrorHandling(fn, options = {}) {
  try {
    await fn();
  } catch (e) {
    handleSupabaseError(e, options);
  }
}

export default handleSupabaseError;
