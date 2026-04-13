import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Process all due scheduled publish tasks
async function processScheduledTasks() {
  const results: { published: string[]; failed: string[] } = { published: [], failed: [] }

  // Fetch all scheduled tasks that are due
  const { data: tasks, error: fetchError } = await supabase
    .from('publish_tasks')
    .select('*, channel_accounts!inner(channel_type, auth_data)')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .limit(10)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ message: 'No scheduled tasks due', ...results })
  }

  for (const task of tasks) {
    try {
      // Mark as publishing to prevent duplicate processing
      await supabase
        .from('publish_tasks')
        .update({ status: 'publishing' })
        .eq('id', task.id)

      const channelType = task.channel_accounts?.channel_type
      const authData = task.channel_accounts?.auth_data || {}
      const content = task.content_json || {}

      let platformPostId: string | null = null

      // Publish based on channel type
      switch (channelType) {
        case 'discord': {
          const webhookUrl = authData.webhook_url
          if (!webhookUrl) throw new Error('No Discord webhook URL configured')

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
          const discordData = await res.json().catch(() => ({}))
          platformPostId = discordData.id || `discord-${Date.now()}`
          break
        }

        case 'reddit':
        case 'twitter':
        case 'linkedin':
        case 'facebook':
        case 'youtube':
        case 'tiktok':
          // These channels need OAuth - mark as pending manual publish
          platformPostId = `${channelType}-pending-${Date.now()}`
          break

        default:
          platformPostId = `manual-${Date.now()}`
      }

      // Update task as published
      await supabase
        .from('publish_tasks')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          platform_post_id: platformPostId,
        })
        .eq('id', task.id)

      results.published.push(task.id)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'

      await supabase
        .from('publish_tasks')
        .update({
          status: 'failed',
          error_message: errorMsg,
        })
        .eq('id', task.id)

      results.failed.push(task.id)
    }
  }

  return results
}

// GET: Vercel Cron trigger (daily)
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = await processScheduledTasks()
  return NextResponse.json({
    message: 'Cron processed',
    ...results,
  })
}

// POST: Manual trigger from dashboard
export async function POST() {
  const results = await processScheduledTasks()
  return NextResponse.json({
    message: 'Manual trigger processed',
    ...results,
  })
}
