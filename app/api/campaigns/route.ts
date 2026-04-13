import { NextRequest, NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const { supabase, error } = await getAuthedClient(req)
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('campaigns')
    .select('*, products(name, tagline, website_url), publish_tasks(*)')
    .order('updated_at', { ascending: false })
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { supabase, userId, error } = await getAuthedClient(req)
  if (error) return error

  const body = await req.json()
  const { data, error: dbError } = await supabase!
    .from('campaigns')
    .insert({ ...body, user_id: userId })
    .select()
    .single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const { supabase, error } = await getAuthedClient(req)
  if (error) return error

  const body = await req.json()
  const { id, ...updates } = body
  updates.updated_at = new Date().toISOString()
  const { data, error: dbError } = await supabase!
    .from('campaigns')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}
