import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * Create an authenticated Supabase client from request cookies.
 * Returns null + 401 response if no session found.
 */
export async function getAuthedClient(req: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll() {
          // No-op for API routes — we don't set cookies in JSON responses
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return { supabase: null, userId: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return { supabase, userId: session.user.id, error: null }
}
