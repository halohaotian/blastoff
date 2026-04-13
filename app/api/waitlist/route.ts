import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, name, source, ref } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        name: name || null,
        source: source || 'landing_page',
        referred_by: ref || null,
      })
      .select('position, referrer_code')
      .single()

    if (error) {
      if (error.code === '23505') {
        // Already exists - get their position
        const { data: existing } = await supabase
          .from('waitlist')
          .select('position, referrer_code')
          .eq('email', email.toLowerCase().trim())
          .single()

        return NextResponse.json({
          message: 'Already on the waitlist!',
          position: existing?.position,
          referrer_code: existing?.referrer_code,
          existing: true,
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Track CTA click
    await supabase.from('cta_clicks').insert({
      cta_name: 'waitlist_signup',
      page_section: source || 'hero',
    })

    return NextResponse.json({
      message: 'Welcome aboard!',
      position: data.position,
      referrer_code: data.referrer_code,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase.rpc('get_waitlist_stats')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const stats = data?.[0] || { total_count: 0, today_count: 0 }
    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ total_count: 0, today_count: 0 })
  }
}
