import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const [statsRes, trendsRes, recentRes, authStatsRes, authTrendsRes] = await Promise.all([
      supabase.rpc('get_dashboard_stats'),
      supabase.rpc('get_daily_trends', { days_back: 14 }),
      supabase.rpc('get_recent_signups', { limit_count: 50 }),
      supabase.rpc('get_auth_user_stats'),
      supabase.rpc('get_auth_daily_trends', { days_back: 14 }),
    ])

    const stats = statsRes.data?.[0] || {
      total_waitlist: 0, total_visits: 0, total_clicks: 0,
      today_waitlist: 0, today_visits: 0, today_clicks: 0, conversion_rate: 0,
    }

    const authStats = authStatsRes.data || { total_users: 0, today_users: 0, week_users: 0 }

    // Merge auth daily trends with existing trends
    const authTrends = authTrendsRes.data || []
    const trends = (trendsRes.data || []).map((t: { tdate: string }) => {
      const authMatch = authTrends.find((a: { tdate: string }) => a.tdate === t.tdate)
      return { ...t, tauth_signups: authMatch?.tauth_signups || 0 }
    })

    return NextResponse.json({
      stats,
      auth_stats: authStats,
      trends,
      recent_signups: recentRes.data || [],
    })
  } catch {
    return NextResponse.json({
      stats: {
        total_waitlist: 0, total_visits: 0, total_clicks: 0,
        today_waitlist: 0, today_visits: 0, today_clicks: 0, conversion_rate: 0,
      },
      auth_stats: { total_users: 0, today_users: 0, week_users: 0 },
      trends: [],
      recent_signups: [],
    })
  }
}
