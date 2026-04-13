import { NextRequest, NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const { supabase, error } = await getAuthedClient(req)
  if (error) return error

  const { data, error: dbError } = await supabase!
    .from('products')
    .select('*')
    .order('updated_at', { ascending: false })
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const { supabase, userId, error } = await getAuthedClient(req)
  if (error) return error

  const body = await req.json()
  const { data, error: dbError } = await supabase!
    .from('products')
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
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const { supabase, error } = await getAuthedClient(req)
  if (error) return error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error: dbError } = await supabase!.from('products').delete().eq('id', id)
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
