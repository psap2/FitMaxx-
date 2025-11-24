import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
const supabasePublishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable. Please set it in your .env.local file.');
}

if (!supabasePublishableKey) {
  throw new Error('Missing SUPABASE_PUBLISHABLE_KEY environment variable. Please set it in your .env.local file.');
}

// Server-side Supabase client with secret key (bypasses RLS, for admin operations)
// Secret key is optional - only needed for premium grants
export const supabaseAdmin = supabaseSecretKey 
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Server-side Supabase client with publishable key (respects RLS, for user operations)
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create a user-scoped Supabase client with JWT token for RLS
export function createUserClient(token: string) {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Supabase configuration is missing');
  }
  return createClient(supabaseUrl, supabasePublishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
