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
  instance: string
  state: 'open' | 'close' | 'connecting'
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

      const message =
        typeof errorBody === 'object' && errorBody.message
          ? Array.isArray(errorBody.message)
            ? errorBody.message.join(', ')
            : errorBody.message
          : typeof errorBody === 'string'
            ? errorBody
            : `HTTP ${response.status}`

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
   * Create a new WhatsApp instance
   * POST /instance/create
   */
  async createInstance(instanceName: string): Promise<EvolutionInstance & { qrcode?: EvolutionQRCode }> {
    return this.request('POST', '/instance/create', {
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    })
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
      number: phone,
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
      number: phone,
      mediatype,
      media: mediaUrl,
      caption: caption ?? '',
    })
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
// SINGLETON
// ============================================================

const globalForEvolution = globalThis as unknown as { evolutionApi: EvolutionAPI }

export const evolutionApi = globalForEvolution.evolutionApi || new EvolutionAPI()

if (process.env.NODE_ENV !== 'production') globalForEvolution.evolutionApi = evolutionApi
