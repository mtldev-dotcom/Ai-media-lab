/**
 * Base Provider Interface
 * All AI providers must implement this interface
 */

export type GenerationType = 'text' | 'image' | 'video' | 'audio'

export interface GenerationRequest {
  type: GenerationType
  model: string
  prompt: string
  parameters?: Record<string, any>
}

export interface GenerationResponse {
  success: boolean
  result?: {
    content: string // Text, image URL, video URL, audio URL
    metadata?: Record<string, any>
  }
  error?: string
  tokens?: {
    input: number
    output: number
  }
  duration_ms?: number
}

export interface HealthCheckResponse {
  healthy: boolean
  lastChecked: string
  error?: string
  responseTime_ms?: number
}

export interface CostEstimate {
  amount_cents: number
  breakdown?: {
    [key: string]: number
  }
}

/**
 * Abstract Base Provider Class
 * All provider implementations must extend this class
 */
export abstract class BaseProvider {
  protected apiKey: string
  protected name: string
  protected supportedTypes: GenerationType[] = []

  constructor(name: string, apiKey: string) {
    this.name = name
    this.apiKey = apiKey
  }

  /**
   * Get provider name
   */
  getName(): string {
    return this.name
  }

  /**
   * Check if provider supports a generation type
   */
  supports(type: GenerationType): boolean {
    return this.supportedTypes.includes(type)
  }

  /**
   * Get supported generation types
   */
  getSupportedTypes(): GenerationType[] {
    return this.supportedTypes
  }

  /**
   * Generate content (text, image, video, or audio)
   */
  abstract generate(request: GenerationRequest): Promise<GenerationResponse>

  /**
   * Test if API key is valid
   */
  abstract healthCheck(): Promise<HealthCheckResponse>

  /**
   * Estimate cost before generation
   */
  abstract estimateCost(request: GenerationRequest): Promise<CostEstimate>

  /**
   * Get model list for this provider
   */
  abstract getAvailableModels(): Promise<string[]>

  /**
   * Validate API key format
   */
  abstract validateApiKey(): Promise<boolean>
}
