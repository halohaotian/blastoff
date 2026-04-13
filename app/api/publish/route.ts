import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

// Reddit publisher (stub - needs OAuth)
async function publishToReddit(authData: Record<string, string>, content: Record<string, unknown>) {
  // Full implementation requires Reddit OAuth flow
  // For now return a placeholder
  return { id: `reddit-stub-${Date.now()}`, note: 'Reddit OAuth integration pending' }
}

// Twitter/X publisher (stub - needs API keys)
async function publishToTwitter(authData: Record<string, string>, content: Record<string, unknown>) {
  return { id: `twitter-stub-${Date.now()}`, note: 'Twitter API integration pending' }
}

export async function POST(req: NextRequest) {
  try {
    const { taskId, channelType, authData, content } = await req.json()

    let result: { id?: string; note?: string }

    switch (channelType) {
      case 'discord':
        result = await publishToDiscord(authData.webhook_url, content)
        break
      case 'reddit':
        result = await publishToReddit(authData, content)
        break
      case 'twitter':
        result = await publishToTwitter(authData, content)
        break
      default:
        // For channels without API, mark as "manual" with content ready to copy
        result = { id: `manual-${Date.now()}`, note: 'Copy content manually' }
    }

    // Update publish task
    if (taskId) {
      await supabase
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
    // Mark task as failed
    const { taskId } = await req.json().catch(() => ({}))
    if (taskId) {
      await supabase
        .from('publish_tasks')
        .update({
          status: 'failed',
          error_message: err instanceof Error ? err.message : 'Unknown error',
        })
        .eq('id', taskId)
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Publish failed' }, { status: 500 })
  }
}

// Schedule a post
export async function PUT(req: NextRequest) {
  const { campaignId, channelId, content, scheduledAt } = await req.json()

  const { data, error } = await supabase
    .from('publish_tasks')
    .insert({
      campaign_id: campaignId,
      channel_account_id: channelId,
      content_json: content,
      scheduled_at: scheduledAt,
      status: 'scheduled',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
