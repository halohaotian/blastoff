import { NextRequest, NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const { supabase, error } = await getAuthedClient(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const campaignId = searchParams.get('campaign_id')

  let query = supabase!
    .from('publish_tasks')
    .select('*, channel_accounts!inner(channel_type, account_name), campaigns!inner(name, products!inner(name))')
    .order('created_at', { ascending: false })

  if (campaignId) {
    query = query.eq('campaign_id', campaignId)
  }

  const { data, error: dbError } = await query.limit(50)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

// Retry a failed task
export async function POST(req: NextRequest) {
  const { supabase, error } = await getAuthedClient(req)
  if (error) return error

  const { taskId } = await req.json()
  if (!taskId) return NextResponse.json({ error: 'taskId required' }, { status: 400 })

  const { data, error: dbError } = await supabase!
    .from('publish_tasks')
    .update({ status: 'scheduled', scheduled_at: new Date().toISOString(), error_message: null })
    .eq('id', taskId)
    .select()
    .single()

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
