import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const [statsRes, trendsRes, recentRes] = await Promise.all([
      supabase.rpc('get_dashboard_stats'),
      supabase.rpc('get_daily_trends', { days_back: 14 }),
      supabase.rpc('get_recent_signups', { limit_count: 50 }),
    ])

    const stats = statsRes.data?.[0] || {
      total_waitlist: 0, total_visits: 0, total_clicks: 0,
      today_waitlist: 0, today_visits: 0, today_clicks: 0, conversion_rate: 0,
    }

    return NextResponse.json({
      stats,
      trends: trendsRes.data || [],
      recent_signups: recentRes.data || [],
    })
  } catch {
    return NextResponse.json({
      stats: {
        total_waitlist: 0, total_visits: 0, total_clicks: 0,
        today_waitlist: 0, today_visits: 0, today_clicks: 0, conversion_rate: 0,
      },
      trends: [],
      recent_signups: [],
    })
  }
}
