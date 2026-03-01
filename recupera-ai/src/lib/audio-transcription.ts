/**
 * Audio Transcription via Groq Whisper API
 * Converts audio/video base64 to text using whisper-large-v3-turbo.
 * Supports: mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg
 * No extra npm packages needed — uses native fetch + FormData.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const WHISPER_MODEL = 'whisper-large-v3-turbo'

const MIME_TO_EXT: Record<string, string> = {
  'audio/ogg': 'ogg',
  'audio/ogg; codecs=opus': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
  'audio/x-m4a': 'm4a',
  'video/mp4': 'mp4',
  'video/3gpp': '3gp',
  'video/webm': 'webm',
}

/**
 * Transcribe audio or video to text using Groq Whisper API.
 * Returns the transcription or null if transcription fails/unavailable.
 */
export async function transcribeAudio(
  base64Data: string,
  mimeType: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    console.warn('[Transcription] GROQ_API_KEY not configured — skipping transcription')
    return null
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64')

    // Groq Whisper has a 25MB limit
    if (buffer.length > 25 * 1024 * 1024) {
      console.warn(`[Transcription] File too large (${Math.round(buffer.length / 1024 / 1024)}MB) — skipping`)
      return null
    }

    const ext = MIME_TO_EXT[mimeType] || 'ogg'
    const blob = new Blob([buffer], { type: mimeType })

    const formData = new FormData()
    formData.append('file', blob, `audio.${ext}`)
    formData.append('model', WHISPER_MODEL)
    formData.append('language', 'pt')
    formData.append('response_format', 'text')

    console.log(`[Transcription] Sending ${ext} (${Math.round(buffer.length / 1024)}KB) to Groq Whisper...`)

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Transcription] Groq API error ${response.status}:`, errorText)
      return null
    }

    const text = await response.text()
    const trimmed = text.trim()

    if (!trimmed) {
      console.log('[Transcription] Empty transcription result')
      return null
    }

    console.log(`[Transcription] Success: "${trimmed.substring(0, 100)}${trimmed.length > 100 ? '...' : ''}"`)
    return trimmed
  } catch (error) {
    console.error('[Transcription] Error:', error)
    return null
  }
}
