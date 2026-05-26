import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

const isDev = process.env.NODE_ENV === 'development';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim() || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY?.trim() || '';

if (isDev) {
  console.log('SUPABASE URL (REACT_APP):', process.env.REACT_APP_SUPABASE_URL ?? '(undefined)');
  console.log(
    'SUPABASE KEY (REACT_APP):',
    process.env.REACT_APP_SUPABASE_ANON_KEY != null &&
      process.env.REACT_APP_SUPABASE_ANON_KEY !== ''
      ? `${String(process.env.REACT_APP_SUPABASE_ANON_KEY).slice(0, 14)}…`
      : '(undefined)'
  );
  console.log('SUPABASE resolved URL (used):', supabaseUrl || '(undefined — set REACT_APP_* and restart)');
  console.log(
    'SUPABASE resolved key OK:',
    Boolean(supabaseKey),
    supabaseKey ? `(length ${supabaseKey.length})` : ''
  );
}

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase configuration.\n\n' +
      'Create React App (this repo): add to `.env` or `.env.local`:\n' +
      '  REACT_APP_SUPABASE_URL=https://<project-ref>.supabase.co\n' +
      '  REACT_APP_SUPABASE_ANON_KEY=<Supabase publishable or anon key>\n\n' +
      'Then stop and run `npm start` again.'
  );
}

/**
 * SPA OAuth (Google): PKCE + parse ?code= / hash from redirect so session is stored.
 * Without detectSessionInUrl / PKCE, INITIAL_SESSION often stays null after choosing an account.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      storage:
        typeof window !== 'undefined' ? window.localStorage : undefined,
    },
  }
);

if (isDev) {
  console.log('[supabaseClient] createClient OK', {
    urlHost: (() => {
      try {
        return new URL(supabaseUrl).host;
      } catch {
        return '(invalid URL)';
      }
    })(),
  });
}

export type TypedSupabaseClient = typeof supabase;
