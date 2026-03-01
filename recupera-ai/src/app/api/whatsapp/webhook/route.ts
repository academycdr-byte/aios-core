import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processIncomingMessage } from '@/lib/ai/message-processor'
import { normalizeBrazilPhone, evolutionApi } from '@/lib/evolution-api'
import { transcribeAudio } from '@/lib/audio-transcription'
import type { MediaAttachment } from '@/lib/ai/recovery-engine'

export const maxDuration = 60

/**
 * POST /api/whatsapp/webhook
 * Receives incoming messages from Evolution API webhook.
 *
 * Evolution API sends events like:
 * - messages.upsert (new incoming message)
 * - connection.update (connection state changed)
 * - qrcode.updated (QR code refreshed)
 *
 * Configure in Evolution API:
 *   Webhook URL: https://your-domain.com/api/whatsapp/webhook
 *   Events: MESSAGES_UPSERT, CONNECTION_UPDATE
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const event = body.event as string | undefined
    const instance = body.instance as string | undefined
    const data = body.data as Record<string, unknown> | undefined

    if (!event || !instance) {
      return NextResponse.json({ received: true, skipped: 'missing event or instance' })
    }

    console.log(`[WhatsApp Webhook] Event: ${event} | Instance: ${instance}`)

    // Extract storeId from instance name (format: "recupera-{storeId}")
    const storeId = instance.startsWith('recupera-')
      ? instance.substring('recupera-'.length)
      : null

    if (!storeId) {
      console.warn(`[WhatsApp Webhook] Unknown instance format: ${instance}`)
      return NextResponse.json({ received: true, skipped: 'unknown instance format' })
    }

    // Verify store exists
    const store = await prisma.store.findUnique({ where: { id: storeId } })

    if (!store) {
      console.warn(`[WhatsApp Webhook] Store not found: ${storeId}`)
      return NextResponse.json({ received: true, skipped: 'store not found' })
    }

    // ============================================================
    // HANDLE: CONNECTION UPDATE
    // ============================================================
    if (event === 'connection.update') {
      const state = (data as Record<string, unknown>)?.state as string | undefined
      const isConnected = state === 'open'

      await prisma.store.update({
        where: { id: storeId },
        data: { whatsappConnected: isConnected },
      })

      console.log(`[WhatsApp Webhook] Connection update for store ${storeId}: ${state}`)
      return NextResponse.json({ received: true, event: 'connection.update', state })
    }

    // ============================================================
    // HANDLE: INCOMING MESSAGE
    // ============================================================
    if (event === 'messages.upsert') {
      const messageData = data as EvolutionWebhookMessage | undefined

      if (!messageData) {
        return NextResponse.json({ received: true, skipped: 'no message data' })
      }

      // Only process messages FROM the customer (not from us)
      const key = messageData.key
      if (!key || key.fromMe) {
        return NextResponse.json({ received: true, skipped: 'outgoing message' })
      }

      // WhatsApp LID (Linked ID) format: some contacts use @lid instead of @s.whatsapp.net
      // When this happens, the actual phone is in key.remoteJidAlt
      let remoteJid = key.remoteJid ?? ''
      if (remoteJid.endsWith('@lid') && key.remoteJidAlt) {
        console.log(`[WhatsApp Webhook] LID format detected, using remoteJidAlt: ${key.remoteJidAlt}`)
        remoteJid = key.remoteJidAlt
      }

      // IGNORE group messages entirely — only process private chats
      if (remoteJid.endsWith('@g.us') || remoteJid.includes('@broadcast')) {
        return NextResponse.json({ received: true, skipped: 'group or broadcast message' })
      }

      // Extract phone and normalize to consistent format (55DDNNNNNNNNN)
      const rawPhone = remoteJid.replace('@s.whatsapp.net', '')
      const phone = normalizeBrazilPhone(rawPhone)
      const messageContent = extractMessageContent(messageData)
      const whatsappMsgId = key.id ?? null

      if (!phone || !messageContent) {
        return NextResponse.json({ received: true, skipped: 'no phone or content' })
      }

      console.log(`[WhatsApp Webhook] Incoming from ${phone}: ${messageContent.substring(0, 100)}`)

      // ============================================================
      // DEDUP: Skip if this exact message was already processed
      // ============================================================
      if (whatsappMsgId) {
        const existingMsg = await prisma.message.findFirst({
          where: { whatsappMsgId },
        })
        if (existingMsg) {
          console.log(`[WhatsApp Webhook] Duplicate message ${whatsappMsgId} — skipping`)
          return NextResponse.json({ received: true, skipped: 'duplicate message' })
        }
      }

      // ONLY respond if there's an existing ACTIVE conversation for this customer.
      // Conversations are created by: test-message endpoint, recovery cron, or sync.
      // This prevents the AI from responding to random contacts/unknown numbers.
      const conversation = await prisma.conversation.findFirst({
        where: {
          storeId,
          customerPhone: phone,
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!conversation) {
        console.log(`[WhatsApp Webhook] No active conversation for ${phone} — ignoring (not a recovery target)`)
        return NextResponse.json({ received: true, skipped: 'no active conversation' })
      }

      // ============================================================
      // FETCH & PROCESS MEDIA (image, audio, video)
      // - Image: sent to Claude vision for visual analysis
      // - Audio: transcribed via Groq Whisper → text replaces messageContent
      // - Video: audio track transcribed via Whisper → text replaces messageContent
      // ============================================================
      let media: MediaAttachment | null = null
      let messageContentFinal = messageContent
      const msg = messageData.message
      const msgKey = { remoteJid, fromMe: false, id: key.id ?? '' }
      const hasMedia = msg?.imageMessage || msg?.audioMessage || msg?.videoMessage

      if (hasMedia && instance) {
        try {
          const mediaResult = await evolutionApi.getMediaBase64(
            instance,
            msgKey,
            msg as unknown as Record<string, unknown>
          )

          if (mediaResult) {
            // --- IMAGE: send to Claude vision ---
            if (msg?.imageMessage) {
              console.log(`[WhatsApp Webhook] Image fetched (${mediaResult.mimeType}, ${Math.round(mediaResult.base64.length / 1024)}KB)`)
              media = {
                type: 'image',
                base64: mediaResult.base64,
                mimeType: mediaResult.mimeType,
                caption: msg.imageMessage.caption ?? undefined,
              }
            }

            // --- AUDIO: transcribe via Whisper ---
            if (msg?.audioMessage) {
              console.log(`[WhatsApp Webhook] Audio received (${mediaResult.mimeType}, ${Math.round(mediaResult.base64.length / 1024)}KB) — transcribing...`)
              const transcription = await transcribeAudio(mediaResult.base64, mediaResult.mimeType)
              if (transcription) {
                messageContentFinal = `[Audio transcrito] ${transcription}`
                console.log(`[WhatsApp Webhook] Audio transcribed: "${transcription.substring(0, 80)}..."`)
              } else {
                messageContentFinal = '[Audio recebido - nao foi possivel transcrever]'
              }
            }

            // --- VIDEO: transcribe audio track via Whisper ---
            if (msg?.videoMessage) {
              console.log(`[WhatsApp Webhook] Video received (${mediaResult.mimeType}, ${Math.round(mediaResult.base64.length / 1024)}KB) — transcribing audio...`)
              const transcription = await transcribeAudio(mediaResult.base64, mediaResult.mimeType)
              const caption = msg.videoMessage.caption
              if (transcription) {
                messageContentFinal = caption
                  ? `[Video] ${caption}\n[Audio do video transcrito] ${transcription}`
                  : `[Video - audio transcrito] ${transcription}`
                console.log(`[WhatsApp Webhook] Video audio transcribed: "${transcription.substring(0, 80)}..."`)
              } else if (caption) {
                messageContentFinal = `[Video] ${caption}`
              } else {
                messageContentFinal = '[Video recebido - sem audio identificavel]'
              }
            }
          }
        } catch (err) {
          console.error('[WhatsApp Webhook] Failed to fetch/process media:', err)
        }
      }

      // Save the incoming message (with transcription if audio/video)
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'CUSTOMER',
          content: messageContentFinal,
          whatsappMsgId,
          messageStatus: 'DELIVERED',
        },
      })

      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastMessageAt: new Date() },
      })

      console.log(`[WhatsApp Webhook] Saved message in conversation ${conversation.id}`)

      // ============================================================
      // ANTI-SPAM: Only respond if AI isn't already "waiting" for a reply.
      // Check the 2 most recent messages: if the one BEFORE our new message
      // is also from CUSTOMER, it means the AI hasn't responded yet —
      // skip to avoid sending multiple AI messages without customer reply.
      // ============================================================
      const recentMsgs = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { sentAt: 'desc' },
        take: 2,
        select: { role: true },
      })
      const previousMsg = recentMsgs[1] // [0] = message we just saved, [1] = previous
      if (previousMsg && previousMsg.role === 'CUSTOMER') {
        console.log(`[WhatsApp Webhook] Previous message was also from customer — AI still processing, skipping to avoid spam`)
        return NextResponse.json({
          received: true,
          event: 'messages.upsert',
          conversationId: conversation.id,
          skipped: 'ai response pending',
        })
      }

      // Process AI response with optional media for vision
      try {
        const result = await processIncomingMessage(conversation.id, messageContentFinal, media)
        console.log(
          `[WhatsApp Webhook] AI response for ${conversation.id}: action=${result.action}, intent=${result.intent}, tokens=${result.tokensUsed}${media ? ' (with vision)' : ''}`
        )
      } catch (err) {
        console.error(`[WhatsApp Webhook] AI processing error for ${conversation.id}:`, err)
      }

      return NextResponse.json({
        received: true,
        event: 'messages.upsert',
        conversationId: conversation.id,
        hasMedia: !!media,
      })
    }

    // ============================================================
    // OTHER EVENTS (qrcode.updated, etc.) - just acknowledge
    // ============================================================
    console.log(`[WhatsApp Webhook] Unhandled event: ${event}`)
    return NextResponse.json({ received: true, event })
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error)
    // Return 200 to prevent Evolution API from retrying
    return NextResponse.json({ received: true, error: true }, { status: 200 })
  }
}

// ============================================================
// HELPERS
// ============================================================

interface EvolutionWebhookMessage {
  key: {
    remoteJid?: string
    remoteJidAlt?: string
    fromMe?: boolean
    id?: string
  }
  pushName?: string
  message?: {
    conversation?: string
    extendedTextMessage?: {
      text?: string
    }
    imageMessage?: {
      caption?: string
      url?: string
    }
    videoMessage?: {
      caption?: string
      url?: string
    }
    audioMessage?: {
      url?: string
    }
    documentMessage?: {
      caption?: string
      fileName?: string
    }
  }
  messageTimestamp?: number
}

function extractMessageContent(data: EvolutionWebhookMessage): string | null {
  const msg = data.message
  if (!msg) return null

  // Text message
  if (msg.conversation) return msg.conversation
  if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text

  // Media with caption
  if (msg.imageMessage?.caption) return `[Imagem] ${msg.imageMessage.caption}`
  if (msg.videoMessage?.caption) return `[Video] ${msg.videoMessage.caption}`
  if (msg.documentMessage?.caption) return `[Documento] ${msg.documentMessage.caption}`

  // Media without caption
  if (msg.imageMessage) return '[Imagem recebida]'
  if (msg.videoMessage) return '[Video recebido]'
  if (msg.audioMessage) return '[Audio recebido]'
  if (msg.documentMessage) return `[Documento: ${msg.documentMessage.fileName ?? 'arquivo'}]`

  return null
}
