import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('channel_accounts')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // For Discord: channel_type='discord', auth_data={"webhook_url":"..."}
  // For Reddit: channel_type='reddit', auth_data={"access_token":"...","refresh_token":"..."}
  // For Twitter: channel_type='twitter', auth_data={"api_key":"...","api_secret":"...","access_token":"...","access_secret":"..."}
  const { data, error } = await supabase
    .from('channel_accounts')
    .insert(body)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase
    .from('channel_accounts')
    .update({ status: 'deleted' })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
