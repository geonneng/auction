import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cachedAnonClient: SupabaseClient | null = null
let cachedAdminClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (cachedAnonClient) return cachedAnonClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  cachedAnonClient = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 50  // 초당 이벤트 수 증가 (10 → 50)
      }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
  
  console.log('[Supabase] Anon client created with enhanced realtime config')
  return cachedAnonClient
}

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdminClient) return cachedAdminClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('[Supabase Admin] Initializing with:', {
    hasUrl: !!supabaseUrl,
    hasServiceRole: !!serviceRole,
    url: supabaseUrl?.substring(0, 30) + '...',
    isProduction: process.env.NODE_ENV === 'production'
  })

  if (!supabaseUrl || !serviceRole) {
    console.error('[Supabase Admin] Missing environment variables:', {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })
    throw new Error('Supabase env missing: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  }

  cachedAdminClient = createClient(supabaseUrl, serviceRole, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      headers: {
        'x-application-name': 'dashima-auction'
      }
    }
  })
  
  console.log('[Supabase Admin] Client created successfully')
  return cachedAdminClient
}
