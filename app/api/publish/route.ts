import { NextRequest, NextResponse } from 'next/server'
import { getAuthedClient } from '@/lib/api-auth'
import { supabase as anonClient } from '@/lib/supabase'

// Discord Webhook publisher
async function publishToDiscord(webhookUrl: string, content: Record<string, unknown>) {
  const text = typeof content === 'string' ? content : (content.text as string) || (content.body as string) || String(content)

  const embed = {
    title: (content.title as string) || 'New Product Launch',
    description: text.slice(0, 2048),
    color: 0xFF5C3A,
    fields: [],
    footer: { text: 'Powered by Blastoff 🚀' },
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ embeds: [embed] }),
  })

  if (!res.ok) throw new Error(`Discord API error: ${res.status}`)
  return { id: `discord-${Date.now()}` }
}

export async function POST(req: NextRequest) {
  const { supabase, userId, error: authError } = await getAuthedClient(req)
  if (authError) return authError

  try {
    const { taskId, channelType, authData, content, campaignId, channelId } = await req.json()

    let result: { id?: string; note?: string }

    switch (channelType) {
      case 'discord':
        result = await publishToDiscord(authData.webhook_url, content)
        break
      case 'reddit':
      case 'twitter':
        result = { id: `${channelType}-stub-${Date.now()}`, note: `${channelType} OAuth integration pending` }
        break
      default:
        result = { id: `manual-${Date.now()}`, note: 'Copy content manually' }
    }

    // Create publish task record if campaign context provided
    if (campaignId && channelId) {
      await supabase!.from('publish_tasks').insert({
        campaign_id: campaignId,
        channel_account_id: channelId,
        user_id: userId,
        content_json: content,
        status: result.id?.startsWith('manual') ? 'draft' : 'published',
        published_at: result.id?.startsWith('manual') ? null : new Date().toISOString(),
        platform_post_id: result.id || null,
      })
    } else if (taskId) {
      await supabase!
        .from('publish_tasks')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          platform_post_id: result.id || null,
        })
        .eq('id', taskId)
    }

    return NextResponse.json({ success: true, result })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Publish failed' }, { status: 500 })
  }
}

// Schedule a post
export async function PUT(req: NextRequest) {
  const { supabase, userId, error: authError } = await getAuthedClient(req)
  if (authError) return authError

  const { campaignId, channelId, content, scheduledAt } = await req.json()

  const { data, error } = await supabase!
    .from('publish_tasks')
    .insert({
      campaign_id: campaignId,
      channel_account_id: channelId,
      user_id: userId,
      content_json: content,
      scheduled_at: scheduledAt,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
