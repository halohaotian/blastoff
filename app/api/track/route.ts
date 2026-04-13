import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { type, path, referrer, cta_name, section } = await req.json()

    if (type === 'pageview') {
      await supabase.from('page_views').insert({
        path: path || '/',
        referrer: referrer || null,
        user_agent: req.headers.get('user-agent') || null,
      })
    } else if (type === 'cta') {
      await supabase.from('cta_clicks').insert({
        cta_name: cta_name || 'unknown',
        page_section: section || null,
      })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Silent fail for analytics
  }
}
