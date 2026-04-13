import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const CHANNEL_PROMPTS: Record<string, string> = {
  discord: `Generate a Discord community announcement post. Be casual, friendly, use emoji sparingly.
Format: Rich Embed style with a bold title, short description, bullet points for key features, and a CTA link.
Keep it under 500 characters. Include relevant emojis.`,

  reddit: `Generate a Reddit post for r/SideProject or r/IndieHackers. Follow these rules:
- Title should be honest and specific, NOT clickbait (e.g., "I built X to solve Y problem")
- Body should share the journey/challenge, not just promote
- Mention it's your own project (transparency is valued)
- Ask for feedback at the end
- No excessive emoji or marketing speak
- Keep title under 100 chars, body under 2000 chars`,

  twitter: `Generate a tweet (max 280 characters). Rules:
- Hook in the first line
- Key value prop in the middle
- CTA + hashtags at the end
- Use 2-3 relevant hashtags like #buildinpublic #indiehacker #saas
- Be conversational, not salesy`,

  producthunt: `Generate a Product Hunt listing with:
1. Tagline (under 60 chars) - concise, benefit-focused
2. Description (under 500 chars) - what it does, why it's different
3. First comment (the "maker comment") - share your story, why you built it, ask for feedback (under 1000 chars)
Be authentic and specific.`,

  hackernews: `Generate a "Show HN" post for Hacker News.
- Title format: "Show HN: Product Name – One-line description"
- Comment body should be technical, explain the how and why
- Be humble, mention what's novel, link to GitHub if open source
- No marketing speak, no emoji. Technical audience.`,

  linkedin: `Generate a LinkedIn professional post.
- Start with a hook question or bold statement
- Share the problem → solution story
- Include 3-5 key benefits as bullet points
- End with a clear CTA
- Use professional tone with personality
- Under 1500 characters`,

  facebook: `Generate a Facebook Page post.
- Engaging first line to stop scrolling
- Clear value proposition
- 2-3 key features with emoji
- CTA to visit website
- Under 500 characters`,

  youtube: `Generate YouTube video metadata:
1. Title (SEO-optimized, under 100 chars)
2. Description (under 5000 chars, include timestamps, links, keywords)
3. Tags (comma-separated, 15-20 tags)
Focus on discoverability and clear value proposition.`,

  tiktok: `Generate a TikTok video description.
- Short, punchy caption under 150 chars
- 3-5 trending hashtags
- A hook question or bold claim
- Keep it Gen-Z friendly and fun`,

  indiehackers: `Generate an Indie Hackers post.
- Share revenue numbers or user metrics if possible
- Be transparent about challenges
- Include lessons learned
- Ask the community for advice on next steps
- Under 1500 characters`,

  betalist: `Generate a BetaList submission:
1. Name and tagline (under 60 chars)
2. Description (under 300 chars, focus on what's new/different)
3. Categories (2-3 relevant tags)
Be concise and highlight what makes this product unique.`,

  alternativeto: `Generate an AlternativeTo listing:
1. Description (under 500 chars, mention what tools it's an alternative to)
2. Key features (5 bullet points)
3. Tags (comma-separated)
Position as a better/different alternative to existing tools.`,
}

export async function POST(req: NextRequest) {
  try {
    const { product, channels, campaignId } = await req.json()

    if (!product || !channels || !Array.isArray(channels)) {
      return NextResponse.json({ error: 'product and channels[] required' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const results: Record<string, string> = {}

    for (const channel of channels) {
      const channelPrompt = CHANNEL_PROMPTS[channel]
      if (!channelPrompt) {
        results[channel] = `[Error: Unknown channel "${channel}"]`
        continue
      }

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an expert product marketing copywriter who understands each platform's unique culture and audience. You generate authentic, non-spammy content that fits naturally into each community.`,
              },
              {
                role: 'user',
                content: `Product information:
- Name: ${product.name}
- Tagline: ${product.tagline || 'N/A'}
- Description: ${product.description}
- Website: ${product.website_url || 'N/A'}
- Pricing: ${product.pricing_model || 'N/A'}
- Categories: ${product.categories?.join(', ') || 'N/A'}
- Tags: ${product.tags?.join(', ') || 'N/A'}

${channelPrompt}

Generate the content now. Output ONLY the content, no preamble.`,
              },
            ],
            temperature: 0.8,
            max_tokens: 1000,
          }),
        })

        const data = await response.json()
        if (data.choices?.[0]?.message?.content) {
          results[channel] = data.choices[0].message.content.trim()
        } else {
          results[channel] = `[Error: ${data.error?.message || 'Unknown AI error'}]`
        }
      } catch (err) {
        results[channel] = `[Error: ${err instanceof Error ? err.message : 'Request failed'}]`
      }
    }

    // Log generation
    if (campaignId) {
      await supabase.from('ai_generations').insert({
        product_id: product.id,
        campaign_id: campaignId,
        generated_content: results,
        model: 'gpt-4o-mini',
      })
    }

    return NextResponse.json(results)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
