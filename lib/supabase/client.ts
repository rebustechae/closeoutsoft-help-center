/**
 * lib/supabase/client.ts
 * 
 * Browser-side Supabase client - safe to use in 'use client' components
 * 
 * Uses @supabase/ssr so Auth cookies are shared transparently with
 * Next.js Server components and Route Handlers.
 * 
 * Install: npm install @supabase/supabase-js @supabase/ssr 
 * 
 * .env.local:
 * NEXT_PUBLIC_SUPABASE_URL=
 * NEXT_PUBLIC_SUPABASE_ANON_KEY=
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'

/**
 * Returns a singleton Supabase browser client typed against your schema
 * Call once at the top of a Client Component - the @supabase/ssr package
 * ensures a single instance is reused per page
 */

export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}