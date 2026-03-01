/**
 * Evolution API Client
 * REST client for connecting to WhatsApp via Evolution API (Baileys)
 * Docs: https://doc.evolution-api.com/
 */

// ============================================================
// TYPES
// ============================================================

export interface EvolutionInstance {
  instanceName: string
  instanceId?: string
  status?: string
  state?: string
}

export interface EvolutionQRCode {
  pairingCode?: string
  code?: string
  base64?: string
  count?: number
}

export interface EvolutionConnectionState {
  instance: {
    instanceName: string
    state: 'open' | 'close' | 'connecting'
  }
}

export interface EvolutionMessageResponse {
  key: {
    remoteJid: string
    fromMe: boolean
    id: string
  }
  message: Record<string, unknown>
  messageTimestamp: number
  status: string
}

export interface EvolutionError {
  status: number
  error: string
  message: string | string[]
}

// ============================================================
// CLIENT
// ============================================================

export class EvolutionAPI {
  private baseUrl: string
  private apiKey: string

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = (baseUrl ?? process.env.EVOLUTION_API_URL ?? '').replace(/\/+$/, '')
    this.apiKey = apiKey ?? process.env.EVOLUTION_API_KEY ?? ''
  }

  /**
   * Check if the Evolution API is configured (URL + key present)
   */
  isConfigured(): boolean {
    return Boolean(this.baseUrl) && Boolean(this.apiKey)
  }

  /**
   * Internal fetch wrapper with apikey header
   */
  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error(
        'Evolution API not configured. Set EVOLUTION_API_URL and EVOLUTION_API_KEY environment variables.'
      )
    }

    const url = `${this.baseUrl}${path}`

    const headers: Record<string, string> = {
      apikey: this.apiKey,
      'Content-Type': 'application/json',
      'bypass-tunnel-reminder': 'true',
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      let errorBody: EvolutionError | string
      try {
        errorBody = await response.json() as EvolutionError
      } catch {
        errorBody = await response.text()
      }

      // Extract message - v1 uses response.message, v2 uses top-level message
      let message = `HTTP ${response.status}`
      if (typeof errorBody === 'string') {
        message = errorBody
      } else if (typeof errorBody === 'object' && errorBody !== null) {
        // Try top-level message (v2) then nested response.message (v1)
        const raw = errorBody.message
          ?? (errorBody as { response?: { message?: unknown } }).response?.message
        if (raw) {
          message = typeof raw === 'string'
            ? raw
            : Array.isArray(raw)
              ? raw.map(r => typeof r === 'object' ? JSON.stringify(r) : String(r)).join(', ')
              : JSON.stringify(raw)
        }
      }

      throw new Error(`Evolution API error (${response.status}): ${message}`)
    }

    // Some DELETE endpoints return empty body
    const text = await response.text()
    if (!text) return {} as T

    return JSON.parse(text) as T
  }

  // ============================================================
  // INSTANCE MANAGEMENT
  // ============================================================

  /**
   * Create a new WhatsApp instance.
   * When `phone` is provided, returns a pairing code instead of (or alongside) a QR code.
   * POST /instance/create
   */
  async createInstance(
    instanceName: string,
    phone?: string
  ): Promise<EvolutionInstance & { qrcode?: EvolutionQRCode }> {
    const body: Record<string, unknown> = {
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    }

    if (phone) {
      body.number = phone
    }

    return this.request('POST', '/instance/create', body)
  }

  /**
   * Get instance connection state
   * GET /instance/connectionState/{instanceName}
   */
  async getInstanceStatus(instanceName: string): Promise<EvolutionConnectionState> {
    return this.request('GET', `/instance/connectionState/${encodeURIComponent(instanceName)}`)
  }

  /**
   * Get QR code for connecting (base64)
   * GET /instance/connect/{instanceName}
   */
  async getQRCode(instanceName: string): Promise<EvolutionQRCode> {
    return this.request('GET', `/instance/connect/${encodeURIComponent(instanceName)}`)
  }

  // ============================================================
  // MESSAGING
  // ============================================================

  /**
   * Send a text message
   * POST /message/sendText/{instanceName}
   */
  async sendText(
    instanceName: string,
    phone: string,
    message: string
  ): Promise<EvolutionMessageResponse> {
    return this.request('POST', `/message/sendText/${encodeURIComponent(instanceName)}`, {
      number: normalizeBrazilPhone(phone),
      text: message,
    })
  }

  /**
   * Send media (image, video, audio, document)
   * POST /message/sendMedia/{instanceName}
   */
  async sendMedia(
    instanceName: string,
    phone: string,
    mediaUrl: string,
    caption?: string,
    mediatype: 'image' | 'video' | 'audio' | 'document' = 'image'
  ): Promise<EvolutionMessageResponse> {
    return this.request('POST', `/message/sendMedia/${encodeURIComponent(instanceName)}`, {
      number: normalizeBrazilPhone(phone),
      mediatype,
      media: mediaUrl,
      caption: caption ?? '',
    })
  }

  // ============================================================
  // MEDIA
  // ============================================================

  /**
   * Fetch media (image/video/audio/document) as base64 from a received message.
   * POST /chat/getBase64FromMediaMessage/{instanceName}
   *
   * The WhatsApp CDN URLs are encrypted; this endpoint decodes the media
   * using the keys from the original message payload.
   */
  async getMediaBase64(
    instanceName: string,
    messageKey: { remoteJid: string; fromMe: boolean; id: string },
    message: Record<string, unknown>
  ): Promise<{ base64: string; mimeType: string } | null> {
    try {
      const result = await this.request<{ base64: string }>(
        'POST',
        `/chat/getBase64FromMediaMessage/${encodeURIComponent(instanceName)}`,
        {
          message: {
            key: messageKey,
            message,
          },
        }
      )

      if (!result.base64) return null

      // base64 may come as "data:image/jpeg;base64,/9j/..." or raw base64
      let base64Data = result.base64
      let mimeType = 'image/jpeg'

      const dataUriMatch = base64Data.match(/^data:([^;]+);base64,(.+)$/)
      if (dataUriMatch) {
        mimeType = dataUriMatch[1]
        base64Data = dataUriMatch[2]
      } else {
        // Infer mime type from the message object
        if (message.videoMessage) mimeType = 'video/mp4'
        else if (message.audioMessage) mimeType = 'audio/ogg'
        else if (message.documentMessage) mimeType = 'application/octet-stream'
      }

      return { base64: base64Data, mimeType }
    } catch (error) {
      console.error('[EvolutionAPI] Failed to fetch media base64:', error)
      return null
    }
  }

  // ============================================================
  // LIFECYCLE
  // ============================================================

  /**
   * Logout (disconnect WhatsApp session but keep instance)
   * DELETE /instance/logout/{instanceName}
   */
  async logout(instanceName: string): Promise<void> {
    await this.request('DELETE', `/instance/logout/${encodeURIComponent(instanceName)}`)
  }

  /**
   * Delete instance entirely
   * DELETE /instance/delete/{instanceName}
   */
  async deleteInstance(instanceName: string): Promise<void> {
    await this.request('DELETE', `/instance/delete/${encodeURIComponent(instanceName)}`)
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Normalize a Brazilian phone number to include country code 55.
 * Handles: 11999999999 → 5511999999999, 5511999999999 → 5511999999999
 */
export function normalizeBrazilPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  // Already has country code (55 + DDD 2 digits + number 8-9 digits = 12-13 digits)
  if (digits.startsWith('55') && digits.length >= 12) return digits
  // Has DDD + number (10-11 digits) — add 55
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  return digits
}

// ============================================================
// SINGLETON
// ============================================================

const globalForEvolution = globalThis as unknown as { evolutionApi: EvolutionAPI }

export const evolutionApi = globalForEvolution.evolutionApi || new EvolutionAPI()

if (process.env.NODE_ENV !== 'production') globalForEvolution.evolutionApi = evolutionApi
