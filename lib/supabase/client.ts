import { createBrowserClient } from '@supabase/ssr'

// Dummy values for build time - will be replaced by real values at runtime
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export function createClient() {
    return createBrowserClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    )
}
